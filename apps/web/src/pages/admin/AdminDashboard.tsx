import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { IconUsers, IconKanban, IconGrid, IconTrendingUp } from '../../components/ui/icons.js';

interface Stats { totalUsers: number; activeUsers: number; totalBoards: number; totalCards: number; }

const STAT_CONFIG = [
  { key: 'totalUsers',  label: 'Total Users',   icon: IconUsers,      gradient: 'linear-gradient(135deg, #7170ff, #5e6ad2)', glow: 'rgba(113,112,255,0.3)' },
  { key: 'activeUsers', label: 'Active Users',  icon: IconTrendingUp, gradient: 'linear-gradient(135deg, #10b981, #0891b2)', glow: 'rgba(16,185,129,0.3)' },
  { key: 'totalBoards', label: 'Total Boards',  icon: IconKanban,     gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,158,11,0.3)' },
  { key: 'totalCards',  label: 'Total Cards',   icon: IconGrid,       gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)', glow: 'rgba(236,72,153,0.3)' },
] as const;

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Stats }>('/admin/stats');
      return res.data.data;
    },
  });

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(239,68,68,0.1)', borderRadius: 999,
          padding: '4px 12px', fontSize: 11, fontWeight: 700,
          color: '#ef4444', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10,
        }}>
          Admin
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.7px' }}>Dashboard</h1>
        <p style={{ color: 'var(--lin-text-3)', fontSize: 14, marginTop: 4 }}>
          Platform overview and analytics.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 48,
      }}>
        {STAT_CONFIG.map((s, i) => {
          const value = stats ? stats[s.key as keyof Stats] : undefined;
          return (
            <div key={s.key} className="anim-fade-up card-dark" style={{
              animationDelay: `${i * 60}ms`,
              borderRadius: 12, padding: '22px 24px',
              transition: 'all 0.18s',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: s.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
                boxShadow: `0 4px 16px ${s.glow}`,
              }}>
                <s.icon size={22} style={{ color: '#fff' }} />
              </div>
              {isLoading
                ? <div className="skeleton" style={{ height: 36, width: 64, marginBottom: 8 }} />
                : <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.5px', lineHeight: 1 }}>{value ?? '—'}</div>
              }
              <div style={{ fontSize: 13, color: 'var(--lin-text-3)', marginTop: 6 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Activity placeholder */}
      <div className="anim-fade-up delay-300" style={{
        background: 'var(--lin-surface)', border: '1px solid var(--lin-border-2)',
        borderRadius: 14, padding: '28px 32px',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lin-text-1)', marginBottom: 20 }}>
          Platform health
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {[
            { label: 'User retention', value: '94%', bar: 0.94, color: '#7170ff' },
            { label: 'Active rate', value: stats ? `${Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%` : '—', bar: stats ? stats.activeUsers / Math.max(stats.totalUsers, 1) : 0, color: '#10b981' },
            { label: 'Board utilization', value: stats ? `${stats.totalBoards} boards` : '—', bar: 0.6, color: '#f59e0b' },
          ].map((metric) => (
            <div key={metric.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--lin-text-3)', fontWeight: 500 }}>{metric.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lin-text-1)' }}>{metric.value}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--lin-border-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: metric.color,
                  width: `${metric.bar * 100}%`,
                  transition: 'width 1s var(--ease-out)',
                  boxShadow: `0 0 8px ${metric.color}60`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
