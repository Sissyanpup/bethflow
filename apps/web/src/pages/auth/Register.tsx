import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth.store.js';
import { api } from '../../lib/api.js';
import { IconEye, IconEyeOff, IconMail, IconUser } from '../../components/ui/icons.js';

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
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
      await api.post('/auth/register', form);
      await login(form.email, form.password);
      void navigate({ to: '/dashboard' });
    } catch {
      setError('Registration failed. Email or username may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 6, letterSpacing: '-0.6px' }}>
        Create your account
      </h1>
      <p style={{ color: 'var(--fig-text-meta)', marginBottom: 32, fontSize: 15 }}>
        Join Bethflow today — free forever.
      </p>

      {error && (
        <div className="anim-fade-down toast-error" style={{ borderRadius: 10, marginBottom: 20, padding: '12px 16px', fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Email */}
        <div>
          <label htmlFor="reg-email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Email <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <IconMail size={16} />
            </div>
            <input
              id="reg-email"
              type="email" value={form.email} onChange={set('email')}
              required autoComplete="email" placeholder="you@example.com"
              className="input" style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="reg-username" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Username <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
              <IconUser size={16} />
            </div>
            <input
              id="reg-username"
              type="text" value={form.username} onChange={set('username')}
              required autoComplete="username" placeholder="johndoe"
              className="input" style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Display name */}
        <div>
          <label htmlFor="reg-displayname" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Display name <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="reg-displayname"
            type="text" value={form.displayName} onChange={set('displayName')}
            placeholder="John Doe"
            className="input"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 7 }}>
            Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-password"
              type={showPass ? 'text' : 'password'}
              value={form.password} onChange={set('password')}
              required autoComplete="new-password" placeholder="Min. 8 characters"
              className="input" style={{ paddingRight: 44 }}
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
          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
          {loading
            ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Creating account…</>
            : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--fig-text-muted)', lineHeight: 1.6 }}>
        By creating an account you agree to our{' '}
        <Link to="/" style={{ color: 'var(--fig-purple)', fontWeight: 600 }}>Terms</Link>
        {' '}and{' '}
        <Link to="/" style={{ color: 'var(--fig-purple)', fontWeight: 600 }}>Privacy Policy</Link>.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
        <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--fig-text-meta)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--fig-purple)', fontWeight: 700 }}>
          Log in
        </Link>
      </p>
    </>
  );
}
