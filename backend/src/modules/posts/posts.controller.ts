import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { DeletePostDto } from './dto/delete-post.dto';
import { ThreadPostsQueryDto } from './dto/thread-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
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

  @Patch(':postId')
  updatePost(
    @Param('id', ParseIntPipe) threadId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
    @Req() request: Request,
  ) {
    return this.postsService.updatePost(threadId, postId, dto, getRequestMeta(request));
  }

  @Delete(':postId')
  deletePost(
    @Param('id', ParseIntPipe) threadId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: DeletePostDto,
    @Req() request: Request,
  ) {
    return this.postsService.deletePost(threadId, postId, dto, getRequestMeta(request));
  }
}
