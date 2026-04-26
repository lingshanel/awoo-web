import type { Metadata } from 'next';
import Link from 'next/link';
import { AdSlot } from '@/components/ad-slot';
import './globals.css';

export const metadata: Metadata = {
  title: 'awoo',
  description: '익명 보드 스타일 커뮤니티',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'AWOO/KR',
    description: '익명 보드 스타일 커뮤니티',
    siteName: 'AWOO/KR',
    locale: 'ko_KR',
    type: 'website',
  },
};

const navItems = [
  { href: '/boards/all?sort=latest', label: '최근' },
  { href: '/boards/all?sort=popular', label: 'HOT' },
  { href: '/search?media=images', label: '이미지' },
  { href: '/search', label: '검색' },
  { href: '/write', label: '작성' },
];

const footerBoards = [
  { href: '/boards/anime', label: '/애니/' },
  { href: '/boards/game', label: '/게임/' },
  { href: '/boards/travel', label: '/여행/' },
  { href: '/boards/movie', label: '/영화/드라마/' },
  { href: '/boards/random', label: '/잡담/' },
];

const policyLinks = [
  { href: '/rules', label: '이용규칙' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/report-guide', label: '신고 안내' },
  { href: '/advertise', label: '광고/제휴 안내' },
  { href: '/contact', label: '문의/광고 문의' },
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
          <AdSlot variant="top" />
        </div>
        <div className="shell">{children}</div>
        <footer className="footer">
          <div className="ad-banner-footer">
            <AdSlot variant="footer" />
          </div>
          <div className="footer-inner">
            <div className="footer-col">
              <h4>// awoo/kr</h4>
              <p>익명 보드 스타일 커뮤니티.</p>
              <p>신고와 운영 정책을 기반으로 공개 운영을 준비하고 있습니다.</p>
            </div>
            <div className="footer-col">
              <h4>// 카테고리</h4>
              <ul className="footer-links">
                {footerBoards.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>// 운영</h4>
              <ul className="footer-links">
                {policyLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h4>// 링크</h4>
              <ul className="footer-links">
                <li>
                  <Link href="/boards/all?sort=latest">최근 스레드</Link>
                </li>
                <li>
                  <Link href="/search">검색</Link>
                </li>
                <li>
                  <Link href="/write">스레드 작성</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 awoo/kr · 스레드의 권리는 각 작성자에게 있습니다.</p>
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
