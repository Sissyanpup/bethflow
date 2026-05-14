import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router.js';
import { applyTheme } from './stores/theme.store.js';
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

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
