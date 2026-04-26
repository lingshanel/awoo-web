import { notFound } from 'next/navigation';
import { AdminPanel } from '@/components/admin-panel';

type AdminGatePageProps = {
  params: Promise<{ token: string }>;
};

export default async function AdminGatePage({ params }: AdminGatePageProps) {
  const { token } = await params;
  const expectedToken = process.env.ADMIN_PANEL_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    notFound();
  }

  return (
    <div className="page-body">
      <main className="main-column">
        <AdminPanel />
      </main>
      <aside className="sidebar">
        <div className="sidebar-widget">
          <h3>// 운영 기준</h3>
          <ul className="plain-list">
            <li>신고 사유와 대상 내용을 함께 확인</li>
            <li>문제 대상은 숨김 + 해결 처리</li>
            <li>오신고는 해결 처리만 진행</li>
          </ul>
        </div>
        <div className="sidebar-widget">
          <h3>// 접근</h3>
          <div className="muted-row">
            이 화면은 공개 링크에 노출하지 않고 비공개 운영 주소와 로그인 세션으로 보호합니다.
          </div>
        </div>
      </aside>
    </div>
  );
}
