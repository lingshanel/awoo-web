import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid" style={{ marginTop: 24 }}>
      <section className="board-header">
        <div className="eyebrow">404</div>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>요청한 게시판이나 스레드가 아직 없거나 삭제되었을 수 있습니다.</p>
        <div className="toolbar">
          <Link className="toolbar-button active" href="/">
            홈으로 이동
          </Link>
        </div>
      </section>
    </div>
  );
}
