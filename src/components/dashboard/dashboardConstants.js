export const COLORS = {
  primary: '#0ea5e9',
  success: '#14b8a6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0f766e',
  slate: '#64748b',
  neutral: '#334155',
  gradient: {
    primary: 'linear-gradient(140deg, #0284c7 0%, #0ea5e9 100%)',
    success: 'linear-gradient(140deg, #0f766e 0%, #14b8a6 100%)',
    warning: 'linear-gradient(140deg, #d97706 0%, #f59e0b 100%)',
    danger: 'linear-gradient(140deg, #dc2626 0%, #ef4444 100%)',
    info: 'linear-gradient(140deg, #0369a1 0%, #0284c7 100%)',
    neutral: 'linear-gradient(140deg, #334155 0%, #475569 100%)',
  },
};

export const STATUS_COLORS = {
  NichtGestartet: COLORS.slate,
  InBearbeitung: COLORS.primary,
  Abgeschlossen: COLORS.success,
  Pausiert: COLORS.warning,
};

export const TICKET_COLORS = {
  Offen: COLORS.primary,
  InBearbeitung: COLORS.warning,
  Geloest: COLORS.success,
  Geschlossen: COLORS.slate,
};

export const PRIORITY_COLORS = {
  Niedrig: COLORS.info,
  Mittel: COLORS.warning,
  Hoch: COLORS.danger,
  Kritisch: COLORS.neutral,
};

export const REFRESH_INTERVAL_OPTIONS = [15, 30, 60, 120];
export const LIVE_VARIANTS = ['default', 'line', 'area', 'bar'];
export const TICKET_VARIANTS = ['default', 'bar', 'radar', 'line'];
export const PROJECT_VARIANTS = ['default', 'line', 'area', 'radar'];

export function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDayTs(dateString) {
  return new Date(`${dateString}T00:00:00`).getTime();
}

export function endOfDayTs(dateString) {
  return new Date(`${dateString}T23:59:59.999`).getTime();
}

export function createTrendPoint(ts, projekte, tickets) {
  const date = new Date(ts);
  return {
    ts,
    dateKey: toDateInputValue(date),
    dayLabel: date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
    name: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    projekte: Number(projekte || 0),
    tickets: Number(tickets || 0),
  };
}

export function createInitialTrendData() {
  const now = Date.now();
  const dayStepMs = 24 * 60 * 60 * 1000;
  const points = [
    { projekte: 4, tickets: 7 },
    { projekte: 6, tickets: 6 },
    { projekte: 5, tickets: 8 },
    { projekte: 8, tickets: 5 },
    { projekte: 7, tickets: 7 },
    { projekte: 9, tickets: 4 },
    { projekte: 6, tickets: 9 },
    { projekte: 10, tickets: 5 },
    { projekte: 8, tickets: 6 },
    { projekte: 11, tickets: 4 },
    { projekte: 9, tickets: 7 },
    { projekte: 12, tickets: 5 },
  ];

  return points.map((point, index) => {
    const pointTs = now - (points.length - 1 - index) * dayStepMs;
    return createTrendPoint(pointTs, point.projekte, point.tickets);
  });
}

export function firstFiniteNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function totalFromResponse(response) {
  const data = response?.data;
  if (!data) return 0;
  const direct = firstFiniteNumber(data.totalCount, data.total, data.count);
  if (Number.isFinite(direct)) return direct;
  if (Array.isArray(data?.items)) return data.items.length;
  if (Array.isArray(data)) return data.length;
  return 0;
}
