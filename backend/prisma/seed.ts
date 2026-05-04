import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_BOARDS } from '../src/modules/boards/boards.constants';
import { hashOwnerPassword } from '../src/common/security/owner-password';
import { createAuthorHash, hashValue } from '../src/common/utils/request-identity';

const prisma = new PrismaClient();
const SAMPLE_PASSWORD = '1234';

const boardTopics: Record<string, Array<{ title: string; content: string }>> = {
  anime: [
    { title: '이번 분기 애니 뭐부터 볼까요?', content: '일단 1화 기준으로 작화와 템포가 괜찮았던 작품들을 골라보고 있습니다. 추천작 있으면 짧게 남겨주세요.' },
    { title: '원작 만화 먼저 보는 편인가요?', content: '애니로 먼저 접하면 연출 맛이 있고, 원작으로 보면 세세한 감정선이 좋아서 늘 고민됩니다.' },
    { title: '엔딩곡 좋은 작품 모음', content: '요즘은 오프닝보다 엔딩곡이 오래 남는 작품들이 많네요. 밤에 듣기 좋은 곡 위주로 추천 부탁합니다.' },
    { title: '작화 안정적인 스튜디오 이야기', content: '액션 장면보다 일상 장면의 표정과 손동작이 좋은 작품을 더 오래 기억하게 되는 것 같습니다.' },
    { title: '스포 없이 감상 남기는 스레드', content: '아직 안 본 사람도 볼 수 있게 구체적인 반전은 빼고 분위기만 공유해 봅시다.' },
    { title: '굿즈 보관 어떻게 하세요?', content: '아크릴, 포스터, 포토카드가 늘어나면서 보관 방법이 슬슬 필요해졌습니다.' },
  ],
  tech: [
    { title: '개발용 노트북 세팅 공유', content: 'Node, PostgreSQL, Git, 에디터 확장까지 새 PC 세팅할 때 빠뜨리기 쉬운 것들을 정리해봅니다.' },
    { title: 'Next.js 앱 라우터 써본 후기', content: '서버 컴포넌트와 클라이언트 컴포넌트 경계가 처음에는 헷갈리지만 익숙해지면 꽤 단정합니다.' },
    { title: '집에서 쓰는 NAS 구성', content: '사진 백업과 프로젝트 보관용으로 작은 NAS를 맞추려는데 디스크 구성 추천을 받고 싶습니다.' },
    { title: '키보드 배열 적응 기간', content: '텐키리스에서 75% 배열로 넘어가니 생각보다 방향키 주변이 중요하네요.' },
    { title: 'PostgreSQL 로컬 개발 팁', content: '마이그레이션과 seed를 자주 돌릴 때 DB를 깔끔하게 유지하는 방식들을 공유해주세요.' },
    { title: '코드 리뷰 받을 때 좋은 설명 방식', content: '무엇을 바꿨는지보다 왜 바꿨는지를 먼저 적으면 리뷰가 훨씬 부드럽게 흘러갑니다.' },
  ],
  cyber: [
    { title: '개인 계정 2단계 인증 정리', content: '메일, GitHub, 클라우드 계정부터 2FA를 켜두면 사고 확률이 확 줄어듭니다.' },
    { title: '공유기 기본 설정 점검', content: '관리자 비밀번호, 펌웨어 업데이트, 게스트 네트워크 분리 정도는 먼저 확인하는 편이 좋습니다.' },
    { title: '비밀번호 관리자 뭐 쓰세요?', content: '기기 여러 대에서 동기화가 편하면서도 백업이 쉬운 조합을 찾고 있습니다.' },
    { title: '피싱 메일 구분 사례', content: '링크 주소, 첨부 파일, 어색한 문장보다도 발신자 도메인을 먼저 보는 습관이 중요합니다.' },
    { title: '홈랩 방화벽 규칙 메모', content: '열어둔 포트를 줄이고 내부망 접근 기준을 명확히 하니 관리가 쉬워졌습니다.' },
    { title: '백업은 몇 벌이 적당할까요?', content: '로컬 하나, 외장 하나, 클라우드 하나 정도면 개인 프로젝트에는 꽤 든든한 편입니다.' },
  ],
  game: [
    { title: '주말에 가볍게 할 게임 추천', content: '긴 RPG보다 한두 시간 안에 기분 전환되는 게임을 찾고 있습니다. 인디 게임도 좋아요.' },
    { title: '최근 패치 후 밸런스 체감', content: '수치 변화는 작아 보였는데 실제 매치에서는 꽤 크게 느껴지는 부분이 있네요.' },
    { title: '스토리 좋은 싱글 게임 모음', content: '전투보다 서사와 분위기로 오래 남는 게임을 추천해주세요.' },
    { title: '컨트롤러 키 배치 공유', content: '기본 배치가 손에 안 맞아서 회피와 상호작용 키를 바꿔 쓰고 있습니다.' },
    { title: '멀티 게임 매너 이야기', content: '실력 차이가 나도 분위기 좋게 끝나는 판이 제일 기억에 남습니다.' },
    { title: '스팀 세일 때 살만한 게임', content: '찜 목록만 늘어가는데 실제로 끝까지 하게 되는 게임은 따로 있는 것 같습니다.' },
  ],
  music: [
    { title: '밤 산책할 때 듣기 좋은 앨범', content: '너무 잔잔하지만은 않고 리듬이 살짝 있는 곡들을 좋아합니다.' },
    { title: '최근 반복 재생 중인 노래', content: '한 곡에 꽂히면 며칠 동안 계속 듣는 편인데, 요즘 그런 곡 있나요?' },
    { title: '입문하기 좋은 재즈 추천', content: '너무 어려운 앨범보다 멜로디가 잘 들어오는 쪽으로 추천 부탁합니다.' },
    { title: '작업할 때 듣는 플레이리스트', content: '가사가 적거나 신경을 덜 빼앗는 음악이 코딩할 때 잘 맞는 것 같아요.' },
    { title: '라이브 영상 좋은 아티스트', content: '음원보다 라이브에서 매력이 더 살아나는 무대를 모아보고 싶습니다.' },
    { title: '이어폰 바꾸고 들린 소리', content: '장비를 바꾸면 익숙한 곡에서도 못 듣던 악기가 들릴 때가 있습니다.' },
  ],
  news: [
    { title: '오늘 주요 이슈 짧게 정리', content: '긴 기사 링크도 좋지만 핵심만 세 줄로 요약해주면 따라가기 편할 것 같습니다.' },
    { title: '기술 정책 변화 모아보기', content: 'AI, 개인정보, 플랫폼 규제처럼 개발자에게 영향 있는 소식을 모아봅니다.' },
    { title: '해외 뉴스 볼 때 참고하는 곳', content: '같은 사건도 매체별 관점이 달라서 여러 출처를 같이 보는 편이 좋더군요.' },
    { title: '경제 지표 쉽게 읽기', content: '금리, 환율, 물가 같은 숫자가 일상에 어떻게 이어지는지 이야기해봅시다.' },
    { title: '지역 소식 공유 스레드', content: '큰 뉴스에는 안 나오지만 생활에 직접 영향 있는 소식도 꽤 중요합니다.' },
    { title: '팩트체크가 필요한 주장들', content: '확실하지 않은 내용은 출처를 붙이고, 확인된 내용과 추측을 나눠 적어주세요.' },
  ],
  food: [
    { title: '간단한 야식 추천', content: '설거지 적고 조리 시간이 짧은 메뉴가 최고입니다. 냉동식품 조합도 환영합니다.' },
    { title: '편의점 신상 먹어본 후기', content: '생각보다 괜찮았던 것과 다시 안 살 것 같은 제품을 나눠봅시다.' },
    { title: '집에서 만드는 국물요리', content: '날씨가 흐리면 따뜻한 국물이 당기네요. 실패 적은 레시피가 궁금합니다.' },
    { title: '커피 원두 추천', content: '산미가 너무 강하지 않고 고소한 쪽을 좋아합니다.' },
    { title: '맛집 웨이팅 기준', content: '맛있어도 한 시간 넘게 기다리면 기대치가 너무 올라가서 애매해지는 것 같습니다.' },
    { title: '도시락 싸는 팁', content: '식어도 괜찮고 냄새가 너무 강하지 않은 반찬 조합을 찾고 있습니다.' },
  ],
  photo: [
    { title: '비 오는 날 사진 찍기', content: '반사광과 간판 불빛이 좋아서 밤비 오는 거리가 생각보다 잘 나옵니다.' },
    { title: '스마트폰 사진 보정 루틴', content: '노출을 살짝 낮추고 대비를 조금 올리는 정도가 제일 자연스럽게 느껴집니다.' },
    { title: '산책하면서 찍은 하늘', content: '매일 비슷한 길도 구름 모양이 다르면 완전히 다른 사진이 됩니다.' },
    { title: '인물 사진 배경 고르기', content: '복잡한 배경보다 색이 단순한 벽이나 나무 그늘이 실패가 적었습니다.' },
    { title: '사진 백업 방식', content: '원본은 외장하드에, 보정본은 클라우드에 두는 식으로 나눠 관리하고 있습니다.' },
    { title: '렌즈 하나만 고른다면', content: '가볍게 들고 다닐 단렌즈 하나를 고르라면 어떤 화각이 좋을까요?' },
  ],
  sports: [
    { title: '이번 주 경기 관전 포인트', content: '순위보다 최근 폼과 부상자 상황을 보면 더 재미있게 볼 수 있습니다.' },
    { title: '운동 루틴 공유', content: '무리하지 않고 오래 가는 루틴이 결국 제일 강한 루틴인 것 같습니다.' },
    { title: '러닝화 추천 부탁해요', content: '초보 러너라 쿠션 좋고 발목 부담 적은 모델을 찾고 있습니다.' },
    { title: '팀 스포츠 직관 후기', content: '중계로는 안 보이는 움직임과 응원 분위기가 직관의 재미네요.' },
    { title: '홈트 장비 뭐가 좋을까요?', content: '공간을 많이 차지하지 않으면서 꾸준히 쓰게 되는 장비가 궁금합니다.' },
    { title: '경기 후 기록 보는 법', content: '스코어만 보는 것보다 슈팅 위치나 점유 흐름을 같이 보면 이해가 더 잘 됩니다.' },
  ],
  study: [
    { title: '오늘 공부한 것 기록', content: '짧게라도 적어두면 다음 날 다시 시작하기가 훨씬 쉬워집니다.' },
    { title: '집중이 안 될 때 쓰는 방법', content: '타이머를 짧게 잡고 시작하면 생각보다 진입 장벽이 낮아집니다.' },
    { title: '영어 원서 읽기 루틴', content: '모르는 단어를 전부 찾기보다 문맥으로 넘어가는 연습이 도움이 됐습니다.' },
    { title: '개념 정리 노트 방식', content: '문장으로 길게 적기보다 질문과 답 형태로 바꾸면 복습할 때 좋습니다.' },
    { title: '시험 전날 체크리스트', content: '새로운 것을 더 넣기보다 실수 줄이는 쪽에 집중하는 편입니다.' },
    { title: '온라인 강의 완주 팁', content: '강의를 보는 시간과 직접 따라 하는 시간을 분리하면 완주율이 올라갑니다.' },
  ],
  travel: [
    { title: '당일치기 여행지 추천', content: '기차나 버스로 다녀올 수 있고 걷기 좋은 곳이면 더 좋습니다.' },
    { title: '여행 짐 줄이는 방법', content: '매번 안 쓰는 물건을 들고 가서 이번엔 정말 가볍게 가보고 싶습니다.' },
    { title: '숙소 고를 때 보는 기준', content: '위치, 소음, 체크인 시간, 콘센트 위치까지 은근히 중요하더군요.' },
    { title: '혼자 여행할 때 좋은 점', content: '일정을 마음대로 바꿀 수 있어서 예상 못한 장소에 오래 머무르게 됩니다.' },
    { title: '비 오는 여행 대처법', content: '실내 코스를 미리 몇 개 저장해두면 날씨가 바뀌어도 덜 당황합니다.' },
    { title: '여행 사진 정리 루틴', content: '돌아온 날 바로 20장만 골라두면 나중에 정리하기가 훨씬 쉽습니다.' },
  ],
  movie: [
    { title: '주말에 볼 영화 추천', content: '너무 무겁지 않지만 보고 나서 이야기할 거리가 남는 영화가 좋습니다.' },
    { title: '최근 본 드라마 감상', content: '초반 몰입감은 좋은데 중반 전개가 관건인 작품들이 많네요.' },
    { title: 'OTT별 볼만한 작품', content: '구독 서비스가 나뉘어 있어서 어디에 뭐가 있는지 공유하면 좋겠습니다.' },
    { title: '엔딩이 오래 남는 영화', content: '결말을 알고 다시 봤을 때 더 좋아지는 작품들이 있습니다.' },
    { title: '스포 없는 추천 스레드', content: '장르와 분위기만 말하고 핵심 전개는 숨기는 방식으로 추천해봅시다.' },
    { title: '극장에서 봐야 하는 영화', content: '사운드와 화면 크기 때문에 집보다 극장에서 훨씬 좋은 작품들이 있죠.' },
  ],
  random: [
    { title: '오늘의 잡담 스레드', content: '큰 주제 없어도 괜찮습니다. 그냥 오늘 있었던 사소한 일들을 남겨봅시다.' },
    { title: '책상 위에 꼭 있는 물건', content: '마우스패드, 물컵, 메모지처럼 없으면 은근히 불편한 것들이 있습니다.' },
    { title: '요즘 바꾸고 싶은 습관', content: '잠들기 전 휴대폰 보는 시간을 줄이고 싶은데 쉽지 않네요.' },
    { title: '작은 성취 자랑하기', content: '대단하지 않아도 미뤄둔 일을 하나 끝내면 꽤 기분이 좋아집니다.' },
    { title: '비 오는 날 할 일', content: '나가지 않고 집에서 천천히 할 수 있는 일들을 모아봅시다.' },
    { title: '아무 말이나 남기는 곳', content: '생각 정리, 짧은 질문, 오늘의 기분 같은 것을 가볍게 남겨주세요.' },
  ],
};

function buildExpandedTopics(slug: string, topics: Array<{ title: string; content: string }>) {
  if (topics.length >= 10) {
    return topics;
  }

  const expandedTopics = [...topics];

  for (let index = topics.length; index < 10; index += 1) {
    const source = topics[index % topics.length];
    expandedTopics.push({
      title: `[${slug}] 추가 이야기 ${index + 1}`,
      content: `${source.content}\n\n카테고리 목록이 10페이지 이상 보이도록 준비한 확장 샘플 스레드입니다.`,
    });
  }

  return expandedTopics;
}

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

async function createSampleThreads() {
  const boards = await prisma.board.findMany({
    select: { id: true, slug: true },
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  const baseTime = new Date('2026-04-27T00:00:00.000Z');
  let threadIndex = 0;

  for (const board of boards) {
    const topics = buildExpandedTopics(board.slug, boardTopics[board.slug] ?? boardTopics.random);

    for (const [topicIndex, topic] of topics.entries()) {
      threadIndex += 1;
      const isHotSample = topicIndex === 0 || topicIndex === 1;
      const createdAt = minutesAfter(baseTime, threadIndex * 9);
      const identity =
        topicIndex % 3 === 0
          ? makeNamedIdentity(`${board.slug}-작성자`, `${board.slug}@awoo.local`)
          : makeAnonymousIdentity(`${board.slug}-${topicIndex}`);

      const thread = await prisma.thread.create({
        data: {
          boardId: board.id,
          title: topic.title,
          content: `${topic.content}\n\n테스트용 수정/삭제 비밀번호는 ${SAMPLE_PASSWORD}입니다.`,
          editPasswordHash: hashOwnerPassword(SAMPLE_PASSWORD),
          ...identity,
          viewCount: isHotSample ? 140 + topicIndex * 35 : 20 + topicIndex * 11,
          likeCount: isHotSample ? 6 + topicIndex : topicIndex % 3,
          createdAt,
          bumpedAt: minutesAfter(createdAt, 4),
        },
      });

      const firstReply = await prisma.post.create({
        data: {
          threadId: thread.id,
          content: '예시 댓글입니다. 글 수정과 댓글 삭제 테스트에 사용할 수 있습니다.',
          editPasswordHash: hashOwnerPassword(SAMPLE_PASSWORD),
          ...makeAnonymousIdentity(`${board.slug}-${topicIndex}-reply-1`),
          likeCount: topicIndex % 2,
          createdAt: minutesAfter(createdAt, 2),
        },
      });

      await prisma.post.create({
        data: {
          threadId: thread.id,
          parentPostId: firstReply.id,
          content: `>>${firstReply.id}\n답글 예시입니다. 인용 링크와 대댓글 UI 확인용입니다.`,
          editPasswordHash: hashOwnerPassword(SAMPLE_PASSWORD),
          ...makeAnonymousIdentity(`${board.slug}-${topicIndex}-reply-2`),
          createdAt: minutesAfter(createdAt, 4),
        },
      });

      await prisma.thread.update({
        where: { id: thread.id },
        data: {
          replyCount: 2,
          bumpedAt: minutesAfter(createdAt, 4),
        },
      });
    }
  }
}

async function main() {
  await upsertBoards();
  await resetBoardContent();
  await createSampleThreads();
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
