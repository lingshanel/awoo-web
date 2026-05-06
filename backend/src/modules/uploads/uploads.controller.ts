import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: memoryStorage(),
      fileFilter: (_request, file, callback) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: {
        files: 4,
        fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024,
      },
    }),
  )
  createUploads(@UploadedFiles() files: Express.Multer.File[], @Req() request: Request) {
    if (!files?.length) {
      throw new BadRequestException('업로드할 이미지 파일이 필요합니다.');
    }

    return this.uploadsService.createUploads(files, getRequestMeta(request));
  }

  @Delete(':id')
  deleteUpload(@Param('id') id: string, @Body('deleteToken') deleteToken: string | undefined) {
    return this.uploadsService.deleteUpload(Number(id), deleteToken);
  }
}
