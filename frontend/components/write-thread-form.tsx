'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { createThread, deleteUpload, uploadImages } from '@/lib/api';
import { getBoardDisplayMeta } from '@/lib/board-meta';
import { addOwnedThread } from '@/lib/thread-activity';
import { CaptchaBox, type CaptchaBoxHandle } from './captcha-box';
import { UploadPicker } from './upload-picker';

type BoardOption = {
  slug: string;
  name: string;
};

export function WriteThreadForm({ boards }: { boards: BoardOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [boardSlug, setBoardSlug] = useState(
    searchParams.get('board') ?? boards[0]?.slug ?? 'game',
  );
  const [authorName, setAuthorName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSage, setIsSage] = useState(false);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [hasNsfw, setHasNsfw] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const captchaRef = useRef<CaptchaBoxHandle>(null);

  useEffect(() => {
    const board = searchParams.get('board');
    if (board) {
      setBoardSlug(board);
    }
  }, [searchParams]);

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);

    if (!captchaValid) {
      setPending(false);
      setError('보안 문자가 일치하지 않습니다.');
      void captchaRef.current?.refresh();
      return;
    }

    let uploadedItems: Array<{ id: number; deleteToken?: string }> = [];

    try {
      const uploads =
        files.length > 0 ? await uploadImages(files) : { items: [], total: 0 };

      uploadedItems = uploads.items;
      setUploadedNames(uploads.items.map((item) => item.originalName));

      const result = await createThread({
        boardSlug,
        authorName: authorName || undefined,
        title,
        content,
        editPassword,
        isSage,
        hasSpoiler,
        hasNsfw,
        attachmentIds: uploadedItems.map((item) => item.id),
        attachmentDeleteTokens: uploadedItems.map((item) => item.deleteToken ?? ''),
        captchaToken: captchaCode,
        captchaAnswer,
      });

      setStatus('스레드가 생성되었습니다. 상세 페이지로 이동합니다.');
      addOwnedThread(result.item);
      router.push(`/threads/${result.item.id}`);
      router.refresh();
    } catch (submitError) {
      await Promise.all(
        uploadedItems.map((item) => deleteUpload(item.id, item.deleteToken).catch(() => undefined)),
      );
      setError(
        submitError instanceof Error
          ? submitError.message
          : '스레드 작성 중 오류가 발생했습니다.',
      );
      void captchaRef.current?.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-card" onSubmit={onSubmit}>
      <div className="form-header">
        <div className="form-header-icon">/{boardSlug}/</div>
        <div className="form-header-info">
          <h1>새 스레드 작성</h1>
          <p>// 익명으로 게시합니다 · POST_ANONYMOUSLY</p>
        </div>
      </div>
      <div className="form-body">
        <div className="form-grid">
          {error ? <div className="status-box error">{error}</div> : null}
          {status ? <div className="status-box success">{status}</div> : null}
          <div className="inline-fields">
            <div className="field">
              <label>게시판</label>
              <select value={boardSlug} onChange={(event) => setBoardSlug(event.target.value)}>
                {boards.map((board) => (
                  <option key={board.slug} value={board.slug}>
                    /{board.slug}/ {getBoardDisplayMeta(board).name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>이름</label>
              <input
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="비워두면 익명"
              />
            </div>
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
            <label>제목</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="스레드 제목"
              required
            />
          </div>
          <div className="field">
            <label>본문</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={'> 로 시작하면 greentext로 표시됩니다.\n>>123 형식으로 특정 댓글을 언급할 수 있습니다.'}
              required
            />
          </div>
          <UploadPicker
            files={files}
            uploadedNames={uploadedNames}
            onChange={setFiles}
            onRemove={removeFile}
          />
          <div className="checkbox-row">
            <label className="checkbox-item">
              <input
                checked={isSage}
                type="checkbox"
                onChange={(event) => setIsSage(event.target.checked)}
              />
              sage
            </label>
            <label className="checkbox-item">
              <input
                checked={hasSpoiler}
                type="checkbox"
                onChange={(event) => setHasSpoiler(event.target.checked)}
              />
              스포일러
            </label>
            <label className="checkbox-item">
              <input
                checked={hasNsfw}
                type="checkbox"
                onChange={(event) => setHasNsfw(event.target.checked)}
              />
              성인 주의
            </label>
          </div>
          <CaptchaBox
            ref={captchaRef}
            onValidityChange={({ answer, code, isValid }) => {
              setCaptchaAnswer(answer);
              setCaptchaCode(code);
              setCaptchaValid(isValid);
            }}
          />
          <div className="status-box">
            개인정보, 불법 촬영물, 불법 콘텐츠는 금지됩니다. 업로드 실패나 작성 실패 시 첨부 이미지는 자동 정리됩니다.
          </div>
          <div className="toolbar">
            <div className="muted-row">짧은 시간 반복 작성은 서버에서 제한됩니다.</div>
            <button className="submit-btn primary" disabled={pending} type="submit">
              {pending ? '등록 중...' : '스레드 등록'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
