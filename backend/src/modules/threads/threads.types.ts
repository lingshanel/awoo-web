export const THREAD_INCLUDE = {
  board: true,
  attachments: true,
  posts: {
    where: {
      isDeleted: false,
    },
    include: {
      attachments: true,
      parentPost: {
        select: {
          id: true,
          authorName: true,
          authorHash: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const;
