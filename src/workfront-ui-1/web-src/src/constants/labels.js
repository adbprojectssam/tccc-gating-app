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
    launchMarket: 'Launch Market',
  },

  // DSFV snapshot labels (Desirability / Sellability / Feasibility / Viability).
  dsfv: {
    desirability: 'Desirability',
    sellability: 'Sellability',
    feasibility: 'Feasibility',
    viability: 'Viability',
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
      `Upload the artifacts you have - a launch deck, budget, or strategy doc - and the pre-read will be extracted automatically. You don't need everything ready at once.`,
    dropTitle: 'Drag and drop your file',
    dropSubtitle: 'Or, select a file from your computer.',
    browse: 'Browse files',
    uploaded: 'Uploaded Artifacts',
    cancel: 'Cancel',
    save: 'Save Artifact',
    generatePreRead: 'Validate Data',
    uploadedToday: 'Uploaded today',
    uploading: 'Uploading…',
    uploadFailed: 'Upload failed',
  },

  // Gate 1 readiness card — shown inline after Generate Pre-read, listing the
  // values the extraction API pulled from the uploaded document(s), split into
  // High Confidence / Low Confidence / Conflicts / Missing Data tabs.
  fieldReview: {
    title: 'Gate 1 Pre-read Validation',
    versionPlaceholder: 'Current Version',
    progress: '{completed} of {total} fields complete',
    viewPreRead: 'View pre-read',
    updatePreRead: 'Update Pre-read',
    submitForReview: 'Submit for pre-read',
    tabHigh: 'High Confidence Data ({count})',
    tabLow: 'Low Confidence Data ({count})',
    tabConflict: 'Conflicts ({count})',
    tabMissing: 'Missing Data ({count})',
    loading: 'Extracting field values…',
    error: `We couldn't extract field values. Please try again.`,
    empty: 'No fields were returned for these documents.',
    valueLine: 'Value: {value}.',
    confidenceHint: 'Extracted at {percent}% confidence — please confirm.',
    confirmValue: 'Confirm value',
    missingSuffix: ' - Missing',
    missingHint: 'Not found in either document.',
    enterValue: 'Enter Value',
    conflictHint: 'Conflicting values — Workfront {workfrontValue} vs. doc {value}.',
    resolveConflict: 'Resolve conflict',
    resolveAriaLabel: 'Resolve {label}',
    conflictOptionWorkfront: 'Workfront: {value}',
    conflictOptionDoc: 'Doc: {value}',
    save: 'Save',
    submitting: 'Submitting…',
  },

  // Pre-read side panel — opened from "View pre-read" on the Gate 1 readiness
  // card. Read-only summary of the business case pulled from the source docs.
  preReadPanel: {
    title: 'Pre-read - Gate 1: Concept',
    versionPlaceholder: 'No versions yet',
    currentVersion: 'Version 2 (Current)',
    sharedNotice: 'Shared with {facilitator} (Gate 1 facilitator) · All fields confirmed.',
    businessCaseSummary: 'Business Case Summary',
    keyMetrics: 'Key Metrics',
    dsfvSnapshot: 'DSFV Snapshot',
    source: 'Source',
    missingValue: 'UPDATE',
    updatePreRead: 'Update Pre-read',
    downloadPdf: 'Download',
    close: 'Close',
    emptyTitle: 'No pre-read generated',
    emptyBody: "Your pre-read document will appear here once it's been generated.",
  },

  // New-project onboarding dashboard (shown before the gating process starts).
  onboarding: {
    badge: 'Action Required',
    heading: 'This is a new project — start with the pre-read workflow',
    body:
      'Upload your pre-reads to kick off the gating process. Pre-reads help stakeholders review and align on important project details before the official Gate 1 review meeting.',
    uploadArtifacts: 'Upload Artifacts',
    learnMore: 'Learn about the gating process',
    learnMoreHref: '#',
    dropTitle: 'No documents uploaded yet',
    dropSubtitle: 'PDF, PPTX, or DOCX up to 50MB',
    ioTitle: 'IO Submitted Fields - Business Case',
    ioLocked:
      'Locked - No business case fields submitted yet. Fields will populate automatically from Workfront once you kick off the gating process.',
    approvalNotInitialized:
      'Approval workflow is not initialized. Submit your pre-reads to generate the stakeholder review trail.',
    gate1PreRead: 'Pre-read submitted',
  },

  // Tag prefixes — the static label part of "OU: Latin America" etc.
  tags: {
    ou: 'OU',
    category: 'Category',
    country: 'Country',
    lead: 'Lead',
  },

  // "Pre-read complete" status card (replaces the onboarding banner once the
  // pre-read is confirmed) and the "Choose a Gate 1 event" registration modal.
  gateRegistration: {
    complete: 'Complete',
    heading: 'Pre-read shared with your Gate 1 facilitator',
    body: "All fields are confirmed. Register for a Gate 1 event and we'll share this pre-read with that event's facilitator ahead of the meeting.",
    registerButton: 'Register for Gate 1',
    registerHeaderButton: 'Register for Gate {number}',
    viewPreRead: 'View Pre-read',
    artifactTitle: 'Generated Pre-read',
    uploadedBy: '{size}, Uploaded today by {name}',
    // Registered-state banner (Figma 1889-122628 / 1932-123418) — replaces the
    // "Complete" banner above once a Gate 1 event is chosen.
    registeredBadge: 'Registered',
    registeredHeading: 'Registered for {name}',
    registeredBody: "This project is now on the agenda for {date}. {facilitator}, this event's facilitator, has been notified and can review the pre-read ahead of the meeting.",
    viewGateDetails: 'View Gate Details',
    meetingTitle: 'Gate 1 Review Meeting',
    facilitatorLine: 'Facilitator: {name}',
    addToCalendar: 'Add to calendar',
    addedToCalendar: 'Added to your Outlook calendar.',
    modalTitle: 'Choose a Gate 1 event',
    modalSubtitle: "Only events matching this project's level ({level}: {value}) can be selected.",
    modalSubtitleNoLevel: 'This project has no Category, Operating Unit, or Country set, so no events can be matched yet.',
    tabCalendar: 'Calendar',
    tabList: 'List',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    legendMatch: 'Level matches',
    legendNonEligible: 'Not eligible',
    notEligibleReason: 'Not eligible - {level}: {value}',
    moreEvents: '+{count} more',
    loading: 'Loading gate events…',
    error: "We couldn't load gate events. Please try again.",
    empty: 'No upcoming Gate 1 events were found.',
    noEligible: "No upcoming events match this project's level yet — check back later.",
    listEmpty: 'No events to show.',
    cancel: 'Cancel',
    register: 'Register',
    registering: 'Registering…',
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
