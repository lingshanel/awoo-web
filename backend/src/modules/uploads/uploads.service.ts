import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import * as sharp from 'sharp';
import { getThumbnailDir, getUploadDir } from 'src/common/uploads/upload-path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createUploads(files: Express.Multer.File[]) {
    const baseUrl = process.env.UPLOAD_BASE_URL || 'http://localhost:4000/uploads';
    const maxWidth = Number(process.env.UPLOAD_MAX_WIDTH ?? 1600);
    const thumbSize = Number(process.env.UPLOAD_THUMB_SIZE ?? 320);

    const uploads = await Promise.all(
      files.map(async (file) => {
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

        const webpFileName = `${basename(file.filename, extname(file.filename))}.webp`;
        const webpPath = join(getUploadDir(), webpFileName);
        await sharp(optimized.data).toFile(webpPath);
        await unlink(file.path).catch(() => undefined);

        const thumbFileName = `thumb-${basename(file.filename, extname(file.filename))}.jpg`;
        const thumbPath = join(getThumbnailDir(), thumbFileName);

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

        return this.prisma.attachment.create({
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
      }),
    );

    return {
      items: uploads,
      total: uploads.length,
    };
  }

  async deleteUpload(id: number) {
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
}
