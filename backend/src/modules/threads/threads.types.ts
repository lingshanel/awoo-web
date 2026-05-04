import { Prisma } from '@prisma/client';

export const THREAD_INCLUDE = Prisma.validator<Prisma.ThreadInclude>()({
  board: true,
  attachments: true,
  posts: {
    where: {
      OR: [
        { isDeleted: false },
        {
          childPosts: {
            some: {
              isDeleted: false,
            },
          },
        },
      ],
    },
    include: {
      attachments: true,
      parentPost: {
        select: {
          id: true,
          authorName: true,
          authorHash: true,
          isDeleted: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
});
