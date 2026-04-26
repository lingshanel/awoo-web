import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPagination, getSkip } from 'src/common/utils/pagination';
import { PrismaService } from 'src/prisma/prisma.service';
import { toThreadListItem } from '../threads/threads.mapper';
import { THREAD_INCLUDE } from '../threads/threads.types';
import { BoardThreadsQueryDto } from './dto/board-threads-query.dto';
import { RecentThreadsQueryDto } from './dto/recent-threads-query.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  private getThreadOrder(
    sort: 'latest' | 'popular' | 'views' = 'latest',
  ): Prisma.ThreadOrderByWithRelationInput[] {
    if (sort === 'views') {
      return [
        { isPinned: 'desc' },
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { replyCount: 'desc' },
        { createdAt: 'desc' },
      ];
    }

    if (sort === 'popular') {
      return [
        { isPinned: 'desc' },
        { likeCount: 'desc' },
        { replyCount: 'desc' },
        { viewCount: 'desc' },
        { bumpedAt: 'desc' },
      ];
    }

    return [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
      { replyCount: 'desc' },
      { likeCount: 'desc' },
    ];
  }

  async getBoards() {
    const boards = await this.prisma.board.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        _count: {
          select: {
            threads: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    return {
      items: boards.map((board) => ({
        id: board.id,
        slug: board.slug,
        name: board.name,
        description: board.description,
        threadCount: board._count.threads,
      })),
      total: boards.length,
    };
  }

  async getBoard(slug: string) {
    const board = await this.prisma.board.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            threads: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board not found: ${slug}`);
    }

    return {
      id: board.id,
      slug: board.slug,
      name: board.name,
      description: board.description,
      isActive: board.isActive,
      sortOrder: board.sortOrder,
      threadCount: board._count.threads,
    };
  }

  async getBoardThreads(slug: string, query: BoardThreadsQueryDto) {
    const board = await this.getBoard(slug);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ThreadWhereInput = {
      boardId: board.id,
      isDeleted: false,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { content: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = this.getThreadOrder(query.sort);

    const [threads, total] = await this.prisma.$transaction([
      this.prisma.thread.findMany({
        where,
        include: THREAD_INCLUDE,
        orderBy,
        skip: getSkip(page, limit),
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      board,
      query,
      items: threads.map(toThreadListItem),
      pagination: buildPagination(page, limit, total),
    };
  }

  async getRecentThreads(query: RecentThreadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 8;
    const where: Prisma.ThreadWhereInput = {
      isDeleted: false,
      board: {
        isActive: true,
      },
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { content: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.media === 'images'
        ? {
            attachments: {
              some: {},
            },
          }
        : {}),
    };

    const [threads, total] = await this.prisma.$transaction([
      this.prisma.thread.findMany({
        where,
        include: THREAD_INCLUDE,
        orderBy: this.getThreadOrder(query.sort),
        skip: getSkip(page, limit),
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    return {
      items: threads.map(toThreadListItem),
      pagination: buildPagination(page, limit, total),
    };
  }
}
