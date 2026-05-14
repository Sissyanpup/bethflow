import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { joinBoard, leaveBoard } from '../../lib/socket.js';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconPlus, IconX, IconKanban, IconArchive, IconCheck,
  IconGripVertical, IconPencil, IconGlobe, IconLock,
} from '../../components/ui/icons.js';
import { CardModal } from '../../components/board/CardModal.js';

interface Card {
  id: string; title: string; description: string | null;
  position: number; color: string | null; isArchived: boolean;
}
interface List { id: string; title: string; position: number; cards: Card[]; }
interface BoardData { id: string; title: string; color: string | null; description: string | null; isPublic: boolean; lists: List[]; }

const LIST_COLORS = ['#7170ff','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444','#8b5cf6','#14b8a6'];

export function BoardDetailPage() {
  const { boardId } = useParams({ from: '/user-layout/boards/$boardId' });
  const qc = useQueryClient();
  const [lists, setLists] = useState<List[]>([]);
  const [activeCard, setActiveCard] = useState<(Card & { listId: string }) | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [showEditBoard, setShowEditBoard] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: BoardData }>(`/boards/${boardId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (board) setLists(board.lists.slice().sort((a, b) => a.position - b.position));
  }, [board]);

  useEffect(() => {
    joinBoard(boardId);
    return () => leaveBoard(boardId);
  }, [boardId]);

  const createList = useMutation({
    mutationFn: (title: string) => api.post(`/boards/${boardId}/lists`, { title }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['board', boardId] }); setAddingList(false); setNewListTitle(''); },
  });

  const createCard = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      api.post(`/cards/list/${listId}`, { title }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['board', boardId] }); setAddingCardListId(null); },
  });

  const archiveList = useMutation({
    mutationFn: (listId: string) => api.patch(`/lists/${listId}`, { isArchived: true }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const deleteCard = useMutation({
    mutationFn: (cardId: string) => api.delete(`/cards/${cardId}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['board', boardId] }); setOpenCardId(null); },
  });

  const reorderCard = useMutation({
    mutationFn: (payload: { cardId: string; sourceListId: string; targetListId: string; position: number }) =>
      api.post('/cards/reorder', {
        cardId: payload.cardId,
        sourceListId: payload.sourceListId,
        destinationListId: payload.targetListId,
        newPosition: payload.position,
      }),
    onError: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const listId = e.active.data.current?.listId as string;
    const list = lists.find((l) => l.id === listId);
    const card = list?.cards.find((c) => c.id === e.active.id);
    if (card && listId) setActiveCard({ ...card, listId });
  }, [lists]);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromListId = active.data.current?.listId as string;
    // over could be a card (data.listId) or a droppable list column (id = listId)
    const toListId = (over.data.current?.listId ?? over.id) as string;
    if (fromListId === toListId) return; // same-list handled in dragEnd

    setLists((prev) => {
      const fromList = prev.find((l) => l.id === fromListId);
      const toList = prev.find((l) => l.id === toListId);
      if (!fromList || !toList) return prev;
      const card = fromList.cards.find((c) => c.id === active.id);
      if (!card) return prev;
      const newFrom = fromList.cards.filter((c) => c.id !== active.id);
      const overIdx = toList.cards.findIndex((c) => c.id === over.id);
      const newTo = [...toList.cards];
      newTo.splice(overIdx >= 0 ? overIdx : newTo.length, 0, card);
      return prev.map((l) =>
        l.id === fromListId ? { ...l, cards: newFrom } :
        l.id === toListId ? { ...l, cards: newTo } : l
      );
    });
    if (activeCard) setActiveCard({ ...activeCard, listId: toListId });
  }, [activeCard]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCard(null);
    if (!over || !activeCard) return;

    const fromListId = activeCard.listId;
    const toListId = (over.data.current?.listId ?? over.id) as string;

    if (fromListId === toListId) {
      // Same-list reorder
      const list = lists.find((l) => l.id === fromListId);
      if (!list) return;
      const oldIdx = list.cards.findIndex((c) => c.id === active.id);
      const newIdx = list.cards.findIndex((c) => c.id === over.id);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      const reordered = arrayMove(list.cards, oldIdx, newIdx);
      setLists((prev) => prev.map((l) => l.id === fromListId ? { ...l, cards: reordered } : l));
      reorderCard.mutate({ cardId: active.id as string, sourceListId: fromListId, targetListId: fromListId, position: newIdx });
    } else {
      // Cross-list: state already updated in handleDragOver
      const targetList = lists.find((l) => l.id === toListId);
      const cardIdx = targetList?.cards.findIndex((c) => c.id === active.id) ?? 0;
      reorderCard.mutate({ cardId: active.id as string, sourceListId: fromListId, targetListId: toListId, position: Math.max(0, cardIdx) });
    }
  }, [activeCard, lists, reorderCard]);

  if (isLoading) return <BoardSkeleton />;
  if (!board) return <div style={{ padding: 48, color: 'var(--lin-text-3)', textAlign: 'center' }}>Board not found.</div>;

  const accentColor = board.color ?? '#7170ff';

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Board header */}
          <div style={{ padding: '18px 28px 16px', borderBottom: '1px solid var(--lin-border-1)', background: 'var(--lin-panel)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${accentColor}50` }}>
                <IconKanban size={18} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--lin-text-1)', lineHeight: 1.2 }}>{board.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: board.isPublic ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', color: board.isPublic ? '#10b981' : 'var(--lin-text-4)', border: `1px solid ${board.isPublic ? 'rgba(16,185,129,0.25)' : 'var(--lin-border-1)'}` }}>
                    {board.isPublic ? <IconGlobe size={11} /> : <IconLock size={11} />}
                    {board.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
                {board.description && <p style={{ fontSize: 13, color: 'var(--lin-text-4)', marginTop: 2 }}>{board.description}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--lin-surface)', border: '1px solid var(--lin-border-2)', borderRadius: 7, padding: '5px 10px', fontSize: 12, color: 'var(--lin-text-3)', fontWeight: 500 }}>
                  <IconKanban size={12} style={{ color: accentColor }} />
                  {lists.length} {lists.length === 1 ? 'list' : 'lists'}
                </span>
                <button onClick={() => setShowEditBoard(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lin-border-2)', color: 'var(--lin-text-3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.14s' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(113,112,255,0.1)'; el.style.color = 'var(--lin-violet)'; el.style.borderColor = 'rgba(113,112,255,0.3)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.05)'; el.style.color = 'var(--lin-text-3)'; el.style.borderColor = 'var(--lin-border-2)'; }}>
                  <IconPencil size={13} /> Edit
                </button>
              </div>
            </div>
          </div>

          {/* Kanban area */}
          <div className="kanban-board" style={{ flex: 1, padding: '20px 24px' }}>
            {lists.map((list, listIdx) => {
              const listColor = LIST_COLORS[listIdx % LIST_COLORS.length]!;
              return (
                <KanbanColumn
                  key={list.id}
                  list={list}
                  listColor={listColor}
                  addingCard={addingCardListId === list.id}
                  onAddCard={() => setAddingCardListId(list.id)}
                  onCancelAddCard={() => setAddingCardListId(null)}
                  onCreateCard={(title) => createCard.mutate({ listId: list.id, title })}
                  onArchiveList={() => archiveList.mutate(list.id)}
                  onOpenCard={setOpenCardId}
                  activeCardId={activeCard?.id ?? null}
                />
              );
            })}

            {/* Add list */}
            <div style={{ minWidth: 272, maxWidth: 272, flexShrink: 0 }}>
              {addingList ? (
                <div className="kanban-column reveal-form" style={{ padding: '14px 14px' }}>
                  <input value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newListTitle.trim()) createList.mutate(newListTitle);
                      if (e.key === 'Escape') { setAddingList(false); setNewListTitle(''); }
                    }}
                    placeholder="List title…" autoFocus className="input-dark" style={{ marginBottom: 10 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (newListTitle.trim()) createList.mutate(newListTitle); }} disabled={!newListTitle.trim() || createList.isPending}
                      style={{ flex: 1, padding: '8px', borderRadius: 7, background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: !newListTitle.trim() ? 0.5 : 1, transition: 'all 0.15s', border: 'none', cursor: 'pointer' }}>
                      <IconCheck size={14} /> Add
                    </button>
                    <button onClick={() => { setAddingList(false); setNewListTitle(''); }} className="btn-icon"><IconX size={15} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingList(true)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--lin-border-2)', color: 'var(--lin-text-4)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.18s var(--ease-smooth)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(113,112,255,0.06)'; el.style.borderColor = 'rgba(113,112,255,0.3)'; el.style.color = 'var(--lin-violet)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'var(--lin-border-2)'; el.style.color = 'var(--lin-text-4)'; }}>
                  <IconPlus size={16} /> Add list
                </button>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="kanban-card drag-overlay" style={{ minWidth: 240, padding: '11px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-1)' }}>{activeCard.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {openCardId && (
        <CardModal
          cardId={openCardId}
          boardId={boardId}
          listColor={LIST_COLORS[0]!}
          onClose={() => setOpenCardId(null)}
          onDelete={(id) => deleteCard.mutate(id)}
        />
      )}

      {showEditBoard && board && (
        <EditBoardModal
          board={board}
          boardId={boardId}
          onClose={() => setShowEditBoard(false)}
          onSaved={() => { void qc.invalidateQueries({ queryKey: ['board', boardId] }); setShowEditBoard(false); }}
        />
      )}
    </>
  );
}

function KanbanColumn({ list, listColor, addingCard, onAddCard, onCancelAddCard, onCreateCard, onArchiveList, onOpenCard, activeCardId }: {
  list: List; listColor: string; addingCard: boolean;
  onAddCard: () => void; onCancelAddCard: () => void; onCreateCard: (t: string) => void;
  onArchiveList: () => void; onOpenCard: (id: string) => void;
  activeCardId: string | null;
}) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const cardIds = list.cards.map((c) => c.id);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: list.id });

  return (
    <div className="kanban-column">
      <div style={{ height: 3, background: listColor, flexShrink: 0 }} />
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--lin-border-1)', flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: listColor, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.title}</span>
        <span className="col-count">{list.cards.length}</span>
        <div style={{ position: 'relative' }}>
          <button className="btn-icon" onClick={() => setShowMenu(!showMenu)} style={{ width: 26, height: 26 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          {showMenu && (
            <div className="anim-morph-in" style={{ position: 'absolute', right: 0, top: 32, zIndex: 100, background: 'var(--lin-surface)', border: '1px solid var(--lin-border-2)', borderRadius: 10, padding: '4px', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', minWidth: 160 }} onMouseLeave={() => setShowMenu(false)}>
              <button onClick={() => { onArchiveList(); setShowMenu(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#f59e0b', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.1)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <IconArchive size={14} /> Archive list
              </button>
            </div>
          )}
        </div>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)', minHeight: 48, flex: 1, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent', transition: 'background 0.15s', background: isOver && list.cards.length === 0 ? 'rgba(113,112,255,0.06)' : 'transparent', borderRadius: 6 }}>
          {list.cards.length === 0 && (
            <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOver ? 'var(--lin-violet)' : 'var(--lin-text-4)', fontSize: 12, border: `1px dashed ${isOver ? 'rgba(113,112,255,0.4)' : 'var(--lin-border-1)'}`, borderRadius: 6, transition: 'all 0.15s' }}>Drop here</div>
          )}
          {list.cards.map((card, idx) => (
            <SortableCard key={card.id} card={card} listId={list.id} listColor={listColor} delay={idx * 40}
              isDragging={activeCardId === card.id}
              onOpen={() => onOpenCard(card.id)} />
          ))}
        </div>
      </SortableContext>

      <div style={{ padding: '6px 8px 10px', flexShrink: 0 }}>
        {addingCard ? (
          <div className="reveal-form" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, border: '1px solid var(--lin-border-2)' }}>
            <textarea value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newCardTitle.trim()) { e.preventDefault(); onCreateCard(newCardTitle.trim()); setNewCardTitle(''); }
                if (e.key === 'Escape') { onCancelAddCard(); setNewCardTitle(''); }
              }}
              placeholder="Card title… (Enter to add)" autoFocus rows={2}
              style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: 'var(--lin-text-1)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { if (newCardTitle.trim()) { onCreateCard(newCardTitle.trim()); setNewCardTitle(''); } }} disabled={!newCardTitle.trim()}
                style={{ flex: 1, padding: '7px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: listColor, color: '#fff', border: 'none', cursor: 'pointer', opacity: !newCardTitle.trim() ? 0.5 : 1, transition: 'opacity 0.12s' }}>Add card</button>
              <button onClick={() => { onCancelAddCard(); setNewCardTitle(''); }} className="btn-icon"><IconX size={14} /></button>
            </div>
          </div>
        ) : (
          <button onClick={onAddCard}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 7, background: 'transparent', border: 'none', color: 'var(--lin-text-4)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.14s var(--ease-smooth)', textAlign: 'left' }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'var(--lin-text-2)'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--lin-text-4)'; }}>
            <IconPlus size={14} /> Add card
          </button>
        )}
      </div>
    </div>
  );
}

function SortableCard({ card, listId, listColor, delay, isDragging, onOpen }: {
  card: Card; listId: string; listColor: string; delay: number; isDragging: boolean;
  onOpen: () => void;
}) {
  const [showBar, setShowBar] = useState(false);
  const cardColor = card.color ?? listColor;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({
    id: card.id,
    data: { listId, type: 'card' },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, animationDelay: `${delay}ms` }}
      className={`kanban-card anim-fade-up${isSortDragging ? ' dnd-dragging' : ''}`}
      {...attributes}
      onMouseEnter={() => setShowBar(true)}
      onMouseLeave={() => setShowBar(false)}
      onClick={onOpen}
    >
      {card.color && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: card.color, borderRadius: '8px 0 0 8px' }} />}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: listColor, borderRadius: '8px 0 0 8px', opacity: showBar && !card.color ? 1 : 0, transition: 'opacity 0.18s' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: (showBar || card.color) ? 8 : 2, transition: 'padding 0.18s' }}>
        <button {...listeners} onClick={(e) => e.stopPropagation()}
          style={{ color: showBar ? 'var(--lin-text-4)' : 'transparent', cursor: 'grab', padding: '2px 0', flexShrink: 0, marginTop: 1, background: 'none', border: 'none', transition: 'color 0.18s', touchAction: 'none' }}>
          <IconGripVertical size={14} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 590, color: 'var(--lin-text-1)', lineHeight: 1.45, letterSpacing: '-0.1px' }}>{card.title}</div>
          {card.description && (
            <div style={{ fontSize: 12, color: 'var(--lin-text-4)', marginTop: 5, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditBoardModal({ board, boardId, onClose, onSaved }: {
  board: BoardData; boardId: string; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(board.title);
  const [desc, setDesc] = useState(board.description ?? '');
  const [isPublic, setIsPublic] = useState(board.isPublic);
  const [color, setColor] = useState(board.color ?? '#7170ff');
  const [saving, setSaving] = useState(false);

  const COLORS = ['#7170ff','#5e6ad2','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#8b5cf6'];

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/boards/${boardId}`, { title: title.trim(), description: desc.trim() || null, color, isPublic });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-scale-in" style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-2)', borderRadius: 14, width: '100%', maxWidth: 420, padding: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', position: 'relative' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lin-text-1)', marginBottom: 20 }}>Edit Board</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-dark" placeholder="Board name" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Optional…"
            style={{ width: '100%', resize: 'none', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '8px 10px', color: 'var(--lin-text-1)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width: 28, height: 28, borderRadius: 7, background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.12s' }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Visibility</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setIsPublic(false)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1.5px solid ${!isPublic ? 'rgba(113,112,255,0.6)' : 'var(--lin-border-2)'}`, background: !isPublic ? 'rgba(113,112,255,0.1)' : 'transparent', color: !isPublic ? 'var(--lin-violet)' : 'var(--lin-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <IconLock size={14} /> Private
            </button>
            <button onClick={() => setIsPublic(true)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1.5px solid ${isPublic ? 'rgba(16,185,129,0.5)' : 'var(--lin-border-2)'}`, background: isPublic ? 'rgba(16,185,129,0.1)' : 'transparent', color: isPublic ? '#10b981' : 'var(--lin-text-3)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <IconGlobe size={14} /> Public
            </button>
          </div>
          {isPublic && <p style={{ fontSize: 11, color: 'var(--lin-text-4)', marginTop: 6 }}>Anyone with your profile link can view this board.</p>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>Cancel</button>
          <button onClick={() => void handleSave()} disabled={!title.trim() || saving}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: !title.trim() || saving ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconX size={15} />
        </button>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--lin-border-1)', background: 'var(--lin-panel)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div>
            <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 120, height: 14 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '20px 24px', flex: 1, alignItems: 'flex-start' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ minWidth: 272, background: 'var(--lin-panel)', border: '1px solid var(--lin-border-1)', borderRadius: 12, overflow: 'hidden' }}>
            <div className="skeleton" style={{ height: 3 }} />
            <div style={{ padding: 14 }}>
              <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 16 }} />
              {[1, 2, 3].map((j) => <div key={j} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 8 }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
