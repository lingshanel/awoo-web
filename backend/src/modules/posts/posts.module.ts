import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [UploadsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
