import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth.store.js';
import { api } from '../../lib/api.js';
import type { UserPublic } from '@bethflow/shared';
import { IconMail, IconCheck, IconAlertCircle } from '../../components/ui/icons.js';

const DIGIT_COUNT = 6;

export function VerifyEmailPage() {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const search = useSearch({ strict: false }) as { email?: string };
  const email = search.email ?? '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const focusNext = (idx: number) => inputRefs.current[idx + 1]?.focus();
  const focusPrev = (idx: number) => inputRefs.current[idx - 1]?.focus();

  const handleChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError('');
    if (digit && idx < DIGIT_COUNT - 1) focusNext(idx);
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else {
        focusPrev(idx);
      }
    } else if (e.key === 'ArrowLeft') {
      focusPrev(idx);
    } else if (e.key === 'ArrowRight') {
      focusNext(idx);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = Array(DIGIT_COUNT).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? '';
    setDigits(next);
    setError('');
    const focusIdx = Math.min(pasted.length, DIGIT_COUNT - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < DIGIT_COUNT) {
      setError('Masukkan kode 6 digit terlebih dahulu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{
        success: boolean;
        data: { user: UserPublic; accessToken: string; expiresIn: number };
      }>('/auth/verify-otp', { email, code });

      if (res.data.success) {
        setSession(res.data.data.user, res.data.data.accessToken);
        setSuccess(true);
        setTimeout(() => {
          void navigate({ to: '/dashboard' });
        }, 1000);
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number } };
      if (axErr.response?.status === 401) {
        setError('Kode tidak valid atau sudah kadaluarsa. Coba lagi.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
      setDigits(Array(DIGIT_COUNT).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendMsg('');
    setError('');
    try {
      await api.post('/auth/send-otp', { email });
      setResendCooldown(60);
      setResendMsg('Kode baru telah dikirim ke email Anda.');
      setDigits(Array(DIGIT_COUNT).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number } };
      if (axErr.response?.status === 429) {
        setError('Tunggu sebentar sebelum meminta kode baru.');
        setResendCooldown(60);
      } else {
        setError('Gagal mengirim ulang kode. Coba lagi.');
      }
    }
  };

  return (
    <>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <IconMail size={24} style={{ color: '#7c3aed' }} />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 6, letterSpacing: '-0.5px' }}>
        Verifikasi email Anda
      </h1>
      <p style={{ color: 'var(--fig-text-meta)', marginBottom: 4, fontSize: 14, lineHeight: 1.6 }}>
        Kode 6 digit telah dikirim ke
      </p>
      <p style={{ fontWeight: 700, color: 'var(--fig-purple)', fontSize: 14, marginBottom: 28, wordBreak: 'break-all' }}>
        {email || 'email Anda'}
      </p>

      {error && (
        <div className="anim-fade-up toast-error" style={{ borderRadius: 10, marginBottom: 20, padding: '11px 14px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <IconAlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {resendMsg && !error && (
        <div className="anim-fade-up toast-success" style={{ borderRadius: 10, marginBottom: 20, padding: '11px 14px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <IconCheck size={15} style={{ flexShrink: 0 }} />
          {resendMsg}
        </div>
      )}

      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <IconCheck size={28} style={{ color: '#059669' }} />
          </div>
          <p style={{ fontWeight: 700, color: '#059669', fontSize: 16 }}>Email berhasil diverifikasi!</p>
          <p style={{ color: 'var(--fig-text-meta)', fontSize: 13, marginTop: 6 }}>Mengarahkan ke dashboard…</p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                style={{
                  width: 46, height: 54,
                  textAlign: 'center',
                  fontSize: 22, fontWeight: 700,
                  border: `2px solid ${d ? 'var(--fig-purple)' : '#e5e7eb'}`,
                  borderRadius: 10,
                  background: d ? '#f5f3ff' : '#fff',
                  color: 'var(--fig-text-h)',
                  outline: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                  caretColor: 'var(--fig-purple)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--fig-purple)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px #ede9fe';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  if (!digits[i]) e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join('').length < DIGIT_COUNT}
            className="btn btn-gradient btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
            {loading
              ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Memverifikasi…</>
              : 'Verifikasi Email'}
          </button>
        </form>
      )}

      {!success && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fig-text-muted)' }}>
          Tidak menerima kode?{' '}
          {resendCooldown > 0 ? (
            <span style={{ color: '#9ca3af' }}>Kirim ulang dalam {resendCooldown}d</span>
          ) : (
            <button
              type="button"
              onClick={() => void handleResend()}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--fig-purple)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}>
              Kirim ulang
            </button>
          )}
        </p>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--fig-text-meta)', marginTop: 16 }}>
        Email salah?{' '}
        <a href="/register" style={{ color: 'var(--fig-purple)', fontWeight: 700 }}>Daftar ulang</a>
      </p>
    </>
  );
}
