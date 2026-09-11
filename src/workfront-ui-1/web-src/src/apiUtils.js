const PROJECT_FIELDS = [
  "name",
  "owner:name",
  "DE:MS_Brand",
  "DE:CAPEX Budget",
  "DE:Operating Unit",
  "DE:Leading Market",
  "DE:Global Category",
  "DE:Global Category",
  "DE:markets_selected",
  "DE:Innovation Driver",
  "DE:Primary Package Type",
  "DE:Target In-Market Date",
  "DE:KO Gross Profit Margin",
  "DE:Initiative Description",
  "DE:Secondary Package Type",
  "DE:Absolute Volume Calendar Year 1",
  "DE:Incremental Volume Calendar Year 1",
];

const TASK_FIELDS = [
  "name",
  "status",
  "condition",
  "parent:name",
  "assignedToID",
  "DE:PMO Comments",
  "actualCompletionDate",
  "plannedCompletionDate",
];

const EXPECTED_VALIDATION_RESPONSE = [
  {
    field: "string",
    value: "<actual value extracted WF/DOC>",
    page: 0,
    evidence: "string",
    confidence: 0.0,
    source: "WF/DOC",
  },
];
