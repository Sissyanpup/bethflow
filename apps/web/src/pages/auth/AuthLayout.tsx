import { Outlet, Link } from '@tanstack/react-router';

export function AuthLayout() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── Left panel: branding ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(140deg, #4c1d95 0%, #1e40af 50%, #0e7490 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 10s ease infinite',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        overflow: 'hidden',
      }}
        className="auth-panel-hide-mobile">
        {/* Blobs */}
        {[
          { w: 280, h: 280, t: -80, r: -80, delay: '0s', dur: '8s', op: 0.08 },
          { w: 200, h: 200, b: -60, l: -40, delay: '2s', dur: '11s', op: 0.06 },
          { w: 140, h: 140, t: '40%', l: '30%', delay: '1s', dur: '7s', op: 0.05 },
        ].map((b, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            width: b.w, height: b.h,
            borderRadius: '50%',
            background: `rgba(255,255,255,${b.op})`,
            ...('t' in b ? { top: b.t } : {}),
            ...('b' in b ? { bottom: b.b } : {}),
            ...('l' in b ? { left: b.l } : {}),
            ...('r' in b ? { right: b.r } : {}),
            animation: `float ${b.dur} ease-in-out infinite ${b.delay}`,
          }} />
        ))}

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Bethflow</span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#fff',
            letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 20,
          }}>
            Your complete workspace awaits.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, maxWidth: 360, marginBottom: 40 }}>
            Manage boards, timelines, catalogs, and your social presence — all in one beautiful app.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Kanban Boards with real-time sync', color: '#a78bfa' },
              { label: 'Gantt-style project timelines', color: '#34d399' },
              { label: 'Social link-in-bio profile', color: '#f472b6' },
            ].map((feat) => (
              <div key={feat.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: feat.color, flexShrink: 0,
                  boxShadow: `0 0 8px ${feat.color}`,
                }} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{feat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>© {new Date().getFullYear()} Bethflow</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div style={{
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="anim-scale-in">
          {/* Mobile-only logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }} className="auth-logo-mobile-only">
            <Link to="/" style={{
              fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Bethflow
            </Link>
          </div>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-panel-hide-mobile { display: none !important; }
          [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
