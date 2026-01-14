// Demo Walkthrough Content
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5 - Scripted demo walkthrough for stakeholder presentations

import type { WalkthroughStep, WalkthroughContent } from './types';

/**
 * Demo Walkthrough Steps
 * Requirements: 8.4 - Cover Executive Dashboard KPIs, Fleet Health Score, Alerts Panel,
 *               Fleet Availability, AOG Analytics, Budget Variance, and Export functionality
 */
export const walkthroughSteps: WalkthroughStep[] = [
  // ==========================================================================
  // Step 1: Executive Dashboard Overview
  // ==========================================================================
  {
    id: 'walkthrough-dashboard-overview',
    stepNumber: 1,
    pageToVisit: 'Executive Dashboard',
    pageRoute: '/',
    featuresToHighlight: [
      'Fleet Health Score gauge (0-100)',
      'Four primary KPI cards',
      'Alerts Panel with priority indicators',
      'Status Summary Bar showing fleet distribution',
    ],
    talkingPoints: [
      'Welcome to the Alpha Star Aviation KPIs Dashboard - your single source of truth for fleet operations.',
      'The Fleet Health Score provides an at-a-glance view of overall fleet status, combining availability, AOG impact, budget health, and maintenance efficiency.',
      'Green indicates healthy operations (90+), amber suggests areas needing attention (70-89), and red signals critical issues (below 70).',
      'The four KPI cards show Fleet Availability percentage, Total Flight Hours, Total Cycles, and Active AOG count.',
      'Each card includes a trend indicator showing improvement or decline compared to the previous period.',
    ],
    expectedVisualOutput:
      'Dashboard displays Fleet Health Score gauge with current score, four KPI cards with values and trends, ' +
      'Alerts Panel showing any active alerts, and Status Summary Bar with aircraft distribution.',
    estimatedMinutes: 3,
  },

  // ==========================================================================
  // Step 2: Fleet Health Score Deep Dive
  // ==========================================================================
  {
    id: 'walkthrough-health-score',
    stepNumber: 2,
    pageToVisit: 'Executive Dashboard - Health Score',
    pageRoute: '/',
    featuresToHighlight: [
      'Fleet Health Score breakdown',
      'Component weights (Availability 40%, AOG 25%, Budget 20%, Maintenance 15%)',
      'Score interpretation and thresholds',
    ],
    talkingPoints: [
      'The Fleet Health Score is a composite metric designed for executive reporting.',
      'It combines four key factors: Fleet Availability (40% weight), AOG Impact (25%), Budget Health (20%), and Maintenance Efficiency (15%).',
      'This weighting reflects operational priorities - availability is most critical, followed by grounding events.',
      'The score updates in real-time as underlying data changes, providing always-current status.',
      'Clicking on the gauge reveals the component breakdown so you can identify which factor is driving the score.',
    ],
    expectedVisualOutput:
      'Fleet Health Score gauge prominently displayed with numeric score and status color. ' +
      'Hover or click reveals component breakdown showing individual scores for each factor.',
    estimatedMinutes: 2,
  },

  // ==========================================================================
  // Step 3: Alerts Panel Review
  // ==========================================================================
  {
    id: 'walkthrough-alerts',
    stepNumber: 3,
    pageToVisit: 'Executive Dashboard - Alerts',
    pageRoute: '/',
    featuresToHighlight: [
      'Critical alerts (red) - immediate action required',
      'Warning alerts (amber) - attention needed',
      'Info alerts (blue) - awareness items',
      'Alert details and action links',
    ],
    talkingPoints: [
      'The Alerts Panel surfaces issues requiring attention, categorized by priority.',
      'Critical alerts (red) indicate immediate action items like active AOG events or aircraft with availability below 70%.',
      'Warning alerts (amber) highlight items needing attention such as overdue work orders or budget utilization above 90%.',
      'Info alerts (blue) provide awareness of upcoming events like scheduled maintenance within 7 days.',
      'Each alert includes a direct link to the relevant page for immediate action.',
    ],
    expectedVisualOutput:
      'Alerts Panel showing categorized alerts with color-coded priority indicators. ' +
      'Each alert displays a title, description, and action button linking to the relevant module.',
    estimatedMinutes: 2,
  },

  // ==========================================================================
  // Step 4: Fleet Availability Analysis
  // ==========================================================================
  {
    id: 'walkthrough-availability',
    stepNumber: 4,
    pageToVisit: 'Fleet Availability',
    pageRoute: '/availability',
    featuresToHighlight: [
      'Availability percentage by aircraft',
      'FMC/NMC hour breakdown',
      'Availability trend chart',
      'Fleet group filtering',
    ],
    talkingPoints: [
      'The Fleet Availability page provides detailed operational readiness metrics.',
      'Availability is calculated as FMC Hours divided by POS Hours - the percentage of time aircraft are mission-capable.',
      'The breakdown shows Fully Mission Capable hours versus Not Mission Capable hours (scheduled and unscheduled maintenance).',
      'Use the fleet group filter to compare availability across different aircraft types.',
      'The trend chart reveals patterns over time - look for seasonal variations or declining trends that may indicate systemic issues.',
      'Click on any aircraft row to drill down to its individual detail page.',
    ],
    expectedVisualOutput:
      'Availability summary cards showing aggregate FMC%, POS Hours, FMC Hours, NMC-S Hours, NMC-U Hours. ' +
      'Data table listing each aircraft with daily availability. Trend chart showing availability over time.',
    estimatedMinutes: 3,
  },

  // ==========================================================================
  // Step 5: AOG Analytics by Responsibility
  // ==========================================================================
  {
    id: 'walkthrough-aog-analytics',
    stepNumber: 5,
    pageToVisit: 'AOG & Events',
    pageRoute: '/aog-events',
    featuresToHighlight: [
      'Active AOG count and list',
      'Downtime by responsible party chart',
      'Historical AOG events table',
      'Cost attribution',
    ],
    talkingPoints: [
      'AOG (Aircraft On Ground) events are critical incidents that ground aircraft.',
      'This page tracks all AOG events with responsibility attribution - Internal, OEM, Customs, Finance, or Other.',
      'The analytics breakdown shows downtime hours by responsible party, enabling accountability discussions.',
      'Active AOGs appear at the top - these are events without a cleared date that require immediate attention.',
      'Each event records detection time, reason, responsible party, and associated costs (labor, parts, external).',
      'Use this data to identify patterns and negotiate with vendors or address internal process issues.',
    ],
    expectedVisualOutput:
      'Active AOG count prominently displayed. Pie or bar chart showing downtime distribution by responsible party. ' +
      'Data table with all AOG events including duration, costs, and status.',
    estimatedMinutes: 3,
  },

  // ==========================================================================
  // Step 6: Budget Variance Analysis
  // ==========================================================================
  {
    id: 'walkthrough-budget',
    stepNumber: 6,
    pageToVisit: 'Budget & Cost',
    pageRoute: '/budget',
    featuresToHighlight: [
      'Budget vs. Actual comparison',
      'Variance by budget clause',
      'Burn rate projection',
      'Cost efficiency metrics',
    ],
    talkingPoints: [
      'The Budget & Cost page tracks planned budgets against actual expenditures.',
      'We use 18 standard budget clauses covering all operational expenses from Aircraft Lease to Training.',
      'Green variance indicates under-budget spending, red indicates over-budget - immediate attention needed.',
      'The burn rate analysis projects how many months of budget remain based on current spending patterns.',
      'Cost efficiency metrics show cost per flight hour and cost per cycle - key benchmarks for operational efficiency.',
      'Filter by aircraft group to see spending patterns for specific fleet segments.',
    ],
    expectedVisualOutput:
      'Budget summary showing total planned vs. actual with overall variance. ' +
      'Table or chart breaking down variance by budget clause. Burn rate indicator showing projected runway.',
    estimatedMinutes: 3,
  },

  // ==========================================================================
  // Step 7: Export and Reporting
  // ==========================================================================
  {
    id: 'walkthrough-export',
    stepNumber: 7,
    pageToVisit: 'Executive Dashboard - Export',
    pageRoute: '/',
    featuresToHighlight: [
      'PDF export for executive presentations',
      'Excel export for detailed analysis',
      'Filtered data export',
      'Report customization options',
    ],
    talkingPoints: [
      'Every page in the dashboard supports data export for offline analysis and reporting.',
      'The Executive Dashboard offers a PDF export specifically designed for board presentations.',
      'The PDF includes all visible KPIs, charts, and the current date range in a formatted layout.',
      'Excel exports are available on detail pages for deeper analysis - great for pivot tables and custom reporting.',
      'Exports respect your current filters, so you can export data for specific aircraft or date ranges.',
      'This eliminates the need for manual report creation - the dashboard is your single source of truth.',
    ],
    expectedVisualOutput:
      'Export button visible in the page header. Clicking generates a PDF or Excel file download. ' +
      'PDF shows formatted executive summary with KPIs and charts.',
    estimatedMinutes: 2,
  },

  // ==========================================================================
  // Step 8: Data Quality and Freshness
  // ==========================================================================
  {
    id: 'walkthrough-data-quality',
    stepNumber: 8,
    pageToVisit: 'Executive Dashboard',
    pageRoute: '/',
    featuresToHighlight: [
      'Data quality indicator',
      'Last updated timestamp',
      'Data freshness warnings',
      'Health check status',
    ],
    talkingPoints: [
      'Data quality is critical for accurate decision-making.',
      'The Data Quality Indicator shows when data was last updated and flags any freshness concerns.',
      'If data is more than 24 hours old, you will see a warning indicator.',
      'The Help Center includes a Data Readiness tab that shows the status of each data collection.',
      'This ensures you always know the reliability of the metrics you are viewing.',
      'Regular data imports or API integrations keep the dashboard current.',
    ],
    expectedVisualOutput:
      'Data Quality Indicator badge showing last update time. Green indicates fresh data, ' +
      'amber indicates data may be stale, red indicates data quality issues.',
    estimatedMinutes: 1,
  },
];

/**
 * Calculate total estimated time for the walkthrough
 */
const totalEstimatedMinutes = walkthroughSteps.reduce(
  (total, step) => total + step.estimatedMinutes,
  0
);

/**
 * Complete Walkthrough Content export
 * Requirements: 8.1 - Display Demo Walkthrough Script section
 */
export const walkthroughContent: WalkthroughContent = {
  title: 'Alpha Star Aviation Dashboard Demo Walkthrough',
  description:
    'A structured presentation guide for demonstrating the KPIs Dashboard to stakeholders. ' +
    'Follow these steps to showcase key features and capabilities in approximately 20 minutes.',
  totalEstimatedMinutes,
  steps: walkthroughSteps,
};

export default walkthroughContent;
