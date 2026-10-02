export function ChartSkeleton({ bars = 4 }) {
  return (
    <div className="dashboard-chart-skeleton">
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={`bar-${index}`}
          className="dashboard-chart-skeleton-bar"
          style={{ width: `${48 + (index % 3) * 16}%`, animationDelay: `${index * 90}ms` }}
        />
      ))}
    </div>
  );
}

export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-tooltip">
      <div className="dashboard-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="dashboard-tooltip-item">
          <span className="dashboard-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

export function PanelState({ loading, error, empty, emptyText, errorText }) {
  if (loading) return <ChartSkeleton />;
  if (error) return <div className="dashboard-panel-state dashboard-panel-state-error">{errorText}</div>;
  if (empty) return <div className="dashboard-panel-state">{emptyText}</div>;
  return null;
}
