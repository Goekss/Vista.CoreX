import { useEffect, useState } from 'react';

export default function StatCard({ title, value, icon, gradient, trend, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const numericValue = Number(value);
  const hasNumericValue = Number.isFinite(numericValue);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible || value == null) return;
    const target = typeof value === 'number' ? value : parseInt(value, 10);
    if (Number.isNaN(target)) return;
    const duration = 800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value]);

  return (
    <div
      className="dashboard-stat-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      <div className="stat-card-inner" style={{ background: gradient }}>
        <div className="stat-card-icon">
          <i className={`bi ${icon}`} />
        </div>
        <div className="stat-card-content">
          <div className="stat-card-value">{hasNumericValue ? count : (value ?? '-')}</div>
          <div className="stat-card-title">{title}</div>
        </div>
        {trend != null && (
          <div className={`stat-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
            <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-short`} />
            {Math.abs(trend)}%
          </div>
        )}
        <div className="stat-card-decoration" />
      </div>
    </div>
  );
}
