import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import axios from 'axios';
import { api } from '../../lib/api.js';
import { IconEye, IconEyeOff, IconCheck, IconAlertCircle } from '../../components/ui/icons.js';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min. 8 karakter', ok: password.length >= 8 },
    { label: 'Huruf kapital', ok: /[A-Z]/.test(password) },
    { label: 'Angka', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
      {checks.map((c) => (
        <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: c.ok ? '#10b981' : '#9ca3af' }}>
          <IconCheck size={12} style={{ opacity: c.ok ? 1 : 0.3 }} /> {c.label}
        </span>
      ))}
    </div>
  );
}

export function ResetPasswordPage() {
  const search = useSearch({ strict: false }) as { token?: string };
  const token = search.token ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const isValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || mismatch || password !== confirm) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => void navigate({ to: '/login' }), 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 400) {
          setError('Link reset tidak valid atau sudah kadaluarsa. Minta link baru dari halaman Lupa Password.');
        } else {
          setError('Terjadi kesalahan. Periksa koneksi Anda dan coba lagi.');
        }
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <IconAlertCircle size={24} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 8 }}>Link tidak valid</h1>
        <p style={{ color: 'var(--fig-text-meta)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
          Token reset tidak ditemukan. Gunakan link dari email yang Anda terima, atau minta link baru.
        </p>
        <Link to="/forgot-password" className="btn btn-gradient btn-lg" style={{ display: 'inline-flex', justifyContent: 'center' }}>
          Minta link baru
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #10b981, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <IconCheck size={26} style={{ color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Password berhasil direset
        </h1>
        <p style={{ color: 'var(--fig-text-meta)', fontSize: 15, lineHeight: 1.6 }}>
          Password baru Anda telah disimpan. Anda akan diarahkan ke halaman login dalam 3 detik…
        </p>
      </>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 6, letterSpacing: '-0.6px' }}>
        Buat password baru
      </h1>
      <p style={{ color: 'var(--fig-text-meta)', marginBottom: 32, fontSize: 15 }}>
        Masukkan password baru untuk akun Bethflow Anda.
      </p>

      {error && (
        <div className="anim-fade-down toast-error" style={{ borderRadius: 10, marginBottom: 20, padding: '12px 16px', fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Password baru */}
        <div>
          <label htmlFor="rp-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Password baru
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="rp-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
              placeholder="••••••••"
              className="input"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center', transition: 'color 0.15s', padding: 4, borderRadius: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
            >
              {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Konfirmasi password */}
        <div>
          <label htmlFor="rp-confirm" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Ketik ulang password baru
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="rp-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="input"
              style={{
                paddingRight: 44,
                borderColor: mismatch ? '#ef4444' : undefined,
                boxShadow: mismatch ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center', transition: 'color 0.15s', padding: 4, borderRadius: 4 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
            >
              {showConfirm ? <IconEyeOff size={17} /> : <IconEye size={17} />}
            </button>
          </div>
          {mismatch && (
            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>Password tidak cocok</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isValid || password !== confirm || !confirm}
          className="btn btn-gradient btn-lg"
          style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Menyimpan…</>
            : 'Simpan password baru'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link
          to="/login"
          style={{ fontSize: 14, color: 'var(--fig-text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-text-muted)'; }}
        >
          Kembali ke Login
        </Link>
      </div>
    </>
  );
}
