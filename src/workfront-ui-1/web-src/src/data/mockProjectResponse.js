/*
 * <license header>
 */

/**
 * Mock Workfront project response — the shape returned by the `get-project`
 * action (project DE fields + a distilled, detail-enriched `gates` list). This
 * is the raw payload the mapper (`mapWorkfrontProject`) consumes, so the local
 * fallback exercises the real mapping pipeline with realistic data.
 *
 * Swap these values freely; no component changes are needed.
 */
export const mockProjectResponse = {
  'DE:Absolute Volume Calendar Year 1': 199997,
  'DE:CAPEX Budget': null,
  'DE:Global Category': 'Hydration, Sports & Tea',
  'DE:Incremental Volume Calendar Year 1': 79998.8,
  'DE:Initiative Description':
    'Fuze launched in Canada late 2024 and has performed extremely well. To serve our consumers with sugar free option, Costco has requested to launch Fuze Zero 24pk',
  'DE:Innovation Driver': 'Customer Driven',
  'DE:KO Gross Profit Margin': '72.92',
  'DE:Leading Market': null,
  'DE:MS_Brand': null,
  'DE:Operating Unit': 'North America',
  'DE:Primary Package Type': null,
  'DE:Secondary Package Type': 'Pack / New Case Configuration',
  'DE:Target In-Market Date': '2026-08-24',
  'DE:markets_selected': 'Canada',
  ID: '695c0f0b00edeb637535248a4b99a37c',
  name: 'Fuze Tea Zero Sugar-KO_Made of fusion_INV_Launch of Fuze Zero 24pk at Costco_NAOU',
  objCode: 'PROJ',
  owner: { ID: '692887d100ced84ae72e77c5c9b425c0', name: 'Zahra Ladak', objCode: 'USER' },
  gates: [
    {
      actualCompletionDate: '2026-01-28T14:59:14:621-0500',
      assignedToID: null,
      completed: true,
      fetched: true,
      id: '695c0f0c00edf116d48d59fbb4200ca9',
      name: 'Gate 1 - Pipeline Prioritization & Approval',
      number: 1,
      parentName: 'Stage 1: Strategy to Idea',
      plannedCompletionDate: '2026-01-13T17:00:00:000-0500',
      pmoComments: null,
      status: 'CPL',
    },
    {
      actualCompletionDate: '2026-02-26T13:40:52:840-0500',
      assignedToID: null,
      completed: true,
      fetched: true,
      id: '697a6a9e000fc8d68b797983f2373d80',
      name: 'Gate 2 - Decision to Develop Solutions',
      number: 2,
      parentName: 'Stage 2: Develop Concept & Business Case',
      plannedCompletionDate: '2026-02-25T15:51:00:000-0500',
      pmoComments: null,
      status: 'CPL',
    },
    {
      actualCompletionDate: '2026-05-20T10:24:58:054-0400',
      assignedToID: null,
      completed: true,
      fetched: true,
      id: '697a6a9e000fc94cbb3d34ddbac3fab5',
      name: 'Gate 3 - Decision to Launch',
      number: 3,
      parentName: 'Stage 3: Solution Development',
      plannedCompletionDate: '2026-05-19T15:57:00:000-0400',
      pmoComments: null,
      status: 'CPL',
    },
    {
      actualCompletionDate: '2026-05-20T10:50:33:840-0400',
      assignedToID: null,
      completed: true,
      fetched: true,
      id: '697a6a9e000fc9e2cca52f6ef39edb1f',
      name: 'Gate 4 - Decision to Produce',
      number: 4,
      parentName: 'Stage 4: Launch Preparation',
      plannedCompletionDate: '2026-05-19T15:57:00:000-0400',
      pmoComments: null,
      status: 'CPL',
    },
    {
      actualCompletionDate: null,
      assignedToID: null,
      completed: false,
      fetched: true,
      id: '697a6a9f000fca554ae266eef7d99c3c',
      name: 'Gate 5 - PLR & Recommendations to Scale',
      number: 5,
      parentName: 'Stage 5: Market Execution',
      plannedCompletionDate: '2027-01-19T17:00:00:000-0500',
      pmoComments: null,
      status: 'NEW',
    },
  ],
};

export default mockProjectResponse;
