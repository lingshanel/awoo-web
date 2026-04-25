'use client';

import { ChangeEvent, useEffect, useMemo } from 'react';

export function UploadPicker({
  files,
  uploadedNames,
  onChange,
  onRemove,
}: {
  files: File[];
  uploadedNames?: string[];
  onChange: (files: File[]) => void;
  onRemove?: (index: number) => void;
}) {
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, 4);
    onChange(nextFiles);
  }

  return (
    <div className="field">
      <label>이미지 첨부</label>
      <label className="upload-drop">
        <strong>클릭하거나 이미지를 여기로 드래그해 주세요</strong>
        <span>JPG, PNG, GIF, WEBP · 최대 4개</span>
        <input accept="image/*" hidden multiple type="file" onChange={handleFileChange} />
      </label>
      {previews.length ? (
        <div className="attachment-strip">
          {previews.map((preview, index) => (
            <div key={preview.name} className="attachment-card">
              <img alt={preview.name} src={preview.url} />
              <span>{preview.name}</span>
              {onRemove ? (
                <button
                  className="reaction-btn"
                  style={{ marginTop: 6 }}
                  type="button"
                  onClick={() => onRemove(index)}
                >
                  제거
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {uploadedNames?.length ? (
        <div className="upload-list">
          {uploadedNames.map((name) => (
            <div key={name} className="upload-chip">
              <span>업로드 완료</span>
              <strong>{name}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
