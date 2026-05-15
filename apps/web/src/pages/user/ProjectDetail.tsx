import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { format, differenceInDays, addDays, eachWeekOfInterval } from 'date-fns';
import {
  IconPlus, IconX, IconCheck, IconCalendar, IconCheckCircle,
  IconAlertCircle, IconTarget, IconClock, IconPencil,
} from '../../components/ui/icons.js';

interface Task {
  id: string; title: string; status: string;
  startDate: string; endDate: string; position: number;
  description: string | null;
}
interface ProjectData {
  id: string; title: string; description: string | null;
  tasks: Task[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{ size?: number; style?: React.CSSProperties }> }> = {
  TODO:        { label: 'Todo',        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  Icon: IconTarget },
  IN_PROGRESS: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  Icon: IconClock },
  DONE:        { label: 'Done',        color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   Icon: IconCheckCircle },
  BLOCKED:     { label: 'Blocked',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   Icon: IconAlertCircle },
};
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;

const GANTT_COLORS: Record<string, string> = {
  TODO:        'linear-gradient(90deg, #7c3aed, #8b5cf6)',
  IN_PROGRESS: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
  DONE:        'linear-gradient(90deg, #16a34a, #22c55e)',
  BLOCKED:     'linear-gradient(90deg, #dc2626, #ef4444)',
};

interface TaskFormState { title: string; description: string; status: string; startDate: string; endDate: string; }

export function ProjectDetailPage() {
  const { projectId } = useParams({ from: '/user-layout/projects/$projectId' });
  const qc = useQueryClient();
  const today = new Date();

  const emptyNew: TaskFormState = { title: '', description: '', status: 'TODO', startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(today, 7), 'yyyy-MM-dd') };
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<TaskFormState>(emptyNew);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(emptyNew);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: ProjectData }>(`/projects/${projectId}`);
      return res.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const createTask = useMutation({
    mutationFn: (f: TaskFormState) => api.post(`/projects/${projectId}/tasks`, {
      title: f.title,
      ...(f.description.trim() ? { description: f.description.trim() } : {}),
      status: f.status,
      startDate: new Date(f.startDate).toISOString(),
      endDate: new Date(f.endDate).toISOString(),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['project', projectId] });
      setAddingTask(false);
      setNewTask(emptyNew);
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, f }: { taskId: string; f: TaskFormState }) => api.patch(`/tasks/${taskId}`, {
      title: f.title,
      description: f.description.trim() || null,
      status: f.status,
      startDate: new Date(f.startDate).toISOString(),
      endDate: new Date(f.endDate).toISOString(),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['project', projectId] });
      setEditTask(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const openEditTask = (t: Task) => {
    setEditTask(t);
    setEditForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      startDate: t.startDate.slice(0, 10),
      endDate: t.endDate.slice(0, 10),
    });
  };

  if (isLoading) return <GanttSkeleton />;
  if (!project) return <div style={{ padding: 40, color: 'var(--air-text-3)' }}>Project not found.</div>;

  const tasks = project.tasks.slice().sort((a, b) => a.position - b.position);
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const inProg = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const allDates = tasks.flatMap((t) => [new Date(t.startDate), new Date(t.endDate)]);
  allDates.push(today);
  const rawMin = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const rawMax = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const timelineStart = addDays(rawMin, -3);
  const timelineEnd   = addDays(rawMax, 5);
  const totalDays = Math.max(differenceInDays(timelineEnd, timelineStart), 30);
  const weeks = eachWeekOfInterval({ start: timelineStart, end: timelineEnd });
  const todayOffset = (differenceInDays(today, timelineStart) / totalDays) * 100;

  return (
    <div style={{ minHeight: '100%', background: 'var(--air-bg)', color: 'var(--air-text-1)' }}>
      {/* Edit task modal */}
      {editTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditTask(null)}>
          <div style={{ background: 'var(--air-surface)', borderRadius: 14, padding: '24px 26px', width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--air-border)' }} onClick={(e) => e.stopPropagation()} className="anim-scale-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--air-text-1)' }}>Edit task</span>
              <button onClick={() => setEditTask(null)} style={{ color: 'var(--air-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IconX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>TITLE *</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input" autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>DESCRIPTION</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="input" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} placeholder="Add task details…" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>STATUS</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map((s) => {
                    const m = STATUS_META[s]!;
                    const active = editForm.status === s;
                    return (
                      <button key={s} onClick={() => setEditForm({ ...editForm, status: s })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: active ? `2px solid ${m.color}` : '2px solid transparent', background: active ? m.bg : 'var(--air-secondary)', color: m.color, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <m.Icon size={12} /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>START DATE</label>
                  <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>END DATE</label>
                  <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { if (editForm.title.trim()) updateTask.mutate({ taskId: editTask.id, f: editForm }); }}
                disabled={!editForm.title.trim() || updateTask.isPending}
                style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !editForm.title.trim() ? 0.5 : 1 }}>
                {updateTask.isPending ? <span className="spinner spinner-dark" style={{ width: 15, height: 15 }} /> : <IconCheck size={14} />} Save changes
              </button>
              <button onClick={() => setEditTask(null)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--air-secondary)', color: 'var(--air-text-2)', border: '1.5px solid var(--air-border)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-content" style={{ background: 'var(--air-surface)', borderBottom: '1px solid var(--air-border)', paddingBottom: 20 }}>
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(22,110,225,0.35)', flexShrink: 0 }}>
              <IconCalendar size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--air-text-1)', lineHeight: 1.2 }}>{project.title}</h1>
              {project.description && <p style={{ fontSize: 13, color: 'var(--air-text-3)', marginTop: 3 }}>{project.description}</p>}
            </div>
          </div>
          <button onClick={() => setAddingTask(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,110,225,0.35)', transition: 'all 0.18s' }} onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 6px 20px rgba(22,110,225,0.45)'; }} onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 4px 14px rgba(22,110,225,0.35)'; }}>
            <IconPlus size={15} /> Add task
          </button>
        </div>

        {tasks.length > 0 && (
          <div className="anim-fade-up delay-100" style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--air-text-3)', fontWeight: 500 }}>Overall progress</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#166ee1' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--air-border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #166ee1, #06b6d4)', width: `${progress}%`, animation: 'progressFill 0.8s var(--ease-out) both', boxShadow: '0 0 8px rgba(22,110,225,0.4)' }} />
              </div>
            </div>
            {[{ label: 'Total', val: tasks.length, color: 'var(--air-text-2)' }, { label: 'Done', val: done, color: '#22c55e' }, { label: 'In Progress', val: inProg, color: '#3b82f6' }, { label: 'Blocked', val: blocked, color: '#ef4444' }].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--air-text-3)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task panel */}
      {addingTask && (
        <div className="reveal-form page-content" style={{ background: 'var(--air-surface)', borderBottom: '1px solid var(--air-border)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--air-text-1)' }}>New task</span>
            <button onClick={() => { setAddingTask(false); setNewTask(emptyNew); }} style={{ color: 'var(--air-text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IconX size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>TITLE *</label>
              <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title…" autoFocus className="input" onKeyDown={(e) => { if (e.key === 'Enter' && newTask.title.trim()) createTask.mutate(newTask); if (e.key === 'Escape') { setAddingTask(false); setNewTask(emptyNew); } }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>DESCRIPTION (optional)</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Add task details…" className="input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>STATUS</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s]!;
                  const active = newTask.status === s;
                  return (
                    <button key={s} onClick={() => setNewTask({ ...newTask, status: s })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, border: active ? `2px solid ${m.color}` : '2px solid transparent', background: active ? m.bg : 'var(--air-secondary)', color: m.color, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <m.Icon size={12} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>START DATE</label>
              <input type="date" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', marginBottom: 5 }}>END DATE</label>
              <input type="date" value={newTask.endDate} onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })} className="input" style={{ fontSize: 13 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { if (newTask.title.trim()) createTask.mutate(newTask); }} disabled={!newTask.title.trim() || createTask.isPending} style={{ padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !newTask.title.trim() ? 0.5 : 1 }}>
              {createTask.isPending ? <span className="spinner spinner-dark" style={{ width: 15, height: 15 }} /> : <IconCheck size={14} />} Create task
            </button>
            <button onClick={() => { setAddingTask(false); setNewTask(emptyNew); }} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--air-secondary)', color: 'var(--air-text-2)', border: '1.5px solid var(--air-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !addingTask && (
        <div className="anim-fade-up" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px', background: 'linear-gradient(135deg, #166ee1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(22,110,225,0.3)' }}>
            <IconCalendar size={30} style={{ color: '#fff' }} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--air-text-1)', marginBottom: 8 }}>No tasks yet</h3>
          <p style={{ color: 'var(--air-text-3)', marginBottom: 24 }}>Add your first task to start building the timeline.</p>
          <button onClick={() => setAddingTask(true)} style={{ padding: '11px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #166ee1, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(22,110,225,0.35)' }}>
            <IconPlus size={16} /> Add first task
          </button>
        </div>
      )}

      {/* Gantt chart */}
      {tasks.length > 0 && (
        <div style={{ overflow: 'auto' }}>
          <div style={{ minWidth: 900 }}>
            {/* Timeline header */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--air-border-dark)', background: 'var(--air-secondary)', position: 'sticky', top: 0, zIndex: 20 }}>
              <div style={{ width: 'clamp(200px, 30vw, 360px)', flexShrink: 0, padding: '10px 16px', borderRight: '1px solid var(--air-border-dark)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--air-text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Task / Status</span>
              </div>
              <div style={{ flex: 1, position: 'relative', padding: '0 16px', height: 38, overflow: 'hidden' }}>
                {weeks.map((week, i) => {
                  const lp = (differenceInDays(week, timelineStart) / totalDays) * 100;
                  if (lp < 0 || lp > 100) return null;
                  return (
                    <div key={i} style={{ position: 'absolute', left: `calc(${lp}% + 16px)`, top: 10, fontSize: 11, fontWeight: 600, color: 'var(--air-text-3)', whiteSpace: 'nowrap' }}>
                      {format(week, 'MMM d')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task rows */}
            {tasks.map((task, idx) => {
              const start = Math.max(differenceInDays(new Date(task.startDate), timelineStart), 0);
              const end   = Math.min(differenceInDays(new Date(task.endDate), timelineStart) + 1, totalDays);
              const leftPct  = (start / totalDays) * 100;
              const widthPct = Math.max(((end - start) / totalDays) * 100, 1.5);
              const meta = STATUS_META[task.status] ?? STATUS_META['TODO']!;
              const isHov = hoveredRow === task.id;
              const { Icon } = meta;

              return (
                <div key={task.id} className="gantt-row anim-fade-up" style={{ animationDelay: `${idx * 50}ms`, background: isHov ? 'var(--air-row-hover)' : 'transparent' }} onMouseEnter={() => setHoveredRow(task.id)} onMouseLeave={() => setHoveredRow(null)}>
                  <div style={{ width: 'clamp(200px, 30vw, 360px)', flexShrink: 0, padding: '10px 16px', borderRight: '1px solid var(--air-border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--air-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: 'var(--air-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                      <div style={{ fontSize: 11, color: 'var(--air-text-3)', marginTop: 2 }}>{format(new Date(task.startDate), 'MMM d')} – {format(new Date(task.endDate), 'MMM d, yyyy')}</div>
                    </div>
                    <button onClick={() => { const i = STATUS_ORDER.indexOf(task.status as typeof STATUS_ORDER[number]); updateStatus.mutate({ taskId: task.id, status: STATUS_ORDER[(i + 1) % STATUS_ORDER.length]! }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }} title="Click to cycle status">
                      <Icon size={11} /> {meta.label}
                    </button>
                    {isHov && (
                      <>
                        <button onClick={() => openEditTask(task)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(22,110,225,0.1)', color: '#166ee1', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }} title="Edit task" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,110,225,0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,110,225,0.1)'; }}>
                          <IconPencil size={12} />
                        </button>
                        <button onClick={() => deleteTask.mutate(task.id)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }} title="Delete task" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}>
                          <IconX size={12} />
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1, position: 'relative', padding: '8px 16px', height: 44 }}>
                    {weeks.map((week, wi) => {
                      const lp = (differenceInDays(week, timelineStart) / totalDays) * 100;
                      if (lp < 0 || lp > 100) return null;
                      return <div key={wi} style={{ position: 'absolute', left: `calc(${lp}% + 16px)`, top: 0, bottom: 0, width: 1, background: 'var(--air-border)', opacity: 0.5 }} />;
                    })}
                    <div className="today-marker" style={{ left: `calc(${todayOffset}% + 16px)` }} />
                    <div className="gantt-bar" style={{ position: 'absolute', left: `calc(${leftPct}% + 16px)`, width: `calc(${widthPct}%)`, top: 8, height: 28, background: GANTT_COLORS[task.status] ?? GANTT_COLORS['TODO']!, animationDelay: `${idx * 60 + 200}ms`, boxShadow: isHov ? `0 4px 16px ${meta.color}40` : 'none', transition: 'box-shadow 0.2s' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', zIndex: 1 }}>{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GanttSkeleton() {
  return (
    <div style={{ background: 'var(--air-bg)', minHeight: '100%' }}>
      <div style={{ background: 'var(--air-surface)', borderBottom: '1px solid var(--air-border)', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div className="skeleton-light" style={{ width: 40, height: 40, borderRadius: 11 }} />
          <div>
            <div className="skeleton-light" style={{ width: 200, height: 22, marginBottom: 8 }} />
            <div className="skeleton-light" style={{ width: 140, height: 14 }} />
          </div>
        </div>
        <div className="skeleton-light" style={{ height: 8, borderRadius: 4 }} />
      </div>
      <div style={{ padding: '0' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: 44, borderBottom: '1px solid var(--air-border)' }}>
            <div style={{ width: 'clamp(200px, 30vw, 360px)', padding: '0 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="skeleton-light" style={{ flex: 1, height: 14 }} />
              <div className="skeleton-light" style={{ width: 70, height: 20, borderRadius: 999 }} />
            </div>
            <div style={{ flex: 1, padding: '0 16px' }}>
              <div className="skeleton-light" style={{ height: 24, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
