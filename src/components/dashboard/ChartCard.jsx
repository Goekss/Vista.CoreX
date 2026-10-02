import { useEffect, useRef, useState } from 'react';

export default function ChartCard({
  title,
  icon,
  iconColor,
  titleAddon,
  children,
  className = '',
  isRefreshing = false,
  onSelectVariant,
  variantOptions = [],
  activeVariant,
  variantLabel,
  variantIcon,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className={`dashboard-chart-card ${className}`}>
      <div className="chart-card-header">
        <div className="chart-card-title">
          <i className={`bi ${icon}`} style={{ color: iconColor }} />
          <span>{title}</span>
          {titleAddon}
        </div>
        <div className="chart-card-actions">
          {onSelectVariant && variantOptions.length > 0 && (
            <div className="chart-variant-control" ref={menuRef}>
              <button
                type="button"
                className="chart-variant-toggle"
                onClick={() => setMenuOpen((current) => !current)}
                aria-expanded={menuOpen}
              >
                <i className="bi bi-toggles2" />
                <span>{variantLabel}</span>
                {variantIcon && <i className={`bi ${variantIcon}`} />}
                <i className={`bi ${menuOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
              </button>
              <div className={`chart-variant-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
                {variantOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`chart-variant-item ${activeVariant === option.value ? 'active' : ''}`}
                    onClick={() => {
                      onSelectVariant(option.value);
                      setMenuOpen(false);
                    }}
                  >
                    <i className={`bi ${option.icon}`} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isRefreshing && <span className="dashboard-chart-live-dot" />}
        </div>
      </div>
      <div className="chart-card-body">
        {children}
      </div>
    </div>
  );
}
