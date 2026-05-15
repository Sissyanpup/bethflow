import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { format } from 'date-fns';
import { IconPlus, IconX, IconGrid, IconCalendar, IconTrash, IconPencil, IconCheck } from '../../components/ui/icons.js';

interface Catalog {
  id: string; title: string; content: string | null;
  group: string | null;
  startDate: string | null; endDate: string | null;
  taskStatusCounts?: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#8b5cf6', IN_PROGRESS: '#3b82f6', DONE: '#22c55e', BLOCKED: '#ef4444',
};

const CATALOG_GRADIENTS = [
  { gradient: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.3)' },
  { gradient: 'linear-gradient(135deg, #f97316, #f59e0b)', glow: 'rgba(249,115,22,0.3)' },
  { gradient: 'linear-gradient(135deg, #22c55e, #10b981)', glow: 'rgba(34,197,94,0.3)' },
  { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: 'rgba(59,130,246,0.3)' },
  { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.3)' },
  { gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)', glow: 'rgba(236,72,153,0.3)' },
];

interface NewCatalogForm { title: string; group: string; content: string; startDate: string; endDate: string; }
const EMPTY_FORM: NewCatalogForm = { title: '', group: '', content: '', startDate: '', endDate: '' };

export function CatalogsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewCatalogForm>(EMPTY_FORM);
  const [editCatalog, setEditCatalog] = useState<Catalog | null>(null);
  const [editForm, setEditForm] = useState<NewCatalogForm>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Catalog[] }>('/catalogs');
      return res.data.data;
    },
  });

  const createCatalog = useMutation({
    mutationFn: (f: NewCatalogForm) => api.post('/catalogs', {
      title: f.title,
      ...(f.group.trim() ? { group: f.group.trim() } : {}),
      ...(f.content.trim() ? { content: f.content.trim() } : {}),
      ...(f.startDate ? { startDate: new Date(f.startDate).toISOString() } : {}),
      ...(f.endDate ? { endDate: new Date(f.endDate).toISOString() } : {}),
    }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['catalogs'] }); setShowNew(false); setForm(EMPTY_FORM); },
  });

  const updateCatalog = useMutation({
    mutationFn: ({ id, f }: { id: string; f: NewCatalogForm }) => api.patch(`/catalogs/${id}`, {
      title: f.title,
      group: f.group.trim() || null,
      content: f.content.trim() || null,
      ...(f.startDate ? { startDate: new Date(f.startDate).toISOString() } : { startDate: null }),
      ...(f.endDate ? { endDate: new Date(f.endDate).toISOString() } : { endDate: null }),
    }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['catalogs'] }); setEditCatalog(null); },
  });

  const deleteCatalog = useMutation({
    mutationFn: (id: string) => api.delete(`/catalogs/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['catalogs'] }),
  });

  const openEdit = (c: Catalog) => {
    setEditCatalog(c);
    setEditForm({
      title: c.title,
      group: c.group ?? '',
      content: '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
    });
  };

  // Group catalogs
  const grouped: Record<string, Catalog[]> = {};
  for (const c of (data ?? [])) {
    const key = c.group?.trim() || '__ungrouped__';
    (grouped[key] ??= []).push(c);
  }
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '__ungrouped__') return 1;
    if (b === '__ungrouped__') return -1;
    return a.localeCompare(b);
  });

  // flat index for gradient cycling
  let cardIdx = 0;

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
          background: 'var(--air-surface)', border: '1px solid var(--air-border)',
          borderRadius: 12, padding: '20px 22px', marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--air-text-1)' }}>New catalog</span>
            <button onClick={() => { setShowNew(false); setForm(EMPTY_FORM); }} style={{ color: 'var(--air-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IconX size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>TITLE *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Catalog title…" autoFocus className="input" onKeyDown={(e) => { if (e.key === 'Escape') { setShowNew(false); setForm(EMPTY_FORM); } }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>GROUP (optional)</label>
              <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="e.g. Design, Research…" className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>START DATE</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>END DATE</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>DESCRIPTION (optional)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Add a description…" className="input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { if (form.title.trim()) createCatalog.mutate(form); }}
              disabled={!form.title.trim() || createCatalog.isPending}
              style={{
                padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: !form.title.trim() ? 0.5 : 1,
              }}>
              {createCatalog.isPending ? <span className="spinner spinner-dark" style={{ width: 15, height: 15 }} /> : <IconCheck size={14} />} Create
            </button>
            <button onClick={() => { setShowNew(false); setForm(EMPTY_FORM); }} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--air-secondary)', color: 'var(--air-text-2)', border: '1.5px solid var(--air-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editCatalog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditCatalog(null)}>
          <div style={{ background: 'var(--air-surface)', borderRadius: 14, padding: '24px 26px', width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--air-border)' }} onClick={(e) => e.stopPropagation()} className="anim-scale-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--air-text-1)' }}>Edit catalog</span>
              <button onClick={() => setEditCatalog(null)} style={{ color: 'var(--air-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IconX size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>TITLE *</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input" autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>GROUP</label>
                <input value={editForm.group} onChange={(e) => setEditForm({ ...editForm, group: e.target.value })} placeholder="e.g. Design, Research…" className="input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>START DATE</label>
                <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>END DATE</label>
                <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>DESCRIPTION</label>
              <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { if (editForm.title.trim()) updateCatalog.mutate({ id: editCatalog.id, f: editForm }); }}
                disabled={!editForm.title.trim() || updateCatalog.isPending}
                style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !editForm.title.trim() ? 0.5 : 1 }}>
                {updateCatalog.isPending ? <span className="spinner spinner-dark" style={{ width: 15, height: 15 }} /> : <IconCheck size={14} />} Save changes
              </button>
              <button onClick={() => setEditCatalog(null)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--air-secondary)', color: 'var(--air-text-2)', border: '1.5px solid var(--air-border)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-light" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      ) : data && data.length > 0 ? (
        <div>
          {groupKeys.map((key) => {
            const catalogs = grouped[key]!;
            const label = key === '__ungrouped__' ? 'General' : key;
            return (
              <div key={key} style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--air-text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--air-border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--air-text-3)' }}>{catalogs.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {catalogs.map((catalog) => {
                    const idx = cardIdx++;
                    return (
                      <CatalogCard
                        key={catalog.id}
                        catalog={catalog}
                        scheme={CATALOG_GRADIENTS[idx % CATALOG_GRADIENTS.length]!}
                        delay={idx * 60}
                        onDelete={() => deleteCatalog.mutate(catalog.id)}
                        onEdit={() => openEdit(catalog)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyCatalogs onNew={() => setShowNew(true)} />
      )}
    </div>
  );
}

function CatalogCard({ catalog, scheme, delay, onDelete, onEdit }: { catalog: Catalog; scheme: { gradient: string; glow: string }; delay: number; onDelete: () => void; onEdit: () => void }) {
  const [hov, setHov] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        background: 'var(--air-surface)',
        border: `1px solid ${hov ? 'var(--air-border-dark)' : 'var(--air-border)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'default',
        boxShadow: hov ? `0 8px 28px ${scheme.glow}, 0 2px 8px rgba(0,0,0,0.06)` : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.2s var(--ease-out)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}>
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
              <div style={{ fontSize: 12, color: 'var(--air-text-3)', lineHeight: 1.55, overflow: 'hidden', maxHeight: '2.8em' }}>
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
        {catalog.taskStatusCounts && Object.keys(catalog.taskStatusCounts).length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const).map((st) => {
              const count = catalog.taskStatusCounts![st];
              if (!count) return null;
              const color = STATUS_COLORS[st]!;
              return (
                <span key={st} title={`${st.replace('_', ' ')}: ${count}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color, background: `${color}18`, borderRadius: 999, padding: '2px 7px', border: `1px solid ${color}30` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  {count}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {/* Action buttons on hover */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
        display: 'flex', gap: 4,
      }}>
        {confirm ? (
          <>
            <button onClick={onDelete} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
            <button onClick={() => setConfirm(false)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(0,0,0,0.06)', color: '#374151', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={onEdit} aria-label="Edit catalog" style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(22,110,225,0.1)', color: '#166ee1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,110,225,0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,110,225,0.1)'; }}>
              <IconPencil size={12} />
            </button>
            <button onClick={() => setConfirm(true)} aria-label="Delete catalog" style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}>
              <IconTrash size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCatalogs({ onNew }: { onNew: () => void }) {
  return (
    <div className="anim-fade-up" style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--air-surface)', border: '1px dashed var(--air-border)', borderRadius: 16,
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <IconGrid size={26} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--air-text-1)', marginBottom: 8 }}>No catalogs yet</h3>
      <p style={{ color: 'var(--air-text-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Create catalog cards with media, dates, and rich content.</p>
      <button onClick={onNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', padding: '10px 22px', fontSize: 14, borderRadius: 9, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
        <IconPlus size={16} /> Create first catalog
      </button>
    </div>
  );
}
