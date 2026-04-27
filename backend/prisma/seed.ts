import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_BOARDS } from '../src/modules/boards/boards.constants';
import { createAuthorHash, hashValue } from '../src/common/utils/request-identity';

const prisma = new PrismaClient();

function minutesAfter(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

function makeAnonymousIdentity(label: string) {
  const actorHash = hashValue(`seed-actor:${label}`);
  return {
    authorName: null,
    email: null,
    authorHash: createAuthorHash(undefined, undefined),
    authorIpHash: actorHash,
  };
}

function makeNamedIdentity(name: string, email?: string) {
  return {
    authorName: name,
    email: email ?? null,
    authorHash: createAuthorHash(name, email),
    authorIpHash: hashValue(`seed-actor:${name}:${email ?? ''}`),
  };
}

async function upsertBoards() {
  for (const [index, board] of DEFAULT_BOARDS.entries()) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: {
        name: board.name,
        description: board.description,
        sortOrder: index,
        isActive: true,
      },
      create: {
        slug: board.slug,
        name: board.name,
        description: board.description,
        sortOrder: index,
        isActive: true,
      },
    });
  }
}

async function resetBoardContent() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "Reaction", "Report", "Attachment", "Post", "Thread"
    RESTART IDENTITY CASCADE;
  `);
}

async function createTestData() {
  const boardMap = new Map(
    (
      await prisma.board.findMany({
        select: { id: true, slug: true },
      })
    ).map((board) => [board.slug, board.id]),
  );

  const baseTime = new Date('2026-04-23T09:00:00.000Z');

  const gameOp = makeAnonymousIdentity('game-op');
  const gameAnon2 = makeAnonymousIdentity('game-anon-2');
  const gameAnon3 = makeAnonymousIdentity('game-anon-3');
  const gameAnon4 = makeAnonymousIdentity('game-anon-4');
  const techOp = makeNamedIdentity('운영자', 'admin@awoo.kr');
  const techAnon2 = makeAnonymousIdentity('tech-anon-2');
  const photoOp = makeAnonymousIdentity('photo-op');
  const photoAnon2 = makeAnonymousIdentity('photo-anon-2');

  const gameThread = await prisma.thread.create({
    data: {
      boardId: boardMap.get('game')!,
      title: '테스트용 게임 스레드 - 추천작 모아보기',
      content:
        '댓글과 대댓글, 익명 번호, 인용 링크를 테스트하기 위한 샘플 스레드입니다.\n자유롭게 구조를 확인해 보세요.',
      ...gameOp,
      viewCount: 128,
      likeCount: 7,
      createdAt: minutesAfter(baseTime, 0),
      bumpedAt: minutesAfter(baseTime, 36),
    },
  });

  const gamePost1 = await prisma.post.create({
    data: {
      threadId: gameThread.id,
      content: '첫 댓글입니다. 익명 번호가 어떻게 붙는지 확인하는 중입니다.',
      ...gameAnon2,
      likeCount: 2,
      createdAt: minutesAfter(baseTime, 5),
    },
  });

  const gamePost2 = await prisma.post.create({
    data: {
      threadId: gameThread.id,
      content: `>>${gamePost1.id} @익명2\n대댓글입니다. 인용 hover와 연결 표시를 테스트하고 있습니다.`,
      parentPostId: gamePost1.id,
      ...gameAnon3,
      likeCount: 1,
      createdAt: minutesAfter(baseTime, 10),
    },
  });

  const gamePost3 = await prisma.post.create({
    data: {
      threadId: gameThread.id,
      content: '같은 사람이 다시 댓글을 달면 같은 익명 번호가 유지되는지도 확인할 수 있습니다.',
      ...gameAnon2,
      createdAt: minutesAfter(baseTime, 14),
    },
  });

  await prisma.post.create({
    data: {
      threadId: gameThread.id,
      content: `>>${gamePost2.id} @익명3\n대댓글 아래에 또 답글을 달아 구조를 확인해 보는 중입니다.`,
      parentPostId: gamePost2.id,
      ...gameAnon4,
      createdAt: minutesAfter(baseTime, 20),
    },
  });

  await prisma.post.create({
    data: {
      threadId: gameThread.id,
      content: `>>${gamePost3.id} @익명2\n같은 익명이 다시 등장하면 번호도 그대로 보여야 합니다.`,
      parentPostId: gamePost3.id,
      ...gameAnon2,
      createdAt: minutesAfter(baseTime, 26),
    },
  });

  const techThread = await prisma.thread.create({
    data: {
      boardId: boardMap.get('tech')!,
      title: '테스트용 기술 스레드 - UI 의견 모으기',
      content:
        '이 스레드는 기술 게시판용 샘플입니다.\n익명과 닉네임 작성이 섞여 있을 때 표시를 확인해 보세요.',
      ...techOp,
      viewCount: 91,
      likeCount: 4,
      createdAt: minutesAfter(baseTime, 40),
      bumpedAt: minutesAfter(baseTime, 58),
    },
  });

  const techPost1 = await prisma.post.create({
    data: {
      threadId: techThread.id,
      content: '익명 댓글 테스트입니다. 여기서는 익명1이 아니라 스레드 기준 다음 번호가 붙습니다.',
      ...techAnon2,
      createdAt: minutesAfter(baseTime, 45),
    },
  });

  await prisma.post.create({
    data: {
      threadId: techThread.id,
      content: `>>${techPost1.id} @익명1\n운영자 답변입니다. 닉네임 작성자는 익명 번호를 사용하지 않습니다.`,
      parentPostId: techPost1.id,
      ...techOp,
      createdAt: minutesAfter(baseTime, 58),
    },
  });

  const photoThread = await prisma.thread.create({
    data: {
      boardId: boardMap.get('photo')!,
      title: '테스트용 사진 스레드 - 썸네일 미리보기 확인',
      content:
        '이미지 첨부가 있는 댓글의 미리보기와 팝업 동작을 확인하기 위한 샘플 스레드입니다.',
      ...photoOp,
      viewCount: 42,
      likeCount: 1,
      createdAt: minutesAfter(baseTime, 70),
      bumpedAt: minutesAfter(baseTime, 82),
    },
  });

  await prisma.post.create({
    data: {
      threadId: photoThread.id,
      content:
        '이미지 없는 테스트 댓글입니다. 실제 이미지를 붙이면 미리보기 영역에서 함께 보이게 됩니다.',
      ...photoAnon2,
      createdAt: minutesAfter(baseTime, 82),
    },
  });

  const replyCounts = await prisma.post.groupBy({
    by: ['threadId'],
    _count: {
      _all: true,
    },
  });

  for (const item of replyCounts) {
    const latestPost = await prisma.post.findFirst({
      where: { threadId: item.threadId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    await prisma.thread.update({
      where: { id: item.threadId },
      data: {
        replyCount: item._count._all,
        bumpedAt: latestPost?.createdAt ?? undefined,
      },
    });
  }
}

async function createPaginationTestThreads() {
  const boards = await prisma.board.findMany({
    select: { id: true, slug: true },
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const boardMap = new Map(boards.map((board) => [board.slug, board.id]));
  const boardSlugs = ['tech', 'photo', 'random', 'anime', 'news'];
  const baseTime = new Date('2026-04-27T00:00:00.000Z');

  for (let index = 1; index <= 72; index += 1) {
    const boardSlug = index <= 48 ? 'game' : boardSlugs[(index - 49) % boardSlugs.length];
    const boardId = boardMap.get(boardSlug);

    if (!boardId) {
      continue;
    }

    const isHotSample = index % 9 === 0 || index % 14 === 0;
    const createdAt = minutesAfter(baseTime, index * 7);
    const replyCount = isHotSample ? 6 + (index % 5) : index % 4;
    const viewCount = isHotSample ? 150 + index * 3 : 12 + index * 2;
    const likeCount = isHotSample ? 5 + (index % 6) : index % 3;
    const identity =
      index % 5 === 0
        ? makeNamedIdentity(`tester-${index}`, `tester-${index}@awoo.local`)
        : makeAnonymousIdentity(`pagination-${boardSlug}-${index}`);

    await prisma.thread.create({
      data: {
        boardId,
        title: `[pagination test ${String(index).padStart(2, '0')}] ${boardSlug} sample thread`,
        content:
          'This seeded thread exists to verify hot-first ordering and multi-page navigation. ' +
          `Sample number: ${index}.`,
        ...identity,
        replyCount,
        viewCount,
        likeCount,
        createdAt,
        bumpedAt: minutesAfter(createdAt, replyCount),
      },
    });
  }
}

async function main() {
  await upsertBoards();
  await resetBoardContent();
  await createTestData();
  await createPaginationTestThreads();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
