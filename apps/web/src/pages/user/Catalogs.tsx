import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { format } from 'date-fns';
import { IconPlus, IconX, IconGrid, IconCalendar, IconTrash } from '../../components/ui/icons.js';

interface Catalog { id: string; title: string; content: string | null; startDate: string | null; endDate: string | null; }

const CATALOG_GRADIENTS = [
  { gradient: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.3)' },
  { gradient: 'linear-gradient(135deg, #f97316, #f59e0b)', glow: 'rgba(249,115,22,0.3)' },
  { gradient: 'linear-gradient(135deg, #22c55e, #10b981)', glow: 'rgba(34,197,94,0.3)' },
  { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: 'rgba(59,130,246,0.3)' },
  { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.3)' },
  { gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)', glow: 'rgba(236,72,153,0.3)' },
];

export function CatalogsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Catalog[] }>('/catalogs');
      return res.data.data;
    },
  });

  const createCatalog = useMutation({
    mutationFn: (t: string) => api.post('/catalogs', { title: t }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['catalogs'] }); setShowNew(false); setTitle(''); },
  });

  const deleteCatalog = useMutation({
    mutationFn: (id: string) => api.delete(`/catalogs/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['catalogs'] }),
  });

  return (
    <div className="page-content" style={{ background: 'var(--air-bg)', minHeight: '100%', color: 'var(--air-text-1)' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4, color: 'var(--air-text-1)' }}>Catalogs</h1>
          <p style={{ color: 'var(--air-text-3)', fontSize: 14 }}>
            {data ? `${data.length} catalog${data.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(245,158,11,0.45)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; }}>
          <IconPlus size={15} /> New Catalog
        </button>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="anim-scale-in" style={{
          background: '#fff', border: '1px solid var(--air-border)',
          borderRadius: 12, padding: '20px 22px', marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--air-text-2)', marginBottom: 14 }}>Create new catalog</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) createCatalog.mutate(title); if (e.key === 'Escape') setShowNew(false); }}
              placeholder="Catalog title…"
              autoFocus
              className="input"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => createCatalog.mutate(title)}
              disabled={!title.trim() || createCatalog.isPending}
              style={{
                padding: '8px 18px', borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                opacity: !title.trim() ? 0.5 : 1,
              }}>
              {createCatalog.isPending ? <span className="spinner spinner-dark" /> : 'Create'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--air-border-dark)', color: 'var(--air-text-3)', cursor: 'pointer', background: '#fff' }}>
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-light" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      ) : data && data.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {data.map((catalog, i) => (
            <CatalogCard
              key={catalog.id}
              catalog={catalog}
              scheme={CATALOG_GRADIENTS[i % CATALOG_GRADIENTS.length]!}
              delay={i * 60}
              onDelete={() => deleteCatalog.mutate(catalog.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyCatalogs onNew={() => setShowNew(true)} />
      )}
    </div>
  );
}

function CatalogCard({ catalog, scheme, delay, onDelete }: { catalog: Catalog; scheme: { gradient: string; glow: string }; delay: number; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        background: '#fff',
        border: `1px solid ${hov ? '#e0e0e0' : 'var(--air-border)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'default',
        boxShadow: hov ? `0 8px 28px ${scheme.glow}, 0 2px 8px rgba(0,0,0,0.06)` : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.2s var(--ease-out)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}>
      {/* Gradient accent top */}
      <div style={{ height: 5, background: scheme.gradient }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: scheme.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconGrid size={16} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--air-text-1)', marginBottom: 4 }}>{catalog.title}</div>
            {catalog.content && (
              <div style={{
                fontSize: 12, color: 'var(--air-text-3)', lineHeight: 1.55,
                overflow: 'hidden', maxHeight: '2.8em',
              }}>
                {catalog.content}
              </div>
            )}
          </div>
        </div>
        {(catalog.startDate || catalog.endDate) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12 }}>
            <IconCalendar size={12} style={{ color: 'var(--air-text-3)' }} />
            <span style={{ background: 'var(--air-secondary)', borderRadius: 5, fontSize: 11, fontWeight: 600, color: 'var(--air-text-2)', padding: '2px 8px' }}>
              {catalog.startDate ? format(new Date(catalog.startDate), 'MMM d') : '?'} – {catalog.endDate ? format(new Date(catalog.endDate), 'MMM d') : '?'}
            </span>
          </div>
        )}
      </div>
      {/* Delete controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
        display: 'flex', gap: 4,
      }}>
        {confirm ? (
          <>
            <button
              onClick={onDelete}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
              }}>
              Delete
            </button>
            <button
              onClick={() => setConfirm(false)}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(0,0,0,0.06)', color: '#374151',
                border: 'none', cursor: 'pointer',
              }}>
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            aria-label="Delete catalog"
            style={{
              width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}>
            <IconTrash size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyCatalogs({ onNew }: { onNew: () => void }) {
  return (
    <div className="anim-fade-up" style={{
      textAlign: 'center', padding: '72px 24px',
      background: '#fff', border: '1px dashed var(--air-border)', borderRadius: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <IconGrid size={26} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--air-text-1)', marginBottom: 8 }}>No catalogs yet</h3>
      <p style={{ color: 'var(--air-text-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Create catalog cards with media, dates, and rich content.
      </p>
      <button onClick={onNew} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        color: '#fff', padding: '10px 22px', fontSize: 14, borderRadius: 9, fontWeight: 600,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
      }}>
        <IconPlus size={16} /> Create first catalog
      </button>
    </div>
  );
}
