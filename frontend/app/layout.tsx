import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'awoo',
  description: '익명 보드 스타일 커뮤니티 프로토타입',
};

const navItems = [
  { href: '/boards/anime', label: '/애니/' },
  { href: '/boards/tech', label: '/기술/' },
  { href: '/boards/cyber', label: '/사이버/' },
  { href: '/boards/game', label: '/게임/' },
  { href: '/boards/music', label: '/음악/' },
  { href: '/boards/news', label: '/뉴스/' },
  { href: '/boards/random', label: '/잡담/' },
  { href: '/write', label: '글쓰기' },
  { href: '/admin', label: '관리' },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="logo" href="/">
              AWOO<span>/KR</span>
            </Link>
            <nav className="header-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="ad-banner-top">
          <div className="ad-slot ad-slot-top">[ 광고 영역 · 728x90 리더보드 ]</div>
        </div>
        <div className="shell">{children}</div>
        <footer className="footer">
          <div className="ad-banner-footer">
            <div className="ad-slot ad-slot-top">[ 광고 영역 · 728x90 푸터 리더보드 ]</div>
          </div>
          <div className="footer-inner">
            <div className="footer-col">
              <h4>// awoo/kr</h4>
              <p>익명 보드 스타일 커뮤니티.</p>
              <p>프로토타입 단계의 시안으로 실제 운영용 구조를 바탕으로 만들고 있습니다.</p>
            </div>
            <div className="footer-col">
              <h4>// Boards</h4>
              <ul className="footer-links">
                {navItems.slice(0, 7).map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>// Links</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/write">새 글 작성</Link>
                </li>
                <li>
                  <Link href="/admin">관리자 화면</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 awoo/kr · 게시물의 권리는 각 작성자에게 있습니다.</p>
            <div className="status">
              <span className="status-dot" />
              SERVER ONLINE · awoo/fullstack
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
