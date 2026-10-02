import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie, ComposedChart, Line, Area,
  LineChart, AreaChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import '../styles/Dashboard.css';
import { dashboardApi } from '../api/dashboardApi';
import { projektApi } from '../api/projektApi';
import { ticketApi } from '../api/ticketApi';
import { kundeApi } from '../api/kundeApi';
import { benutzerApi } from '../api/benutzerApi';
import { berichtApi } from '../api/berichtApi';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import {
  COLORS,
  STATUS_COLORS,
  TICKET_COLORS,
  PRIORITY_COLORS,
  REFRESH_INTERVAL_OPTIONS,
  LIVE_VARIANTS,
  TICKET_VARIANTS,
  PROJECT_VARIANTS,
  toDateInputValue,
  startOfDayTs,
  endOfDayTs,
  createTrendPoint,
  createInitialTrendData,
  totalFromResponse,
} from '../components/dashboard/dashboardConstants';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentTickets from '../components/dashboard/RecentTickets';
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown';
import { ChartSkeleton, CustomTooltip, PanelState } from '../components/dashboard/DashboardHelpers';


export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);
  const [ticketChartData, setTicketChartData] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [trendData, setTrendData] = useState(() => createInitialTrendData());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [liveChartVariant, setLiveChartVariant] = useState('default');
  const [ticketChartVariant, setTicketChartVariant] = useState('default');
  const [projectChartVariant, setProjectChartVariant] = useState('default');
  const [showDateRange, setShowDateRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(() => toDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)));
  const [rangeEnd, setRangeEnd] = useState(() => toDateInputValue(new Date()));
  const [themeMode, setThemeMode] = useState(() => (
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') || 'light'
      : 'light'
  ));

  const hasData = useMemo(() => Boolean(stats), [stats]);
  const trendSeries = useMemo(
    () => trendData.map((point) => ({ ...point, total: Number(point.projekte || 0) + Number(point.tickets || 0) })),
    [trendData]
  );
  const filteredTrendSeries = useMemo(() => {
    const hasValidRange = rangeStart && rangeEnd;
    if (!hasValidRange) return trendSeries;

    const startTs = startOfDayTs(rangeStart);
    const endTs = endOfDayTs(rangeEnd);
    const safeStart = Math.min(startTs, endTs);
    const safeEnd = Math.max(startTs, endTs);
    const filtered = trendSeries.filter((point) => point.ts >= safeStart && point.ts <= safeEnd);
    const byDay = new Map();
    filtered.forEach((point) => {
      const existing = byDay.get(point.dateKey);
      if (!existing || point.ts > existing.ts) {
        byDay.set(point.dateKey, point);
      }
    });

    const dailySeries = [];
    for (let current = safeStart; current <= safeEnd; current += 24 * 60 * 60 * 1000) {
      const dayDate = new Date(current);
      const dayKey = toDateInputValue(dayDate);
      const existing = byDay.get(dayKey);
      const projekte = Number(existing?.projekte || 0);
      const tickets = Number(existing?.tickets || 0);
      dailySeries.push({
        ...(existing || {}),
        ts: current,
        dateKey: dayKey,
        dayLabel: dayDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
        name: dayDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
        projekte,
        tickets,
        total: projekte + tickets,
      });
    }

    return dailySeries;
  }, [trendSeries, rangeStart, rangeEnd]);
  const isDark = themeMode === 'dark';
  const axisTick = { fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' };
  const gridStroke = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.16)';
  const variantLabels = {
    default: t('dashboard.variantDefault', 'Default'),
    line: t('dashboard.variantLine', 'Line'),
    area: t('dashboard.variantArea', 'Area'),
    bar: t('dashboard.variantBar', 'Bar'),
    radar: t('dashboard.variantRadar', 'Radar'),
  };
  const variantIcons = {
    default: 'bi-grid-3x3-gap-fill',
    line: 'bi-graph-up',
    area: 'bi-layers-fill',
    bar: 'bi-bar-chart-fill',
    radar: 'bi-bullseye',
  };
  const liveVariantOptions = LIVE_VARIANTS.map((variant) => ({
    value: variant,
    label: variantLabels[variant],
    icon: variantIcons[variant],
  }));
  const ticketVariantOptions = TICKET_VARIANTS.map((variant) => ({
    value: variant,
    label: variantLabels[variant],
    icon: variantIcons[variant],
  }));
  const projectVariantOptions = PROJECT_VARIANTS.map((variant) => ({
    value: variant,
    label: variantLabels[variant],
    icon: variantIcons[variant],
  }));

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const updateTheme = () => {
      setThemeMode(document.documentElement.getAttribute('data-theme') || 'light');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [statsRes, projektRes, ticketRes, kundenRes, benutzerRes, berichtRes] = await Promise.all([
        dashboardApi.getStats(),
        projektApi.getAll(1, 100),
        ticketApi.getAll(1, 200),
        kundeApi.getAll(1, 1),
        benutzerApi.getAll(1, 1),
        berichtApi.getAll(1, 1),
      ]);

      const projekte = projektRes.data?.items || projektRes.data || [];
      const projekteTotal = totalFromResponse(projektRes);
      const projectGrouped = {};
      projekte.forEach((projekt) => {
        const status = projekt.status || 'NichtGestartet';
        projectGrouped[status] = (projectGrouped[status] || 0) + 1;
      });
      setChartData(Object.entries(projectGrouped).map(([status, count]) => ({
        name: t(`status.${status}`, status), count, status,
      })));

      const tickets = ticketRes.data?.items || ticketRes.data || [];
      const ticketsTotal = totalFromResponse(ticketRes);
      setAllTickets(tickets);
      setRecentTickets(tickets.slice(0, 6));

      const ticketGrouped = {};
      tickets.forEach((ticket) => {
        const status = ticket.status || 'Offen';
        ticketGrouped[status] = (ticketGrouped[status] || 0) + 1;
      });
      setTicketChartData(Object.entries(ticketGrouped).map(([status, count]) => ({
        name: t(`status.${status}`, status), value: count, status,
      })));

      const rawStats = statsRes.data || {};
      const offeneTicketsFallback = tickets.filter((ticket) => ticket.status === 'Offen').length;
      const kritischeTicketsFallback = tickets.filter((ticket) => ticket.prioritaet === 'Kritisch').length;
      const aktiveProjekteFallback = projekte.filter((projekt) => projekt.status === 'InBearbeitung').length;
      const kundenTotal = totalFromResponse(kundenRes);
      const benutzerTotal = totalFromResponse(benutzerRes);
      const berichteTotal = totalFromResponse(berichtRes);

      const normalizedStats = {
        kundenAnzahl: firstFiniteNumber(
          rawStats.kundenAnzahl, rawStats.kundenanzahl, rawStats.kunden, rawStats.customerCount, kundenTotal, 0
        ) ?? 0,
        projekteAnzahl: firstFiniteNumber(
          rawStats.projekteAnzahl, rawStats.projekteanzahl, rawStats.projekte, rawStats.projectCount, projekteTotal, 0
        ) ?? 0,
        ticketsAnzahl: firstFiniteNumber(
          rawStats.ticketsAnzahl, rawStats.ticketsanzahl, rawStats.tickets, rawStats.ticketCount, ticketsTotal, 0
        ) ?? 0,
        offeneTickets: firstFiniteNumber(
          rawStats.offeneTickets, rawStats.openTickets, rawStats.offene, offeneTicketsFallback, 0
        ) ?? 0,
        benutzerAnzahl: firstFiniteNumber(
          rawStats.benutzerAnzahl, rawStats.benutzeranzahl, rawStats.benutzer, rawStats.userCount, benutzerTotal, 0
        ) ?? 0,
        aktiveProjekte: firstFiniteNumber(
          rawStats.aktiveProjekte, rawStats.aktiveprojekte, rawStats.activeProjects, aktiveProjekteFallback, 0
        ) ?? 0,
        berichteAnzahl: firstFiniteNumber(
          rawStats.berichteAnzahl, rawStats.berichteanzahl, rawStats.berichte, rawStats.reportCount, berichteTotal, 0
        ) ?? 0,
        kritischeTickets: firstFiniteNumber(
          rawStats.kritischeTickets, rawStats.kritischetickets, rawStats.criticalTickets, kritischeTicketsFallback, 0
        ) ?? 0,
      };
      setStats(normalizedStats);

      setTrendData((current) => {
        const nextPoint = createTrendPoint(Date.now(), normalizedStats.aktiveProjekte, normalizedStats.offeneTickets);
        const withoutSameDay = current.filter((point) => point.dateKey !== nextPoint.dateKey);
        return [...withoutSameDay, nextPoint]
          .sort((a, b) => a.ts - b.ts)
          .slice(-30);
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || t('dashboard.error'));
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => loadAll(), 0);
    return () => clearTimeout(timer);
  }, [loadAll]);

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;
    const timer = setInterval(() => {
      loadAll({ silent: true });
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, refreshInterval, loadAll]);

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t('dashboard.goodMorning')
    : hour < 18
      ? t('dashboard.goodAfternoon')
      : t('dashboard.goodEvening');

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-greeting">
              {greeting}, <span className="dashboard-username">{user?.vorname || t('dashboard.defaultUser')}</span>
            </h1>
            <p className="dashboard-subtitle">{t('dashboard.todayOverview')}</p>
            <div className="dashboard-updated-line">
              {t('dashboard.lastUpdated')}: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
            </div>
          </div>
          <div className="dashboard-header-actions">
            <label className="dashboard-switch">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
              />
              <span className="dashboard-switch-slider" />
              <span className="dashboard-switch-label">
                {autoRefreshEnabled ? t('dashboard.live') : t('dashboard.paused')}
              </span>
            </label>
            <label className="dashboard-interval">
              <span>{t('dashboard.refreshEvery')}</span>
              <select
                value={refreshInterval}
                onChange={(event) => setRefreshInterval(Number(event.target.value))}
                disabled={!autoRefreshEnabled}
              >
                {REFRESH_INTERVAL_OPTIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>{seconds}{t('dashboard.secondsShort')}</option>
                ))}
              </select>
            </label>
            <button
              className="dashboard-refresh-btn"
              onClick={() => loadAll({ silent: true })}
              disabled={loading || isRefreshing}
            >
              <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`} />
              <span>{t('dashboard.refresh')}</span>
            </button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" className="mx-4">{error}</Alert>}

      <div className="dashboard-stats-grid">
        <StatCard title={t('dashboard.offeneTickets')} value={stats?.offeneTickets}
          icon="bi-exclamation-triangle-fill" gradient={COLORS.gradient.danger} delay={0} />
        <StatCard title={t('dashboard.kritischeTickets')} value={stats?.kritischeTickets}
          icon="bi-bell-fill" gradient={COLORS.gradient.neutral} delay={80} />
        <StatCard title={t('dashboard.aktiveProjekte')} value={stats?.aktiveProjekte}
          icon="bi-rocket-takeoff-fill" gradient={COLORS.gradient.success} delay={160} />
        <StatCard title={t('dashboard.ticketsAnzahl')} value={stats?.ticketsAnzahl}
          icon="bi-ticket-detailed-fill" gradient={COLORS.gradient.warning} delay={240} />
        <StatCard title={t('dashboard.kundenAnzahl')} value={stats?.kundenAnzahl}
          icon="bi-people-fill" gradient={COLORS.gradient.primary} delay={320} />
        <StatCard title={t('dashboard.projekteAnzahl')} value={stats?.projekteAnzahl}
          icon="bi-kanban-fill" gradient={COLORS.gradient.info} delay={400} />
        <StatCard title={t('dashboard.benutzerAnzahl')} value={stats?.benutzerAnzahl}
          icon="bi-person-gear" gradient={COLORS.gradient.success} delay={480} />
        <StatCard title={t('dashboard.berichteAnzahl')} value={stats?.berichteAnzahl}
          icon="bi-file-earmark-bar-graph-fill" gradient={COLORS.gradient.primary} delay={560} />
      </div>

      <div className="dashboard-charts-row">
        <ChartCard
          title={t('dashboard.weeklyOverview')}
          icon="bi-graph-up-arrow"
          iconColor={COLORS.primary}
          titleAddon={(
            <>
              <button
                className={`dashboard-calendar-toggle ${showDateRange ? 'active' : ''}`}
                onClick={() => setShowDateRange((current) => !current)}
                type="button"
              >
                <i className="bi bi-calendar3" />
                <span>{t('dashboard.dateRange')}</span>
              </button>
              <div className={`dashboard-date-range-panel ${showDateRange ? 'is-open' : ''}`} aria-hidden={!showDateRange}>
                <div className="dashboard-date-range " >
                  <label>
                    <span>{t('dashboard.startDate')}</span>
                    <input
                      type="date"
                      value={rangeStart}
                      max={rangeEnd || undefined}
                      onChange={(event) => setRangeStart(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>{t('dashboard.endDate')}</span>
                    <input
                      type="date"
                      value={rangeEnd}
                      min={rangeStart || undefined}
                      onChange={(event) => setRangeEnd(event.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="dashboard-date-close"
                  onClick={() => setShowDateRange(false)}
                  aria-label={t('common.close')}
                >
                  <i className="bi bi-x-lg"/>
                </button>
              </div>
            </>
          )}
          isRefreshing={isRefreshing}
          className="dashboard-chart-wide"
          onSelectVariant={setLiveChartVariant}
          variantOptions={liveVariantOptions}
          activeVariant={liveChartVariant}
          variantLabel={variantLabels[liveChartVariant]}
          variantIcon={variantIcons[liveChartVariant]}
        >
          <PanelState
            loading={loading && !hasData}
            error={Boolean(error)}
            empty={!filteredTrendSeries.length}
            emptyText={t('dashboard.empty')}
            errorText={t('dashboard.error')}
          />
          {!(loading && !hasData) && !error && Boolean(filteredTrendSeries.length) && (
            <>
              {liveChartVariant === 'default' && (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={filteredTrendSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stackedProjekte" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#fdba74' : '#ea580c'} stopOpacity={0.34} />
                        <stop offset="95%" stopColor={isDark ? '#fdba74' : '#ea580c'} stopOpacity={0.06} />
                      </linearGradient>
                      <linearGradient id="stackedTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.34} />
                        <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="projekte"
                      name={t('dashboard.projectsLegend')}
                      stackId="load"
                      stroke={isDark ? '#fdba74' : '#ea580c'}
                      fill="url(#stackedProjekte)"
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      name={t('dashboard.ticketsLegend')}
                      stackId="load"
                      stroke={COLORS.warning}
                      fill="url(#stackedTickets)"
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name={t('dashboard.totalLegend', 'Total')}
                      stroke={COLORS.primary}
                      strokeWidth={2.7}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
              {liveChartVariant === 'line' && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredTrendSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="projekte" name={t('dashboard.projectsLegend')} stroke={isDark ? '#fdba74' : '#ea580c'} strokeWidth={2.3} dot={false} />
                    <Line type="monotone" dataKey="tickets" name={t('dashboard.ticketsLegend')} stroke={COLORS.warning} strokeWidth={2.3} dot={false} />
                    <Line type="monotone" dataKey="total" name={t('dashboard.totalLegend', 'Total')} stroke={COLORS.primary} strokeWidth={2.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {liveChartVariant === 'area' && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredTrendSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="liveAreaProjects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#fdba74' : '#ea580c'} stopOpacity={0.33} />
                        <stop offset="95%" stopColor={isDark ? '#fdba74' : '#ea580c'} stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="liveAreaTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.33} />
                        <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="projekte" name={t('dashboard.projectsLegend')} stroke={isDark ? '#fdba74' : '#ea580c'} fill="url(#liveAreaProjects)" />
                    <Area type="monotone" dataKey="tickets" name={t('dashboard.ticketsLegend')} stroke={COLORS.warning} fill="url(#liveAreaTickets)" />
                    <Area type="monotone" dataKey="total" name={t('dashboard.totalLegend', 'Total')} stroke={COLORS.primary} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {liveChartVariant === 'bar' && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredTrendSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="projekte" name={t('dashboard.projectsLegend')} fill={isDark ? '#fdba74' : '#ea580c'} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="tickets" name={t('dashboard.ticketsLegend')} fill={COLORS.warning} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="total" name={t('dashboard.totalLegend', 'Total')} fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </ChartCard>

        <ChartCard
          title={t('dashboard.ticketsByStatus')}
          icon="bi-pie-chart-fill"
          iconColor={COLORS.warning}
          isRefreshing={isRefreshing}
          className="dashboard-chart-narrow"
          onSelectVariant={setTicketChartVariant}
          variantOptions={ticketVariantOptions}
          activeVariant={ticketChartVariant}
          variantLabel={variantLabels[ticketChartVariant]}
          variantIcon={variantIcons[ticketChartVariant]}
        >
          <PanelState
            loading={loading && !hasData}
            error={Boolean(error)}
            empty={!ticketChartData.length}
            emptyText={t('dashboard.empty')}
            errorText={t('dashboard.error')}
          />
          {!(loading && !hasData) && !error && Boolean(ticketChartData.length) && (
            <>
              {ticketChartVariant === 'default' && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={ticketChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={105}
                      paddingAngle={4} dataKey="value" strokeWidth={0}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
                      {ticketChartData.map((entry, idx) => (
                        <Cell key={idx} fill={TICKET_COLORS[entry.status] || COLORS.primary} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {ticketChartVariant === 'bar' && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name={t('dashboard.ticketsLegend')} radius={[8, 8, 0, 0]}>
                      {ticketChartData.map((entry, idx) => (
                        <Cell key={idx} fill={TICKET_COLORS[entry.status] || COLORS.primary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {ticketChartVariant === 'radar' && (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={ticketChartData}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: axisTick.fill, fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: axisTick.fill, fontSize: 10 }} />
                    <Radar dataKey="value" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.35} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
              {ticketChartVariant === 'line' && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" name={t('dashboard.ticketsLegend')} stroke={COLORS.warning} strokeWidth={2.6} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </ChartCard>
      </div>

      <div className="dashboard-charts-row">
        <ChartCard
          title={t('dashboard.projectsByStatus')}
          icon="bi-bar-chart-fill"
          iconColor={COLORS.success}
          isRefreshing={isRefreshing}
          className="dashboard-chart-half"
          onSelectVariant={setProjectChartVariant}
          variantOptions={projectVariantOptions}
          activeVariant={projectChartVariant}
          variantLabel={variantLabels[projectChartVariant]}
          variantIcon={variantIcons[projectChartVariant]}
        >
          <PanelState
            loading={loading && !hasData}
            error={Boolean(error)}
            empty={!chartData.length}
            emptyText={t('dashboard.empty')}
            errorText={t('dashboard.error')}
          />
          {!(loading && !hasData) && !error && Boolean(chartData.length) && (
            <>
              {projectChartVariant === 'default' && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name={t('dashboard.projekteAnzahl')} radius={[8, 8, 0, 0]} barSize={44}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[entry.status] || COLORS.primary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {projectChartVariant === 'line' && (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name={t('dashboard.projekteAnzahl')} stroke={COLORS.success} strokeWidth={2.8} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {projectChartVariant === 'area' && (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="projectAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.38} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name={t('dashboard.projekteAnzahl')} stroke={COLORS.success} fill="url(#projectAreaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {projectChartVariant === 'radar' && (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={chartData}>
                    <PolarGrid stroke={gridStroke} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: axisTick.fill, fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: axisTick.fill, fontSize: 10 }} />
                    <Radar dataKey="count" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.35} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </ChartCard>

        <div className="dashboard-chart-half dashboard-split-col">
          <ChartCard title={t('dashboard.priorityDistribution')} icon="bi-flag-fill" iconColor={COLORS.danger} isRefreshing={isRefreshing}>
            <PanelState
              loading={loading && !hasData}
              error={Boolean(error)}
              empty={!allTickets.length}
              emptyText={t('dashboard.empty')}
              errorText={t('dashboard.error')}
            />
            {!(loading && !hasData) && !error && Boolean(allTickets.length) && (
              <PriorityBreakdown tickets={allTickets} t={t} />
            )}
          </ChartCard>
          <ChartCard title={t('dashboard.latestTickets')} icon="bi-clock-history" iconColor={COLORS.info} isRefreshing={isRefreshing}>
            <PanelState
              loading={loading && !hasData}
              error={Boolean(error)}
              empty={!recentTickets.length}
              emptyText={t('dashboard.noRecentTickets')}
              errorText={t('dashboard.error')}
            />
            {!(loading && !hasData) && !error && Boolean(recentTickets.length) && (
              <RecentTickets tickets={recentTickets} t={t} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
