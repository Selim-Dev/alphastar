---
inclusion: always
---

# AOG Workflow, Work Orders Simplification & Vacation Plan - Feature Guide

## Overview

This document summarizes the major changes introduced in the AOG Workflow Revamp, Work Orders Simplification, and Vacation Plan module implementation. It serves as a reference for developers working with these features.

## Summary of Changes

### 1. AOG Workflow Revamp

The AOG (Aircraft On Ground) events module has been transformed from single-shot records into a stateful workflow system with:

- **18 Workflow States**: From REPORTED through CLOSED, tracking the complete lifecycle of an AOG event
- **Status History Tracking**: Append-only timeline of all status transitions with actor, timestamp, and notes
- **Blocking Reasons**: Track why an AOG is waiting (Finance, Port, Customs, Vendor, Ops, Other)
- **Parts/Procurement Lifecycle**: Track part requests within AOG events with their own status progression
- **Cost Tracking**: Estimated vs actual costs with audit trail and optional budget integration
- **Enhanced Attachments**: Metadata tracking for purchase orders, invoices, shipping documents, and photos

### 2. Work Orders Simplification

Replaced granular work orders with a monthly per-aircraft summary model:

- **WorkOrderSummary**: Monthly aggregated work order count per aircraft
- **Upsert Behavior**: Create or update by (aircraftId, period) combination
- **Trend Analytics**: Track work order counts over time
- **Preserved Historical Data**: Existing detailed WorkOrder records remain as read-only

### 3. Vacation Plan Module

New module for managing Engineering and TPL team vacation schedules:

- **48-Week Grid**: 4 weeks per month × 12 months
- **Overlap Detection**: Automatic detection when multiple employees have vacation in the same week
- **Excel Import/Export**: Compatible with existing spreadsheet workflows
- **Per-Team Management**: Separate plans for Engineering and TPL teams

---

## New Schemas

### AOGEvent Schema (Extended)

```typescript
// New Enums
enum AOGWorkflowStatus {
  REPORTED, TROUBLESHOOTING, ISSUE_IDENTIFIED, RESOLVED_NO_PARTS,
  PART_REQUIRED, PROCUREMENT_REQUESTED, FINANCE_APPROVAL_PENDING,
  ORDER_PLACED, IN_TRANSIT, AT_PORT, CUSTOMS_CLEARANCE,
  RECEIVED_IN_STORES, ISSUED_TO_MAINTENANCE, INSTALLED_AND_TESTED,
  ENGINE_RUN_REQUESTED, ENGINE_RUN_COMPLETED, BACK_IN_SERVICE, CLOSED
}

enum BlockingReason {
  Finance, Port, Customs, Vendor, Ops, Other
}

enum PartRequestStatus {
  REQUESTED, APPROVED, ORDERED, SHIPPED, RECEIVED, ISSUED
}

// New Fields on AOGEvent
- currentStatus: AOGWorkflowStatus (default: REPORTED)
- blockingReason?: BlockingReason
- statusHistory: StatusHistoryEntry[]
- partRequests: PartRequest[]
- estimatedCostLabor, estimatedCostParts, estimatedCostExternal
- budgetClauseId, budgetPeriod, isBudgetAffecting, linkedActualSpendId
- costAuditTrail: CostAuditEntry[]
- attachmentsMeta: AttachmentMeta[]
- isLegacy?: boolean
```

### WorkOrderSummary Schema (New)

```typescript
{
  aircraftId: ObjectId,      // Reference to Aircraft
  period: string,            // YYYY-MM format
  workOrderCount: number,    // >= 0
  totalCost?: number,        // >= 0
  currency: string,          // Default: USD
  notes?: string,
  sourceRef?: string,        // External system reference
  updatedBy: ObjectId
}
// Unique index on (aircraftId, period)
```

### VacationPlan Schema (New)

```typescript
enum VacationTeam { Engineering, TPL }

VacationEmployee {
  name: string,
  cells: number[48],         // 48 weeks of values
  total: number              // Computed sum
}

VacationPlan {
  year: number,
  team: VacationTeam,
  employees: VacationEmployee[],
  overlaps: string[48],      // 'Ok' or 'Check' per week
  updatedBy: ObjectId
}
// Unique index on (year, team)
```

---

## New API Endpoints

### AOG Events (Extended)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/aog-events/analytics/stages` | Stage breakdown counts by status and blocking reason |
| GET | `/aog-events/analytics/bottlenecks` | Average time in each status and blocking states |

### Work Order Summaries (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/work-order-summaries` | List summaries with filters |
| POST | `/work-order-summaries` | Create/upsert summary |
| GET | `/work-order-summaries/:id` | Get single summary |
| PUT | `/work-order-summaries/:id` | Update summary |
| DELETE | `/work-order-summaries/:id` | Delete summary (Admin only) |
| GET | `/work-order-summaries/trends` | Get trend data by period |
| GET | `/work-order-summaries/total` | Get total count for period range |

### Vacation Plans (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vacation-plans` | List plans (filter by year, team) |
| POST | `/vacation-plans` | Create plan |
| GET | `/vacation-plans/:id` | Get single plan |
| PUT | `/vacation-plans/:id` | Bulk update plan |
| DELETE | `/vacation-plans/:id` | Delete plan (Admin only) |
| PATCH | `/vacation-plans/:id/cell` | Update single cell |
| POST | `/vacation-plans/:id/employees` | Add employee |
| DELETE | `/vacation-plans/:id/employees/:name` | Remove employee |
| GET | `/vacation-plans/:id/export` | Export to Excel |
| GET | `/vacation-plans/export/year/:year` | Export all plans for year |
| POST | `/vacation-plans/import` | Import from Excel |

### Budget (Extended)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/budget-plans/clone` | Clone budget plans from previous year |

---

## KPI Formula Updates

### Fleet Health Score (Updated)

The Fleet Health Score formula has been updated to remove the maintenance efficiency component (which relied on overdue work order counts):

```typescript
Fleet Health Score = (
  Availability Score × 0.45 +    // Increased from 0.40
  AOG Impact Score × 0.30 +      // Increased from 0.25
  Budget Health Score × 0.25     // Increased from 0.20
)

Where:
- Availability Score = Fleet Availability % (capped at 100)
- AOG Impact Score = 100 - (Active AOG Count × 10), min 0
- Budget Health Score = 100 - Budget Utilization %, min 0
```

### Executive Alerts (Updated)

- **Removed**: Overdue Work Order alerts (no longer applicable with summary model)
- **Added**: AOG Blocking State alerts for events stuck in waiting states

---

## Migration Notes

### AOG Events - No Migration Required

Legacy AOG events (without `currentStatus` field) are handled at read time:
- If `clearedAt` is null → inferred status is `REPORTED`
- If `clearedAt` is set → inferred status is `BACK_IN_SERVICE`
- `isLegacy` flag is set to `true` for these events

### Work Orders - Preserved as Read-Only

- Existing detailed WorkOrder records are preserved
- New WorkOrderSummary collection created for monthly aggregates
- Dashboard KPIs now use WorkOrderSummary for trend data
- Historical Work Orders page available for viewing detailed records

### Vacation Plans - New Collection

- New `vacation_plans` collection created
- No migration from existing data (fresh start)
- Import from Excel supported for initial data load

---

## Import/Export Templates

### AOG Events Excel Template (Updated)

New columns added:
- `currentStatus` - Defaults to REPORTED on import
- `blockingReason` - Optional blocking reason

### Work Order Summary Excel Template (New)

Columns:
- `aircraftRegistration` - Aircraft tail number
- `period` - YYYY-MM format
- `workOrderCount` - Number of work orders
- `totalCost` - Optional total cost
- `notes` - Optional notes

### Vacation Plan Excel Template (New)

Structure:
- Two sheets: "Engineering" and "TPL"
- First column: Employee names
- 48 week columns (W1-W48)
- Last column: Total (computed)
- Last row: Overlaps (computed)

---

## Frontend Components

### AOG Workflow UI

- `StatusTimeline` - Displays status history as vertical timeline
- `NextStepActionPanel` - Shows available transitions with role-aware controls
- `PartsTab` - Part request management
- `CostsTab` - Cost tracking with budget integration
- `AttachmentsTab` - Document management

### Work Order Summary UI

- `WorkOrderSummaryPage` - Monthly grid/list view with filters
- Quick entry form for new summaries
- Trend visualization

### Vacation Plan UI

- `VacationPlanGrid` - 48-week editable grid
- `VacationPlanPage` - Tabs for Engineering/TPL teams
- Year selector and import/export buttons

---

## Known Limitations

1. **AOG Workflow Transitions**: Not all transition endpoints are implemented in the controller (transitions are handled via update endpoint)
2. **Part Request CRUD**: Part request endpoints are not exposed separately (managed via AOG event update)
3. **Cost Generation**: Generate ActualSpend from AOG costs endpoint not exposed (handled via service method)

---

## Follow-up Tasks

1. Implement dedicated transition endpoint (`POST /aog-events/:id/transitions`)
2. Implement dedicated part request endpoints
3. Add cost generation endpoint
4. Add comprehensive E2E tests for new workflows
5. Add property-based tests for validation logic

