import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import {
  IconX, IconPencil, IconCheck, IconTrash, IconArchive, IconTag,
  IconMessageSquare, IconImage, IconCalendar, IconGrid, IconPlus,
  IconRotateCcw, IconAlertCircle,
} from '../ui/icons.js';
import { format } from 'date-fns';
import type { CardDetail, ChecklistItem, CardComment } from '@bethflow/shared';

const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#1f2937',
];

interface Props {
  cardId: string;
  boardId: string;
  listColor: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function CardModal({ cardId, boardId, listColor, onClose, onDelete }: Props) {
  const qc = useQueryClient();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMediaEdit, setShowMediaEdit] = useState(false);
  const [mediaUrlDraft, setMediaUrlDraft] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [addingCheck, setAddingCheck] = useState(false);
  const [newComment, setNewComment] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: CardDetail }>(`/cards/${cardId}`);
      return res.data.data;
    },
  });

  const { data: catalogs } = useQuery({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: { id: string; title: string }[] }>('/catalogs');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (card) {
      setTitleDraft(card.title);
      setDescDraft(card.description ?? '');
      setMediaUrlDraft(card.mediaUrl ?? '');
    }
  }, [card]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['card', cardId] });
    void qc.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const updateCard = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(`/cards/${cardId}`, data),
    onSuccess: invalidate,
  });

  const addCheckItem = useMutation({
    mutationFn: (text: string) => api.post(`/cards/${cardId}/checklist`, { text }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['card', cardId] }); setNewCheckItem(''); setAddingCheck(false); },
  });

  const toggleCheckItem = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      api.patch(`/cards/${cardId}/checklist/${itemId}`, { isChecked }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const deleteCheckItem = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cards/${cardId}/checklist/${itemId}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const postComment = useMutation({
    mutationFn: (content: string) => api.post(`/cards/${cardId}/comments`, { content }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['card', cardId] }); setNewComment(''); },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => api.delete(`/cards/${cardId}/comments/${commentId}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['card', cardId] }),
  });

  const handleArchive = () => {
    if (!card) return;
    updateCard.mutate({ isArchived: !card.isArchived });
  };

  const handleKeyEsc = (e: React.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

  if (isLoading || !card) {
    return (
      <ModalOverlay onClose={onClose}>
        <div style={{ padding: 32 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: i === 1 ? 28 : 16, marginBottom: 12, borderRadius: 6, width: i === 1 ? '60%' : '40%' }} />
          ))}
        </div>
      </ModalOverlay>
    );
  }

  const checkedCount = card.checklist.filter((i) => i.isChecked).length;
  const totalItems = card.checklist.length;
  const checkPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <ModalOverlay onClose={onClose}>
      {/* Color bar */}
      <div style={{ height: 5, background: card.color ?? listColor, borderRadius: '12px 12px 0 0' }} />

      {/* Archive badge */}
      {card.isArchived && (
        <div style={{ margin: '12px 20px 0', padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconArchive size={14} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>This card is archived</span>
          <button onClick={handleArchive} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Restore</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 0, padding: '20px 20px 24px' }}>
        {/* Main column */}
        <div style={{ paddingRight: 20, borderRight: '1px solid var(--lin-border-1)' }}>

          {/* Title */}
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { updateCard.mutate({ title: titleDraft }); setEditingTitle(false); }
                if (e.key === 'Escape') { setTitleDraft(card.title); setEditingTitle(false); }
              }}
              onBlur={() => { if (titleDraft.trim() && titleDraft !== card.title) updateCard.mutate({ title: titleDraft }); setEditingTitle(false); }}
              autoFocus
              style={{ width: '100%', fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-3)', borderRadius: 8, padding: '6px 10px', outline: 'none', fontFamily: 'inherit' }}
            />
          ) : (
            <h2
              onClick={() => { setEditingTitle(true); }}
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px', lineHeight: 1.35, cursor: 'text', padding: '4px 6px', borderRadius: 6, marginLeft: -6, transition: 'background 0.12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {card.title}
            </h2>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {card.startDate && (
              <MetaChip icon={<IconCalendar size={11} />} label={`Start: ${format(new Date(card.startDate), 'MMM d')}`} color="#7170ff" />
            )}
            {card.endDate && (
              <MetaChip icon={<IconCalendar size={11} />} label={`Due: ${format(new Date(card.endDate), 'MMM d')}`} color={new Date(card.endDate) < new Date() ? '#ef4444' : '#10b981'} />
            )}
            {card.catalog && (
              <MetaChip icon={<IconGrid size={11} />} label={card.catalog.title} color="#f59e0b" />
            )}
          </div>

          {/* Description */}
          <SectionLabel icon={<IconPencil size={13} />} title="Description" />
          {editingDesc ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                ref={descRef}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setDescDraft(card.description ?? ''); setEditingDesc(false); }
                }}
                rows={4}
                placeholder="Add a description…"
                style={{ width: '100%', resize: 'vertical', minHeight: 80, background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-3)', borderRadius: 8, padding: '10px 12px', color: 'var(--lin-text-1)', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => { updateCard.mutate({ description: descDraft || null }); setEditingDesc(false); }} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6 }}>Save</button>
                <button onClick={() => { setDescDraft(card.description ?? ''); setEditingDesc(false); }} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              style={{ marginTop: 6, minHeight: 36, padding: '8px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: '1px solid transparent', cursor: 'text', fontSize: 13, color: card.description ? 'var(--lin-text-2)' : 'var(--lin-text-4)', lineHeight: 1.6, transition: 'all 0.12s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--lin-border-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
            >
              {card.description || <span style={{ fontStyle: 'italic' }}>Click to add a description…</span>}
            </div>
          )}

          {/* Media */}
          {card.mediaUrl && (
            <div style={{ marginTop: 16 }}>
              <SectionLabel icon={<IconImage size={13} />} title="Attachment" />
              <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--lin-border-2)', position: 'relative' }}>
                <img src={card.mediaUrl} alt="attachment" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <button
                  onClick={() => updateCard.mutate({ mediaUrl: null })}
                  style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconX size={12} />
                </button>
              </div>
            </div>
          )}

          {showMediaEdit && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <input value={mediaUrlDraft} onChange={(e) => setMediaUrlDraft(e.target.value)} placeholder="Image URL…" className="input-dark" style={{ flex: 1, fontSize: 12 }} onKeyDown={handleKeyEsc} />
              <button onClick={() => { updateCard.mutate({ mediaUrl: mediaUrlDraft || null }); setShowMediaEdit(false); }} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6 }}>Set</button>
              <button onClick={() => setShowMediaEdit(false)} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6 }}>Cancel</button>
            </div>
          )}

          {/* Checklist */}
          {(card.checklist.length > 0 || addingCheck) && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <SectionLabel icon={<IconCheck size={13} />} title="Checklist" />
                <span style={{ fontSize: 11, color: 'var(--lin-text-4)', fontWeight: 600 }}>{checkedCount}/{totalItems} ({checkPct}%)</span>
              </div>
              {totalItems > 0 && (
                <div style={{ height: 4, borderRadius: 2, background: 'var(--lin-border-2)', overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${checkPct}%`, background: checkPct === 100 ? '#10b981' : '#7170ff', transition: 'width 0.3s', borderRadius: 2 }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {card.checklist.map((item) => (
                  <ChecklistRow key={item.id} item={item}
                    onToggle={(checked) => toggleCheckItem.mutate({ itemId: item.id, isChecked: checked })}
                    onDelete={() => deleteCheckItem.mutate(item.id)} />
                ))}
              </div>
            </div>
          )}

          {addingCheck && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <input
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCheckItem.trim()) addCheckItem.mutate(newCheckItem.trim());
                  if (e.key === 'Escape') { setAddingCheck(false); setNewCheckItem(''); }
                }}
                placeholder="Checklist item…"
                autoFocus
                className="input-dark"
                style={{ flex: 1, fontSize: 13 }}
              />
              <button onClick={() => { if (newCheckItem.trim()) addCheckItem.mutate(newCheckItem.trim()); }} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6 }}>Add</button>
              <button onClick={() => { setAddingCheck(false); setNewCheckItem(''); }} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6 }}>Cancel</button>
            </div>
          )}

          {/* Comments */}
          <div style={{ marginTop: 22 }}>
            <SectionLabel icon={<IconMessageSquare size={13} />} title={`Comments (${card.comments.length})`} />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {card.comments.map((c) => (
                <CommentRow key={c.id} comment={c} onDelete={() => deleteComment.mutate(c.id)} />
              ))}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) { e.preventDefault(); postComment.mutate(newComment.trim()); } }}
                  placeholder="Write a comment… (Enter to post)"
                  rows={2}
                  style={{ flex: 1, resize: 'none', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit', outline: 'none' }}
                />
                {newComment.trim() && (
                  <button onClick={() => postComment.mutate(newComment.trim())} className="btn btn-primary" style={{ fontSize: 12, padding: '8px 12px', borderRadius: 7, flexShrink: 0 }}>Post</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ paddingLeft: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Actions</div>

          <SidebarBtn icon={<IconTag size={13} />} label="Label" onClick={() => setShowLabelPicker(!showLabelPicker)} />
          {showLabelPicker && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, padding: '8px 0' }}>
              <button
                onClick={() => { updateCard.mutate({ color: null }); setShowLabelPicker(false); }}
                style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={10} style={{ color: 'var(--lin-text-4)' }} />
              </button>
              {LABEL_COLORS.map((c) => (
                <button key={c} onClick={() => { updateCard.mutate({ color: c }); setShowLabelPicker(false); }}
                  style={{ width: 20, height: 20, borderRadius: 4, background: c, border: card.color === c ? '2px solid #fff' : 'none', cursor: 'pointer', boxShadow: card.color === c ? `0 0 0 2px ${c}` : 'none' }} />
              ))}
            </div>
          )}

          <SidebarBtn icon={<IconCalendar size={13} />} label="Dates" onClick={() => setShowDatePicker(!showDatePicker)} />
          {showDatePicker && (
            <div style={{ marginBottom: 10, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--lin-text-4)', marginBottom: 4, fontWeight: 600 }}>START</div>
                <input type="date" value={card.startDate ? card.startDate.slice(0, 10) : ''} onChange={(e) => updateCard.mutate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 6, padding: '5px 8px', color: 'var(--lin-text-1)', fontSize: 12, outline: 'none', colorScheme: 'dark' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--lin-text-4)', marginBottom: 4, fontWeight: 600 }}>DUE</div>
                <input type="date" value={card.endDate ? card.endDate.slice(0, 10) : ''} onChange={(e) => updateCard.mutate({ endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 6, padding: '5px 8px', color: 'var(--lin-text-1)', fontSize: 12, outline: 'none', colorScheme: 'dark' }} />
              </div>
            </div>
          )}

          <SidebarBtn icon={<IconCheck size={13} />} label="Checklist" onClick={() => setAddingCheck(true)} />

          <SidebarBtn icon={<IconImage size={13} />} label="Attachment" onClick={() => { setShowMediaEdit(!showMediaEdit); setMediaUrlDraft(card.mediaUrl ?? ''); }} />

          {catalogs && catalogs.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '14px 0 6px' }}>Catalog</div>
              <select
                value={card.catalogId ?? ''}
                onChange={(e) => updateCard.mutate({ catalogId: e.target.value || null })}
                style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 7, padding: '7px 8px', color: 'var(--lin-text-2)', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                <option value="">None</option>
                {catalogs.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </>
          )}

          <div style={{ height: 1, background: 'var(--lin-border-1)', margin: '14px 0' }} />

          <SidebarBtn
            icon={card.isArchived ? <IconRotateCcw size={13} /> : <IconArchive size={13} />}
            label={card.isArchived ? 'Restore' : 'Archive'}
            onClick={handleArchive}
            danger={!card.isArchived}
          />
          {onDelete && (
            <SidebarBtn
              icon={<IconTrash size={13} />}
              label="Delete"
              onClick={() => { if (confirm('Permanently delete this card?')) { onDelete(cardId); onClose(); } }}
              danger
            />
          )}
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.14s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-3)'; }}>
        <IconX size={15} />
      </button>
    </ModalOverlay>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="anim-scale-in"
        style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-2)', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ color: 'var(--lin-text-3)' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lin-text-3)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{title}</span>
    </div>
  );
}

function SidebarBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: 'transparent', border: 'none', color: danger ? '#ef4444' : 'var(--lin-text-2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 2, transition: 'all 0.12s', textAlign: 'left' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
      <span style={{ color: danger ? '#ef4444' : 'var(--lin-text-4)', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

function MetaChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {icon} {label}
    </div>
  );
}

function ChecklistRow({ item, onToggle, onDelete }: { item: ChecklistItem; onToggle: (v: boolean) => void; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, background: hov ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button
        onClick={() => onToggle(!item.isChecked)}
        style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.isChecked ? '#10b981' : 'var(--lin-border-3)'}`, background: item.isChecked ? '#10b981' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', padding: 0 }}>
        {item.isChecked && <IconCheck size={11} style={{ color: '#fff', strokeWidth: 3 }} />}
      </button>
      <span style={{ flex: 1, fontSize: 13, color: item.isChecked ? 'var(--lin-text-4)' : 'var(--lin-text-1)', textDecoration: item.isChecked ? 'line-through' : 'none', lineHeight: 1.4 }}>{item.text}</span>
      {hov && (
        <button onClick={onDelete} style={{ width: 22, height: 22, borderRadius: 5, background: 'transparent', border: 'none', color: 'var(--lin-text-4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-4)'; }}>
          <IconTrash size={12} />
        </button>
      )}
    </div>
  );
}

function CommentRow({ comment, onDelete }: { comment: CardComment; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const initials = ((comment.user.displayName ?? comment.user.username)[0] ?? 'U').toUpperCase();
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, background: 'var(--lin-surface-2)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--lin-border-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-2)' }}>{comment.user.displayName ?? comment.user.username}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--lin-text-4)' }}>{format(new Date(comment.createdAt), 'MMM d, HH:mm')}</span>
            {hov && (
              <button onClick={onDelete} style={{ width: 20, height: 20, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--lin-text-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--lin-text-4)'; }}>
                <IconTrash size={11} />
              </button>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--lin-text-2)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
      </div>
    </div>
  );
}
