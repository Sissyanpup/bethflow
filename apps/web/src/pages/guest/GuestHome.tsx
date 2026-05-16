import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import {
  IconSearch, IconKanban, IconCalendar, IconGrid, IconLink,
  IconArrowRight, IconSparkle, IconTrendingUp, IconZap, IconGlobe,
  IconUser, IconX,
} from '../../components/ui/icons.js';

interface SearchUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  projectCount: number;
  boardCount: number;
}

export function GuestHomePage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const navigate = useNavigate();

  const { data: searchResult, isLoading: searching } = useQuery({
    queryKey: ['public-search', submitted],
    enabled: submitted.length >= 2,
    queryFn: async () => {
      const res = await api.get<{ success: true; data: SearchUser[]; meta: { total: number } }>(
        `/public/users/search?q=${encodeURIComponent(submitted)}&limit=12`,
        { baseURL: '/api' } as never,
      );
      return res.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) setSubmitted(query.trim());
  };

  const clearSearch = () => { setQuery(''); setSubmitted(''); };

  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero-section" style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #5b21b6 0%, #1d4ed8 55%, #0891b2 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 8s ease infinite',
        minHeight: 480,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 80px',
        textAlign: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: -60, left: -60, width: 320, height: 320, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', animation: 'float 7s ease-in-out infinite' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -40, right: -40, width: 240, height: 240, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', animation: 'float 9s ease-in-out infinite 2s' }} />

        <div className="anim-fade-down" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: 0.3, marginBottom: 28, textTransform: 'uppercase' }}>
          <IconSparkle size={13} style={{ color: '#fbbf24' }} />
          Now with Social Link Profiles
        </div>

        <h1 className="anim-fade-up delay-100" style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.08, maxWidth: 720, marginBottom: 20 }}>
          Manage tasks, projects &amp; your social presence
        </h1>

        <p className="anim-fade-up delay-200" style={{ fontSize: 18, color: 'rgba(255,255,255,0.82)', maxWidth: 540, lineHeight: 1.65, marginBottom: 36 }}>
          Kanban boards, Gantt timelines, catalog management, and a beautiful link-in-bio — all in one place.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hero-search-form anim-fade-up delay-300" style={{ background: '#fff', borderRadius: 16, boxShadow: inputFocused ? '0 0 0 4px rgba(124,58,237,0.25), 0 20px 60px rgba(0,0,0,0.18)' : '0 8px 40px rgba(0,0,0,0.18)', padding: '6px 6px 6px 20px', maxWidth: 500, width: '100%', display: 'flex', gap: 8, alignItems: 'center', transition: 'box-shadow 0.2s ease' }}>
          <IconSearch size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Search users…"
            aria-label="Search users by username or name"
            className="hero-search-input"
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 16, color: '#374151', background: 'transparent', padding: '4px 0' }}
          />
          {query && (
            <button type="button" onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px 4px', flexShrink: 0 }}>
              <IconX size={16} />
            </button>
          )}
          <button type="submit" className="btn btn-gradient hero-search-btn" style={{ borderRadius: 10, padding: '10px 20px', fontSize: 14, flexShrink: 0 }}>
            Search
          </button>
        </form>

        {/* CTA */}
        <div className="hero-cta anim-fade-up delay-400" style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 28 }}>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#7c3aed', padding: '11px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}>
            Get started free <IconArrowRight size={16} />
          </Link>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)'; }}>
            Log in <IconArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── SEARCH RESULTS ── */}
      {submitted && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.5px' }}>
                Results for &ldquo;{submitted}&rdquo;
              </h2>
              {searchResult && (
                <p style={{ fontSize: 14, color: 'var(--fig-text-meta)', marginTop: 4 }}>
                  {searchResult.meta.total} user{searchResult.meta.total !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', color: 'var(--fig-purple)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.14s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.15)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'; }}>
              <IconX size={13} /> Clear
            </button>
          </div>

          {searching ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {[1,2,3,4].map((i) => (
                <div key={i} className="skeleton-light" style={{ height: 140, borderRadius: 16 }} />
              ))}
            </div>
          ) : searchResult?.data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 24px', background: 'var(--fig-surface)', borderRadius: 20, border: '1px solid rgba(124,58,237,0.08)' }}>
              <IconUser size={32} style={{ color: 'var(--fig-text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--fig-text-meta)', fontSize: 16 }}>No users found matching &ldquo;{submitted}&rdquo;</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {searchResult?.data.map((user, i) => (
                <UserCard key={user.username} user={user} delay={i * 60} onNavigate={() => void navigate({ to: '/u/$username/links', params: { username: user.username } })} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── STATS BAR ── */}
      {!submitted && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)', padding: '18px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              {STATS.map((s) => (
                <div key={s.label} style={{ textAlign: 'center', color: '#fff' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── FEATURES ── */}
          <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div className="anim-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.08)', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: 'var(--fig-purple)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16 }}>
                <IconZap size={13} /> Features
              </div>
              <h2 className="anim-fade-up delay-100" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--fig-text-h)', letterSpacing: '-1px', lineHeight: 1.15 }}>
                Everything your team needs
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 24 }}>
              {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} delay={i * 80} />)}
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ padding: '88px 24px', textAlign: 'center', background: 'var(--fig-surface)' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--fig-text-h)', letterSpacing: '-1px', marginBottom: 16 }}>
                Ready to get organized?
              </h2>
              <p style={{ fontSize: 17, color: 'var(--fig-text-meta)', lineHeight: 1.6, marginBottom: 36 }}>
                Join Bethflow for free. No credit card required.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-gradient btn-lg">Create free account <IconArrowRight size={18} /></Link>
                <Link to="/contact" className="btn btn-secondary btn-lg">Contact us</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function UserCard({ user, delay, onNavigate }: { user: SearchUser; delay: number; onNavigate: () => void }) {
  const [hov, setHov] = useState(false);
  const initials = ((user.displayName ?? user.username)[0] ?? 'U').toUpperCase();

  return (
    <div
      onClick={onNavigate}
      className="anim-fade-up"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        animationDelay: `${delay}ms`,
        background: 'var(--fig-surface)', borderRadius: 18,
        border: hov ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(124,58,237,0.07)',
        boxShadow: hov ? '0 12px 40px rgba(124,58,237,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.22s var(--ease-out)',
        cursor: 'pointer',
        overflow: 'hidden',
      }}>
      <div style={{ height: 4, background: hov ? 'linear-gradient(90deg, #7c3aed, #2563eb)' : 'linear-gradient(90deg, #e9d5ff, #bfdbfe)', transition: 'background 0.25s' }} />
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #f3f4f6', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800, flexShrink: 0, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}>
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--fig-text-h)', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName ?? user.username}
            </div>
            <div style={{ fontSize: 12, color: 'var(--fig-text-muted)', marginTop: 2 }}>@{user.username}</div>
          </div>
        </div>

        {user.bio && (
          <p style={{ fontSize: 12, color: 'var(--fig-text-meta)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {user.bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <StatPill label="Projects" value={user.projectCount} color="rgba(124,58,237,0.1)" textColor="#7c3aed" />
          <StatPill label="Boards" value={user.boardCount} color="rgba(37,99,235,0.1)" textColor="#2563eb" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, color: hov ? '#7c3aed' : 'var(--fig-text-muted)', fontSize: 12, fontWeight: 600, transition: 'color 0.18s' }}>
          View profile <IconArrowRight size={13} style={{ transform: hov ? 'translateX(3px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: color, fontSize: 11, fontWeight: 700, color: textColor }}>
      {value} {label}
    </div>
  );
}

function FeatureCard({ feature: f, delay }: { feature: typeof FEATURES[0]; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className="anim-fade-up"
      style={{ animationDelay: `${delay}ms`, background: 'var(--fig-surface)', borderRadius: 18, border: hovered ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(124,58,237,0.07)', boxShadow: hovered ? '0 12px 40px rgba(124,58,237,0.14), 0 2px 8px rgba(0,0,0,0.05)' : '0 1px 4px rgba(0,0,0,0.06)', transform: hovered ? 'translateY(-5px)' : 'translateY(0)', overflow: 'hidden', transition: 'transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.22s' }}>
      <div style={{ height: 4, background: f.gradient }} />
      <div style={{ padding: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: f.iconBg, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.22s var(--ease-spring)', transform: hovered ? 'scale(1.1) rotate(-3deg)' : 'scale(1)' }}>
          <f.icon size={22} style={{ color: f.iconColor }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fig-text-h)', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</h3>
        <p style={{ fontSize: 14, color: 'var(--fig-text-meta)', lineHeight: 1.7 }}>{f.description}</p>
      </div>
    </div>
  );
}

const STATS = [
  { value: '10K+', label: 'Active users' },
  { value: '50K+', label: 'Tasks created' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'Free', label: 'Forever plan' },
];

const FEATURES = [
  { title: 'Kanban Boards', description: 'Organize tasks with drag-and-drop Kanban boards. Real-time sync keeps your whole team in lockstep.', gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)', iconBg: 'rgba(124,58,237,0.1)', iconColor: '#7c3aed', icon: IconKanban },
  { title: 'Project Timelines', description: 'Visualize your schedule with Gantt-style weekly and monthly timeline views. Milestones at a glance.', gradient: 'linear-gradient(135deg, #10b981, #2563eb)', iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', icon: IconCalendar },
  { title: 'Card Catalog', description: 'Manage catalog cards with rich media, dates, and content. Search and filter your whole library instantly.', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', iconBg: 'rgba(245,158,11,0.1)', iconColor: '#d97706', icon: IconGrid },
  { title: 'Social Link Profile', description: 'Your personal link-in-bio — per-platform brand colors, drag to reorder, toggle visibility, custom labels.', gradient: 'linear-gradient(135deg, #ec4899, #7c3aed)', iconBg: 'rgba(236,72,153,0.1)', iconColor: '#ec4899', icon: IconLink },
  { title: 'Success Analytics', description: 'Track your progress with beautiful graphs and personal analytics. See your growth over time.', gradient: 'linear-gradient(135deg, #06b6d4, #2563eb)', iconBg: 'rgba(6,182,212,0.1)', iconColor: '#06b6d4', icon: IconTrendingUp },
  { title: 'Public Profiles', description: 'Share your work and social links with a beautiful public profile page at /u/username.', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', iconBg: 'rgba(16,185,129,0.08)', iconColor: '#10b981', icon: IconGlobe },
];
