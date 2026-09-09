/*
 * <license header>
 */

/**
 * Mock data for the gating dashboard.
 *
 * Shape mirrors an eventual API/Workfront response. Project-level bits (header,
 * tabs, pipeline) are shared; everything that changes per gate lives under
 * `gateData[<gateKey>]`. Selecting a gate in the pipeline swaps which payload is
 * rendered. Each section is optional — a component renders only when its slice
 * is present — so gates can differ (Gate 1 has no AI/KPI sections, Gate 2 does).
 *
 * Static UI text (button/tab/section names, column & field labels, chart
 * captions, link text, status vocabulary) comes from `LABELS` — see
 * `constants/labels.js`. Only dynamic, data-bound values live inline here.
 *
 * When real APIs are ready, replace this object with the fetched payload (same
 * shape). No component changes required.
 */
import { LABELS, formatLabel } from '../constants/labels';

export const sampleProject = {
  header: {
    title: 'LA-MX-BODYARMOR ZERO_LAOU',
    subtitle: 'Brazil · Sparkling Flavors · Peter William',
    actions: [
      { id: 'artifacts', label: LABELS.actions.preRead, variant: 'primary', fillStyle: 'fill', icon: 'file' },
      { id: 'pre-read', label: LABELS.actions.preReadSlides, variant: 'secondary', fillStyle: 'outline', icon: 'slideshow' },
      { id: 'need-attention', label: LABELS.actions.needAttention, variant: 'negative', fillStyle: 'fill', icon: 'alertTriangle' },
    ],
  },

  // Modal shown when the "Need Attention" header CTA is clicked.
  needAttention: {
    title: formatLabel(LABELS.templates.itemsNeedAttention, { count: 2 }),
    items: [
      'Margin analysis overdue since June 12 - blocking FIN sign-off',
      'TECH feasibility in review - sign-off pending',
    ],
    primaryAction: { id: 'open-risk-view', label: LABELS.actions.openFullRiskView },
  },

  pipeline: {
    title: LABELS.sections.gatePipeline,
    // The gate whose marker renders as "current" (solid dark), and the view
    // shown on load.
    currentKey: '2',
    gates: [
      { number: 1, label: 'Gate 1', status: 'completed', statusLabel: LABELS.status.completed },
      { number: 2, label: 'Gate 2', status: 'attention', statusLabel: LABELS.status.needAttention },
      { number: 3, label: 'Gate 3', status: 'not-started', statusLabel: LABELS.status.notStarted },
      { number: 4, label: 'Gate 4', status: 'not-started', statusLabel: LABELS.status.notStarted },
      { number: 5, label: 'Gate 5', status: 'not-started', statusLabel: LABELS.status.notStarted },
    ],
  },

  gateData: {
    /* ------------------------------- GATE 1 ------------------------------- */
    1: {
      keyMetrics: {
        title: LABELS.sections.keyMetrics,
        metrics: [
          { id: 'absolute-volume', value: '1000K UC', label: LABELS.metrics.absoluteVolume, footnote: 'G1 Baseline', visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Absolute volume position in forecast range', data: [7, 14, 17, 21, 26, 31, 36, 41, 46, 51, 47, 42, 37, 32, 25, 21, 17, 14, 12, 9] } },
          { id: 'incremental-volume', value: '80K UC', label: LABELS.metrics.incrementalVolume, footnote: 'G1 Baseline', visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Incremental volume position in forecast range', data: [6, 12, 16, 20, 25, 30, 35, 40, 45, 50, 48, 43, 38, 33, 27, 22, 18, 14, 11, 8] } },
          { id: 'gp-margin', value: '36.0%', label: LABELS.metrics.gpMargin, trend: { tone: 'positive', label: LABELS.status.accretive, delta: '+1 pp', direction: 'up' }, visual: { kind: 'comparison', bars: [{ id: 'actual', label: LABELS.chart.actual, value: '36%', pct: 36, highlight: true }, { id: 'benchmark', label: LABELS.chart.benchmark, value: '35.0%', pct: 35 }] } },
          { id: 'capex', value: '$280K', label: LABELS.metrics.capex, footnote: 'Under $500K threshold', visual: { kind: 'meter', label: '$280K / $500K', percent: 56, tone: 'positive' } },
        ],
      },

      gateDetail: {
        title: 'Gate 1 - Concept approval',
        target: formatLabel(LABELS.templates.target, { date: 'Mar 12, 2026' }),
        liveStatus: { ariaLabel: 'Live status', selectedKey: 'two-changes', options: [{ id: 'two-changes', label: formatLabel(LABELS.templates.liveStatusChanges, { count: 2 }) }, { id: 'all-changes', label: 'All changes' }, { id: 'no-changes', label: 'No changes' }] },
        approval: { tone: 'positive', title: 'Approved Unanimously', detail: 'Closed in 6 days - faster than the 9-day LAOU average · no conditions attached', linkLabel: LABELS.actions.viewApprovalTrail, linkHref: '#approval-trail' },
        stage: { label: formatLabel(LABELS.templates.stage, { name: 'Stage 1' }), text: 'Strategy to Idea → Advanced to Stage 2 on approval', tone: 'positive', statusLabel: LABELS.status.completed, approvedOn: formatLabel(LABELS.templates.approvedOn, { date: 'March 12, 2026' }) },
        tags: [
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.ou, value: 'Latin America' }),
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.category, value: 'Advanced Hydration' }),
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.lead, value: 'Peter William' }),
        ],
        pmoComments: { label: LABELS.fields.pmoComments, value: '', emptyText: LABELS.messages.emptyPmo },
      },

      ioFields: {
        title: 'IO Submitted Fields - Business Case',
        workfrontUrl: '#',
        workfrontLabel: LABELS.actions.openInWorkfront,
        fields: [
          { id: 'summary', type: 'textarea', label: LABELS.fields.businessCaseSummary, value: "Flashlyte Zero platform extension into Mexico. Fills a gap in BODYARMOR's zero-sugar hydration lin…", isReadOnly: true },
          { id: 'target-consumer', type: 'text', label: LABELS.fields.targetConsumer, value: 'Active, health-conscious 18-34, post-workout hydration', isReadOnly: true },
          { id: 'innovation-driver', type: 'text', label: LABELS.fields.innovationDriver, value: 'Line extension - flavor/format variant', isReadOnly: true },
        ],
        locked: true,
        lockedTitle: LABELS.messages.lockedTitle,
        lockedMessage: LABELS.messages.lockedGate1,
      },

      approval: {
        title: LABELS.sections.approvalTrail,
        summary: formatLabel(LABELS.templates.countApproved, { completed: 5, total: 5 }),
        status: { tone: 'positive', label: LABELS.status.approved },
        columns: [
          { id: 'name', label: LABELS.columns.name, isRowHeader: true },
          { id: 'department', label: LABELS.columns.department },
          { id: 'date', label: LABELS.columns.date },
          { id: 'status', label: LABELS.columns.status },
        ],
        approvers: [
          { id: 'eva', name: 'Eva', department: 'MKT', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
          { id: 'steven', name: 'Steven', department: 'Tech', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
          { id: 'michael', name: 'Michael', department: 'FIN', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
          { id: 'sara', name: 'Sara', department: 'PMO', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
          { id: 'karina', name: 'Karina', department: 'Regulatory', date: 'Apr 13th', status: { tone: 'positive', label: LABELS.status.approved } },
        ],
      },

      gateReadiness: {
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
      },
    },

    /* ------------------------------- GATE 2 ------------------------------- */
    2: {
      keyMetrics: {
        title: LABELS.sections.keyMetrics,
        metrics: [
          { id: 'absolute-volume', value: '920K UC', label: LABELS.metrics.absoluteVolume, badge: { tone: 'negative', label: '-8% ▼ vs G1' }, visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Absolute volume position in forecast range', data: [8, 13, 18, 22, 27, 32, 37, 42, 47, 51, 46, 41, 36, 31, 26, 21, 16, 13, 10, 7] } },
          { id: 'incremental-volume', value: '72K UC', label: LABELS.metrics.incrementalVolume, badge: { tone: 'negative', label: '-10% ▼ vs G1' }, visual: { kind: 'bars', caption: LABELS.chart.positionInForecastRange, ariaLabel: 'Incremental volume position in forecast range', data: [6, 11, 16, 21, 26, 31, 37, 42, 47, 51, 47, 42, 37, 31, 26, 20, 16, 12, 9, 6] } },
          { id: 'gp-margin', value: '33%', label: LABELS.metrics.gpMargin, trend: { tone: 'negative', label: LABELS.status.dilutive, delta: '-3 pp', direction: 'down' }, visual: { kind: 'comparison', bars: [{ id: 'actual', label: LABELS.chart.actual, value: '33%', pct: 33, highlight: true }, { id: 'benchmark', label: LABELS.chart.benchmark, value: '35.0%', pct: 35 }] } },
          { id: 'capex', value: '$380K', label: LABELS.metrics.capex, footnote: 'Under $500K threshold', visual: { kind: 'meter', label: '$320K / $500K', percent: 76, tone: 'positive' } },
        ],
      },

      gateDetail: {
        title: 'Gate 2 - Decision to develop',
        target: formatLabel(LABELS.templates.target, { date: 'Dec 1, 2026' }),
        liveStatus: { ariaLabel: 'Live status', selectedKey: 'two-changes', options: [{ id: 'two-changes', label: formatLabel(LABELS.templates.liveStatusChanges, { count: 2 }) }, { id: 'all-changes', label: 'All changes' }, { id: 'no-changes', label: 'No changes' }] },
        stage: { label: formatLabel(LABELS.templates.stage, { name: 'Stage 1' }), text: 'Strategy to Idea → Will advance to Stage 2 on approval · Review was June 20' },
        tags: [
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.ou, value: 'Latin America' }),
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.category, value: 'Sparkling Flavors' }),
          formatLabel(LABELS.templates.tag, { label: LABELS.tags.lead, value: 'Peter William' }),
        ],
        pmoComments: { label: LABELS.fields.pmoComments, value: 'Launch via Flashlyte Zero chassis. No CAPEX required. Conditional on margin analysis - Sara Estrada Olvera to confirm GP margin vs benchmark within 5 business days of gate.' },
      },

      aiRecommendation: {
        title: LABELS.sections.aiRecommendation,
        askLabel: LABELS.actions.askAiRecommendation,
        alert: { tone: 'negative', title: 'Hold Recommended', detail: '2 items must be resolved before Gate 2 can move forward. Margin analysis is overdue and TECH has not signed off - a conditional GO at this stage carries meaningful financial risk.' },
        factors: [
          { id: 'cogs', tone: 'negative', icon: 'close', label: 'COGS missing - FIN sign-off blocked' },
          { id: 'tech', tone: 'notice', icon: 'preview', label: 'TECH feasibility in review - sign-off pending' },
          { id: 'dvf', tone: 'positive', icon: 'checkmark', label: 'DVF 7.2 is above LAOU Gate 2 average (6.9)' },
        ],
        freshness: { text: 'Updated before the last deliverable change', linkLabel: LABELS.actions.getFreshLook, linkHref: '#' },
        actions: [
          { id: 'draft-hold', label: LABELS.actions.draftHoldRationale, variant: 'primary', fillStyle: 'fill' },
          { id: 'log-go', label: LABELS.actions.logConditionalGo, variant: 'secondary', fillStyle: 'outline' },
        ],
      },

      beyondSummary: {
        title: LABELS.sections.beyondSummary,
        description: 'Traces each AI recommendation down to the specific number behind it - Recommendation → Reason → Impact → Gate decision — instead of showing unrelated context.',
        selectedTab: 'commercial',
        tabs: [
          {
            id: 'commercial',
            label: 'Commercial',
            sectionTitle: 'Product Lineup',
            fields: [
              { id: 'lineup', label: 'PRODUCT LINEUP', value: 'Coca-Cola Zero Sugar Cherry, 350ml can - single SKU at launch' },
              { id: 'packaging', label: 'PACKAGING', value: 'Existing 350ml can line, new Cherry-red artwork' },
              { id: 'rollout', label: 'MARKET ROLLOUT', value: 'Mexico national, phased Q1-Q2 2027' },
              { id: 'activation', label: 'ACTIVATION PLAN', value: 'Sampling + retail displays, Q1 2027' },
              { id: 'retail-price', label: 'RETAIL PRICE CONFIRMATION', value: 'Pending final confirmation', tone: 'notice' },
            ],
            note: { title: 'Why this connects to financial', text: "Margin analysis can't be finalized until retail price is confirmed - this is the commercial dependency behind the missing margin analysis flagged on the Financial tab." },
          },
          { id: 'technical', label: 'Technical', sectionTitle: 'Technical Feasibility', fields: [{ id: 'tech-status', label: 'FEASIBILITY', value: 'In review - sign-off pending' }] },
          { id: 'planning', label: 'Planning', sectionTitle: 'Planning', fields: [{ id: 'timeline', label: 'TIMELINE', value: 'Phased Q1-Q2 2027' }] },
          { id: 'financial', label: 'Financial', sectionTitle: 'Financial', fields: [{ id: 'margin', label: 'MARGIN ANALYSIS', value: 'Overdue - blocked on retail price confirmation', tone: 'notice' }] },
        ],
      },

      ioFields: {
        title: 'IO Required Fields - Margin Guidance & Desired Claims',
        workfrontUrl: '#',
        workfrontLabel: LABELS.actions.openInWorkfront,
        fields: [
          { id: 'margin-guidance', type: 'textarea', label: 'Margin guidance', required: true, placeholder: 'Enter GP margin guidance, e.g. estimated margin range vs benchmark and key cost drivers…' },
          { id: 'desired-claims', type: 'textarea', label: 'Desired Claims', required: true, placeholder: 'eg. Zero sugar, functional hydration, electrolyte-enhanced…' },
          { id: 'margin-threshold', type: 'select', label: 'Margin threshold', placeholder: 'Select', options: [{ id: 'below', label: 'Below benchmark' }, { id: 'at', label: 'At benchmark' }, { id: 'above', label: 'Above benchmark' }] },
          { id: 'target-date', type: 'date', label: 'Target-in-market date', required: true },
        ],
        locked: false,
      },

      keyKpis: {
        title: LABELS.sections.keyKpis,
        subtitle: 'Latin America Sparkling Flavors E · Coca-Cola Zero Sugar Cherry',
        items: [
          { id: 'trial-rate', name: 'Trial rate (first 90 days)', detail: '15% target → actual not yet reported', status: { tone: 'notice', label: LABELS.status.pending } },
          { id: 'distribution', name: 'Distribution points', detail: '12,000 stores target → actual 8,400 stores', status: { tone: 'positive', label: LABELS.status.tracking } },
          { id: 'awareness', name: 'Unaided brand awareness lift', detail: '+4 pts target → actual not yet reported', status: { tone: 'notice', label: LABELS.status.pending } },
        ],
        footnote: "KPIs are defined in Workfront Planning, not authored in this app - this list updates automatically as fields are added or connected. 'Tracking' only means an actual value has been reported, not whether it's favorable; target-direction (higher-is/lower-is-better) isn't part of the data model, so this view doesn't auto-judge performance. The same target/actual structure carries into post-launch tracking once a project passes Gate 5.",
      },

      approval: {
        title: LABELS.sections.approval,
        summary: formatLabel(LABELS.templates.countApproved, { completed: 5, total: 5 }),
        headerAction: { id: 'configure-approvers', label: LABELS.actions.configureApprovers, icon: 'settings', variant: 'primary', fillStyle: 'fill' },
        columns: [
          { id: 'name', label: LABELS.columns.name, isRowHeader: true },
          { id: 'department', label: LABELS.columns.department },
          { id: 'status', label: LABELS.columns.status },
        ],
        approvers: [
          { id: 'elena', name: 'Elena Vasquez', department: 'MKT', statuses: [{ tone: 'positive', label: LABELS.status.approved }, { tone: 'neutral', label: LABELS.status.reOpen }] },
          { id: 'steven', name: 'Steven', department: 'Tech', statuses: [{ tone: 'notice', label: LABELS.status.pending }, { tone: 'positive', label: LABELS.status.approved }, { tone: 'negative', label: LABELS.status.needsWork }] },
          { id: 'michael', name: 'Michael', department: 'FIN', statuses: [{ tone: 'notice', label: LABELS.status.pending }, { tone: 'positive', label: LABELS.status.approved }, { tone: 'negative', label: LABELS.status.needsWork }] },
          { id: 'sara', name: 'Sara', department: 'PMO', statuses: [{ tone: 'notice', label: LABELS.status.pending }, { tone: 'positive', label: LABELS.status.approved }, { tone: 'negative', label: LABELS.status.needsWork }] },
          { id: 'karina', name: 'Karina', department: 'Regulatory', statuses: [{ tone: 'notice', label: LABELS.status.pending }, { tone: 'positive', label: LABELS.status.approved }, { tone: 'negative', label: LABELS.status.needsWork }] },
        ],
      },

      gateReadiness: {
        title: LABELS.sections.gateReadiness,
        completed: 2,
        total: 7,
        items: [
          { id: 'concept', label: 'Consumer concept completed', tone: 'positive' },
          { id: 'consumer-testing', label: 'Consumer testing completed', tone: 'positive' },
          { id: 'product-testing', label: 'Product testing completed', tone: 'positive' },
          { id: 'formula', label: 'Formula finalized', tone: 'positive' },
          { id: 'commercial', label: 'Commercial execution plan completed', tone: 'positive' },
          { id: 'launch-targets', label: 'Launch targets submitted', tone: 'notice' },
          { id: 'capacity', label: 'Capacity readiness confirmed', tone: 'neutral' },
        ],
        legend: [
          { id: 'approved', tone: 'positive', label: LABELS.status.approved },
          { id: 'in-review', tone: 'informative', label: LABELS.status.inReview },
          { id: 'missing', tone: 'notice', label: LABELS.status.missingOverdue },
          { id: 'not-started', tone: 'neutral', label: LABELS.status.notStarted },
        ],
      },
    },
  },
};

export default sampleProject;
