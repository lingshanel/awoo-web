'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { getCaptchaChallenge } from '@/lib/api';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createCaptchaCode() {
  return Array.from({ length: 5 }, () => {
    const index = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    return CAPTCHA_CHARS[index];
  }).join('');
}

export type CaptchaBoxHandle = {
  refresh: () => Promise<void>;
};

export const CaptchaBox = forwardRef<CaptchaBoxHandle, {
  label?: string;
  onValidityChange?: (payload: {
    isValid: boolean;
    answer: string;
    code: string;
  }) => void;
}>(function CaptchaBox({
  label = '// 보안 확인',
  onValidityChange,
}, ref) {
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  const normalizedAnswer = useMemo(() => answer.trim().toUpperCase(), [answer]);
  const isValid = Boolean(token) && normalizedAnswer.length > 0 && normalizedAnswer === code;

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    onValidityChange?.({
      isValid,
      answer: normalizedAnswer,
      code: token,
    });
  }, [isValid, normalizedAnswer, onValidityChange, token]);

  useImperativeHandle(ref, () => ({
    refresh,
  }));

  async function refresh() {
    setLoading(true);
    setAnswer('');
    setCode('');
    setToken('');

    try {
      const challenge = await getCaptchaChallenge();
      setCode(challenge.code);
      setToken(challenge.token);
    } catch {
      setCode('ERROR');
      setToken('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="captcha-box">
        <div className="captcha-puzzle">{code || '-----'}</div>
        <button className="captcha-refresh" disabled={loading} type="button" onClick={refresh}>
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
});
