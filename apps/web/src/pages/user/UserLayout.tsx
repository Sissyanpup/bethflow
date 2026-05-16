import { Outlet, Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth.store.js';
import { useEffect, useState, useRef } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import {
  IconDashboard, IconKanban, IconCalendar, IconGrid, IconLink,
  IconShield, IconLogOut,
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
  { to: '/social-links', label: 'Socials', icon: IconLink },
];

export function UserLayout() {
  const { user, isLoading, refresh, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mutating = useIsMutating() > 0;

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  if (isLoading) return <LoadingSkeleton />;

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    void navigate({ to: '/login' });
  };

  const initials = ((user?.displayName ?? user?.username) ?? 'U')[0]?.toUpperCase() ?? 'U';
  const displayName = user?.displayName ?? user?.username ?? 'User';

  return (
    <div className="ul-root">
      {/* ── Top Navbar ── */}
      <header className="ul-navbar">
        {/* Sync progress bar */}
        {mutating && <div className="ul-sync-bar" aria-hidden="true" />}

        {/* Left: Logo */}
        <Link to="/" className="ul-logo">
          <div className="ul-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
          </div>
          <span className="ul-logo-text">Bethflow</span>
        </Link>

        {/* Center: Nav (desktop) */}
        <nav className="ul-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="ul-nav-right">
          {mutating && (
            <div className="ul-sync-indicator" aria-live="polite" aria-label="Syncing data">
              <div className="ul-sync-spinner" aria-hidden="true" />
              <span className="ul-sync-label">Saving…</span>
            </div>
          )}
          <ThemeToggle variant="dark" />

          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="ul-admin-btn" aria-label="Admin panel">
              <IconShield size={14} />
              <span className="ul-admin-label">Admin</span>
            </Link>
          )}

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="ul-avatar-btn"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <span className="ul-avatar-circle" aria-hidden="true">{initials}</span>
            </button>

            {dropdownOpen && (
              <div className="ul-dropdown anim-fade-down" role="menu" aria-label="User options">
                {/* User info */}
                <div className="ul-dropdown-header">
                  <span className="ul-dropdown-avatar" aria-hidden="true">{initials}</span>
                  <div className="ul-dropdown-info">
                    <span className="ul-dropdown-name">{displayName}</span>
                    <span className="ul-dropdown-role">{user?.role ?? 'USER'}</span>
                  </div>
                </div>

                <div className="ul-dropdown-sep" role="separator" />

                <button
                  className="ul-dropdown-item ul-dropdown-logout"
                  onClick={() => void handleLogout()}
                  role="menuitem"
                >
                  <IconLogOut size={14} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="ul-main">
        <Outlet />
      </main>

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className="ul-tabs" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => (
          <BottomTab key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}

/* ─── Nav item (desktop) ─── */
function NavItem({ item }: { item: typeof NAV_ITEMS[0] }) {
  const active = useIsActive(item.to);
  return (
    <Link
      to={item.to}
      className={`ul-nav-item${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <item.icon size={15} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

/* ─── Bottom tab (mobile) ─── */
function BottomTab({ item }: { item: typeof NAV_ITEMS[0] }) {
  const active = useIsActive(item.to);
  return (
    <Link
      to={item.to}
      className={`ul-tab${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <item.icon size={22} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

/* ─── Loading skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="ul-root">
      <header className="ul-navbar">
        <div className="skeleton" style={{ height: 26, width: 110, borderRadius: 7 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[80, 72, 84, 76, 96].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 32, width: w, borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 32, width: 32, borderRadius: '50%' }} />
        </div>
      </header>
      <main className="ul-main" style={{ padding: '40px 44px' }}>
        <div className="skeleton" style={{ height: 36, width: 220, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 18, width: 300, marginBottom: 40 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 10 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
