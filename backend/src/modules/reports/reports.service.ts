import { Injectable } from '@nestjs/common';
import { AdminActionType, ReportStatus, ReportTargetType } from '@prisma/client';
import { RequestMeta } from 'src/common/request/request-meta';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
  ) {}

  async createReport(
    targetType: 'thread' | 'post',
    targetId: number,
    reason: string,
    meta: RequestMeta,
  ) {
    this.antiSpamService.enforceCooldown(
      `report:${meta.actorHash}:${targetType}:${targetId}`,
      30_000,
    );

    const report = await this.prisma.report.create({
      data: {
        targetType:
          targetType === 'thread' ? ReportTargetType.THREAD : ReportTargetType.POST,
        targetId,
        threadId: targetType === 'thread' ? targetId : null,
        postId: targetType === 'post' ? targetId : null,
        reason,
        reporterIpHash: meta.actorHash,
      },
    });

    await this.autoHideIfNeeded(targetType, targetId);

    return report;
  }

  private async autoHideIfNeeded(targetType: 'thread' | 'post', targetId: number) {
    const threshold = Number(process.env.REPORT_AUTO_HIDE_THRESHOLD ?? 5);
    const reportTargetType = targetType === 'thread' ? ReportTargetType.THREAD : ReportTargetType.POST;
    const pendingCount = await this.prisma.report.count({
      where: {
        targetType: reportTargetType,
        targetId,
        status: ReportStatus.PENDING,
      },
    });

    if (pendingCount < threshold) {
      return;
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
        reason: `신고 ${pendingCount}건 누적 자동 숨김`,
      },
    });
  }
}
