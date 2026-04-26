import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { AdminKeyGuard } from 'src/common/security/admin-key.guard';
import { ThreadParamDto } from '../threads/dto/thread-param.dto';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateBanDto } from './dto/create-ban.dto';
import {
  buildAdminCsrfCookie,
  buildAdminSessionCookie,
  buildClearAdminCsrfCookie,
  buildClearAdminSessionCookie,
} from './admin-auth';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(
    @Body() body: AdminLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.adminService.login(body.username, body.password, request);
    response.setHeader('Set-Cookie', [
      buildAdminSessionCookie(result.sessionToken, result.maxAgeSeconds),
      buildAdminCsrfCookie(result.csrfToken, result.maxAgeSeconds),
    ]);

    return {
      user: result.user,
      message: '관리자 로그인이 완료되었습니다.',
    };
  }

  @UseGuards(AdminKeyGuard)
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.adminService.logout(request);
    response.setHeader('Set-Cookie', [
      buildClearAdminSessionCookie(),
      buildClearAdminCsrfCookie(),
    ]);

    return {
      message: '관리자 세션을 종료했습니다.',
    };
  }

  @UseGuards(AdminKeyGuard)
  @Get('me')
  getMe(@Req() request: Request) {
    return this.adminService.getMe(request);
  }

  @UseGuards(AdminKeyGuard)
  @Get('summary')
  getSummary() {
    return this.adminService.getSummary();
  }

  @UseGuards(AdminKeyGuard)
  @Get('logs')
  getLogs() {
    return this.adminService.getLogs();
  }

  @UseGuards(AdminKeyGuard)
  @Get('bans')
  getBans() {
    return this.adminService.getBans();
  }

  @UseGuards(AdminKeyGuard)
  @Post('bans')
  createBan(@Body() body: CreateBanDto, @Req() request: Request) {
    return this.adminService.createBan(body, request);
  }

  @UseGuards(AdminKeyGuard)
  @Post('bans/:id/revoke')
  revokeBan(@Param() params: ThreadParamDto, @Req() request: Request) {
    return this.adminService.revokeBan(params.id, request);
  }

  @UseGuards(AdminKeyGuard)
  @Post('password')
  changePassword(@Body() body: ChangePasswordDto, @Req() request: Request) {
    return this.adminService.changePassword(body.currentPassword, body.newPassword, request);
  }

  @UseGuards(AdminKeyGuard)
  @Get('reports')
  getReports(@Query() query: AdminReportsQueryDto) {
    return this.adminService.getReports(query.status);
  }

  @UseGuards(AdminKeyGuard)
  @Post('threads/:id/hide')
  hideThread(@Param() params: ThreadParamDto, @Body('reason') reason: string | undefined, @Req() request: Request) {
    return this.adminService.hideThread(params.id, reason, request);
  }

  @UseGuards(AdminKeyGuard)
  @Post('posts/:id/hide')
  hidePost(@Param() params: ThreadParamDto, @Body('reason') reason: string | undefined, @Req() request: Request) {
    return this.adminService.hidePost(params.id, reason, request);
  }

  @UseGuards(AdminKeyGuard)
  @Post('reports/:id/resolve')
  resolveReport(
    @Param() params: ThreadParamDto,
    @Body('hideTarget') hideTarget: boolean | undefined,
    @Req() request: Request,
  ) {
    return this.adminService.resolveReport(params.id, hideTarget ?? false, request);
  }
}
