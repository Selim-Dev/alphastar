# AOG Workflow, Work Orders & Vacation Plan - User Walkthrough Guide

## Overview

This guide provides a comprehensive walkthrough of the three major features added to the Alpha Star Aviation KPIs Dashboard:

1. **AOG Workflow Management** - Track aircraft grounding events through 18 workflow states
2. **Work Order Summaries** - Simplified monthly work order tracking
3. **Vacation Plan Management** - Team vacation scheduling with overlap detection

---

## Feature 1: AOG Workflow Management

### What's New?

The AOG (Aircraft On Ground) module has been transformed from simple event logging into a complete workflow management system that tracks the entire lifecycle of grounding events from detection to resolution.

### Key Capabilities

- **18 Workflow States**: Track AOG events from REPORTED → TROUBLESHOOTING → ISSUE_IDENTIFIED → ... → BACK_IN_SERVICE → CLOSED
- **Status History Timeline**: See who did what and when with complete audit trail
- **Blocking Reasons**: Identify bottlenecks (Finance, Port, Customs, Vendor, Ops)
- **Parts Management**: Track part requests with procurement lifecycle
- **Cost Tracking**: Monitor estimated vs actual costs with audit trail
- **Budget Integration**: Optionally link AOG costs to budget variance
- **Document Attachments**: Store purchase orders, invoices, shipping docs, photos

### How to Use

#### Scenario 1: Reporting a New AOG Event

**Context**: Aircraft HZ-A42 (A340) has a hydraulic system failure detected on January 8, 2025.

**Steps**:

1. Navigate to **AOG Events → Log New Event**
2. Fill in the form:
   - **Aircraft**: HZ-A42
   - **Detected At**: 2025-01-08 14:30
   - **Category**: Unscheduled
   - **Reason Code**: Hydraulic System Failure - ATA 29
   - **Responsible Party**: Internal
   - **Action Taken**: Troubleshooting hydraulic pump
   - **Manpower Count**: 3
   - **Man Hours**: 4
3. Click **Create AOG Event**
4. System automatically sets **Current Status** to **REPORTED**

**Result**: AOG event created with ID, visible in AOG List with status badge "REPORTED"

---

#### Scenario 2: Progressing Through Workflow States

**Context**: Continuing from Scenario 1, technicians have identified the issue.

**Steps**:

1. Navigate to **AOG Events → List**
2. Click on the HZ-A42 AOG event
3. In the **Status Timeline** section, see current status: REPORTED
4. In the **Next Step Actions** panel, available transitions show:
   - ✅ **TROUBLESHOOTING** (Start troubleshooting)
5. Click **Transition to TROUBLESHOOTING**
6. Add notes: "Hydraulic pump inspection in progress"
7. Click **Confirm Transition**

**Result**: Status updated to TROUBLESHOOTING, timeline shows new entry with your name and timestamp

**Continue the workflow**:

8. After inspection, transition to **ISSUE_IDENTIFIED**
   - Notes: "Hydraulic pump seal damaged, replacement required"
9. Transition to **PART_REQUIRED**
   - Notes: "Need hydraulic pump assembly P/N 12345-ABC"

**Result**: AOG now shows status PART_REQUIRED, ready for parts procurement

---

#### Scenario 3: Managing Part Requests

**Context**: Continuing from Scenario 2, need to order the hydraulic pump.

**Steps**:

1. In AOG Detail page, click **Parts/Procurement** tab
2. Click **Add Part Request**
3. Fill in the form:
   - **Part Number**: 12345-ABC
   - **Description**: Hydraulic Pump Assembly
   - **Quantity**: 1
   - **Estimated Cost**: $15,000
   - **Vendor**: Airbus Parts Supply
   - **Requested Date**: 2025-01-08
4. Click **Create Part Request**
5. Transition AOG status to **PROCUREMENT_REQUESTED**
   - Notes: "Part request submitted to procurement team"

**Result**: Part request visible in Parts tab with status "REQUESTED"

**Update part request as it progresses**:

6. Click **Edit** on the part request
7. Update fields:
   - **Status**: APPROVED
   - **Invoice Ref**: INV-2025-0108
8. Transition AOG to **FINANCE_APPROVAL_PENDING**
   - **Blocking Reason**: Finance (required for this status)
   - Notes: "Awaiting finance approval for $15,000 purchase"

**Result**: AOG shows blocking badge "Finance", visible in bottleneck analytics

---

#### Scenario 4: Tracking Costs and Budget Impact

**Context**: Part has been ordered, need to track costs.

**Steps**:

1. In AOG Detail page, click **Costs** tab
2. Fill in estimated costs:
   - **Estimated Labor**: $2,000
   - **Estimated Parts**: $15,000
   - **Estimated External**: $500
3. Mark **Budget Affecting**: Yes
4. Select **Budget Clause**: Component Repair (Clause 5)
5. Select **Budget Period**: 2025-01
6. Click **Save Costs**

**Result**: Costs saved with audit trail entry

**After work is complete**:

7. Update actual costs:
   - **Actual Labor**: $2,200 (slightly over estimate)
   - **Actual Parts**: $15,000
   - **Actual External**: $450
8. Click **Generate ActualSpend Entry**
9. Confirm generation

**Result**: ActualSpend entry created in budget system, linked to AOG event, affects budget variance for January 2025

---

#### Scenario 5: Completing the AOG Workflow

**Context**: Part received, installed, and tested. Aircraft ready to return to service.

**Steps**:

1. Update part request:
   - **Status**: RECEIVED
   - **Actual Cost**: $15,000
   - **Received Date**: 2025-01-12
2. Transition AOG through remaining states:
   - **ORDER_PLACED** → "PO-2025-0108 issued"
   - **IN_TRANSIT** → Blocking Reason: Vendor, "Shipped via DHL, tracking #123456"
   - **RECEIVED_IN_STORES** → "Part received in warehouse"
   - **ISSUED_TO_MAINTENANCE** → "Part issued to Line Maintenance"
   - **INSTALLED_AND_TESTED** → "Hydraulic pump installed, system tested OK"
   - **ENGINE_RUN_REQUESTED** → "Engine run required for final verification"
   - **ENGINE_RUN_COMPLETED** → "Engine run completed successfully"
   - **BACK_IN_SERVICE** → "Aircraft cleared for flight operations"
3. System automatically sets **Cleared At** timestamp
4. Optionally transition to **CLOSED** for final archival

**Result**: AOG event complete, no longer counts as "Active AOG", MTTR calculated from detectedAt to clearedAt

---

#### Scenario 6: Analyzing AOG Bottlenecks

**Context**: Manager wants to see where AOG events are getting stuck.

**Steps**:

1. Navigate to **AOG Events → Analytics**
2. View **Stage Breakdown** chart:
   - Shows count of AOG events in each workflow status
   - Example: 2 in FINANCE_APPROVAL_PENDING, 1 in CUSTOMS_CLEARANCE
3. View **Blocking Reasons** chart:
   - Shows count by blocking reason
   - Example: Finance: 2, Customs: 1, Port: 0
4. View **Bottleneck Analysis** table:
   - Shows average time spent in each status
   - Example: FINANCE_APPROVAL_PENDING avg 3.5 days, CUSTOMS_CLEARANCE avg 7.2 days
5. Identify problem areas and take action

**Result**: Data-driven insights into procurement and approval bottlenecks

---

## Feature 2: Work Order Summaries

### What's New?

Simplified work order tracking with monthly per-aircraft summaries instead of detailed work order management. Ideal for high-level KPI tracking without administrative overhead.

### Key Capabilities

- **Monthly Aggregation**: Enter total work order count per aircraft per month
- **Cost Tracking**: Optional total cost per month
- **Trend Analysis**: Visualize work order counts over time
- **Excel Import/Export**: Bulk load data from external systems
- **Historical Preservation**: Detailed work orders preserved as read-only

### How to Use

#### Scenario 1: Entering Monthly Work Order Summary

**Context**: January 2025 is complete, need to record work order counts for the fleet.

**Steps**:

1. Navigate to **Work Orders → Monthly Summary**
2. Click **Add Summary**
3. Fill in the form:
   - **Aircraft**: HZ-A42 (A340)
   - **Period**: 2025-01
   - **Work Order Count**: 12
   - **Total Cost**: $45,000 (optional)
   - **Notes**: "Routine maintenance plus hydraulic repair"
4. Click **Create Summary**

**Result**: Summary created, visible in monthly grid

**Repeat for other aircraft**:

5. Add summary for HZ-A30 (A330):
   - Period: 2025-01
   - Count: 8
   - Cost: $22,000
6. Add summary for HZ-G01 (G650ER):
   - Period: 2025-01
   - Count: 3
   - Cost: $8,500

**Result**: January 2025 summaries complete for 3 aircraft

---

#### Scenario 2: Viewing Work Order Trends

**Context**: Manager wants to see work order trends over the past 6 months.

**Steps**:

1. Navigate to **Work Orders → Monthly Summary**
2. Set filters:
   - **Fleet Group**: A340
   - **Period Range**: 2024-08 to 2025-01
3. View **Trend Chart**:
   - Line chart showing work order counts by month
   - Example: Aug: 10, Sep: 12, Oct: 9, Nov: 11, Dec: 14, Jan: 12
4. View **Total Count**: 68 work orders over 6 months
5. View **Average per Month**: 11.3 work orders

**Result**: Clear visualization of maintenance activity trends

---

#### Scenario 3: Bulk Import via Excel

**Context**: Have work order data from external system in Excel format.

**Steps**:

1. Navigate to **Import/Export**
2. Select **Template Type**: Work Order Monthly Summary
3. Click **Download Template**
4. Open template in Excel
5. Fill in data:

| Aircraft Registration | Period  | Work Order Count | Total Cost | Notes |
|-----------------------|---------|------------------|------------|-------|
| HZ-A42                | 2024-12 | 14               | 52000      | High activity month |
| HZ-A42                | 2025-01 | 12               | 45000      | Normal activity |
| HZ-A30                | 2024-12 | 9                | 28000      |       |
| HZ-A30                | 2025-01 | 8                | 22000      |       |

6. Save Excel file
7. Click **Upload File** and select the file
8. Click **Import**
9. Review validation results
10. Confirm import

**Result**: 4 work order summaries created/updated via bulk import

---

## Feature 3: Vacation Plan Management

### What's New?

Manage Engineering and TPL team vacation schedules with a 48-week grid (4 weeks × 12 months) and automatic overlap detection.

### Key Capabilities

- **48-Week Grid**: Visual calendar with 4 weeks per month
- **Numeric Values**: Support partial days (0.5, 1, 2, etc.)
- **Overlap Detection**: Automatic "Check" indicator when multiple employees have vacation in same week
- **Team Separation**: Independent plans for Engineering and TPL teams
- **Excel Import/Export**: Compatible with existing spreadsheet workflows
- **Auto-Calculation**: Total vacation days per employee computed automatically

### How to Use

#### Scenario 1: Creating a New Vacation Plan

**Context**: Setting up 2025 vacation plan for Engineering team.

**Steps**:

1. Navigate to **Vacation Plan** (sidebar)
2. Select **Year**: 2025
3. Select **Team**: Engineering
4. Click **Create New Plan**
5. Click **Add Employee**
6. Enter name: "Ahmed Al-Rashid"
7. Click **Add Employee** again
8. Enter name: "Fatima Hassan"
9. Click **Add Employee** again
10. Enter name: "Mohammed Ali"

**Result**: Vacation plan created with 3 employees, all cells initialized to 0

---

#### Scenario 2: Entering Vacation Days

**Context**: Planning vacation schedules for Q1 2025.

**Steps**:

1. In the vacation grid, locate **Ahmed Al-Rashid** row
2. Click on **Week 4** (January, Week 4) cell
3. Enter value: **1** (1 week vacation)
4. Click on **Week 8** (February, Week 4) cell
5. Enter value: **0.5** (half week vacation)
6. Press Enter or Tab to save

**Result**: Ahmed's cells updated, Total column shows 1.5 days

**Add vacation for Fatima**:

7. Locate **Fatima Hassan** row
8. Enter **1** in Week 12 (March, Week 4)
9. Enter **1** in Week 20 (May, Week 4)

**Result**: Fatima's Total shows 2 days

**Add vacation for Mohammed**:

10. Locate **Mohammed Ali** row
11. Enter **1** in Week 4 (January, Week 4) - same as Ahmed!
12. Enter **1** in Week 16 (April, Week 4)

**Result**: Mohammed's Total shows 2 days, **Overlap indicator** for Week 4 shows "Check" (red badge)

---

#### Scenario 3: Resolving Vacation Overlaps

**Context**: Week 4 has overlap (Ahmed and Mohammed both on vacation).

**Steps**:

1. Notice **Week 4** column has "Check" indicator at bottom
2. Review who is scheduled:
   - Ahmed Al-Rashid: 1 week
   - Mohammed Ali: 1 week
3. Decide to move Mohammed's vacation to Week 5
4. Click Mohammed's Week 4 cell, change to **0**
5. Click Mohammed's Week 5 cell, change to **1**
6. Press Enter

**Result**: Week 4 overlap indicator changes to "Ok" (green), Week 5 shows "Check" if needed

---

#### Scenario 4: Viewing TPL Team Vacation Plan

**Context**: Need to check TPL team vacation schedule.

**Steps**:

1. In Vacation Plan page, click **TPL** tab
2. If no plan exists, click **Create New Plan**
3. Add TPL employees:
   - "Sara Abdullah"
   - "Khalid Ibrahim"
   - "Noura Al-Mutairi"
4. Enter vacation days for each employee
5. System automatically detects overlaps within TPL team only

**Result**: TPL vacation plan independent from Engineering plan, no cross-team overlap detection

---

#### Scenario 5: Exporting Vacation Plan to Excel

**Context**: Need to share vacation plan with HR department.

**Steps**:

1. In Vacation Plan page, select **Engineering** tab
2. Click **Export to Excel** button
3. File downloads: `vacation-plan-2025-Engineering.xlsx`
4. Open in Excel
5. Review structure:
   - Column A: Employee names
   - Columns B-AY: Week 1 to Week 48 (grouped by month)
   - Column AZ: Total (computed)
   - Row at bottom: Overlaps (Ok/Check indicators)

**Result**: Excel file ready for sharing or printing

---

#### Scenario 6: Importing Vacation Plan from Excel

**Context**: HR has updated vacation plan in Excel, need to import changes.

**Steps**:

1. Receive Excel file with two sheets: "Engineering" and "TPL"
2. Navigate to **Vacation Plan**
3. Click **Import from Excel**
4. Select the Excel file
5. System validates:
   - Two sheets present
   - Numeric values only (rejects "V" or "X" markers)
   - 48 week columns present
6. Review validation results
7. Click **Confirm Import**
8. System creates/updates both Engineering and TPL plans

**Result**: Vacation plans updated from Excel, overlaps recalculated automatically

---

## Dashboard Impact

### Updated KPIs

#### Fleet Health Score (Updated Formula)

**Before**:
```
Fleet Health Score = (
  Availability × 0.40 +
  AOG Impact × 0.25 +
  Budget Health × 0.20 +
  Maintenance Efficiency × 0.15
)
```

**After** (Maintenance Efficiency removed):
```
Fleet Health Score = (
  Availability × 0.45 +
  AOG Impact × 0.30 +
  Budget Health × 0.25
)
```

**Reason**: Work Order Summaries don't track overdue work orders, so maintenance efficiency component removed and weights redistributed.

---

#### Executive Alerts (Updated)

**New Alert**: AOG Blocking State
- **Trigger**: AOG events stuck in waiting states (Finance, Port, Customs, Vendor, Ops)
- **Priority**: Warning (Amber)
- **Example**: "2 AOG events blocked by Finance approval"

**Removed Alert**: Overdue Work Orders
- **Reason**: Work Order Summaries don't track due dates

---

#### Work Order Count Trend (New KPI)

- **Source**: WorkOrderSummary collection
- **Calculation**: Sum of workOrderCount for selected period
- **Display**: Line chart showing monthly trend
- **Example**: "68 work orders completed in last 6 months"

---

## Sample Data Scenarios

### Complete AOG Workflow Example

**Aircraft**: HZ-A42 (A340-642)
**Issue**: Hydraulic system failure
**Timeline**: January 8-15, 2025

| Date | Status | Actor | Notes |
|------|--------|-------|-------|
| Jan 8, 14:30 | REPORTED | MCC Operator | Hydraulic leak detected during pre-flight |
| Jan 8, 15:00 | TROUBLESHOOTING | Line Mechanic | Inspecting hydraulic pump |
| Jan 8, 17:00 | ISSUE_IDENTIFIED | Line Mechanic | Pump seal damaged, replacement required |
| Jan 8, 17:30 | PART_REQUIRED | MCC Operator | Need P/N 12345-ABC |
| Jan 8, 18:00 | PROCUREMENT_REQUESTED | Procurement Officer | Part request submitted |
| Jan 9, 09:00 | FINANCE_APPROVAL_PENDING | Procurement Officer | Awaiting approval for $15K |
| Jan 9, 14:00 | ORDER_PLACED | Finance Manager | PO-2025-0108 issued |
| Jan 10, 08:00 | IN_TRANSIT | Procurement Officer | Shipped via DHL #123456 |
| Jan 12, 10:00 | RECEIVED_IN_STORES | Warehouse | Part received and inspected |
| Jan 12, 14:00 | ISSUED_TO_MAINTENANCE | Warehouse | Part issued to Line Maintenance |
| Jan 13, 16:00 | INSTALLED_AND_TESTED | Line Mechanic | Pump installed, system tested OK |
| Jan 14, 08:00 | ENGINE_RUN_REQUESTED | MCC Operator | Engine run required |
| Jan 14, 10:00 | ENGINE_RUN_COMPLETED | Flight Mechanic | Engine run successful |
| Jan 14, 11:00 | BACK_IN_SERVICE | MCC Operator | Aircraft cleared for operations |
| Jan 15, 09:00 | CLOSED | MCC Supervisor | Event closed, documentation complete |

**Costs**:
- Labor: $2,200
- Parts: $15,000
- External: $450
- **Total**: $17,650

**MTTR**: 6.5 days (156 hours)

---

### Work Order Summary Example

**Fleet**: A340 (2 aircraft: HZ-A42, HZ-A43)
**Period**: Q4 2024 + January 2025

| Aircraft | Period  | WO Count | Total Cost | Notes |
|----------|---------|----------|------------|-------|
| HZ-A42   | 2024-10 | 9        | $32,000    | Routine maintenance |
| HZ-A42   | 2024-11 | 11       | $38,000    | Additional inspections |
| HZ-A42   | 2024-12 | 14       | $52,000    | Heavy maintenance |
| HZ-A42   | 2025-01 | 12       | $45,000    | Hydraulic repair |
| HZ-A43   | 2024-10 | 8        | $28,000    | Routine maintenance |
| HZ-A43   | 2024-11 | 10       | $35,000    | Engine inspection |
| HZ-A43   | 2024-12 | 12       | $42,000    | Landing gear service |
| HZ-A43   | 2025-01 | 9        | $31,000    | Routine maintenance |

**Trend Analysis**:
- HZ-A42: Increasing trend Oct-Dec (9→11→14), normalizing in Jan (12)
- HZ-A43: Stable trend (8-12 range)
- Fleet total: 85 work orders over 4 months, avg 21.25/month

---

### Vacation Plan Example

**Team**: Engineering
**Year**: 2025
**Employees**: 5

| Employee | Q1 Total | Q2 Total | Q3 Total | Q4 Total | Annual Total |
|----------|----------|----------|----------|----------|--------------|
| Ahmed Al-Rashid | 1.5 | 2 | 3 | 1 | 7.5 |
| Fatima Hassan | 1 | 2 | 2 | 1.5 | 6.5 |
| Mohammed Ali | 2 | 1 | 3 | 1 | 7 |
| Sara Abdullah | 1 | 2.5 | 2 | 2 | 7.5 |
| Khalid Ibrahim | 1.5 | 1.5 | 2.5 | 1.5 | 7 |

**Overlaps Detected**:
- Week 4 (Jan): Ahmed + Mohammed (resolved by moving Mohammed to Week 5)
- Week 28 (Jul): Fatima + Sara (both on vacation, flagged for review)
- Week 36 (Sep): Ahmed + Mohammed + Khalid (3 overlaps, critical - needs resolution)

---

## Best Practices

### AOG Workflow

1. **Always add notes** when transitioning status - helps with audit trail
2. **Set blocking reasons** immediately when entering waiting states
3. **Update part requests** as soon as status changes (approved, shipped, received)
4. **Track costs early** - enter estimated costs when part is ordered
5. **Generate ActualSpend** only after AOG is complete and costs are final
6. **Attach documents** - POs, invoices, shipping docs help with audits

### Work Order Summaries

1. **Enter monthly** - don't wait until end of quarter
2. **Include costs** when available - helps with budget tracking
3. **Add notes** for unusual months (heavy maintenance, AOG events)
4. **Use Excel import** for bulk historical data
5. **Review trends** regularly to spot maintenance patterns

### Vacation Plans

1. **Plan early** - enter vacation schedules at start of year
2. **Resolve overlaps** immediately - don't leave "Check" indicators
3. **Update regularly** - adjust as plans change
4. **Export for sharing** - HR and management need visibility
5. **Separate teams** - Engineering and TPL plans are independent

---

## Troubleshooting

### AOG Workflow Issues

**Q: Can't transition to desired status**
- A: Check allowed transitions - some states require intermediate steps
- Example: Can't go directly from REPORTED to ORDER_PLACED, must go through TROUBLESHOOTING → ISSUE_IDENTIFIED → PART_REQUIRED → PROCUREMENT_REQUESTED → FINANCE_APPROVAL_PENDING first

**Q: Blocking reason required error**
- A: Certain statuses require blocking reason: FINANCE_APPROVAL_PENDING, AT_PORT, CUSTOMS_CLEARANCE, IN_TRANSIT
- Select appropriate reason: Finance, Port, Customs, Vendor, Ops, Other

**Q: Can't generate ActualSpend**
- A: Check that AOG has:
  - Budget Affecting = Yes
  - Budget Clause selected
  - Budget Period set
  - Actual costs entered
- Also check that ActualSpend hasn't already been generated (no duplicates allowed)

### Work Order Summary Issues

**Q: Import fails with validation error**
- A: Check that:
  - Aircraft registration exists in system
  - Period format is YYYY-MM
  - Work order count >= 0
  - Total cost >= 0 (if provided)

**Q: Can't see trend chart**
- A: Need at least 2 months of data for trend visualization

### Vacation Plan Issues

**Q: Import fails with "non-numeric value" error**
- A: Excel cells must contain numbers only (0, 0.5, 1, 2, etc.)
- Remove text markers like "V", "X", "Vacation"
- Use 0 for no vacation, 1 for full week, 0.5 for half week

**Q: Overlap not detected**
- A: Overlaps only detected within same team
- Engineering and TPL plans are independent
- Overlap requires 2+ employees with value > 0 in same week

---

## API Reference

### AOG Workflow Endpoints

```
GET    /api/aog-events                          List AOG events
POST   /api/aog-events                          Create AOG event
GET    /api/aog-events/:id                      Get single AOG event
PUT    /api/aog-events/:id                      Update AOG event
DELETE /api/aog-events/:id                      Delete AOG event
POST   /api/aog-events/:id/transitions          Transition status
GET    /api/aog-events/:id/history              Get status history
POST   /api/aog-events/:id/parts                Create part request
PUT    /api/aog-events/:id/parts/:partId        Update part request
POST   /api/aog-events/:id/costs/generate-spend Generate ActualSpend
GET    /api/aog-events/analytics/stages         Stage breakdown
GET    /api/aog-events/analytics/bottlenecks    Bottleneck analysis
```

### Work Order Summary Endpoints

```
GET    /api/work-order-summaries       List summaries
POST   /api/work-order-summaries       Create/upsert summary
GET    /api/work-order-summaries/:id   Get single summary
PUT    /api/work-order-summaries/:id   Update summary
DELETE /api/work-order-summaries/:id   Delete summary
GET    /api/work-order-summaries/trends Get trend data
```

### Vacation Plan Endpoints

```
GET    /api/vacation-plans              List plans
POST   /api/vacation-plans              Create plan
GET    /api/vacation-plans/:id          Get single plan
PUT    /api/vacation-plans/:id          Bulk update plan
PATCH  /api/vacation-plans/:id/cell     Update single cell
DELETE /api/vacation-plans/:id          Delete plan
GET    /api/vacation-plans/:id/export   Export to Excel
POST   /api/vacation-plans/import       Import from Excel
```

---

## Summary

These three features transform the Alpha Star Aviation KPIs Dashboard into a comprehensive maintenance management system:

1. **AOG Workflow** - Complete lifecycle tracking with bottleneck identification
2. **Work Order Summaries** - Simplified KPI tracking without administrative overhead
3. **Vacation Plans** - Team scheduling with conflict detection

All features integrate seamlessly with existing dashboard KPIs, budget tracking, and import/export workflows.

---

**Last Updated**: January 10, 2025
**Version**: 1.0
**Author**: Alpha Star Aviation Development Team
