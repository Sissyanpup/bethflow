import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { IconPlus, IconX, IconCalendar, IconChevronRight, IconTrash, IconDownload } from '../../components/ui/icons.js';
import { format } from 'date-fns';
import { ExportModal } from '../../components/board/ExportModal.js';

interface Project { id: string; title: string; description: string | null; createdAt: string; }

const PROJECT_COLORS = ['#7170ff', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

export function ProjectsPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [title, setTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: Project[] }>('/projects');
      return res.data.data;
    },
  });

  const createProject = useMutation({
    mutationFn: (t: string) => api.post('/projects', { title: t }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['projects'] }); setShowNew(false); setTitle(''); },
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.7px', marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--lin-text-3)', fontSize: 14 }}>
            {data ? `${data.length} project${data.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowExport(true)}
            className="btn"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(16,185,129,0.2)', transition: 'all 0.18s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)'; }}
          >
            <IconDownload size={15} /> Export
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #10b981, #0891b2)',
              color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.45)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; }}
          >
            <IconPlus size={15} /> New Project
          </button>
        </div>
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      </div>

      {/* Create form */}
      {showNew && (
        <div className="anim-scale-in" style={{
          background: 'var(--lin-surface)', border: '1px solid var(--lin-border-3)',
          borderRadius: 12, padding: '20px 22px', marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-2)', marginBottom: 14 }}>Create new project</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) createProject.mutate(title); if (e.key === 'Escape') setShowNew(false); }}
              placeholder="Project title…"
              autoFocus
              className="input-dark"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => createProject.mutate(title)}
              disabled={!title.trim() || createProject.isPending}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981, #0891b2)',
                color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
                opacity: !title.trim() ? 0.5 : 1,
              }}>
              {createProject.isPending ? <span className="spinner" /> : 'Create'}
            </button>
            <button onClick={() => setShowNew(false)} className="btn btn-ghost" style={{ padding: '8px 12px', borderRadius: 8 }}>
              <IconX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Projects list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
        </div>
      ) : data && data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((project, i) => (
            <ProjectRow key={project.id} project={project} color={PROJECT_COLORS[i % PROJECT_COLORS.length]!} delay={i * 50} onDelete={() => deleteProject.mutate(project.id)} />
          ))}
        </div>
      ) : (
        <EmptyProjects onNew={() => setShowNew(true)} />
      )}
    </div>
  );
}

function ProjectRow({ project, color, delay, onDelete }: { project: Project; color: string; delay: number; onDelete: () => void }) {
  const [hov, setHov] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        borderRadius: 10,
        background: hov ? 'var(--lin-hover)' : 'var(--lin-surface)',
        border: `1px solid ${hov ? 'var(--lin-border-3)' : 'var(--lin-border-2)'}`,
        transition: 'all 0.15s var(--ease-smooth)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirm(false); }}>
      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', textDecoration: 'none',
          transform: hov ? 'translateX(3px)' : 'translateX(0)',
          transition: 'transform 0.15s var(--ease-smooth)',
          paddingRight: hov ? 120 : '18px',
        }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: `${color}20`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconCalendar size={17} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lin-text-1)' }}>{project.title}</div>
          {project.description && (
            <div style={{ fontSize: 12, color: 'var(--lin-text-4)', marginTop: 2 }}>{project.description}</div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--lin-text-4)', flexShrink: 0 }}>
          {format(new Date(project.createdAt), 'MMM d, yyyy')}
        </div>
        <IconChevronRight size={15} style={{ color: 'var(--lin-text-4)', flexShrink: 0 }} />
      </Link>
      {/* Delete controls */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
        display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {confirm ? (
          <>
            <button
              onClick={onDelete}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
              }}>
              Delete
            </button>
            <button
              onClick={() => setConfirm(false)}
              style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 11,
                background: 'var(--lin-border-2)', color: 'var(--lin-text-3)',
                border: 'none', cursor: 'pointer',
              }}>
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            aria-label="Delete project"
            style={{
              width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}>
            <IconTrash size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyProjects({ onNew }: { onNew: () => void }) {
  return (
    <div className="anim-fade-up" style={{
      textAlign: 'center', padding: '72px 24px',
      background: 'var(--lin-surface)', border: '1px dashed var(--lin-border-2)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, #10b981, #0891b2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <IconCalendar size={26} style={{ color: '#fff' }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', marginBottom: 8 }}>No projects yet</h3>
      <p style={{ color: 'var(--lin-text-3)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Create your first project and track it with timeline views.
      </p>
      <button onClick={onNew} className="btn" style={{
        background: 'linear-gradient(135deg, #10b981, #0891b2)',
        color: '#fff', padding: '10px 22px', fontSize: 14, borderRadius: 9,
        display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600,
        boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
      }}>
        <IconPlus size={16} /> Create first project
      </button>
    </div>
  );
}
