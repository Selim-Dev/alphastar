# Implementation Plan: AOG Cost Breakdown

## Overview

Add per-department cost tracking to AOG events following the existing sub-event pattern: new `aogcostentries` collection with schema, repository, service, controller routes nested under AOG events, TanStack Query hooks, multi-step form dialog, cost breakdown cards on the detail page, aggregated cost analytics (bar + pie charts) on the analytics page, and PDF export verification.

## Tasks

- [x] 1. Create backend data model and repository
  - [x] 1.1 Create AOGCostEntry schema (`backend/src/aog-events/schemas/aog-cost-entry.schema.ts`)
    - Define Mongoose schema with fields: parentEventId (ObjectId ref AOGEvent), department (enum: QC, Engineering, Project Management, Procurement, Technical, Others), internalCost (number >= 0), externalCost (number >= 0), note (optional string), updatedBy (ObjectId ref User)
    - Enable timestamps (createdAt, updatedAt)
    - Add indexes: `{ parentEventId: 1, createdAt: -1 }` and `{ parentEventId: 1 }`
    - Follow the `aog-sub-event.schema.ts` pattern exactly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Create AOGCostEntryRepository (`backend/src/aog-events/repositories/aog-cost-entry.repository.ts`)
    - Implement: create, findById, findByParentId (sorted by createdAt desc), update, delete, deleteByParentId, aggregate
    - Follow the `aog-sub-event.repository.ts` pattern exactly
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Create DTOs (`backend/src/aog-events/dto/create-cost-entry.dto.ts` and `update-cost-entry.dto.ts`)
    - CreateCostEntryDto: department (IsEnum, required), internalCost (IsNumber, Min(0), required), externalCost (IsNumber, Min(0), required), note (IsString, IsOptional)
    - UpdateCostEntryDto: all fields optional (PartialType of CreateCostEntryDto)
    - Use class-validator decorators matching existing DTO patterns
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create backend service and wire into module
  - [x] 2.1 Create AOGCostEntriesService (`backend/src/aog-events/services/aog-cost-entries.service.ts`)
    - Inject AOGCostEntryRepository and AOGEventRepository
    - Implement create (validate parent exists, set updatedBy), findByParentId, findById (validate parent), update (validate entry exists), delete (validate entry exists)
    - Follow the `aog-sub-events.service.ts` pattern for parent validation and error handling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.2 Add cost breakdown analytics method to AOGEventsService (`backend/src/aog-events/services/aog-events.service.ts`)
    - Add `getCostBreakdown(filter)` method that builds an aggregation pipeline:
      - Match parent AOG events by aircraftId, category, detectedAt date range
      - $lookup aircrafts collection for fleetGroup filtering
      - $lookup aogcostentries by parentEventId
      - $unwind cost entries, $group by department, compute internalCost, externalCost, totalCost, entryCount
      - Compute grand totals in service layer
    - Return `CostBreakdownResponse` shape: departments array + totals object
    - _Requirements: 5.5, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 2.3 Register schema, repository, and service in AOGEventsModule (`backend/src/aog-events/aog-events.module.ts`)
    - Add AOGCostEntry to MongooseModule.forFeature
    - Add AOGCostEntryRepository to providers
    - Add AOGCostEntriesService to providers
    - _Requirements: 2.1_

- [x] 3. Add controller routes and cascade delete
  - [x] 3.1 Add cost entry CRUD routes to AOGEventsController (`backend/src/aog-events/aog-events.controller.ts`)
    - POST `/:parentId/cost-entries` — Admin, Editor roles
    - GET `/:parentId/cost-entries` — Authenticated
    - PUT `/:parentId/cost-entries/:entryId` — Admin, Editor roles
    - DELETE `/:parentId/cost-entries/:entryId` — Admin, Editor roles
    - GET `/analytics/cost-breakdown` — Authenticated, accepts filter query params
    - Inject AOGCostEntriesService in controller constructor
    - Place analytics route BEFORE `:id` param route to avoid route conflicts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 6.1_

  - [x] 3.2 Add cascade delete of cost entries when parent AOG event is deleted
    - In AOGEventsService.delete(), call `aogCostEntryRepository.deleteByParentId(id)` before deleting the parent event
    - Inject AOGCostEntryRepository into AOGEventsService
    - _Requirements: 2.4_

- [x] 4. Checkpoint — Backend complete
  - Ensure all backend files compile without errors, ask the user if questions arise.

- [x] 5. Create frontend hooks
  - [x] 5.1 Create useAOGCostEntries hook (`frontend/src/hooks/useAOGCostEntries.ts`)
    - Follow the `useAOGSubEvents.ts` pattern exactly
    - `useCostEntries(parentId)` — query key `['cost-entries', parentId]`, GET `/:parentId/cost-entries`
    - `useCreateCostEntry()` — POST, invalidates `['cost-entries', parentId]`
    - `useUpdateCostEntry()` — PUT, invalidates `['cost-entries', parentId]`
    - `useDeleteCostEntry()` — DELETE, invalidates `['cost-entries', parentId]`
    - Also invalidate `['aog-analytics']` queries on mutations so analytics page refreshes
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 5.2 Add useAOGCostBreakdown hook (in existing `frontend/src/hooks/useAOGEvents.ts` or new file)
    - `useAOGCostBreakdown(filter)` — GET `/aog-events/analytics/cost-breakdown` with filter params
    - Query key: `['aog-analytics', 'cost-breakdown', filter]`
    - _Requirements: 6.1_

- [x] 6. Create CostEntryFormDialog component
  - [x] 6.1 Create CostEntryFormDialog (`frontend/src/components/aog/CostEntryFormDialog.tsx`)
    - Multi-step dialog following SubEventFormDialog pattern
    - Step 1: Department selection — 6 options (QC, Engineering, Project Management, Procurement, Technical, Others) as radio buttons or selectable cards
    - Step 2: Internal Cost (USD number input), External Cost (USD number input), Note (optional textarea)
    - Support create mode (empty form) and edit mode (pre-filled values)
    - Zod validation: department required enum, internalCost >= 0, externalCost >= 0
    - Show success toast on create/edit, error toast on failure
    - Use shadcn/ui Dialog, Button, Input, Textarea components
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9, 3.10_

- [x] 7. Create CostBreakdownCards and integrate into AOG Detail page
  - [x] 7.1 Create CostBreakdownCards component (`frontend/src/components/aog/CostBreakdownCards.tsx`)
    - Render each cost entry as a card: department badge, internal cost, external cost, total (internal + external), note
    - Summary row at top: total internal cost, total external cost, grand total across all entries
    - Edit button (opens CostEntryFormDialog in edit mode) and delete button (with confirmation dialog) for Admin/Editor roles
    - Empty state message when no cost entries exist
    - Use `usePermissions` hook to check role for edit/delete visibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Integrate into AOGDetailPage (`frontend/src/pages/aog/AOGDetailPage.tsx`)
    - Add "Add Cost Breakdown" button beside the existing "Add Sub-Event" button
    - Render CostBreakdownCards component in a "Cost Breakdown" section
    - Wire up CostEntryFormDialog open/close state
    - Use useCostEntries hook to fetch entries for the current event
    - _Requirements: 3.1, 3.7, 4.1_

- [x] 8. Checkpoint — Detail page complete
  - Ensure all frontend components compile without errors, ask the user if questions arise.

- [x] 9. Add Cost Breakdown analytics section to AOG Analytics page
  - [x] 9.1 Create CostBreakdownSection in AOGAnalyticsPage (`frontend/src/pages/aog/AOGAnalyticsPage.tsx`)
    - Add a new collapsible section titled "Cost Breakdown" following the existing section pattern
    - Summary cards: Total Internal Cost, Total External Cost (formatted as USD currency)
    - Grouped bar chart (Recharts BarChart): departments on X-axis, internal cost and external cost as grouped bars
    - Donut/pie chart (Recharts PieChart): total cost distribution by department as percentage
    - Use the useAOGCostBreakdown hook with the existing filter bar parameters (aircraftId, fleetGroup, category, startDate, endDate)
    - Show loading skeleton while data loads
    - Show empty state when no cost data exists for current filters
    - Use hex/hsl colors only (no oklch) to ensure html2canvas compatibility for PDF export
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Checkpoint — Analytics section complete
  - Ensure the analytics page renders correctly with the new cost breakdown section, ask the user if questions arise.

- [x] 11. Verify PDF export captures the full analytics page including cost breakdown
  - [x] 11.1 Update PDF export to include cost breakdown section
    - Open the existing PDF export component (e.g., `EnhancedAOGAnalyticsPDFExport.tsx` or `AnalyticsPDFExport.tsx`)
    - Ensure the cost breakdown section DOM elements are included in the html2canvas capture scope
    - If the export uses section-by-section capture, add the cost breakdown section to the capture list
    - Verify bar chart and pie chart render at readable resolution in the PDF
    - Verify summary cards with correct totals appear in the PDF
    - Verify that when filters are applied, the PDF reflects filtered cost data
    - Verify that when no cost data exists, the PDF shows the empty state
    - This is the highest priority deliverable for the client
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Final checkpoint — Full feature complete
  - Ensure all backend and frontend code compiles without errors.
  - Verify the PDF export captures the entire AOG Analytics page correctly, including the new cost breakdown section.
  - Ask the user if questions arise.

## Notes

- No unit, integration, or property tests per user request — fastest implementation path
- Follow existing sub-event pattern (schema → repository → service → controller → hook → component) for consistency
- PDF export verification (task 11) is the most critical deliverable for the client
- Use hex/hsl colors only in chart components to avoid html2canvas rendering issues with oklch
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
