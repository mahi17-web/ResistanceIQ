import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ResistanceIQ Uncaught Component Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--bg-deep, #05070B)',
          color: 'var(--ink, #edf2ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          <div style={{
            maxWidth: 540,
            width: '100%',
            background: 'var(--elevated, #0e1520)',
            border: '1px solid var(--line-med, rgba(255,255,255,0.12))',
            borderRadius: 16,
            padding: 36,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <AlertTriangle size={24} color="#f43f5e" />
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#f0f4ff' }}>
              Application failed to load
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-3, #8a9bb5)', lineHeight: 1.5, marginBottom: 20 }}>
              An unexpected runtime error occurred while rendering the user interface.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(5,7,11,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 24,
                overflowX: 'auto',
              }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f43f5e', margin: 0 }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                background: '#0BDFA0',
                color: '#020609',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              <RefreshCw size={14} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
