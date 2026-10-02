import { COLORS, PRIORITY_COLORS, TICKET_COLORS } from './dashboardConstants';

export default function RecentTickets({ tickets, t }) {
  if (!tickets || tickets.length === 0) {
    return <div className="dashboard-panel-state">{t('dashboard.noRecentTickets')}</div>;
  }

  return (
    <div className="recent-list">
      {tickets.slice(0, 6).map((ticket, index) => (
        <div key={ticket.id || index} className="recent-item" style={{ animationDelay: `${index * 80}ms` }}>
          <div
            className="recent-item-indicator"
            style={{ background: PRIORITY_COLORS[ticket.prioritaet] || COLORS.slate }}
          />
          <div className="recent-item-content">
            <div className="recent-item-title">{ticket.titel}</div>
            <div className="recent-item-meta">
              <span
                className="recent-item-badge"
                style={{
                  background: `${TICKET_COLORS[ticket.status] || COLORS.slate}20`,
                  color: TICKET_COLORS[ticket.status] || COLORS.slate,
                }}
              >
                {ticket.status}
              </span>
              {ticket.faelligkeitsdatum && (
                <span className="recent-item-date">
                  <i className="bi bi-calendar3 me-1" />
                  {ticket.faelligkeitsdatum.slice(0, 10)}
                </span>
              )}
            </div>
          </div>
          <div
            className="recent-item-priority"
            style={{ color: PRIORITY_COLORS[ticket.prioritaet] || COLORS.slate }}
          >
            <i className="bi bi-flag-fill" />
          </div>
        </div>
      ))}
    </div>
  );
}
