import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
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
            gap: 10,
            padding: '0 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f87171' }}>Something went wrong</div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(226,226,255,0.45)',
              maxWidth: 400,
              lineHeight: 1.6,
              fontFamily: 'monospace',
            }}
          >
            {this.state.error.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            style={{
              marginTop: 10,
              padding: '8px 20px',
              borderRadius: 6,
              background: '#7170ff',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
