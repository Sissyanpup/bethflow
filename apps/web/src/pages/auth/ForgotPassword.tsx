import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { api } from '../../lib/api.js';
import { IconMail, IconArrowRight, IconCheck } from '../../components/ui/icons.js';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429) {
          setError('Terlalu sering. Tunggu sebentar lalu coba lagi.');
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

  if (sent) {
    return (
      <>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'linear-gradient(135deg, #10b981, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <IconCheck size={26} style={{ color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Email terkirim
        </h1>
        <p style={{ color: 'var(--fig-text-meta)', marginBottom: 8, fontSize: 15, lineHeight: 1.6 }}>
          Jika <strong>{email}</strong> terdaftar, link reset password telah dikirim.
        </p>
        <p style={{ color: 'var(--fig-text-muted)', fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
          Cek folder <strong>inbox</strong> dan <strong>spam</strong> Anda. Link berlaku selama <strong>1 jam</strong>.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--fig-purple)', fontWeight: 600, fontSize: 14,
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Kembali ke Login <IconArrowRight size={15} />
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 6, letterSpacing: '-0.6px' }}>
        Lupa password?
      </h1>
      <p style={{ color: 'var(--fig-text-meta)', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
        Masukkan email yang terdaftar. Kami akan mengirimkan link untuk membuat password baru.
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
        <div>
          <label htmlFor="fp-email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <IconMail size={16} />
            </div>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              className="input"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn btn-gradient btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Mengirim…</>
            : <>Kirim link reset <IconArrowRight size={16} /></>}
        </button>
      </form>

      <div style={{ marginTop: 28, textAlign: 'center' }}>
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
