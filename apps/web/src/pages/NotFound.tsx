export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08090a',
        color: '#e2e2ff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        gap: 12,
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 800, color: '#7170ff', lineHeight: 1, letterSpacing: '-4px' }}>
        404
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Page not found</div>
      <div style={{ fontSize: 14, color: 'rgba(226,226,255,0.45)', maxWidth: 360, lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </div>
      <a
        href="/"
        style={{
          marginTop: 12,
          padding: '9px 24px',
          borderRadius: 8,
          background: '#7170ff',
          color: '#fff',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.01em',
        }}
      >
        Go home
      </a>
    </div>
  );
}
