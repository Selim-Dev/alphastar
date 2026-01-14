// Module Guides Content
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Detailed documentation for each dashboard module

import {
  LayoutDashboard,
  Plane,
  Wrench,
  AlertTriangle,
  ClipboardList,
  FileWarning,
  DollarSign,
  Upload,
  Users,
} from 'lucide-react';
import type { ModuleGuide } from './types';

/**
 * Module Guides for all 9 dashboard modules
 * Requirements: 3.3 - Include guides for Dashboard, Fleet Availability, Maintenance Tasks,
 *               AOG & Events, Work Orders, Discrepancies, Budget & Cost, Data Import, Admin
 */
export const moduleGuides: ModuleGuide[] = [
  // ==========================================================================
  // 1. Dashboard (Executive KPIs)
  // ==========================================================================
  {
    id: 'module-dashboard',
    moduleName: 'Executive Dashboard',
    icon: LayoutDashboard,
    purpose:
      'The Executive Dashboard provides a comprehensive overview of fleet health and operational ' +
      'performance. It displays key performance indicators (KPIs), the Fleet Health Score, ' +
      'alerts requiring attention, and trend visualizations for executive-level decision making.',
    requiredData: {
      collections: [
        'aircraft',
        'dailystatus',
        'dailycounters',
        'aogevents',
        'workorders',
        'budgetplans',
        'actualspends',
      ],
      endpoints: [
        'GET /api/dashboard/kpis',
        'GET /api/dashboard/health-score',
        'GET /api/dashboard/alerts',
        'GET /api/dashboard/trends',
        'GET /api/dashboard/fleet-comparison',
        'GET /api/dashboard/cost-efficiency',
      ],
    },
    stepByStepUsage: [
      'Navigate to the Dashboard from the sidebar or by clicking the logo',
      'Review the Fleet Health Score gauge for overall fleet status (0-100)',
      'Check the Alerts Panel for critical issues requiring immediate attention',
      'Examine the four primary KPI cards: Availability, Flight Hours, Cycles, Active AOGs',
      'Use the date range picker to adjust the analysis period',
      'Click on aircraft in Fleet Comparison to drill down to individual details',
      'Export the dashboard as PDF for board presentations using the Export button',
    ],
    expectedOutputs: [
      'Fleet Health Score with status indicator (Healthy/Caution/Warning)',
      'Categorized alerts by priority (Critical, Warning, Info)',
      'KPI cards with current values, trends, and period-over-period deltas',
      'Fleet availability trend chart with target line',
      'Top and bottom performing aircraft by availability',
      'Cost efficiency metrics (cost per flight hour, cost per cycle)',
    ],
    emptyStateCauses: [
      'No aircraft records exist in the database',
      'No daily status records for the selected date range',
      'No daily counter records for utilization calculations',
      'Date range filter excludes all available data',
    ],
    kpiDefinitions: [
      {
        term: 'Fleet Health Score',
        definition:
          'Composite metric (0-100) combining Availability (40%), AOG Impact (25%), ' +
          'Budget Health (20%), and Maintenance Efficiency (15%)',
        glossaryId: 'fleet-health-score',
      },
      {
        term: 'Fleet Availability',
        definition:
          'Percentage of time aircraft are Fully Mission Capable (FMC Hours / POS Hours × 100)',
        glossaryId: 'fmc',
      },
      {
        term: 'Active AOG Count',
        definition: 'Number of aircraft currently grounded (AOG events without clearedAt date)',
        glossaryId: 'aog',
      },
    ],
    exportNotes:
      'Use the PDF Export button to generate a formatted executive summary. ' +
      'The export includes all visible KPIs, charts, and the current date range.',
  },

  // ==========================================================================
  // 2. Fleet Availability
  // ==========================================================================
  {
    id: 'module-availability',
    moduleName: 'Fleet Availability',
    icon: Plane,
    purpose:
      'The Fleet Availability page tracks aircraft operational readiness over time. ' +
      'It displays daily availability percentages, NMC (Not Mission Capable) breakdowns, ' +
      'and allows filtering by fleet group or individual aircraft.',
    requiredData: {
      collections: ['aircraft', 'dailystatus'],
      endpoints: [
        'GET /api/aircraft',
        'GET /api/daily-status',
        'GET /api/daily-status/availability',
        'GET /api/daily-status/aggregations',
      ],
    },
    stepByStepUsage: [
      'Navigate to Fleet Availability from the sidebar',
      'Select a date range using the filter bar',
      'Optionally filter by fleet group or specific aircraft',
      'Review the availability summary cards showing FMC, NMC-S, NMC-U hours',
      'Examine the availability trend chart for patterns',
      'Click on a row in the data table to view daily details',
      'Use the aircraft selector to compare individual aircraft performance',
    ],
    expectedOutputs: [
      'Aggregated availability percentage for the selected period',
      'Breakdown of POS Hours, FMC Hours, NMC-S Hours, NMC-U Hours',
      'Daily availability trend chart',
      'Data table with daily status records',
      'Per-aircraft availability comparison',
    ],
    emptyStateCauses: [
      'No daily status records exist for any aircraft',
      'Selected date range has no recorded status data',
      'Filtered aircraft has no status records',
      'Daily status records not imported or entered',
    ],
    kpiDefinitions: [
      {
        term: 'POS Hours',
        definition: 'Possessed Hours - baseline hours the aircraft is in possession (typically 24/day)',
        glossaryId: 'pos-hours',
      },
      {
        term: 'FMC Hours',
        definition: 'Fully Mission Capable Hours - time aircraft is available for operations',
        glossaryId: 'fmc',
      },
      {
        term: 'NMC-S Hours',
        definition: 'Not Mission Capable - Scheduled maintenance hours',
        glossaryId: 'nmc',
      },
      {
        term: 'NMC-U Hours',
        definition: 'Not Mission Capable - Unscheduled maintenance hours',
        glossaryId: 'nmc',
      },
    ],
    exportNotes:
      'Export includes daily status records with all hour breakdowns. ' +
      'Use Excel export for detailed analysis or pivot table creation.',
  },

  // ==========================================================================
  // 3. Maintenance Tasks
  // ==========================================================================
  {
    id: 'module-maintenance',
    moduleName: 'Maintenance Tasks',
    icon: Wrench,
    purpose:
      'The Maintenance Tasks page logs and tracks shift-based maintenance activities. ' +
      'It records man-hours, costs, and task types for each maintenance event, ' +
      'enabling analysis of maintenance workload and cost drivers.',
    requiredData: {
      collections: ['aircraft', 'maintenancetasks'],
      endpoints: [
        'GET /api/aircraft',
        'GET /api/maintenance-tasks',
        'GET /api/maintenance-tasks/summary',
      ],
    },
    stepByStepUsage: [
      'Navigate to Maintenance Tasks from the sidebar',
      'Use the date range filter to select the analysis period',
      'Filter by aircraft, shift (Morning/Evening/Night), or task type',
      'Review summary cards showing total tasks, man-hours, and costs',
      'Click "Add Task" to log a new maintenance activity (Editor/Admin only)',
      'Fill in aircraft, date, shift, task type, description, and man-hours',
      'Optionally link the task to a work order',
    ],
    expectedOutputs: [
      'Summary statistics: total tasks, total man-hours, total cost',
      'Filterable data table of maintenance tasks',
      'Task distribution by shift and type',
      'Cost breakdown by task category',
    ],
    emptyStateCauses: [
      'No maintenance tasks have been logged',
      'Selected date range has no maintenance activity',
      'Filtered aircraft has no maintenance records',
      'Tasks not imported from external systems',
    ],
    kpiDefinitions: [
      {
        term: 'Man-Hours',
        definition: 'Total labor hours spent on maintenance (manpower count × hours worked)',
        glossaryId: 'man-hours',
      },
      {
        term: 'Shift',
        definition: 'Work period classification: Morning, Evening, Night, or Other',
      },
      {
        term: 'Task Type',
        definition: 'Category of maintenance work performed (inspection, repair, modification, etc.)',
      },
    ],
    exportNotes:
      'Export includes all task details with timestamps. ' +
      'Useful for labor analysis and cost allocation reporting.',
  },

  // ==========================================================================
  // 4. AOG & Events
  // ==========================================================================
  {
    id: 'module-aog-events',
    moduleName: 'AOG & Events',
    icon: AlertTriangle,
    purpose:
      'The AOG (Aircraft On Ground) Events page tracks grounding incidents with ' +
      'responsibility attribution. It enables analysis of downtime causes, ' +
      'accountability tracking, and identification of recurring issues.',
    requiredData: {
      collections: ['aircraft', 'aogevents'],
      endpoints: [
        'GET /api/aircraft',
        'GET /api/aog-events',
        'GET /api/aog-events/analytics',
      ],
    },
    stepByStepUsage: [
      'Navigate to AOG & Events from the sidebar',
      'Review active AOG events (those without a cleared date)',
      'Filter by date range, aircraft, or responsible party',
      'Examine the analytics breakdown by responsibility (Internal, OEM, Customs, Finance, Other)',
      'Click "Add AOG Event" to log a new grounding incident',
      'Record detection time, reason, responsible party, and costs',
      'Update the event with clearedAt date when resolved',
    ],
    expectedOutputs: [
      'Active AOG count and list',
      'Historical AOG events with duration and costs',
      'Downtime breakdown by responsible party',
      'Total downtime hours and associated costs',
      'AOG trend analysis over time',
    ],
    emptyStateCauses: [
      'No AOG events have been recorded',
      'All AOG events are outside the selected date range',
      'Filtered aircraft has no AOG history',
      'AOG events not imported from maintenance system',
    ],
    kpiDefinitions: [
      {
        term: 'AOG',
        definition: 'Aircraft On Ground - aircraft unable to fly due to maintenance or parts issues',
        glossaryId: 'aog',
      },
      {
        term: 'Responsible Party',
        definition: 'Entity accountable for the AOG: Internal, OEM, Customs, Finance, or Other',
        glossaryId: 'responsible-party',
      },
      {
        term: 'Downtime Hours',
        definition: 'Duration from AOG detection to clearance (clearedAt - detectedAt)',
        glossaryId: 'downtime',
      },
    ],
    exportNotes:
      'Export includes full AOG event details with costs and durations. ' +
      'Use for accountability reporting and vendor performance analysis.',
  },

  // ==========================================================================
  // 5. Work Orders
  // ==========================================================================
  {
    id: 'module-work-orders',
    moduleName: 'Work Orders',
    icon: ClipboardList,
    purpose:
      'The Work Orders page manages formal maintenance work orders with status tracking. ' +
      'It monitors work order lifecycle from creation to closure, tracks turnaround times, ' +
      'and identifies overdue items requiring attention.',
    requiredData: {
      collections: ['aircraft', 'workorders'],
      endpoints: ['GET /api/aircraft', 'GET /api/work-orders'],
    },
    stepByStepUsage: [
      'Navigate to Work Orders from the sidebar',
      'Review the status distribution: Open, In Progress, Closed, Deferred',
      'Filter by status, aircraft, or date range',
      'Identify overdue work orders (past due date and not closed)',
      'Click "Add Work Order" to create a new work order',
      'Enter WO number, aircraft, description, and due date',
      'Update status as work progresses through the lifecycle',
    ],
    expectedOutputs: [
      'Work order count by status',
      'Overdue work order alerts',
      'Average turnaround time for closed work orders',
      'Filterable work order list with all details',
      'Work order history per aircraft',
    ],
    emptyStateCauses: [
      'No work orders have been created',
      'All work orders are outside the selected date range',
      'Filtered aircraft has no work orders',
      'Work orders not synced from maintenance management system',
    ],
    kpiDefinitions: [
      {
        term: 'Work Order',
        definition: 'Formal maintenance authorization document tracking specific maintenance activities',
        glossaryId: 'work-order',
      },
      {
        term: 'Turnaround Time',
        definition: 'Days from work order creation (dateIn) to closure (dateOut)',
      },
      {
        term: 'CRS Number',
        definition: 'Certificate of Release to Service - certification that work is complete',
      },
    ],
    exportNotes:
      'Export includes work order details with dates and status. ' +
      'Useful for maintenance planning and compliance reporting.',
  },

  // ==========================================================================
  // 6. Discrepancies
  // ==========================================================================
  {
    id: 'module-discrepancies',
    moduleName: 'Discrepancies',
    icon: FileWarning,
    purpose:
      'The Discrepancies page tracks defects and issues categorized by ATA chapter. ' +
      'It enables pattern analysis to identify recurring problems, ' +
      'track resolution status, and attribute responsibility.',
    requiredData: {
      collections: ['aircraft', 'discrepancies'],
      endpoints: [
        'GET /api/aircraft',
        'GET /api/discrepancies',
        'GET /api/discrepancies/analytics',
      ],
    },
    stepByStepUsage: [
      'Navigate to Discrepancies from the sidebar',
      'Review the ATA chapter breakdown to identify problem areas',
      'Filter by date range, aircraft, ATA chapter, or responsibility',
      'Examine open discrepancies (those without correction date)',
      'Click "Add Discrepancy" to log a new defect',
      'Record ATA chapter, description, and responsible party',
      'Update with corrective action and correction date when resolved',
    ],
    expectedOutputs: [
      'Discrepancy count by ATA chapter (defect patterns)',
      'Open vs. closed discrepancy breakdown',
      'Downtime hours attributed to discrepancies',
      'Responsibility distribution analysis',
      'Trend of discrepancies over time',
    ],
    emptyStateCauses: [
      'No discrepancies have been logged',
      'Selected date range has no discrepancy records',
      'Filtered aircraft has no discrepancy history',
      'Discrepancies not imported from quality system',
    ],
    kpiDefinitions: [
      {
        term: 'ATA Chapter',
        definition:
          'Air Transport Association chapter code classifying aircraft systems (e.g., 21=Air Conditioning, 32=Landing Gear)',
        glossaryId: 'ata-chapter',
      },
      {
        term: 'Discrepancy',
        definition: 'A defect, fault, or deviation from expected aircraft condition',
        glossaryId: 'discrepancy',
      },
      {
        term: 'Corrective Action',
        definition: 'Steps taken to resolve the discrepancy and restore aircraft to serviceable condition',
      },
    ],
    exportNotes:
      'Export includes full discrepancy details with ATA codes. ' +
      'Use for reliability analysis and maintenance program optimization.',
  },

  // ==========================================================================
  // 7. Budget & Cost
  // ==========================================================================
  {
    id: 'module-budget',
    moduleName: 'Budget & Cost',
    icon: DollarSign,
    purpose:
      'The Budget & Cost page tracks planned budgets against actual expenditures. ' +
      'It provides variance analysis by budget clause and aircraft group, ' +
      'burn rate projections, and cost efficiency metrics.',
    requiredData: {
      collections: ['budgetplans', 'actualspends'],
      endpoints: [
        'GET /api/budget-plans',
        'GET /api/actual-spend',
        'GET /api/budget/variance',
        'GET /api/budget/burn-rate',
      ],
    },
    stepByStepUsage: [
      'Navigate to Budget & Cost from the sidebar',
      'Select the fiscal year for analysis',
      'Review budget vs. actual by clause (18 standard budget clauses)',
      'Filter by aircraft group to see group-specific spending',
      'Examine variance indicators (green=under budget, red=over budget)',
      'Check burn rate projections for budget runway',
      'Add actual spend records to track expenditures',
    ],
    expectedOutputs: [
      'Budget plan totals by clause and aircraft group',
      'Actual spend totals with variance calculations',
      'Variance percentage and remaining budget',
      'Burn rate analysis with projected months remaining',
      'Cost per flight hour and cost per cycle metrics',
    ],
    emptyStateCauses: [
      'No budget plans have been created for the fiscal year',
      'No actual spend records have been logged',
      'Selected fiscal year has no budget data',
      'Budget data not imported from financial system',
    ],
    kpiDefinitions: [
      {
        term: 'Budget Clause',
        definition: 'Standard expense category (1-18) such as Aircraft Lease, Airframe Maintenance, Fuel, etc.',
        glossaryId: 'budget-clause',
      },
      {
        term: 'Variance',
        definition: 'Difference between planned budget and actual spend (Planned - Actual)',
        glossaryId: 'variance',
      },
      {
        term: 'Burn Rate',
        definition: 'Average monthly spending rate used to project budget runway',
        glossaryId: 'burn-rate',
      },
    ],
    exportNotes:
      'Export includes budget plans and actual spend with variance calculations. ' +
      'Use for financial reporting and budget planning.',
  },

  // ==========================================================================
  // 8. Data Import
  // ==========================================================================
  {
    id: 'module-import',
    moduleName: 'Data Import',
    icon: Upload,
    purpose:
      'The Data Import page enables bulk data upload via Excel templates. ' +
      'It supports importing aircraft, daily status, utilization counters, ' +
      'maintenance tasks, work orders, and other operational data.',
    requiredData: {
      collections: [],
      endpoints: [
        'GET /api/import/template/:type',
        'POST /api/import/upload',
      ],
    },
    stepByStepUsage: [
      'Navigate to Data Import from the sidebar',
      'Select the data type you want to import (Aircraft, Daily Status, etc.)',
      'Download the Excel template for that data type',
      'Fill in the template with your data following the column headers',
      'Upload the completed Excel file',
      'Review the import preview showing records to be created',
      'Confirm the import to create records in the database',
    ],
    expectedOutputs: [
      'Downloaded Excel template with correct column structure',
      'Import preview showing parsed records',
      'Validation errors for any malformed data',
      'Success message with count of imported records',
      'Import log for audit trail',
    ],
    emptyStateCauses: [
      'This page does not display existing data',
      'Import templates are generated on-demand',
      'Previous imports are logged but not displayed here',
    ],
    kpiDefinitions: [
      {
        term: 'Excel Template',
        definition: 'Pre-formatted spreadsheet with correct column headers for data import',
      },
      {
        term: 'Import Validation',
        definition: 'Automatic checking of data format, required fields, and business rules',
      },
      {
        term: 'Import Log',
        definition: 'Record of import operations including timestamp, user, and record counts',
      },
    ],
    exportNotes:
      'This page is for importing data. Use other module pages to export existing data.',
  },

  // ==========================================================================
  // 9. Admin / User Management
  // ==========================================================================
  {
    id: 'module-admin',
    moduleName: 'Admin & User Management',
    icon: Users,
    purpose:
      'The Admin page provides user management capabilities for administrators. ' +
      'It allows creating new users, assigning roles, and managing access permissions. ' +
      'Only users with Admin role can access this page.',
    requiredData: {
      collections: ['users'],
      endpoints: [
        'GET /api/auth/users',
        'POST /api/auth/register',
      ],
    },
    stepByStepUsage: [
      'Navigate to Admin from the sidebar (Admin role required)',
      'Review the list of existing users with their roles',
      'Click "Add User" to create a new user account',
      'Enter email, name, password, and select role (Admin/Editor/Viewer)',
      'The new user can now log in with the provided credentials',
      'To change a user role, edit the user record',
      'Deactivate users by changing their status (if supported)',
    ],
    expectedOutputs: [
      'List of all system users with roles',
      'User creation form with validation',
      'Success/error messages for user operations',
      'Role-based access control enforcement',
    ],
    emptyStateCauses: [
      'No users exist (unlikely - at least one admin should exist)',
      'User list endpoint is not accessible',
      'Database connection issue',
    ],
    kpiDefinitions: [
      {
        term: 'Admin Role',
        definition: 'Full access including user management, data deletion, and demo operations',
      },
      {
        term: 'Editor Role',
        definition: 'Can create and update records but cannot delete or manage users',
      },
      {
        term: 'Viewer Role',
        definition: 'Read-only access to browse and export data',
      },
    ],
    exportNotes:
      'User data export is not available for security reasons. ' +
      'Contact system administrator for user audit reports.',
  },
];

export default moduleGuides;
