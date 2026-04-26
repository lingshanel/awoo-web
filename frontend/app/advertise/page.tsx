import Link from 'next/link';
import { AdSlot } from '@/components/ad-slot';

const placements = [
  {
    name: '리더보드',
    size: '728x90',
    description: '첫 화면 상단과 하단에 노출되는 기본 배너입니다.',
  },
  {
    name: '사이드 스폰서',
    size: '160x250',
    description: '데스크톱 우측 영역에서 카테고리 이동과 함께 노출됩니다.',
  },
  {
    name: '카테고리 제휴',
    size: '협의',
    description: '게임, 여행, 영화/드라마처럼 주제가 뚜렷한 카테고리에 맞춘 제휴형 노출입니다.',
  },
];

export default function AdvertisePage() {
  return (
    <div className="page-body">
      <main className="main-column">
        <section className="board-header">
          <div>
            <div className="board-tag">/advertise/</div>
            <div className="board-name">// 광고/제휴 안내</div>
          </div>
        </section>

        <section className="policy-page revenue-page">
          <p className="policy-lead">
            AWOO/KR은 익명 커뮤니티의 흐름을 해치지 않는 선에서 광고와 제휴를 운영합니다.
            과한 팝업이나 사용자를 방해하는 방식보다, 카테고리와 어울리는 조용한 노출을 우선합니다.
          </p>

          <div className="revenue-card-grid">
            {placements.map((placement) => (
              <article key={placement.name} className="revenue-card">
                <span>{placement.size}</span>
                <h2>{placement.name}</h2>
                <p>{placement.description}</p>
              </article>
            ))}
          </div>

          <section className="policy-section">
            <h2>운영 기준</h2>
            <p>
              사이트 신뢰를 떨어뜨리는 도박, 불법 다운로드, 성인성 과다 노출, 악성코드 유도성 광고는 받지 않습니다.
              공개 운영 초기에는 직접 광고와 제휴 문의를 먼저 받고, 트래픽이 안정되면 자동 광고를 단계적으로 검토합니다.
            </p>
          </section>

          <section className="policy-section">
            <h2>문의 방식</h2>
            <p>
              광고 목적, 희망 기간, 랜딩 페이지, 소재 크기, 예산 범위를 함께 보내주시면 운영자가 검토합니다.
              실제 운영 전 전용 메일 주소를 연결할 예정입니다.
            </p>
          </section>

          <div className="revenue-actions">
            <Link className="submit-btn primary" href="/contact">
              광고 문의하기
            </Link>
            <Link className="toolbar-link" href="/rules">
              운영 기준 보기
            </Link>
          </div>
        </section>
      </main>

      <aside className="sidebar">
        <div className="sidebar-widget" style={{ padding: 8, textAlign: 'center' }}>
          <AdSlot variant="side" label="광고 예시 슬롯" />
        </div>
        <div className="sidebar-widget">
          <h3>// 수익화 방향</h3>
          <ul className="plain-list">
            <li>초기: 직접 광고 문의</li>
            <li>성장: 카테고리 제휴</li>
            <li>안정화: 자동 광고 검토</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
