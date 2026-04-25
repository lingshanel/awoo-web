'use client';

import { useEffect, useMemo, useState } from 'react';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createCaptchaCode() {
  return Array.from({ length: 5 }, () => {
    const index = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    return CAPTCHA_CHARS[index];
  }).join('');
}

export function CaptchaBox({
  label = '// 보안 확인',
  onValidityChange,
}: {
  label?: string;
  onValidityChange?: (payload: {
    isValid: boolean;
    answer: string;
    code: string;
  }) => void;
}) {
  const [code, setCode] = useState(() => createCaptchaCode());
  const [answer, setAnswer] = useState('');

  const normalizedAnswer = useMemo(() => answer.trim().toUpperCase(), [answer]);
  const isValid = normalizedAnswer.length > 0 && normalizedAnswer === code;

  useEffect(() => {
    onValidityChange?.({
      isValid,
      answer: normalizedAnswer,
      code,
    });
  }, [code, isValid, normalizedAnswer, onValidityChange]);

  function refresh() {
    setCode(createCaptchaCode());
    setAnswer('');
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="captcha-box">
        <div className="captcha-puzzle">{code}</div>
        <button className="captcha-refresh" type="button" onClick={refresh}>
          새로고침
        </button>
        <input
          className="captcha-input"
          placeholder="위 문자를 입력해 주세요"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
        />
        <div className="captcha-hint">대소문자는 구분하지 않습니다.</div>
      </div>
    </div>
  );
}
