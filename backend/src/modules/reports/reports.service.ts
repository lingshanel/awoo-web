import { Injectable } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
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

    return this.prisma.report.create({
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
  }
}
