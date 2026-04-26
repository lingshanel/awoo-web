import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminBanType } from '@prisma/client';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { RequestMeta } from 'src/common/request/request-meta';
import { createAuthorHash } from 'src/common/utils/request-identity';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { toThreadDetail } from './threads.mapper';
import { THREAD_INCLUDE } from './threads.types';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
  ) {}

  async createThread(dto: CreateThreadDto, meta: RequestMeta) {
    this.antiSpamService.enforceCooldown(`thread:${meta.actorHash}`, 20_000);

    const board = await this.prisma.board.findUnique({
      where: { slug: dto.boardSlug },
    });

    if (!board) {
      throw new NotFoundException(`Board not found: ${dto.boardSlug}`);
    }

    const authorHash = createAuthorHash(dto.authorName, dto.email);
    await this.ensureNotBanned(authorHash, meta.actorHash);
    const thread = await this.prisma.thread.create({
      data: {
        boardId: board.id,
        title: dto.title,
        content: dto.content,
        authorName: dto.authorName?.trim() || null,
        email: dto.email?.trim() || null,
        authorHash,
        authorIpHash: meta.actorHash,
        isSage: dto.isSage ?? false,
        hasSpoiler: dto.hasSpoiler ?? false,
        hasNsfw: dto.hasNsfw ?? false,
        attachments: dto.attachmentIds?.length
          ? {
              connect: dto.attachmentIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: THREAD_INCLUDE,
    });

    return {
      message: 'Thread created.',
      item: toThreadDetail(thread),
    };
  }

  private async ensureNotBanned(authorHash: string, ipHash: string) {
    const ban = await this.prisma.adminBan.findFirst({
      where: {
        revokedAt: null,
        OR: [
          { banType: AdminBanType.AUTHOR_HASH, valueHash: authorHash },
          { banType: AdminBanType.IP_HASH, valueHash: ipHash },
        ],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
      },
    });

    if (ban) {
      throw new ForbiddenException('운영 정책에 따라 작성이 제한되었습니다.');
    }
  }

  async getThread(id: number) {
    const thread = await this.prisma.thread.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: THREAD_INCLUDE,
    });

    if (!thread) {
      throw new NotFoundException(`Thread not found: ${id}`);
    }

    return toThreadDetail(thread);
  }

  async registerView(id: number) {
    await this.prisma.thread.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return {
      id,
      message: 'View counted.',
    };
  }
}
