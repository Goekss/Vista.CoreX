import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

export default function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            fontSize: '5rem',
            fontWeight: '900',
            lineHeight: 1,
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
          }}
        >
          404
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Sayfa Bulunamadı
        </h1>

        <p
          style={{
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            marginBottom: '2rem',
          }}
        >
          Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak kullanım dışı kalmış olabilir.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
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
            <i className="bi bi-arrow-left"></i>
            Geri Dön
          </button>

          <Link
            to="/"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontWeight: '500',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            <i className="bi bi-house"></i>
            Ana Sayfaya Git
          </Link>
        </div>
      </div>
    </div>
  );
}
