/*
 * <license header>
 */

/**
 * TEMPORARY mock for the pre-read side panel's summary content (Business Case
 * Summary, Key Metrics, DSFV Snapshot, Source). None of this is part of the
 * extract-fields response shape, and no backend/API produces it yet — remove
 * this module and wire the panel to a real source once one exists.
 */
import { LABELS } from '../constants/labels';

export const MOCK_PRE_READ_SUMMARY = {
  facilitatorName: 'Sara Estrada Olvera',
  businessCaseSummary:
    'Coca-Cola Zero Sugar Cherry launch targeting the Brazil sparkling flavors portfolio, positioned to extend the Zero Sugar line with incremental volume from younger LDA consumers.',
  keyMetrics: [
    { label: LABELS.metrics.absoluteVolume, value: '64,200 UC' },
    { label: LABELS.metrics.incrementalVolume, value: '18,500 UC' },
    { label: LABELS.metrics.gpMargin, value: '31%' },
    { label: LABELS.metrics.capex, value: '$1.2M' },
    { label: LABELS.metrics.launchMarket, value: 'Brazil (national)' },
  ],
  dsfvSnapshot: [
    { label: LABELS.dsfv.desirability, value: 'Concept tested positively with target LDA cohort.' },
    { label: LABELS.dsfv.sellability, value: 'Fits existing Zero Sugar distribution & shelf sets.' },
    { label: LABELS.dsfv.feasibility, value: 'Standard formulation line - no new equipment.' },
    { label: LABELS.dsfv.viability, value: '31% GP margin, payback within 18 months.' },
  ],
  sourceFiles: ['data extraction 14.pdf', 'cherry_brazil_business_case.docx'],
};

export default MOCK_PRE_READ_SUMMARY;
