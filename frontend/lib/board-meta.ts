import type { BoardSummary } from './api';

const BOARD_META: Record<string, { name: string; description: string }> = {
  anime: { name: '애니', description: '애니메이션과 만화 이야기' },
  tech: { name: '기술', description: '개발, 장비, 기술 잡담' },
  cyber: { name: '사이버', description: '보안, 네트워크, 하드웨어' },
  game: { name: '게임', description: '비디오게임 이야기' },
  music: { name: '음악', description: '음악 추천과 감상' },
  news: { name: '뉴스', description: '최신 이슈와 시사 이야기' },
  food: { name: '먹거리', description: '간식, 맛집, 요리' },
  photo: { name: '사진', description: '사진과 이미지 공유' },
  sports: { name: '스포츠', description: '스포츠 이야기' },
  study: { name: '공부', description: '학습, 질문, 정보 공유' },
  random: { name: '잡담', description: '자유 주제 게시판' },
  all: { name: '전체', description: '모든 게시판 스레드 모아보기' },
};

export function getBoardDisplayMeta(board: Pick<BoardSummary, 'slug' | 'name' | 'description'>) {
  const fallback = BOARD_META[board.slug];

  return {
    name: fallback?.name ?? board.name,
    description: fallback?.description ?? board.description ?? '',
  };
}
