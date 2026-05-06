'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { deletePost, deleteThread, updatePost, updateThread } from '@/lib/api';
import { CaptchaBox, type CaptchaBoxHandle } from './captcha-box';

type OwnerEditActionsProps =
  | {
      target: 'thread';
      threadId: number;
      title: string;
      content: string;
    }
  | {
      target: 'post';
      threadId: number;
      postId: number;
      content: string;
    };

type OwnerActionError = {
  title: string;
  message: string;
};

export function OwnerEditActions(props: OwnerEditActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(props.target === 'thread' ? props.title : '');
  const [content, setContent] = useState(props.content);
  const [editPassword, setEditPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<OwnerActionError | null>(null);
  const captchaRef = useRef<CaptchaBoxHandle>(null);

  useEffect(() => {
    if (!deleteOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDeleteOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteOpen]);

  async function handleSave() {
    setPending(true);
    setError(null);

    if (!captchaValid) {
      setPending(false);
      setError({
        title: '보안 문자를 확인해 주세요',
        message: '입력한 보안 문자가 화면의 문자와 일치하지 않습니다.',
      });
      void captchaRef.current?.refresh();
      return;
    }

    try {
      if (props.target === 'thread') {
        await updateThread(props.threadId, {
          title,
          content,
          editPassword,
          captchaToken: captchaCode,
          captchaAnswer,
        });
      } else {
        await updatePost(props.threadId, props.postId, {
          content,
          editPassword,
          captchaToken: captchaCode,
          captchaAnswer,
        });
      }

      setOpen(false);
      setEditPassword('');
      setCaptchaAnswer('');
      setCaptchaCode('');
      setCaptchaValid(false);
      router.refresh();
    } catch (saveError) {
      setError({
        title: '수정할 수 없습니다',
        message: saveError instanceof Error ? saveError.message : '수정에 실패했습니다.',
      });
      void captchaRef.current?.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError(null);

    try {
      if (props.target === 'thread') {
        await deleteThread(props.threadId, editPassword);
        router.push('/');
        router.refresh();
        return;
      }

      await deletePost(props.threadId, props.postId, editPassword);
      setDeleteOpen(false);
      setOpen(false);
      setEditPassword('');
      router.refresh();
    } catch (deleteError) {
      setError({
        title: '삭제할 수 없습니다',
        message: deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="owner-edit">
      <button className="reaction-btn" type="button" onClick={() => setOpen((current) => !current)}>
        수정/삭제
      </button>
      {open ? (
        <div className="owner-edit-panel">
          {error && !deleteOpen ? (
            <div className="owner-action-warning" role="alert">
              <strong>{error.title}</strong>
              <span>{error.message}</span>
            </div>
          ) : null}
          {props.target === 'thread' ? (
            <div className="field">
              <label>제목 수정</label>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          ) : null}
          <div className="field">
            <label>{props.target === 'thread' ? '본문 수정' : '댓글 수정'}</label>
            <textarea
              className="reply-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <div className="field">
            <label>작성 시 입력한 비밀번호</label>
            <input
              autoComplete="current-password"
              type="password"
              value={editPassword}
              onChange={(event) => setEditPassword(event.target.value)}
              placeholder="수정/삭제 비밀번호"
            />
          </div>
          <CaptchaBox
            ref={captchaRef}
            label="// 수정 보안 문자"
            onValidityChange={({ answer, code, isValid }) => {
              setCaptchaAnswer(answer);
              setCaptchaCode(code);
              setCaptchaValid(isValid);
            }}
          />
          <div className="action-panel">
            <button className="reaction-btn" disabled={pending} type="button" onClick={handleSave}>
              {pending ? '처리 중...' : '수정 저장'}
            </button>
            <button
              className="reaction-btn danger"
              disabled={pending}
              type="button"
              onClick={() => setDeleteOpen(true)}
            >
              삭제
            </button>
          </div>
        </div>
      ) : null}
      {deleteOpen ? (
        <div className="delete-modal-backdrop" onClick={() => setDeleteOpen(false)}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${props.target}-${props.threadId}${
              props.target === 'post' ? `-${props.postId}` : ''
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-modal-header">
              <div>
                <h2
                  id={`delete-title-${props.target}-${props.threadId}${
                    props.target === 'post' ? `-${props.postId}` : ''
                  }`}
                >
                  {props.target === 'thread' ? '스레드 삭제' : '댓글 삭제'}
                </h2>
                <p>
                  {props.target === 'thread'
                    ? '삭제하면 목록에서 숨김 처리됩니다.'
                    : '답글이 있는 댓글은 자리표시자로 남고, 답글은 유지됩니다.'}
                </p>
              </div>
              <button
                className="delete-modal-close"
                disabled={pending}
                type="button"
                aria-label="삭제 확인 팝업 닫기"
                onClick={() => setDeleteOpen(false)}
              >
                x
              </button>
            </div>
            <div className="delete-modal-body">
              <span className="delete-modal-mark">!</span>
              <div>
                <strong>정말 삭제할까요?</strong>
                <p>작성 시 입력한 비밀번호가 맞아야 삭제가 진행됩니다.</p>
              </div>
            </div>
            {error ? (
              <div className="owner-action-warning delete-modal-warning" role="alert">
                <strong>{error.title}</strong>
                <span>{error.message}</span>
              </div>
            ) : null}
            <div className="delete-modal-actions">
              <button className="reaction-btn" disabled={pending} type="button" onClick={() => setDeleteOpen(false)}>
                취소
              </button>
              <button className="reaction-btn danger solid" disabled={pending} type="button" onClick={handleDelete}>
                {pending ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
