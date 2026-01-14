# Implementation Plan

- [-] 1. Set up Help Center infrastructure and content types




  - [x] 1.1 Create TypeScript interfaces for all content types


    - Create `frontend/src/lib/help/types.ts` with interfaces for QuickStartStep, ModuleGuide, GlossaryEntry, DataReadinessItem, WalkthroughStep
    - Include GlossaryCategory type and all response types
    - _Requirements: 9.1, 9.2_
  - [ ]* 1.2 Write property test for Quick Start step completeness
    - **Property 1: Quick Start Step Completeness**
    - **Validates: Requirements 2.2**
  - [ ]* 1.3 Write property test for Module Guide section completeness
    - **Property 2: Module Guide Section Completeness**
    - **Validates: Requirements 3.2, 3.5**
  - [ ]* 1.4 Write property test for Glossary entry completeness
    - **Property 3: Glossary Entry Completeness**
    - **Validates: Requirements 4.3**

- [-] 2. Create glossary content and search functionality



  - [x] 2.1 Create glossary content file with 25+ aviation terms


    - Create `frontend/src/lib/help/glossaryContent.ts`
    - Include all required terms: AOG, ATA Chapter, FMC, TTSN, TCSN, APU, Man-hours, Downtime, Work Order, Discrepancy, Variance, Burn Rate, Fleet Group, MTBF, MTTR, Dispatch Reliability, NMC, NMCS, POS Hours, Cycle, Flight Hour, Responsible Party, Budget Clause, Fiscal Year, Fleet Health Score
    - Organize by categories: Operations, Maintenance, Finance, General
    - _Requirements: 4.3, 4.4, 4.5_
  - [ ]* 2.2 Write property test for glossary minimum count
    - **Property 4: Glossary Minimum Count**
    - **Validates: Requirements 4.4**
  - [ ]* 2.3 Write property test for glossary category assignment
    - **Property 6: Glossary Category Assignment**
    - **Validates: Requirements 4.5**

  - [x] 2.4 Implement glossary search filtering logic


    - Create search utility function in `frontend/src/lib/help/glossarySearch.ts`
    - Filter by term, acronym, or definition (case-insensitive)
    - _Requirements: 4.2_
  - [ ]* 2.5 Write property test for glossary search filtering
    - **Property 5: Glossary Search Filtering**
    - **Validates: Requirements 4.2**


- [x] 3. Create Quick Start and Module Guides content




  - [x] 3.1 Create Quick Start content file


    - Create `frontend/src/lib/help/helpContent.ts`
    - Include 6+ steps: Login, Date Range Selection, Fleet/Aircraft Filtering, KPI Interpretation, Drill-down Navigation, Export
    - Include callout boxes for common issues
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Create Module Guides content file

    - Create `frontend/src/lib/help/moduleGuidesContent.ts`
    - Include guides for all 9 modules: Dashboard, Fleet Availability, Maintenance Tasks, AOG & Events, Work Orders, Discrepancies, Budget & Cost, Data Import, Admin
    - Each guide has: purpose, requiredData, stepByStepUsage, expectedOutputs, emptyStateCauses, kpiDefinitions, exportNotes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.3 Create Demo Walkthrough content file


    - Create `frontend/src/lib/help/walkthroughContent.ts`
    - Include 7+ steps covering: Executive Dashboard KPIs, Fleet Health Score, Alerts Panel, Fleet Availability, AOG Analytics, Budget Variance, Export
    - Each step has: pageToVisit, pageRoute, featuresToHighlight, talkingPoints, expectedVisualOutput, estimatedMinutes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 3.4 Write property test for walkthrough step completeness
    - **Property 12: Walkthrough Step Completeness**
    - **Validates: Requirements 8.2, 8.5**

- [ ] 4. Checkpoint - Ensure all content tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Add isDemo field to backend schemas





  - [x] 5.1 Update all relevant schemas with isDemo field

    - Add `isDemo?: boolean` to: aircraft.schema.ts, daily-status.schema.ts, daily-counter.schema.ts, aog-event.schema.ts, maintenance-task.schema.ts, work-order.schema.ts, discrepancy.schema.ts, budget-plan.schema.ts, actual-spend.schema.ts
    - Field should be optional with no default (undefined for production data)
    - _Requirements: 12.3_


- [x] 6. Create Demo API endpoints






  - [x] 6.1 Create Demo module structure


    - Create `backend/src/demo/demo.module.ts`, `demo.controller.ts`, `demo.service.ts`
    - Register module in app.module.ts
    - _Requirements: 11.1, 11.2_
  - [x] 6.2 Implement demo seed endpoint

    - POST /api/demo/seed protected by Admin role
    - Create demo records with isDemo: true across all collections
    - Return counts per collection
    - _Requirements: 11.1, 11.3_
  - [ ]* 6.3 Write property test for demo data tagging
    - **Property 9: Demo Data Tagging**
    - **Validates: Requirements 7.3, 11.3, 12.1**
  - [x] 6.4 Implement demo reset endpoint




    - POST /api/demo/reset protected by Admin role
    - Delete only records with isDemo: true
    - Return deleted counts per collection
    - _Requirements: 11.2, 11.4_
  - [ ]* 6.5 Write property test for demo reset selectivity
    - **Property 10: Demo Reset Selectivity**
    - **Validates: Requirements 7.6, 11.4, 12.2**
  - [ ]* 6.6 Write property test for production data integrity
    - **Property 11: Production Data Integrity**
    - **Validates: Requirements 12.4**

  - [x] 6.7 Implement demo status endpoint

    - GET /api/demo/status protected by Admin role
    - Return counts of demo records per collection
    - _Requirements: 7.1_
  - [ ]* 6.8 Write property test for demo API response structure
    - **Property 13: Demo API Response Structure**
    - **Validates: Requirements 11.5**

- [ ] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.



- [x] 8. Create Help Center frontend hook







  - [x] 8.1 Create useDemo hook

    - Create `frontend/src/hooks/useDemo.ts`
    - Implement useDemoSeed, useDemoReset, useDemoStatus mutations/queries
    - Handle query invalidation after seed/reset


    - _Requirements: 7.2, 7.4_

- [x] 9. Create Help Center UI components






  - [x] 9.1 Create shared Help Center components


    - Create `frontend/src/components/help/StepCard.tsx` for numbered steps
    - Create `frontend/src/components/help/Callout.tsx` for info/warning boxes
    - Create `frontend/src/components/ui/SearchInput.tsx` for debounced search
    - _Requirements: 2.2, 2.4, 4.1_
  - [x] 9.2 Create QuickStartTab component


    - Create `frontend/src/components/help/QuickStartTab.tsx`
    - Render steps from helpContent.ts
    - Include navigation links and callouts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 9.3 Create ModuleGuidesTab component


    - Create `frontend/src/components/help/ModuleGuidesTab.tsx`
    - Render accordion from moduleGuidesContent.ts
    - Include all sections per module
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 9.4 Create GlossaryTab component


    - Create `frontend/src/components/help/GlossaryTab.tsx`
    - Render searchable glossary from glossaryContent.ts
    - Include category filters and entry cards
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 9.5 Create DataReadinessTab component


    - Create `frontend/src/components/help/DataReadinessTab.tsx`
    - Fetch health check data and display status
    - Show fix instructions for empty collections
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 9.6 Write property test for data readiness empty state warning
    - **Property 8: Data Readiness Empty State Warning**
    - **Validates: Requirements 6.3, 6.4**
  - [x] 9.7 Create DemoModeTab component


    - Create `frontend/src/components/help/DemoModeTab.tsx`
    - Include seed/reset buttons for Admin users

    - Display walkthrough script

    - Show access message for non-Admin users
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Create HelpCenterPage and routing






  - [x] 10.1 Create HelpCenterPage component


    - Create `frontend/src/pages/HelpCenterPage.tsx`
    - Implement tabbed interface with 5 tabs
    - Apply consistent styling with theme support
    - _Requirements: 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 10.2 Write property test for content-driven UI rendering
    - **Property 14: Content-Driven UI Rendering**
    - **Validates: Requirements 9.4**
  - [x] 10.3 Add Help Center route to App.tsx


    - Add /help route inside protected routes


    - _Requirements: 1.2_
  - [x] 10.4 Add Help Center to sidebar navigation


    - Update Sidebar.tsx to include Help Center item with HelpCircle icon
    - Place in new "Support" section below Administration
    - _Requirements: 1.1_

- [x] 11. Implement GlossaryTooltip component






  - [x] 11.1 Create GlossaryTooltip wrapper component


    - Create `frontend/src/components/ui/GlossaryTooltip.tsx`
    - Accept term prop and look up definition from glossaryContent
    - Include "Learn more" link to glossary
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 11.2 Write property test for tooltip glossary link
    - **Property 7: Tooltip Glossary Link**
    - **Validates: Requirements 5.2**
  - [x] 11.3 Apply tooltips to key acronyms in dashboard components


    - Update KPICard, DataTable headers, and chart labels
    - Apply to: FMC, AOG, TTSN, TCSN, APU, ATA, MTBF, MTTR, NMC
    - _Requirements: 5.1, 5.3, 5.4_

- [ ] 12. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Write integration tests
  - [ ]* 13.1 Write integration test for demo seed endpoint
    - Test that seed creates records with isDemo: true
    - Test that response includes correct counts
    - _Requirements: 11.1, 11.3_
  - [ ]* 13.2 Write integration test for demo reset endpoint
    - Test that reset deletes only demo records
    - Test that production records remain unchanged
    - _Requirements: 11.2, 11.4, 12.4_
  - [ ]* 13.3 Write integration test for Help Center page rendering
    - Test that all 5 tabs render correctly
    - Test tab switching behavior
    - _Requirements: 1.3, 1.4_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

