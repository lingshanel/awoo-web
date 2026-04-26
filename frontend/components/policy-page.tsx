type PolicySection = {
  title: string;
  body: string;
};

export function PolicyPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
}) {
  return (
    <div className="page-body">
      <main className="main-column">
        <section className="board-header">
          <div>
            <div className="board-tag">{eyebrow}</div>
            <div className="board-name">// {title}</div>
          </div>
        </section>
        <div className="policy-page">
          <p className="policy-lead">{description}</p>
          {sections.map((section) => (
            <section key={section.title} className="policy-section">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <aside className="sidebar">
        <div className="sidebar-widget">
          <h3>// 운영</h3>
          <ul className="plain-list">
            <li>정책은 공개 운영 전 계속 보강됩니다.</li>
            <li>신고와 문의는 운영자가 확인합니다.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
