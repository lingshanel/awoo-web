'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  adminHideTarget,
  adminLogin,
  adminLogout,
  adminResolveReport,
  changeAdminPassword,
  createAdminBan,
  getAdminBans,
  getAdminLogs,
  getAdminMe,
  getAdminReports,
  getAdminSummary,
  revokeAdminBan,
  type AdminActionLogItem,
  type AdminBanItem,
  type AdminSummary,
  type AdminUser,
  type ReportItem,
} from '@/lib/api';

const reportFilters = [
  { value: 'pending', label: '대기' },
  { value: 'all', label: '전체' },
  { value: 'resolved', label: '해결' },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getTargetPreview(report: ReportItem) {
  if (report.targetType === 'THREAD' && report.thread) {
    return {
      href: `/threads/${report.thread.id}`,
      title: report.thread.title,
      body: report.thread.content,
      boardSlug: report.thread.board.slug,
      isDeleted: report.thread.isDeleted,
      authorHash: report.thread.authorHash,
      authorIpHash: report.thread.authorIpHash,
    };
  }

  if (report.targetType === 'POST' && report.post) {
    return {
      href: `/threads/${report.post.threadId}`,
      title: report.post.thread.title,
      body: report.post.content,
      boardSlug: report.post.thread.board.slug,
      isDeleted: report.post.isDeleted,
      authorHash: report.post.authorHash,
      authorIpHash: report.post.authorIpHash,
    };
  }

  return {
    href: '#',
    title: '대상 정보를 불러올 수 없습니다.',
    body: '',
    boardSlug: 'unknown',
    isDeleted: false,
    authorHash: null,
    authorIpHash: null,
  };
}

export function AdminPanel() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [logs, setLogs] = useState<AdminActionLogItem[]>([]);
  const [bans, setBans] = useState<AdminBanItem[]>([]);
  const [filter, setFilter] = useState<(typeof reportFilters)[number]['value']>('pending');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    async function restoreSession() {
      try {
        const result = await getAdminMe();
        setUser(result.user);
        await loadDashboard(filter);
      } catch {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    void restoreSession();
  }, []);

  async function loadDashboard(nextFilter = filter) {
    setPending(true);
    setError(null);

    try {
      const [summaryResult, reportResult, logsResult, bansResult] = await Promise.all([
        getAdminSummary(),
        getAdminReports(nextFilter),
        getAdminLogs(),
        getAdminBans(),
      ]);

      setSummary(summaryResult);
      setReports(reportResult.items);
      setLogs(logsResult.items);
      setBans(bansResult.items);
      setStatus(`신고 ${reportResult.total}건을 불러왔습니다.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '관리자 데이터를 불러오지 못했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleLogin() {
    setPending(true);
    setError(null);
    setStatus(null);

    try {
      const result = await adminLogin(username, password);
      setUser(result.user);
      setPassword('');
      setStatus(result.message);
      await loadDashboard(filter);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError(null);

    try {
      await adminLogout();
      setUser(null);
      setSummary(null);
      setReports([]);
      setLogs([]);
      setBans([]);
      setStatus(null);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : '로그아웃에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function changeFilter(nextFilter: typeof filter) {
    setFilter(nextFilter);
    await loadDashboard(nextFilter);
  }

  async function handleResolve(reportId: number, hideTarget: boolean) {
    setPending(true);
    setError(null);

    try {
      await adminResolveReport(reportId, hideTarget);
      await loadDashboard(filter);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : '신고 처리에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleHide(report: ReportItem) {
    setPending(true);
    setError(null);

    try {
      if (report.targetType === 'THREAD' && report.threadId) {
        await adminHideTarget('thread', report.threadId, 'admin hide');
      }
      if (report.targetType === 'POST' && report.postId) {
        await adminHideTarget('post', report.postId, 'admin hide');
      }
      await adminResolveReport(report.id, false);
      await loadDashboard(filter);
    } catch (hideError) {
      setError(hideError instanceof Error ? hideError.message : '숨김 처리에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleBan(
    banType: 'AUTHOR_HASH' | 'IP_HASH',
    valueHash: string | null | undefined,
    reason: string,
  ) {
    if (!valueHash) {
      setError('차단할 해시 정보가 없습니다.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      await createAdminBan({
        banType,
        valueHash,
        reason,
        expiresInHours: 24 * 7,
      });
      await loadDashboard(filter);
    } catch (banError) {
      setError(banError instanceof Error ? banError.message : '차단 등록에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleRevokeBan(id: number) {
    setPending(true);
    setError(null);

    try {
      await revokeAdminBan(id);
      await loadDashboard(filter);
    } catch (banError) {
      setError(banError instanceof Error ? banError.message : '차단 해제에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleChangePassword() {
    setPending(true);
    setError(null);

    try {
      const result = await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setStatus(result.message);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="admin-layout">
        <div className="status-box">관리자 세션을 확인하는 중입니다.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-layout">
        <div className="form-card admin-login-card">
          <div className="form-header">
            <div className="form-header-icon">/admin/</div>
            <div className="form-header-info">
              <h1>관리자 로그인</h1>
              <p>// httpOnly 세션 쿠키로 운영 콘솔에 접속합니다.</p>
            </div>
          </div>
          <div className="form-body">
            <div className="form-grid">
              {error ? <div className="status-box error">{error}</div> : null}
              <div className="field">
                <label>아이디</label>
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="field">
                <label>비밀번호</label>
                <input
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="관리자 비밀번호"
                  type="password"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleLogin();
                    }
                  }}
                />
              </div>
              <button
                className="submit-btn primary"
                disabled={pending}
                type="button"
                onClick={handleLogin}
              >
                {pending ? '로그인 중...' : '관리자 화면 열기'}
              </button>
              <div className="muted-row">
                운영 환경에서는 긴 비밀번호와 HTTPS 배포가 필요합니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <section className="admin-command">
        <div>
          <div className="section-header">관리자 콘솔</div>
          <div className="muted-row">
            {user.username} · {user.role} 권한으로 접속 중입니다.
          </div>
        </div>
        <div className="toolbar-group">
          <button className="toolbar-button" disabled={pending} type="button" onClick={() => loadDashboard()}>
            새로고침
          </button>
          <button className="toolbar-button danger" type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </section>

      {error ? <div className="status-box error">{error}</div> : null}
      {status ? <div className="status-box success">{status}</div> : null}

      <section className="admin-summary-grid">
        <div className="admin-stat-card">
          <span>대기 신고</span>
          <strong>{summary?.pendingReports ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>해결 신고</span>
          <strong>{summary?.resolvedReports ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>활성 스레드</span>
          <strong>{summary?.activeThreads ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>숨김 대상</span>
          <strong>{(summary?.hiddenThreads ?? 0) + (summary?.hiddenPosts ?? 0)}</strong>
        </div>
        <div className="admin-stat-card">
          <span>오늘 스레드</span>
          <strong>{summary?.todayThreads ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>오늘 댓글</span>
          <strong>{summary?.todayPosts ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>오늘 신고</span>
          <strong>{summary?.todayReports ?? '-'}</strong>
        </div>
        <div className="admin-stat-card">
          <span>활성 차단</span>
          <strong>{summary?.activeBans ?? '-'}</strong>
        </div>
      </section>

      <section className="admin-queue-header">
        <div className="toolbar-group">
          {reportFilters.map((item) => (
            <button
              key={item.value}
              className={`toolbar-button ${filter === item.value ? 'active' : ''}`}
              disabled={pending}
              type="button"
              onClick={() => changeFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-report-list">
        {reports.length ? (
          reports.map((report) => {
            const target = getTargetPreview(report);

            return (
              <article key={report.id} className="report-item admin-report-card">
                <div className="admin-report-top">
                  <div className="reply-meta">
                    <span>REPORT #{report.id}</span>
                    <span>{report.targetType === 'THREAD' ? '스레드' : '댓글'}</span>
                    <span>{formatDate(report.createdAt)}</span>
                    <span className={`admin-status-pill status-${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </div>
                  <span className="thread-board-tag">/{target.boardSlug}/</span>
                </div>

                <div className="admin-report-reason">{report.reason}</div>

                <div className="admin-target-box">
                  <div className="admin-target-title">
                    {target.href !== '#' ? (
                      <Link href={target.href}>{target.title}</Link>
                    ) : (
                      target.title
                    )}
                    {target.isDeleted ? <span className="admin-status-pill status-resolved">숨김됨</span> : null}
                  </div>
                  <div className="thread-preview">{target.body}</div>
                </div>

                <div className="action-panel">
                  <button
                    className="reaction-btn"
                    disabled={pending || report.status === 'RESOLVED'}
                    type="button"
                    onClick={() => handleResolve(report.id, false)}
                  >
                    해결 처리
                  </button>
                  <button
                    className="reaction-btn"
                    disabled={pending || report.status === 'RESOLVED'}
                    type="button"
                    onClick={() => handleResolve(report.id, true)}
                  >
                    숨김 + 해결
                  </button>
                  <button
                    className="reaction-btn"
                    disabled={pending || target.isDeleted}
                    type="button"
                    onClick={() => handleHide(report)}
                  >
                    바로 숨김
                  </button>
                  <button
                    className="reaction-btn"
                    disabled={pending || !target.authorHash}
                    type="button"
                    onClick={() => handleBan('AUTHOR_HASH', target.authorHash, `신고 #${report.id} 작성자 해시 차단`)}
                  >
                    작성자 차단
                  </button>
                  <button
                    className="reaction-btn"
                    disabled={pending || !target.authorIpHash}
                    type="button"
                    onClick={() => handleBan('IP_HASH', target.authorIpHash, `신고 #${report.id} IP 해시 차단`)}
                  >
                    IP 차단
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="report-item">
            <div className="thread-title">표시할 신고가 없습니다.</div>
            <div className="thread-preview">대기 신고가 없으면 운영 큐는 비어 있습니다.</div>
          </div>
        )}
      </section>

      <section className="admin-tools-grid">
        <div className="report-item admin-report-card">
          <div className="section-header">차단 목록</div>
          {bans.length ? (
            bans.slice(0, 8).map((ban) => (
              <div key={ban.id} className="admin-list-row">
                <div>
                  <strong>{ban.banType}</strong>
                  <span>{ban.reason}</span>
                </div>
                <button className="reaction-btn" disabled={pending} type="button" onClick={() => handleRevokeBan(ban.id)}>
                  해제
                </button>
              </div>
            ))
          ) : (
            <div className="thread-preview">활성 차단이 없습니다.</div>
          )}
        </div>

        <div className="report-item admin-report-card">
          <div className="section-header">관리 로그</div>
          {logs.length ? (
            logs.slice(0, 8).map((log) => (
              <div key={log.id} className="admin-list-row">
                <div>
                  <strong>{log.actionType}</strong>
                  <span>
                    {log.user?.username ?? 'system'} · {formatDate(log.createdAt)}
                  </span>
                </div>
                {log.targetType ? <span className="admin-status-pill">{log.targetType} {log.targetId}</span> : null}
              </div>
            ))
          ) : (
            <div className="thread-preview">기록된 관리 로그가 없습니다.</div>
          )}
        </div>
      </section>

      <section className="admin-security-strip">
        <div className="admin-security-copy">
          <span>SECURITY</span>
          <strong>관리자 비밀번호 변경</strong>
        </div>
        <div className="admin-password-fields">
          <input
            aria-label="현재 비밀번호"
            autoComplete="current-password"
            value={currentPassword}
            type="password"
            placeholder="현재 비밀번호"
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            aria-label="새 비밀번호"
            autoComplete="new-password"
            value={newPassword}
            type="password"
            placeholder="새 비밀번호"
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <button className="toolbar-button" disabled={pending} type="button" onClick={handleChangePassword}>
          변경
        </button>
      </section>
    </div>
  );
}
