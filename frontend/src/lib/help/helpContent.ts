// Quick Start Content
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5 - Quick Start guide with numbered steps and callouts

import {
  LogIn,
  Calendar,
  Filter,
  BarChart3,
  MousePointerClick,
  Download,
} from 'lucide-react';
import type { QuickStartStep, QuickStartCallout, QuickStartContent } from './types';

/**
 * Quick Start onboarding steps
 * Requirements: 2.1 - Display numbered step-by-step onboarding flow with at least 6 steps
 * Requirements: 2.5 - Cover Login, Date Range Selection, Fleet/Aircraft Filtering, 
 *               KPI Interpretation, Drill-down Navigation, and Export functionality
 */
export const quickStartSteps: QuickStartStep[] = [
  {
    id: 'step-login',
    stepNumber: 1,
    title: 'Login to the Dashboard',
    description:
      'Access the Alpha Star Aviation KPIs Dashboard using your credentials. ' +
      'Enter your email address and password on the login page. ' +
      'Your role (Admin, Editor, or Viewer) determines what actions you can perform.',
    expectedOutcome:
      'You will be redirected to the Executive Dashboard showing fleet-wide KPIs and health metrics.',
    icon: LogIn,
    navigationLink: '/login',
    navigationLabel: 'Go to Login',
  },
  {
    id: 'step-date-range',
    stepNumber: 2,
    title: 'Select Your Date Range',
    description:
      'Use the date range picker in the top filter bar to select the time period for analysis. ' +
      'You can choose preset ranges (Today, Last 7 Days, Last 30 Days, This Month, This Year) ' +
      'or select custom start and end dates. All KPIs and charts will update to reflect your selection.',
    expectedOutcome:
      'Dashboard metrics, charts, and tables will refresh to show data for your selected date range.',
    icon: Calendar,
    navigationLink: '/',
    navigationLabel: 'Go to Dashboard',
  },
  {
    id: 'step-filtering',
    stepNumber: 3,
    title: 'Filter by Fleet or Aircraft',
    description:
      'Narrow down your view using the fleet group and aircraft filters. ' +
      'Select a specific fleet group (A330, A340, G650ER, etc.) to see metrics for that category, ' +
      'or choose an individual aircraft by registration number for detailed analysis. ' +
      'Filters persist across page navigation.',
    expectedOutcome:
      'All pages will display data filtered to your selected fleet group or aircraft.',
    icon: Filter,
    navigationLink: '/availability',
    navigationLabel: 'Go to Availability',
  },
  {
    id: 'step-kpi-interpretation',
    stepNumber: 4,
    title: 'Interpret Key Performance Indicators',
    description:
      'The Executive Dashboard displays four primary KPIs: Fleet Availability (%), ' +
      'Total Flight Hours, Total Cycles, and Active AOG Count. ' +
      'The Fleet Health Score (0-100) combines these metrics into a single actionable number. ' +
      'Green indicates healthy status, amber means caution, and red signals issues requiring attention.',
    expectedOutcome:
      'You will understand the current operational status of your fleet at a glance.',
    icon: BarChart3,
    navigationLink: '/',
    navigationLabel: 'View KPIs',
  },

  {
    id: 'step-drill-down',
    stepNumber: 5,
    title: 'Navigate to Detailed Views',
    description:
      'Click on KPI cards, chart elements, or table rows to drill down into detailed information. ' +
      'From the Dashboard, click on an aircraft in the Fleet Comparison section to view its detail page. ' +
      'Use the sidebar navigation to access specialized modules like Maintenance Tasks, ' +
      'Work Orders, AOG Events, and Budget tracking.',
    expectedOutcome:
      'You will access detailed views with granular data for specific aircraft or metrics.',
    icon: MousePointerClick,
    navigationLink: '/availability',
    navigationLabel: 'Explore Fleet',
  },
  {
    id: 'step-export',
    stepNumber: 6,
    title: 'Export Reports and Data',
    description:
      'Use the Export button available on most pages to download data in Excel format. ' +
      'The Executive Dashboard also offers a PDF export option for board presentations. ' +
      'Exported files include all currently filtered data with proper formatting and headers.',
    expectedOutcome:
      'You will have downloadable reports ready for offline analysis or stakeholder presentations.',
    icon: Download,
    navigationLink: '/',
    navigationLabel: 'Export Dashboard',
  },
];

/**
 * Quick Start callout boxes for common issues
 * Requirements: 2.4 - Include callout boxes for common issues
 */
export const quickStartCallouts: QuickStartCallout[] = [
  {
    id: 'callout-empty-data',
    type: 'warning',
    title: 'Seeing Empty Charts or Tables?',
    description:
      'If the dashboard shows "No data available" messages, your database may not have records ' +
      'for the selected date range or filters. Try expanding your date range, removing filters, ' +
      'or importing data via the Data Import page.',
    actionLink: '/import',
    actionLabel: 'Go to Data Import',
  },
  {
    id: 'callout-demo-data',
    type: 'info',
    title: 'Need Sample Data for Testing?',
    description:
      'Administrators can generate realistic demo data using the Demo Mode feature in the Help Center. ' +
      'This creates tagged sample records that can be safely removed without affecting production data.',
    actionLink: '/help',
    actionLabel: 'Open Demo Mode',
  },
  {
    id: 'callout-permissions',
    type: 'info',
    title: 'Limited Access?',
    description:
      'Your user role determines available actions. Viewers can browse and export data. ' +
      'Editors can create and update records. Admins have full access including user management ' +
      'and demo data operations. Contact your administrator if you need elevated permissions.',
    actionLink: '/admin',
    actionLabel: 'View Admin Page',
  },
  {
    id: 'callout-glossary',
    type: 'success',
    title: 'Unfamiliar with Aviation Terms?',
    description:
      'The Glossary tab contains definitions for 25+ aviation and MRO terms used throughout ' +
      'the dashboard. Hover over acronyms like AOG, FMC, or TTSN to see quick definitions, ' +
      'or visit the Glossary for detailed explanations.',
    actionLink: '/help',
    actionLabel: 'Open Glossary',
  },
  {
    id: 'callout-health-score',
    type: 'info',
    title: 'Understanding Fleet Health Score',
    description:
      'The Fleet Health Score (0-100) is a composite metric combining Availability (40%), ' +
      'AOG Impact (25%), Budget Health (20%), and Maintenance Efficiency (15%). ' +
      'Scores above 90 indicate healthy operations, 70-89 suggest caution, and below 70 requires attention.',
  },
];

/**
 * Complete Quick Start content export
 */
export const quickStartContent: QuickStartContent = {
  steps: quickStartSteps,
  callouts: quickStartCallouts,
};

export default quickStartContent;
