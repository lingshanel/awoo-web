import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ThreadPostsQueryDto } from './dto/thread-posts-query.dto';
import { PostsService } from './posts.service';

@Controller('threads/:id/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getPosts(
    @Param() params: ThreadParamDto,
    @Query() query: ThreadPostsQueryDto,
  ) {
    return this.postsService.getPosts(params.id, query);
  }

  @Post()
  createPost(
    @Param() params: ThreadParamDto,
    @Body() dto: CreatePostDto,
    @Req() request: Request,
  ) {
    return this.postsService.createPost(params.id, dto, getRequestMeta(request));
  }
}
