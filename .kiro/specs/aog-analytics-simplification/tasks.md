# Implementation Plan: AOG Analytics Simplification

## Overview

This implementation plan transforms the AOG workflow from an 18-state system to a simplified milestone-based approach with three-bucket downtime analytics. It also updates the dashboard by removing less valuable components and adding a Coming Soon section.

## Tasks

- [x] 1. Update AOG Schema with Milestone Timestamps
  - [x] 1.1 Add milestone timestamp fields to AOGEvent schema
    - Add reportedAt, procurementRequestedAt, availableAtStoreAt, issuedBackAt, installationCompleteAt, testStartAt, upAndRunningAt fields
    - Add computed metric fields: technicalTimeHours, procurementTimeHours, opsTimeHours, totalDowntimeHours
    - Add simplified cost fields: internalCost, externalCost
    - Add MilestoneHistoryEntry sub-document schema
    - _Requirements: 1.1, 3.1, 4.1, 4.2_

  - [x] 1.2 Update CreateAOGEventDto and UpdateAOGEventDto
    - Add optional milestone timestamp fields with validation decorators
    - Add internalCost and externalCost fields
    - Preserve existing fields for backward compatibility
    - _Requirements: 1.1, 4.1, 4.2_

  - [x] 1.3 Add database indexes for new fields
    - Add index on reportedAt for date-based queries
    - Add compound index on aircraftId + reportedAt
    - _Requirements: 5.1_

- [-] 2. Implement Downtime Calculation Logic
  - [x] 2.1 Create computeDowntimeMetrics function in AOGEventsService
    - Implement Technical Time calculation: (Reported → Procurement Requested) + (Available at Store → Installation Complete)
    - Implement Procurement Time calculation: (Procurement Requested → Available at Store)
    - Implement Ops Time calculation: (Test Start → Up & Running)
    - Implement Total Downtime calculation: (Reported → Up & Running)
    - Handle null milestones by setting respective bucket to 0
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.2 Write property test for downtime calculation correctness
    - **Property 2: Three-Bucket Downtime Calculation Correctness**
    - Generate random valid milestone timestamps
    - Verify computed metrics match expected formulas
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.7**

  - [ ]* 2.3 Write property test for zero-value handling
    - **Property 3: Zero-Value Handling for Missing Milestones**
    - Generate events with various null milestone combinations
    - Verify appropriate bucket values are 0
    - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 3. Implement Timestamp Validation
  - [x] 3.1 Create validateMilestoneOrder function
    - Validate chronological order: reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt ≤ issuedBackAt ≤ installationCompleteAt ≤ testStartAt ≤ upAndRunningAt
    - Allow null values for optional milestones
    - Throw BadRequestException with descriptive error for violations
    - _Requirements: 3.2, 3.3_

  - [ ]* 3.2 Write property test for timestamp ordering validation
    - **Property 4: Timestamp Chronological Ordering Validation**
    - Generate random timestamp sequences (both valid and invalid)
    - Verify validation correctly accepts/rejects
    - **Validates: Requirements 3.2, 9.4**

- [x] 4. Update AOGEventsService CRUD Operations
  - [x] 4.1 Update create method to compute and store metrics
    - Set reportedAt from detectedAt if not provided
    - Call computeDowntimeMetrics and store results
    - Compute totalCost from internalCost + externalCost
    - Record milestone history entries
    - _Requirements: 1.2, 2.8, 3.5, 4.3_

  - [x] 4.2 Update update method to recompute metrics on milestone changes
    - Detect milestone timestamp changes
    - Recompute downtime metrics when milestones change
    - Update milestone history with new entries
    - _Requirements: 2.8, 3.5_

  - [x] 4.3 Update findById and findAll to handle legacy events
    - Detect events without new milestone fields
    - Set isLegacy flag for legacy events
    - Compute metrics using detectedAt/clearedAt for legacy events
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 4.4 Write property test for legacy event backward compatibility
    - **Property 7: Legacy Event Backward Compatibility**
    - Test legacy event detection and metric computation
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 5. Implement Three-Bucket Analytics Endpoint
  - [x] 5.1 Create getThreeBucketAnalytics method in AOGEventsService
    - Aggregate technicalTimeHours, procurementTimeHours, opsTimeHours across filtered events
    - Calculate sum, average, and percentage for each bucket
    - Group by aircraft for detailed breakdown
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 5.2 Add GET /aog-events/analytics/buckets endpoint to controller
    - Accept filter parameters: aircraftId, fleetGroup, startDate, endDate
    - Return ThreeBucketAnalytics response
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.3 Write property test for aggregation consistency
    - **Property 6: Aggregation Consistency**
    - Verify sum of individual metrics equals aggregated totals
    - **Validates: Requirements 5.2, 5.3, 5.4, 6.2, 6.3**

- [x] 6. Checkpoint - Backend Implementation Complete
  - Ensure all backend tests pass
  - Verify API endpoints work correctly
  - Ask the user if questions arise

- [x] 7. Remove Dashboard Components
  - [x] 7.1 Remove OperationalEfficiencyPanel from DashboardPage
    - Remove import statement
    - Remove component usage from JSX
    - Remove associated hook usage (useOperationalEfficiency)
    - _Requirements: 7a.1_

  - [x] 7.2 Remove InsightsPanel from DashboardPage
    - Remove import statement
    - Remove component usage from JSX
    - Remove associated hook usage (useInsights)
    - _Requirements: 7a.2_

  - [x] 7.3 Remove CostEfficiencyCard from DashboardPage
    - Remove import statement
    - Remove component usage from JSX
    - Remove associated hook usage (useCostEfficiency)
    - _Requirements: 7a.3_

  - [x] 7.4 Remove backend endpoints for removed components
    - Remove /dashboard/operational-efficiency endpoint
    - Remove /dashboard/insights endpoint
    - Remove /dashboard/cost-efficiency endpoint
    - Remove associated service methods
    - _Requirements: 7a.4, 7a.5, 7a.6_

- [x] 8. Create Coming Soon Dashboard Section
  - [x] 8.1 Create ComingSoonSection component
    - Create frontend/src/components/ui/ComingSoonSection.tsx
    - Display two placeholder tiles: "Aircraft at MRO" and "Vacation Plan"
    - Use consistent card styling with existing dashboard components
    - No backend API calls required
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Add ComingSoonSection to DashboardPage
    - Import and add component to dashboard layout
    - Position appropriately in the dashboard grid
    - Ensure layout remains balanced
    - _Requirements: 7.1, 7a.7_

- [x] 9. Update AOG Analytics Page
  - [x] 9.1 Create ThreeBucketChart component
    - Display bar chart with Technical, Procurement, Ops hours
    - Display pie chart showing percentage distribution
    - Use consistent styling with existing charts
    - _Requirements: 5.3, 6.2_

  - [x] 9.2 Update AOGAnalyticsPage to use three-bucket data
    - Replace existing analytics with three-bucket breakdown
    - Update summary cards to show bucket totals
    - Add fleet filter option
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.3 Update useAOGEvents hook for new analytics endpoint
    - Add useThreeBucketAnalytics hook
    - Handle filter parameters
    - _Requirements: 5.1_

- [x] 10. Update AOG Detail Page
  - [x] 10.1 Create MilestoneTimeline component
    - Display milestone timestamps in vertical timeline
    - Show computed time between milestones
    - Indicate optional milestones that were skipped
    - _Requirements: 3.4_

  - [x] 10.2 Update AOGDetailPage to use simplified model
    - Replace StatusTimeline with MilestoneTimeline
    - Update cost display to show Internal/External
    - Remove complex workflow status UI
    - _Requirements: 3.4, 4.4_

  - [x] 10.3 Create milestone edit form
    - Allow editing individual milestone timestamps
    - Validate timestamp ordering on save
    - Record who made changes
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 11. Checkpoint - Frontend Implementation Complete
  - Ensure all frontend components render correctly
  - Verify dashboard layout is balanced
  - Ask the user if questions arise

- [-] 12. Update Import/Export
  - [x] 12.1 Update Excel template for AOG events
    - Add milestone timestamp columns
    - Add internalCost and externalCost columns
    - Update column headers and validation
    - _Requirements: 9.1_

  - [x] 12.2 Update import service to handle milestone timestamps
    - Parse milestone timestamp columns
    - Validate timestamp ordering on import
    - Compute downtime metrics after import
    - Validate aircraft registration exists
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [x] 12.3 Update export service to include computed metrics
    - Include computed downtime metrics in export
    - Include milestone timestamps
    - _Requirements: 9.3_

  - [ ]* 12.4 Write property test for import validation
    - **Property 8: Import Validation**
    - Test timestamp ordering validation on import
    - Test aircraft registration validation
    - **Validates: Requirements 9.2, 9.4, 9.5**

- [x] 13. Create Seed Data for Demo
  - [x] 13.1 Update seed script with diverse AOG events
    - Create events with long procurement delays
    - Create events with immediate part availability
    - Create events with no parts needed
    - Create events requiring ops testing
    - Create events without ops testing
    - _Requirements: 8.1, 8.3, 8.5_

  - [x] 13.2 Verify seed data produces correct analytics
    - Run seed script
    - Verify three-bucket analytics show meaningful distribution
    - Verify filtering works correctly
    - _Requirements: 8.2, 8.3, 8.4_

- [-] 14. Update Documentation
  - [x] 14.1 Create new steering document for simplified AOG model
    - Document three-bucket downtime model
    - Document milestone timestamps and meanings
    - Document special cases (no part needed, part in store, no ops test)
    - Document migration notes for legacy events
    - Create .kiro/steering/aog-analytics-simplified.md
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.4_

  - [x] 14.2 Remove outdated steering documents
    - Remove .kiro/steering/aog-wo-vacation-revamp.md
    - Remove .kiro/steering/aog-wo-vacation-walkthrough.md
    - _Requirements: 12.2, 12.3_

  - [-] 14.3 Update system-architecture.md
    - Update AOG Events section with simplified model
    - Update API endpoint reference
    - Remove references to 18-state workflow
    - _Requirements: 11.4, 12.5_

- [ ] 15. Final Checkpoint - All Tests Pass
  - Run all unit tests
  - Run all property-based tests
  - Run integration tests
  - Verify dashboard displays correctly
  - Verify analytics show correct data
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Legacy events (without new milestone fields) are handled gracefully without requiring migration
