import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashOwnerPassword } from '../src/common/security/owner-password';
import { createAuthorHash, hashValue } from '../src/common/utils/request-identity';

const prisma = new PrismaClient();
const TARGET_THREAD_COUNT = 200;
const SAMPLE_PASSWORD = '1234';

const topicSeeds: Record<string, Array<{ title: string; content: string }>> = {
  anime: [
    { title: '작화가 안정적인 에피소드 이야기', content: '최근 본 작품 중 작화와 연출이 오래 기억나는 장면을 가볍게 공유하는 스레드입니다.' },
    { title: '엔딩곡이 좋은 애니 추천', content: '본편을 다 보고도 엔딩곡 때문에 끝까지 듣게 되는 작품을 모아봅니다.' },
  ],
  tech: [
    { title: '개발 환경 정리 팁', content: '에디터, 터미널, 패키지 매니저처럼 매일 쓰는 도구를 정리하는 방법을 나눠봅니다.' },
    { title: '작은 프로젝트 배포 기록', content: '로컬에서 돌아가던 프로젝트를 실제 배포까지 가져갈 때 막혔던 지점을 기록합니다.' },
  ],
  cyber: [
    { title: '계정 보안 점검 루틴', content: '2단계 인증, 비밀번호 관리자, 백업 코드처럼 기본이지만 자주 놓치는 항목을 확인합니다.' },
    { title: '홈 네트워크 정리', content: '공유기 설정과 게스트 네트워크 분리처럼 집에서 바로 적용할 수 있는 보안 이야기를 다룹니다.' },
  ],
  game: [
    { title: '주말에 짧게 하기 좋은 게임', content: '긴 몰입이 부담스러울 때 한두 시간 안에 기분 전환하기 좋은 게임을 추천합니다.' },
    { title: '패치 후 체감 변화', content: '수치로는 작아 보여도 실제 플레이에서 크게 느껴지는 밸런스 변화를 이야기합니다.' },
  ],
  music: [
    { title: '작업할 때 듣는 앨범', content: '집중을 깨지 않으면서 리듬감이 살아 있는 앨범과 플레이리스트를 공유합니다.' },
    { title: '요즘 반복 재생한 곡', content: '며칠째 손이 가는 곡과 그 이유를 짧게 남기는 스레드입니다.' },
  ],
  news: [
    { title: '오늘 읽은 이슈 정리', content: '기사 링크보다 핵심 맥락과 서로 다른 관점을 짧게 정리해보는 공간입니다.' },
    { title: '정책 변화 메모', content: '개발자와 창작자에게 영향을 줄 수 있는 정책 변화를 놓치지 않도록 모아봅니다.' },
  ],
  food: [
    { title: '간단한 점심 메뉴', content: '설거지를 줄이고 든든하게 먹을 수 있는 현실적인 한 끼 조합을 공유합니다.' },
    { title: '편의점 조합 추천', content: '가격 대비 만족도가 괜찮았던 편의점 음식 조합을 모아보는 스레드입니다.' },
  ],
  photo: [
    { title: '스마트폰 사진 보정', content: '과하지 않게 노출과 색감을 정리하는 보정 습관을 나눠봅니다.' },
    { title: '비 오는 날 사진', content: '반사광과 간판 불빛처럼 흐린 날에 더 잘 살아나는 장면을 이야기합니다.' },
  ],
  sports: [
    { title: '이번 주 경기 관전 포인트', content: '순위표보다 최근 흐름과 부상 변수 중심으로 경기를 미리 보는 스레드입니다.' },
    { title: '운동 루틴 공유', content: '무리하지 않고 꾸준히 이어가기 좋은 운동 루틴과 장비를 나눠봅니다.' },
  ],
  study: [
    { title: '오늘 공부한 것 기록', content: '짧게라도 적어두면 다음 날 다시 시작하기 쉬워지는 공부 기록 스레드입니다.' },
    { title: '집중이 안 될 때 쓰는 방법', content: '타이머, 환경 정리, 작은 목표처럼 바로 시도할 수 있는 방법을 모아봅니다.' },
  ],
  travel: [
    { title: '당일치기 여행지 추천', content: '기차나 버스로 다녀올 수 있고 걷기 좋은 여행지를 추천하는 스레드입니다.' },
    { title: '숙소 고를 때 보는 기준', content: '위치, 소음, 체크인 시간, 콘센트처럼 실제 만족도를 가르는 기준을 정리합니다.' },
  ],
  movie: [
    { title: '주말에 볼 영화 추천', content: '너무 무겁지 않지만 보고 나서 이야기할 거리가 남는 영화를 추천합니다.' },
    { title: 'OTT에서 건진 작품', content: '목록에는 조용히 있지만 막상 보면 만족도가 높았던 작품을 공유합니다.' },
  ],
  random: [
    { title: '오늘의 잡담 모음', content: '큰 주제 없이 오늘 있었던 사소한 일과 생각을 가볍게 남기는 스레드입니다.' },
    { title: '책상 위에 있는 물건', content: '없으면 은근히 불편한 물건과 각자 오래 쓰는 도구 이야기를 나눠봅니다.' },
  ],
};

function minutesBeforeNow(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function main() {
  const total = await prisma.thread.count({
    where: { isDeleted: false },
  });
  const missingCount = Math.max(0, TARGET_THREAD_COUNT - total);

  if (missingCount === 0) {
    return;
  }

  const boards = await prisma.board.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, name: true },
  });

  for (let index = 0; index < missingCount; index += 1) {
    const board = boards[index % boards.length];
    const seeds = topicSeeds[board.slug] ?? topicSeeds.random;
    const seed = seeds[Math.floor(index / boards.length) % seeds.length];
    const createdAt = minutesBeforeNow(missingCount - index);
    const label = `page-fill:${board.slug}:${Date.now()}:${index}`;

    await prisma.thread.create({
      data: {
        boardId: board.id,
        title: `[${board.name}] ${seed.title} ${index + 1}`,
        content: `${seed.content}\n\n페이지네이션 생략 표시 테스트를 위해 여러 게시판에 고르게 추가한 샘플 스레드입니다.\n\n테스트용 수정/삭제 비밀번호는 ${SAMPLE_PASSWORD}입니다.`,
        editPasswordHash: hashOwnerPassword(SAMPLE_PASSWORD),
        authorName: null,
        email: null,
        authorHash: createAuthorHash(undefined, undefined),
        authorIpHash: hashValue(label),
        viewCount: 0,
        likeCount: 0,
        createdAt,
        bumpedAt: createdAt,
      },
    });
  }
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
