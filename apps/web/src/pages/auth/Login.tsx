import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth.store.js';
import { IconEye, IconEyeOff, IconMail } from '../../components/ui/icons.js';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      void navigate({ to: role === 'ADMIN' ? '/admin' : '/dashboard' });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const code = (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code;
        if (status === 403 && code === 'EMAIL_NOT_VERIFIED') {
          void navigate({ to: '/verify-email', search: { email } });
          return;
        } else if (status === 429) {
          setError('Too many login attempts. Please wait 15 minutes and try again.');
        } else if (status === 401) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError('Login failed. Please check your connection and try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 6, letterSpacing: '-0.6px' }}>
        Welcome back
      </h1>
      <p style={{ color: 'var(--fig-text-meta)', marginBottom: 32, fontSize: 15 }}>
        Log in to your Bethflow account
      </p>

      {error && (
        <div className="anim-fade-down toast-error" style={{ borderRadius: 10, marginBottom: 20, padding: '12px 16px', fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Email */}
        <div>
          <label htmlFor="login-email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <IconMail size={16} />
            </div>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="input"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)' }}>
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{ fontSize: 12, color: 'var(--fig-purple)', fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              Lupa password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="input"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#9ca3af', display: 'flex', alignItems: 'center',
                transition: 'color 0.15s', padding: 4, borderRadius: 4,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}>
              {showPass ? <IconEyeOff size={17} /> : <IconEye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-gradient btn-lg"
          style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
          {loading
            ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Logging in…</>
            : 'Log in'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(156,163,175,0.2)' }} />
        <span style={{ fontSize: 12, color: 'var(--fig-text-muted)', fontWeight: 500 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(156,163,175,0.2)' }} />
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--fig-text-meta)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--fig-purple)', fontWeight: 700, transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
          Sign up free
        </Link>
      </p>
    </>
  );
}
