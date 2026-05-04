'use client';

import { useEffect, useState } from 'react';
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
  const [notice, setNotice] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);
  const [pending, setPending] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!reportOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setReportOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportOpen]);

  function notify(message: string, tone: 'success' | 'error' = 'success') {
    setNotice({ message, tone });
  }

  async function handleReact() {
    setPending(true);
    try {
      const result = await reactToTarget(target, id, 'like');
      notify(result.message ?? '추천이 반영되었습니다.');
      router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : '추천 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setPending(false);
    }
  }

  async function handleReportSubmit() {
    const reason = reportReason.trim();
    if (!reason) {
      notify('신고 사유를 입력해 주세요.', 'error');
      return;
    }

    setPending(true);
    try {
      await reportTarget(target, id, reason);
      notify('신고가 접수되었습니다.');
      setReportReason('');
      setReportOpen(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : '신고 처리 중 오류가 발생했습니다.', 'error');
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
        <div className="report-modal-backdrop" onClick={() => setReportOpen(false)}>
          <div
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-title-${target}-${id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="report-modal-header">
              <div>
                <h2 id={`report-title-${target}-${id}`}>신고하기</h2>
                <p>운영 검토가 필요한 이유를 짧게 남겨주세요.</p>
              </div>
              <button
                className="report-modal-close"
                disabled={pending}
                type="button"
                aria-label="신고 팝업 닫기"
                onClick={() => setReportOpen(false)}
              >
                x
              </button>
            </div>
            <textarea
              className="report-textarea"
              placeholder="신고 사유를 입력해 주세요"
              value={reportReason}
              autoFocus
              onChange={(event) => setReportReason(event.target.value)}
            />
            <div className="report-actions">
              <button className="reaction-btn" disabled={pending} type="button" onClick={handleReportSubmit}>
                {pending ? '접수 중...' : '접수'}
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
        </div>
      ) : null}
      {notice ? (
        <div className={`reaction-toast ${notice.tone}`} role="status" aria-live="polite">
          <span className="reaction-toast-icon">{notice.tone === 'success' ? '+' : '!'}</span>
          <span>{notice.message}</span>
        </div>
      ) : null}
    </div>
  );
}
