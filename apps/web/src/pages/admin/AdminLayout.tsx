import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { IconDashboard, IconUsers, IconChevronRight, IconShield, IconMenu, IconX } from '../../components/ui/icons.js';
import { ThemeToggle } from '../../components/ui/ThemeToggle.js';

function useIsActive(to: string, exact = false) {
  const loc = useRouterState({ select: (s) => s.location.pathname });
  return exact ? loc === to : loc === to || loc.startsWith(to + '/');
}

const ADMIN_NAV = [
  { to: '/admin',       label: 'Dashboard', icon: IconDashboard },
  { to: '/admin/users', label: 'Users',     icon: IconUsers },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

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

      {/* Sidebar */}
      <aside
        className={`sidebar-drawer${sidebarOpen ? ' is-open' : ''}`}
        style={{
          width: 228, flexShrink: 0,
          background: 'var(--lin-panel)',
          borderRight: '1px solid var(--lin-border-1)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100dvh',
        }}
      >
        {/* Header + mobile close */}
        <div style={{
          padding: '20px 20px 16px', borderBottom: '1px solid var(--lin-border-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShield size={14} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px' }}>
              Admin Panel
            </span>
          </div>
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
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px 8px' }}>
            Management
          </div>
          {ADMIN_NAV.map((item) => (
            <AdminNavItem key={item.to} item={item} onNavigate={closeSidebar} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--lin-border-1)' }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lin-text-4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Theme
            </span>
            <ThemeToggle variant="dark" />
          </div>

          <Link
            to="/dashboard"
            onClick={closeSidebar}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 7,
              color: 'var(--lin-text-3)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lin-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-3)'; }}>
            <IconChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
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
            Admin Panel
          </span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

function AdminNavItem({ item, onNavigate }: { item: typeof ADMIN_NAV[0]; onNavigate: () => void }) {
  const isActive = useIsActive(item.to, item.to === '/admin');
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 7,
        fontSize: 13, marginBottom: 2,
        transition: 'all 0.15s', textDecoration: 'none',
        color: isActive ? '#fff' : 'var(--lin-text-3)',
        fontWeight: isActive ? 600 : 500,
        background: isActive
          ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.15))'
          : 'transparent',
        borderLeft: isActive ? '2px solid #ef4444' : '2px solid transparent',
      }}
      onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--lin-hover)'; } }}
      onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}>
      <item.icon size={16} />
      {item.label}
    </Link>
  );
}
