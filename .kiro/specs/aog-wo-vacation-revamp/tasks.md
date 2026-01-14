# Implementation Plan: AOG Workflow, Work Orders Simplification & Vacation Plan

## Overview

This implementation plan covers three major features for the Alpha Star Aviation KPIs Dashboard:
1. AOG Workflow Revamp - Transform AOG events into a stateful workflow
2. Work Orders Simplification - Monthly per-aircraft summary model
3. Vacation Plan Module - New module for team vacation scheduling

Tests and property tests are excluded for faster execution.

## Tasks

- [x] 1. AOG Workflow Backend - Schema and Enums
  - [x] 1.1 Add workflow status enum and blocking reason enum to AOG schema
    - Add AOGWorkflowStatus enum with 18 states
    - Add BlockingReason enum (Finance, Port, Customs, Vendor, Ops, Other)
    - Add PartRequestStatus enum
    - _Requirements: 1.2, 3.1_
  - [x] 1.2 Extend AOGEvent schema with workflow fields
    - Add currentStatus field with default REPORTED
    - Add blockingReason optional field
    - Add statusHistory array (StatusHistoryEntry sub-document)
    - Add partRequests array (PartRequest sub-document)
    - Add estimated cost fields
    - Add budget integration fields (budgetClauseId, budgetPeriod, isBudgetAffecting, linkedActualSpendId)
    - Add costAuditTrail array
    - Add attachmentsMeta array with enhanced metadata
    - Add isLegacy flag
    - _Requirements: 1.1, 2.1, 3.2, 4.1, 5.1, 5.2, 5.3, 6.2_

- [x] 2. AOG Workflow Backend - Service and Transitions
  - [x] 2.1 Implement transition validation logic
    - Create ALLOWED_TRANSITIONS map
    - Create BLOCKING_STATUSES array
    - Implement validateTransition method
    - _Requirements: 1.3, 3.2_
  - [x] 2.2 Implement status transition method
    - Validate transition is allowed
    - Validate blocking reason if required
    - Append to statusHistory
    - Update currentStatus
    - Auto-set clearedAt for terminal statuses
    - _Requirements: 1.3, 1.4, 2.1, 2.2_
  - [x] 2.3 Implement legacy status inference
    - Add inferLegacyStatus method
    - Apply in findById and findAll
    - Set isLegacy flag for events without currentStatus
    - _Requirements: 10.1, 10.2_
  - [x] 2.4 Implement part request CRUD methods
    - addPartRequest method
    - updatePartRequest method
    - Calculate total parts cost
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 2.5 Implement cost audit trail
    - Track cost field changes
    - Append to costAuditTrail on update
    - _Requirements: 5.5_
  - [x] 2.6 Implement budget integration
    - generateActualSpend method
    - Prevent duplicate spend entries
    - Link AOG to ActualSpend
    - _Requirements: 5.4, 20.1, 20.2, 20.3, 20.4_

- [-] 3. AOG Workflow Backend - Controller and DTOs
  - [ ] 3.1 Create transition DTOs
    - CreateTransitionDto (toStatus, notes, blockingReason, metadata)
    - _Requirements: 7.1_
  - [ ] 3.2 Create part request DTOs
    - CreatePartRequestDto
    - UpdatePartRequestDto
    - _Requirements: 7.3, 7.4_
  - [ ] 3.3 Add new controller endpoints
    - POST /aog-events/:id/transitions
    - GET /aog-events/:id/history
    - POST /aog-events/:id/parts
    - PUT /aog-events/:id/parts/:partId
    - POST /aog-events/:id/costs/generate-spend
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4. AOG Workflow Backend - Analytics
  - [x] 4.1 Implement stage breakdown analytics
    - Count AOG events by currentStatus
    - Count by blockingReason
    - GET /aog-events/analytics/stages endpoint
    - _Requirements: 3.4, 7.5_
  - [x] 4.2 Implement bottleneck analytics
    - Calculate average time in each status
    - Calculate average time in blocking states
    - GET /aog-events/analytics/bottlenecks endpoint
    - _Requirements: 3.5, 7.6_

- [x] 5. Checkpoint - AOG Backend Complete
  - Ensure all AOG backend endpoints work correctly
  - Verify legacy AOG events load with inferred status
  - Ask the user if questions arise

- [x] 6. Work Order Summary Backend - Schema and Module
  - [x] 6.1 Create WorkOrderSummary schema
    - aircraftId, period, workOrderCount, totalCost, currency, notes, sourceRef
    - Unique index on (aircraftId, period)
    - _Requirements: 11.1_
  - [x] 6.2 Create WorkOrderSummary module structure
    - Create module, controller, service, repository files
    - Register in app.module.ts
    - _Requirements: 11.1_

- [x] 7. Work Order Summary Backend - Service and Controller
  - [x] 7.1 Implement upsert logic
    - Create or update by (aircraftId, period)
    - Validate count >= 0 and cost >= 0
    - _Requirements: 11.2, 11.3_
  - [x] 7.2 Implement filter queries
    - Filter by aircraft, fleet group, period range
    - _Requirements: 11.4_
  - [x] 7.3 Implement trend calculation
    - Aggregate counts by period
    - _Requirements: 14.2_
  - [x] 7.4 Create controller endpoints
    - GET /work-order-summaries
    - POST /work-order-summaries
    - GET /work-order-summaries/:id
    - PUT /work-order-summaries/:id
    - DELETE /work-order-summaries/:id
    - GET /work-order-summaries/trends
    - _Requirements: 11.1, 11.4_

- [x] 8. Vacation Plan Backend - Schema and Module
  - [x] 8.1 Create VacationPlan schema
    - VacationTeam enum (Engineering, TPL)
    - VacationEmployee sub-document (name, cells[48], total)
    - VacationPlan document (year, team, employees, overlaps[48])
    - Unique index on (year, team)
    - _Requirements: 15.1, 15.3_
  - [x] 8.2 Create VacationPlan module structure
    - Create module, controller, service, repository files
    - Register in app.module.ts
    - _Requirements: 15.1_

- [x] 9. Vacation Plan Backend - Service and Controller
  - [x] 9.1 Implement overlap detection
    - computeOverlaps method
    - Recalculate on save
    - _Requirements: 15.5_
  - [x] 9.2 Implement total calculation
    - Calculate employee totals on save
    - _Requirements: 15.4_
  - [x] 9.3 Implement cell update
    - Validate numeric values
    - Update single cell
    - Recalculate overlaps and totals
    - _Requirements: 15.2, 16.5_
  - [x] 9.4 Create controller endpoints
    - GET /vacation-plans
    - POST /vacation-plans
    - GET /vacation-plans/:id
    - PUT /vacation-plans/:id
    - PATCH /vacation-plans/:id/cell
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 10. Checkpoint - Backend Modules Complete
  - Ensure all backend modules are working
  - Test basic CRUD operations
  - Ask the user if questions arise

- [x] 11. Import/Export - AOG Updates
  - [x] 11.1 Update AOG Excel template
    - Add currentStatus column (default REPORTED for import)
    - Add blockingReason column
    - _Requirements: 9.1, 9.2_
  - [x] 11.2 Update AOG import logic
    - Set currentStatus to REPORTED on import
    - Validate timestamps
    - _Requirements: 9.1, 9.3, 9.4_
  - [x] 11.3 Update AOG export logic
    - Include currentStatus, blockingReason, cost summary
    - _Requirements: 9.2_

- [x] 12. Import/Export - Work Order Summary
  - [x] 12.1 Create WO Summary Excel template
    - Columns: aircraftRegistration, period, workOrderCount, totalCost, notes
    - _Requirements: 13.1_
  - [x] 12.2 Implement WO Summary import
    - Parse Excel file
    - Upsert by (aircraftId, period)
    - Validate count and cost
    - _Requirements: 13.2, 13.3_
  - [x] 12.3 Implement WO Summary export
    - Export summaries for period range
    - _Requirements: 13.4_

- [x] 13. Import/Export - Vacation Plan
  - [x] 13.1 Implement vacation plan import
    - Parse two sheets (Engineering, TPL)
    - Validate numeric values
    - Create/update plans
    - _Requirements: 17.1, 17.3_
  - [x] 13.2 Implement vacation plan export
    - Generate Excel with 48 week columns
    - Include overlap indicators
    - _Requirements: 17.2, 17.4_
  - [x] 13.3 Add export endpoint
    - GET /vacation-plans/:id/export
    - POST /vacation-plans/import
    - _Requirements: 18.4, 18.5_

- [x] 14. Dashboard KPI Updates
  - [x] 14.1 Update Fleet Health Score calculation
    - Remove or replace maintenance efficiency component
    - Adjust weights (availability: 0.45, aog: 0.30, budget: 0.25)
    - _Requirements: 14.3_
  - [x] 14.2 Add Work Order Count Trend KPI
    - Query WorkOrderSummary for trend data
    - _Requirements: 14.2_
  - [x] 14.3 Ensure dashboard handles empty detailed WOs
    - No errors when WorkOrder collection is empty
    - _Requirements: 14.4_
  - [x] 14.4 Update executive alerts
    - Remove overdue WO alerts if not applicable
    - Add AOG blocking state alerts
    - _Requirements: 21.1, 21.2_

- [x] 15. Checkpoint - Backend Complete
  - Verify all backend functionality
  - Test import/export operations
  - Verify dashboard KPIs compute correctly
  - Ask the user if questions arise

- [x] 16. AOG Workflow Frontend - Types and Hooks
  - [x] 16.1 Update AOG types
    - Add AOGWorkflowStatus type
    - Add BlockingReason type
    - Add PartRequest type
    - Add StatusHistoryEntry type
    - Update AOGEvent interface
    - _Requirements: 1.2, 2.2, 3.1, 4.2_
  - [x] 16.2 Update useAOGEvents hook
    - Add transitionStatus mutation
    - Add getHistory query
    - Add addPartRequest mutation
    - Add updatePartRequest mutation
    - Add generateSpend mutation
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 17. AOG Workflow Frontend - List Page
  - [x] 17.1 Update AOG list columns
    - Add currentStatus column
    - Add blockingReason badge
    - Add age (time since detected) column
    - Add cost-to-date column
    - _Requirements: 8.1_
  - [x] 17.2 Add status filter
    - Filter by currentStatus
    - Filter by blockingReason
    - _Requirements: 8.1_

- [x] 18. AOG Workflow Frontend - Detail View
  - [x] 18.1 Create status timeline component
    - Display statusHistory as vertical timeline
    - Show actor, timestamp, notes for each entry
    - _Requirements: 8.2_
  - [x] 18.2 Create next step action panel
    - Show available transitions based on current status
    - Role-aware (Viewers can't mutate)
    - Transition form with notes and blocking reason
    - _Requirements: 8.3, 8.5, 8.6_
  - [x] 18.3 Create parts/procurement tab
    - List part requests
    - Add/edit part request forms
    - Show status progression
    - _Requirements: 8.4_
  - [x] 18.4 Create costs tab
    - Show estimated vs actual costs
    - Budget clause mapping
    - Generate ActualSpend button
    - _Requirements: 8.4_
  - [x] 18.5 Create attachments tab
    - List attachments with metadata
    - Upload new attachments
    - Download/view attachments
    - _Requirements: 8.4_

- [x] 19. Work Order Summary Frontend
  - [x] 19.1 Update WorkOrder types
    - Add WorkOrderSummary interface
    - _Requirements: 11.1_
  - [x] 19.2 Create useWorkOrderSummaries hook
    - CRUD operations
    - Trend query
    - _Requirements: 11.1, 14.2_
  - [x] 19.3 Create Work Order Summary page
    - Monthly grid/list view
    - Filters (aircraft, fleet group, period)
    - Quick entry form
    - Import/export buttons
    - _Requirements: 12.1, 12.2, 12.3_
  - [x] 19.4 Update navigation
    - Update Work Orders menu item to point to summary page
    - Add "Historical Work Orders" link for detailed records
    - _Requirements: 11.5_

- [x] 20. Vacation Plan Frontend
  - [x] 20.1 Create vacation plan types
    - VacationTeam type
    - VacationEmployee interface
    - VacationPlan interface
    - _Requirements: 15.1_
  - [x] 20.2 Create useVacationPlans hook
    - CRUD operations
    - Cell update mutation
    - Import/export operations
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  - [x] 20.3 Create vacation plan grid component
    - Fixed left column with employee names
    - 48 week columns grouped by month/quarter
    - Editable numeric cells
    - Bottom overlap row (Ok/Check)
    - Right total column
    - _Requirements: 16.3_
  - [x] 20.4 Create vacation plan page
    - Tabs for Engineering and TPL
    - Add/remove employee rows
    - Import/export buttons
    - Year selector
    - _Requirements: 16.1, 16.2, 16.4, 16.6_
  - [x] 20.5 Add to navigation
    - Add "Vacation Plan" to sidebar
    - _Requirements: 16.1_

- [x] 21. Checkpoint - Frontend Complete
  - Verify all frontend pages work correctly
  - Test AOG workflow transitions
  - Test vacation plan grid editing
  - Ask the user if questions arise

- [x] 22. Budget Integration
  - [x] 22.1 Add budget clone functionality
    - Clone budget plans from previous year
    - Optional adjustment percentage
    - _Requirements: 19.2_
  - [x] 22.2 Update budget page UI
    - Add clone from previous year button
    - _Requirements: 19.2, 19.3_

- [x] 23. Documentation and Steering
  - [x] 23.1 Create steering document
    - Summary of changes
    - Final schemas and endpoints
    - Migration notes
    - KPI/financial impact
    - _Requirements: 22.1, 22.2, 22.3_
  - [x] 23.2 Update system-architecture.md
    - Add new schemas
    - Add new endpoints
    - Update KPI formulas
    - _Requirements: 22.2_

- [x] 24. Final Checkpoint
  - Verify all features work end-to-end
  - Verify dashboard displays correctly
  - Verify import/export operations
  - Ask the user if questions arise

## Notes

- Tests and property tests are excluded for faster execution
- Existing detailed WorkOrder records are preserved as read-only
- Legacy AOG events are handled via read-time inference (no migration)
- Fleet Health Score formula adjusted to remove maintenance efficiency component
