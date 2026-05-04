import { createHmac, timingSafeEqual } from 'crypto';
import { BadRequestException, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import * as sharp from 'sharp';
import { RequestMeta } from 'src/common/request/request-meta';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { getThumbnailDir, getUploadDir } from 'src/common/uploads/upload-path';
import { PrismaService } from 'src/prisma/prisma.service';

function getUploadDeleteSecret() {
  const secret = process.env.UPLOAD_DELETE_SECRET;

  if (!secret || secret.length < 32 || secret === 'replace-with-a-different-long-random-secret') {
    throw new Error('UPLOAD_DELETE_SECRET must be set to a unique secret with at least 32 characters.');
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
      await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
      throw error;
    }

    const baseUrl = getUploadBaseUrl();
    const maxWidth = Number(process.env.UPLOAD_MAX_WIDTH ?? 1600);
    const thumbSize = Number(process.env.UPLOAD_THUMB_SIZE ?? 320);

    const uploads = await Promise.all(
      files.map(async (file) => {
        const webpFileName = `${basename(file.filename, extname(file.filename))}.webp`;
        const webpPath = join(getUploadDir(), webpFileName);
        const thumbFileName = `thumb-${basename(file.filename, extname(file.filename))}.jpg`;
        const thumbPath = join(getThumbnailDir(), thumbFileName);

        try {
          const optimized = await sharp(file.path)
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

          await sharp(optimized.data).toFile(webpPath);
          await unlink(file.path).catch(() => undefined);

          await sharp(optimized.data)
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
            .toFile(thumbPath);

          const attachment = await this.prisma.attachment.create({
            data: {
              originalName: file.originalname,
              mimeType: 'image/webp',
              size: optimized.info.size,
              width: optimized.info.width,
              height: optimized.info.height,
              storageKey: `${baseUrl}/${webpFileName}`,
              thumbnailKey: `${baseUrl}/thumbs/${thumbFileName}`,
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
          await Promise.all([
            unlink(file.path).catch(() => undefined),
            unlink(webpPath).catch(() => undefined),
            unlink(thumbPath).catch(() => undefined),
          ]);
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

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}
