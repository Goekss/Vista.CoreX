import { PRIORITY_COLORS } from './dashboardConstants';

export default function PriorityBreakdown({ tickets, t: translate }) {
  const priorities = ['Niedrig', 'Mittel', 'Hoch', 'Kritisch'];
  const total = Math.max(tickets.length, 1);

  return (
    <div className="priority-breakdown">
      {priorities.map((priority) => {
        const count = tickets.filter((ticket) => ticket.prioritaet === priority).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={priority} className="priority-row">
            <div className="priority-label">
              <span className="priority-dot" style={{ background: PRIORITY_COLORS[priority] }} />
              <span>{translate(`status.${priority}`, priority)}</span>
            </div>
            <div className="priority-bar-wrapper">
              <div
                className="priority-bar"
                style={{ width: `${pct}%`, background: PRIORITY_COLORS[priority], transition: 'width 1s ease' }}
              />
            </div>
            <span className="priority-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
