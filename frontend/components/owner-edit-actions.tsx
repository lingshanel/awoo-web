'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deletePost, deleteThread, updatePost, updateThread } from '@/lib/api';

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

export function OwnerEditActions(props: OwnerEditActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(props.target === 'thread' ? props.title : '');
  const [content, setContent] = useState(props.content);
  const [editPassword, setEditPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setPending(true);
    setError(null);

    try {
      if (props.target === 'thread') {
        await updateThread(props.threadId, { title, content, editPassword });
      } else {
        await updatePost(props.threadId, props.postId, { content, editPassword });
      }

      setOpen(false);
      setEditPassword('');
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '수정에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm('정말 삭제할까요? 삭제 후에는 목록에서 숨김 처리됩니다.')) {
      return;
    }

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
      setOpen(false);
      setEditPassword('');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.');
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
          {error ? <div className="status-box error">{error}</div> : null}
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
          <div className="action-panel">
            <button className="reaction-btn" disabled={pending} type="button" onClick={handleSave}>
              {pending ? '처리 중...' : '수정 저장'}
            </button>
            <button className="reaction-btn" disabled={pending} type="button" onClick={handleDelete}>
              삭제
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
