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
 * When real APIs are ready, replace this object with the fetched payload (same
 * shape). No component changes required.
 */
export const sampleProject = {
  header: {
    title: 'LA-MX-BODYARMOR ZERO_LAOU',
    subtitle: 'Brazil · Sparkling Flavors · Peter William',
    actions: [
      { id: 'pre-read', label: 'Pre-read', variant: 'primary', fillStyle: 'fill', icon: 'tutorials' },
      { id: 'pre-read-slides', label: 'Pre-read Slides', variant: 'secondary', fillStyle: 'outline', icon: 'slideshow' },
      { id: 'need-attention', label: 'Need Attention', variant: 'negative', fillStyle: 'fill', icon: 'alertTriangle' },
    ],
  },

  // Modal shown when the "Need Attention" header CTA is clicked.
  needAttention: {
    title: '2 Items need attention',
    items: [
      'Margin analysis overdue since June 12 - blocking FIN sign-off',
      'TECH feasibility in review - sign-off pending',
    ],
    primaryAction: { id: 'open-risk-view', label: 'Open full risk view' },
  },

  tabs: [
    {
      id: 'executive-summary',
      label: 'Executive Summary',
      icon: 'file',
      panel: {
        heading: 'Executive Summary',
        paragraph:
          "Coca-Cola Zero Sugar - Cherry is a new flavor extension filling a gap in Coca-Cola Zero Sugar's flavor lineup for Brazil. Currently at Gate 2 - Decision to develop, flagged Needs Attention: margin analysis is overdue and TECH sign-off is pending, so the AI recommends a hold. Volume is tracking ahead of plan (80k UC, +23% vs Gate 1) with a healthy margin profile (34% GP, +3pts vs benchmark). No CapEx required. Next gate target: February 2027.",
      },
    },
    {
      id: 'learning-plan',
      label: 'Learning Plan',
      icon: 'education',
      panel: {
        heading: 'Learning plan - what this gate is testing',
        items: [
          { id: 'trial-rate', text: 'Trial rate (first 90 days) - target 15%, not yet reported' },
          { id: 'distribution', text: 'Distribution ramp -  target 12,000 stores, currently 8,400 and tracking' },
          { id: 'awareness', text: 'Unaided brand awareness lift - target +4pts, not yet reported' },
          { id: 'margin-durability', text: 'Margin durability  - whether 34% GP margin holds once COGS assumptions are finalized' },
        ],
      },
    },
    {
      id: 'risk-view',
      label: 'Risk View',
      icon: 'alertTriangle',
      panel: {
        heading: 'Risk View',
        summary: { strong: '4 open risks', rest: '- 1 high, 3 medium' },
        risks: [
          { id: 'margin', title: 'Margin analysis overdue since June 12 - blocking FIN sign-off', severity: { label: 'High', tone: 'negative' } },
          { id: 'formula', title: 'Formula stability at shelf temperature - mitigation in progress', severity: { label: 'Medium', tone: 'notice' } },
          { id: 'senasica', title: 'SENASICA regulatory label review pending', severity: { label: 'Medium', tone: 'notice' } },
          { id: 'tech', title: 'TECH feasibility still in review', severity: { label: 'Medium', tone: 'notice' } },
        ],
      },
    },
  ],

  pipeline: {
    title: 'Gate Pipeline',
    // The gate whose marker renders as "current" (solid dark), and the view
    // shown on load.
    currentKey: '2',
    gates: [
      { number: 1, label: 'Gate 1', status: 'completed', statusLabel: 'Completed' },
      { number: 2, label: 'Gate 2', status: 'attention', statusLabel: 'Need Attention' },
      { number: 3, label: 'Gate 3', status: 'not-started', statusLabel: 'Not Started' },
      { number: 4, label: 'Gate 4', status: 'not-started', statusLabel: 'Not Started' },
      { number: 5, label: 'Gate 5', status: 'not-started', statusLabel: 'Not Started' },
    ],
  },

  gateData: {
    /* ------------------------------- GATE 1 ------------------------------- */
    1: {
      keyMetrics: {
        title: 'Key Metrics',
        metrics: [
          { id: 'absolute-volume', value: '1000K UC', label: 'Absolute Volume', footnote: 'G1 Baseline', visual: { kind: 'bars', caption: 'Position in forecast range', ariaLabel: 'Absolute volume position in forecast range', data: [7, 14, 17, 21, 26, 31, 36, 41, 46, 51, 47, 42, 37, 32, 25, 21, 17, 14, 12, 9] } },
          { id: 'incremental-volume', value: '80K UC', label: 'Incremental Volume', footnote: 'G1 Baseline', visual: { kind: 'bars', caption: 'Position in forecast range', ariaLabel: 'Incremental volume position in forecast range', data: [6, 12, 16, 20, 25, 30, 35, 40, 45, 50, 48, 43, 38, 33, 27, 22, 18, 14, 11, 8] } },
          { id: 'gp-margin', value: '36.0%', label: 'GP Margin', trend: { tone: 'positive', label: 'Accretive', delta: '+1 pp', direction: 'up' }, visual: { kind: 'comparison', bars: [{ id: 'actual', label: 'Actual', value: '36%', pct: 36, highlight: true }, { id: 'benchmark', label: 'Benchmark', value: '35.0%', pct: 35 }] } },
          { id: 'capex', value: '$280K', label: 'CAPEX', footnote: 'Under $500K threshold', visual: { kind: 'meter', label: '$280K / $500K', percent: 56, tone: 'positive' } },
        ],
      },

      gateDetail: {
        title: 'Gate 1 - Concept approval',
        target: 'Target Mar 12, 2026',
        liveStatus: { ariaLabel: 'Live status', selectedKey: 'two-changes', options: [{ id: 'two-changes', label: 'Live Status : 2 Changes' }, { id: 'all-changes', label: 'All changes' }, { id: 'no-changes', label: 'No changes' }] },
        approval: { tone: 'positive', title: 'Approved Unanimously', detail: 'Closed in 6 days - faster than the 9-day LAOU average · no conditions attached', linkLabel: 'View approval trail', linkHref: '#approval-trail' },
        stage: { label: 'Stage: Stage 1 -', text: 'Strategy to Idea → Advanced to Stage 2 on approval', tone: 'positive', statusLabel: 'Completed', approvedOn: 'Approved March 12, 2026' },
        tags: ['OU: Latin America', 'Category: Advanced Hydration', 'Lead: Peter William'],
        pmoComments: { label: 'PMO Comments', value: '', emptyText: 'Not yet written for this gate' },
      },

      ioFields: {
        title: 'IO Submitted Fields - Business Case',
        workfrontUrl: '#',
        workfrontLabel: 'Open in Workfront ↗',
        fields: [
          { id: 'summary', type: 'textarea', label: 'Business Case Summary', value: "Flashlyte Zero platform extension into Mexico. Fills a gap in BODYARMOR's zero-sugar hydration lin…", isReadOnly: true },
          { id: 'target-consumer', type: 'text', label: 'Target Consumer / Occasion', value: 'Active, health-conscious 18-34, post-workout hydration', isReadOnly: true },
          { id: 'innovation-driver', type: 'text', label: 'Innovation Driver / Typology', value: 'Line extension - flavor/format variant', isReadOnly: true },
        ],
        locked: true,
        lockedTitle: 'Locked',
        lockedMessage: 'Gate 1 approved. Values are read-only; edit in Workfront if a correction is needed.',
      },

      approval: {
        title: 'Approval Trail',
        summary: '5 of 5 Approved',
        status: { tone: 'positive', label: 'Approved' },
        columns: [
          { id: 'name', label: 'Name', isRowHeader: true },
          { id: 'department', label: 'Department' },
          { id: 'date', label: 'Date' },
          { id: 'status', label: 'Status' },
        ],
        approvers: [
          { id: 'eva', name: 'Eva', department: 'MKT', date: 'Apr 13th', status: { tone: 'positive', label: 'Approved' } },
          { id: 'steven', name: 'Steven', department: 'Tech', date: 'Apr 13th', status: { tone: 'positive', label: 'Approved' } },
          { id: 'michael', name: 'Michael', department: 'FIN', date: 'Apr 13th', status: { tone: 'positive', label: 'Approved' } },
          { id: 'sara', name: 'Sara', department: 'PMO', date: 'Apr 13th', status: { tone: 'positive', label: 'Approved' } },
          { id: 'karina', name: 'Karina', department: 'Regulatory', date: 'Apr 13th', status: { tone: 'positive', label: 'Approved' } },
        ],
      },

      gateReadiness: {
        title: 'Gate Readiness',
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
        title: 'Key Metrics',
        metrics: [
          { id: 'absolute-volume', value: '920K UC', label: 'Absolute Volume', badge: { tone: 'negative', label: '-8% ▼ vs G1' }, visual: { kind: 'bars', caption: 'Position in forecast range', ariaLabel: 'Absolute volume position in forecast range', data: [8, 13, 18, 22, 27, 32, 37, 42, 47, 51, 46, 41, 36, 31, 26, 21, 16, 13, 10, 7] } },
          { id: 'incremental-volume', value: '72K UC', label: 'Incremental Volume', badge: { tone: 'negative', label: '-10% ▼ vs G1' }, visual: { kind: 'bars', caption: 'Position in forecast range', ariaLabel: 'Incremental volume position in forecast range', data: [6, 11, 16, 21, 26, 31, 37, 42, 47, 51, 47, 42, 37, 31, 26, 20, 16, 12, 9, 6] } },
          { id: 'gp-margin', value: '33%', label: 'GP Margin', trend: { tone: 'negative', label: 'Dilutive', delta: '-3 pp', direction: 'down' }, visual: { kind: 'comparison', bars: [{ id: 'actual', label: 'Actual', value: '33%', pct: 33, highlight: true }, { id: 'benchmark', label: 'Benchmark', value: '35.0%', pct: 35 }] } },
          { id: 'capex', value: '$380K', label: 'CAPEX', footnote: 'Under $500K threshold', visual: { kind: 'meter', label: '$320K / $500K', percent: 76, tone: 'positive' } },
        ],
      },

      gateDetail: {
        title: 'Gate 2 - Decision to develop',
        target: 'Target Dec 1, 2026',
        liveStatus: { ariaLabel: 'Live status', selectedKey: 'two-changes', options: [{ id: 'two-changes', label: 'Live Status : 2 Changes' }, { id: 'all-changes', label: 'All changes' }, { id: 'no-changes', label: 'No changes' }] },
        stage: { label: 'Stage: Stage 1 -', text: 'Strategy to Idea → Will advance to Stage 2 on approval · Review was June 20' },
        tags: ['OU: Latin America', 'Category: Sparkling Flavors', 'Lead: Peter William'],
        pmoComments: { label: 'PMO Comments', value: 'Launch via Flashlyte Zero chassis. No CAPEX required. Conditional on margin analysis - Sara Estrada Olvera to confirm GP margin vs benchmark within 5 business days of gate.' },
      },

      aiRecommendation: {
        title: 'AI Recommendation',
        askLabel: 'Ask AI Recommendation',
        alert: { tone: 'negative', title: 'Hold Recommended', detail: '2 items must be resolved before Gate 2 can move forward. Margin analysis is overdue and TECH has not signed off - a conditional GO at this stage carries meaningful financial risk.' },
        factors: [
          { id: 'cogs', tone: 'negative', icon: 'close', label: 'COGS missing - FIN sign-off blocked' },
          { id: 'tech', tone: 'notice', icon: 'preview', label: 'TECH feasibility in review - sign-off pending' },
          { id: 'dvf', tone: 'positive', icon: 'checkmark', label: 'DVF 7.2 is above LAOU Gate 2 average (6.9)' },
        ],
        freshness: { text: 'Updated before the last deliverable change', linkLabel: 'Get a fresh look', linkHref: '#' },
        actions: [
          { id: 'draft-hold', label: 'Draft hold rationale', variant: 'primary', fillStyle: 'fill' },
          { id: 'log-go', label: 'Log conditional GO', variant: 'secondary', fillStyle: 'outline' },
        ],
      },

      beyondSummary: {
        title: 'Beyond the Summary',
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
        workfrontLabel: 'Open in Workfront ↗',
        fields: [
          { id: 'margin-guidance', type: 'textarea', label: 'Margin guidance', required: true, placeholder: 'Enter GP margin guidance, e.g. estimated margin range vs benchmark and key cost drivers…' },
          { id: 'desired-claims', type: 'textarea', label: 'Desired Claims', required: true, placeholder: 'eg. Zero sugar, functional hydration, electrolyte-enhanced…' },
          { id: 'margin-threshold', type: 'select', label: 'Margin threshold', placeholder: 'Select', options: [{ id: 'below', label: 'Below benchmark' }, { id: 'at', label: 'At benchmark' }, { id: 'above', label: 'Above benchmark' }] },
          { id: 'target-date', type: 'date', label: 'Target-in-market date', required: true },
        ],
        locked: false,
      },

      keyKpis: {
        title: 'Key KPIs',
        subtitle: 'Latin America Sparkling Flavors E · Coca-Cola Zero Sugar Cherry',
        items: [
          { id: 'trial-rate', name: 'Trial rate (first 90 days)', detail: '15% target → actual not yet reported', status: { tone: 'notice', label: 'Pending' } },
          { id: 'distribution', name: 'Distribution points', detail: '12,000 stores target → actual 8,400 stores', status: { tone: 'positive', label: 'Tracking' } },
          { id: 'awareness', name: 'Unaided brand awareness lift', detail: '+4 pts target → actual not yet reported', status: { tone: 'notice', label: 'Pending' } },
        ],
        footnote: "KPIs are defined in Workfront Planning, not authored in this app - this list updates automatically as fields are added or connected. 'Tracking' only means an actual value has been reported, not whether it's favorable; target-direction (higher-is/lower-is-better) isn't part of the data model, so this view doesn't auto-judge performance. The same target/actual structure carries into post-launch tracking once a project passes Gate 5.",
      },

      approval: {
        title: 'Approval',
        summary: '5 of 5 Approved',
        headerAction: { id: 'configure-approvers', label: 'Configure Approvers', icon: 'settings', variant: 'primary', fillStyle: 'fill' },
        columns: [
          { id: 'name', label: 'Name', isRowHeader: true },
          { id: 'department', label: 'Department' },
          { id: 'status', label: 'Status' },
        ],
        approvers: [
          { id: 'elena', name: 'Elena Vasquez', department: 'MKT', statuses: [{ tone: 'positive', label: 'Approved' }, { tone: 'neutral', label: 'Re-Open' }] },
          { id: 'steven', name: 'Steven', department: 'Tech', statuses: [{ tone: 'notice', label: 'Pending' }, { tone: 'positive', label: 'Approved' }, { tone: 'negative', label: 'Needs Work' }] },
          { id: 'michael', name: 'Michael', department: 'FIN', statuses: [{ tone: 'notice', label: 'Pending' }, { tone: 'positive', label: 'Approved' }, { tone: 'negative', label: 'Needs Work' }] },
          { id: 'sara', name: 'Sara', department: 'PMO', statuses: [{ tone: 'notice', label: 'Pending' }, { tone: 'positive', label: 'Approved' }, { tone: 'negative', label: 'Needs Work' }] },
          { id: 'karina', name: 'Karina', department: 'Regulatory', statuses: [{ tone: 'notice', label: 'Pending' }, { tone: 'positive', label: 'Approved' }, { tone: 'negative', label: 'Needs Work' }] },
        ],
      },

      gateReadiness: {
        title: 'Gate Readiness',
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
          { id: 'approved', tone: 'positive', label: 'Approved' },
          { id: 'in-review', tone: 'informative', label: 'In Review' },
          { id: 'missing', tone: 'notice', label: 'Missing-overdue' },
          { id: 'not-started', tone: 'neutral', label: 'Not Started' },
        ],
      },
    },
  },
};

export default sampleProject;
