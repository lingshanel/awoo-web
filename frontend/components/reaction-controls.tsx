'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reactToTarget, reportTarget } from '@/lib/api';

export function ReactionControls({
  target,
  id,
}: {
  target: 'thread' | 'post';
  id: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  async function handleReact() {
    setPending(true);
    try {
      const result = await reactToTarget(target, id, 'like');
      setStatus(result.message ?? '추천이 반영되었습니다.');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '추천 처리 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleReportSubmit() {
    const reason = reportReason.trim();
    if (!reason) {
      setStatus('신고 사유를 입력해 주세요.');
      return;
    }

    setPending(true);
    try {
      await reportTarget(target, id, reason);
      setStatus('신고가 접수되었습니다.');
      setReportReason('');
      setReportOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '신고 처리 중 오류가 발생했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="reaction-controls">
      <div className="action-panel">
        <button className="reaction-btn" disabled={pending} type="button" onClick={handleReact}>
          {pending ? '처리 중...' : '추천'}
        </button>
        <button
          className="reaction-btn"
          disabled={pending}
          type="button"
          onClick={() => setReportOpen((current) => !current)}
        >
          신고
        </button>
      </div>
      {reportOpen ? (
        <div className="report-box">
          <textarea
            className="report-textarea"
            placeholder="신고 사유를 입력해 주세요"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
          />
          <div className="report-actions">
            <button className="reaction-btn" disabled={pending} type="button" onClick={handleReportSubmit}>
              접수
            </button>
            <button
              className="reaction-btn"
              disabled={pending}
              type="button"
              onClick={() => {
                setReportOpen(false);
                setReportReason('');
              }}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
      {status ? <div className="status-box" style={{ marginTop: 8 }}>{status}</div> : null}
    </div>
  );
}
