/*
 * <license header>
 */

/**
 * TEMPORARY mock for the pre-read side panel's DSFV Snapshot + Source, plus
 * the facilitator name used in the "shared with" banner. Business Case
 * Summary and Key Metrics now come from real project DE fields (see
 * `mapWorkfrontProject.js`'s `preReadSummary`) — DSFV has no backend/API
 * source yet, so it stays here until one exists.
 */
import { LABELS } from '../constants/labels';

export const MOCK_PRE_READ_SUMMARY = {
  facilitatorName: 'Sara Estrada Olvera',
  dsfvSnapshot: [
    { label: LABELS.dsfv.desirability, value: 'Concept tested positively with target LDA cohort.' },
    { label: LABELS.dsfv.sellability, value: 'Fits existing Zero Sugar distribution & shelf sets.' },
    { label: LABELS.dsfv.feasibility, value: 'Standard formulation line - no new equipment.' },
    { label: LABELS.dsfv.viability, value: '31% GP margin, payback within 18 months.' },
  ],
  sourceFiles: ['data extraction 14.pdf', 'cherry_brazil_business_case.docx'],
};

export default MOCK_PRE_READ_SUMMARY;
