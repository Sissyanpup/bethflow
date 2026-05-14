import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import {
  IconSearch, IconShield, IconUser, IconPlus, IconX, IconPencil,
  IconGlobe, IconArrowRight, IconTrendingUp, IconCheck, IconCalendar,
} from '../../components/ui/icons.js';
import { format } from 'date-fns';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface AdminUser {
  id: string; email: string; username: string; displayName: string | null;
  role: string; isActive: boolean; isVerified: boolean; createdAt: string;
}
interface PublicLink { id: string; platform: string; label: string; url: string; }
interface UserProfile {
  user: { username: string; displayName: string | null; avatarUrl: string | null; bio: string | null };
  links: PublicLink[];
  stats: { totalTasks: number; doneTasks: number; inProgressTasks: number; onTimePercent: number };
}

const PLATFORM_COLORS: Record<string, string> = {
  github: '#24292e', linkedin: '#0a66c2', twitter: '#000', instagram: '#dc2743',
  youtube: '#ff0000', telegram: '#2ca5e0', website: '#374151', custom: '#7c3aed',
  discord: '#5865f2', facebook: '#1877f2', tiktok: '#010101', whatsapp: '#25d366',
};

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [viewProfileUser, setViewProfileUser] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      const res = await api.get<{ success: true; data: AdminUser[]; meta: { total: number } }>(`/admin/users?${params}`);
      return res.data;
    },
  });

  const softDelete = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const restoreUser = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}`, { isActive: true }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="page-content" style={{ color: 'var(--lin-text-1)' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.7px', marginBottom: 4 }}>Users</h1>
          <p style={{ color: 'var(--lin-text-3)', fontSize: 14 }}>{data?.meta.total ?? 0} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn"
          style={{ background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(113,112,255,0.35)' }}>
          <IconPlus size={15} /> New User
        </button>
      </div>

      {/* Search */}
      <div className="anim-fade-up delay-50" style={{ position: 'relative', maxWidth: 380, marginBottom: 24 }}>
        <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--lin-text-4)', pointerEvents: 'none' }}>
          <IconSearch size={15} />
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or username…" className="input-dark" style={{ paddingLeft: 38 }} />
      </div>

      {/* Table */}
      <div className="anim-fade-up delay-100" style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-1)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', textTransform: 'uppercase', letterSpacing: 0.7, background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid var(--lin-border-1)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} style={{ padding: '12px 16px' }}>
                      <div className="skeleton" style={{ height: 16, width: j === 1 ? 120 : j === 2 ? 160 : 60, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
              : data?.data.map((user) => (
                <UserRow key={user.id} user={user}
                  onEdit={() => setEditUser(user)}
                  onViewProfile={() => setViewProfileUser(user.username)}
                  onDeactivate={() => { if (confirm(`Deactivate ${user.username}?`)) softDelete.mutate(user.id); }}
                  onRestore={() => restoreUser.mutate(user.id)} />
              ))
            }
          </tbody>
        </table>
        {!isLoading && data?.data.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--lin-text-3)', fontSize: 14 }}>No users found.</div>
        )}
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={() => { void qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreate(false); }} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSuccess={() => { void qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null); }} />}
      {viewProfileUser && <UserProfileModal username={viewProfileUser} onClose={() => setViewProfileUser(null)} />}
    </div>
  );
}

function UserRow({ user, onEdit, onViewProfile, onDeactivate, onRestore }: {
  user: AdminUser;
  onEdit: () => void; onViewProfile: () => void;
  onDeactivate: () => void; onRestore: () => void;
}) {
  const [hov, setHov] = useState(false);
  const initials = ((user.displayName ?? user.username)[0] ?? 'U').toUpperCase();
  return (
    <tr style={{ borderBottom: '1px solid var(--lin-border-1)', background: hov ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.12s' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: user.role === 'ADMIN' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #7170ff, #5e6ad2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lin-text-1)' }}>{user.username}</div>
            {user.displayName && <div style={{ fontSize: 11, color: 'var(--lin-text-4)' }}>{user.displayName}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--lin-text-2)' }}>{user.email}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : user.role === 'USER' ? 'rgba(113,112,255,0.15)' : 'rgba(255,255,255,0.06)', color: user.role === 'ADMIN' ? '#ef4444' : user.role === 'USER' ? '#7170ff' : 'var(--lin-text-4)' }}>
          {user.role === 'ADMIN' ? <IconShield size={10} /> : <IconUser size={10} />}
          {user.role}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: user.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: user.isActive ? '#10b981' : '#ef4444' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: user.isActive ? '#10b981' : '#ef4444', flexShrink: 0 }} />
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--lin-text-4)' }}>{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn label="Profile" onClick={onViewProfile} color="rgba(113,112,255,0.08)" textColor="#7170ff" borderColor="rgba(113,112,255,0.15)" />
          <ActionBtn label="Edit" onClick={onEdit} color="rgba(255,255,255,0.04)" textColor="var(--lin-text-2)" borderColor="var(--lin-border-2)" />
          {user.isActive
            ? <ActionBtn label="Deactivate" onClick={onDeactivate} color="rgba(239,68,68,0.08)" textColor="#ef4444" borderColor="rgba(239,68,68,0.15)" />
            : <ActionBtn label="Restore" onClick={onRestore} color="rgba(16,185,129,0.08)" textColor="#10b981" borderColor="rgba(16,185,129,0.15)" />
          }
        </div>
      </td>
    </tr>
  );
}

function ActionBtn({ label, onClick, color, textColor, borderColor }: { label: string; onClick: () => void; color: string; textColor: string; borderColor: string }) {
  return (
    <button onClick={onClick}
      style={{ padding: '5px 10px', borderRadius: 6, background: color, color: textColor, fontSize: 12, fontWeight: 600, border: `1px solid ${borderColor}`, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
      {label}
    </button>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '', role: 'USER' });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => api.post('/admin/users', { ...form, displayName: form.displayName || undefined }),
    onSuccess,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Failed to create user');
    },
  });

  return (
    <ModalWrap title="Create User" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13 }}>{error}</div>}
        <FormField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="user@example.com" type="email" />
        <FormField label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="username123" />
        <FormField label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Min 8 characters" type="password" />
        <FormField label="Display Name (optional)" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} placeholder="Full name" />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6 }}>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '9px 12px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none' }}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={() => create.mutate()} disabled={create.isPending || !form.email || !form.username || !form.password}
            className="btn" style={{ flex: 1, background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', color: '#fff', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, opacity: create.isPending ? 0.7 : 1 }}>
            {create.isPending ? 'Creating…' : 'Create User'}
          </button>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '10px 20px', borderRadius: 8 }}>Cancel</button>
        </div>
      </div>
    </ModalWrap>
  );
}

function EditUserModal({ user, onClose, onSuccess }: { user: AdminUser; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ displayName: user.displayName ?? '', role: user.role, isActive: user.isActive, isVerified: user.isVerified });

  const update = useMutation({
    mutationFn: () => api.patch(`/admin/users/${user.id}`, { ...form, displayName: form.displayName || null }),
    onSuccess,
  });

  return (
    <ModalWrap title={`Edit @${user.username}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Display Name" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} placeholder="Full name" />
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6 }}>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: '100%', background: 'var(--lin-surface-2)', border: '1px solid var(--lin-border-2)', borderRadius: 8, padding: '9px 12px', color: 'var(--lin-text-1)', fontSize: 13, outline: 'none' }}>
            <option value="GUEST">GUEST</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--lin-text-2)' }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--lin-text-2)' }}>
            <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} />
            Verified
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={() => update.mutate()} disabled={update.isPending}
            className="btn" style={{ flex: 1, background: 'linear-gradient(135deg, #7170ff, #5e6ad2)', color: '#fff', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600 }}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '10px 20px', borderRadius: 8 }}>Cancel</button>
        </div>
      </div>
    </ModalWrap>
  );
}

function UserProfileModal({ username, onClose }: { username: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-profile', username],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: UserProfile }>(`/social-links/${username}`);
      return res.data.data;
    },
  });

  return (
    <ModalWrap title={`@${username}'s Profile`} onClose={onClose} wide>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
        </div>
      ) : data ? (
        <div>
          {/* Bio */}
          {data.user.bio && <p style={{ fontSize: 13, color: 'var(--lin-text-3)', marginBottom: 16, lineHeight: 1.6 }}>{data.user.bio}</p>}

          {/* Stats */}
          {data.stats.totalTasks > 0 && (
            <div style={{ background: 'var(--lin-surface)', border: '1px solid var(--lin-border-1)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 }}>Work Summary</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: data.stats.onTimePercent, fill: '#7170ff' }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(113,112,255,0.1)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#7170ff', letterSpacing: '-0.5px' }}>{data.stats.onTimePercent}%</div>
                  <div style={{ fontSize: 11, color: 'var(--lin-text-4)', marginBottom: 10 }}>Completion rate</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#10b981' }}><IconCheck size={11} /> {data.stats.doneTasks} done</span>
                    <span style={{ fontSize: 12, color: 'var(--lin-text-3)' }}><IconCalendar size={11} /> {data.stats.inProgressTasks} active</span>
                    <span style={{ fontSize: 12, color: 'var(--lin-text-4)' }}><IconTrendingUp size={11} /> {data.stats.totalTasks} total</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social links */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lin-text-4)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Social Links ({data.links.length})</div>
          {data.links.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--lin-text-3)', fontSize: 13, border: '1px dashed var(--lin-border-2)', borderRadius: 8 }}>No links added</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.links.map((link) => {
                const bg = PLATFORM_COLORS[link.platform] ?? '#7c3aed';
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: `${bg}18`, border: `1px solid ${bg}25`, textDecoration: 'none', transition: 'all 0.14s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: bg, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--lin-text-1)' }}>{link.label}</span>
                    <IconArrowRight size={12} style={{ color: 'var(--lin-text-4)' }} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </ModalWrap>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lin-text-3)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-dark" style={{ width: '100%' }} />
    </div>
  );
}

function ModalWrap({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="anim-scale-in" style={{ background: 'var(--lin-panel)', border: '1px solid var(--lin-border-2)', borderRadius: 16, width: '100%', maxWidth: wide ? 560 : 440, padding: '28px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--lin-text-1)', letterSpacing: '-0.3px' }}>{title}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--lin-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
