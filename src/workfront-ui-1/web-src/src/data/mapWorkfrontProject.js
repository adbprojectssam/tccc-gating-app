/*
 * <license header>
 */

/**
 * Maps a Workfront (attask) project response into the dashboard `project`
 * shape consumed by <GatingDashboard>. Only fields the API actually provides
 * are populated; sections with no API source (Approval Trail, Gate Readiness,
 * AI Recommendation, Key KPIs, the tab panels, and per-gate pipeline statuses)
 * render as EMPTY STATES — present but with no rows/items.
 *
 * Static UI chrome (button/tab/section labels, templates) comes from LABELS so
 * it stays consistent with the mock. Header CTAs and view tabs are app chrome,
 * so they are kept (the tabs just have empty panels).
 *
 * Mapping notes / assumptions:
 *  - The gate pipeline is derived from `raw.gates` — tasks whose name starts
 *    with "Gate", enriched with task details (fetched server-side in the
 *    get-project action). Completed gates are green, the first non-completed
 *    fetched gate is "current", and gates past it render as empty nodes.
 *  - KPI values come from DE fields; the API has no forecast distribution or
 *    benchmark, so the KPI cards render WITHOUT their chart visual.
 */
import { LABELS, formatLabel } from '../constants/labels';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Extract year/month/day from a Workfront date. Workfront returns either a plain
 * date ("2026-09-02") or a datetime whose format `new Date()` can't parse
 * (e.g. "2027-03-18T02:30:00:000+0530" — colon before ms, no colon in offset).
 * We only need the calendar date, so read Y-M-D off the string directly (also
 * avoids any timezone off-by-one). Returns null when unparseable.
 */
function parseYMD(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return { y: +m[1], mo: +m[2] - 1, d: +m[3] };
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : { y: dt.getFullYear(), mo: dt.getMonth(), d: dt.getDate() };
}

/** Figma short date, e.g. "Mar 12, 2026" (used for target dates). */
function formatDate(value) {
  const p = parseYMD(value);
  if (!p || !MONTHS[p.mo]) return value ? String(value) : '';
  return `${MONTHS[p.mo]} ${p.d}, ${p.y}`;
}

/** Figma long date, e.g. "March 12, 2026" (used for approved/completed dates). */
function formatDateLong(value) {
  const p = parseYMD(value);
  if (!p || !MONTHS_LONG[p.mo]) return value ? String(value) : '';
  return `${MONTHS_LONG[p.mo]} ${p.d}, ${p.y}`;
}

const isEmpty = (v) => v === null || v === undefined || v === '';

/** Metric value or an em dash for the empty state. */
const orDash = (v) => (isEmpty(v) ? '—' : String(v));

/** Money in K notation, e.g. 280000 → "$280K" (Figma "$280K"). */
const moneyK = (n) => `$${Math.round(Number(n) / 1000)}K`;

// CAPEX budget threshold (matches the "Under $500K threshold" footnote) — used
// as the meter's max so the fill % matches Figma.
const CAPEX_THRESHOLD = 500000;

const percent = (v) => {
  if (isEmpty(v)) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `${n}%` : String(v);
};

/** Volume in K notation, e.g. 199997 → "200K UC" (Figma "1000K UC"). */
const volume = (v) => {
  if (isEmpty(v)) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n / 1000)}K UC` : String(v);
};

// Placeholder forecast distribution for the "Position in forecast range"
// sparkline — the API has no distribution data, so we render the Figma histogram
// shape (a 20-bar bell curve) with a centered position marker.
const DEFAULT_DISTRIBUTION = [7, 14, 17, 21, 26, 31, 36, 41, 46, 51, 47, 42, 37, 32, 25, 21, 17, 14, 12, 9];

// Header CTAs — app chrome, identical to the mock.
const HEADER_ACTIONS = [
  { id: 'pre-read', label: LABELS.actions.preRead, variant: 'primary', fillStyle: 'fill', icon: 'tutorials' },
  { id: 'pre-read-slides', label: LABELS.actions.preReadSlides, variant: 'secondary', fillStyle: 'outline', icon: 'slideshow' },
  { id: 'need-attention', label: LABELS.actions.needAttention, variant: 'negative', fillStyle: 'fill', icon: 'alertTriangle' },
];

// View tabs — chrome; panels are empty (no API source for their content).
const EMPTY_TABS = [
  { id: 'executive-summary', label: LABELS.tabs.executiveSummary, icon: 'file', panel: { heading: LABELS.tabs.executiveSummary, paragraph: '' } },
  { id: 'learning-plan', label: LABELS.tabs.learningPlan, icon: 'education', panel: { heading: LABELS.tabs.learningPlan, items: [] } },
  { id: 'risk-view', label: LABELS.tabs.riskView, icon: 'alertTriangle', panel: { heading: LABELS.tabs.riskView, risks: [] } },
];

const APPROVAL_COLUMNS = [
  { id: 'name', label: LABELS.columns.name, isRowHeader: true },
  { id: 'department', label: LABELS.columns.department },
  { id: 'date', label: LABELS.columns.date },
  { id: 'status', label: LABELS.columns.status },
];

/* --------------------------------------------------------------------------
 * PLACEHOLDERS — Gate 1 pieces the Workfront API does not return. Per product
 * decision ("match Figma with placeholders"), these render the Figma design.
 * Replace with real data once the corresponding Workfront sources exist.
 * ------------------------------------------------------------------------ */

// Live Status picker (Figma "Picker (S)" with the orange movie-camera icon).
const PLACEHOLDER_LIVE_STATUS = {
  ariaLabel: 'Live status',
  selectedKey: 'two-changes',
  options: [
    { id: 'two-changes', label: formatLabel(LABELS.templates.liveStatusChanges, { count: 2 }) },
    { id: 'all-changes', label: 'All changes' },
    { id: 'no-changes', label: 'No changes' },
  ],
};

// "Approved Unanimously" in-line alert shown on a completed gate.
const PLACEHOLDER_APPROVAL_ALERT = {
  tone: 'positive',
  title: 'Approved Unanimously',
  detail: 'Closed in 6 days - faster than the 9-day LAOU average · no conditions attached',
  linkLabel: LABELS.actions.viewApprovalTrail,
  linkHref: '#approval-trail',
};

// Approval Trail table (5 approvers).
const PLACEHOLDER_APPROVAL_TRAIL = {
  title: LABELS.sections.approvalTrail,
  summary: formatLabel(LABELS.templates.countApproved, { completed: 5, total: 5 }),
  status: { tone: 'positive', label: LABELS.status.approved },
  columns: APPROVAL_COLUMNS,
  approvers: [
    { id: 'eva', name: 'Eva', department: 'MKT', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
    { id: 'steven', name: 'Steven', department: 'Tech', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
    { id: 'michael', name: 'Michael', department: 'FIN', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
    { id: 'sara', name: 'Sara', department: 'PMO', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
    { id: 'karina', name: 'Karina', department: 'Regulatory', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
  ],
};

// Gate Readiness checklist (6 items, all complete).
const PLACEHOLDER_READINESS = {
  title: LABELS.sections.gateReadiness,
  completed: 6,
  total: 6,
  items: [
    { id: 'formula', label: 'Formula Complete', tone: 'positive' },
    { id: 'samples', label: 'Samples sent to bottler', tone: 'positive' },
    { id: 'consumer-testing', label: 'Consumer testing complete', tone: 'positive' },
    { id: 'commercial', label: 'Commercial execution plan', tone: 'positive' },
    { id: 'launch-targets', label: 'Launch targets submitted', tone: 'positive' },
    { id: 'capacity', label: 'Capacity readiness', tone: 'positive' },
  ],
};

export function mapWorkfrontProject(raw) {
  if (!raw) return null;

  const de = (key) => raw[`DE:${key}`];
  const ownerName = raw.owner && raw.owner.name;
  const market = de('markets_selected') || de('Leading Market');
  const category = de('Global Category');
  const operatingUnit = de('Operating Unit');

  const subtitle = [market, category, ownerName].filter(Boolean).join(' · ');

  // KPI cards. Volumes render in K notation with the "position in forecast
  // range" sparkline; GP Margin shows the Actual-vs-Benchmark bars. The API has
  // no forecast distribution or benchmark, so the sparkline uses a placeholder
  // curve and the benchmark mirrors the actual (a 0-pp delta).
  const gpMarginNum = Number(de('KO Gross Profit Margin'));
  const gpMarginValue = percent(de('KO Gross Profit Margin'));
  const hasGpMargin = Number.isFinite(gpMarginNum);

  const capexRaw = de('CAPEX Budget');
  const capexNum = Number(capexRaw);
  const hasCapex = !isEmpty(capexRaw) && Number.isFinite(capexNum);

  const metrics = [
    {
      id: 'absolute-volume',
      value: volume(de('Absolute Volume Calendar Year 1')),
      label: LABELS.metrics.absoluteVolume,
      footnote: LABELS.footnotes.g1Baseline,
      visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Absolute volume position in forecast range', data: DEFAULT_DISTRIBUTION, marker: 0.5 },
    },
    {
      id: 'incremental-volume',
      value: volume(de('Incremental Volume Calendar Year 1')),
      label: LABELS.metrics.incrementalVolume,
      footnote: LABELS.footnotes.g1Baseline,
      visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Incremental volume position in forecast range', data: DEFAULT_DISTRIBUTION, marker: 0.5 },
    },
    {
      id: 'gp-margin',
      value: gpMarginValue,
      label: LABELS.metrics.gpMargin,
      // No benchmark/delta from the API → show a neutral 0-pp change.
      trend: { tone: 'neutral', label: '0 pp' },
      visual: hasGpMargin
        ? {
            kind: 'comparison',
            bars: [
              { id: 'actual', label: LABELS.chart.actual, value: gpMarginValue, pct: gpMarginNum, highlight: true },
              { id: 'benchmark', label: LABELS.chart.benchmark, value: gpMarginValue, pct: gpMarginNum },
            ],
          }
        : undefined,
    },
    {
      id: 'capex',
      value: hasCapex ? moneyK(capexNum) : '—',
      label: LABELS.metrics.capex,
      footnote: LABELS.footnotes.capexThreshold,
      // Figma "Progress bar (S)" meter: "$XK / $500K" + % + seafoam fill.
      visual: hasCapex
        ? {
            kind: 'meter',
            label: `${moneyK(capexNum)} / ${moneyK(CAPEX_THRESHOLD)}`,
            percent: Math.round((capexNum / CAPEX_THRESHOLD) * 100),
            tone: 'positive',
          }
        : undefined,
    },
  ];

  const tags = [
    operatingUnit && formatLabel(LABELS.templates.tag, { label: LABELS.tags.ou, value: operatingUnit }),
    category && formatLabel(LABELS.templates.tag, { label: LABELS.tags.category, value: category }),
    ownerName && formatLabel(LABELS.templates.tag, { label: LABELS.tags.lead, value: ownerName }),
  ].filter(Boolean);

  const targetDate = de('Target In-Market Date');

  // IO Submitted Fields — Figma's exact 3 fields + "Locked" alert. Business
  // Case Summary and Innovation Driver come from Workfront; Target Consumer /
  // Occasion has no Workfront field, so it renders blank (per Figma's field set).
  const ioFields = {
    title: 'IO Submitted Fields - Business Case',
    workfrontUrl: raw.ID ? `/project/${raw.ID}/overview` : '#',
    workfrontLabel: LABELS.actions.openInWorkfront,
    fields: [
      { id: 'summary', type: 'textarea', label: LABELS.fields.businessCaseSummary, value: de('Initiative Description') || '', isReadOnly: true },
      { id: 'target-consumer', type: 'text', label: LABELS.fields.targetConsumer, value: '', isReadOnly: true },
      { id: 'innovation-driver', type: 'text', label: LABELS.fields.innovationDriver, value: de('Innovation Driver') || '', isReadOnly: true },
    ],
    locked: true,
    lockedTitle: LABELS.messages.lockedTitle,
    lockedMessage: LABELS.messages.lockedGate1,
  };

  // Stage line ("Stage: Stage 1 - Strategy to Idea") derived from the gate's
  // parent task name ("Stage 1: Strategy to Idea").
  const buildStage = (g) => {
    if (!g.parentName) return undefined;
    const idx = g.parentName.indexOf(':');
    const name = idx >= 0 ? g.parentName.slice(0, idx).trim() : g.parentName.trim();
    const text = idx >= 0 ? g.parentName.slice(idx + 1).trim() : '';
    return {
      label: formatLabel(LABELS.templates.stage, { name }),
      text,
      tone: g.completed ? 'positive' : 'neutral',
      statusLabel: g.completed ? LABELS.status.completed : '',
      approvedOn: g.actualCompletionDate
        ? formatLabel(LABELS.templates.approvedOn, { date: formatDateLong(g.actualCompletionDate) })
        : '',
    };
  };

  // Gate detail card matching Figma: Live Status picker, "Approved Unanimously"
  // alert (completed gates), Stage line + Completed badge, tags, PMO Comments.
  const buildGateDetail = (g) => ({
    title: g.name || `Gate ${g.number}`,
    target: g.plannedCompletionDate
      ? formatLabel(LABELS.templates.target, { date: formatDate(g.plannedCompletionDate) })
      : (targetDate ? formatLabel(LABELS.templates.target, { date: formatDate(targetDate) }) : ''),
    liveStatus: PLACEHOLDER_LIVE_STATUS,
    approval: g.completed ? PLACEHOLDER_APPROVAL_ALERT : undefined,
    stage: buildStage(g),
    tags,
    pmoComments: { label: LABELS.fields.pmoComments, value: g.pmoComments || '', emptyText: LABELS.messages.emptyPmo },
  });

  // Build the pipeline + per-gate data from the enriched gate tasks. Completed
  // gates are green; the first non-completed (fetched) gate is "current"; any
  // gates past it are empty "not-started" nodes. Only fetched gates get data.
  const rawGates = Array.isArray(raw.gates) ? raw.gates.slice().sort((a, b) => a.number - b.number) : [];
  const pipelineGates = [];
  const gateData = {};
  let currentAssigned = false;
  let currentKey = null;

  rawGates.forEach((g) => {
    let status;
    let statusLabel;
    if (g.completed) {
      status = 'completed';
      statusLabel = LABELS.status.completed;
    } else if (!currentAssigned && g.fetched) {
      // Next incomplete gate → "Need Attention" (red), per Figma.
      status = 'attention';
      statusLabel = LABELS.status.needAttention;
      currentAssigned = true;
      currentKey = String(g.number);
    } else {
      status = 'not-started';
      statusLabel = LABELS.status.notStarted;
    }
    pipelineGates.push({ number: g.number, label: `Gate ${g.number}`, status, statusLabel });

    if (g.fetched) {
      gateData[g.number] = {
        keyMetrics: { title: LABELS.sections.keyMetrics, metrics },
        gateDetail: buildGateDetail(g),
        ioFields,
        approval: PLACEHOLDER_APPROVAL_TRAIL,
        gateReadiness: PLACEHOLDER_READINESS,
      };
    }
  });

  // All gates complete → land on the last gate; none → project-level fallback.
  if (!currentKey && rawGates.length) currentKey = String(rawGates[rawGates.length - 1].number);

  if (!pipelineGates.length) {
    pipelineGates.push({ number: 1, label: 'Gate 1', status: 'current', statusLabel: '' });
    gateData[1] = {
      keyMetrics: { title: LABELS.sections.keyMetrics, metrics },
      gateDetail: {
        title: 'Gate 1',
        target: targetDate ? formatLabel(LABELS.templates.target, { date: formatDate(targetDate) }) : '',
        liveStatus: PLACEHOLDER_LIVE_STATUS,
        tags,
        pmoComments: { label: LABELS.fields.pmoComments, value: '', emptyText: LABELS.messages.emptyPmo },
      },
      ioFields,
      approval: PLACEHOLDER_APPROVAL_TRAIL,
      gateReadiness: PLACEHOLDER_READINESS,
    };
    currentKey = '1';
  }

  return {
    header: { title: raw.name || '', subtitle, actions: HEADER_ACTIONS },

    // Empty state — no "need attention" API.
    needAttention: {
      title: formatLabel(LABELS.templates.itemsNeedAttention, { count: 0 }),
      items: [],
      primaryAction: { id: 'open-risk-view', label: LABELS.actions.openFullRiskView },
    },

    tabs: EMPTY_TABS,

    pipeline: { title: LABELS.sections.gatePipeline, currentKey, gates: pipelineGates },
    defaultGate: currentKey,
    gateData,
  };
}

export default mapWorkfrontProject;
