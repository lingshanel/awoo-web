import { Injectable } from '@nestjs/common';
import { ReactionType, ReportTargetType } from '@prisma/client';
import { RequestMeta } from 'src/common/request/request-meta';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async react(
    targetType: 'thread' | 'post',
    targetId: number,
    reactionType: 'like' | 'dislike',
    meta: RequestMeta,
  ) {
    const existing = await this.prisma.reaction.findFirst({
      where: {
        targetType:
          targetType === 'thread' ? ReportTargetType.THREAD : ReportTargetType.POST,
        targetId,
        actorHash: meta.actorHash,
      },
    });

    if (existing) {
      return {
        ...existing,
        message: '이미 반응한 항목입니다.',
      };
    }

    const reaction = await this.prisma.reaction.create({
      data: {
        targetType:
          targetType === 'thread' ? ReportTargetType.THREAD : ReportTargetType.POST,
        targetId,
        threadId: targetType === 'thread' ? targetId : null,
        postId: targetType === 'post' ? targetId : null,
        reactionType:
          reactionType === 'like' ? ReactionType.LIKE : ReactionType.DISLIKE,
        actorHash: meta.actorHash,
      },
    });

    if (reactionType === 'like') {
      if (targetType === 'thread') {
        await this.prisma.thread.update({
          where: { id: targetId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });
      } else {
        await this.prisma.post.update({
          where: { id: targetId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        });
      }
    }

    return reaction;
  }
}
