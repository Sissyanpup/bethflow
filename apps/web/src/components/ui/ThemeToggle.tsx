import { useThemeStore, type ThemeMode } from '../../stores/theme.store.js';
import { IconSun, IconMoon, IconMonitor } from './icons.js';

const MODES: { key: ThemeMode; Icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { key: 'light',  Icon: IconSun,     label: 'Light mode' },
  { key: 'dark',   Icon: IconMoon,    label: 'Dark mode' },
  { key: 'system', Icon: IconMonitor, label: 'System theme' },
];

interface ThemeToggleProps {
  /** 'dark' = Linear sidebar (dark bg), 'light' = Figma navbar (light bg) */
  variant?: 'dark' | 'light';
}

export function ThemeToggle({ variant = 'dark' }: ThemeToggleProps) {
  const { mode, setMode } = useThemeStore();
  const isDark = variant === 'dark';

  return (
    <div
      role="group"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        gap: 1,
        padding: 3,
        borderRadius: 9,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'var(--lin-border-2)' : 'rgba(0,0,0,0.09)'}`,
      }}
    >
      {MODES.map(({ key, Icon, label }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            title={label}
            aria-pressed={active}
            onClick={() => setMode(key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: active
                ? (isDark ? 'rgba(255,255,255,0.14)' : '#fff')
                : 'transparent',
              color: active
                ? (isDark ? 'var(--lin-text-1)' : 'var(--fig-purple)')
                : (isDark ? 'var(--lin-text-4)' : '#9ca3af'),
              boxShadow: active && !isDark ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Icon size={13} />
          </button>
        );
      })}
    </div>
  );
}
