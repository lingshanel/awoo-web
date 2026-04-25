import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getReports() {
    const reports = await this.prisma.report.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        thread: true,
        post: true,
      },
      take: 100,
    });

    return {
      items: reports,
      total: reports.length,
    };
  }

  async hideThread(id: number, reason?: string) {
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

    return {
      id,
      message: 'Thread hidden.',
      reason: reason ?? null,
    };
  }

  async hidePost(id: number, reason?: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post not found: ${id}`);
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

    return {
      id,
      message: 'Post hidden.',
      reason: reason ?? null,
    };
  }

  async resolveReport(id: number, hideTarget: boolean) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report not found: ${id}`);
    }

    if (hideTarget) {
      if (report.targetType === ReportTargetType.THREAD && report.threadId) {
        await this.hideThread(report.threadId);
      }
      if (report.targetType === ReportTargetType.POST && report.postId) {
        await this.hidePost(report.postId);
      }
    }

    return this.prisma.report.update({
      where: { id },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }
}
