# Requirements Document

## Introduction

This document specifies the requirements for a major revamp of the Alpha Star Aviation KPIs Dashboard, covering three primary features:
1. **AOG Workflow Revamp**: Transform AOG events from single-shot records into a stateful workflow with history tracking, waiting states, and procurement lifecycle management
2. **Work Orders Simplification**: Replace granular work orders with monthly per-aircraft aggregated summaries
3. **Vacation Plan Module**: New module for managing Engineering and TPL team vacation schedules with Excel-compatible import/export

Additionally, this includes cross-cutting concerns for financial/budget integration and KPI dashboard audit.

## Glossary

- **AOG**: Aircraft On Ground - an aircraft that cannot fly due to maintenance issues
- **MCC**: Maintenance Control Center - the team that coordinates AOG events
- **LM**: Line Maintenance - maintenance performed on the flight line
- **FM**: Flight Mechanic - technician performing maintenance
- **MRO**: Maintenance, Repair, and Overhaul organization
- **RTS**: Return To Service - aircraft cleared to fly
- **MTTR**: Mean Time To Repair - average duration of AOG events
- **MTBF**: Mean Time Between Failures - average time between AOG events
- **FMC**: Fully Mission Capable - hours aircraft is available for flight
- **POS**: Possessed Hours - total hours aircraft is in possession
- **TPL**: Technical Planning - team responsible for maintenance planning
- **ATA_Chapter**: Air Transport Association chapter code for aircraft systems
- **Workflow_Status**: Current state of an AOG event in the workflow
- **Status_History**: Append-only timeline of workflow transitions
- **Blocking_Reason**: Reason why an AOG is waiting (Finance, Port, Customs, Vendor, Ops)
- **Part_Request**: A request for parts within an AOG event
- **Work_Order_Summary**: Monthly aggregated work order count per aircraft
- **Vacation_Plan**: Annual vacation schedule for a team with 48 weekly columns

---

## Requirements

### Requirement 1: AOG Workflow Status Management

**User Story:** As an MCC operator, I want to progress AOG events through defined workflow states, so that I can track the real-time status of each grounding event.

#### Acceptance Criteria

1. WHEN an AOG event is created, THE System SHALL set the initial Workflow_Status to REPORTED
2. THE System SHALL support the following Workflow_Status values: REPORTED, TROUBLESHOOTING, ISSUE_IDENTIFIED, RESOLVED_NO_PARTS, PART_REQUIRED, PROCUREMENT_REQUESTED, FINANCE_APPROVAL_PENDING, ORDER_PLACED, IN_TRANSIT, AT_PORT, CUSTOMS_CLEARANCE, RECEIVED_IN_STORES, ISSUED_TO_MAINTENANCE, INSTALLED_AND_TESTED, ENGINE_RUN_REQUESTED, ENGINE_RUN_COMPLETED, BACK_IN_SERVICE, CLOSED
3. WHEN a user transitions an AOG event to a new status, THE System SHALL validate that the transition is allowed from the current status
4. WHEN a user transitions an AOG event to BACK_IN_SERVICE or CLOSED, THE System SHALL automatically set the clearedAt timestamp if not already set
5. THE System SHALL preserve existing detectedAt and clearedAt fields as authoritative timestamps for MTTR calculation
6. WHEN an AOG event has clearedAt set to null, THE System SHALL consider it an active AOG for KPI calculations

### Requirement 2: AOG Status History Tracking

**User Story:** As an auditor, I want to see the complete history of status changes for each AOG event, so that I can audit the resolution process.

#### Acceptance Criteria

1. WHEN a status transition occurs, THE System SHALL append a new entry to the Status_History array
2. THE Status_History entry SHALL include: fromStatus, toStatus, timestamp, actorId, actorRole, notes, and optional metadata
3. THE System SHALL NOT allow modification or deletion of Status_History entries (append-only)
4. WHEN viewing an AOG event, THE System SHALL display the Status_History as a timeline
5. THE System SHALL support optional metadata in history entries including partRequestId, financeRef, shippingRef, and opsRunRef

### Requirement 3: AOG Blocking Reasons (Waiting States)

**User Story:** As a manager, I want to see which AOG events are blocked and why, so that I can identify bottlenecks and take action.

#### Acceptance Criteria

1. THE System SHALL support the following Blocking_Reason values: Finance, Port, Customs, Vendor, Ops, Other
2. WHEN an AOG event is in status FINANCE_APPROVAL_PENDING, AT_PORT, CUSTOMS_CLEARANCE, or IN_TRANSIT, THE System SHALL require a Blocking_Reason
3. WHEN displaying AOG events, THE System SHALL show a visual badge indicating the Blocking_Reason
4. THE System SHALL provide analytics showing count of AOG events by Blocking_Reason
5. THE System SHALL provide analytics showing average time spent in each blocking state

### Requirement 4: AOG Parts/Procurement Lifecycle

**User Story:** As a procurement officer, I want to track part requests within an AOG event, so that I can manage the procurement process.

#### Acceptance Criteria

1. THE System SHALL support multiple Part_Request records within a single AOG event
2. WHEN creating a Part_Request, THE System SHALL capture: partNumber, partDescription, quantity, estimatedCost, vendor, and requestedDate
3. THE System SHALL track Part_Request status: REQUESTED, APPROVED, ORDERED, SHIPPED, RECEIVED, ISSUED
4. WHEN a Part_Request is received, THE System SHALL allow recording actualCost and invoiceRef
5. THE System SHALL calculate total parts cost for an AOG event by summing all Part_Request actualCost values

### Requirement 5: AOG Cost Tracking

**User Story:** As a finance manager, I want to track costs associated with AOG events, so that I can monitor maintenance expenses.

#### Acceptance Criteria

1. THE System SHALL track costs per AOG event: costLabor, costParts, costExternal
2. THE System SHALL support both estimated and actual cost values
3. WHEN an AOG event has costs, THE System SHALL allow optional mapping to a Budget Clause (clauseId) and period (YYYY-MM)
4. IF AOG costs are mapped to a budget clause, THE System SHALL allow generating ActualSpend entries from AOG costs
5. THE System SHALL maintain audit trail for cost changes including who changed, when, and previous value

### Requirement 6: AOG Attachments

**User Story:** As an MCC operator, I want to attach documents to AOG events, so that I can store purchase orders, invoices, and shipping documents.

#### Acceptance Criteria

1. THE System SHALL support file attachments stored in S3 for each AOG event
2. THE System SHALL support attachment types: purchase orders, invoices, shipping documents, photos
3. WHEN uploading an attachment, THE System SHALL record the attachment type, filename, uploadedBy, and uploadedAt
4. THE System SHALL allow downloading and viewing attachments from the AOG detail view

### Requirement 7: AOG API Endpoints

**User Story:** As a frontend developer, I want API endpoints for AOG workflow operations, so that I can build the workflow UI.

#### Acceptance Criteria

1. THE System SHALL provide POST `/aog-events/:id/transitions` endpoint for status transitions
2. THE System SHALL provide GET `/aog-events/:id/history` endpoint for retrieving status history
3. THE System SHALL provide POST `/aog-events/:id/parts` endpoint for creating part requests
4. THE System SHALL provide PUT `/aog-events/:id/parts/:partId` endpoint for updating part requests
5. THE System SHALL provide GET `/aog-events/analytics/stages` endpoint for stage breakdown counts
6. THE System SHALL provide GET `/aog-events/analytics/bottlenecks` endpoint for average time-in-stage report

### Requirement 8: AOG UI/UX

**User Story:** As an MCC operator, I want a workflow-driven UI for managing AOG events, so that I can efficiently progress events through the resolution process.

#### Acceptance Criteria

1. WHEN viewing the AOG list, THE System SHALL display: aircraft registration, detectedAt, currentStatus, blockingReason badge, age (time since detected), and cost-to-date
2. WHEN viewing AOG detail, THE System SHALL display a timeline component showing Status_History
3. WHEN viewing AOG detail, THE System SHALL display a "Next step" action panel with role-aware available transitions
4. WHEN viewing AOG detail, THE System SHALL display tabs for: Parts/Procurement, Costs, and Attachments
5. THE System SHALL allow Viewers to view but not mutate AOG events
6. THE System SHALL allow Editors and Admins to transition AOG status

### Requirement 9: AOG Import/Export

**User Story:** As a data administrator, I want to import and export AOG events via Excel, so that I can bulk load historical data.

#### Acceptance Criteria

1. THE System SHALL support importing baseline AOG events with status REPORTED via Excel
2. THE System SHALL export AOG events including: currentStatus, blockingReason, detectedAt, clearedAt, and cost summary
3. WHEN importing AOG events, THE System SHALL validate aircraft registration exists
4. WHEN importing AOG events, THE System SHALL validate timestamp ordering (clearedAt >= detectedAt)

### Requirement 10: AOG Backward Compatibility

**User Story:** As a system administrator, I want existing AOG records to work correctly after the upgrade, so that historical data is preserved.

#### Acceptance Criteria

1. WHEN loading an AOG event without Workflow_Status, THE System SHALL infer status based on clearedAt: if null then REPORTED, if set then BACK_IN_SERVICE
2. THE System SHALL display legacy AOG events (without Status_History) with a "Legacy Event" indicator
3. THE System SHALL NOT require migration of existing AOG records; inference happens at read time

---

### Requirement 11: Work Order Monthly Summary

**User Story:** As a maintenance manager, I want to enter monthly work order counts per aircraft, so that I can track maintenance activity without detailed work order management.

#### Acceptance Criteria

1. THE System SHALL support Work_Order_Summary records with: aircraftId, period (YYYY-MM), workOrderCount, and optional totalCost
2. WHEN creating a Work_Order_Summary, THE System SHALL validate workOrderCount >= 0 and totalCost >= 0
3. THE System SHALL upsert Work_Order_Summary by (aircraftId, period) - updating if exists, creating if not
4. THE System SHALL support filtering Work_Order_Summary by aircraft, fleet group, and period range
5. THE System SHALL preserve existing detailed WorkOrder records as read-only historical data

### Requirement 12: Work Order Summary UI

**User Story:** As a maintenance manager, I want a simple UI for entering monthly work order summaries, so that I can quickly record monthly totals.

#### Acceptance Criteria

1. WHEN viewing the Work Orders page, THE System SHALL display a monthly grid/list by period with filters
2. THE System SHALL provide a quick entry form for: aircraft selection, month selection, work order count, and optional cost
3. THE System SHALL support bulk entry via Excel import
4. WHEN displaying work order data, THE System SHALL show trends over time

### Requirement 13: Work Order Summary Import/Export

**User Story:** As a data administrator, I want to import and export work order summaries via Excel, so that I can bulk load data from external systems.

#### Acceptance Criteria

1. THE System SHALL provide a new Excel template type for Work Order Monthly Summary
2. WHEN importing Work_Order_Summary, THE System SHALL upsert by (aircraftId, period)
3. WHEN importing Work_Order_Summary, THE System SHALL validate: count >= 0, cost >= 0, aircraft exists
4. THE System SHALL export Work_Order_Summary for selected period range

### Requirement 14: Work Order KPI Impact

**User Story:** As a dashboard user, I want KPIs to reflect the new work order model, so that metrics remain meaningful.

#### Acceptance Criteria

1. IF detailed work orders are no longer used, THE System SHALL remove or hide "Overdue Work Orders" KPI
2. THE System SHALL provide "Work Order Count Trend" KPI based on monthly summaries
3. THE System SHALL update Fleet Health Score formula to remove or replace the maintenance efficiency component if overdue WO count is unavailable
4. THE System SHALL ensure dashboard renders without errors when detailed work orders are empty

---

### Requirement 15: Vacation Plan Data Model

**User Story:** As an HR administrator, I want to store vacation plans for Engineering and TPL teams, so that I can manage annual leave schedules.

#### Acceptance Criteria

1. THE System SHALL support Vacation_Plan records with: year, team (Engineering or TPL), employees array, and cells grid
2. THE System SHALL store vacation values as numeric (1, 0.5, etc.) representing days/portions
3. THE System SHALL organize cells as 48 weekly columns (4 weeks per month × 12 months)
4. THE System SHALL calculate total vacation days per employee across the year
5. THE System SHALL detect overlaps: if more than one employee has a value in the same week column, mark as "Check"

### Requirement 16: Vacation Plan UI

**User Story:** As a team lead, I want a grid UI for managing vacation plans, so that I can visualize and edit the annual schedule.

#### Acceptance Criteria

1. THE System SHALL provide a new sidebar page "Vacation Plan"
2. THE System SHALL provide tabs for Engineering and TPL teams
3. WHEN viewing the vacation grid, THE System SHALL display: fixed left column with employee names, 48 week columns grouped by month and quarter, editable numeric cells, bottom "Overlap" row with Ok/Check indicators, right "Total" column per employee
4. THE System SHALL allow adding and removing employee rows
5. THE System SHALL validate that cell values are numeric (reject non-numeric markers like "V")
6. THE System SHALL provide import and export buttons

### Requirement 17: Vacation Plan Import/Export

**User Story:** As an HR administrator, I want to import and export vacation plans via Excel, so that I can work with existing spreadsheets.

#### Acceptance Criteria

1. THE System SHALL import Excel files with two sheets (Engineering and TPL)
2. THE System SHALL export Excel files matching the template layout with 48 week columns
3. WHEN importing, THE System SHALL validate numeric-only values
4. WHEN exporting, THE System SHALL include overlap indicators (computed values)
5. THE System SHALL check overlaps within the same team only (no cross-team conflicts)

### Requirement 18: Vacation Plan API

**User Story:** As a frontend developer, I want API endpoints for vacation plan operations, so that I can build the vacation plan UI.

#### Acceptance Criteria

1. THE System SHALL provide GET/POST `/vacation-plans` endpoints with year and team filters
2. THE System SHALL provide PUT `/vacation-plans/:id` endpoint for bulk updates
3. THE System SHALL provide PATCH `/vacation-plans/:id/cell` endpoint for single cell edits
4. THE System SHALL provide GET `/vacation-plans/:id/export` endpoint for Excel export
5. THE System SHALL provide POST `/vacation-plans/import` endpoint for Excel import

---

### Requirement 19: Budget Initialization

**User Story:** As a finance manager, I want to initialize the yearly budget, so that I can set up budget plans at the beginning of each fiscal year.

#### Acceptance Criteria

1. THE System SHALL support bulk upload of budget plans via Excel
2. THE System SHALL support cloning budget plans from the previous year with optional adjustment percentage
3. THE System SHALL provide a UI for manual budget plan entry by clause and aircraft group
4. THE System SHALL validate that budget plans have positive plannedAmount values

### Requirement 20: AOG Cost to Budget Integration

**User Story:** As a finance manager, I want AOG costs to optionally affect budget variance, so that I can track maintenance expenses against budget.

#### Acceptance Criteria

1. THE System SHALL allow AOG costs to be marked as "informational only" (default) or "budget-affecting"
2. IF AOG costs are marked as budget-affecting, THE System SHALL generate ActualSpend entries
3. THE System SHALL prevent duplicate ActualSpend entries from the same AOG cost
4. THE System SHALL maintain linkage between AOG costs and generated ActualSpend entries

### Requirement 21: KPI Dashboard Audit

**User Story:** As a product owner, I want all dashboard KPIs to be audited and verified, so that the dashboard displays accurate and meaningful data.

#### Acceptance Criteria

1. THE System SHALL verify that all KPIs compute correctly after AOG and Work Order changes
2. THE System SHALL identify and remove/hide KPIs that are no longer supported by available data
3. THE System SHALL ensure dashboards render without empty/NaN states
4. THE System SHALL document any KPI formula changes in the steering documentation

---

### Requirement 22: Documentation and Steering

**User Story:** As a developer, I want updated documentation reflecting all changes, so that I can understand and maintain the system.

#### Acceptance Criteria

1. THE System SHALL include a steering document summarizing: AOG workflow changes, WO monthly summaries, Vacation Plan module, migration notes, KPI/financial impact
2. THE System SHALL update existing project documentation to reflect new schemas and endpoints
3. THE System SHALL document any follow-up tasks or known limitations
