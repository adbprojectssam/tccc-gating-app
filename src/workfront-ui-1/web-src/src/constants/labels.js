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
    preRead: 'Artifacts',
    preReadSlides: 'Pre-read',
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

  // Artifact upload dialog (opened from the "Artifacts" header CTA).
  artifact: {
    title: 'Artifact',
    description:
      'Upload the source document for this gate. This is stored as-is - generate the Pre-read from it separately.',
    dropTitle: 'Drag and drop your file',
    dropSubtitle: 'Or, select a file from your computer.',
    browse: 'Browse files',
    uploaded: 'Uploaded Artifacts',
    cancel: 'Cancel',
    save: 'Save Artifact',
    generatePreRead: 'Generate Pre-read',
    uploadedToday: 'Uploaded today',
    uploading: 'Uploading…',
    uploadFailed: 'Upload failed',
  },

  // Pre-read generation dialog (opened from the "Pre-read" header CTA).
  preread: {
    title: 'Pre-read',
    description:
      'Generates the pre-read Decision Makers will read ahead of the gate meeting, from the saved artifact.',
    noArtifact:
      'No artifact has been saved for this gate yet. Save one via Artifact before a Pre-read can be generated.',
    generatingFrom: 'Generating from saved artifact:',
    cancel: 'Cancel',
    goToArtifact: 'Go to Artifact',
    generate: 'Generate',
    regenerate: 'Regenerate',
    download: 'Download',
  },

  // Field-review dialog — shown after Generate Pre-read, listing the values the
  // extraction API pulled from the uploaded document(s). Two states: "Need
  // Attention" (some fields low-confidence/missing) and "Complete your Pre-read"
  // (all fields valid).
  fieldReview: {
    needAttentionTitle: 'Need Attention',
    completeTitle: 'Complete your Pre-read',
    reviewSubtitle: '{count} fields need your review before this pre-read can be shared',
    body:
      'We pulled most fields directly from your document. A few were low-confidence or missing - confirm or fill these in, then share the pre-read with your Gate 1 facilitator.',
    loading: 'Extracting field values…',
    error: 'We couldn’t extract field values. Please try again.',
    empty: 'No fields were returned for these documents.',
    missingSuffix: ' - Missing',
    missingHint: 'Not found in document. Enter the {label} value to continue.',
    lowConfidenceHint: 'Low confidence - confirm or correct the extracted value.',
    enterValue: 'Enter Value',
    valueLine: 'Value: {value}',
    save: 'Save',
    saveDraft: 'Save Draft',
    cancel: 'Cancel',
    confirmShare: 'Confirm & Share Pre-read',
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
    generatedBy: 'Generated by {by} · {date}',
  },
};

/**
 * Workfront field key → UI label for the field-review dialog. Populated when the
 * field/label mappings are provided; until then `fieldLabel` shows the raw key.
 */
export const FIELD_LABELS = {};

/** UI label for a Workfront field key (falls back to the key itself). */
export function fieldLabel(key) {
  return FIELD_LABELS[key] || key;
}

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
