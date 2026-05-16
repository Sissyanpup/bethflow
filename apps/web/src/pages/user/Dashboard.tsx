import { useState, type CSSProperties, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { IconKanban, IconCalendar, IconGrid, IconLink, IconArrowRight, IconChevronRight, IconDownload } from '../../components/ui/icons.js';
import { ExportModal } from '../../components/board/ExportModal.js';

export function UserDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const [showExport, setShowExport] = useState(false);

  const { data: boards, isLoading: bLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string; title: string; color: string | null }[] }>('/boards?limit=5');
      return res.data.data;
    },
  });

  const { data: projects, isLoading: pLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string; title: string }[] }>('/projects?limit=5');
      return res.data.data;
    },
  });

  const { data: catalogsAll, isLoading: cLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string }[] }>('/catalogs');
      return res.data.data;
    },
  });

  const { data: socialLinks, isLoading: sLoading } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string }[] }>('/me/social-links');
      return res.data.data;
    },
  });

  const stats = [
    { label: 'Boards', value: boards?.length ?? 0, icon: IconKanban, gradient: 'linear-gradient(135deg, #7170ff, #5e6ad2)', glow: 'rgba(113,112,255,0.3)', to: '/boards', loading: bLoading },
    { label: 'Projects', value: projects?.length ?? 0, icon: IconCalendar, gradient: 'linear-gradient(135deg, #10b981, #0891b2)', glow: 'rgba(16,185,129,0.3)', to: '/projects', loading: pLoading },
    { label: 'Catalogs', value: catalogsAll?.length ?? 0, icon: IconGrid, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,158,11,0.3)', to: '/catalogs', loading: cLoading },
    { label: 'Social Links', value: socialLinks?.length ?? 0, icon: IconLink, gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)', glow: 'rgba(236,72,153,0.3)', to: '/social-links', loading: sLoading },
  ];

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)', minHeight: '100%' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--lin-text-4)', fontWeight: 500, marginBottom: 6 }}>
            {greeting},
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 700, letterSpacing: '-0.7px',
            color: 'var(--lin-text-1)', marginBottom: 6,
          }}>
            {user?.displayName ?? user?.username ?? 'Welcome'}
          </h1>
          <p style={{ color: 'var(--lin-text-3)', fontSize: 14 }}>
            Here's what's happening across your workspace.
          </p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="btn"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(16,185,129,0.2)', transition: 'all 0.18s', flexShrink: 0, marginTop: 4 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.18)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; }}
        >
          <IconDownload size={15} /> Export
        </button>
      </div>
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 44,
      }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} stat={s} delay={i * 60} loading={s.loading} />
        ))}
      </div>

      {/* Recent Boards */}
      {(boards && boards.length > 0 || bLoading) && (
        <section className="anim-fade-up delay-300" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px' }}>
              Recent Boards
            </h2>
            <Link to="/boards" style={{
              fontSize: 13, color: 'var(--lin-violet)', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
              View all <IconChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {bLoading
              ? [1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 78, borderRadius: 10 }} />
              ))
              : boards!.map((b) => (
                <Link key={b.id} to="/boards/$boardId" params={{ boardId: b.id }} style={{
                  display: 'block',
                  background: b.color
                    ? `linear-gradient(135deg, ${b.color}20, ${b.color}10)`
                    : 'var(--lin-surface)',
                  border: b.color ? `1px solid ${b.color}30` : '1px solid var(--lin-border-2)',
                  borderRadius: 10, padding: '16px 18px',
                  transition: 'transform 0.18s var(--ease-out), box-shadow 0.18s',
                  textDecoration: 'none',
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}>
                  {b.color && (
                    <div style={{ width: 24, height: 4, borderRadius: 2, background: b.color, marginBottom: 12 }} />
                  )}
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-1)' }}>{b.title}</div>
                </Link>
              ))
            }
          </div>
        </section>
      )}

      {/* Recent Projects */}
      {(projects && projects.length > 0 || pLoading) && (
        <section className="anim-fade-up delay-400" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px' }}>
              Recent Projects
            </h2>
            <Link to="/projects" style={{
              fontSize: 13, color: 'var(--lin-violet)', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
              View all <IconChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pLoading
              ? [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)
              : projects!.map((p) => (
                <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 8, color: 'var(--lin-text-2)', fontSize: 14,
                  transition: 'background 0.12s', textDecoration: 'none',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--lin-hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #0891b2)',
                  }} />
                  <span style={{ fontWeight: 500 }}>{p.title}</span>
                  <IconChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--lin-text-4)' }} />
                </Link>
              ))
            }
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="anim-fade-up delay-500">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px', marginBottom: 16 }}>
          Quick actions
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'New board', to: '/boards', color: '#7170ff' },
            { label: 'New project', to: '/projects', color: '#10b981' },
            { label: 'Add catalog', to: '/catalogs', color: '#f59e0b' },
            { label: 'Edit links', to: '/social-links', color: '#ec4899' },
          ].map((a) => (
            <Link key={a.label} to={a.to} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: `${a.color}12`, border: `1px solid ${a.color}25`,
              color: a.color, fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.color}20`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.color}12`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <IconArrowRight size={13} /> {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

interface StatItem { label: string; value: string | number; icon: (p: { size?: number; style?: CSSProperties }) => ReactElement; gradient: string; glow: string; to: string; loading: boolean; }

function StatCard({ stat, delay, loading }: { stat: StatItem; delay: number; loading: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={stat.to}
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        display: 'block',
        background: hov ? 'var(--lin-hover)' : 'var(--lin-surface)',
        border: `1px solid ${hov ? 'var(--lin-border-3)' : 'var(--lin-border-2)'}`,
        borderRadius: 12, padding: '20px 22px',
        transition: 'all 0.18s var(--ease-smooth)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: stat.gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        boxShadow: hov ? `0 4px 16px ${stat.glow}` : 'none',
        transition: 'box-shadow 0.18s',
      }}>
        <stat.icon size={20} style={{ color: '#fff' }} />
      </div>
      {loading
        ? <div className="skeleton" style={{ height: 32, width: 56, marginBottom: 8 }} />
        : <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</div>
      }
      <div style={{ fontSize: 13, color: 'var(--lin-text-3)', marginTop: 6, fontWeight: 500 }}>{stat.label}</div>
    </Link>
  );
}
