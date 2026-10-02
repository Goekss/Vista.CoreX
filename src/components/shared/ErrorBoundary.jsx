import React from 'react';

/**
 * Global ErrorBoundary Component
 * React bileşen ağacındaki render hatalarını yakalar ve
 * uygulamanın tamamen beyaz ekranda kalmasını (White Screen of Death) önler.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Production log servisi (Sentry, LogRocket vb.) buraya bağlanabilir
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-body, #0f172a)',
            color: 'var(--text-primary, #f8fafc)',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: '16px',
              padding: '2.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1.25rem',
              }}
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              Beklenmeyen Bir Hata Oluştu
            </h2>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              Uygulama çalışırken beklenmeyen bir hata ile karşılaşıldı. Sayfayı yenileyerek tekrar deneyebilir veya ana sayfaya dönebilirsiniz.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                }}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Sayfayı Yenile
              </button>
              <button
                onClick={this.handleReset}
                className="btn btn-outline-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                }}
              >
                <i className="bi bi-house-door"></i>
                Ana Sayfaya Dön
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #334155)',
                  fontSize: '0.8rem',
                  color: '#f87171',
                  overflowX: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                  Hata Detayları (Geliştirici Modu)
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
