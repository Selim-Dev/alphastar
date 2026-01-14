// Glossary Content - Aviation Terms and Acronyms
// Requirements: 4.3, 4.4, 4.5 - Searchable glossary with 25+ terms organized by category

import type { GlossaryEntry, GlossaryCategory } from './types';

/**
 * Complete glossary of aviation terms and acronyms used in the Alpha Star Aviation KPIs Dashboard.
 * Organized by category: Operations, Maintenance, Finance, General
 * Requirements: 4.4 - Include at least 25 aviation/MRO terms
 */
export const glossaryEntries: GlossaryEntry[] = [
  // =============================================================================
  // Operations Category
  // =============================================================================
  {
    id: 'aog',
    term: 'Aircraft On Ground',
    acronym: 'AOG',
    definition: 'A condition where an aircraft is unable to fly due to maintenance issues, parts unavailability, or other technical problems requiring immediate attention.',
    whereItAppears: ['Dashboard KPIs', 'AOG Events Page', 'Alerts Panel', 'Fleet Health Score'],
    whyItMatters: 'AOG events directly impact fleet availability and operational revenue. Each hour of AOG represents lost flight capacity and potential customer dissatisfaction.',
    exampleValue: '2 Active AOGs',
    category: 'Operations',
    relatedTerms: ['Downtime', 'FMC', 'NMC'],
  },
  {
    id: 'fmc',
    term: 'Fully Mission Capable',
    acronym: 'FMC',
    definition: 'Hours during which an aircraft is fully operational and available for flight operations without any restrictions or limitations.',
    whereItAppears: ['Fleet Availability Page', 'Dashboard KPIs', 'Daily Status Records'],
    howCalculated: 'FMC Hours = POS Hours - NMCM(S) Hours - NMCM(U) Hours - NMCS Hours',
    whyItMatters: 'FMC hours directly determine fleet availability percentage. Higher FMC hours indicate better operational readiness.',
    exampleValue: '22.5 FMC Hours/Day',
    category: 'Operations',
    relatedTerms: ['NMC', 'NMCS', 'POS Hours'],
  },
  {
    id: 'pos-hours',
    term: 'Possessed Hours',
    acronym: 'POS Hours',
    definition: 'The total hours an aircraft is in the operator\'s possession during a given period, typically 24 hours per day.',
    whereItAppears: ['Fleet Availability Page', 'Daily Status Records'],
    howCalculated: 'Typically 24 hours per day unless aircraft is transferred or leased out',
    whyItMatters: 'POS hours form the baseline for availability calculations. They represent the maximum possible operational hours.',
    exampleValue: '24 POS Hours/Day',
    category: 'Operations',
    relatedTerms: ['FMC', 'NMC'],
  },
  {
    id: 'nmc',
    term: 'Not Mission Capable',
    acronym: 'NMC',
    definition: 'Hours during which an aircraft cannot perform its intended mission due to maintenance or supply issues.',
    whereItAppears: ['Fleet Availability Page', 'Daily Status Records'],
    howCalculated: 'NMC Hours = NMCM(S) + NMCM(U) + NMCS',
    whyItMatters: 'NMC hours reduce fleet availability and indicate maintenance or supply chain issues that need attention.',
    exampleValue: '1.5 NMC Hours/Day',
    category: 'Operations',
    relatedTerms: ['FMC', 'NMCS', 'AOG'],
  },
  {
    id: 'nmcs',
    term: 'Not Mission Capable - Supply',
    acronym: 'NMCS',
    definition: 'Hours an aircraft is grounded specifically due to parts or supply unavailability, not maintenance work.',
    whereItAppears: ['Fleet Availability Page', 'Daily Status Records', 'AOG Events'],
    whyItMatters: 'NMCS hours highlight supply chain inefficiencies. High NMCS indicates need for better parts inventory management.',
    exampleValue: '0.5 NMCS Hours/Day',
    category: 'Operations',
    relatedTerms: ['NMC', 'AOG', 'Responsible Party'],
  },
  {
    id: 'dispatch-reliability',
    term: 'Dispatch Reliability',
    definition: 'The percentage of scheduled flights that depart without technical delays or cancellations.',
    whereItAppears: ['Dashboard KPIs', 'Operational Efficiency Panel'],
    howCalculated: '(Flights Without Technical Delay / Total Scheduled Flights) × 100',
    whyItMatters: 'Dispatch reliability is a key airline performance metric. Industry target is typically 98%+ for premium operators.',
    exampleValue: '98.5%',
    category: 'Operations',
    relatedTerms: ['AOG', 'FMC', 'Fleet Health Score'],
  },
  {
    id: 'flight-hour',
    term: 'Flight Hour',
    acronym: 'FH',
    definition: 'One hour of aircraft flight time, measured from takeoff to landing. Used as the primary unit for tracking aircraft utilization.',
    whereItAppears: ['Dashboard KPIs', 'Utilization Page', 'Aircraft Detail Page'],
    whyItMatters: 'Flight hours drive maintenance schedules, cost calculations, and revenue generation. They are the fundamental unit of aircraft utilization.',
    exampleValue: '4.5 FH per flight',
    category: 'Operations',
    relatedTerms: ['Cycle', 'TTSN', 'Cost per Flight Hour'],
  },
  {
    id: 'cycle',
    term: 'Cycle',
    definition: 'One complete takeoff and landing sequence. Used alongside flight hours to track aircraft and component usage.',
    whereItAppears: ['Dashboard KPIs', 'Utilization Page', 'Aircraft Detail Page'],
    whyItMatters: 'Cycles are critical for landing gear, pressurization system, and structural fatigue tracking. Some maintenance is cycle-based rather than hour-based.',
    exampleValue: '2 cycles per day',
    category: 'Operations',
    relatedTerms: ['Flight Hour', 'TCSN'],
  },
  {
    id: 'fleet-group',
    term: 'Fleet Group',
    definition: 'A classification of aircraft by type or model for operational and reporting purposes (e.g., A330, A340, G650ER, Cessna).',
    whereItAppears: ['All Pages', 'Filter Bar', 'Budget Reports'],
    whyItMatters: 'Fleet groups enable comparative analysis and budgeting by aircraft type. Different fleet groups have different operational characteristics and costs.',
    exampleValue: 'A340, G650ER',
    category: 'Operations',
    relatedTerms: ['Aircraft Type'],
  },

  // =============================================================================
  // Maintenance Category
  // =============================================================================
  {
    id: 'ata-chapter',
    term: 'ATA Chapter',
    acronym: 'ATA',
    definition: 'Air Transport Association chapter classification system that categorizes aircraft systems and components using standardized numeric codes (e.g., 21=Air Conditioning, 32=Landing Gear, 72=Engine).',
    whereItAppears: ['Discrepancies Page', 'Defect Patterns Chart', 'Work Orders'],
    whyItMatters: 'ATA chapters enable standardized tracking of maintenance issues across the industry. They help identify problem areas and trends in specific aircraft systems.',
    exampleValue: 'ATA 32 - Landing Gear',
    category: 'Maintenance',
    relatedTerms: ['Discrepancy', 'Work Order'],
  },
  {
    id: 'ttsn',
    term: 'Total Time Since New',
    acronym: 'TTSN',
    definition: 'The cumulative flight hours accumulated by an airframe, engine, or component since its manufacture date.',
    whereItAppears: ['Aircraft Detail Page', 'Utilization Page', 'Daily Counters'],
    howCalculated: 'Sum of all flight hours since manufacture (monotonically increasing)',
    whyItMatters: 'TTSN determines maintenance intervals, component life limits, and aircraft value. It is a critical metric for airworthiness compliance.',
    exampleValue: '12,450.5 TTSN',
    category: 'Maintenance',
    relatedTerms: ['TCSN', 'Flight Hour'],
  },
  {
    id: 'tcsn',
    term: 'Total Cycles Since New',
    acronym: 'TCSN',
    definition: 'The cumulative number of takeoff/landing cycles accumulated by an airframe, engine, or component since manufacture.',
    whereItAppears: ['Aircraft Detail Page', 'Utilization Page', 'Daily Counters'],
    howCalculated: 'Sum of all cycles since manufacture (monotonically increasing)',
    whyItMatters: 'TCSN is critical for fatigue-life tracking of structural components, landing gear, and pressurization systems.',
    exampleValue: '4,230 TCSN',
    category: 'Maintenance',
    relatedTerms: ['TTSN', 'Cycle'],
  },
  {
    id: 'apu',
    term: 'Auxiliary Power Unit',
    acronym: 'APU',
    definition: 'A small gas turbine engine that provides electrical power and pneumatic air for aircraft systems when main engines are not running.',
    whereItAppears: ['Aircraft Detail Page', 'Utilization Page', 'Daily Counters'],
    whyItMatters: 'APU hours are tracked separately for maintenance scheduling. APU availability affects ground operations and passenger comfort.',
    exampleValue: '8,500 APU Hours',
    category: 'Maintenance',
    relatedTerms: ['TTSN', 'Flight Hour'],
  },
  {
    id: 'man-hours',
    term: 'Man-hours',
    definition: 'The total labor hours expended on a maintenance task, calculated as number of technicians multiplied by hours worked.',
    whereItAppears: ['Maintenance Tasks Page', 'AOG Events', 'Work Orders'],
    howCalculated: 'Man-hours = Number of Technicians × Hours Worked',
    whyItMatters: 'Man-hours drive labor costs and help measure maintenance efficiency. They are used for budgeting and resource planning.',
    exampleValue: '24 man-hours',
    category: 'Maintenance',
    relatedTerms: ['Work Order', 'Downtime'],
  },
  {
    id: 'downtime',
    term: 'Downtime',
    definition: 'The period during which an aircraft is unavailable for operations due to maintenance, repairs, or other non-operational activities.',
    whereItAppears: ['AOG Events Page', 'Fleet Availability Page', 'Dashboard Alerts'],
    howCalculated: 'Downtime = Cleared At - Detected At (for AOG events)',
    whyItMatters: 'Downtime directly impacts fleet availability and revenue generation. Minimizing downtime is a key operational objective.',
    exampleValue: '48 hours downtime',
    category: 'Maintenance',
    relatedTerms: ['AOG', 'NMC', 'MTTR'],
  },
  {
    id: 'work-order',
    term: 'Work Order',
    acronym: 'WO',
    definition: 'A formal document authorizing and tracking maintenance work on an aircraft, including task description, status, and completion details.',
    whereItAppears: ['Work Orders Page', 'Maintenance Tasks', 'Dashboard Alerts'],
    whyItMatters: 'Work orders provide traceability and compliance documentation. Overdue work orders indicate maintenance backlog issues.',
    exampleValue: 'WO-2025-001234',
    category: 'Maintenance',
    relatedTerms: ['Discrepancy', 'Man-hours'],
  },
  {
    id: 'discrepancy',
    term: 'Discrepancy',
    definition: 'A reported defect, malfunction, or deviation from normal operation that requires investigation and corrective action.',
    whereItAppears: ['Discrepancies Page', 'Defect Patterns Chart', 'Work Orders'],
    whyItMatters: 'Tracking discrepancies by ATA chapter helps identify recurring issues and systemic problems requiring attention.',
    exampleValue: 'ATA 32 - Nose gear steering fault',
    category: 'Maintenance',
    relatedTerms: ['ATA Chapter', 'Work Order', 'Corrective Action'],
  },
  {
    id: 'mtbf',
    term: 'Mean Time Between Failures',
    acronym: 'MTBF',
    definition: 'The average operating time between equipment failures, used to measure reliability of aircraft systems and components.',
    whereItAppears: ['Dashboard KPIs', 'Operational Efficiency Panel'],
    howCalculated: 'MTBF = Total Operating Hours / Number of Failures',
    whyItMatters: 'Higher MTBF indicates better reliability. It helps predict maintenance needs and identify components requiring attention.',
    exampleValue: '2,500 hours MTBF',
    category: 'Maintenance',
    relatedTerms: ['MTTR', 'Dispatch Reliability'],
  },
  {
    id: 'mttr',
    term: 'Mean Time To Repair',
    acronym: 'MTTR',
    definition: 'The average time required to restore equipment to operational status after a failure occurs.',
    whereItAppears: ['Dashboard KPIs', 'Operational Efficiency Panel', 'AOG Events'],
    howCalculated: 'MTTR = Sum of Repair Times / Number of Repairs',
    whyItMatters: 'Lower MTTR indicates efficient maintenance operations. High MTTR may indicate parts availability or skill issues.',
    exampleValue: '4.5 hours MTTR',
    category: 'Maintenance',
    relatedTerms: ['MTBF', 'Downtime', 'AOG'],
  },
  {
    id: 'responsible-party',
    term: 'Responsible Party',
    definition: 'The entity accountable for an AOG event or delay, used for tracking and accountability (Internal, OEM, Customs, Finance, Other).',
    whereItAppears: ['AOG Events Page', 'AOG Analytics', 'Responsibility Charts'],
    whyItMatters: 'Identifying responsible parties enables targeted improvements and accountability. It helps distinguish internal issues from external dependencies.',
    exampleValue: 'OEM - Parts delay',
    category: 'Maintenance',
    relatedTerms: ['AOG', 'Downtime'],
  },

  // =============================================================================
  // Finance Category
  // =============================================================================
  {
    id: 'variance',
    term: 'Variance',
    definition: 'The difference between planned/budgeted amounts and actual expenditures, expressed as a dollar amount or percentage.',
    whereItAppears: ['Budget Page', 'Dashboard KPIs', 'Cost Reports'],
    howCalculated: 'Variance = Planned Amount - Actual Amount (positive = under budget)',
    whyItMatters: 'Variance tracking enables proactive budget management. Negative variance indicates overspending requiring attention.',
    exampleValue: '+$50,000 (under budget)',
    category: 'Finance',
    relatedTerms: ['Budget Clause', 'Burn Rate'],
  },
  {
    id: 'burn-rate',
    term: 'Burn Rate',
    definition: 'The rate at which budget is being consumed over time, typically expressed as average monthly spend.',
    whereItAppears: ['Budget Page', 'Dashboard KPIs', 'Financial Reports'],
    howCalculated: 'Burn Rate = Total Spent / Number of Months',
    whyItMatters: 'Burn rate helps predict budget exhaustion and enables proactive financial planning. High burn rate may indicate need for cost controls.',
    exampleValue: '$125,000/month',
    category: 'Finance',
    relatedTerms: ['Variance', 'Budget Clause', 'Fiscal Year'],
  },
  {
    id: 'budget-clause',
    term: 'Budget Clause',
    definition: 'A standardized category for aviation expenses (18 clauses total), including Aircraft Lease, Airframe Maintenance, Engines, Spare Parts, Fuel, Insurance, etc.',
    whereItAppears: ['Budget Page', 'Cost Reports', 'Financial Planning'],
    whyItMatters: 'Budget clauses enable standardized cost tracking and comparison across fleet groups and fiscal years.',
    exampleValue: 'Clause 2 - Airframe Maintenance',
    category: 'Finance',
    relatedTerms: ['Variance', 'Fiscal Year', 'Burn Rate'],
  },
  {
    id: 'fiscal-year',
    term: 'Fiscal Year',
    acronym: 'FY',
    definition: 'The 12-month period used for financial planning and reporting, which may differ from the calendar year.',
    whereItAppears: ['Budget Page', 'Financial Reports', 'Year-over-Year Comparisons'],
    whyItMatters: 'Fiscal year alignment ensures consistent financial reporting and budget tracking across the organization.',
    exampleValue: 'FY 2025',
    category: 'Finance',
    relatedTerms: ['Budget Clause', 'Variance'],
  },
  {
    id: 'cost-per-flight-hour',
    term: 'Cost per Flight Hour',
    definition: 'Total maintenance and operational costs divided by total flight hours, used to measure cost efficiency.',
    whereItAppears: ['Dashboard KPIs', 'Cost Efficiency Panel', 'Fleet Comparison'],
    howCalculated: 'Cost per FH = Total Costs / Total Flight Hours',
    whyItMatters: 'Cost per flight hour enables efficiency comparison across aircraft and fleet groups. Lower values indicate better cost efficiency.',
    exampleValue: '$2,450/FH',
    category: 'Finance',
    relatedTerms: ['Flight Hour', 'Variance'],
  },

  // =============================================================================
  // General Category
  // =============================================================================
  {
    id: 'fleet-health-score',
    term: 'Fleet Health Score',
    definition: 'A composite metric (0-100) combining availability, AOG impact, budget health, and maintenance efficiency into a single actionable number.',
    whereItAppears: ['Dashboard', 'Fleet Health Gauge', 'Executive Reports'],
    howCalculated: 'Fleet Health = (Availability × 0.40) + (AOG Impact × 0.25) + (Budget Health × 0.20) + (Maintenance Efficiency × 0.15)',
    whyItMatters: 'Fleet Health Score provides executives with a single metric to assess overall fleet status. Scores below 70 indicate warning conditions.',
    exampleValue: '87 (Healthy)',
    category: 'General',
    relatedTerms: ['FMC', 'AOG', 'Variance', 'Work Order'],
  },
  {
    id: 'kpi',
    term: 'Key Performance Indicator',
    acronym: 'KPI',
    definition: 'A measurable value that demonstrates how effectively the organization is achieving key operational and business objectives.',
    whereItAppears: ['Dashboard', 'All Pages', 'Reports'],
    whyItMatters: 'KPIs enable data-driven decision making and performance tracking against targets.',
    exampleValue: 'Fleet Availability: 92%',
    category: 'General',
    relatedTerms: ['Fleet Health Score', 'Dispatch Reliability'],
  },
  {
    id: 'aircraft-type',
    term: 'Aircraft Type',
    definition: 'The specific model designation of an aircraft (e.g., A340-642, Gulfstream G650ER, Cessna Citation Bravo).',
    whereItAppears: ['Aircraft Page', 'Filter Bar', 'Reports'],
    whyItMatters: 'Aircraft type determines maintenance requirements, operational capabilities, and cost structures.',
    exampleValue: 'A340-642',
    category: 'General',
    relatedTerms: ['Fleet Group', 'MSN'],
  },
  {
    id: 'msn',
    term: 'Manufacturer Serial Number',
    acronym: 'MSN',
    definition: 'A unique identifier assigned by the aircraft manufacturer to each airframe produced.',
    whereItAppears: ['Aircraft Detail Page', 'Aircraft List'],
    whyItMatters: 'MSN provides unique identification for regulatory compliance, maintenance records, and asset tracking.',
    exampleValue: 'MSN 1234',
    category: 'General',
    relatedTerms: ['Aircraft Type', 'Registration'],
  },
  {
    id: 'registration',
    term: 'Registration',
    definition: 'The unique alphanumeric identifier assigned to an aircraft by the civil aviation authority (e.g., HZ-A42).',
    whereItAppears: ['All Pages', 'Aircraft List', 'Filter Bar'],
    whyItMatters: 'Registration is the primary identifier for aircraft in operations and regulatory compliance.',
    exampleValue: 'HZ-A42',
    category: 'General',
    relatedTerms: ['MSN', 'Aircraft Type'],
  },
];

/**
 * Get all unique categories from glossary entries
 */
export const glossaryCategories: GlossaryCategory[] = ['Operations', 'Maintenance', 'Finance', 'General'];

/**
 * Get glossary entries filtered by category
 */
export function getEntriesByCategory(category: GlossaryCategory): GlossaryEntry[] {
  return glossaryEntries.filter(entry => entry.category === category);
}

/**
 * Get a single glossary entry by ID
 */
export function getEntryById(id: string): GlossaryEntry | undefined {
  return glossaryEntries.find(entry => entry.id === id);
}

/**
 * Get a single glossary entry by term or acronym
 */
export function getEntryByTermOrAcronym(termOrAcronym: string): GlossaryEntry | undefined {
  const normalized = termOrAcronym.toLowerCase();
  return glossaryEntries.find(
    entry => 
      entry.term.toLowerCase() === normalized || 
      entry.acronym?.toLowerCase() === normalized
  );
}
