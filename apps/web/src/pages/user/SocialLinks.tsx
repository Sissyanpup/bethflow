import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { SOCIAL_PLATFORMS } from '@bethflow/shared';
import { IconPlus, IconX, IconGripVertical, IconTrash, IconGlobe, IconLink } from '../../components/ui/icons.js';
import { useAuthStore } from '../../stores/auth.store.js';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SocialLink { id: string; platform: string; label: string; url: string; isVisible: boolean; position: number; }

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877f2', instagram: '#dc2743', twitter: '#000000', tiktok: '#010101',
  linkedin: '#0a66c2', youtube: '#ff0000', telegram: '#2ca5e0', whatsapp: '#25d366',
  github: '#24292e', gitlab: '#fc6d26', email: '#ea4335', discord: '#5865f2',
  spotify: '#1db954', soundcloud: '#ff5500', twitch: '#9146ff', patreon: '#ff424d',
  dribbble: '#ea4c89', behance: '#1769ff', medium: '#000000', reddit: '#ff4500',
  bluesky: '#0085ff', threads: '#000000', mastodon: '#6364ff', pinterest: '#e60023',
  website: '#374151', custom: '#7c3aed',
};

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SOCIAL_PLATFORMS).map(([k, v]) => [k, v.label])
);

export function SocialLinksPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ platform: 'github', label: 'GitHub', url: '' });
  const [localLinks, setLocalLinks] = useState<SocialLink[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: links, isLoading } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: SocialLink[] }>('/me/social-links');
      return res.data.data;
    },
  });

  useEffect(() => { if (links) setLocalLinks(links); }, [links]);

  const addLink = useMutation({
    mutationFn: () => api.post('/me/social-links', form),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['social-links'] }); setShowAdd(false); setForm({ platform: 'github', label: 'GitHub', url: '' }); },
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      api.patch(`/me/social-links/${id}`, { isVisible }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['social-links'] }),
  });

  const deleteLink = useMutation({
    mutationFn: (id: string) => api.delete(`/me/social-links/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['social-links'] }),
  });

  const reorderLinks = useMutation({
    mutationFn: (items: { id: string; position: number }[]) =>
      api.post('/me/social-links/reorder', { items }),
    onError: () => { if (links) setLocalLinks(links); },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localLinks.findIndex((l) => l.id === active.id);
    const newIndex = localLinks.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(localLinks, oldIndex, newIndex);
    setLocalLinks(reordered);
    reorderLinks.mutate(reordered.map((l, i) => ({ id: l.id, position: i })));
  };

  const handlePlatformChange = (platform: string) => {
    const label = PLATFORM_LABELS[platform] ?? platform;
    setForm({ ...form, platform, label });
  };

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)', maxWidth: 760 }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.7px', marginBottom: 4 }}>My Social Links</h1>
          <p style={{ color: 'var(--lin-text-3)', fontSize: 14 }}>
            Manage your public link-in-bio profile.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={user?.username ? `/u/${user.username}/links` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(113,112,255,0.1)', color: 'var(--lin-violet)',
              border: '1px solid rgba(113,112,255,0.2)',
              transition: 'all 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(113,112,255,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(113,112,255,0.1)'; }}>
            <IconGlobe size={14} /> Preview profile
          </a>
          <button
            onClick={() => setShowAdd(true)}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
              color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(236,72,153,0.45)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(236,72,153,0.35)'; }}>
            <IconPlus size={15} /> Add Link
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="anim-scale-in" style={{
          background: 'var(--lin-surface)', border: '1px solid var(--lin-border-3)',
          borderRadius: 14, padding: '22px 24px', marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lin-text-1)' }}>Add new link</span>
            <button onClick={() => setShowAdd(false)} style={{ color: 'var(--lin-text-4)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-4)'; }}>
              <IconX size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Platform</label>
              <select
                value={form.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--lin-border-2)',
                  borderRadius: 8, padding: '9px 12px', color: 'var(--lin-text-1)', fontSize: 14,
                  outline: 'none',
                }}>
                {Object.entries(SOCIAL_PLATFORMS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Display label</label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Label"
                className="input-dark"
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…"
              type="url"
              className="input-dark"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => addLink.mutate()}
              disabled={!form.url.trim() || addLink.isPending}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
                color: '#fff', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: !form.url.trim() ? 0.5 : 1,
              }}>
              {addLink.isPending ? <span className="spinner" style={{ width: 15, height: 15 }} /> : <IconPlus size={14} />}
              Add link
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      ) : localLinks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {localLinks.map((link, i) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  delay={i * 50}
                  onToggle={() => toggleVisibility.mutate({ id: link.id, isVisible: !link.isVisible })}
                  onDelete={() => deleteLink.mutate(link.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <EmptyLinks onAdd={() => setShowAdd(true)} />
      )}
    </div>
  );
}

function LinkRow({ link, delay, onToggle, onDelete }: {
  link: SocialLink; delay: number;
  onToggle: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bg = PLATFORM_COLORS[link.platform] ?? '#7c3aed';
  const platformLabel = PLATFORM_LABELS[link.platform] ?? link.platform;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        display: 'flex', alignItems: 'center', gap: 12,
        background: hov ? 'var(--lin-hover)' : 'var(--lin-surface)',
        border: `1px solid ${hov ? 'var(--lin-border-3)' : 'var(--lin-border-2)'}`,
        borderRadius: 12, padding: '12px 16px',
        opacity: isDragging ? 0.4 : link.isVisible ? 1 : 0.55,
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'all 0.16s var(--ease-smooth)',
        boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        zIndex: isDragging ? 100 : 0,
        position: 'relative',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDelete(false); }}>
      {/* Drag handle */}
      <div
        {...listeners}
        style={{ color: 'var(--lin-text-4)', cursor: 'grab', padding: '0 2px', flexShrink: 0, touchAction: 'none' }}>
        <IconGripVertical size={16} />
      </div>

      {/* Platform badge */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: bg === '#000000' || bg === '#010101' || bg === '#24292e'
          ? `linear-gradient(135deg, ${bg}, ${bg}cc)`
          : bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hov ? `0 4px 12px ${bg}50` : 'none',
        transition: 'box-shadow 0.16s',
      }}>
        <IconLink size={16} style={{ color: '#fff' }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-1)' }}>{link.label}</div>
        <div style={{ fontSize: 12, color: 'var(--lin-text-4)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <span style={{
            background: `${bg}18`, color: bg === '#000000' ? 'var(--lin-text-3)' : bg,
            borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600,
          }}>{platformLabel}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</span>
        </div>
      </div>

      {/* Visibility toggle */}
      <button
        onClick={onToggle}
        aria-label={link.isVisible ? 'Hide link' : 'Show link'}
        style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0,
          background: link.isVisible
            ? 'linear-gradient(135deg, #7170ff, #5e6ad2)'
            : 'var(--lin-border-2)',
          position: 'relative',
          transition: 'background 0.22s var(--ease-smooth)',
          border: 'none', cursor: 'pointer',
        }}>
        <div style={{
          position: 'absolute', top: 3,
          left: link.isVisible ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transition: 'left 0.22s var(--ease-spring)',
        }} />
      </button>

      {/* Delete */}
      {confirmDelete ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--lin-text-3)' }}>Sure?</span>
          <button
            onClick={onDelete}
            style={{
              padding: '4px 10px', borderRadius: 6, background: '#ef444420',
              color: '#ef4444', fontSize: 12, fontWeight: 600, border: '1px solid #ef444430',
              transition: 'all 0.15s',
            }}>
            Delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--lin-border-2)', color: 'var(--lin-text-3)', fontSize: 12 }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete link"
          style={{
            color: 'var(--lin-text-4)', padding: 6, borderRadius: 7,
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-4)'; }}>
          <IconTrash size={15} />
        </button>
      )}
    </div>
  );
}

function EmptyLinks({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="anim-fade-up" style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--lin-surface)', border: '1px dashed var(--lin-border-2)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <IconLink size={26} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', marginBottom: 8 }}>No links yet</h3>
      <p style={{ color: 'var(--lin-text-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Add your social media links to build your public profile.
      </p>
      <button onClick={onAdd} className="btn" style={{
        background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
        color: '#fff', padding: '10px 22px', fontSize: 14, borderRadius: 9,
        display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600,
        boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
      }}>
        <IconPlus size={16} /> Add first link
      </button>
    </div>
  );
}
