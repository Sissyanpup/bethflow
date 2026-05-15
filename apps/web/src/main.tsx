import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router.js';
import { applyTheme } from './stores/theme.store.js';
import { useAuthStore } from './stores/auth.store.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import './styles/globals.css';

// Apply stored theme before first render to prevent flash of unstyled content
applyTheme(
  (localStorage.getItem('bethflow-theme') as 'light' | 'dark' | 'system' | null) ?? 'system',
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function AppRoot() {
  const [ready, setReady] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    void useAuthStore.getState().refresh().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--lin-canvas, #08090a)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(113,112,255,0.2)',
          borderTopColor: '#7170ff',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRoot />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
