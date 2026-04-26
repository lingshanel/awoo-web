import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { CreateThreadDto } from './dto/create-thread.dto';
import { DeleteThreadDto } from './dto/delete-thread.dto';
import { ThreadParamDto } from './dto/thread-param.dto';
import { ThreadsService } from './threads.service';
import { UpdateThreadDto } from './dto/update-thread.dto';

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

  @Patch(':id')
  updateThread(@Param() params: ThreadParamDto, @Body() dto: UpdateThreadDto) {
    return this.threadsService.updateThread(params.id, dto);
  }

  @Delete(':id')
  deleteThread(@Param() params: ThreadParamDto, @Body() dto: DeleteThreadDto) {
    return this.threadsService.deleteThread(params.id, dto);
  }
}
