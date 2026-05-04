import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminActionType, AdminBanType, ReportStatus, ReportTargetType } from '@prisma/client';
import { Request } from 'express';
import { getRequestMeta } from 'src/common/request/get-request-meta';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { hashValue } from 'src/common/utils/request-identity';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createSecureToken,
  getAdminSessionCookieName,
  hashToken,
  parseCookie,
  verifyAdminPassword,
  hashAdminPassword,
} from './admin-auth';
import { AdminRequest } from './admin-request';

type ReportStatusFilter = 'all' | 'pending' | 'resolved' | 'reviewed' | 'rejected' | undefined;

const REPORT_STATUS_MAP: Record<Exclude<ReportStatusFilter, 'all' | undefined>, ReportStatus> = {
  pending: ReportStatus.PENDING,
  resolved: ReportStatus.RESOLVED,
  reviewed: ReportStatus.REVIEWED,
  rejected: ReportStatus.REJECTED,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
  ) {}

  private getAdminUser(request: Request) {
    return (request as AdminRequest).adminUser;
  }

  private getIpHash(request: Request) {
    const meta = getRequestMeta(request);
    return hashValue(meta.ip ?? 'unknown');
  }

  private async logAction(
    request: Request | undefined,
    actionType: AdminActionType,
    targetType?: string,
    targetId?: number,
    reason?: string,
  ) {
    const adminUser = request ? this.getAdminUser(request) : undefined;

    await this.prisma.adminActionLog.create({
      data: {
        userId: adminUser?.id,
        actionType,
        targetType,
        targetId,
        reason,
        ipHash: request ? this.getIpHash(request) : undefined,
      },
    });
  }

  private getLoginLockConfig() {
    return {
      maxAttempts: Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS ?? 5),
      lockMinutes: Number(process.env.ADMIN_LOGIN_LOCK_MINUTES ?? 15),
    };
  }

  async login(username: string, password: string, request: Request) {
    const meta = getRequestMeta(request);
    this.antiSpamService.enforceCooldown(`admin-login:${meta.actorHash}`, 60_000, 10);

    const user = await this.prisma.adminUser.findUnique({
      where: { username },
    });
    const now = new Date();

    if (!user || !user.isActive) {
      throw new ForbiddenException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      throw new ForbiddenException('로그인 시도가 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요.');
    }

    if (!verifyAdminPassword(password, user.passwordHash)) {
      const { maxAttempts, lockMinutes } = this.getLoginLockConfig();
      const nextFailedCount = user.failedLoginCount + 1;
      const shouldLock = nextFailedCount >= maxAttempts;

      await this.prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : nextFailedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + lockMinutes * 60 * 1000) : null,
        },
      });

      throw new ForbiddenException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const maxAgeSeconds = Number(process.env.ADMIN_SESSION_TTL_SECONDS ?? 60 * 60 * 8);
    const sessionToken = createSecureToken();
    const csrfToken = createSecureToken();
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    await this.prisma.$transaction([
      this.prisma.adminSession.create({
        data: {
          tokenHash: hashToken(sessionToken),
          csrfTokenHash: hashToken(csrfToken),
          userId: user.id,
          expiresAt,
        },
      }),
      this.prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
      }),
      this.prisma.adminActionLog.create({
        data: {
          userId: user.id,
          actionType: AdminActionType.LOGIN,
          ipHash: this.getIpHash(request),
        },
      }),
    ]);

    return {
      sessionToken,
      csrfToken,
      maxAgeSeconds,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async logout(request: Request) {
    const token = parseCookie(request.headers.cookie, getAdminSessionCookieName());

    if (token) {
      await this.prisma.adminSession.updateMany({
        where: {
          tokenHash: hashToken(token),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    await this.logAction(request, AdminActionType.LOGOUT);
  }

  getMe(request: Request) {
    return {
      user: this.getAdminUser(request),
    };
  }

  async getSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      pendingReports,
      resolvedReports,
      activeThreads,
      hiddenThreads,
      activePosts,
      hiddenPosts,
      todayThreads,
      todayPosts,
      todayReports,
      activeBans,
    ] =
      await this.prisma.$transaction([
        this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
        this.prisma.report.count({ where: { status: ReportStatus.RESOLVED } }),
        this.prisma.thread.count({ where: { isDeleted: false } }),
        this.prisma.thread.count({ where: { isDeleted: true } }),
        this.prisma.post.count({ where: { isDeleted: false } }),
        this.prisma.post.count({ where: { isDeleted: true } }),
        this.prisma.thread.count({ where: { createdAt: { gte: todayStart }, isDeleted: false } }),
        this.prisma.post.count({ where: { createdAt: { gte: todayStart }, isDeleted: false } }),
        this.prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.adminBan.count({
          where: {
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        }),
      ]);

    return {
      pendingReports,
      resolvedReports,
      activeThreads,
      hiddenThreads,
      activePosts,
      hiddenPosts,
      todayThreads,
      todayPosts,
      todayReports,
      activeBans,
    };
  }

  async getLogs() {
    const items = await this.prisma.adminActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  async getBans() {
    const items = await this.prisma.adminBan.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
      take: 100,
    });

    return {
      items,
      total: items.length,
    };
  }

  async createBan(
    dto: { banType: 'AUTHOR_HASH' | 'IP_HASH'; valueHash: string; reason: string; expiresInHours?: number },
    request: Request,
  ) {
    const adminUser = this.getAdminUser(request);
    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000)
      : null;

    const ban = await this.prisma.adminBan.create({
      data: {
        banType: dto.banType === 'AUTHOR_HASH' ? AdminBanType.AUTHOR_HASH : AdminBanType.IP_HASH,
        valueHash: dto.valueHash,
        reason: dto.reason,
        expiresAt,
        createdById: adminUser?.id,
      },
    });

    await this.logAction(request, AdminActionType.CREATE_BAN, dto.banType, ban.id, dto.reason);

    return {
      item: ban,
      message: '차단을 등록했습니다.',
    };
  }

  async revokeBan(id: number, request: Request) {
    const ban = await this.prisma.adminBan.findUnique({ where: { id } });
    if (!ban) {
      throw new NotFoundException(`Ban not found: ${id}`);
    }

    const updated = await this.prisma.adminBan.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await this.logAction(request, AdminActionType.REVOKE_BAN, 'BAN', id);

    return {
      item: updated,
      message: '차단을 해제했습니다.',
    };
  }

  async changePassword(currentPassword: string, newPassword: string, request: Request) {
    const adminUser = this.getAdminUser(request);
    if (!adminUser) {
      throw new ForbiddenException('관리자 로그인이 필요합니다.');
    }

    const user = await this.prisma.adminUser.findUnique({ where: { id: adminUser.id } });
    if (!user || !verifyAdminPassword(currentPassword, user.passwordHash)) {
      throw new ForbiddenException('현재 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hashAdminPassword(newPassword),
      },
    });

    await this.logAction(request, AdminActionType.CHANGE_PASSWORD, 'ADMIN_USER', user.id);
    await this.prisma.adminSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: '비밀번호를 변경했습니다. 다시 로그인해 주세요.',
    };
  }

  async getReports(status: ReportStatusFilter = 'pending') {
    const reportStatus = status && status !== 'all' ? REPORT_STATUS_MAP[status] : undefined;
    const where = reportStatus ? { status: reportStatus } : {};

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          thread: {
            select: {
              id: true,
              title: true,
              content: true,
              authorHash: true,
              authorIpHash: true,
              board: {
                select: {
                  slug: true,
                  name: true,
                },
              },
              isDeleted: true,
              createdAt: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              threadId: true,
              authorHash: true,
              authorIpHash: true,
              isDeleted: true,
              createdAt: true,
              thread: {
                select: {
                  id: true,
                  title: true,
                  board: {
                    select: {
                      slug: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 100,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      items: reports,
      total,
    };
  }

  async hideThread(id: number, reason?: string, request?: Request) {
    const thread = await this.prisma.thread.findUnique({ where: { id } });
    if (!thread) {
      throw new NotFoundException(`Thread not found: ${id}`);
    }

    await this.prisma.thread.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    await this.logAction(request, AdminActionType.HIDE_THREAD, 'THREAD', id, reason);

    return {
      id,
      message: '스레드를 숨김 처리했습니다.',
      reason: reason ?? null,
    };
  }

  async hidePost(id: number, reason?: string, request?: Request) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post not found: ${id}`);
    }

    if (post.isDeleted) {
      return {
        id,
        message: '?대? ?④? 泥섎━???볤??낅땲??',
        reason: reason ?? null,
      };
    }

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      }),
      this.prisma.thread.update({
        where: { id: post.threadId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    await this.logAction(request, AdminActionType.HIDE_POST, 'POST', id, reason);

    return {
      id,
      message: '댓글을 숨김 처리했습니다.',
      reason: reason ?? null,
    };
  }

  async resolveReport(id: number, hideTarget: boolean, request?: Request) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report not found: ${id}`);
    }

    if (hideTarget) {
      if (report.targetType === ReportTargetType.THREAD && report.threadId) {
        await this.hideThread(report.threadId, 'report resolved with hide', request);
      }
      if (report.targetType === ReportTargetType.POST && report.postId) {
        await this.hidePost(report.postId, 'report resolved with hide', request);
      }
    }

    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    await this.logAction(request, AdminActionType.RESOLVE_REPORT, 'REPORT', id);

    return updatedReport;
  }

  async autoHideIfReportThresholdReached(
    targetType: 'thread' | 'post',
    targetId: number,
    threshold = Number(process.env.REPORT_AUTO_HIDE_THRESHOLD ?? 5),
  ) {
    const reportTargetType = targetType === 'thread' ? ReportTargetType.THREAD : ReportTargetType.POST;
    const pendingCount = await this.prisma.report.count({
      where: {
        targetType: reportTargetType,
        targetId,
        status: ReportStatus.PENDING,
      },
    });

    if (pendingCount < threshold) {
      return false;
    }

    if (targetType === 'thread') {
      await this.prisma.thread.updateMany({
        where: { id: targetId, isDeleted: false },
        data: { isDeleted: true },
      });
    } else {
      const post = await this.prisma.post.findUnique({ where: { id: targetId } });
      if (post && !post.isDeleted) {
        await this.prisma.$transaction([
          this.prisma.post.update({
            where: { id: targetId },
            data: { isDeleted: true },
          }),
          this.prisma.thread.update({
            where: { id: post.threadId },
            data: {
              replyCount: {
                decrement: 1,
              },
            },
          }),
        ]);
      }
    }

    await this.prisma.adminActionLog.create({
      data: {
        actionType: AdminActionType.AUTO_HIDE,
        targetType: reportTargetType,
        targetId,
        reason: `신고 ${pendingCount}건 누적으로 자동 숨김`,
      },
    });

    return true;
  }
}
