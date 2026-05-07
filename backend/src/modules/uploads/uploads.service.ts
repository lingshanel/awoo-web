import { createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import * as sharp from 'sharp';
import { RequestMeta } from 'src/common/request/request-meta';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { getThumbnailDir, getUploadDir } from 'src/common/uploads/upload-path';
import { PrismaService } from 'src/prisma/prisma.service';

function getUploadDeleteSecret() {
  const secret = process.env.UPLOAD_DELETE_SECRET;

  if (!secret || secret.length < 32 || secret === 'replace-with-a-different-long-random-secret') {
    throw new ServiceUnavailableException(
      '이미지 업로드 보안 설정을 확인하는 중입니다. 잠시 후 다시 시도해 주세요.',
    );
  }

  return secret;
}

function getUploadBaseUrl() {
  const baseUrl = process.env.UPLOAD_BASE_URL;

  if (baseUrl) {
    return baseUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('UPLOAD_BASE_URL must be set in production.');
  }

  return 'http://localhost:4000/uploads';
}

type StoredImage = {
  url: string;
  path: string;
};

type ImageBuffer = {
  data: Buffer;
  contentType: string;
};

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
  ) {}

  async createUploads(files: Express.Multer.File[], meta: RequestMeta) {
    try {
      this.antiSpamService.enforceCooldown(`upload:${meta.actorHash}`, 30_000, 2);
    } catch (error) {
      throw error;
    }

    const useSupabaseStorage = this.shouldUseSupabaseStorage();
    const baseUrl = useSupabaseStorage ? undefined : getUploadBaseUrl();
    const maxWidth = Number(process.env.UPLOAD_MAX_WIDTH ?? 1600);
    const thumbSize = Number(process.env.UPLOAD_THUMB_SIZE ?? 320);

    const uploads = await Promise.all(
      files.map(async (file) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const webpFileName = `${unique}.webp`;
        const thumbFileName = `thumb-${unique}.jpg`;
        const webpPath = join(getUploadDir(), webpFileName);
        const thumbPath = join(getThumbnailDir(), thumbFileName);
        const webpStoragePath = `images/${webpFileName}`;
        const thumbStoragePath = `thumbs/${thumbFileName}`;
        let storedOriginal: StoredImage | undefined;
        let storedThumb: StoredImage | undefined;

        try {
          const optimized = await sharp(file.buffer)
            .rotate()
            .resize({
              width: maxWidth,
              height: maxWidth,
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({
              quality: 84,
            })
            .toBuffer({ resolveWithObject: true });

          const thumbBuffer = await sharp(optimized.data)
            .resize({
              width: thumbSize,
              height: thumbSize,
              fit: 'cover',
              position: 'centre',
            })
            .jpeg({
              quality: 76,
              mozjpeg: true,
            })
            .toBuffer();

          storedOriginal = await this.storeImage(webpStoragePath, {
            data: optimized.data,
            contentType: 'image/webp',
          }, webpPath, baseUrl ? `${baseUrl}/${webpFileName}` : undefined);
          storedThumb = await this.storeImage(thumbStoragePath, {
            data: thumbBuffer,
            contentType: 'image/jpeg',
          }, thumbPath, baseUrl ? `${baseUrl}/thumbs/${thumbFileName}` : undefined);

          const attachment = await this.prisma.attachment.create({
            data: {
              originalName: file.originalname,
              mimeType: 'image/webp',
              size: optimized.info.size,
              width: optimized.info.width,
              height: optimized.info.height,
              storageKey: storedOriginal.url,
              thumbnailKey: storedThumb.url,
            },
          });

          return {
            ...attachment,
            deleteToken: this.createDeleteToken(
              attachment.id,
              attachment.storageKey,
              attachment.thumbnailKey,
            ),
          };
        } catch (error) {
          await this.removeStoredImages([storedOriginal, storedThumb]);
          await Promise.all([unlink(webpPath).catch(() => undefined), unlink(thumbPath).catch(() => undefined)]);
          throw error;
        }
      }),
    );

    return {
      items: uploads,
      total: uploads.length,
    };
  }

  async deleteUpload(id: number, deleteToken?: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment not found: ${id}`);
    }

    if (attachment.threadId || attachment.postId) {
      return {
        id,
        message: '이미 게시물에 연결된 첨부파일은 삭제할 수 없습니다.',
      };
    }

    const expectedToken = this.createDeleteToken(
      attachment.id,
      attachment.storageKey,
      attachment.thumbnailKey,
    );

    if (!deleteToken || !this.safeEqual(deleteToken, expectedToken)) {
      throw new ForbiddenException('Upload delete token is invalid.');
    }

    const originalFileName = attachment.storageKey.split('/').pop();
    const thumbFileName = attachment.thumbnailKey?.split('/').pop();

    await this.prisma.attachment.delete({
      where: { id },
    });

    if (originalFileName) {
      await unlink(join(getUploadDir(), originalFileName)).catch(() => undefined);
    }

    if (thumbFileName) {
      await unlink(join(getThumbnailDir(), thumbFileName)).catch(() => undefined);
    }

    await this.removeStoredImages([
      this.toStoredImage(attachment.storageKey),
      attachment.thumbnailKey ? this.toStoredImage(attachment.thumbnailKey) : undefined,
    ]);

    return {
      id,
      message: 'Attachment deleted.',
    };
  }

  async assertCanAttach(attachmentIds?: number[], deleteTokens?: string[]) {
    if (!attachmentIds?.length) {
      return;
    }

    if (!deleteTokens || deleteTokens.length !== attachmentIds.length) {
      throw new BadRequestException('첨부파일 검증 토큰이 올바르지 않습니다.');
    }

    const attachments = await this.prisma.attachment.findMany({
      where: {
        id: {
          in: attachmentIds,
        },
      },
    });
    const attachmentsById = new Map(attachments.map((attachment) => [attachment.id, attachment]));

    for (const [index, id] of attachmentIds.entries()) {
      const attachment = attachmentsById.get(id);
      const deleteToken = deleteTokens[index];

      if (!attachment || attachment.threadId || attachment.postId) {
        throw new BadRequestException('첨부파일을 연결할 수 없습니다.');
      }

      const expectedToken = this.createDeleteToken(
        attachment.id,
        attachment.storageKey,
        attachment.thumbnailKey,
      );

      if (!deleteToken || !this.safeEqual(deleteToken, expectedToken)) {
        throw new BadRequestException('첨부파일 검증 토큰이 올바르지 않습니다.');
      }
    }
  }

  createDeleteToken(id: number, storageKey: string, thumbnailKey?: string | null) {
    return createHmac('sha256', getUploadDeleteSecret())
      .update(`${id}:${storageKey}:${thumbnailKey ?? ''}`)
      .digest('base64url');
  }

  private shouldUseSupabaseStorage() {
    return Boolean(
      process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_STORAGE_BUCKET,
    );
  }

  private async storeImage(
    storagePath: string,
    image: ImageBuffer,
    localPath: string,
    localUrl?: string,
  ): Promise<StoredImage> {
    if (!this.shouldUseSupabaseStorage()) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          '이미지 저장소 설정을 확인하는 중입니다. 잠시 후 다시 시도해 주세요.',
        );
      }

      await writeFile(localPath, image.data);
      return { url: localUrl ?? storagePath, path: storagePath };
    }

    const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/+$/, '');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET!;
    const objectUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

    let response: Response;

    try {
      response = await fetch(objectUrl, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': image.contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: new Blob([this.toArrayBuffer(image.data)], { type: image.contentType }),
      });
    } catch (error) {
      console.error('Supabase upload request failed', {
        bucket,
        storagePath,
        supabaseUrlHost: new URL(supabaseUrl).host,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ServiceUnavailableException(
        '이미지 업로드 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    if (!response.ok) {
      console.error('Supabase upload failed', {
        status: response.status,
        body: await response.text(),
      });
      throw new ServiceUnavailableException(
        '이미지 업로드 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    return {
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
      path: storagePath,
    };
  }

  private async removeStoredImages(images: Array<StoredImage | undefined>) {
    const paths = images
      .map((image) => image?.path)
      .filter((path): path is string => Boolean(path));

    if (!paths.length || !this.shouldUseSupabaseStorage()) {
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/+$/, '');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

    await fetch(`${supabaseUrl}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: paths }),
    }).catch(() => undefined);
  }

  private toStoredImage(url: string): StoredImage | undefined {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;

    if (!bucket) {
      return undefined;
    }

    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.indexOf(marker);

    if (markerIndex === -1) {
      return undefined;
    }

    return {
      url,
      path: url.slice(markerIndex + marker.length),
    };
  }

  private toArrayBuffer(buffer: Buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}
