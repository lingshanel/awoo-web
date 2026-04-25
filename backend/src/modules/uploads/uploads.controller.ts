import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ensureUploadDir } from 'src/common/uploads/upload-path';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 4, {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          callback(null, ensureUploadDir());
        },
        filename: (_request, file, callback) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_request, file, callback) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: {
        files: 4,
        fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024,
      },
    }),
  )
  createUploads(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('업로드할 이미지 파일이 필요합니다.');
    }

    return this.uploadsService.createUploads(files);
  }

  @Delete(':id')
  deleteUpload(@Param('id') id: string) {
    return this.uploadsService.deleteUpload(Number(id));
  }
}
