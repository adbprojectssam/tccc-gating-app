/*
 * <license header>
 */

/**
 * TEMPORARY mock for the field-extraction agent's response. Used by the
 * extract-fields action only when the agent returns an empty field list, so
 * the UI can be exercised before the agent reliably returns data. Remove once
 * the agent is fully live. Shape matches the agent's response:
 * [{ field, value, page, evidence, confidence, source, workfrontValue }].
 * `workfrontValue` is only present when the doc-extracted `value` conflicts
 * with the value currently on the Workfront task.
 *
 * Backend (CommonJS) counterpart of the frontend's mock fixture — kept here
 * rather than imported from web-src, since actions and the browser bundle are
 * separate build targets.
 *
 * 11 fields — 6 valid (confidence >= 0.9), one conflicting with Workfront
 * (capex, despite high confidence — conflicts take priority), two
 * low-confidence (leading_market, gp), and two missing/null (overall_liking, dme).
 */
const MOCK_EXTRACTED_FIELDS = [
  { field: "project_name", value: "Smartwater Glow", page: 1, evidence: "Project: Smartwater Glow.", confidence: 0.98, source: "DOC" },
  { field: "brand", value: "Smartwater", page: 1, evidence: "Brand: Smartwater.", confidence: 0.99, source: "DOC" },
  { field: "category", value: "Enhanced/Functional Water", page: 1, evidence: "Category: Enhanced/Functional Water.", confidence: 0.99, source: "DOC" },
  { field: "leading_market", value: "UK", page: 1, evidence: "Estimated launch date in the UK market: 12 May 2027.", confidence: 0.85, source: "DOC" },
  { field: "launch_date", value: "12 May 2027 (UK market)", page: 1, evidence: "Estimated launch date in the UK market: 12 May 2027.", confidence: 0.96, source: "DOC" },
  { field: "target_audience", value: "health-conscious, beauty-curious adults 25-40, already buying premium water and already investing in skincare.", page: 1, evidence: "Target audience: health-conscious, beauty-curious adults 25-40, already buying premium water and already investing in skincare.", confidence: 0.98, source: "DOC" },
  { field: "proposition", value: "Glow from the source. Nature in your skin, in every sip.", page: 1, evidence: "Idea or line: \"Glow from the source. Nature in your skin, in every sip.\"", confidence: 0.95, source: "DOC" },
  { field: "capex", value: "$500K", page: 3, evidence: "Total CAPEX required: $500K.", confidence: 0.97, source: "DOC", workfrontValue: "$450K" },
  { field: "gp", value: "~62% gross margin — ON TRACK (margin %, not absolute GP).", page: 5, evidence: "Gross margin — ON TRACK: ~62%.", confidence: 0.82, source: "DOC" },
  { field: "overall_liking", value: null, page: null, evidence: null, confidence: 0.0, source: null },
  { field: "dme", value: null, page: null, evidence: null, confidence: 0.0, source: null },
];

module.exports = { MOCK_EXTRACTED_FIELDS };
