'use client';

import { useEffect, useState } from 'react';

const notices = [
  '규칙: 개인정보 노출 금지 · 분쟁 유도 금지 · 불법 콘텐츠 업로드 금지. 편하게 이야기해 주세요.',
  '새 게시판 /study/ 와 /photo/ 가 열렸습니다. 질문, 기록, 정보 공유에 활용해 보세요.',
  '신고 기능이 추가되었습니다. 문제가 있는 글은 게시물 하단의 신고 버튼으로 접수할 수 있습니다.',
];

export function NoticeTicker() {
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setNoticeIndex((current) => (current + 1) % notices.length);
        setVisible(true);
      }, 400);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="news-ticker">
      <span className="label">[공지]</span>
      <span className={`ticker-text ${visible ? 'visible' : ''}`}>{notices[noticeIndex]}</span>
    </div>
  );
}
