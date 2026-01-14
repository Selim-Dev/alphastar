# Implementation Plan

## Phase 1: Create Shared Navigation Components

- [x] 1. Create Breadcrumb component and route configuration






  - [x] 1.1 Create Breadcrumb component in `frontend/src/components/ui/Breadcrumb.tsx`

    - Implement BreadcrumbItem interface with label and optional path
    - Create responsive breadcrumb display with truncation for long paths
    - Add click handlers for navigation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


  - [x] 1.2 Create route-to-breadcrumb mapping configuration

    - Define ROUTE_BREADCRUMBS constant with all nested route paths
    - Create useBreadcrumbs hook to get breadcrumbs for current route
    - _Requirements: 8.1_

## Phase 2: Refactor Maintenance Tasks Module



- [x] 2. Convert Maintenance Tasks from tabs to nested routes



  - [x] 2.1 Create MaintenanceTasksListPage component


    - Extract list view logic from MaintenancePage.tsx
    - Add filters, date range, and export functionality
    - Include summary cards at top of list
    - _Requirements: 1.1, 7.1_

  - [x] 2.2 Create MaintenanceTasksLogPage component


    - Extract form logic from MaintenancePage.tsx
    - Implement standalone form page with navigation back to list
    - Add success redirect to list view
    - _Requirements: 1.1, 7.2_

  - [x] 2.3 Create MaintenanceTasksAnalyticsPage component


    - Extract summary/analytics view from MaintenancePage.tsx
    - Include charts for top cost drivers and tasks by shift
    - Add date range filters and export
    - _Requirements: 1.1, 7.3_

  - [x] 2.4 Update App.tsx routes for Maintenance Tasks


    - Add routes: `/maintenance/tasks`, `/maintenance/tasks/log`, `/maintenance/tasks/analytics`
    - Add redirect from `/maintenance` to `/maintenance/tasks`
    - Protect log route with Editor/Admin role check
    - _Requirements: 1.1, 1.4, 7.4, 7.5_

## Phase 3: Refactor Work Orders Module


- [x] 3. Convert Work Orders from tabs to nested routes




  - [x] 3.1 Create WorkOrdersListPage component


    - Extract list view logic from WorkOrdersPage.tsx
    - Maintain deep-link support for woId query param
    - Include overdue highlighting and status filters
    - _Requirements: 1.2, 3.2, 7.1_


  - [x] 3.2 Create WorkOrdersNewPage component

    - Extract form logic from WorkOrdersPage.tsx
    - Support both create and edit modes via URL param
    - Add success redirect to list view
    - _Requirements: 1.2, 7.2_


  - [x] 3.3 Create WorkOrdersAnalyticsPage component

    - Extract analytics view from WorkOrdersPage.tsx
    - Include status distribution charts and turnaround metrics
    - Add date range filters
    - _Requirements: 1.2, 7.3_


  - [x] 3.4 Update App.tsx routes for Work Orders

    - Add routes: `/work-orders`, `/work-orders/new`, `/work-orders/analytics`, `/work-orders/:id/edit`
    - Protect new/edit routes with Editor/Admin role check
    - _Requirements: 1.2, 1.4, 7.4, 7.5_

## Phase 4: Refactor Discrepancies Module


- [x] 4. Convert Discrepancies from tabs to nested routes





  - [x] 4.1 Create DiscrepanciesListPage component

    - Extract list view logic from DiscrepanciesPage.tsx
    - Include ATA chapter filter and uncorrected toggle
    - Add summary cards
    - _Requirements: 1.3, 7.1_



  - [x] 4.2 Create DiscrepanciesNewPage component

    - Extract form logic from DiscrepanciesPage.tsx
    - Support both create and edit modes
    - Add success redirect to list view
    - _Requirements: 1.3, 7.2_


  - [x] 4.3 Create DiscrepanciesAnalyticsPage component

    - Extract analytics view from DiscrepanciesPage.tsx
    - Include ATA chapter charts and distribution
    - Add date range filters
    - _Requirements: 1.3, 7.3_


  - [x] 4.4 Update App.tsx routes for Discrepancies

    - Add routes: `/discrepancies`, `/discrepancies/new`, `/discrepancies/analytics`, `/discrepancies/:id/edit`
    - Protect new/edit routes with Editor/Admin role check
    - _Requirements: 1.3, 1.4, 7.4, 7.5_

## Phase 5: Update Sidebar Navigation


- [x] 5. Update Sidebar with new navigation structure




  - [x] 5.1 Update navigationGroups configuration in Sidebar.tsx


    - Add subItems for Maintenance Tasks, Work Orders, and Discrepancies
    - Configure editorOnly flags for create/edit routes
    - Ensure AOG Events pattern is maintained
    - _Requirements: 2.1, 2.2_

  - [x] 5.2 Enhance NavItem component for nested routes


    - Improve active state detection for parent and child items
    - Auto-expand parent when child route is active
    - Handle collapsed sidebar state with tooltips
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 5.3 Integrate Breadcrumb component into MainLayout


    - Add Breadcrumb component below header
    - Connect to useBreadcrumbs hook
    - Style consistently with existing design
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Phase 6: Implement Alert Deep-Linking


- [x] 6. Update AlertsPanel for deep-linking




  - [x] 6.1 Create alert routing configuration


    - Define ALERT_ROUTES mapping in AlertsPanel.tsx
    - Map alert types to destination routes with query params
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Update alert click handlers


    - Implement navigation with query params preservation
    - Add support for filter context in URLs
    - Handle missing entity gracefully
    - _Requirements: 3.5_

  - [x] 6.3 Update destination pages to handle alert params


    - WorkOrdersListPage: handle woId param for highlighting
    - DiscrepanciesListPage: handle uncorrected filter param
    - MaintenanceTasksListPage: handle date range params
    - _Requirements: 3.2, 3.3, 3.4_

## Phase 7: Verify Daily Status Import Parity


- [x] 7. Verify and enhance Daily Status import





  - [x] 7.1 Verify Daily Status template generation

    - Confirm template includes all required columns
    - Verify example row has valid data
    - Check instructions sheet is complete
    - _Requirements: 4.1_


  - [x] 7.2 Verify Daily Status validation in excel-parser.service.ts

    - Confirm hour range validation (0-24) is implemented
    - Verify downtime sum validation (sum <= posHours)
    - Check required field validation
    - _Requirements: 4.2, 4.3_


  - [x] 7.3 Verify FMC calculation in import.service.ts

    - Confirm FMC = POS - NMCM_S - NMCM_U - NMCS calculation
    - Verify clamping to [0, posHours] range
    - _Requirements: 4.4_


  - [x] 7.4 Verify duplicate detection in import.service.ts

    - Confirm duplicate check by aircraft + date
    - Verify error message includes aircraft and date
    - _Requirements: 4.5_


  - [x] 7.5 Verify import log creation

    - Confirm import log record is created on completion
    - Verify success/error counts are accurate
    - _Requirements: 4.6_

## Phase 8: Add Backward Compatibility Redirects


- [x] 8. Implement backward compatibility




  - [x] 8.1 Add legacy route redirects in App.tsx


    - Redirect `/maintenance` to `/maintenance/tasks`
    - Verify `/events` redirect to `/aog/list` exists
    - Add any other necessary redirects
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Preserve query params in redirects


    - Use Navigate component with search params
    - Test param preservation for date ranges and filters
    - _Requirements: 6.4_

## Phase 9: FE/BE Synchronization Audit

- [x] 9. Audit and fix FE/BE synchronization





  - [x] 9.1 Audit import type enums


    - Compare frontend ImportType with backend ImportType enum
    - Fix any mismatches in naming or values
    - _Requirements: 5.3_

  - [x] 9.2 Audit export type enums


    - Compare frontend ExportType with backend EXPORT_TYPES
    - Fix any mismatches in naming or values
    - _Requirements: 5.4_

  - [x] 9.3 Audit API endpoint naming


    - Verify all frontend API calls match backend routes
    - Ensure consistent kebab-case naming
    - _Requirements: 5.1_

  - [x] 9.4 Audit TypeScript types vs DTOs


    - Compare frontend types/index.ts with backend DTOs
    - Fix any field name or type mismatches
    - _Requirements: 5.2_

## Phase 10: Cleanup and Polish


- [x] 10. Final cleanup and polish





  - [x] 10.1 Remove old tab-based page components

    - Delete or archive MaintenancePage.tsx (replaced by split pages)
    - Delete or archive WorkOrdersPage.tsx (replaced by split pages)
    - Delete or archive DiscrepanciesPage.tsx (replaced by split pages)
    - Update any imports referencing old components
    - _Requirements: 1.1, 1.2, 1.3_


  - [x] 10.2 Update page titles and meta

    - Add appropriate document titles for each new page
    - Ensure consistent page header styling
    - _Requirements: 7.1, 7.2, 7.3_


  - [x] 10.3 Manual verification checklist

    - Verify all nested routes render correctly
    - Verify sidebar navigation works as expected
    - Verify breadcrumbs display correctly
    - Verify alert deep-links work
    - Verify Daily Status import end-to-end
    - Verify backward compatibility redirects
    - _Requirements: All_

