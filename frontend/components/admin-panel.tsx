'use client';

import { useState } from 'react';
import {
  adminHideTarget,
  adminResolveReport,
  getAdminReports,
  type ReportItem,
} from '@/lib/api';

export function AdminPanel() {
  const [adminKey, setAdminKey] = useState('awoo-admin-1234');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadReports() {
    setPending(true);
    setError(null);
    try {
      const result = await getAdminReports(adminKey);
      setReports(result.items);
      setStatus(`신고 ${result.total}건을 불러왔습니다.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '불러오기 실패');
    } finally {
      setPending(false);
    }
  }

  async function handleHide(report: ReportItem) {
    setPending(true);
    setError(null);
    try {
      if (report.targetType === 'THREAD' && report.threadId) {
        await adminHideTarget('thread', report.threadId, adminKey, 'admin hide');
      }
      if (report.targetType === 'POST' && report.postId) {
        await adminHideTarget('post', report.postId, adminKey, 'admin hide');
      }
      await adminResolveReport(report.id, adminKey, false);
      await loadReports();
    } catch (hideError) {
      setError(hideError instanceof Error ? hideError.message : '숨김 처리 실패');
    } finally {
      setPending(false);
    }
  }

  async function handleResolve(reportId: number, hideTarget: boolean) {
    setPending(true);
    setError(null);
    try {
      await adminResolveReport(reportId, adminKey, hideTarget);
      await loadReports();
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : '해결 처리 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-layout">
      <div className="form-card">
        <div className="form-header">
          <div className="form-header-icon">/admin/</div>
          <div className="form-header-info">
            <h1>관리자 화면</h1>
            <p>// 신고 검토 · 숨김 처리</p>
          </div>
        </div>
        <div className="form-body">
          <div className="form-grid">
            {error ? <div className="status-box error">{error}</div> : null}
            {status ? <div className="status-box success">{status}</div> : null}
            <div className="field">
              <label>관리자 키</label>
              <input
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="x-admin-key"
              />
            </div>
            <div className="toolbar">
              <div className="muted-row">
                기본값은 개발용 예시입니다. 운영 환경에서는 반드시 교체해 주세요.
              </div>
              <button className="submit-btn primary" disabled={pending} type="button" onClick={loadReports}>
                {pending ? '불러오는 중...' : '신고 목록 불러오기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reports.map((report) => (
        <div key={report.id} className="report-item">
          <div className="reply-meta">
            <span>REPORT #{report.id}</span>
            <span>{report.targetType}</span>
            <span>STATUS {report.status}</span>
          </div>
          <div className="thread-preview" style={{ marginTop: 8 }}>
            {report.reason}
          </div>
          <div className="action-panel">
            <button className="reaction-btn" type="button" onClick={() => handleResolve(report.id, false)}>
              해결 처리
            </button>
            <button className="reaction-btn" type="button" onClick={() => handleResolve(report.id, true)}>
              해결 + 대상 숨김
            </button>
            <button className="reaction-btn" type="button" onClick={() => handleHide(report)}>
              바로 숨김
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
