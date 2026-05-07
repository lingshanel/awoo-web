import { Suspense } from 'react';
import { WriteThreadForm } from '@/components/write-thread-form';
import { getBoards } from '@/lib/api';

export default async function WritePage() {
  const boards = await getBoards();

  return (
    <div className="page-body">
      <main className="main-column">
        <div className="news-ticker" style={{ marginBottom: 16 }}>
          <span className="label">[WRITE]</span>
          <span>익명 작성 흐름과 업로드 동작을 반영한 실제 스레드 작성 페이지입니다.</span>
        </div>
        <Suspense fallback={null}>
          <WriteThreadForm boards={boards.items} />
        </Suspense>
      </main>
      <aside className="sidebar">
        <div className="sidebar-widget">
          <h3>// 작성 규칙</h3>
          <ul className="plain-list">
            <li>개인정보를 직접 적지 마세요.</li>
            <li>업로드는 이미지 파일만 지원합니다.</li>
            <li>짧은 시간 반복 작성은 서버에서 자동 제한됩니다.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
