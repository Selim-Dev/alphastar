# Implementation Plan: AOG Events Revamp

## Overview

Replace the flat, single-event AOG model with a hierarchical Parent Event / Sub-Event architecture. This is a clean-slate migration — all old AOG data has been deleted. The implementation follows a bottom-up build order: backend schemas → repositories → services → controller → frontend hooks → pages → cleanup → testing.

## Tasks

- [x] 1. Rewrite Parent Event schema and create Sub-Event schema
  - [x] 1.1 Rewrite `backend/src/aog-events/schemas/aog-event.schema.ts` — strip all removed fields (responsibleParty, currentStatus, blockingReason, statusHistory, partRequests, all cost fields, milestone fields, workflow fields, isLegacy, isImported, isDemo, etc.), keep only: aircraftId, detectedAt, clearedAt, location, notes, attachments, updatedBy, totalDowntimeHours. Add virtual `status` getter. Update indexes to `{ aircraftId: 1, detectedAt: -1 }`, `{ detectedAt: -1 }`, `{ clearedAt: 1 }`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 14.1, 14.2, 14.3, 14.4, 14.7_
  - [x] 1.2 Create `backend/src/aog-events/schemas/aog-sub-event.schema.ts` — define DepartmentHandoff embedded sub-document (department enum: Procurement/Engineering/Quality/Operations, sentAt, returnedAt, notes) and AOGSubEvent schema (parentEventId, category enum: aog/scheduled/unscheduled, reasonCode, actionTaken, detectedAt, clearedAt, manpowerCount, manHours, departmentHandoffs array, notes, updatedBy, computed fields: technicalTimeHours, departmentTimeHours, departmentTimeTotals, totalDowntimeHours). Add indexes: `{ parentEventId: 1, detectedAt: -1 }`, `{ parentEventId: 1 }`, `{ category: 1, detectedAt: -1 }`, `{ detectedAt: -1 }`.
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.1, 4.5_

- [x] 2. Create DTOs for Parent Event, Sub-Event, and Department Handoff
  - [x] 2.1 Rewrite `backend/src/aog-events/dto/create-aog-event.dto.ts` — only aircraftId (IsMongoId, required), detectedAt (IsDateString, required), clearedAt (IsDateString, optional), location (IsString, optional), notes (IsString, optional). Rewrite `update-aog-event.dto.ts` — PartialType of create DTO with only mutable fields (clearedAt, location, notes).
    - _Requirements: 5.1, 5.4, 16.1, 16.3_
  - [x] 2.2 Create `backend/src/aog-events/dto/create-sub-event.dto.ts` — category (IsEnum aog/scheduled/unscheduled, required), reasonCode (IsString, required), actionTaken (IsString, required), detectedAt (IsDateString, required), clearedAt (IsDateString, optional), manpowerCount (IsNumber, Min(0), required), manHours (IsNumber, Min(0), required), departmentHandoffs (ValidateNested array, optional), notes (IsString, optional). Create `update-sub-event.dto.ts` as PartialType.
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.1, 6.4_
  - [x] 2.3 Create `backend/src/aog-events/dto/create-handoff.dto.ts` — department (IsEnum Procurement/Engineering/Quality/Operations, required), sentAt (IsDateString, required), returnedAt (IsDateString, optional), notes (IsString, optional). Create `update-handoff.dto.ts` as PartialType.
    - _Requirements: 3.1, 7.1, 7.2_
  - [x] 2.4 Update `backend/src/aog-events/dto/filter-aog-event.dto.ts` — support aircraftId, fleetGroup, status (active/completed), startDate, endDate query params. Add category filter for analytics endpoints.
    - _Requirements: 5.2, 8.2, 11.4_

- [x] 3. Rewrite repositories
  - [x] 3.1 Rewrite `backend/src/aog-events/repositories/aog-event.repository.ts` — simplified CRUD: create, findById (populate aircraft), findAll (with filter support for aircraftId, fleetGroup, status, date range), update, delete, countActive, findActive. Remove all old workflow/milestone query methods.
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 14.5_
  - [x] 3.2 Create `backend/src/aog-events/repositories/aog-sub-event.repository.ts` — CRUD: create, findById, findByParentId, update, delete, deleteByParentId (cascade), aggregate (for analytics pipelines).
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 4. Implement Sub-Event service with time bucket computation
  - [x] 4.1 Create `backend/src/aog-events/services/aog-sub-events.service.ts` — implement `computeTimeBuckets()` function: totalDowntimeHours = (clearedAt or now) - detectedAt in hours; departmentTimeHours = sum of all handoff durations; departmentTimeTotals = group handoff durations by department; technicalTimeHours = max(0, totalDowntimeHours - departmentTimeHours). Implement Sub-Event CRUD: create (validate parentId exists, compute buckets, save), findByParentId, findById (validate parentId match), update (recompute buckets), delete.
    - _Requirements: 2.4, 2.5, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 4.2 Implement Department Handoff management in `aog-sub-events.service.ts` — addHandoff (validate returnedAt >= sentAt, push to array, recompute buckets), updateHandoff (find by handoffId, validate, update, recompute), removeHandoff (pull from array, recompute). Each operation saves the recomputed metrics atomically.
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.6, 7.1, 7.2, 7.3, 7.4_
  - [ ]* 4.3 Write property tests for time bucket computation (`backend/src/aog-events/__tests__/time-buckets.property.spec.ts`)
    - **Property 10: Time bucket computation correctness** — generate random sub-events with N handoffs, verify departmentTimeHours = sum of handoff durations, departmentTimeTotals grouped correctly, technicalTimeHours = max(0, total - department), sum of departmentTimeTotals = departmentTimeHours
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  - [ ]* 4.4 Write property tests for handoff duration and sub-event downtime (`backend/src/aog-events/__tests__/time-buckets.property.spec.ts`)
    - **Property 9: Department Handoff duration computation** — generate random handoffs with sentAt/returnedAt, verify durationHours = (returnedAt - sentAt) in hours, always >= 0
    - **Property 7: Sub-Event totalDowntimeHours computation** — generate random sub-events, verify totalDowntimeHours = (clearedAt - detectedAt) in hours, always >= 0
    - **Property 3: Parent Event totalDowntimeHours computation** — generate random parent events, verify totalDowntimeHours = (clearedAt - detectedAt) in hours, always >= 0
    - **Validates: Requirements 1.7, 2.7, 3.5**
  - [ ]* 4.5 Write property test for time bucket recomputation on handoff mutation (`backend/src/aog-events/__tests__/time-buckets.property.spec.ts`)
    - **Property 11: Time bucket recomputation on handoff mutation** — generate a sub-event, add/update/remove handoffs, verify stored metrics match fresh recomputation from current handoffs array
    - **Validates: Requirements 4.6, 6.6, 7.4**

- [x] 5. Rewrite Parent Event service and implement analytics
  - [x] 5.1 Rewrite `backend/src/aog-events/services/aog-events.service.ts` — Parent Event CRUD: create (validate aircraftId exists, compute totalDowntimeHours), findById (populate sub-events, compute derived categories/aggregates), findAll (apply filters, include sub-event counts), update (recompute totalDowntimeHours if clearedAt changes), delete (cascade delete sub-events first via SubEventRepository.deleteByParentId). Implement getActiveAOGEvents, countActiveAOGEvents. Remove all old methods (transitionStatus, getStatusHistory, addPartRequest, updatePartRequest, generateActualSpend, updateBudgetIntegration, getStageBreakdown, getBottleneckAnalytics, getThreeBucketAnalytics, getLocationHeatmap, getDurationDistribution, getAircraftReliability, getMonthlyTrend, getInsights, generateForecast, and all private helpers).
    - _Requirements: 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 14.5, 14.6_
  - [x] 5.2 Implement analytics methods in `aog-events.service.ts` — getAnalyticsSummary (aggregate parent + sub-event counts, active/completed, total downtime), getCategoryBreakdown (aggregate sub-events by category with counts, downtime, percentages), getTimeBreakdown (aggregate technicalTimeHours and departmentTimeTotals across sub-events with percentages). All methods accept filter params (aircraftId, fleetGroup, category, startDate, endDate).
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 5.3 Write property tests for analytics aggregation (`backend/src/aog-events/__tests__/analytics.property.spec.ts`)
    - **Property 15: Analytics summary computation** — generate random event sets, verify counts and totals match manual computation
    - **Property 16: Analytics category breakdown** — generate random sub-events, verify per-category counts/downtime/percentages, percentages sum to 100
    - **Property 17: Analytics time breakdown** — generate random sub-events, verify technicalTime and department totals sum correctly, percentages sum to 100
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 6. Checkpoint — Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Rewrite controller with nested routes
  - [x] 7.1 Rewrite `backend/src/aog-events/aog-events.controller.ts` — Parent Event routes: POST /api/aog-events, GET /api/aog-events (with filter query params), GET /api/aog-events/active, GET /api/aog-events/active/count, GET /api/aog-events/analytics/summary, GET /api/aog-events/analytics/category-breakdown, GET /api/aog-events/analytics/time-breakdown, GET /api/aog-events/:id, PUT /api/aog-events/:id, DELETE /api/aog-events/:id (Admin only via @Roles decorator). Remove all old routes (transition-status, part-requests, budget-integration, old analytics endpoints).
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.9, 11.1, 11.2, 11.3, 14.5_
  - [x] 7.2 Add Sub-Event nested routes to controller — POST /api/aog-events/:parentId/sub-events, GET /api/aog-events/:parentId/sub-events, GET /api/aog-events/:parentId/sub-events/:subId, PUT /api/aog-events/:parentId/sub-events/:subId, DELETE /api/aog-events/:parentId/sub-events/:subId. All routes require JWT auth.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_
  - [x] 7.3 Add Department Handoff nested routes to controller — POST /api/aog-events/:parentId/sub-events/:subId/handoffs, PUT /api/aog-events/:parentId/sub-events/:subId/handoffs/:handoffId, DELETE /api/aog-events/:parentId/sub-events/:subId/handoffs/:handoffId. All routes require JWT auth.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Update module registration and dashboard integration
  - [x] 8.1 Update `backend/src/aog-events/aog-events.module.ts` — register AOGSubEvent schema with MongooseModule.forFeature, register AOGSubEventRepository and AOGSubEventsService as providers, export AOGEventsService for dashboard consumption.
    - _Requirements: 2.6_
  - [x] 8.2 Update `backend/src/dashboard/services/dashboard.service.ts` — update `countActiveAOGEvents()` call to work with new lean Parent Event model (query clearedAt: null). Update MTTR computation to use Parent Event detectedAt/clearedAt. Update alert generation: critical alert for any active Parent Event, warning for active > 48 hours. Remove references to responsibleParty, currentStatus, blockingReason, old three-bucket fields.
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [ ]* 8.3 Write property tests for dashboard integration (`backend/src/aog-events/__tests__/analytics.property.spec.ts`)
    - **Property 18: Dashboard active AOG count and total downtime** — generate random parent events, verify active count = events where clearedAt is null, total downtime = sum of totalDowntimeHours
    - **Property 19: Dashboard MTTR computation** — generate random completed parent events, verify MTTR = average of (clearedAt - detectedAt) in hours, 0 if no completed events
    - **Property 20: Dashboard AOG alerts generation** — generate random parent events, verify critical alerts for active events, warning alerts for active > 48h, no alerts for completed
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.5**

- [x] 9. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Rewrite frontend hooks
  - [x] 10.1 Rewrite `frontend/src/hooks/useAOGEvents.ts` — replace all existing hook functions with: useAOGEvents(filters) for GET /api/aog-events, useAOGEventById(id) for GET /api/aog-events/:id (returns parent + sub-events), useCreateAOGEvent mutation for POST, useUpdateAOGEvent mutation for PUT, useDeleteAOGEvent mutation for DELETE. Use TanStack Query v5 patterns. Invalidate relevant queries on mutations.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 15.5_
  - [x] 10.2 Create `frontend/src/hooks/useAOGSubEvents.ts` — useSubEvents(parentId) for GET /api/aog-events/:parentId/sub-events, useCreateSubEvent mutation, useUpdateSubEvent mutation, useDeleteSubEvent mutation, useAddHandoff mutation, useUpdateHandoff mutation, useRemoveHandoff mutation. Invalidate parent event query and sub-events query on mutations.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_
  - [x] 10.3 Create `frontend/src/hooks/useAOGAnalytics.ts` — useAOGAnalyticsSummary(filter) for GET /api/aog-events/analytics/summary, useAOGCategoryBreakdown(filter) for GET /api/aog-events/analytics/category-breakdown, useAOGTimeBreakdown(filter) for GET /api/aog-events/analytics/time-breakdown. All hooks accept filter params and pass as query params.
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 11. Build Parent Event List Page
  - [x] 11.1 Rewrite `frontend/src/pages/aog/AOGListPage.tsx` (or create new) — table displaying Parent Events with columns: aircraft registration, location, detected date, cleared date (or "Active" badge), categories (colored badges derived from sub-events), sub-event count, total downtime hours, status badge. Default sort by detectedAt descending. Loading skeleton while fetching. Row click navigates to /aog/:id.
    - _Requirements: 8.1, 8.4, 8.5, 8.6_
  - [x] 11.2 Add filter bar to list page — aircraft dropdown (from useAircraft hook), fleet group dropdown, status dropdown (Active/Completed/All), date range pickers (start date, end date). Filters update query params and re-fetch data.
    - _Requirements: 8.2_
  - [x] 11.3 Add "Create Event" dialog to list page — button opens a dialog with ParentEventForm: aircraftId (aircraft dropdown), detectedAt (date-time picker), location (text input), notes (textarea). Form uses React Hook Form + Zod validation. On success, show toast and refresh list.
    - _Requirements: 8.3, 16.1, 16.3_

- [x] 12. Build Parent Event Detail Page
  - [x] 12.1 Rewrite `frontend/src/pages/aog/AOGDetailPage.tsx` — header section showing: aircraft registration, location, detected date, cleared date, total downtime, status badge (Active/Completed). Inline edit controls for clearedAt, location, notes. Delete button visible only to Admin users with confirmation dialog.
    - _Requirements: 9.1, 9.5, 9.7_
  - [x] 12.2 Add time breakdown summary to detail page — display total Technical_Time and per-department time (Procurement, Engineering, Quality, Operations) as horizontal bars or summary cards, aggregated across all sub-events of the parent.
    - _Requirements: 9.6_
  - [x] 12.3 Add Sub-Events list to detail page — display each sub-event as an expandable card showing: category badge, reason code, detected date, cleared date, technical time, department time, status. "Add Sub-Event" button opens SubEventFormDialog. Click to expand shows department handoffs.
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 13. Build Sub-Event Form with Department Handoff Repeater
  - [x] 13.1 Create `frontend/src/components/aog/SubEventFormDialog.tsx` — dialog form with fields: category (dropdown: AOG, Scheduled, Unscheduled), reasonCode (text input), actionTaken (textarea), detectedAt (date-time picker), clearedAt (optional date-time picker), manpowerCount (number input), manHours (number input). Use React Hook Form + Zod for validation. Works for both create and edit modes.
    - _Requirements: 10.1, 10.6_
  - [x] 13.2 Add Department Handoff repeater to SubEventFormDialog — "Add Handoff" button adds a row with: department (dropdown: Procurement, Engineering, Quality, Operations), sentAt (date-time picker), returnedAt (optional date-time picker), notes (text input). Remove button per row. Validate returnedAt >= sentAt per handoff. Use React Hook Form useFieldArray for the repeater pattern.
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  - [x] 13.3 Wire form submission — on submit, call useCreateSubEvent or useUpdateSubEvent mutation (include departmentHandoffs array in payload). On success, show toast notification and invalidate parent event query to refresh detail page.
    - _Requirements: 10.7_

- [x] 14. Build Analytics Page
  - [x] 14.1 Rewrite `frontend/src/pages/aog/AOGAnalyticsPage.tsx` — summary cards at top: total events, active events, completed events, total downtime hours. Use useAOGAnalyticsSummary hook. Loading skeletons while fetching. Empty state message when no data.
    - _Requirements: 12.1, 12.6, 12.7_
  - [x] 14.2 Add category breakdown chart — bar or pie chart (Recharts) showing distribution of sub-events by category (AOG, Scheduled, Unscheduled) with downtime hours. Use useAOGCategoryBreakdown hook.
    - _Requirements: 12.2_
  - [x] 14.3 Add time breakdown chart — stacked horizontal bar chart (Recharts) showing Technical_Time vs each department's time. Use useAOGTimeBreakdown hook.
    - _Requirements: 12.3_
  - [x] 14.4 Add filter bar to analytics page — aircraft dropdown, fleet group dropdown, category dropdown, date range pickers. Filters re-fetch all analytics data on change.
    - _Requirements: 12.4, 12.5_

- [x] 15. Update routing and navigation
  - [x] 15.1 Update `frontend/src/App.tsx` (or router config) — ensure `/aog/list` renders the new AOGListPage, `/aog/:id` renders the new AOGDetailPage, `/aog/analytics` renders the new AOGAnalyticsPage. Remove routes for old pages (AOGLogPage, AOGAnalyticsPageEnhanced, AOGListPageEnhanced if they exist as separate routes).
    - _Requirements: 15.4_
  - [x] 15.2 Update `frontend/src/components/layout/AppShell.tsx` — update navigation links to point to the new AOG routes. Remove any nav items for deleted pages.
    - _Requirements: 15.4_

- [x] 16. Checkpoint — Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Backend cleanup — remove old code
  - [x] 17.1 Remove old enums and sub-document schemas from `backend/src/aog-events/schemas/` — delete ResponsibleParty, AOGWorkflowStatus, BlockingReason, PartRequestStatus enums. Delete MilestoneHistoryEntry, StatusHistoryEntry, PartRequest, CostAuditEntry, AttachmentMeta sub-document schemas. Remove MRO and Cleaning from AOGCategory enum (enum now lives in Sub-Event schema).
    - _Requirements: 14.2, 14.3, 14.4_
  - [x] 17.2 Remove old controller routes and service methods — delete any remaining references to /transition-status, /part-requests, /budget-integration, old analytics endpoints (monthly-trend, insights, forecast, reliability, buckets). Delete old service methods listed in design cleanup scope. Remove old indexes (responsibleParty, currentStatus, blockingReason, reportedAt).
    - _Requirements: 14.5, 14.6, 14.7_

- [x] 18. Frontend cleanup — remove old components and utilities
  - [x] 18.1 Delete old AOG components — MilestoneTimeline.tsx, MilestoneEditForm.tsx, ThreeBucketChart.tsx, AttachmentsTab.tsx, ForecastChart.tsx, RiskScoreGauge.tsx, ReliabilityScoreCards.tsx, WaterfallChart.tsx, BucketTrendChart.tsx, MovingAverageChart.tsx, YearOverYearChart.tsx, AircraftHeatmap.tsx, ParetoChart.tsx, CostBreakdownChart.tsx, CostEfficiencyMetrics.tsx, AOGDataQualityIndicator.tsx, EnhancedAOGAnalyticsPDFExport.tsx, CategoryBreakdownPie.tsx, ResponsibilityDistributionChart.tsx, MonthlyTrendChart.tsx.
    - _Requirements: 15.1, 15.2_
  - [x] 18.2 Delete old utility files — `frontend/src/lib/reliabilityScore.ts`, `frontend/src/lib/riskScore.ts`, `frontend/src/lib/costAnalysis.ts`, `frontend/src/lib/sampleData.ts`. Delete old pages: AOGAnalyticsPageEnhanced.tsx, AOGLogPage.tsx, AOGListPageEnhanced.tsx (if separate from new list page).
    - _Requirements: 15.3_
  - [x] 18.3 Clean up old hook code in useAOGEvents.ts — remove any leftover analytics hooks, old mutation hooks, or type definitions that reference the old model (workflow states, milestones, part requests, cost audit trail, etc.).
    - _Requirements: 15.5_

- [x] 19. Checkpoint — Cleanup complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Property-based tests for round-trip persistence and validation
  - [ ]* 20.1 Write property test for Parent Event round-trip persistence
    - **Property 1: Parent Event round-trip persistence** — generate random valid parent event inputs (aircraftId, detectedAt, clearedAt, location, notes), create via API, retrieve by ID, verify all fields match
    - **Validates: Requirements 1.1, 5.1, 5.3, 5.4, 16.1, 16.2**
  - [ ]* 20.2 Write property test for Parent Event status derivation
    - **Property 2: Parent Event status derivation from Sub-Events** — generate parent events with varying sub-event states, verify status is 'active' if any sub-event has null clearedAt, 'completed' if all have non-null clearedAt
    - **Validates: Requirements 1.5, 1.6**
  - [ ]* 20.3 Write property test for Sub-Event round-trip persistence
    - **Property 4: Sub-Event round-trip persistence with embedded handoffs** — generate random valid sub-event inputs with handoffs, create under a parent, retrieve, verify all fields including embedded handoffs match
    - **Validates: Requirements 2.1, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4**
  - [ ]* 20.4 Write property test for Sub-Event category validation
    - **Property 5: Sub-Event category validation** — generate random strings, verify only 'aog', 'scheduled', 'unscheduled' are accepted, all others (including 'mro', 'cleaning') are rejected
    - **Validates: Requirements 2.2, 2.3**
  - [ ]* 20.5 Write property test for temporal validations
    - **Property 6: Sub-Event temporal validation** — generate random date pairs, verify clearedAt < detectedAt is rejected, clearedAt >= detectedAt is accepted
    - **Property 8: Department Handoff temporal validation** — generate random date pairs, verify returnedAt < sentAt is rejected, returnedAt >= sentAt is accepted
    - **Validates: Requirements 2.5, 3.4, 10.5**

- [ ] 21. Property-based tests for derived data and filtering
  - [ ]* 21.1 Write property test for cascade delete
    - **Property 12: Cascade delete** — create parent with N sub-events, delete parent, verify all sub-events are also deleted
    - **Validates: Requirements 5.5**
  - [ ]* 21.2 Write property test for derived categories and aggregate metrics
    - **Property 13: Parent Event derived categories and aggregate metrics** — generate parent with sub-events of varying categories, verify categories array = distinct set, totalTechnicalTime = sum of sub-event technicalTimeHours, totalDepartmentTime = sum of sub-event departmentTimeHours
    - **Validates: Requirements 5.6, 5.7**
  - [ ]* 21.3 Write property test for list filtering correctness
    - **Property 14: List filtering correctness** — generate random events and random filter combinations, verify all returned events match all filter criteria, no matching events excluded
    - **Validates: Requirements 5.2, 8.5, 11.4**

- [x] 22. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library with minimum 100 iterations per property
- This is a clean-slate migration — no data compatibility or migration logic needed
- The build order ensures no orphaned code: schemas → repos → services → controller → hooks → pages → cleanup
- All 20 correctness properties from the design document are covered by property test tasks
