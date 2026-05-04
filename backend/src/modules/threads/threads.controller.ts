import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { CreateThreadDto } from './dto/create-thread.dto';
import { DeleteThreadDto } from './dto/delete-thread.dto';
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
  getThread(@Param('id', ParseIntPipe) id: number) {
    return this.threadsService.getThread(id);
  }

  @Post(':id/view')
  registerView(@Param('id', ParseIntPipe) id: number) {
    return this.threadsService.registerView(id);
  }

  @Patch(':id')
  updateThread(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThreadDto,
    @Req() request: Request,
  ) {
    return this.threadsService.updateThread(id, dto, getRequestMeta(request));
  }

  @Delete(':id')
  deleteThread(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteThreadDto,
    @Req() request: Request,
  ) {
    return this.threadsService.deleteThread(id, dto, getRequestMeta(request));
  }
}
