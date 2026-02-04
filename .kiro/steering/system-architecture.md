# Alpha Star Aviation KPIs Dashboard - System Architecture & Logic Reference

## Overview

This document provides a comprehensive reference for the Alpha Star Aviation KPIs Dashboard implementation. It serves as the authoritative guide for understanding the business logic, data flows, calculations, and architectural decisions. Use this when adjusting logic or extending functionality.

## System Purpose

Replace manual Excel-based reporting with a dynamic, accurate system for tracking:
- Aircraft availability (replacing static ~92% estimates with real-time calculations)
- Flight hours and cycles utilization
- Maintenance activities and costs
- Budget tracking and variance analysis
- AOG events with responsibility attribution

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript + Vite | SPA with type safety |
| UI Components | Tailwind CSS + shadcn/ui | Consistent, accessible design |
| State Management | TanStack Query v5 | Server state caching and sync |
| Forms | React Hook Form + Zod | Validation and form handling |
| Tables | TanStack Table v8 | Sortable, filterable data tables |
| Charts | Recharts | Data visualization |
| Backend | NestJS + TypeScript | REST API with dependency injection |
| Database | MongoDB + Mongoose | Document storage with ODM |
| Authentication | JWT + bcrypt | Stateless auth with role-based access |
| File Storage | AWS S3 | Excel templates and attachments |

---

## Data Models & Business Logic

### 1. Aircraft Master Data

**Collection:** `aircraft`

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| registration | string | Unique tail number (e.g., HZ-A42) - UPPERCASE |
| fleetGroup | string | Fleet category (A330, A340, G650ER, Cessna, Hawker, A320, A319, A318) |
| aircraftType | string | Specific model (e.g., A340-642, Gulfstream G650ER) |
| msn | string | Manufacturer Serial Number |
| owner | string | Owner entity (Alpha Star Aviation, Sky Prime Aviation, RSAF) |
| manufactureDate | Date | Aircraft manufacture date |
| enginesCount | number | Number of engines (2 or 4) |
| status | enum | active, parked, leased |

**Business Rules:**
- Registration must be unique (case-insensitive, stored uppercase)
- enginesCount determines which engine fields are required in DailyCounter

**Indexes:**
- `{ registration: 1 }` - unique
- `{ fleetGroup: 1, status: 1 }` - filtering

---

### 2. Daily Utilization Counters

**Collection:** `dailycounters`

**Purpose:** Track cumulative flight hours and cycles for airframe, engines, and APU.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| date | Date | Counter reading date |
| airframeHoursTtsn | number | Total Time Since New (cumulative) |
| airframeCyclesTcsn | number | Total Cycles Since New (cumulative) |
| engine1Hours/Cycles | number | Engine 1 counters |
| engine2Hours/Cycles | number | Engine 2 counters |
| engine3Hours/Cycles | number | Engine 3 counters (4-engine aircraft) |
| engine4Hours/Cycles | number | Engine 4 counters (4-engine aircraft) |
| apuHours | number | APU hours |
| apuCycles | number | APU cycles (optional) |
| lastFlightDate | Date | Date of last flight (optional) |
| updatedBy | ObjectId | User who made the update |

**Business Rules:**
- **Monotonic Validation:** Counter values must be >= previous day's values (counters only go up)
- Daily flight hours = today's airframeHoursTtsn - yesterday's airframeHoursTtsn
- Daily cycles = today's airframeCyclesTcsn - yesterday's airframeCyclesTcsn
- Engine 3/4 fields only required for 4-engine aircraft

**Calculations:**
```typescript
// Daily delta calculation
dailyFlightHours = currentRecord.airframeHoursTtsn - previousRecord.airframeHoursTtsn;
dailyCycles = currentRecord.airframeCyclesTcsn - previousRecord.airframeCyclesTcsn;

// Aggregation periods: day, month, year
// Sum deltas for the period to get total utilization
```

**Indexes:**
- `{ aircraftId: 1, date: -1 }` - unique, primary query pattern
- `{ date: -1 }` - date-based queries

---

### 3. Daily Status (Availability)

**Collection:** `dailystatus`

**Purpose:** Track aircraft availability hours per day for dynamic availability calculation.

**Schema Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| aircraftId | ObjectId | - | Reference to Aircraft |
| date | Date | - | Status date |
| posHours | number | 24 | Possessed hours (baseline) |
| fmcHours | number | 24 | Fully Mission Capable hours |
| nmcmSHours | number | 0 | Not Mission Capable - Scheduled maintenance |
| nmcmUHours | number | 0 | Not Mission Capable - Unscheduled maintenance |
| nmcsHours | number | - | Not Mission Capable - Supply (optional) |
| notes | string | - | Additional notes |
| updatedBy | ObjectId | - | User who made the update |

**Business Rules:**
- posHours typically = 24 (full day)
- fmcHours = posHours - nmcmSHours - nmcmUHours - nmcsHours
- All hour values must be between 0 and 24

**Availability Calculation:**
```typescript
// Single day availability
availabilityPercentage = (fmcHours / posHours) * 100;

// Period availability (aggregated)
totalPosHours = sum(posHours) for all days in period;
totalFmcHours = sum(fmcHours) for all days in period;
periodAvailability = (totalFmcHours / totalPosHours) * 100;

// Fleet-wide availability
fleetAvailability = (sum(fmcHours for all aircraft) / sum(posHours for all aircraft)) * 100;
```

**Indexes:**
- `{ aircraftId: 1, date: -1 }` - unique
- `{ date: -1 }` - date-based queries

---

### 4. AOG Events (Aircraft On Ground) - Simplified Model

**Collection:** `aogevents`

**Purpose:** Track grounding events with milestone-based downtime analytics using a three-bucket model (Technical, Procurement, Ops).

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| detectedAt | Date | When AOG was detected (authoritative start) |
| clearedAt | Date | When AOG was cleared (authoritative end, null = still active) |
| category | enum | scheduled, unscheduled, aog |
| reasonCode | string | Reason for grounding |
| responsibleParty | enum | Internal, OEM, Customs, Finance, Other |
| actionTaken | string | Description of corrective action |
| manpowerCount | number | Number of personnel involved |
| manHours | number | Total labor hours |
| **reportedAt** | Date | **Milestone: When AOG was reported (defaults to detectedAt)** |
| **procurementRequestedAt** | Date | **Milestone: When parts were requested (optional)** |
| **availableAtStoreAt** | Date | **Milestone: When parts arrived (optional)** |
| **issuedBackAt** | Date | **Milestone: When parts issued to maintenance (optional)** |
| **installationCompleteAt** | Date | **Milestone: When repair work finished** |
| **testStartAt** | Date | **Milestone: When ops testing started (optional)** |
| **upAndRunningAt** | Date | **Milestone: When aircraft returned to service (defaults to clearedAt)** |
| **technicalTimeHours** | number | **Computed: Technical bucket time** |
| **procurementTimeHours** | number | **Computed: Procurement bucket time** |
| **opsTimeHours** | number | **Computed: Ops bucket time** |
| **totalDowntimeHours** | number | **Computed: Total downtime** |
| **internalCost** | number | **Simplified cost: Labor and man-hours** |
| **externalCost** | number | **Simplified cost: Vendor and third-party** |
| costLabor | number | Legacy cost field (preserved for compatibility) |
| costParts | number | Legacy cost field (preserved for compatibility) |
| costExternal | number | Legacy cost field (preserved for compatibility) |
| attachments | string[] | S3 keys for attached files |
| isLegacy | boolean | True for events without milestone fields |
| milestoneHistory | array | History of milestone changes |
| updatedBy | ObjectId | User who made the update |

**Three-Bucket Downtime Model:**
```typescript
// Technical Time = troubleshooting + installation
technicalTimeHours = (reportedAt → procurementRequestedAt) 
                   + (availableAtStoreAt → installationCompleteAt)

// Procurement Time = waiting for parts
procurementTimeHours = (procurementRequestedAt → availableAtStoreAt)

// Ops Time = operational testing
opsTimeHours = (testStartAt → upAndRunningAt)

// Total Downtime
totalDowntimeHours = (reportedAt → upAndRunningAt)
```

**Special Cases:**
- **No part needed**: Skip procurement milestones → procurementTimeHours = 0
- **Part in store**: availableAtStoreAt ≈ procurementRequestedAt → procurementTimeHours ≈ 0
- **No ops test**: Skip testStartAt → opsTimeHours = 0

**Business Rules:**
- clearedAt must be >= detectedAt (timestamp validation)
- Milestones must be in chronological order when present
- Active AOG = clearedAt is null
- responsibleParty is required for accountability tracking
- Computed metrics are stored on save for performance
- Legacy events (without milestone fields) show isLegacy = true

**Calculations:**
```typescript
// Downtime duration (legacy or when milestones not available)
downtimeHours = (clearedAt - detectedAt) / (1000 * 60 * 60);

// Total cost (simplified)
totalCost = (internalCost || 0) + (externalCost || 0);

// Active AOG count
activeAOGCount = count where clearedAt is null;

// Downtime by responsibility
downtimeByResponsibility = group by responsibleParty, sum(totalDowntimeHours);

// Three-bucket aggregation
bucketAnalytics = {
  technical: sum(technicalTimeHours),
  procurement: sum(procurementTimeHours),
  ops: sum(opsTimeHours)
};
```

**Indexes:**
- `{ aircraftId: 1, detectedAt: -1 }`
- `{ responsibleParty: 1, detectedAt: -1 }` - analytics
- `{ detectedAt: -1 }`
- `{ reportedAt: 1 }` - milestone queries

---

### 5. Maintenance Tasks

**Collection:** `maintenancetasks`

**Purpose:** Log shift-based maintenance activities with man-hours and costs.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| date | Date | Task date |
| shift | enum | Morning, Evening, Night, Other |
| taskType | string | Type of maintenance task |
| taskDescription | string | Detailed description |
| manpowerCount | number | Number of technicians |
| manHours | number | Total labor hours |
| cost | number | Task cost (optional) |
| workOrderRef | ObjectId | Reference to WorkOrder (optional) |
| updatedBy | ObjectId | User who made the update |

**Business Rules:**
- Tasks can optionally link to work orders
- manHours = manpowerCount × hours worked (typically)

**Aggregations:**
```typescript
// Summary by dimension
totalTasks = count();
totalManHours = sum(manHours);
totalCost = sum(cost);

// Group by: date, shift, aircraftId, taskType
// Top cost drivers: order by totalCost DESC
```

**Indexes:**
- `{ aircraftId: 1, date: -1 }`
- `{ date: -1 }`
- `{ date: -1, shift: 1 }`
- `{ taskType: 1, date: -1 }`

---

### 6. Work Orders

**Collection:** `workorders`

**Purpose:** Track formal maintenance work orders with status and turnaround time. (Historical/Read-only - see Work Order Summaries for current usage)

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| woNumber | string | Unique work order number |
| aircraftId | ObjectId | Reference to Aircraft |
| description | string | Work order description |
| status | enum | Open, InProgress, Closed, Deferred |
| dateIn | Date | Work order opened date |
| dateOut | Date | Work order closed date (optional) |
| dueDate | Date | Due date (optional) |
| crsNumber | string | Certificate of Release to Service number |
| mrNumber | string | Maintenance Release number |
| updatedBy | ObjectId | User who made the update |

**Business Rules:**
- woNumber must be unique
- Overdue = dueDate < today AND status !== 'Closed'

**Calculations:**
```typescript
// Turnaround time (for closed work orders)
turnaroundDays = (dateOut - dateIn) / (1000 * 60 * 60 * 24);

// Overdue detection
isOverdue = dueDate && dueDate < new Date() && status !== 'Closed';

// Status distribution
statusCounts = group by status, count();
```

**Indexes:**
- `{ woNumber: 1 }` - unique
- `{ aircraftId: 1, status: 1 }`
- `{ dueDate: 1, status: 1 }` - overdue detection

---

### 6a. Work Order Summaries (NEW)

**Collection:** `workordersummaries`

**Purpose:** Monthly aggregated work order counts per aircraft. Replaces granular work orders for KPI tracking.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| period | string | YYYY-MM format |
| workOrderCount | number | Number of work orders (>= 0) |
| totalCost | number | Total cost for the period (optional, >= 0) |
| currency | string | Currency code (default: USD) |
| notes | string | Additional notes (optional) |
| sourceRef | string | Reference to external system (optional) |
| updatedBy | ObjectId | User who made the update |

**Business Rules:**
- workOrderCount must be >= 0
- totalCost must be >= 0 if provided
- Upsert by (aircraftId, period) - updates existing record if found

**Calculations:**
```typescript
// Work order count trend
trendData = group by period, sum(workOrderCount);

// Total count for period range
totalCount = sum(workOrderCount) where period >= startPeriod AND period <= endPeriod;

// Total cost for period range
totalCost = sum(totalCost) where period >= startPeriod AND period <= endPeriod;
```

**Indexes:**
- `{ aircraftId: 1, period: 1 }` - unique compound index
- `{ period: -1 }` - date-range queries

---

### 7. Discrepancies

**Collection:** `discrepancies`

**Purpose:** Track defects and issues by ATA chapter for pattern analysis.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| dateDetected | Date | When discrepancy was found |
| ataChapter | string | ATA chapter code (e.g., "21", "32") |
| discrepancyText | string | Description of the issue |
| dateCorrected | Date | When fixed (optional) |
| correctiveAction | string | How it was fixed (optional) |
| responsibility | enum | Internal, OEM, Customs, Finance, Other |
| downtimeHours | number | Hours of downtime caused (optional) |
| updatedBy | ObjectId | User who made the update |

**Business Rules:**
- ATA chapters follow standard aviation classification
- Open discrepancy = dateCorrected is null

**Analytics:**
```typescript
// Top defect categories
defectsByATA = group by ataChapter, count();
// Order by count DESC to identify problem areas
```

**Indexes:**
- `{ ataChapter: 1 }` - analytics
- `{ aircraftId: 1, dateDetected: -1 }`

---

### 8. Budget Plans

**Collection:** `budgetplans`

**Purpose:** Store annual budget allocations by clause and aircraft group.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| fiscalYear | number | Budget year (e.g., 2025) |
| clauseId | number | Budget clause ID (1-18) |
| clauseDescription | string | Clause name |
| aircraftGroup | string | Aircraft group (A330, G650ER, Cessna, PMO) |
| plannedAmount | number | Budgeted amount |
| currency | string | Currency code (default: USD) |

**Budget Clauses (18 standard clauses):**
1. Aircraft Lease
2. Airframe Maintenance
3. Engines and APU Corporate Care Program
4. Landing Gear Overhaul
5. Component Repair
6. Spare Parts
7. Consumables
8. Ground Support Equipment
9. Fuel
10. Subscriptions
11. Insurance
12. Cabin Crew
13. Manpower
14. Handling and Permits
15. Catering
16. Communication
17. Miscellaneous
18. Training

**Indexes:**
- `{ fiscalYear: 1, clauseId: 1, aircraftGroup: 1 }` - unique
- `{ fiscalYear: 1 }`
- `{ clauseId: 1 }`

---

### 9. Actual Spend

**Collection:** `actualspends`

**Purpose:** Record actual expenditures for budget variance tracking.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| period | string | YYYY-MM format |
| aircraftGroup | string | Aircraft group (optional) |
| aircraftId | ObjectId | Specific aircraft (optional) |
| clauseId | number | Budget clause ID |
| amount | number | Spend amount |
| currency | string | Currency code (default: USD) |
| vendor | string | Vendor name (optional) |
| notes | string | Additional notes (optional) |
| updatedBy | ObjectId | User who made the update |

**Budget Calculations:**
```typescript
// Budget variance
variance = plannedAmount - actualAmount;
remainingBudget = max(0, variance);
utilizationPercentage = (actualAmount / plannedAmount) * 100;

// Burn rate
totalSpent = sum(amount) for fiscal year;
monthsWithData = count(distinct periods);
averageMonthlySpend = totalSpent / monthsWithData;
projectedMonthsRemaining = remainingBudget / averageMonthlySpend;

// Cost efficiency (requires utilization data)
costPerFlightHour = totalCost / totalFlightHours;
costPerCycle = totalCost / totalCycles;
```

**Indexes:**
- `{ period: 1, clauseId: 1 }`
- `{ aircraftGroup: 1, period: 1 }`
- `{ aircraftId: 1, period: 1 }`

---

### 10. Users & Authentication

**Collection:** `users`

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| email | string | Unique, lowercase |
| passwordHash | string | bcrypt hashed password |
| name | string | Display name |
| role | enum | Admin, Editor, Viewer |

**Role Permissions:**
| Role | Read | Create/Update | Delete | User Management |
|------|------|---------------|--------|-----------------|
| Viewer | ✓ | ✗ | ✗ | ✗ |
| Editor | ✓ | ✓ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ |

**Authentication Flow:**
1. POST `/api/auth/login` with email/password
2. Server validates credentials, returns JWT with { sub, email, role }
3. Frontend stores token in localStorage
4. All API requests include `Authorization: Bearer <token>`
5. Backend validates JWT and checks role permissions

---

### 11. Vacation Plans (NEW)

**Collection:** `vacationplans`

**Purpose:** Manage Engineering and TPL team vacation schedules with 48-week grid.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| year | number | Vacation plan year |
| team | enum | Engineering, TPL |
| employees | array | Array of VacationEmployee sub-documents |
| overlaps | string[48] | 'Ok' or 'Check' per week |
| updatedBy | ObjectId | User who made the update |

**VacationEmployee Sub-document:**
| Field | Type | Description |
|-------|------|-------------|
| name | string | Employee name |
| cells | number[48] | 48 weeks of vacation values (0, 0.5, 1, etc.) |
| total | number | Computed sum of cells |

**Business Rules:**
- Team must be 'Engineering' or 'TPL'
- Cells array must have exactly 48 elements (4 weeks × 12 months)
- Cell values must be numeric (reject non-numeric markers like "V")
- Total is computed as sum of all cell values
- Overlaps computed per week: 'Check' if more than one employee has value > 0

**Calculations:**
```typescript
// Employee total
employee.total = sum(employee.cells);

// Overlap detection (per team only)
for (weekIndex = 0; weekIndex < 48; weekIndex++) {
  count = employees.filter(e => e.cells[weekIndex] > 0).length;
  overlaps[weekIndex] = count > 1 ? 'Check' : 'Ok';
}
```

**Indexes:**
- `{ year: 1, team: 1 }` - unique compound index
- `{ year: -1 }` - year filtering

---

## Dashboard KPIs

The executive dashboard displays four primary KPIs plus advanced executive metrics:

### Primary KPIs

#### 1. Fleet Availability Percentage
```typescript
fleetAvailability = (totalFmcHours / totalPosHours) * 100;
// Aggregated across all aircraft for the selected period
```

#### 2. Total Flight Hours
```typescript
totalFlightHours = sum(airframeHoursTtsn deltas) for period;
// Calculated from daily counter differences
```

#### 3. Total Cycles
```typescript
totalCycles = sum(airframeCyclesTcsn deltas) for period;
// Calculated from daily counter differences
```

#### 4. Active AOG Count
```typescript
activeAOGCount = count(AOGEvents where clearedAt is null);
```

### Executive Dashboard Metrics

#### Fleet Health Score (0-100)
A composite metric combining multiple KPIs into a single actionable number:
```typescript
Fleet Health Score = (
  Availability Score × 0.45 +
  AOG Impact Score × 0.30 +
  Budget Health Score × 0.25
)

Where:
- Availability Score = Fleet Availability % (capped at 100)
- AOG Impact Score = 100 - (Active AOG Count × 10), min 0
- Budget Health Score = 100 - Budget Utilization %, min 0 (under budget = 100)
```

**Note:** The Maintenance Efficiency Score component (based on overdue work orders) has been removed as the system now uses Work Order Summaries instead of detailed work orders. The weights have been redistributed accordingly.

**Status Thresholds:**
- 90-100: Healthy (green)
- 70-89: Caution (yellow)
- Below 70: Warning (amber/red)

#### Operational Efficiency Metrics

**MTBF (Mean Time Between Failures):**
```typescript
mtbf = totalOperatingHours / numberOfFailures;
// Calculated from AOG events in the selected period
```

**MTTR (Mean Time To Repair):**
```typescript
mttr = sum(clearedAt - detectedAt) / numberOfResolvedAOGs;
// Warning displayed if MTTR > 24 hours
```

**Dispatch Reliability:**
```typescript
dispatchReliability = (flightsWithoutTechnicalDelay / totalFlights) * 100;
// Based on daily status data
```

#### Cost Efficiency Metrics
```typescript
costPerFlightHour = totalMaintenanceCost / totalFlightHours;
costPerCycle = totalMaintenanceCost / totalCycles;
```

### Alert Priority Levels

| Level | Color | Trigger Conditions |
|-------|-------|-------------------|
| Critical | Red | Active AOG events, Aircraft availability < 70% |
| Warning | Amber | Budget > 90%, Availability < 85% |
| Info | Blue | Upcoming maintenance due within 7 days |

---

## API Endpoint Reference

### Authentication
- `POST /api/auth/login` - Login, returns JWT
- `POST /api/auth/register` - Create user (Admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List all users (Admin only)

### Aircraft
- `GET /api/aircraft` - List aircraft (filterable)
- `POST /api/aircraft` - Create aircraft
- `GET /api/aircraft/:id` - Get single aircraft
- `PUT /api/aircraft/:id` - Update aircraft
- `DELETE /api/aircraft/:id` - Delete aircraft

### Utilization
- `GET /api/utilization` - List daily counters
- `POST /api/utilization` - Create daily counter
- `GET /api/utilization/aggregations` - Get aggregated data
- `GET /api/utilization/:id` - Get single counter
- `PUT /api/utilization/:id` - Update counter
- `DELETE /api/utilization/:id` - Delete counter

### Daily Status
- `GET /api/daily-status` - List daily status
- `POST /api/daily-status` - Create daily status
- `GET /api/daily-status/availability` - Get availability metrics
- `GET /api/daily-status/aggregations` - Get aggregated availability

### AOG Events (Simplified Model)
- `GET /api/aog-events` - List AOG events (filterable)
- `POST /api/aog-events` - Create AOG event with optional milestone timestamps
- `GET /api/aog-events/analytics` - Get analytics by responsibility
- `GET /api/aog-events/analytics/buckets` - **Get three-bucket downtime breakdown**
- `GET /api/aog-events/analytics/monthly-trend` - **Get monthly event count and downtime trends (NEW)**
- `GET /api/aog-events/analytics/insights` - **Get automated insights and recommendations (NEW)**
- `GET /api/aog-events/analytics/forecast` - **Get predictive analytics for future downtime (NEW)**
- `GET /api/aog-events/analytics/reliability` - **Get aircraft reliability scores and rankings (NEW)**
- `GET /api/aog-events/active` - Get active AOG events
- `GET /api/aog-events/active/count` - Get count of active AOG events
- `GET /api/aog-events/:id` - Get single event with computed metrics
- `PUT /api/aog-events/:id` - Update event (recomputes metrics on milestone changes)
- `DELETE /api/aog-events/:id` - Delete event
- `POST /api/aog-events/:id/attachments` - Add attachment
- `DELETE /api/aog-events/:id/attachments/:s3Key` - Remove attachment

### Maintenance Tasks
- `GET /api/maintenance-tasks` - List tasks
- `POST /api/maintenance-tasks` - Create task
- `GET /api/maintenance-tasks/summary` - Get summary stats
- `GET /api/maintenance-tasks/:id` - Get single task
- `PUT /api/maintenance-tasks/:id` - Update task
- `DELETE /api/maintenance-tasks/:id` - Delete task

### Work Orders
- `GET /api/work-orders` - List work orders (historical/read-only)
- `POST /api/work-orders` - Create work order
- `GET /api/work-orders/:id` - Get single work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Work Order Summaries (NEW)
- `GET /api/work-order-summaries` - List summaries (filterable by aircraft, fleet group, period)
- `POST /api/work-order-summaries` - Create/upsert summary
- `GET /api/work-order-summaries/trends` - Get trend data by period
- `GET /api/work-order-summaries/total` - Get total count for period range
- `GET /api/work-order-summaries/:id` - Get single summary
- `PUT /api/work-order-summaries/:id` - Update summary
- `DELETE /api/work-order-summaries/:id` - Delete summary (Admin only)

### Discrepancies
- `GET /api/discrepancies` - List discrepancies
- `POST /api/discrepancies` - Create discrepancy
- `GET /api/discrepancies/analytics` - Get ATA chapter analytics
- `GET /api/discrepancies/:id` - Get single discrepancy
- `PUT /api/discrepancies/:id` - Update discrepancy
- `DELETE /api/discrepancies/:id` - Delete discrepancy

### Budget
- `GET /api/budget-plans` - List budget plans
- `POST /api/budget-plans` - Create budget plan
- `POST /api/budget-plans/clone` - Clone budget plans from previous year
- `GET /api/actual-spend` - List actual spend
- `POST /api/actual-spend` - Create actual spend
- `GET /api/budget/variance` - Get budget variance
- `GET /api/budget/burn-rate` - Get burn rate analysis

### Vacation Plans (NEW)
- `GET /api/vacation-plans` - List plans (filterable by year, team)
- `POST /api/vacation-plans` - Create plan
- `GET /api/vacation-plans/:id` - Get single plan
- `PUT /api/vacation-plans/:id` - Bulk update plan
- `DELETE /api/vacation-plans/:id` - Delete plan (Admin only)
- `PATCH /api/vacation-plans/:id/cell` - Update single cell
- `POST /api/vacation-plans/:id/employees` - Add employee
- `DELETE /api/vacation-plans/:id/employees/:name` - Remove employee
- `GET /api/vacation-plans/:id/export` - Export to Excel
- `GET /api/vacation-plans/export/year/:year` - Export all plans for year
- `POST /api/vacation-plans/import` - Import from Excel

### Dashboard
- `GET /api/dashboard/kpis` - Get KPI summary
- `GET /api/dashboard/trends` - Get trend data
- `GET /api/dashboard/health-score` - Get Fleet Health Score with component breakdown
- `GET /api/dashboard/alerts` - Get categorized executive alerts
- `GET /api/dashboard/period-comparison` - Get current vs previous period KPIs
- `GET /api/dashboard/cost-efficiency` - Get cost per flight hour and cost per cycle
- `GET /api/dashboard/fleet-comparison` - Get top/bottom performers by availability
- `GET /api/dashboard/operational-efficiency` - Get MTBF, MTTR, dispatch reliability
- `GET /api/dashboard/maintenance-forecast` - Get upcoming scheduled maintenance
- `GET /api/dashboard/recent-activity` - Get last 10 system events
- `GET /api/dashboard/insights` - Get automatically generated insights
- `GET /api/dashboard/yoy-comparison` - Get year-over-year metric comparisons
- `GET /api/dashboard/defect-patterns` - Get top ATA chapters by discrepancy count
- `GET /api/dashboard/data-quality` - Get data freshness and completeness metrics

### Import/Export
- `GET /api/import/template/:type` - Download Excel template
- `POST /api/import/upload` - Upload Excel file
- `GET /api/export/:type` - Export data to Excel

---

## Frontend Architecture

### Page Structure
| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Authentication |
| `/` | DashboardPage | Executive KPI overview |
| `/availability` | AvailabilityPage | Fleet availability details |
| `/aircraft/:id` | AircraftDetailPage | Single aircraft deep dive |
| `/maintenance` | MaintenancePage | Maintenance task logging |
| `/aog-events` | AOGEventsPage | AOG tracking (redirects to /aog/list) |
| `/aog/list` | AOGListPage | AOG list with workflow status |
| `/aog/log` | AOGLogPage | AOG event log |
| `/aog/analytics` | AOGAnalyticsPage | AOG analytics and bottlenecks |
| `/aog/:id` | AOGDetailPage | AOG detail with workflow UI |
| `/work-orders` | WorkOrderSummaryPage | Work order monthly summaries |
| `/work-orders/historical` | WorkOrdersListPage | Historical work orders (read-only) |
| `/discrepancies` | DiscrepanciesPage | Defect tracking |
| `/budget` | BudgetPage | Budget vs actual |
| `/vacation-plan` | VacationPlanPage | Team vacation schedules |
| `/import` | ImportPage | Excel upload |
| `/admin` | AdminPage | User management |
| `/help` | HelpCenterPage | Help and documentation |

### Custom Hooks
- `useAuth` - Authentication context
- `useAircraft` - Aircraft CRUD operations
- `useUtilization` - Utilization data
- `useDailyStatus` - Daily status and availability
- `useAOGEvents` - AOG event management with workflow operations
- `useMaintenance` - Maintenance tasks
- `useWorkOrders` - Work order management (historical)
- `useWorkOrderSummaries` - Work order summary CRUD and trends
- `useDiscrepancies` - Discrepancy tracking
- `useBudget` - Budget operations including clone
- `useVacationPlans` - Vacation plan CRUD and cell updates
- `useDashboard` - Dashboard KPIs and trends
- `useDashboardExecutive` - Executive dashboard metrics (health score, alerts, comparisons, etc.)
- `useImportExport` - Excel import/export

### Executive Dashboard Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `FleetHealthGauge` | `components/ui/FleetHealthGauge.tsx` | Circular gauge showing 0-100 score |
| `AlertsPanel` | `components/ui/AlertsPanel.tsx` | Categorized alerts with priority indicators |
| `StatusSummaryBar` | `components/ui/StatusSummaryBar.tsx` | Horizontal fleet status distribution |
| `KPICardEnhanced` | `components/ui/KPICardEnhanced.tsx` | KPI card with sparkline and delta |
| `FleetComparison` | `components/ui/FleetComparison.tsx` | Top/bottom performers display |
| `CostEfficiencyCard` | `components/ui/CostEfficiencyCard.tsx` | Cost per FH/cycle display |
| `OperationalEfficiencyPanel` | `components/ui/OperationalEfficiencyPanel.tsx` | MTBF, MTTR, dispatch reliability |
| `MaintenanceForecast` | `components/ui/MaintenanceForecast.tsx` | Upcoming maintenance list |
| `RecentActivityFeed` | `components/ui/RecentActivityFeed.tsx` | Chronological event list |
| `InsightsPanel` | `components/ui/InsightsPanel.tsx` | Automated observations display |
| `YoYComparison` | `components/ui/YoYComparison.tsx` | Year-over-year metrics |
| `DefectPatterns` | `components/ui/DefectPatterns.tsx` | Top ATA chapters visualization |
| `DataQualityIndicator` | `components/ui/DataQualityIndicator.tsx` | Data freshness badge |
| `ExecutivePDFExport` | `components/ui/ExecutivePDFExport.tsx` | PDF report generation |
| `CollapsibleSection` | `components/ui/CollapsibleSection.tsx` | Collapsible dashboard sections |

### AOG Components (Simplified Model)
| Component | Location | Purpose |
|-----------|----------|---------|
| `MilestoneTimeline` | `components/aog/MilestoneTimeline.tsx` | Vertical timeline of milestone timestamps |
| `MilestoneEditForm` | `components/aog/MilestoneEditForm.tsx` | Edit milestone timestamps with validation |
| `ThreeBucketChart` | `components/ui/ThreeBucketChart.tsx` | Three-bucket downtime visualization |
| `AttachmentsTab` | `components/aog/AttachmentsTab.tsx` | Document management |

### Vacation Plan Components (NEW)
| Component | Location | Purpose |
|-----------|----------|---------|
| `VacationPlanGrid` | `components/vacation/VacationPlanGrid.tsx` | 48-week editable grid with overlap detection |

### State Management
- TanStack Query for server state
- React Context for auth state
- Local state for UI interactions
- Query invalidation for data refresh after mutations

---

## Seed Data Reference

### Default Users
| Email | Password | Role |
|-------|----------|------|
| admin@alphastarav.com | Admin@123! | Admin |
| editor@alphastarav.com | Editor@123! | Editor |
| viewer@alphastarav.com | Viewer@123! | Viewer |

### Fleet Groups
- A340 (4-engine wide-body)
- A330 (2-engine wide-body)
- A320/A319/A318 (narrow-body family)
- G650ER (Gulfstream business jet)
- Hawker (Hawker 900XP business jet)
- Cessna (Citation Bravo)

### Owners
- Alpha Star Aviation
- Sky Prime Aviation
- RSAF (Royal Saudi Air Force)

---

## Key Business Logic Locations

| Logic | Backend Location | Frontend Location |
|-------|------------------|-------------------|
| Availability calculation | `daily-status/services/daily-status.service.ts` | `hooks/useDailyStatus.ts` |
| Utilization aggregation | `utilization/services/utilization.service.ts` | `hooks/useUtilization.ts` |
| Budget variance | `budget/services/budget.service.ts` | `hooks/useBudget.ts` |
| Dashboard KPIs | `dashboard/services/dashboard.service.ts` | `hooks/useDashboard.ts` |
| Fleet Health Score | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| Executive Alerts | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| Operational Efficiency (MTBF/MTTR) | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| Cost Efficiency | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| Fleet Comparison | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| Defect Patterns | `dashboard/services/dashboard.service.ts` | `hooks/useDashboardExecutive.ts` |
| AOG analytics | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| AOG three-bucket analytics | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| AOG downtime computation | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| **AOG monthly trend analytics (NEW)** | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| **AOG insights generation (NEW)** | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| **AOG forecast prediction (NEW)** | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| **AOG reliability scoring (NEW)** | `aog-events/services/aog-events.service.ts` | `lib/reliabilityScore.ts` |
| **AOG risk scoring (NEW)** | `aog-events/services/aog-events.service.ts` | `lib/riskScore.ts` |
| **AOG cost analysis (NEW)** | `aog-events/services/aog-events.service.ts` | `lib/costAnalysis.ts` |
| Work order summaries | `work-order-summaries/services/work-order-summaries.service.ts` | `hooks/useWorkOrderSummaries.ts` |
| Work order trends | `work-order-summaries/services/work-order-summaries.service.ts` | `hooks/useWorkOrderSummaries.ts` |
| Vacation plan management | `vacation-plans/services/vacation-plans.service.ts` | `hooks/useVacationPlans.ts` |
| Vacation overlap detection | `vacation-plans/services/vacation-plans.service.ts` | `hooks/useVacationPlans.ts` |
| Work order overdue | `work-orders/services/work-orders.service.ts` | `hooks/useWorkOrders.ts` |
| Excel parsing | `import-export/services/excel-parser.service.ts` | `hooks/useImportExport.ts` |
| Authentication | `auth/services/auth.service.ts` | `contexts/AuthContext.tsx` |

---

## Common Adjustment Scenarios

### Adding a New Budget Clause
1. Add to `BUDGET_CLAUSES` array in `seed.ts`
2. Add amounts to `BUDGET_AMOUNTS` object
3. Re-run seed or manually add via API

### Adding a New Aircraft
1. Use POST `/api/aircraft` or add to `AIRCRAFT_DATA` in `seed.ts`
2. Ensure unique registration
3. Set appropriate fleetGroup and enginesCount

### Modifying Availability Calculation
1. Edit `computeAvailability()` in `daily-status.service.ts`
2. Update `getAggregatedAvailability()` for period aggregations
3. Verify dashboard service uses updated calculations

### Adding a New Role
1. Add to `UserRole` enum in `user.schema.ts`
2. Update `RolesGuard` in `auth/guards/roles.guard.ts`
3. Add role checks to relevant controllers
4. Update frontend route protection in `ProtectedRoute.tsx`

### Changing KPI Formulas
1. Locate calculation in relevant service (see table above)
2. Update formula
3. Verify dashboard service aggregations
4. Update frontend display if needed


---

## AOG Analytics Enhancement (NEW)

### Overview

The AOG Analytics page has been enhanced with 10+ visualizations, predictive analytics, and automated insights. This section documents the new analytics calculations and algorithms.

### New Analytics Endpoints

#### 1. Monthly Trend Analytics

**Endpoint:** `GET /api/aog-events/analytics/monthly-trend`

**Purpose:** Provide monthly event count and downtime trends with 3-month moving average.

**Calculation:**
```typescript
// Group events by month
monthlyData = events.groupBy(e => format(e.detectedAt, 'yyyy-MM'));

// Calculate metrics per month
for each month:
  eventCount = count of events in month
  totalDowntimeHours = sum of totalDowntimeHours
  averageDowntimeHours = totalDowntimeHours / eventCount

// Calculate 3-month moving average
for each month (starting from month 3):
  movingAverage = (month[i] + month[i-1] + month[i-2]) / 3
```

#### 2. Automated Insights Generation

**Endpoint:** `GET /api/aog-events/analytics/insights`

**Purpose:** Generate automated insights and recommendations based on AOG patterns.

**Insight Algorithms:**

1. **High Procurement Time**
   - Trigger: Procurement time > 50% of total downtime
   - Priority: Warning
   - Recommendation: Review supplier contracts and inventory levels

2. **Recurring Issues**
   - Trigger: Same reason code appears 3+ times in 30 days
   - Priority: Warning
   - Recommendation: Consider root cause analysis and preventive maintenance

3. **Cost Spike**
   - Trigger: Current month cost > 150% of 3-month average
   - Priority: Warning
   - Recommendation: Review recent high-cost events

4. **Improving Trend**
   - Trigger: Downtime decreased by >20% vs previous period
   - Priority: Success
   - Recommendation: Document successful practices for replication

5. **Data Quality Issue**
   - Trigger: >30% of events are legacy (no milestones)
   - Priority: Info
   - Recommendation: Update recent events with milestone data

6. **Aircraft at Risk**
   - Trigger: Aircraft risk score > 70
   - Priority: Warning
   - Recommendation: Schedule preventive maintenance review

7. **Seasonal Pattern**
   - Trigger: Consistent pattern across years
   - Priority: Info
   - Recommendation: Plan additional resources for peak periods

8. **Bottleneck Identified**
   - Trigger: One bucket consistently >60% of total time
   - Priority: Info
   - Recommendation: Focus improvement efforts on specific area

#### 3. Forecast Prediction

**Endpoint:** `GET /api/aog-events/analytics/forecast`

**Purpose:** Predict future downtime using linear regression.

**Algorithm:**
```typescript
// Simple Linear Regression
// y = mx + b
// where: y = predicted downtime hours, x = month index

// Calculate slope (m) and intercept (b)
n = number of historical months (minimum 6)
sumX = sum of month indices (0, 1, 2, ...)
sumY = sum of downtime hours
sumXY = sum of (month index × downtime hours)
sumX2 = sum of (month index²)

slope = (n × sumXY - sumX × sumY) / (n × sumX2 - sumX²)
intercept = (sumY - slope × sumX) / n

// Generate forecast for next N months
for each future month i:
  predicted = slope × (lastIndex + i) + intercept
  confidenceInterval = predicted × 0.20 // ±20%
  lower = max(0, predicted - confidenceInterval)
  upper = predicted + confidenceInterval
```

#### 4. Reliability Score Calculation

**Purpose:** Rank aircraft by reliability (0-100, higher is better).

**Formula:**
```typescript
reliabilityScore = 100 - min(100, (eventCount × 5) + (totalDowntimeHours / 10))

// Trend calculation (compare to previous period)
if (currentScore - previousScore > 5):
  trend = 'improving'
else if (previousScore - currentScore > 5):
  trend = 'declining'
else:
  trend = 'stable'
```

**Interpretation:**
- 90-100: Excellent (green)
- 70-89: Good (blue)
- 50-69: Fair (amber)
- <50: Poor (red)

#### 5. Risk Score Calculation

**Purpose:** Predict aircraft at risk of future events (0-100, higher = higher risk).

**Formula:**
```typescript
riskScore = (
  recentEventFrequency × 0.40 +
  averageDowntimeTrend × 0.30 +
  costTrend × 0.20 +
  recurringIssues × 0.10
) × 100

// Component calculations:
recentEventFrequency = (eventsLast30Days / averageEventsPerMonth) - 1
averageDowntimeTrend = (currentAvgDowntime / previousAvgDowntime) - 1
costTrend = (currentAvgCost / previousAvgCost) - 1
recurringIssues = count of reason codes appearing 2+ times / totalEvents
```

**Risk Zones:**
- 0-30: Low risk (green)
- 31-60: Medium risk (amber)
- 61-100: High risk (red)

#### 6. Cost Analysis Calculations

**Cost per Hour:**
```typescript
costPerHour = totalCost / totalDowntimeHours
```

**Cost per Event:**
```typescript
costPerEvent = totalCost / totalEvents
```

**Cost Efficiency Trend:**
```typescript
// Calculate for last 6 months
for each month:
  monthlyCostPerHour = monthCost / monthDowntimeHours
  
// Trend indicator
if (currentMonth < previousMonth):
  trend = 'improving' (green)
else if (currentMonth > previousMonth):
  trend = 'declining' (red)
else:
  trend = 'stable' (gray)
```

### Frontend Components

#### New Chart Components

| Component | Location | Purpose |
|-----------|----------|---------|
| BucketTrendChart | `components/ui/BucketTrendChart.tsx` | Stacked area chart for bucket trends over time |
| WaterfallChart | `components/ui/WaterfallChart.tsx` | Waterfall chart showing downtime composition |
| MonthlyTrendChart | `components/ui/MonthlyTrendChart.tsx` | Combo chart (bars + line) for monthly trends |
| MovingAverageChart | `components/ui/MovingAverageChart.tsx` | Line chart with 3-month moving average |
| YearOverYearChart | `components/ui/YearOverYearChart.tsx` | Grouped bar chart comparing years |
| AircraftHeatmap | `components/ui/AircraftHeatmap.tsx` | Grid heatmap showing aircraft × months |
| ReliabilityScoreCards | `components/ui/ReliabilityScoreCards.tsx` | Top 5 reliable and needs attention aircraft |
| ParetoChart | `components/ui/ParetoChart.tsx` | Combo chart for reason code analysis |
| CategoryBreakdownPie | `components/ui/CategoryBreakdownPie.tsx` | Pie chart for AOG/Unscheduled/Scheduled |
| ResponsibilityDistributionChart | `components/ui/ResponsibilityDistributionChart.tsx` | Horizontal bar chart by responsible party |
| CostBreakdownChart | `components/ui/CostBreakdownChart.tsx` | Stacked bar chart with trend line |
| CostEfficiencyMetrics | `components/ui/CostEfficiencyMetrics.tsx` | Cost per hour and cost per event cards |
| ForecastChart | `components/ui/ForecastChart.tsx` | Line chart with confidence interval |
| RiskScoreGauge | `components/ui/RiskScoreGauge.tsx` | Radial gauge for risk assessment |
| InsightsPanel | `components/ui/InsightsPanel.tsx` | Card-based layout for automated insights |
| AOGDataQualityIndicator | `components/ui/AOGDataQualityIndicator.tsx` | Badge showing data completeness |
| EnhancedAOGAnalyticsPDFExport | `components/ui/EnhancedAOGAnalyticsPDFExport.tsx` | Multi-page PDF export with all sections |

#### Utility Functions

| Function | Location | Purpose |
|----------|----------|---------|
| calculateReliabilityScore | `lib/reliabilityScore.ts` | Calculate aircraft reliability score |
| calculateRiskScore | `lib/riskScore.ts` | Calculate aircraft risk score |
| calculateCostPerHour | `lib/costAnalysis.ts` | Calculate cost efficiency metrics |
| calculateCostPerEvent | `lib/costAnalysis.ts` | Calculate cost per event |
| sampleData | `lib/sampleData.ts` | Sample large datasets for performance |

### Performance Optimizations

#### Backend Optimizations

1. **MongoDB Indexing:**
   - `{ detectedAt: -1 }` - Date range queries
   - `{ aircraftId: 1, detectedAt: -1 }` - Aircraft filtering
   - `{ reportedAt: 1 }` - Milestone queries
   - `{ responsibleParty: 1, detectedAt: -1 }` - Responsibility analytics

2. **Aggregation Pipeline Optimization:**
   - Match early to reduce documents processed
   - Project only needed fields
   - Use $facet for multiple aggregations in one query
   - Limit results when possible

3. **Caching:**
   - Server-side caching with 5-minute TTL
   - Cache invalidation on AOG event create/update/delete
   - TanStack Query client-side caching

#### Frontend Optimizations

1. **Progressive Loading:**
   - Priority 1: Critical data (summary cards, bucket analytics)
   - Priority 2: Important visualizations (trends, aircraft performance)
   - Priority 3: Nice-to-have analytics (forecast, insights)

2. **Data Sampling:**
   - Sample large datasets to max 100 points for charts
   - Preserve distribution using systematic sampling

3. **Memoization:**
   - Memoize expensive calculations (reliability scores, cost analysis)
   - Memoize data transformations for charts

4. **Code Splitting:**
   - Lazy load heavy chart components
   - Use Suspense with loading skeletons

### PDF Export Enhancement

The enhanced PDF export generates a professional multi-page report:

**Pages Included:**
1. Cover Page - Title, date range, filters, timestamp
2. Executive Summary - Key metrics and top 5 insights
3. Three-Bucket Analysis - All charts and per-aircraft breakdown
4. Trend Analysis - Monthly trends, moving averages, YoY comparison
5. Aircraft Performance - Heatmap and reliability scores
6. Root Cause Analysis - Pareto chart, category breakdown, responsibility
7. Cost Analysis - Cost breakdown and efficiency metrics
8. Predictive Analytics - Forecast chart, risk scores, insights

**Technical Implementation:**
- Uses jsPDF + html2canvas for generation
- Captures charts at 2x scale for high resolution (300 DPI)
- Handles multi-page sections with content overflow
- Adds page numbers and footers to all pages
- Generation time: 10-15 seconds for full report

### Data Quality Handling

**Legacy Events:**
- Events without milestone timestamps are flagged as `isLegacy: true`
- Show total downtime only (clearedAt - detectedAt)
- Cannot provide three-bucket breakdown
- Display "Limited Analytics" badge in UI

**Data Completeness:**
- Calculate: (eventsWithMilestones / totalEvents) × 100
- Color coding: Green (>80%), Amber (50-80%), Red (<50%)
- Displayed prominently at top of analytics page

**Fallback Metrics:**
- `reportedAt` defaults to `detectedAt` if missing
- `upAndRunningAt` defaults to `clearedAt` if missing
- Bucket times computed only when both endpoints available

### Related Documentation

- **AOG Analytics API Documentation** - Comprehensive API reference
- **AOG Analytics User Guide** - End-user documentation
- **AOG Analytics Developer Guide** - Technical implementation guide
- **AOG Analytics Enhancement Requirements** - Original requirements
- **AOG Analytics Enhancement Design** - Detailed design document

---

