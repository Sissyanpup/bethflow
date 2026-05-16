import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { api } from '../../lib/api.js';
import { IconGlobe, IconArrowRight, IconAlertCircle, IconTrendingUp, IconCheck, IconCalendar, IconKanban, IconChevronRight } from '../../components/ui/icons.js';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877f2', instagram: '#dc2743', twitter: '#000000', tiktok: '#010101',
  linkedin: '#0a66c2', youtube: '#ff0000', telegram: '#2ca5e0', whatsapp: '#25d366',
  github: '#24292e', gitlab: '#fc6d26', email: '#ea4335', discord: '#5865f2',
  twitch: '#9146ff', spotify: '#1db954', soundcloud: '#ff5500', patreon: '#ff424d',
  dribbble: '#ea4c89', behance: '#1769ff', medium: '#000', reddit: '#ff4500',
  bluesky: '#0085ff', threads: '#000', mastodon: '#6364ff', pinterest: '#e60023',
  website: '#374151', custom: '#7c3aed',
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'Twitter/X', tiktok: 'TikTok',
  linkedin: 'LinkedIn', youtube: 'YouTube', telegram: 'Telegram', whatsapp: 'WhatsApp',
  github: 'GitHub', gitlab: 'GitLab', email: 'Email', discord: 'Discord',
  twitch: 'Twitch', spotify: 'Spotify', soundcloud: 'SoundCloud', patreon: 'Patreon',
  dribbble: 'Dribbble', behance: 'Behance', medium: 'Medium', reddit: 'Reddit',
  bluesky: 'Bluesky', threads: 'Threads', mastodon: 'Mastodon', pinterest: 'Pinterest',
  website: 'Website', custom: 'Link',
};

interface PublicLink { id: string; platform: string; label: string; url: string; iconSlug: string | null; }
interface PublicProfile {
  user: { username: string; displayName: string | null; avatarUrl: string | null; bio: string | null };
  links: PublicLink[];
  stats: { totalTasks: number; doneTasks: number; inProgressTasks: number; onTimePercent: number };
}
interface PublicCard { id: string; title: string; description: string | null; color: string | null; }
interface PublicList { id: string; title: string; cards: PublicCard[]; }
interface PublicBoard { id: string; title: string; description: string | null; color: string | null; lists: PublicList[]; }

export function PublicProfilePage() {
  const { username } = useParams({ from: '/guest-layout/u/$username/links' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PublicProfile }>(`/social-links/${username}`);
      return res.data.data;
    },
  });

  const { data: boardsData } = useQuery({
    queryKey: ['public-boards', username],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: PublicBoard[] }>(`/public/${username}/boards`);
      return res.data.data;
    },
    enabled: !isLoading && !isError,
  });

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !data) return <ProfileNotFound username={username} />;

  const { user, links, stats } = data;
  const initials = ((user.displayName ?? user.username)[0] ?? 'U').toUpperCase();
  const hasRightContent = stats.totalTasks > 0 || (boardsData && boardsData.length > 0);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--fig-bg)', fontFamily: 'Inter, sans-serif' }}
      className="fig-scrollbar">
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '56px 20px 80px' }}>

        {/* Profile header */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName ?? user.username}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  border: '3px solid var(--fig-surface)',
                  boxShadow: '0 0 0 4px rgba(124,58,237,0.2), 0 8px 32px rgba(124,58,237,0.15)',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 34, fontWeight: 800,
                border: '3px solid var(--fig-surface)',
                boxShadow: '0 0 0 4px rgba(124,58,237,0.18), 0 8px 32px rgba(124,58,237,0.2)',
              }}>
                {initials}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#10b981', border: '2.5px solid var(--fig-surface)',
              boxShadow: '0 0 6px rgba(16,185,129,0.5)',
            }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fig-text-h)', letterSpacing: '-0.4px' }}>
            {user.displayName ?? user.username}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--fig-text-muted)', marginTop: 4, fontWeight: 500 }}>
            @{user.username}
          </p>
          {user.bio && (
            <p style={{
              fontSize: 14, color: 'var(--fig-text-meta)', marginTop: 10,
              maxWidth: 400, margin: '10px auto 0', lineHeight: 1.6,
            }}>
              {user.bio}
            </p>
          )}
        </div>

        {/* Two-column grid: links left, summary+boards right */}
        <div className={hasRightContent ? 'pub-profile-grid' : undefined}>

          {/* Left column: Social links */}
          <div className="anim-fade-up delay-50">
            {links.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link, i) => (
                  <LinkButton key={link.id} link={link} delay={i * 50} />
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: 'var(--fig-surface)', borderRadius: 20,
                border: '1px solid rgba(124,58,237,0.1)',
              }}>
                <IconGlobe size={32} style={{ color: 'var(--fig-text-muted)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--fig-text-meta)', fontSize: 15 }}>No links added yet.</p>
              </div>
            )}
          </div>

          {/* Right column: Work Summary + Public Boards */}
          {hasRightContent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Work Summary */}
              {stats.totalTasks > 0 && (
                <div className="anim-fade-up delay-100" style={{
                  background: 'var(--fig-surface)', borderRadius: 20,
                  border: '1px solid rgba(124,58,237,0.1)', padding: '20px 24px',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <IconTrendingUp size={16} style={{ color: '#7c3aed' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.2px' }}>Work Summary</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 90, height: 90, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: stats.onTimePercent, fill: '#7c3aed' }]} startAngle={90} endAngle={-270}>
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(124,58,237,0.12)' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.5px', lineHeight: 1 }}>{stats.onTimePercent}%</div>
                      <div style={{ fontSize: 12, color: 'var(--fig-text-meta)', marginTop: 4, marginBottom: 12 }}>Task completion rate</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <StatRow icon={<IconCheck size={12} />} label="Completed" value={stats.doneTasks} color="#10b981" />
                        <StatRow icon={<IconCalendar size={12} />} label="In progress" value={stats.inProgressTasks} color="#7c3aed" />
                        <StatRow icon={<IconTrendingUp size={12} />} label="Total tasks" value={stats.totalTasks} color="#6b7280" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Public Boards */}
              {boardsData && boardsData.length > 0 && (
                <div className="anim-fade-up delay-200">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <IconKanban size={15} style={{ color: '#7c3aed' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.2px' }}>Public Boards</span>
                    <span style={{ fontSize: 12, color: 'var(--fig-text-muted)', marginLeft: 4 }}>{boardsData.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {boardsData.map((board, i) => (
                      <PublicBoardCard key={board.id} board={board} delay={i * 60} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--fig-text-muted)', fontWeight: 500,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(124,58,237,0.06)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.12)'; (e.currentTarget as HTMLElement).style.color = 'var(--fig-purple)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)'; (e.currentTarget as HTMLElement).style.color = 'var(--fig-text-muted)'; }}>
            Create your own profile on Bethflow <IconArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function LinkButton({ link, delay }: { link: PublicLink; delay: number }) {
  const [hov, setHov] = useState(false);
  const bg = PLATFORM_COLORS[link.platform] ?? '#7c3aed';
  const label = link.label || PLATFORM_LABELS[link.platform] || link.platform;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', padding: '15px 22px', borderRadius: 16,
        background: bg, color: '#fff',
        fontSize: 15, fontWeight: 700,
        boxShadow: hov
          ? `0 8px 24px ${bg === '#000000' || bg === '#010101' ? 'rgba(0,0,0,0.45)' : `${bg}60`}`
          : `0 3px 12px ${bg === '#000000' || bg === '#010101' ? 'rgba(0,0,0,0.25)' : `${bg}35`}`,
        transform: hov ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.22s var(--ease-spring)',
        textDecoration: 'none',
        letterSpacing: '-0.2px',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      {label}
      <IconArrowRight size={15} style={{ opacity: hov ? 1 : 0.6, transition: 'opacity 0.2s, transform 0.2s', transform: hov ? 'translateX(3px)' : 'translateX(0)' }} />
    </a>
  );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ color: 'var(--fig-text-meta)', flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--fig-text-h)' }}>{value}</span>
    </div>
  );
}

const LIST_COLORS = ['#7170ff','#10b981','#f59e0b','#ec4899','#06b6d4','#ef4444','#8b5cf6','#14b8a6'];

function PublicBoardCard({ board, delay }: { board: PublicBoard; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hov, setHov] = useState(false);
  const accent = board.color ?? '#7c3aed';
  const totalCards = board.lists.reduce((s, l) => s + l.cards.length, 0);

  return (
    <div
      className="anim-fade-up"
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--fig-surface)', borderRadius: 16,
        border: '1px solid rgba(124,58,237,0.1)', overflow: 'hidden',
        boxShadow: hov ? '0 8px 28px rgba(124,58,237,0.12)' : '0 2px 10px rgba(124,58,237,0.05)',
        transition: 'all 0.22s var(--ease-spring)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <div style={{ height: 4, background: accent }} />

      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconKanban size={15} style={{ color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.2px' }}>{board.title}</div>
          {board.description && <div style={{ fontSize: 12, color: 'var(--fig-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.description}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--fig-text-muted)', fontWeight: 500 }}>{board.lists.length} lists · {totalCards} cards</span>
          <IconChevronRight size={14} style={{ color: 'var(--fig-text-muted)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(124,58,237,0.08)' }}>
          {board.lists.length === 0
            ? <p style={{ fontSize: 13, color: 'var(--fig-text-muted)', padding: '12px 0', textAlign: 'center' }}>No lists.</p>
            : board.lists.map((list, li) => {
              const lc = LIST_COLORS[li % LIST_COLORS.length]!;
              return (
                <div key={list.id} style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: lc, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.1px' }}>{list.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--fig-text-muted)' }}>{list.cards.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {list.cards.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--fig-text-muted)', padding: '6px 10px', borderRadius: 8, background: 'rgba(124,58,237,0.05)', fontStyle: 'italic' }}>No cards</div>
                      : list.cards.map((card) => (
                        <PublicCardItem key={card.id} card={card} listColor={lc} />
                      ))
                    }
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

function PublicCardItem({ card, listColor }: { card: PublicCard; listColor: string }) {
  return (
    <div className="pub-card-item">
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: card.color ?? listColor, borderRadius: '10px 0 0 10px' }} />
      <div style={{ paddingLeft: 4, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-h)', lineHeight: 1.4 }}>{card.title}</div>
        {card.description && (
          <div style={{ fontSize: 11, color: 'var(--fig-text-muted)', marginTop: 3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.description}</div>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--fig-bg)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '56px 20px', textAlign: 'center' }}>
        <div className="skeleton-light" style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 16px' }} />
        <div className="skeleton-light" style={{ height: 24, width: 140, margin: '0 auto 8px' }} />
        <div className="skeleton-light" style={{ height: 16, width: 90, margin: '0 auto 32px' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-light" style={{ height: 56, borderRadius: 16, marginBottom: 10 }} />
        ))}
      </div>
    </div>
  );
}

function ProfileNotFound({ username }: { username: string }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--fig-bg)',
      fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 24,
    }}>
      <div className="anim-scale-in">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <IconAlertCircle size={28} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fig-text-h)', marginBottom: 8 }}>
          Profile not found
        </h2>
        <p style={{ color: 'var(--fig-text-meta)', fontSize: 15, marginBottom: 28 }}>
          There's no user with username <strong>@{username}</strong>.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
