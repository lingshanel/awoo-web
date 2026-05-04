import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminBanType } from '@prisma/client';
import { RequestMeta } from 'src/common/request/request-meta';
import { AntiSpamService } from 'src/common/security/anti-spam.service';
import { CaptchaService } from 'src/common/security/captcha.service';
import { hashOwnerPassword, verifyOwnerPassword } from 'src/common/security/owner-password';
import { buildPagination, getSkip } from 'src/common/utils/pagination';
import { createAuthorHash } from 'src/common/utils/request-identity';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreatePostDto } from './dto/create-post.dto';
import { DeletePostDto } from './dto/delete-post.dto';
import { ThreadPostsQueryDto } from './dto/thread-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antiSpamService: AntiSpamService,
    private readonly captchaService: CaptchaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async getPosts(threadId: number, query: ThreadPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const orderBy =
      query.sort === 'latest'
        ? [{ createdAt: 'desc' as const }]
        : query.sort === 'likes'
          ? [{ likeCount: 'desc' as const }, { createdAt: 'asc' as const }]
          : [{ createdAt: 'asc' as const }];

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: {
          threadId,
          isDeleted: false,
        },
        include: {
          attachments: true,
        },
        orderBy,
        skip: getSkip(page, limit),
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          threadId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      threadId,
      query,
      items: posts.map((post) => ({
        id: post.id,
        parentPostId: post.parentPostId,
        content: post.content,
        authorName: post.authorName ?? '익명',
        authorHash: post.authorHash,
        participantKey: post.authorIpHash,
        likeCount: post.likeCount,
        createdAt: post.createdAt,
        attachments: post.attachments.map((attachment) => ({
          id: attachment.id,
          url: attachment.storageKey,
          thumbnailUrl: attachment.thumbnailKey,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          width: attachment.width,
          height: attachment.height,
        })),
      })),
      pagination: buildPagination(page, limit, total),
    };
  }

  async createPost(threadId: number, dto: CreatePostDto, meta: RequestMeta) {
    this.captchaService.verify(dto.captchaToken, dto.captchaAnswer);
    this.antiSpamService.enforceCooldown(`post:${meta.actorHash}`, 8_000, 2);
    this.antiSpamService.enforceContentQuality(`content:${meta.actorHash}`, dto.content);

    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.isDeleted) {
      throw new NotFoundException(`Thread not found: ${threadId}`);
    }

    if (dto.parentPostId) {
      const parentPost = await this.prisma.post.findFirst({
        where: {
          id: dto.parentPostId,
          threadId,
          isDeleted: false,
        },
      });

      if (!parentPost) {
        throw new NotFoundException(`Parent post not found: ${dto.parentPostId}`);
      }
    }

    const authorHash = createAuthorHash(dto.authorName, dto.email);
    await this.ensureNotBanned(authorHash, meta.actorHash);
    await this.uploadsService.assertCanAttach(dto.attachmentIds, dto.attachmentDeleteTokens);

    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          threadId,
          parentPostId: dto.parentPostId ?? null,
          content: dto.content,
          editPasswordHash: hashOwnerPassword(dto.editPassword),
          authorName: dto.authorName?.trim() || null,
          email: dto.email?.trim() || null,
          authorHash,
          authorIpHash: meta.actorHash,
          isSage: dto.isSage ?? false,
          attachments: dto.attachmentIds?.length
            ? {
                connect: dto.attachmentIds.map((id) => ({ id })),
              }
            : undefined,
        },
      });

      await tx.thread.update({
        where: { id: threadId },
        data: {
          replyCount: {
            increment: 1,
          },
          ...(dto.isSage
            ? {}
            : {
                bumpedAt: new Date(),
              }),
        },
      });

      return created;
    });

    return {
      message: 'Post created.',
      item: post,
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

  async updatePost(threadId: number, postId: number, dto: UpdatePostDto, meta: RequestMeta) {
    this.captchaService.verify(dto.captchaToken, dto.captchaAnswer);

    const post = await this.prisma.post.findFirst({
      where: { id: postId, threadId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(`Post not found: ${postId}`);
    }

    if (!verifyOwnerPassword(dto.editPassword, post.editPasswordHash)) {
      this.throttleOwnerPasswordFailure(`post:update:${postId}:${meta.actorHash}`);
      throw new ForbiddenException('수정/삭제 비밀번호가 올바르지 않습니다.');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content,
      },
    });

    return {
      message: '댓글을 수정했습니다.',
      item: {
        id: updated.id,
      },
    };
  }

  async deletePost(threadId: number, postId: number, dto: DeletePostDto, meta: RequestMeta) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, threadId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundException(`Post not found: ${postId}`);
    }

    if (!verifyOwnerPassword(dto.editPassword, post.editPasswordHash)) {
      this.throttleOwnerPasswordFailure(`post:delete:${postId}:${meta.actorHash}`);
      throw new ForbiddenException('수정/삭제 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: postId },
        data: {
          isDeleted: true,
        },
      }),
      this.prisma.thread.update({
        where: { id: threadId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    return {
      id: postId,
      message: '댓글을 삭제했습니다.',
    };
  }

  private throttleOwnerPasswordFailure(key: string) {
    this.antiSpamService.enforceCooldown(`owner-password:${key}`, 5 * 60 * 1000, 5);
  }
}
