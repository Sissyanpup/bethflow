import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth.store.js';
import { useEffect, useState } from 'react';
import {
  IconDashboard, IconKanban, IconCalendar, IconGrid, IconLink,
  IconShield, IconLogOut, IconMenu, IconX,
} from '../../components/ui/icons.js';
import { ThemeToggle } from '../../components/ui/ThemeToggle.js';

function useIsActive(to: string) {
  const loc = useRouterState({ select: (s) => s.location.pathname });
  return loc === to || loc.startsWith(to + '/');
}

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',    icon: IconDashboard },
  { to: '/boards',       label: 'Boards',       icon: IconKanban },
  { to: '/projects',     label: 'Projects',     icon: IconCalendar },
  { to: '/catalogs',     label: 'Catalogs',     icon: IconGrid },
  { to: '/social-links', label: 'Social Links', icon: IconLink },
];

export function UserLayout() {
  const { user, isLoading, refresh, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { void refresh(); }, []);

  if (isLoading) return <LoadingSkeleton />;

  const handleLogout = async () => { await logout(); void navigate({ to: '/login' }); };
  const closeSidebar = () => setSidebarOpen(false);
  const initials = ((user?.displayName ?? user?.username) ?? 'U')[0]?.toUpperCase() ?? 'U';
  const displayName = user?.displayName ?? user?.username ?? 'User';

  return (
    <div style={{
      display: 'flex', minHeight: '100dvh',
      background: 'var(--lin-canvas)',
      fontFamily: 'Inter, sans-serif',
      fontFeatureSettings: '"cv01", "ss03"',
    }}>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' is-active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar-drawer${sidebarOpen ? ' is-open' : ''}`}
        style={{
          width: 240, flexShrink: 0,
          background: 'var(--lin-panel)',
          borderRight: '1px solid var(--lin-border-1)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100dvh',
          overflow: 'hidden',
        }}
      >
        {/* Logo + mobile close */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--lin-border-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} onClick={closeSidebar}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
            </div>
            <span style={{
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.4px',
              background: 'linear-gradient(135deg, #7170ff, #a5b4fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Bethflow
            </span>
          </Link>
          {/* Close button — mobile only */}
          <button
            className="mob-only"
            onClick={closeSidebar}
            aria-label="Close menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 7,
              background: 'var(--lin-hover)', border: 'none', cursor: 'pointer',
              color: 'var(--lin-text-3)',
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px 8px' }}>
            Workspace
          </div>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={closeSidebar} />
          ))}
        </nav>

        {/* User area */}
        <div style={{ borderTop: '1px solid var(--lin-border-1)', padding: '12px 10px' }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lin-text-4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Theme
            </span>
            <ThemeToggle variant="dark" />
          </div>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={closeSidebar}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7,
                color: 'var(--lin-violet)', fontSize: 13, fontWeight: 500,
                marginBottom: 4, transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(113,112,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <IconShield size={16} />
              Admin Panel
            </Link>
          )}

          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 8,
            background: 'var(--lin-surface)', border: '1px solid var(--lin-border-2)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 0 0 2px rgba(113,112,255,0.25)',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lin-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginTop: 1 }}>{user?.role ?? 'USER'}</div>
            </div>
          </div>

          <button
            onClick={() => void handleLogout()}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 7,
              color: 'var(--lin-text-3)', fontSize: 13, fontWeight: 500,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-3)'; }}>
            <IconLogOut size={15} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {/* Mobile top bar */}
        <div className="mob-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--lin-surface)', color: 'var(--lin-text-2)',
            }}
          >
            <IconMenu size={18} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px' }}>
            Bethflow
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ item, onNavigate }: { item: typeof NAV_ITEMS[0]; onNavigate: () => void }) {
  const isActive = useIsActive(item.to);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 7,
        fontSize: 13, marginBottom: 2,
        transition: 'all 0.15s var(--ease-smooth)',
        textDecoration: 'none',
        color: isActive ? '#fff' : 'var(--lin-text-3)',
        fontWeight: isActive ? 600 : 500,
        background: isActive
          ? 'linear-gradient(135deg, rgba(113,112,255,0.25), rgba(94,106,210,0.15))'
          : 'transparent',
        borderLeft: isActive ? '2px solid var(--lin-violet)' : '2px solid transparent',
      }}
      onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--lin-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-2)'; } }}
      onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-3)'; } }}>
      <item.icon size={16} />
      {item.label}
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--lin-canvas)' }}>
      <aside style={{ width: 240, background: 'var(--lin-panel)', borderRight: '1px solid var(--lin-border-1)', padding: 20 }}>
        <div className="skeleton" style={{ height: 28, width: 120, marginBottom: 32 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 7 }} />
        ))}
      </aside>
      <main style={{ flex: 1, padding: 40 }}>
        <div className="skeleton" style={{ height: 40, width: 240, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 20, width: 320, marginBottom: 40 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 10 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
