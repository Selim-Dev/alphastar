# Alpha Star Aviation KPIs Dashboard - Data Requirements Document

## Executive Summary

This document provides a comprehensive guide to all data models, required fields, validation rules, and data entry sequences for the Alpha Star Aviation KPIs Dashboard system. It serves as the authoritative reference for understanding what data needs to be entered, in what format, and in what order.

## Table of Contents

1. Data Entry Sequence & Dependencies
2. Core Data Models (12 Collections)
3. Field Validation Rules
4. Seed Data Reference
5. Import/Export Formats
6. Data Quality Standards

---

## 1. Data Entry Sequence & Dependencies

### Dependency Chain (Enter in this order):

```
1. Users (Authentication)
   ↓
2. Aircraft (Master Data)
   ↓
3. Budget Plans (Annual Planning)
   ↓
4. Daily Status (Availability Tracking) ← Requires Aircraft
   ↓
5. Daily Counters (Utilization) ← Requires Aircraft
   ↓
6. AOG Events ← Requires Aircraft
   ↓
7. Maintenance Tasks ← Requires Aircraft
   ↓
8. Work Orders ← Requires Aircraft
   ↓
9. Work Order Summaries ← Requires Aircraft
   ↓
10. Discrepancies ← Requires Aircraft
    ↓
11. Actual Spend ← Requires Budget Plans
    ↓
12. Vacation Plans (Independent)
```

### Why This Order Matters:

- **Users first**: Required for audit trail (`updatedBy` field)
- **Aircraft second**: All operational data references aircraft
- **Budget Plans third**: Needed for budget variance calculations
- **Operational data**: Daily Status, Counters, AOG, Maintenance, Work Orders
- **Actual Spend last**: Requires both Aircraft and Budget Plans
- **Vacation Plans**: Can be entered independently



---

## 2. Core Data Models (12 Collections)

### 2.1 Users Collection

**Purpose**: Authentication and role-based access control

**Required Fields**:
| Field | Type | Format | Validation | Example |
|-------|------|--------|-----------|---------|
| email | string | Email | Unique, lowercase | admin@alphastarav.com |
| passwordHash | string | bcrypt | Min 60 chars | $2b$10$... |
| name | string | Text | 1-100 chars | System Administrator |
| role | enum | UserRole | Admin, Editor, Viewer | Admin |

**Default Users** (Pre-seeded):
```
Admin:   admin@alphastarav.com / Admin@123!
Editor:  editor@alphastarav.com / Editor@123!
Viewer:  viewer@alphastarav.com / Viewer@123!
```

**Role Permissions**:
| Role | Read | Create/Update | Delete | User Mgmt |
|------|------|---------------|--------|-----------|
| Viewer | ✓ | ✗ | ✗ | ✗ |
| Editor | ✓ | ✓ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ |

---

### 2.2 Aircraft Collection

**Purpose**: Master data for all aircraft in the fleet

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| registration | string | UPPERCASE, unique | HZ-A42 | Tail number |
| fleetGroup | string | Enum | A340, A330, A320, A319, A318, G650ER, Hawker, Cessna | Fleet category |
| aircraftType | string | Text | A340-642 | Specific model |
| msn | string | Text | 1015 | Manufacturer Serial Number |
| owner | string | Enum | Alpha Star Aviation, Sky Prime Aviation, RSAF | Owner entity |
| manufactureDate | date | ISO 8601 | 2010-01-15 | Used for age calculations |
| enginesCount | number | 2 or 4 | 4 | Determines engine fields required |
| status | enum | active, parked, leased | active | Aircraft operational status |

**Validation Rules**:
- Registration must be unique (case-insensitive, stored UPPERCASE)
- enginesCount determines which engine fields are required in DailyCounter
- All fields required except status (defaults to 'active')

**Sample Fleet Data** (16 aircraft):
- 2x A340 (4-engine): HZ-A42, HZ-SKY1
- 1x A330 (2-engine): HZ-SKY2
- 5x A320 Family (2-engine): HZ-A2, HZ-A3, HZ-A4, HZ-A5, HZ-A15, HZ-SKY4
- 2x Hawker (2-engine): HZ-A8, HZ-A9
- 2x G650ER (2-engine): HZ-A22, HZ-A23
- 4x Cessna Citation Bravo (2-engine): HZ-133, HZ-134, HZ-135, HZ-136



---

### 2.3 Budget Plans Collection

**Purpose**: Annual budget allocations by clause and aircraft group

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| fiscalYear | number | 4-digit year | 2025 | Budget year |
| clauseId | number | 1-18 | 5 | Budget clause identifier |
| clauseDescription | string | Text | Component Repair | Clause name |
| aircraftGroup | string | Enum | A330, G650ER, Cessna, PMO | Aircraft group |
| plannedAmount | number | >= 0 | 600000 | Budgeted amount in USD |
| currency | string | ISO 4217 | USD | Currency code (default: USD) |

**18 Budget Clauses**:
```
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
```

**Aircraft Groups**: A330, G650ER, Cessna, PMO

**Unique Constraint**: (fiscalYear, clauseId, aircraftGroup)

**Sample Budget Amounts** (Annual, USD):
- A330: Clause 1 = $2,500,000, Clause 2 = $1,800,000, etc.
- G650ER: Clause 1 = $3,000,000, Clause 2 = $1,200,000, etc.
- Cessna: Clause 1 = $800,000, Clause 2 = $600,000, etc.
- PMO: Clause 1 = $0, Clause 2 = $200,000, etc.



---

### 2.4 Daily Status Collection (Availability Tracking)

**Purpose**: Track aircraft availability hours per day for dynamic availability calculation

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| date | date | ISO 8601 | 2024-01-15 | Status date |
| posHours | number | 0-24 | 24 | Possessed hours (baseline) |
| fmcHours | number | 0-24 | 22.5 | Fully Mission Capable hours |
| nmcmSHours | number | 0-24 | 0.5 | Not Mission Capable - Scheduled |
| nmcmUHours | number | 0-24 | 1 | Not Mission Capable - Unscheduled |
| nmcsHours | number | 0-24 | 0 | Not Mission Capable - Supply (optional) |
| notes | string | Text | Aircraft in maintenance | Additional notes (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- posHours typically = 24 (full day)
- fmcHours = posHours - nmcmSHours - nmcmUHours - nmcsHours
- All hour values must be between 0 and 24
- Unique constraint: (aircraftId, date)

**Availability Calculation**:
```
Single day: availabilityPercentage = (fmcHours / posHours) * 100
Period: totalFmcHours / totalPosHours * 100
Fleet: sum(fmcHours all aircraft) / sum(posHours all aircraft) * 100
```

**Sample Data** (90 days per aircraft):
- 85% of days: Full availability (24 FMC hours)
- 15% of days: Scheduled maintenance (1-4 hours downtime)
- 8% of days: Unscheduled maintenance (0.5-2 hours downtime)



---

### 2.5 Daily Counter Collection (Utilization)

**Purpose**: Track cumulative flight hours and cycles for airframe, engines, and APU

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| date | date | ISO 8601 | 2024-01-15 | Counter reading date |
| airframeHoursTtsn | number | >= 0, monotonic | 12500.5 | Total Time Since New |
| airframeCyclesTcsn | number | >= 0, monotonic | 4500 | Total Cycles Since New |
| engine1Hours | number | >= 0, monotonic | 11000.25 | Engine 1 hours |
| engine1Cycles | number | >= 0, monotonic | 4200 | Engine 1 cycles |
| engine2Hours | number | >= 0, monotonic | 10800.75 | Engine 2 hours |
| engine2Cycles | number | >= 0, monotonic | 4100 | Engine 2 cycles |
| engine3Hours | number | >= 0, monotonic | 9500.0 | Engine 3 (4-engine only) |
| engine3Cycles | number | >= 0, monotonic | 3800 | Engine 3 cycles (4-engine only) |
| engine4Hours | number | >= 0, monotonic | 9200.5 | Engine 4 (4-engine only) |
| engine4Cycles | number | >= 0, monotonic | 3700 | Engine 4 cycles (4-engine only) |
| apuHours | number | >= 0, monotonic | 8500.25 | APU hours |
| apuCycles | number | >= 0, monotonic | 15000 | APU cycles (optional) |
| lastFlightDate | date | ISO 8601 | 2024-01-14 | Date of last flight (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- **CRITICAL**: Counter values are MONOTONIC - must be >= previous day's values
- Engine 3/4 fields ONLY required for 4-engine aircraft
- Daily flight hours = today's airframeHoursTtsn - yesterday's airframeHoursTtsn
- Daily cycles = today's airframeCyclesTcsn - yesterday's airframeCyclesTcsn
- Unique constraint: (aircraftId, date)

**Sample Daily Increments**:
- Flight hours: 2-8 hours per day
- Cycles: 1-3 cycles per day
- Engine hours: ~98% of airframe hours
- APU hours: ~30-40% of airframe hours

**Typical Aircraft Utilization** (Annual):
- ~800 flight hours per year
- ~300 cycles per year
- Approximately 2.2 flight hours per day average



---

### 2.6 AOG Events Collection (Aircraft On Ground)

**Purpose**: Track grounding events with responsibility attribution, workflow status, and procurement lifecycle

**Core Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| detectedAt | date | ISO 8601 | 2024-01-08T14:30:00Z | When AOG detected |
| clearedAt | date | ISO 8601 | 2024-01-14T11:00:00Z | When cleared (null = active) |
| category | enum | scheduled, unscheduled, aog | unscheduled | Grounding category |
| reasonCode | string | Text | Hydraulic System Failure | Reason for grounding |
| responsibleParty | enum | Internal, OEM, Customs, Finance, Other | Internal | Accountability |
| actionTaken | string | Text | Troubleshooting hydraulic pump | Corrective action |
| manpowerCount | number | >= 0 | 3 | Personnel involved |
| manHours | number | >= 0 | 4 | Total labor hours |
| currentStatus | enum | 18 workflow states | REPORTED | Workflow status |
| blockingReason | enum | Finance, Port, Customs, Vendor, Ops, Other | Finance | Why waiting (if blocked) |

**Cost Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| costLabor | number | >= 0 | 2200 | Actual labor cost |
| costParts | number | >= 0 | 15000 | Actual parts cost |
| costExternal | number | >= 0 | 450 | External services cost |
| estimatedCostLabor | number | >= 0 | 2000 | Estimated labor |
| estimatedCostParts | number | >= 0 | 15000 | Estimated parts |
| estimatedCostExternal | number | >= 0 | 500 | Estimated external |

**Budget Integration Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| budgetClauseId | number | 1-18 | 5 | Budget clause mapping |
| budgetPeriod | string | YYYY-MM | 2024-01 | Budget period |
| isBudgetAffecting | boolean | true/false | true | Affects budget variance |
| linkedActualSpendId | ObjectId | Reference to ActualSpend | 507f1f77bcf86cd799439011 | Generated ActualSpend |

**Workflow & Audit Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| statusHistory | array | StatusHistoryEntry[] | [...] | Append-only timeline |
| partRequests | array | PartRequest[] | [...] | Part procurement lifecycle |
| costAuditTrail | array | CostAuditEntry[] | [...] | Cost change history |
| attachmentsMeta | array | AttachmentMeta[] | [...] | Document metadata |
| attachments | array | string[] | [s3-key-1, s3-key-2] | S3 keys for files |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**18 Workflow States** (in progression order):
```
1. REPORTED - AOG detected and reported
2. TROUBLESHOOTING - Initial investigation
3. ISSUE_IDENTIFIED - Root cause found
4. RESOLVED_NO_PARTS - Fixed without parts
5. PART_REQUIRED - Parts needed
6. PROCUREMENT_REQUESTED - Part request submitted
7. FINANCE_APPROVAL_PENDING - Awaiting finance approval (requires blockingReason)
8. ORDER_PLACED - Purchase order issued
9. IN_TRANSIT - Parts in transit (requires blockingReason)
10. AT_PORT - Parts at port (requires blockingReason)
11. CUSTOMS_CLEARANCE - Customs processing (requires blockingReason)
12. RECEIVED_IN_STORES - Parts received in warehouse
13. ISSUED_TO_MAINTENANCE - Parts issued to maintenance
14. INSTALLED_AND_TESTED - Parts installed and tested
15. ENGINE_RUN_REQUESTED - Engine run required
16. ENGINE_RUN_COMPLETED - Engine run successful
17. BACK_IN_SERVICE - Aircraft cleared for operations (auto-sets clearedAt)
18. CLOSED - Event archived
```

**Validation Rules**:
- clearedAt >= detectedAt (timestamp validation)
- Active AOG = clearedAt is null
- responsibleParty is required for accountability
- blockingReason required for: FINANCE_APPROVAL_PENDING, AT_PORT, CUSTOMS_CLEARANCE, IN_TRANSIT
- Terminal statuses (BACK_IN_SERVICE, CLOSED) auto-set clearedAt if not set
- Unique constraint: (aircraftId, detectedAt)

**Calculations**:
```
downtimeHours = (clearedAt - detectedAt) / (1000 * 60 * 60)
totalCost = (costLabor || 0) + (costParts || 0) + (costExternal || 0)
activeAOGCount = count where clearedAt is null
MTTR = sum(downtimeHours) / numberOfResolvedAOGs
```



---

### 2.7 Maintenance Tasks Collection

**Purpose**: Log shift-based maintenance activities with man-hours and costs

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| date | date | ISO 8601 | 2024-01-15 | Task date |
| shift | enum | Morning, Evening, Night, Other | Morning | Work shift |
| taskType | string | Text | Routine Inspection | Type of maintenance |
| taskDescription | string | Text | Routine inspection on HZ-A42 | Detailed description |
| manpowerCount | number | >= 0 | 2 | Number of technicians |
| manHours | number | >= 0 | 4.5 | Total labor hours |
| cost | number | >= 0 | 2500 | Task cost (optional) |
| workOrderRef | ObjectId | Reference to WorkOrder | 507f1f77bcf86cd799439011 | Link to work order (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- Tasks can optionally link to work orders
- manHours = manpowerCount × hours worked (typically)
- All shifts must be represented in data

**Sample Task Types**:
- Routine Inspection
- Scheduled Maintenance
- Component Replacement
- System Check
- Lubrication
- Cleaning
- Calibration
- Software Update
- Structural Inspection
- Engine Inspection

**Sample Data** (30-60 days seeded):
- 3-8 tasks per day across fleet
- Distributed across all shifts
- Costs: $500-$15,000 per task



---

### 2.8 Work Orders Collection (Historical/Read-Only)

**Purpose**: Track formal maintenance work orders with status and turnaround time (preserved for historical reference)

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| woNumber | string | Unique | WO-HZ-A42-001 | Work order number |
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| description | string | Text | Annual inspection | Work order description |
| status | enum | Open, InProgress, Closed, Deferred | Closed | Work order status |
| dateIn | date | ISO 8601 | 2024-01-08 | Work order opened |
| dateOut | date | ISO 8601 | 2024-01-15 | Work order closed (optional) |
| dueDate | date | ISO 8601 | 2024-01-20 | Due date (optional) |
| crsNumber | string | Text | CRS-12345 | Certificate of Release to Service |
| mrNumber | string | Text | MR-5678 | Maintenance Release number |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- woNumber must be unique
- Overdue = dueDate < today AND status !== 'Closed'
- dateOut must be >= dateIn

**Calculations**:
```
turnaroundDays = (dateOut - dateIn) / (1000 * 60 * 60 * 24)
isOverdue = dueDate && dueDate < new Date() && status !== 'Closed'
```

**Sample Data** (5-10 per aircraft):
- 5-10 work orders per aircraft
- Mixed statuses: Open, InProgress, Closed, Deferred
- Some overdue (for alert testing)
- Turnaround: 1-30 days

**Note**: This collection is now read-only. New work order tracking uses WorkOrderSummary collection.



---

### 2.9 Work Order Summaries Collection (NEW)

**Purpose**: Monthly aggregated work order counts per aircraft for KPI tracking

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| period | string | YYYY-MM format | 2024-01 | Month of work orders |
| workOrderCount | number | >= 0 | 12 | Number of work orders |
| totalCost | number | >= 0 | 45000 | Total cost (optional) |
| currency | string | ISO 4217 | USD | Currency code (default: USD) |
| notes | string | Text | Routine maintenance | Additional notes (optional) |
| sourceRef | string | Text | EXT-WO-2024-001 | External system reference (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- workOrderCount must be >= 0
- totalCost must be >= 0 if provided
- Upsert by (aircraftId, period) - updates existing record if found
- Unique constraint: (aircraftId, period)

**Calculations**:
```
trendData = group by period, sum(workOrderCount)
totalCount = sum(workOrderCount) where period >= startPeriod AND period <= endPeriod
totalCost = sum(totalCost) where period >= startPeriod AND period <= endPeriod
```

**Sample Data** (12 months per aircraft):
- 3-14 work orders per month
- Costs: $8,000-$52,000 per month
- Trend: Higher in winter months (maintenance season)

**Import Format** (Excel):
```
Aircraft Registration | Period  | Work Order Count | Total Cost | Notes
HZ-A42               | 2024-01 | 12               | 45000      | Routine maintenance
HZ-A42               | 2024-02 | 8                | 32000      | Light month
HZ-A30               | 2024-01 | 10               | 38000      | Heavy maintenance
```



---

### 2.10 Discrepancies Collection

**Purpose**: Track defects and issues by ATA chapter for pattern analysis

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Required |
| dateDetected | date | ISO 8601 | 2024-01-15 | When found |
| ataChapter | string | 2-digit code | 29 | ATA chapter code |
| discrepancyText | string | Text | Hydraulic leak observed | Description |
| dateCorrected | date | ISO 8601 | 2024-01-20 | When fixed (optional) |
| correctiveAction | string | Text | Seal replaced | How it was fixed (optional) |
| responsibility | enum | Internal, OEM, Customs, Finance, Other | Internal | Who fixed it |
| downtimeHours | number | >= 0 | 4.5 | Hours of downtime (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**ATA Chapters** (16 standard chapters):
```
21 - Air Conditioning
24 - Electrical Power
27 - Flight Controls
29 - Hydraulic Power
32 - Landing Gear
34 - Navigation
36 - Pneumatic
49 - APU
52 - Doors
71 - Power Plant
72 - Engine
73 - Engine Fuel
74 - Ignition
78 - Exhaust
79 - Oil
80 - Starting
```

**Validation Rules**:
- ATA chapters follow standard aviation classification
- Open discrepancy = dateCorrected is null
- dateCorrected >= dateDetected

**Analytics**:
```
defectsByATA = group by ataChapter, count()
// Order by count DESC to identify problem areas
```

**Sample Data** (3-8 per aircraft):
- Distributed across 10+ ATA chapters
- 70% corrected, 30% open
- Downtime: 0.5-24 hours



---

### 2.11 Actual Spend Collection

**Purpose**: Record actual expenditures for budget variance tracking

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| period | string | YYYY-MM format | 2024-01 | Spending period |
| aircraftGroup | string | Enum | A330 | Aircraft group (optional) |
| aircraftId | ObjectId | Reference to Aircraft | 507f1f77bcf86cd799439011 | Specific aircraft (optional) |
| clauseId | number | 1-18 | 5 | Budget clause ID |
| amount | number | >= 0 | 45000 | Spend amount |
| currency | string | ISO 4217 | USD | Currency code (default: USD) |
| vendor | string | Text | Airbus Services | Vendor name (optional) |
| notes | string | Text | Component repair | Additional notes (optional) |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**Validation Rules**:
- amount must be >= 0
- period must be YYYY-MM format
- Either aircraftGroup OR aircraftId should be specified (not both)

**Budget Calculations**:
```
variance = plannedAmount - actualAmount
remainingBudget = max(0, variance)
utilizationPercentage = (actualAmount / plannedAmount) * 100

// Burn rate analysis
totalSpent = sum(amount) for fiscal year
monthsWithData = count(distinct periods)
averageMonthlySpend = totalSpent / monthsWithData
projectedMonthsRemaining = remainingBudget / averageMonthlySpend

// Cost efficiency (requires utilization data)
costPerFlightHour = totalCost / totalFlightHours
costPerCycle = totalCost / totalCycles
```

**Sample Data** (12 months × 4 groups × 18 clauses):
- Monthly budget = annual / 12
- Variance patterns:
  - 60% under budget (70-95% of monthly budget)
  - 30% over budget (105-125% of monthly budget)
  - 10% on target (98-102% of monthly budget)

**Linked to AOG Events**:
- When AOG event is marked as budget-affecting, an ActualSpend entry is generated
- linkedActualSpendId in AOGEvent references this record



---

### 2.12 Vacation Plans Collection (NEW)

**Purpose**: Manage Engineering and TPL team vacation schedules with 48-week grid

**Required Fields**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| year | number | 4-digit year | 2025 | Vacation plan year |
| team | enum | Engineering, TPL | Engineering | Team name |
| employees | array | VacationEmployee[] | [...] | Array of employees |
| overlaps | array | string[48] | ['Ok', 'Check', ...] | Overlap indicators per week |
| updatedBy | ObjectId | Reference to User | 507f1f77bcf86cd799439011 | Audit trail |

**VacationEmployee Sub-document**:
| Field | Type | Validation | Example | Notes |
|-------|------|-----------|---------|-------|
| name | string | Text | Ahmed Al-Rashid | Employee name |
| cells | array | number[48] | [0, 1, 0.5, ...] | 48 weeks of vacation values |
| total | number | >= 0 | 7.5 | Computed sum of cells |

**Validation Rules**:
- team must be 'Engineering' or 'TPL'
- cells array must have exactly 48 elements (4 weeks × 12 months)
- Cell values must be numeric (reject non-numeric markers like "V")
- total is computed as sum of all cell values
- Unique constraint: (year, team)

**Overlap Detection**:
```
for (weekIndex = 0; weekIndex < 48; weekIndex++) {
  count = employees.filter(e => e.cells[weekIndex] > 0).length
  overlaps[weekIndex] = count > 1 ? 'Check' : 'Ok'
}
```

**Cell Value Meanings**:
- 0 = No vacation
- 0.5 = Half week vacation
- 1 = Full week vacation
- 2+ = Multiple weeks (rare)

**Sample Data** (2 teams × 5 employees each):
- Engineering team: 5 employees
- TPL team: 5 employees
- Annual vacation: 6-8 weeks per employee
- Overlaps: 2-3 weeks per team with conflicts

**Import/Export Format** (Excel):
```
Sheet 1: "Engineering"
- Column A: Employee names
- Columns B-AY: Week 1 to Week 48 (grouped by month)
- Column AZ: Total (computed)
- Row at bottom: Overlaps (Ok/Check indicators)

Sheet 2: "TPL"
- Same structure as Engineering
```

**Overlap Detection Rules**:
- Overlaps detected WITHIN team only
- Engineering and TPL plans are independent
- Overlap requires 2+ employees with value > 0 in same week
- Flagged as 'Check' for manual review



---

## 3. Field Validation Rules Summary

### Critical Validation Rules

**Aircraft Registration**:
- Must be UPPERCASE
- Must be unique
- Format: 2-3 letters + hyphen + 1-3 alphanumeric (e.g., HZ-A42)

**Counter Values (Daily Counter)**:
- **MONOTONIC**: Must be >= previous day's values
- Cannot decrease
- Violation = data integrity error

**Hours Fields (Daily Status)**:
- Must be between 0 and 24
- fmcHours = posHours - nmcmSHours - nmcmUHours - nmcsHours
- Sum of downtime hours cannot exceed posHours

**AOG Event Timestamps**:
- clearedAt >= detectedAt (if clearedAt is set)
- Active AOG = clearedAt is null
- Terminal statuses auto-set clearedAt

**Budget Period Format**:
- Must be YYYY-MM (e.g., 2024-01)
- Month must be 01-12

**Vacation Plan Cells**:
- Must be numeric (no text markers like "V" or "X")
- Must be >= 0
- Exactly 48 elements per employee

**Email Addresses**:
- Stored lowercase
- Must be unique
- Valid email format

### Conditional Validation

**Engine Fields** (Daily Counter):
- Engine 3/4 fields REQUIRED for 4-engine aircraft
- Engine 3/4 fields OPTIONAL for 2-engine aircraft

**AOG Blocking Reason**:
- REQUIRED for statuses: FINANCE_APPROVAL_PENDING, AT_PORT, CUSTOMS_CLEARANCE, IN_TRANSIT
- OPTIONAL for other statuses

**Work Order Dates**:
- dateOut must be >= dateIn (if both set)
- dueDate can be in past (for overdue detection)



---

## 4. Seed Data Reference

### Pre-Seeded Data (Included in Database Initialization)

#### Default Users
```
Admin:   admin@alphastarav.com / Admin@123!
Editor:  editor@alphastarav.com / Editor@123!
Viewer:  viewer@alphastarav.com / Viewer@123!
```

#### Fleet (16 Aircraft)
```
A340 Fleet (4-engine):
- HZ-A42 (Alpha Star Aviation, A340-642, MSN 1015, Active)
- HZ-SKY1 (Sky Prime Aviation, A340-212, MSN 0089, Active)

A330 Fleet (2-engine):
- HZ-SKY2 (Sky Prime Aviation, A330-243, MSN 0456, Active)

A320 Family (2-engine):
- HZ-A2 (Alpha Star Aviation, A320-214, MSN 2345, Parked)
- HZ-A3 (Alpha Star Aviation, A320-214, MSN 1234, Active)
- HZ-A4 (Alpha Star Aviation, A319-112, MSN 1567, Active)
- HZ-A5 (Alpha Star Aviation, A318-112, MSN 2890, Active)
- HZ-A15 (Alpha Star Aviation, A320-216, MSN 3456, Active)
- HZ-SKY4 (Sky Prime Aviation, A319-115, MSN 4567, Active)

Hawker Fleet (2-engine):
- HZ-A8 (Alpha Star Aviation, Hawker 900XP, MSN 5678, Active)
- HZ-A9 (Alpha Star Aviation, Hawker 900XP, MSN 5679, Active)

Gulfstream Fleet (2-engine):
- HZ-A22 (Alpha Star Aviation, G650ER, MSN 6234, Active)
- HZ-A23 (Alpha Star Aviation, G650ER, MSN 6235, Active)

Cessna Fleet (2-engine, RSAF):
- HZ-133 (RSAF, Citation Bravo, MSN 550-1115, Active)
- HZ-134 (RSAF, Citation Bravo, MSN 550-1116, Active)
- HZ-135 (RSAF, Citation Bravo, MSN 550-1126, Active)
- HZ-136 (RSAF, Citation Bravo, MSN 550-1127, Active)
```

#### Budget Plans (18 Clauses × 4 Groups)
- 72 budget plan records created
- Annual amounts per clause per aircraft group
- Fiscal year: Current year

#### Operational Data (90 Days)
- Daily Status: 90 days × 16 aircraft = 1,440 records
- Daily Counters: 90 days × 16 aircraft = 1,440 records
- AOG Events: 3-5 per aircraft = 48-80 records
- Maintenance Tasks: 3-8 per day = 90-720 records
- Work Orders: 5-10 per aircraft = 80-160 records
- Discrepancies: 3-8 per aircraft = 48-128 records
- Actual Spend: 12 months × 4 groups × 18 clauses = 864 records

#### Historical Data (2024, Previous Year)
- Daily Status: 90 days × 16 aircraft = 1,440 records
- Daily Counters: 90 days × 16 aircraft = 1,440 records
- Used for Year-over-Year (YoY) comparison

### Data Generation Patterns

**Daily Status**:
- 85% of days: Full availability (24 FMC hours)
- 15% of days: Scheduled maintenance (1-4 hours downtime)
- 8% of days: Unscheduled maintenance (0.5-2 hours downtime)

**Daily Counters**:
- Daily flight hours: 2-8 hours
- Daily cycles: 1-3 cycles
- Engine hours: ~98% of airframe hours
- APU hours: ~30-40% of airframe hours

**AOG Events**:
- Responsible party distribution:
  - Internal: 40%
  - OEM: 25%
  - Customs: 15%
  - Finance: 10%
  - Other: 10%
- Duration: 4-72 hours
- 90% cleared, 10% still active

**Maintenance Tasks**:
- Shift distribution: Morning, Evening, Night (equal)
- Task types: 10 different types
- Costs: $500-$15,000 per task

**Work Orders**:
- Status distribution: Open, InProgress, Closed, Deferred (varied)
- Some overdue (for alert testing)
- Turnaround: 1-30 days

**Discrepancies**:
- ATA chapters: 10+ different chapters
- 70% corrected, 30% open
- Downtime: 0.5-24 hours

**Actual Spend**:
- Variance patterns:
  - 60% under budget (70-95% of monthly budget)
  - 30% over budget (105-125% of monthly budget)
  - 10% on target (98-102% of monthly budget)



---

## 5. Import/Export Formats

### 5.1 Excel Import Templates

All import templates follow a consistent structure with validation rules.

#### Aircraft Import Template
```
Column A: Registration (UPPERCASE, unique)
Column B: Fleet Group (A340, A330, A320, A319, A318, G650ER, Hawker, Cessna)
Column C: Aircraft Type (e.g., A340-642)
Column D: MSN (Manufacturer Serial Number)
Column E: Owner (Alpha Star Aviation, Sky Prime Aviation, RSAF)
Column F: Manufacture Date (YYYY-MM-DD)
Column G: Engines Count (2 or 4)
Column H: Status (active, parked, leased)

Example:
HZ-A42 | A340 | A340-642 | 1015 | Alpha Star Aviation | 2010-01-15 | 4 | active
```

#### Daily Status Import Template
```
Column A: Aircraft Registration (must exist)
Column B: Date (YYYY-MM-DD)
Column C: POS Hours (0-24, default 24)
Column D: FMC Hours (0-24)
Column E: NMCM-S Hours (0-24)
Column F: NMCM-U Hours (0-24)
Column G: NMCS Hours (0-24, optional)
Column H: Notes (optional)

Example:
HZ-A42 | 2024-01-15 | 24 | 22.5 | 0.5 | 1 | 0 | Aircraft in maintenance
```

#### Daily Counter Import Template
```
Column A: Aircraft Registration (must exist)
Column B: Date (YYYY-MM-DD)
Column C: Airframe Hours TTSN
Column D: Airframe Cycles TCSN
Column E: Engine 1 Hours
Column F: Engine 1 Cycles
Column G: Engine 2 Hours
Column H: Engine 2 Cycles
Column I: Engine 3 Hours (4-engine only)
Column J: Engine 3 Cycles (4-engine only)
Column K: Engine 4 Hours (4-engine only)
Column L: Engine 4 Cycles (4-engine only)
Column M: APU Hours
Column N: APU Cycles (optional)
Column O: Last Flight Date (optional)

Example:
HZ-A42 | 2024-01-15 | 12500.5 | 4500 | 11000.25 | 4200 | 10800.75 | 4100 | 9500 | 3800 | 9200.5 | 3700 | 8500.25 | 15000 | 2024-01-14
```

#### Work Order Summary Import Template
```
Column A: Aircraft Registration (must exist)
Column B: Period (YYYY-MM format)
Column C: Work Order Count (>= 0)
Column D: Total Cost (>= 0, optional)
Column E: Notes (optional)

Example:
HZ-A42 | 2024-01 | 12 | 45000 | Routine maintenance
HZ-A42 | 2024-02 | 8 | 32000 | Light month
```

#### Vacation Plan Import Template
```
Sheet 1: "Engineering"
Sheet 2: "TPL"

Each sheet structure:
- Column A: Employee Name
- Columns B-AY: Week 1 to Week 48 (numeric values only)
- Column AZ: Total (auto-computed)
- Row at bottom: Overlaps (auto-computed)

Example (Engineering sheet):
Employee Name | W1 | W2 | W3 | ... | W48 | Total
Ahmed Al-Rashid | 0 | 1 | 0.5 | ... | 0 | 7.5
Fatima Hassan | 0 | 0 | 1 | ... | 1 | 6.5
```

### 5.2 Excel Export Formats

#### Dashboard Export
- KPI summary with current period and previous period
- Trend data for last 12 months
- Fleet comparison (top/bottom performers)
- AOG analytics
- Budget variance analysis

#### Vacation Plan Export
- Individual plan per sheet (Engineering, TPL)
- 48-week grid with employee names
- Overlap indicators
- Total vacation days per employee

#### AOG Events Export
- All AOG events with workflow status
- Status history timeline
- Part requests
- Cost tracking
- Blocking reasons



---

## 6. Data Quality Standards

### Data Freshness Requirements

| Data Type | Update Frequency | Acceptable Lag | Quality Indicator |
|-----------|------------------|-----------------|-------------------|
| Daily Status | Daily | 24 hours | Green if < 24h old |
| Daily Counters | Daily | 24 hours | Green if < 24h old |
| AOG Events | Real-time | 1 hour | Green if < 1h old |
| Maintenance Tasks | Daily | 24 hours | Green if < 24h old |
| Work Order Summaries | Monthly | 5 days | Green if current month |
| Budget/Actual Spend | Monthly | 10 days | Green if current month |
| Vacation Plans | Quarterly | 30 days | Green if current year |

### Data Completeness Standards

**Critical Fields** (must be 100% complete):
- Aircraft: registration, fleetGroup, aircraftType, enginesCount
- Daily Status: aircraftId, date, posHours, fmcHours
- Daily Counter: aircraftId, date, airframeHoursTtsn, airframeCyclesTcsn
- AOG Events: aircraftId, detectedAt, reasonCode, responsibleParty
- Budget Plans: fiscalYear, clauseId, aircraftGroup, plannedAmount

**Important Fields** (should be >= 95% complete):
- Daily Status: nmcmSHours, nmcmUHours
- Daily Counter: engine hours/cycles, apuHours
- AOG Events: manpowerCount, manHours, costLabor, costParts
- Maintenance Tasks: taskType, manpowerCount, manHours

**Optional Fields** (no minimum requirement):
- Daily Status: notes, nmcsHours
- Daily Counter: lastFlightDate, apuCycles
- AOG Events: costExternal, attachments
- Maintenance Tasks: cost, workOrderRef

### Data Accuracy Standards

**Counter Monotonicity**:
- 100% of daily counter records must have monotonically increasing values
- Any violation = data integrity error requiring correction

**Availability Calculation**:
- fmcHours must equal: posHours - nmcmSHours - nmcmUHours - nmcsHours
- Tolerance: ±0.1 hours (rounding)

**AOG Timestamp Validation**:
- 100% of AOG events must have clearedAt >= detectedAt (if clearedAt set)
- Active AOG count must match records where clearedAt is null

**Budget Variance**:
- Actual spend must be reconciled monthly
- Variance > 20% from budget requires investigation

### Data Validation Checklist

Before importing data, verify:

- [ ] All aircraft registrations are UPPERCASE
- [ ] All dates are in ISO 8601 format (YYYY-MM-DD)
- [ ] All periods are in YYYY-MM format
- [ ] All numeric values are positive (where required)
- [ ] All required fields are populated
- [ ] No duplicate aircraft registrations
- [ ] No duplicate (aircraftId, date) pairs in Daily Status/Counters
- [ ] Counter values are monotonically increasing
- [ ] AOG clearedAt >= detectedAt
- [ ] Budget clause IDs are 1-18
- [ ] Aircraft group names match expected values
- [ ] Vacation plan cells are numeric only
- [ ] Vacation plan has exactly 48 weeks per employee



---

## 7. KPI Calculations & Formulas

### Primary KPIs

#### 1. Fleet Availability Percentage
```
fleetAvailability = (totalFmcHours / totalPosHours) * 100

Where:
- totalFmcHours = sum of fmcHours for all aircraft in period
- totalPosHours = sum of posHours for all aircraft in period
- Target: 92% (industry standard)
- Status: Green >= 92%, Yellow 85-91%, Red < 85%
```

#### 2. Total Flight Hours
```
totalFlightHours = sum(airframeHoursTtsn deltas) for period

Where:
- Delta = today's airframeHoursTtsn - yesterday's airframeHoursTtsn
- Aggregated across all aircraft
- Typical: 2-8 hours per aircraft per day
```

#### 3. Total Cycles
```
totalCycles = sum(airframeCyclesTcsn deltas) for period

Where:
- Delta = today's airframeCyclesTcsn - yesterday's airframeCyclesTcsn
- Aggregated across all aircraft
- Typical: 1-3 cycles per aircraft per day
```

#### 4. Active AOG Count
```
activeAOGCount = count(AOGEvents where clearedAt is null)

Status:
- Green: 0 active AOGs
- Yellow: 1-2 active AOGs
- Red: 3+ active AOGs
```

### Executive Dashboard Metrics

#### Fleet Health Score (0-100)
```
Fleet Health Score = (
  Availability Score × 0.45 +
  AOG Impact Score × 0.30 +
  Budget Health Score × 0.25
)

Where:
- Availability Score = Fleet Availability % (capped at 100)
- AOG Impact Score = 100 - (Active AOG Count × 10), min 0
- Budget Health Score = 100 - Budget Utilization %, min 0

Status Thresholds:
- 90-100: Healthy (green)
- 70-89: Caution (yellow)
- Below 70: Warning (red)
```

#### Operational Efficiency Metrics

**MTBF (Mean Time Between Failures)**:
```
mtbf = totalOperatingHours / numberOfFailures

Where:
- totalOperatingHours = sum of flight hours in period
- numberOfFailures = count of AOG events in period
- Typical: 500-1000 hours between failures
```

**MTTR (Mean Time To Repair)**:
```
mttr = sum(clearedAt - detectedAt) / numberOfResolvedAOGs

Where:
- Measured in hours
- Warning if MTTR > 24 hours
- Target: < 12 hours
```

**Dispatch Reliability**:
```
dispatchReliability = (flightsWithoutTechnicalDelay / totalFlights) * 100

Where:
- Based on daily status data
- Target: > 98%
```

#### Cost Efficiency Metrics

**Cost Per Flight Hour**:
```
costPerFlightHour = totalMaintenanceCost / totalFlightHours

Where:
- totalMaintenanceCost = sum of all maintenance costs
- Includes: labor, parts, external services
- Typical: $5,000-$15,000 per flight hour
```

**Cost Per Cycle**:
```
costPerCycle = totalMaintenanceCost / totalCycles

Where:
- Typical: $15,000-$50,000 per cycle
```

#### Budget Variance Analysis

**Variance**:
```
variance = plannedAmount - actualAmount
remainingBudget = max(0, variance)
utilizationPercentage = (actualAmount / plannedAmount) * 100

Status:
- Green: 80-100% utilization (under budget)
- Yellow: 100-110% utilization (slightly over)
- Red: > 110% utilization (significantly over)
```

**Burn Rate**:
```
totalSpent = sum(amount) for fiscal year
monthsWithData = count(distinct periods)
averageMonthlySpend = totalSpent / monthsWithData
projectedMonthsRemaining = remainingBudget / averageMonthlySpend
```

#### Fleet Comparison

**Top Performers** (by availability):
```
Top 3 aircraft by highest average availability %
- Ranked by fmcHours / posHours
- Displayed with availability % and trend
```

**Bottom Performers** (by availability):
```
Bottom 3 aircraft by lowest average availability %
- Ranked by fmcHours / posHours
- Displayed with availability % and trend
```

#### Defect Patterns

**Top ATA Chapters**:
```
defectsByATA = group by ataChapter, count()
Order by count DESC, limit 10

Displays:
- ATA chapter code
- Number of discrepancies
- Percentage of total
- Trend (increasing/decreasing)
```

#### Year-over-Year (YoY) Comparison

**Availability YoY**:
```
currentYearAvailability = fleet availability for current period
previousYearAvailability = fleet availability for same period last year
delta = currentYearAvailability - previousYearAvailability
percentChange = (delta / previousYearAvailability) * 100
```

**Flight Hours YoY**:
```
currentYearHours = total flight hours for current period
previousYearHours = total flight hours for same period last year
delta = currentYearHours - previousYearHours
percentChange = (delta / previousYearHours) * 100
```

**Costs YoY**:
```
currentYearCost = total maintenance cost for current period
previousYearCost = total maintenance cost for same period last year
delta = currentYearCost - previousYearCost
percentChange = (delta / previousYearCost) * 100
```



---

## 8. Alert System & Thresholds

### Alert Priority Levels

| Level | Color | Trigger Conditions | Example |
|-------|-------|-------------------|---------|
| Critical | Red | Active AOG events, Aircraft availability < 70% | "3 aircraft on ground" |
| Warning | Amber | AOG in blocking states, Budget > 90%, Availability < 85% | "2 AOGs blocked by Finance" |
| Info | Blue | Upcoming maintenance due within 7 days | "HZ-A42 due for inspection" |

### Alert Triggers

**Critical Alerts**:
- Active AOG count > 0
- Fleet availability < 70%
- Budget utilization > 100%

**Warning Alerts**:
- AOG events in blocking states (Finance, Port, Customs, Vendor, Ops)
- Fleet availability 70-85%
- Budget utilization 90-100%
- MTTR > 24 hours

**Info Alerts**:
- Upcoming scheduled maintenance within 7 days
- Budget utilization 80-90%
- New discrepancies detected

### Alert Dismissal & Persistence

- Critical alerts: Persist until resolved
- Warning alerts: Persist for 24 hours or until resolved
- Info alerts: Auto-dismiss after 7 days

### Alert Notification Channels

- Dashboard: Real-time display in Alerts Panel
- Email: Daily digest of critical/warning alerts (optional)
- API: Webhook notifications for integrations (optional)



---

## 9. API Endpoints Reference

### Authentication
```
POST   /api/auth/login              Login, returns JWT
POST   /api/auth/register           Create user (Admin only)
GET    /api/auth/me                 Get current user
GET    /api/auth/users              List all users (Admin only)
```

### Aircraft
```
GET    /api/aircraft                List aircraft (filterable)
POST   /api/aircraft                Create aircraft
GET    /api/aircraft/:id            Get single aircraft
PUT    /api/aircraft/:id            Update aircraft
DELETE /api/aircraft/:id            Delete aircraft
```

### Daily Status (Availability)
```
GET    /api/daily-status            List daily status
POST   /api/daily-status            Create daily status
GET    /api/daily-status/:id        Get single record
PUT    /api/daily-status/:id        Update record
DELETE /api/daily-status/:id        Delete record
GET    /api/daily-status/availability  Get availability metrics
```

### Utilization (Daily Counters)
```
GET    /api/utilization             List daily counters
POST   /api/utilization             Create daily counter
GET    /api/utilization/:id         Get single counter
PUT    /api/utilization/:id         Update counter
DELETE /api/utilization/:id         Delete counter
GET    /api/utilization/aggregations Get aggregated data
```

### AOG Events
```
GET    /api/aog-events              List AOG events (filterable)
POST   /api/aog-events              Create AOG event
GET    /api/aog-events/:id          Get single event
PUT    /api/aog-events/:id          Update event
DELETE /api/aog-events/:id          Delete event
GET    /api/aog-events/active       Get active AOG events
GET    /api/aog-events/active/count Get count of active AOGs
GET    /api/aog-events/analytics/stages Get stage breakdown
GET    /api/aog-events/analytics/bottlenecks Get bottleneck analysis
POST   /api/aog-events/:id/attachments Add attachment
DELETE /api/aog-events/:id/attachments/:s3Key Remove attachment
```

### Maintenance Tasks
```
GET    /api/maintenance-tasks       List tasks
POST   /api/maintenance-tasks       Create task
GET    /api/maintenance-tasks/:id   Get single task
PUT    /api/maintenance-tasks/:id   Update task
DELETE /api/maintenance-tasks/:id   Delete task
GET    /api/maintenance-tasks/summary Get summary stats
```

### Work Orders (Historical)
```
GET    /api/work-orders             List work orders
POST   /api/work-orders             Create work order
GET    /api/work-orders/:id         Get single work order
PUT    /api/work-orders/:id         Update work order
DELETE /api/work-orders/:id         Delete work order
```

### Work Order Summaries
```
GET    /api/work-order-summaries    List summaries (filterable)
POST   /api/work-order-summaries    Create/upsert summary
GET    /api/work-order-summaries/:id Get single summary
PUT    /api/work-order-summaries/:id Update summary
DELETE /api/work-order-summaries/:id Delete summary (Admin only)
GET    /api/work-order-summaries/trends Get trend data
GET    /api/work-order-summaries/total Get total count for period
```

### Discrepancies
```
GET    /api/discrepancies           List discrepancies
POST   /api/discrepancies           Create discrepancy
GET    /api/discrepancies/:id       Get single discrepancy
PUT    /api/discrepancies/:id       Update discrepancy
DELETE /api/discrepancies/:id       Delete discrepancy
GET    /api/discrepancies/analytics Get ATA chapter analytics
```

### Budget
```
GET    /api/budget-plans            List budget plans
POST   /api/budget-plans            Create budget plan
POST   /api/budget-plans/clone      Clone from previous year
GET    /api/actual-spend            List actual spend
POST   /api/actual-spend            Create actual spend
GET    /api/budget/variance         Get budget variance
GET    /api/budget/burn-rate        Get burn rate analysis
```

### Vacation Plans
```
GET    /api/vacation-plans          List plans (filterable)
POST   /api/vacation-plans          Create plan
GET    /api/vacation-plans/:id      Get single plan
PUT    /api/vacation-plans/:id      Bulk update plan
DELETE /api/vacation-plans/:id      Delete plan (Admin only)
PATCH  /api/vacation-plans/:id/cell Update single cell
POST   /api/vacation-plans/:id/employees Add employee
DELETE /api/vacation-plans/:id/employees/:name Remove employee
GET    /api/vacation-plans/:id/export Export to Excel
GET    /api/vacation-plans/export/year/:year Export all for year
POST   /api/vacation-plans/import   Import from Excel
```

### Dashboard
```
GET    /api/dashboard/kpis          Get KPI summary
GET    /api/dashboard/trends        Get trend data
GET    /api/dashboard/health-score  Get Fleet Health Score
GET    /api/dashboard/alerts        Get categorized alerts
GET    /api/dashboard/period-comparison Get current vs previous period
GET    /api/dashboard/cost-efficiency Get cost per FH and cycle
GET    /api/dashboard/fleet-comparison Get top/bottom performers
GET    /api/dashboard/operational-efficiency Get MTBF, MTTR, dispatch
GET    /api/dashboard/maintenance-forecast Get upcoming maintenance
GET    /api/dashboard/recent-activity Get last 10 system events
GET    /api/dashboard/insights      Get auto-generated insights
GET    /api/dashboard/yoy-comparison Get year-over-year metrics
GET    /api/dashboard/defect-patterns Get top ATA chapters
GET    /api/dashboard/data-quality  Get data freshness metrics
```

### Import/Export
```
GET    /api/import/template/:type   Download Excel template
POST   /api/import/upload           Upload Excel file
GET    /api/export/:type            Export data to Excel
```



---

## 10. Data Entry Workflow Examples

### Example 1: Complete AOG Event Lifecycle

**Scenario**: Aircraft HZ-A42 has a hydraulic system failure on January 8, 2024

**Step 1: Report AOG Event**
```
POST /api/aog-events
{
  "aircraftId": "507f1f77bcf86cd799439011",
  "detectedAt": "2024-01-08T14:30:00Z",
  "category": "unscheduled",
  "reasonCode": "Hydraulic System Failure - ATA 29",
  "responsibleParty": "Internal",
  "actionTaken": "Troubleshooting hydraulic pump",
  "manpowerCount": 3,
  "manHours": 4
}

Response: AOG created with currentStatus = REPORTED
```

**Step 2: Progress Through Workflow**
```
PUT /api/aog-events/:id
{
  "currentStatus": "TROUBLESHOOTING",
  "statusHistory": [
    {
      "fromStatus": "REPORTED",
      "toStatus": "TROUBLESHOOTING",
      "timestamp": "2024-01-08T15:00:00Z",
      "actorId": "...",
      "notes": "Hydraulic pump inspection in progress"
    }
  ]
}
```

**Step 3: Identify Issue & Request Parts**
```
PUT /api/aog-events/:id
{
  "currentStatus": "PART_REQUIRED",
  "partRequests": [
    {
      "partNumber": "12345-ABC",
      "partDescription": "Hydraulic Pump Assembly",
      "quantity": 1,
      "estimatedCost": 15000,
      "vendor": "Airbus Parts Supply",
      "requestedDate": "2024-01-08T17:30:00Z",
      "status": "REQUESTED"
    }
  ]
}
```

**Step 4: Track Costs & Budget Impact**
```
PUT /api/aog-events/:id
{
  "estimatedCostLabor": 2000,
  "estimatedCostParts": 15000,
  "estimatedCostExternal": 500,
  "budgetClauseId": 5,
  "budgetPeriod": "2024-01",
  "isBudgetAffecting": true
}
```

**Step 5: Complete Workflow & Generate ActualSpend**
```
PUT /api/aog-events/:id
{
  "currentStatus": "BACK_IN_SERVICE",
  "clearedAt": "2024-01-14T11:00:00Z",
  "costLabor": 2200,
  "costParts": 15000,
  "costExternal": 450,
  "linkedActualSpendId": "507f1f77bcf86cd799439012"
}

// System automatically creates ActualSpend entry:
POST /api/actual-spend
{
  "period": "2024-01",
  "aircraftGroup": "A340",
  "clauseId": 5,
  "amount": 17650,
  "vendor": "Airbus Parts Supply",
  "notes": "AOG event HZ-A42 hydraulic repair"
}
```

### Example 2: Monthly Work Order Summary Entry

**Scenario**: January 2024 maintenance summary for HZ-A42

```
POST /api/work-order-summaries
{
  "aircraftId": "507f1f77bcf86cd799439011",
  "period": "2024-01",
  "workOrderCount": 12,
  "totalCost": 45000,
  "notes": "Routine maintenance plus hydraulic repair"
}
```

### Example 3: Vacation Plan Setup

**Scenario**: Create 2025 Engineering team vacation plan

```
POST /api/vacation-plans
{
  "year": 2025,
  "team": "Engineering",
  "employees": [
    {
      "name": "Ahmed Al-Rashid",
      "cells": [0, 1, 0.5, 0, ..., 0]  // 48 weeks
    },
    {
      "name": "Fatima Hassan",
      "cells": [0, 0, 1, 0, ..., 1]    // 48 weeks
    }
  ]
}

// System auto-computes:
// - total for each employee
// - overlaps for each week
```

**Update Single Cell**:
```
PATCH /api/vacation-plans/:id/cell
{
  "employeeName": "Ahmed Al-Rashid",
  "weekIndex": 4,
  "value": 0.5
}

// System recalculates:
// - employee total
// - week overlaps
```



---

## 11. Common Data Issues & Solutions

### Issue 1: Counter Values Decreasing

**Problem**: Daily counter shows decrease from previous day
```
Day 1: airframeHoursTtsn = 12500.5
Day 2: airframeHoursTtsn = 12498.0  // ERROR: Decreased!
```

**Cause**: Data entry error, incorrect reading, or system malfunction

**Solution**:
1. Verify the reading with maintenance logs
2. Correct the value to match actual counter
3. Ensure monotonic increase: Day 2 >= Day 1
4. Check for gaps in data (missing days)

### Issue 2: Availability Hours Don't Add Up

**Problem**: fmcHours ≠ posHours - nmcmSHours - nmcmUHours - nmcsHours
```
posHours = 24
nmcmSHours = 1
nmcmUHours = 2
nmcsHours = 0
fmcHours = 20  // Should be 21!
```

**Solution**:
1. Recalculate: 24 - 1 - 2 - 0 = 21
2. Update fmcHours to 21
3. Verify all downtime hours are accurate

### Issue 3: AOG Event with Missing Blocking Reason

**Problem**: AOG in FINANCE_APPROVAL_PENDING status but no blockingReason
```
currentStatus: "FINANCE_APPROVAL_PENDING"
blockingReason: null  // ERROR: Required!
```

**Solution**:
1. Set blockingReason to appropriate value: Finance, Port, Customs, Vendor, Ops, Other
2. Add notes explaining the block
3. Update when block is resolved

### Issue 4: Duplicate Aircraft Registration

**Problem**: Two aircraft with same registration
```
HZ-A42 (created 2024-01-01)
HZ-A42 (created 2024-01-15)  // ERROR: Duplicate!
```

**Solution**:
1. Verify which registration is correct
2. Delete the duplicate record
3. Merge any associated data (daily status, counters, etc.)
4. Ensure registration is unique before import

### Issue 5: Budget Period Format Error

**Problem**: Budget period in wrong format
```
period: "2024/01"  // ERROR: Should be "2024-01"
period: "01-2024"  // ERROR: Should be "2024-01"
period: "2024-1"   // ERROR: Should be "2024-01"
```

**Solution**:
1. Use format: YYYY-MM (e.g., 2024-01)
2. Month must be zero-padded (01-12)
3. Validate before import

### Issue 6: Vacation Plan Non-Numeric Values

**Problem**: Vacation plan cells contain text markers
```
cells: [0, "V", 1, "X", 0.5, ...]  // ERROR: Non-numeric!
```

**Solution**:
1. Replace text markers with numeric values:
   - "V" or "X" → 1 (full week)
   - "H" or "0.5" → 0.5 (half week)
   - Empty or "-" → 0 (no vacation)
2. Validate all cells are numeric before import

### Issue 7: Missing Required Fields

**Problem**: Daily status missing required field
```
{
  "aircraftId": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  // Missing: posHours, fmcHours
}
```

**Solution**:
1. Identify missing required fields
2. Populate with appropriate values:
   - posHours: typically 24
   - fmcHours: calculated from downtime
3. Validate all required fields before submission

### Issue 8: Aircraft Not Found

**Problem**: Daily status references non-existent aircraft
```
aircraftId: "507f1f77bcf86cd799439999"  // Aircraft doesn't exist!
```

**Solution**:
1. Verify aircraft exists in system
2. Use correct aircraftId from Aircraft collection
3. Create aircraft first if needed
4. Check for typos in registration



---

## 12. Quick Reference Tables

### Aircraft Fleet Summary

| Registration | Fleet Group | Aircraft Type | Engines | Owner | Status |
|--------------|-------------|---------------|---------|-------|--------|
| HZ-A42 | A340 | A340-642 | 4 | Alpha Star | Active |
| HZ-SKY1 | A340 | A340-212 | 4 | Sky Prime | Active |
| HZ-SKY2 | A330 | A330-243 | 2 | Sky Prime | Active |
| HZ-A2 | A320 | A320-214 | 2 | Alpha Star | Parked |
| HZ-A3 | A320 | A320-214 | 2 | Alpha Star | Active |
| HZ-A4 | A319 | A319-112 | 2 | Alpha Star | Active |
| HZ-A5 | A318 | A318-112 | 2 | Alpha Star | Active |
| HZ-A15 | A320 | A320-216 | 2 | Alpha Star | Active |
| HZ-SKY4 | A319 | A319-115 | 2 | Sky Prime | Active |
| HZ-A8 | Hawker | Hawker 900XP | 2 | Alpha Star | Active |
| HZ-A9 | Hawker | Hawker 900XP | 2 | Alpha Star | Active |
| HZ-A22 | G650ER | G650ER | 2 | Alpha Star | Active |
| HZ-A23 | G650ER | G650ER | 2 | Alpha Star | Active |
| HZ-133 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-134 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-135 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-136 | Cessna | Citation Bravo | 2 | RSAF | Active |

### Budget Clauses

| ID | Description | Typical A330 Budget | Typical G650ER Budget | Typical Cessna Budget |
|----|-------------|-------------------|----------------------|----------------------|
| 1 | Aircraft Lease | $2,500,000 | $3,000,000 | $800,000 |
| 2 | Airframe Maintenance | $1,800,000 | $1,200,000 | $600,000 |
| 3 | Engines and APU Corporate Care | $2,200,000 | $1,800,000 | $900,000 |
| 4 | Landing Gear Overhaul | $800,000 | $500,000 | $300,000 |
| 5 | Component Repair | $600,000 | $400,000 | $250,000 |
| 6 | Spare Parts | $3,500,000 | $2,500,000 | $1,200,000 |
| 7 | Consumables | $250,000 | $180,000 | $100,000 |
| 8 | Ground Support Equipment | $150,000 | $100,000 | $80,000 |
| 9 | Fuel | $1,600,000 | $1,200,000 | $500,000 |
| 10 | Subscriptions | $2,200,000 | $1,800,000 | $800,000 |
| 11 | Insurance | $1,700,000 | $1,400,000 | $600,000 |
| 12 | Cabin Crew | $1,500,000 | $1,200,000 | $500,000 |
| 13 | Manpower | $1,600,000 | $1,300,000 | $600,000 |
| 14 | Handling and Permits | $400,000 | $350,000 | $200,000 |
| 15 | Catering | $300,000 | $250,000 | $150,000 |
| 16 | Communication | $100,000 | $80,000 | $50,000 |
| 17 | Miscellaneous | $200,000 | $150,000 | $100,000 |
| 18 | Training | $2,000,000 | $1,600,000 | $800,000 |

### AOG Workflow States

| # | Status | Purpose | Blocking Reason Required | Next States |
|---|--------|---------|--------------------------|-------------|
| 1 | REPORTED | AOG detected | No | TROUBLESHOOTING, RESOLVED_NO_PARTS |
| 2 | TROUBLESHOOTING | Investigation | No | ISSUE_IDENTIFIED |
| 3 | ISSUE_IDENTIFIED | Root cause found | No | RESOLVED_NO_PARTS, PART_REQUIRED |
| 4 | RESOLVED_NO_PARTS | Fixed without parts | No | BACK_IN_SERVICE |
| 5 | PART_REQUIRED | Parts needed | No | PROCUREMENT_REQUESTED |
| 6 | PROCUREMENT_REQUESTED | Request submitted | No | FINANCE_APPROVAL_PENDING |
| 7 | FINANCE_APPROVAL_PENDING | Awaiting approval | **Yes** | ORDER_PLACED |
| 8 | ORDER_PLACED | PO issued | No | IN_TRANSIT |
| 9 | IN_TRANSIT | Parts in transit | **Yes** | AT_PORT |
| 10 | AT_PORT | At port | **Yes** | CUSTOMS_CLEARANCE |
| 11 | CUSTOMS_CLEARANCE | Customs processing | **Yes** | RECEIVED_IN_STORES |
| 12 | RECEIVED_IN_STORES | In warehouse | No | ISSUED_TO_MAINTENANCE |
| 13 | ISSUED_TO_MAINTENANCE | Issued to maintenance | No | INSTALLED_AND_TESTED |
| 14 | INSTALLED_AND_TESTED | Installed & tested | No | ENGINE_RUN_REQUESTED |
| 15 | ENGINE_RUN_REQUESTED | Engine run required | No | ENGINE_RUN_COMPLETED |
| 16 | ENGINE_RUN_COMPLETED | Engine run successful | No | BACK_IN_SERVICE |
| 17 | BACK_IN_SERVICE | Cleared for ops | No | CLOSED |
| 18 | CLOSED | Event archived | No | (Terminal) |

### ATA Chapters

| Code | Description |
|------|-------------|
| 21 | Air Conditioning |
| 24 | Electrical Power |
| 27 | Flight Controls |
| 29 | Hydraulic Power |
| 32 | Landing Gear |
| 34 | Navigation |
| 36 | Pneumatic |
| 49 | APU |
| 52 | Doors |
| 71 | Power Plant |
| 72 | Engine |
| 73 | Engine Fuel |
| 74 | Ignition |
| 78 | Exhaust |
| 79 | Oil |
| 80 | Starting |

### Maintenance Task Shifts

| Shift | Typical Hours | Example |
|-------|---------------|---------|
| Morning | 06:00 - 14:00 | Day shift |
| Evening | 14:00 - 22:00 | Afternoon shift |
| Night | 22:00 - 06:00 | Night shift |
| Other | Variable | Special operations |

### Vacation Plan Teams

| Team | Purpose | Typical Size |
|------|---------|--------------|
| Engineering | Technical staff | 5-10 people |
| TPL | Technical Planning & Logistics | 5-10 people |



---

## 13. Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Create Users (Admin, Editor, Viewer)
- [ ] Create Aircraft Master Data (16 aircraft)
- [ ] Create Budget Plans (18 clauses × 4 groups)
- [ ] Verify all aircraft registrations are UPPERCASE
- [ ] Verify all budget amounts are positive

### Phase 2: Operational Data (Week 2-3)

- [ ] Import Daily Status (90 days × 16 aircraft)
- [ ] Import Daily Counters (90 days × 16 aircraft)
- [ ] Verify counter monotonicity
- [ ] Verify availability calculations
- [ ] Import AOG Events (3-5 per aircraft)
- [ ] Verify AOG timestamps (clearedAt >= detectedAt)

### Phase 3: Maintenance & Work Orders (Week 3-4)

- [ ] Import Maintenance Tasks (30-60 days)
- [ ] Import Work Orders (5-10 per aircraft)
- [ ] Import Work Order Summaries (12 months)
- [ ] Import Discrepancies (3-8 per aircraft)
- [ ] Verify ATA chapter coverage (10+ chapters)

### Phase 4: Budget & Financials (Week 4)

- [ ] Import Actual Spend (12 months × 4 groups × 18 clauses)
- [ ] Verify budget variance calculations
- [ ] Verify burn rate analysis
- [ ] Check for budget overruns

### Phase 5: Historical Data (Week 4)

- [ ] Import 2024 Daily Status (90 days)
- [ ] Import 2024 Daily Counters (90 days)
- [ ] Verify YoY comparison calculations

### Phase 6: Vacation Plans (Week 5)

- [ ] Create Engineering vacation plan (2025)
- [ ] Create TPL vacation plan (2025)
- [ ] Add employees (5 per team)
- [ ] Enter vacation days (48 weeks per employee)
- [ ] Verify overlap detection

### Phase 7: Validation & Testing (Week 5-6)

- [ ] Run data quality checks
- [ ] Verify all required fields populated
- [ ] Test all KPI calculations
- [ ] Test all alert triggers
- [ ] Test import/export functionality
- [ ] Verify dashboard displays correctly

### Phase 8: Go-Live (Week 6)

- [ ] User training completed
- [ ] Documentation finalized
- [ ] Backup created
- [ ] System monitoring enabled
- [ ] Support team ready



---

## 14. Support & Troubleshooting

### Getting Help

**For Data Issues**:
1. Check "Common Data Issues & Solutions" section (Section 11)
2. Review validation rules for the specific collection (Section 2)
3. Verify data format matches examples in Section 10

**For API Issues**:
1. Check API Endpoints Reference (Section 9)
2. Verify authentication token is valid
3. Check request body matches DTO schema
4. Review error message for specific validation failure

**For Dashboard Issues**:
1. Verify data freshness (Section 6)
2. Check data completeness (Section 6)
3. Verify KPI calculations (Section 7)
4. Check alert thresholds (Section 8)

### Contact Information

- **Technical Support**: [support email]
- **Data Issues**: [data team email]
- **Dashboard Questions**: [dashboard team email]
- **Emergency**: [emergency contact]

### Documentation References

- **System Architecture**: See `.kiro/steering/system-architecture.md`
- **AOG Workflow Guide**: See `.kiro/steering/aog-wo-vacation-walkthrough.md`
- **Development Guidelines**: See `.kiro/steering/alphastar.md`
- **API Documentation**: Available at `/api/docs` (Swagger UI)

---

## 15. Glossary

**AOG**: Aircraft On Ground - aircraft unable to fly due to maintenance or other issues

**ATA**: Air Transport Association - standardized aviation maintenance classification system

**MTBF**: Mean Time Between Failures - average operating time between maintenance events

**MTTR**: Mean Time To Repair - average time to resolve an AOG event

**FMC**: Fully Mission Capable - aircraft available for scheduled operations

**NMCM-S**: Not Mission Capable - Scheduled maintenance downtime

**NMCM-U**: Not Mission Capable - Unscheduled maintenance downtime

**NMCS**: Not Mission Capable - Supply (parts shortage)

**POS**: Possessed hours - baseline 24 hours per day

**TTSN**: Total Time Since New - cumulative airframe hours

**TCSN**: Total Cycles Since New - cumulative airframe cycles

**MSN**: Manufacturer Serial Number - unique aircraft identifier

**WO**: Work Order - formal maintenance task

**KPI**: Key Performance Indicator - measurable business metric

**YoY**: Year-over-Year - comparison with same period previous year

**Burn Rate**: Rate of budget consumption per month

**Variance**: Difference between planned and actual spending

**Utilization**: Aircraft flight hours and cycles

**Availability**: Percentage of time aircraft is mission-capable

**Discrepancy**: Defect or issue found during maintenance

**Blocking Reason**: Reason why an AOG event is waiting for resolution

**Workflow Status**: Current state in the AOG event lifecycle

**Overlap**: Vacation scheduling conflict (multiple employees on vacation same week)

---

## Document Information

**Version**: 1.0
**Last Updated**: January 2025
**Author**: Alpha Star Aviation Development Team
**Status**: Final

---

**End of Data Requirements Document**

