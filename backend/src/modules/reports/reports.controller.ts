import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('threads/:id/report')
  reportThread(
    @Param() params: ThreadParamDto,
    @Body() dto: CreateReportDto,
    @Req() request: Request,
  ) {
    return this.reportsService.createReport(
      'thread',
      params.id,
      dto.reason,
      getRequestMeta(request),
    );
  }

  @Post('posts/:id/report')
  reportPost(
    @Param() params: ThreadParamDto,
    @Body() dto: CreateReportDto,
    @Req() request: Request,
  ) {
    return this.reportsService.createReport(
      'post',
      params.id,
      dto.reason,
      getRequestMeta(request),
    );
  }
}
