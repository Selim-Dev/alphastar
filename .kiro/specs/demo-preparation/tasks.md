# Implementation Plan

## Phase 1: Fix Aircraft Dropdown and Data Wiring

- [x] 1. Fix aircraft dropdown population across all pages






  - [x] 1.1 Create reusable AircraftSelect component with loading/error/empty states

    - Add loading spinner during fetch
    - Add error message with retry button on API failure
    - Add empty state guidance when no aircraft exist
    - _Requirements: 1.1, 1.2, 1.3, 1.4_


  - [x] 1.2 Update all pages using aircraft filters to use new AircraftSelect

    - Update AvailabilityPage
    - Update MaintenancePage
    - Update AOGEventsPage
    - Update WorkOrdersPage
    - Update DiscrepanciesPage
    - _Requirements: 1.1_


  - [x] 1.3 Write property test for aircraft dropdown population

    - **Property 1: Aircraft Dropdown Population**
    - **Validates: Requirements 1.1**

## Phase 2: Enhance Seed Script with Comprehensive Demo Data


- [x] 2. Enhance existing seed script with 90 days of demo data




  - [x] 2.1 Add daily status seed data generation


    - Generate 90 days of records per aircraft
    - Vary FMC hours between 18-24
    - Add occasional scheduled/unscheduled downtime
    - _Requirements: 2.2_


  - [x] 2.2 Add utilization counter seed data generation


    - Generate 90 days of monotonically increasing counters
    - Add realistic daily flight hours (2-8 hours)
    - Include engine and APU counters
    - _Requirements: 2.3_


  - [x] 2.3 Write property test for monotonic counters



    - **Property 2: Seed Data Monotonic Counters**
    - **Validates: Requirements 2.3**



  - [x] 2.4 Add AOG events seed data generation

    - Create 3-5 events per aircraft
    - Distribute across all 5 responsible parties
    - Vary durations realistically
    - _Requirements: 2.4_


  - [x] 2.5 Write property test for responsible party coverage

    - **Property 3: Seed Data Responsible Party Coverage**
    - **Validates: Requirements 2.4**


  - [x] 2.6 Add maintenance tasks seed data generation

    - Create tasks across all shifts (Morning, Evening, Night)
    - Vary task types and costs
    - Link some tasks to work orders
    - _Requirements: 2.5_


  - [x] 2.7 Write property test for shift coverage
    - **Property 4: Seed Data Shift Coverage**
    - **Validates: Requirements 2.5**


  - [x] 2.8 Add work orders seed data generation

    - Create 5-10 work orders per aircraft
    - Include all statuses (Open, InProgress, Closed, Deferred)
    - Make some work orders overdue
    - _Requirements: 2.6_


  - [x] 2.9 Write property test for work order status mix
    - **Property 5: Seed Data Work Order Status Mix**
    - **Validates: Requirements 2.6**


  - [x] 2.10 Add discrepancies seed data generation

    - Create 3-8 discrepancies per aircraft
    - Distribute across 16 ATA chapters
    - Include corrective actions for some
    - _Requirements: 2.7_


  - [x] 2.11 Write property test for ATA chapter coverage
    - **Property 6: Seed Data ATA Chapter Coverage**
    - **Validates: Requirements 2.7**


  - [x] 2.12 Add actual spend seed data generation


    - Create 12 months of spend records
    - Create variance patterns (some under, some over budget)
    - Cover all budget clauses
    - _Requirements: 2.8_

- [ ] 3. Checkpoint - Run seed script and verify data
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Fix Theme Consistency

- [x] 4. Fix sidebar and content theme consistency





  - [x] 4.1 Update CSS variables for theme-aware sidebar


    - Create light mode sidebar tokens
    - Update dark mode sidebar tokens
    - Ensure proper contrast in both modes
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Update Sidebar component to use theme-aware classes


    - Replace hardcoded dark classes with theme tokens
    - Add smooth transition on theme change
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 4.3 Write property test for theme consistency


    - **Property 9: Theme Consistency**
    - **Validates: Requirements 6.1, 6.2**

## Phase 4: Add Auto-Refresh and Query Invalidation

- [x] 5. Implement auto-refresh for dashboard data





  - [x] 5.1 Add polling to dashboard KPI queries


    - Set refetchInterval to 30 seconds
    - Add refetchOnWindowFocus
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Verify query invalidation after mutations


    - Ensure all mutation hooks invalidate related queries
    - Test create/update operations refresh data
    - _Requirements: 5.3_

  - [x] 5.3 Write property test for query invalidation


    - **Property 13: Query Invalidation After Mutation**
    - **Validates: Requirements 5.3**

## Phase 5: Create Health Check Panel

- [x] 6. Implement data health check panel





  - [x] 6.1 Create backend endpoint for collection counts


    - Return counts for all collections
    - Include API status
    - _Requirements: 4.1, 4.2_


  - [x] 6.2 Create HealthCheck component in admin page

    - Display collection counts in a grid
    - Highlight empty collections with warning
    - Show last fetch timestamp
    - _Requirements: 4.1, 4.2, 4.3_


  - [x] 6.3 Add seed trigger button (Admin only)

    - Create backend endpoint to trigger seed
    - Add button to health check panel
    - Show progress/success feedback
    - _Requirements: 4.4_


  - [x] 6.4 Write property test for health check counts

    - **Property 7: Health Check Collection Counts**
    - **Validates: Requirements 4.1**

  - [x] 6.5 Write property test for empty collection warning


    - **Property 8: Health Check Empty Warning**
    - **Validates: Requirements 4.3**

## Phase 6: Enhance Admin Page with RBAC

- [x] 7. Enhance admin page user management





  - [x] 7.1 Verify user list displays correctly


    - Show email, name, and role for all users
    - Add role badge styling
    - _Requirements: 7.1_


  - [x] 7.2 Add role descriptions to admin page

    - Explain Admin, Editor, Viewer permissions
    - Display in a help section
    - _Requirements: 7.5_


  - [x] 7.3 Write property test for RBAC viewer restriction

    - **Property 10: RBAC Viewer Restriction**
    - **Validates: Requirements 7.3**


  - [x] 7.4 Write property test for RBAC editor permission

    - **Property 11: RBAC Editor Permission**
    - **Validates: Requirements 7.4**

- [ ] 8. Checkpoint - Verify admin functionality
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Verify Charts Display Data

- [x] 9. Verify all charts display meaningful data after seeding





  - [x] 9.1 Verify dashboard KPI cards show non-zero values


    - Check fleet availability percentage
    - Check total flight hours
    - Check total cycles
    - Check active AOG count
    - _Requirements: 8.1_


  - [x] 9.2 Write property test for dashboard KPIs after seed

    - **Property 12: Dashboard KPIs Non-Zero After Seed**
    - **Validates: Requirements 8.1**

  - [x] 9.3 Verify availability page charts


    - Check availability trend chart has data points
    - Check aircraft availability table populates
    - _Requirements: 8.2_



  - [x] 9.4 Verify budget page charts

    - Check budget vs actual chart displays
    - Check variance visualization works
    - _Requirements: 8.3_


  - [x] 9.5 Verify AOG events page charts

    - Check downtime by responsibility chart
    - Check event timeline displays
    - _Requirements: 8.4_


  - [x] 9.6 Verify discrepancies page charts

    - Check top ATA chapters bar chart
    - Check discrepancy list populates
    - _Requirements: 8.5_


  - [x] 9.7 Verify maintenance page summary

    - Check task counts display
    - Check cost summary displays
    - _Requirements: 8.6_

## Phase 8: Create Demo Guide Document

- [x] 10. Create comprehensive demo guide






  - [x] 10.1 Create DEMO-GUIDE.md with glossary

    - Define FMC, TTSN, TCSN, AOG
    - Define ATA chapters
    - Define budget clauses
    - _Requirements: 3.1_


  - [ ] 10.2 Add module descriptions to demo guide
    - Describe Dashboard purpose
    - Describe Availability module
    - Describe Maintenance module
    - Describe AOG Events module
    - Describe Work Orders module
    - Describe Discrepancies module
    - Describe Budget module
    - Describe Import module
    - Describe Admin module
    - _Requirements: 3.2_


  - [x] 10.3 Add step-by-step demo script





    - Login instructions
    - Dashboard walkthrough
    - Availability drill-down
    - Maintenance task entry
    - Budget analysis
    - Export demonstration

    - _Requirements: 3.3_

  - [x] 10.4 Add expected outcomes section





    - List what should be populated
    - List what charts should show

    - List export functionality
    - _Requirements: 3.4_


  - [x] 10.5 Add login credentials




    - Admin credentials
    - Editor credentials
    - Viewer credentials
    - _Requirements: 3.5_

- [ ] 11. Final Checkpoint - Complete demo verification
  - Ensure all tests pass, ask the user if questions arise.

