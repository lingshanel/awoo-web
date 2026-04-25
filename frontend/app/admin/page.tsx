import { AdminPanel } from '@/components/admin-panel';

export default function AdminPage() {
  return (
    <div className="page-body">
      <main className="main-column">
        <AdminPanel />
      </main>
      <aside className="sidebar">
        <div className="sidebar-widget">
          <h3>// Admin</h3>
          <div className="plain-list">
            <li>신고 목록 조회</li>
            <li>신고 해결 처리</li>
            <li>스레드와 댓글 숨김</li>
          </div>
        </div>
      </aside>
    </div>
  );
}
