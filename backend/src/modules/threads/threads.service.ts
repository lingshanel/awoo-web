import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminBanType } from '@prisma/client';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { CaptchaService } from 'src/common/security/captcha.service';
import { hashOwnerPassword, verifyOwnerPassword } from 'src/common/security/owner-password';
import { RequestMeta } from 'src/common/request/request-meta';
import { createAuthorHash } from 'src/common/utils/request-identity';
import { UploadsService } from '../uploads/uploads.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { DeleteThreadDto } from './dto/delete-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { toThreadDetail } from './threads.mapper';
import { THREAD_INCLUDE } from './threads.types';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
    private readonly captchaService: CaptchaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async createThread(dto: CreateThreadDto, meta: RequestMeta) {
    this.captchaService.verify(dto.captchaToken, dto.captchaAnswer);
    this.antiSpamService.enforceCooldown(`thread:${meta.actorHash}`, 20_000);
    this.antiSpamService.enforceContentQuality(`content:${meta.actorHash}`, `${dto.title}\n${dto.content}`);

    const board = await this.prisma.board.findUnique({
      where: { slug: dto.boardSlug },
    });

    if (!board) {
      throw new NotFoundException(`Board not found: ${dto.boardSlug}`);
    }

    await this.uploadsService.assertCanAttach(dto.attachmentIds, dto.attachmentDeleteTokens);

    const authorHash = createAuthorHash(dto.authorName, dto.email);
    await this.ensureNotBanned(authorHash, meta.actorHash);
    const thread = await this.prisma.thread.create({
      data: {
        boardId: board.id,
        title: dto.title,
        content: dto.content,
        editPasswordHash: hashOwnerPassword(dto.editPassword),
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

  async updateThread(id: number, dto: UpdateThreadDto, meta: RequestMeta) {
    this.captchaService.verify(dto.captchaToken, dto.captchaAnswer);

    const thread = await this.prisma.thread.findFirst({
      where: { id, isDeleted: false },
    });

    if (!thread) {
      throw new NotFoundException(`Thread not found: ${id}`);
    }

    if (!verifyOwnerPassword(dto.editPassword, thread.editPasswordHash)) {
      this.throttleOwnerPasswordFailure(`thread:update:${id}:${meta.actorHash}`);
      throw new ForbiddenException('수정/삭제 비밀번호가 올바르지 않습니다.');
    }

    const updated = await this.prisma.thread.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
      },
      include: THREAD_INCLUDE,
    });

    return {
      message: '스레드를 수정했습니다.',
      item: toThreadDetail(updated),
    };
  }

  async deleteThread(id: number, dto: DeleteThreadDto, meta: RequestMeta) {
    const thread = await this.prisma.thread.findFirst({
      where: { id, isDeleted: false },
    });

    if (!thread) {
      throw new NotFoundException(`Thread not found: ${id}`);
    }

    if (!verifyOwnerPassword(dto.editPassword, thread.editPasswordHash)) {
      this.throttleOwnerPasswordFailure(`thread:delete:${id}:${meta.actorHash}`);
      throw new ForbiddenException('수정/삭제 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.thread.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    return {
      id,
      message: '스레드를 삭제했습니다.',
    };
  }

  private throttleOwnerPasswordFailure(key: string) {
    this.antiSpamService.enforceCooldown(`owner-password:${key}`, 5 * 60 * 1000, 5);
  }
}
