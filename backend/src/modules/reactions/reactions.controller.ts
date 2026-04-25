import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { ReactionsService } from './reactions.service';

@Controller()
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('threads/:id/reactions')
  reactThread(
    @Param() params: ThreadParamDto,
    @Body() dto: CreateReactionDto,
    @Req() request: Request,
  ) {
    return this.reactionsService.react(
      'thread',
      params.id,
      dto.reactionType,
      getRequestMeta(request),
    );
  }

  @Post('posts/:id/reactions')
  reactPost(
    @Param() params: ThreadParamDto,
    @Body() dto: CreateReactionDto,
    @Req() request: Request,
  ) {
    return this.reactionsService.react(
      'post',
      params.id,
      dto.reactionType,
      getRequestMeta(request),
    );
  }
}
