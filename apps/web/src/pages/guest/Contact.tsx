import { useState } from 'react';
import { api } from '../../lib/api.js';
import { IconMail, IconSend, IconCheck, IconZap, IconShield } from '../../components/ui/icons.js';

export function ContactPage() {
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/feedback', { content });
      setSubmitted(true);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 660, margin: '0 auto', padding: '88px 24px 80px' }}>
      {/* Page header */}
      <div className="anim-fade-up" style={{ marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(124,58,237,0.08)', borderRadius: 999,
          padding: '5px 14px', fontSize: 12, fontWeight: 600,
          color: 'var(--fig-purple)', letterSpacing: 0.5, textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          <IconMail size={13} /> Contact
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800,
          color: 'var(--fig-text-h)', marginBottom: 12, letterSpacing: '-1px', lineHeight: 1.1,
        }}>
          We'd love to hear from you
        </h1>
        <p style={{ color: 'var(--fig-text-meta)', fontSize: 17, lineHeight: 1.65 }}>
          Have a question, suggestion, or just want to say hello? Send us a message and we'll get back to you.
        </p>
      </div>

      {submitted ? (
        <div className="anim-scale-in" style={{
          padding: '48px 40px', textAlign: 'center',
          background: 'linear-gradient(135deg, #f8f7ff, #eff6ff)',
          border: '1px solid rgba(124,58,237,0.15)', borderRadius: 20,
          boxShadow: '0 8px 32px rgba(124,58,237,0.1)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          }}>
            <IconCheck size={28} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--fig-text-h)', marginBottom: 8 }}>
            Message sent!
          </h2>
          <p style={{ color: 'var(--fig-text-meta)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Thank you for your feedback. We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Send another message
          </button>
        </div>
      ) : (
        <div className="anim-fade-up delay-100" style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          border: '1px solid #f3f4f6',
          padding: '36px 40px',
        }}>
          <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label htmlFor="feedback-message" style={{ fontSize: 13, fontWeight: 600, color: 'var(--fig-text-body)', display: 'block', marginBottom: 8 }}>
                Your message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="feedback-message"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Tell us what you think, report a bug, or request a feature…"
                rows={6}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: focused ? '1.5px solid var(--fig-purple)' : '1.5px solid #e5e7eb',
                  boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                  fontSize: 15, color: 'var(--fig-text-body)',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.6, transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="btn btn-gradient btn-lg"
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading
                ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Sending…</>
                : <><IconSend size={16} /> Send message</>
              }
            </button>
          </form>
        </div>
      )}

      {/* Info cards */}
      <div className="anim-fade-up delay-200" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 40,
      }}>
        {([
          { Icon: IconZap, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', title: 'Fast response', desc: 'We typically reply within 24 hours.' },
          { Icon: IconShield, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', title: 'Private & secure', desc: 'Your messages are never shared.' },
        ] as const).map((card) => (
          <div key={card.title} style={{
            background: card.bg, border: `1px solid ${card.border}`,
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ marginBottom: 10 }}>
              <card.Icon size={20} style={{ color: card.color }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fig-text-h)', marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: 'var(--fig-text-meta)', lineHeight: 1.5 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
