import { Outlet, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { IconMenu, IconX, IconArrowRight } from '../../components/ui/icons.js';
import { ThemeToggle } from '../../components/ui/ThemeToggle.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useThemeStore, resolveTheme } from '../../stores/theme.store.js';

export function GuestLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;
  const { mode } = useThemeStore();
  const isDark = resolveTheme(mode) === 'dark';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  const closeMobile = () => setMobileOpen(false);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--fig-bg)', fontFamily: 'Inter, sans-serif' }}
      className="fig-scrollbar">
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? (isDark ? 'rgba(13,13,20,0.92)' : 'rgba(248,247,255,0.92)') : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(124,58,237,0.08)' : '1px solid transparent',
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(124,58,237,0.4)', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
          </div>
          <span style={{
            fontSize: 19, fontWeight: 800, letterSpacing: '-0.6px',
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Bethflow
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="desk-only" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <ThemeToggle variant="light" />
          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
          <Link to="/contact" style={{
            padding: '8px 16px', borderRadius: 8, color: 'var(--fig-text-body)',
            fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            Contact
          </Link>

          {isLoggedIn ? (
            /* Logged-in: show Go to Dashboard */
            <Link to="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
              <IconArrowRight size={14} />
              Dashboard
            </Link>
          ) : (
            /* Guest: show Log in + Get started */
            <>
              <Link to="/login" style={{
                padding: '8px 16px', borderRadius: 8,
                color: 'var(--fig-purple)', fontSize: 14, fontWeight: 600,
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + burger */}
        <div className="mob-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle variant="light" />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(124,58,237,0.07)', color: 'var(--fig-purple)',
            }}
          >
            {mobileOpen ? <IconX size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          className="mob-only anim-fade-down"
          style={{
            position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
            background: 'var(--fig-surface)',
            borderBottom: '1px solid rgba(124,58,237,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '16px 20px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <Link to="/contact" onClick={closeMobile} style={{
            padding: '12px 16px', borderRadius: 10,
            color: 'var(--fig-text-body)', fontSize: 15, fontWeight: 500,
            display: 'block', transition: 'background 0.15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            Contact
          </Link>

          {isLoggedIn ? (
            <Link to="/dashboard" onClick={closeMobile} className="btn btn-gradient" style={{ borderRadius: 10, justifyContent: 'center' }}>
              <IconArrowRight size={15} />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={closeMobile} style={{
                padding: '12px 16px', borderRadius: 10,
                color: 'var(--fig-purple)', fontSize: 15, fontWeight: 600,
                display: 'block', transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                Log in
              </Link>
              <Link to="/register" onClick={closeMobile} className="btn btn-gradient" style={{ borderRadius: 10, justifyContent: 'center' }}>
                Get started free
              </Link>
            </>
          )}
        </div>
      )}

      <Outlet />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '48px 24px 32px',
        background: 'var(--fig-surface)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="9" rx="1.5" />
                  <rect x="14" y="3" width="7" height="5" rx="1.5" />
                  <rect x="14" y="12" width="7" height="9" rx="1.5" />
                  <rect x="3" y="16" width="7" height="5" rx="1.5" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.3px' }}>Bethflow</span>
            </div>
            <p style={{ color: 'var(--fig-text-muted)', fontSize: 13 }}>
              © {new Date().getFullYear()} Bethflow. Built with care.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {(['Privacy', 'Terms', 'Contact'] as const).map((label) => (
                <Link key={label} to={label === 'Contact' ? '/contact' : '/'} style={{ fontSize: 13, color: 'var(--fig-text-meta)', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--fig-text-meta)'; }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
