import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ThreadParamDto } from './dto/thread-param.dto';
import { ThreadsService } from './threads.service';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  createThread(@Body() dto: CreateThreadDto, @Req() request: Request) {
    return this.threadsService.createThread(dto, getRequestMeta(request));
  }

  @Get(':id')
  getThread(@Param() params: ThreadParamDto) {
    return this.threadsService.getThread(params.id);
  }

  @Post(':id/view')
  registerView(@Param() params: ThreadParamDto) {
    return this.threadsService.registerView(params.id);
  }
}
