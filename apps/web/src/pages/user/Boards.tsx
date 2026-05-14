import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { IconPlus, IconX, IconKanban, IconTrash, IconCheck, IconDownload } from '../../components/ui/icons.js';
import { ExportModal } from '../../components/board/ExportModal.js';

interface Board { id: string; title: string; description: string | null; color: string | null; createdAt: string; }

const BOARD_GRADIENTS = [
  'linear-gradient(135deg, #7170ff, #5e6ad2)',
  'linear-gradient(135deg, #10b981, #0891b2)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #7c3aed)',
  'linear-gradient(135deg, #06b6d4, #2563eb)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
];

export function BoardsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Board[] }>('/boards');
      return res.data.data;
    },
  });

  const createBoard = useMutation({
    mutationFn: (t: string) => api.post('/boards', { title: t }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['boards'] }); setShowNew(false); setTitle(''); },
  });

  const deleteBoard = useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['boards'] }),
  });

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.7px', marginBottom: 4 }}>Boards</h1>
          <p style={{ color: 'var(--lin-text-3)', fontSize: 14 }}>
            {data ? `${data.length} board${data.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowExport(true)} className="btn"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(16,185,129,0.2)', transition: 'all 0.18s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; }}>
            <IconDownload size={15} /> Export
          </button>
          <button
          onClick={() => setShowNew(true)}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
            color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13,
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(113,112,255,0.35)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(113,112,255,0.45)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(113,112,255,0.35)'; }}>
          <IconPlus size={15} /> New Board
        </button>
        </div>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="anim-scale-in" style={{
          background: 'var(--lin-surface)',
          border: '1px solid var(--lin-border-3)',
          borderRadius: 12, padding: '20px 22px',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-2)', marginBottom: 14 }}>Create new board</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) createBoard.mutate(title); if (e.key === 'Escape') setShowNew(false); }}
              placeholder="Board title…"
              autoFocus
              className="input-dark"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => createBoard.mutate(title)}
              disabled={!title.trim() || createBoard.isPending}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
                color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
                opacity: !title.trim() ? 0.5 : 1,
              }}>
              {createBoard.isPending ? <span className="spinner" /> : 'Create'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="btn btn-ghost"
              style={{ padding: '8px 12px', borderRadius: 8 }}>
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Boards grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />)}
        </div>
      ) : data && data.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {data.map((board, i) => (
            <BoardCard key={board.id} board={board} gradient={BOARD_GRADIENTS[i % BOARD_GRADIENTS.length]!} delay={i * 50} onDelete={() => deleteBoard.mutate(board.id)} />
          ))}
        </div>
      ) : (
        <EmptyBoards onNew={() => setShowNew(true)} />
      )}

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
}

function BoardCard({ board, gradient, delay, onDelete }: { board: Board; gradient: string; delay: number; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const accentColor = board.color ?? '#7170ff';

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative', borderRadius: 12,
        background: hov ? 'var(--lin-hover)' : 'var(--lin-surface)',
        border: `1px solid ${hov ? 'var(--lin-border-3)' : 'var(--lin-border-2)'}`,
        overflow: 'hidden',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.25)' : '0 1px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.18s var(--ease-out)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}>
      <Link
        to="/boards/$boardId"
        params={{ boardId: board.id }}
        style={{ display: 'block', padding: 20, textDecoration: 'none' }}>
        <div style={{
          height: 6, width: '100%', borderRadius: 3,
          background: board.color ?? gradient,
          marginBottom: 16,
          boxShadow: hov ? `0 2px 8px ${accentColor}50` : 'none',
          transition: 'box-shadow 0.18s',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: board.color ?? gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.8,
          }}>
            <IconKanban size={15} style={{ color: '#fff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--lin-text-1)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {board.title}
            </div>
            {board.description && (
              <div style={{
                fontSize: 12, color: 'var(--lin-text-4)', marginTop: 3, lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {board.description}
              </div>
            )}
          </div>
        </div>
      </Link>
      {/* Delete overlay */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
        display: 'flex', gap: 4,
      }}>
        {confirm ? (
          <>
            <button
              onClick={(e) => { e.preventDefault(); onDelete(); }}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
              <IconCheck size={11} /> Yes, delete
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setConfirm(false); }}
              style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 11,
                background: 'var(--lin-border-2)', color: 'var(--lin-text-3)',
                border: 'none', cursor: 'pointer',
              }}>
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); setConfirm(true); }}
            aria-label="Delete board"
            style={{
              width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; }}>
            <IconTrash size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyBoards({ onNew }: { onNew: () => void }) {
  return (
    <div className="anim-fade-up" style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--lin-surface)',
      border: '1px dashed var(--lin-border-2)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <IconKanban size={26} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', marginBottom: 8 }}>No boards yet</h3>
      <p style={{ color: 'var(--lin-text-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Create your first board and start organizing your work.
      </p>
      <button onClick={onNew} className="btn" style={{
        background: 'linear-gradient(135deg, #7170ff, #5e6ad2)',
        color: '#fff', padding: '10px 22px', fontSize: 14, borderRadius: 9,
        display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600,
        boxShadow: '0 4px 14px rgba(113,112,255,0.35)',
      }}>
        <IconPlus size={16} /> Create first board
      </button>
    </div>
  );
}
