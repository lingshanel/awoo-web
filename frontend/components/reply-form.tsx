'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPost, deleteUpload, uploadImages } from '@/lib/api';
import { CaptchaBox } from './captcha-box';
import { UploadPicker } from './upload-picker';

export function ReplyForm({
  threadId,
  replyTo,
}: {
  threadId: number;
  replyTo?: { id: number; authorName: string } | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!replyTo) {
      return;
    }

    setContent((current) => {
      const mention = `>>${replyTo.id} @${replyTo.authorName}\n`;
      const plainMention = `>>${replyTo.id}\n`;

      if (current.startsWith(mention)) {
        return current;
      }

      if (current.startsWith(plainMention)) {
        return current.replace(plainMention, mention);
      }

      return `${mention}${current}`;
    });
  }, [replyTo]);

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (!captchaValid) {
      setPending(false);
      setError('보안 문자가 일치하지 않습니다.');
      return;
    }

    let uploadedIds: number[] = [];

    try {
      const uploads =
        files.length > 0 ? await uploadImages(files) : { items: [], total: 0 };

      uploadedIds = uploads.items.map((item) => item.id);

      await createPost(threadId, {
        content,
        authorName: authorName || undefined,
        editPassword,
        parentPostId: replyTo?.id,
        attachmentIds: uploadedIds,
      });

      setContent('');
      setAuthorName('');
      setEditPassword('');
      setFiles([]);
      router.push(`/threads/${threadId}`);
      router.refresh();
    } catch (submitError) {
      await Promise.all(uploadedIds.map((id) => deleteUpload(id).catch(() => undefined)));
      setError(
        submitError instanceof Error
          ? submitError.message
          : '댓글 등록 중 오류가 발생했습니다.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="reply-box" id="reply-form" onSubmit={onSubmit}>
      <div className="reply-section-title">// 댓글 작성</div>
      <div className="reply-form-body">
        <div className="form-grid">
          {error ? <div className="status-box error">{error}</div> : null}
          {replyTo ? (
            <div className="reply-target-box">
              <div className="reply-target-text">
                #{replyTo.id} {replyTo.authorName} 님에게 답글 작성 중입니다.
              </div>
              <button
                className="reaction-btn"
                type="button"
                onClick={() => router.push(`/threads/${threadId}`)}
              >
                답글 해제
              </button>
            </div>
          ) : null}
          <div className="field">
            <label>이름</label>
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="비워두면 익명"
            />
          </div>
          <div className="field">
            <label>수정/삭제 비밀번호</label>
            <input
              autoComplete="new-password"
              minLength={4}
              maxLength={40}
              type="password"
              value={editPassword}
              onChange={(event) => setEditPassword(event.target.value)}
              placeholder="나중에 직접 수정/삭제할 때 사용합니다."
              required
            />
          </div>
          <div className="field">
            <label>내용</label>
            <textarea
              className="reply-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={'> 로 시작하면 greentext로 표시됩니다.\n>>123 @익명2 형식으로 답글 대상을 적을 수 있습니다.'}
              required
            />
          </div>
          <UploadPicker files={files} onChange={setFiles} onRemove={removeFile} />
          <CaptchaBox
            label="// 보안 문자"
            onValidityChange={({ isValid }) => {
              setCaptchaValid(isValid);
            }}
          />
          <div className="toolbar">
            <div className="muted-row">짧은 시간 반복 댓글 작성은 일시 제한됩니다.</div>
            <button className="submit-btn primary" disabled={pending} type="submit">
              {pending ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
