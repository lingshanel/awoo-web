'use client';

import { Fragment, MouseEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Attachment } from '@/lib/api';

export type RichTextReference = {
  id: number;
  displayNumber: number;
  authorName: string;
  content: string;
  createdAt: string;
  attachments: Attachment[];
};

type HoverPreview = {
  targetId: number;
  left: number;
  top: number;
  post: RichTextReference;
};

function classifyLine(line: string) {
  if (line.startsWith('>')) {
    return 'greentext';
  }

  return '';
}

function isElementInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= viewportWidth
  );
}

function scrollToPost(targetId: number) {
  const target = document.getElementById(`post-${targetId}`);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function PostRichText({
  content,
  references = {},
}: {
  content: string;
  references?: Record<number, RichTextReference>;
}) {
  const lines = content.split('\n');
  const [hoveredTargetId, setHoveredTargetId] = useState<number | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);

  useEffect(() => {
    if (hoveredTargetId === null) {
      return;
    }

    const target = document.getElementById(`post-${hoveredTargetId}`);
    if (!target) {
      return;
    }

    target.classList.add('mention-target-active');

    return () => {
      target.classList.remove('mention-target-active');
    };
  }, [hoveredTargetId]);

  const parsedLines = useMemo(() => {
    return lines.map((line) => {
      const parts = line.split(/(>>\d+|@\S+)/g).filter(Boolean);
      let currentReplyId: number | null = null;

      return parts.map((part, index) => {
        if (/^>>\d+$/.test(part)) {
          currentReplyId = Number(part.slice(2));
          return {
            type: 'reply-ref' as const,
            value: part,
            key: `${part}-${index}`,
            targetId: currentReplyId,
          };
        }

        if (/^@\S+$/.test(part)) {
          return {
            type: 'mention' as const,
            value: part,
            key: `${part}-${index}`,
            targetId: currentReplyId,
          };
        }

        if (part.trim().length > 0) {
          currentReplyId = null;
        }

        return {
          type: 'text' as const,
          value: part,
          key: `${part}-${index}`,
        };
      });
    });
  }, [lines]);

  function handleMentionEnter(event: MouseEvent<HTMLAnchorElement>, targetId: number) {
    const target = document.getElementById(`post-${targetId}`);
    const referencePost = references[targetId];

    if (!target || !referencePost) {
      setHoveredTargetId(null);
      setHoverPreview(null);
      return;
    }

    setHoveredTargetId(targetId);

    if (isElementInViewport(target)) {
      setHoverPreview(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPreview({
      targetId,
      post: referencePost,
      left: Math.min(rect.left, window.innerWidth - 340),
      top: rect.bottom + 10,
    });
  }

  function handleMentionLeave() {
    setHoveredTargetId(null);
    setHoverPreview(null);
  }

  function handleMentionClick(event: MouseEvent<HTMLAnchorElement>, targetId: number) {
    event.preventDefault();
    scrollToPost(targetId);
    window.location.hash = `post-${targetId}`;
  }

  return (
    <>
      {parsedLines.map((tokens, lineIndex) => {
        const className = classifyLine(lines[lineIndex]);

        const lineContent = tokens.map((token) => {
          if (token.type === 'reply-ref') {
            return (
              <Link className="reply-ref" href={`#post-${token.targetId}`} key={token.key}>
                {token.value}
              </Link>
            );
          }

          if (token.type === 'mention' && token.targetId && references[token.targetId]) {
            return (
              <Link
                className="reply-mention mention-link"
                href={`#post-${token.targetId}`}
                key={token.key}
                onClick={(event) => handleMentionClick(event, token.targetId!)}
                onMouseEnter={(event) => handleMentionEnter(event, token.targetId!)}
                onMouseLeave={handleMentionLeave}
              >
                {token.value}
              </Link>
            );
          }

          if (token.type === 'mention') {
            return (
              <span className="reply-mention" key={token.key}>
                {token.value}
              </span>
            );
          }

          return <Fragment key={token.key}>{token.value}</Fragment>;
        });

        return (
          <Fragment key={`${lineIndex}-${lines[lineIndex]}`}>
            {className ? <span className={className}>{lineContent}</span> : lineContent}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </Fragment>
        );
      })}
      {hoverPreview ? (
        <div
          className="mention-preview"
          style={{
            left: hoverPreview.left,
            top: hoverPreview.top,
          }}
        >
          <div className="mention-preview-meta">
            <span>#{hoverPreview.post.displayNumber}</span>
            <span>{hoverPreview.post.authorName}</span>
          </div>
          <div className="mention-preview-body">{hoverPreview.post.content}</div>
          {hoverPreview.post.attachments.length ? (
            <div className="mention-preview-images">
              {hoverPreview.post.attachments.map((attachment) => (
                <img
                  key={attachment.id}
                  alt={attachment.originalName}
                  className="mention-preview-image"
                  src={attachment.thumbnailUrl || attachment.url}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
