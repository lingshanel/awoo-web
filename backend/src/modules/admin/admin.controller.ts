import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminKeyGuard } from 'src/common/security/admin-key.guard';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';

@UseGuards(AdminKeyGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Post('threads/:id/hide')
  hideThread(@Param() params: ThreadParamDto, @Body('reason') reason?: string) {
    return this.adminService.hideThread(params.id, reason);
  }

  @Post('posts/:id/hide')
  hidePost(@Param() params: ThreadParamDto, @Body('reason') reason?: string) {
    return this.adminService.hidePost(params.id, reason);
  }

  @Post('reports/:id/resolve')
  resolveReport(
    @Param() params: ThreadParamDto,
    @Body('hideTarget') hideTarget?: boolean,
  ) {
    return this.adminService.resolveReport(params.id, hideTarget ?? false);
  }
}
