/*
 * <license header>
 */

/**
 * Static UI text — chrome that stays the same regardless of which project or
 * gate is loaded (button/tab/section names, column & field labels, chart
 * captions, link text, the fixed status vocabulary, and static messages).
 *
 * These are intentionally kept OUT of the API-shaped data (`sampleProject.js`):
 * they belong to the app, not the payload. `sampleProject.js` references these
 * so every static string has one source of truth (and is i18n-ready).
 *
 * Dynamic, data-bound values (project title, metric values, dates, counts,
 * approver rows, field values, gate/checklist content) stay in the data.
 */
export const LABELS = {
  // Header CTAs, links and standalone action buttons.
  actions: {
    preRead: 'Pre-read',
    preReadSlides: 'Pre-read Slides',
    needAttention: 'Need Attention',
    openFullRiskView: 'Open full risk view',
    viewApprovalTrail: 'View approval trail',
    openInWorkfront: 'Open in Workfront ↗',
    configureApprovers: 'Configure Approvers',
    askAiRecommendation: 'Ask AI Recommendation',
    getFreshLook: 'Get a fresh look',
    draftHoldRationale: 'Draft hold rationale',
    logConditionalGo: 'Log conditional GO',
  },

  // Project view tabs.
  tabs: {
    executiveSummary: 'Executive Summary',
    learningPlan: 'Learning Plan',
    riskView: 'Risk View',
  },

  // Section / card titles.
  sections: {
    keyMetrics: 'Key Metrics',
    gatePipeline: 'Gate Pipeline',
    gateReadiness: 'Gate Readiness',
    approvalTrail: 'Approval Trail',
    approval: 'Approval',
    aiRecommendation: 'AI Recommendation',
    beyondSummary: 'Beyond the Summary',
    keyKpis: 'Key KPIs',
  },

  // KPI metric names.
  metrics: {
    absoluteVolume: 'Absolute Volume',
    incrementalVolume: 'Incremental Volume',
    gpMargin: 'GP Margin',
    capex: 'CAPEX',
  },

  // KPI card footnotes (secondary labels under the metric).
  footnotes: {
    g1Baseline: 'G1 Baseline',
    capexThreshold: 'Under $500K threshold',
  },

  // Chart labels & captions.
  chart: {
    positionInForecastRange: 'Position in forecast range',
    actual: 'Actual',
    benchmark: 'Benchmark',
  },

  // Table column headers.
  columns: {
    name: 'Name',
    department: 'Department',
    date: 'Date',
    status: 'Status',
  },

  // Form / field labels.
  fields: {
    pmoComments: 'PMO Comments',
    businessCaseSummary: 'Business Case Summary',
    targetConsumer: 'Target Consumer / Occasion',
    innovationDriver: 'Innovation Driver / Typology',
  },

  // Fixed status vocabulary — which value shows is data-driven, but the set of
  // possible words is static.
  status: {
    completed: 'Completed',
    inProgress: 'In Progress',
    needAttention: 'Need Attention',
    notStarted: 'Not Started',
    approved: 'Approved',
    pending: 'Pending',
    tracking: 'Tracking',
    reOpen: 'Re-Open',
    needsWork: 'Needs Work',
    inReview: 'In Review',
    missingOverdue: 'Missing-overdue',
    accretive: 'Accretive',
    dilutive: 'Dilutive',
  },

  // Static messages / empty & locked states.
  messages: {
    emptyPmo: 'Not yet written for this gate',
    lockedTitle: 'Locked',
    lockedGate1: 'Gate 1 approved. Values are read-only; edit in Workfront if a correction is needed.',
  },

  // Tag prefixes — the static label part of "OU: Latin America" etc.
  tags: {
    ou: 'OU',
    category: 'Category',
    lead: 'Lead',
  },

  // Templates for labels that interleave static text with a dynamic value.
  // Placeholders use {name} syntax — fill them with `formatLabel`.
  templates: {
    target: 'Target {date}',
    stage: 'Stage: {name} -',
    approvedOn: 'Approved {date}',
    liveStatusChanges: 'Live Status : {count} Changes',
    tag: '{label}: {value}',
    countApproved: '{completed} of {total} Approved',
    countComplete: '{completed} of {total} complete',
    itemsNeedAttention: '{count} Items need attention',
  },
};

/**
 * Fill a `{placeholder}` template (see `LABELS.templates`) with actual values.
 * Unmatched placeholders resolve to an empty string.
 *   formatLabel(LABELS.templates.target, { date: 'Mar 12, 2026' }) // "Target Mar 12, 2026"
 */
export function formatLabel(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ''
  );
}

export default LABELS;
