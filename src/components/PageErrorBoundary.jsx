import React from 'react';
import { useLocation } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page render failed:', this.props.path, error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" style={{ padding: 28, margin: 20, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff', color: '#334155', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ marginTop: 0 }}>This page could not load</h2>
        <p>Reload the page to try again. If it still fails, share the error details below.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 18px', background: '#635bdb', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>Reload page</button>
        <details style={{ marginTop: 20 }}>
          <summary>Error details</summary>
          <p>{this.props.path}</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{String(this.state.error?.message || 'Unknown rendering error')}</pre>
        </details>
      </section>
    );
  }
}

export default function PageErrorBoundary({ children }) {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname} path={location.pathname}>{children}</ErrorBoundary>;
}
