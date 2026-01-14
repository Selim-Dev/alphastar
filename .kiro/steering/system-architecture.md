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

### 4. AOG Events (Aircraft On Ground)

**Collection:** `aogevents`

**Purpose:** Track grounding events with responsibility attribution, workflow status, and procurement lifecycle.

**Schema Fields:**
| Field | Type | Description |
|-------|------|-------------|
| aircraftId | ObjectId | Reference to Aircraft |
| detectedAt | Date | When AOG was detected |
| clearedAt | Date | When AOG was cleared (null = still active) |
| category | enum | scheduled, unscheduled, aog |
| reasonCode | string | Reason for grounding |
| responsibleParty | enum | Internal, OEM, Customs, Finance, Other |
| actionTaken | string | Description of corrective action |
| manpowerCount | number | Number of personnel involved |
| manHours | number | Total labor hours |
| costLabor | number | Labor cost (optional) |
| costParts | number | Parts cost (optional) |
| costExternal | number | External services cost (optional) |
| currentStatus | enum | Workflow status (default: REPORTED) |
| blockingReason | enum | Finance, Port, Customs, Vendor, Ops, Other |
| statusHistory | array | Append-only timeline of status transitions |
| partRequests | array | Part requests within the AOG event |
| estimatedCostLabor | number | Estimated labor cost |
| estimatedCostParts | number | Estimated parts cost |
| estimatedCostExternal | number | Estimated external cost |
| budgetClauseId | number | Budget clause mapping |
| budgetPeriod | string | YYYY-MM format |
| isBudgetAffecting | boolean | Whether costs affect budget variance |
| linkedActualSpendId | ObjectId | Reference to generated ActualSpend |
| costAuditTrail | array | Audit trail for cost changes |
| attachmentsMeta | array | Enhanced attachment metadata |
| attachments | string[] | S3 keys for attached files |
| isLegacy | boolean | True for events without workflow status |
| updatedBy | ObjectId | User who made the update |

**Workflow Status Values (AOGWorkflowStatus):**
- REPORTED, TROUBLESHOOTING, ISSUE_IDENTIFIED, RESOLVED_NO_PARTS
- PART_REQUIRED, PROCUREMENT_REQUESTED, FINANCE_APPROVAL_PENDING
- ORDER_PLACED, IN_TRANSIT, AT_PORT, CUSTOMS_CLEARANCE
- RECEIVED_IN_STORES, ISSUED_TO_MAINTENANCE, INSTALLED_AND_TESTED
- ENGINE_RUN_REQUESTED, ENGINE_RUN_COMPLETED, BACK_IN_SERVICE, CLOSED

**Blocking Reason Values:**
- Finance, Port, Customs, Vendor, Ops, Other

**Part Request Status Values:**
- REQUESTED, APPROVED, ORDERED, SHIPPED, RECEIVED, ISSUED

**Business Rules:**
- clearedAt must be >= detectedAt (timestamp validation)
- Active AOG = clearedAt is null
- responsibleParty is required for accountability tracking
- Blocking reason required for statuses: FINANCE_APPROVAL_PENDING, AT_PORT, CUSTOMS_CLEARANCE, IN_TRANSIT
- Status transitions must follow allowed transition map
- Terminal statuses (BACK_IN_SERVICE, CLOSED) auto-set clearedAt if not set
- Legacy events (without currentStatus) infer status at read time

**Calculations:**
```typescript
// Downtime duration
downtimeHours = (clearedAt - detectedAt) / (1000 * 60 * 60); // milliseconds to hours

// Total cost
totalCost = (costLabor || 0) + (costParts || 0) + (costExternal || 0);

// Active AOG count
activeAOGCount = count where clearedAt is null;

// Downtime by responsibility
downtimeByResponsibility = group by responsibleParty, sum(downtimeHours);

// Total parts cost from part requests
totalPartsCost = sum(partRequests.actualCost);

// Legacy status inference
if (!currentStatus) {
  currentStatus = clearedAt ? 'BACK_IN_SERVICE' : 'REPORTED';
  isLegacy = true;
}
```

**Indexes:**
- `{ aircraftId: 1, detectedAt: -1 }`
- `{ responsibleParty: 1, detectedAt: -1 }` - analytics
- `{ detectedAt: -1 }`
- `{ currentStatus: 1, detectedAt: -1 }` - workflow queries
- `{ blockingReason: 1, currentStatus: 1 }` - blocking analytics

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
| Warning | Amber | AOG events in blocking states, Budget > 90%, Availability < 85% |
| Info | Blue | Upcoming maintenance due within 7 days |

**Note:** Overdue work order alerts have been removed as the system now uses Work Order Summaries. AOG blocking state alerts have been added to track events stuck in waiting states (Finance, Port, Customs, Vendor, Ops).

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

### AOG Events
- `GET /api/aog-events` - List AOG events (filterable by status, blocking reason)
- `POST /api/aog-events` - Create AOG event
- `GET /api/aog-events/analytics` - Get analytics by responsibility
- `GET /api/aog-events/analytics/stages` - Get stage breakdown by workflow status
- `GET /api/aog-events/analytics/bottlenecks` - Get average time in each status
- `GET /api/aog-events/active` - Get active AOG events
- `GET /api/aog-events/active/count` - Get count of active AOG events
- `GET /api/aog-events/:id` - Get single event
- `PUT /api/aog-events/:id` - Update event
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

### AOG Workflow Components (NEW)
| Component | Location | Purpose |
|-----------|----------|---------|
| `StatusTimeline` | `components/aog/StatusTimeline.tsx` | Vertical timeline of status history |
| `NextStepActionPanel` | `components/aog/NextStepActionPanel.tsx` | Available transitions with role-aware controls |
| `PartsTab` | `components/aog/PartsTab.tsx` | Part request management |
| `CostsTab` | `components/aog/CostsTab.tsx` | Cost tracking with budget integration |
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
| AOG workflow transitions | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
| AOG stage/bottleneck analytics | `aog-events/services/aog-events.service.ts` | `hooks/useAOGEvents.ts` |
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
