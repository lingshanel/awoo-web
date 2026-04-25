'use client';

import { useState } from 'react';
import type { Attachment } from '@/lib/api';

export function LightboxGallery({ attachments }: { attachments: Attachment[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!attachments.length) {
    return null;
  }

  const selected =
    selectedIndex !== null && attachments[selectedIndex]
      ? attachments[selectedIndex]
      : null;

  return (
    <>
      <div className="attachment-strip">
        {attachments.map((attachment, index) => (
          <button
            key={attachment.id}
            className="attachment-card"
            style={{ cursor: 'pointer' }}
            type="button"
            onClick={() => setSelectedIndex(index)}
          >
            <img alt={attachment.originalName} src={attachment.thumbnailUrl || attachment.url} />
            <span>{attachment.originalName}</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: 'min(1200px, 92vw)', maxHeight: '90vh' }}
          >
            <img
              alt={selected.originalName}
              src={selected.url}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '80vh',
                border: '1px solid var(--border)',
                background: 'var(--bg-panel)',
              }}
            />
            <div className="news-ticker" style={{ marginTop: 12 }}>
              <span className="label">[IMG]</span>
              <span>{selected.originalName}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
