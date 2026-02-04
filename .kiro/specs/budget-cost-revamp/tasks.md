# Implementation Plan: Budget & Cost Revamp

## Overview

This implementation plan breaks down the Budget & Cost Revamp feature into discrete coding tasks. The approach follows a bottom-up strategy: data models → backend services → API endpoints → frontend components → analytics → export features. Each task builds on previous work, with checkpoints to ensure stability before proceeding.

## Tasks

- [ ] 1. Set up backend module structure and data models
  - Create NestJS modules for budget projects, templates, analytics, and import/export
  - Define MongoDB schemas with Mongoose
  - Set up database indexes for optimal query performance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Implement spending terms taxonomy and template system
  - [ ] 2.1 Create spending terms registry with RSAF taxonomy (60+ terms)
    - Define SpendingTerm interface with id, name, category, sortOrder
    - Create RSAF template definition with all spending terms organized by category
    - Implement BudgetTemplatesService with getTemplate() and getSpendingTerms() methods
    - _Requirements: 11.1, 11.2, 11.6_

  - [ ]* 2.2 Write property test for template loading consistency
    - **Property 1: Template Loading Consistency**
    - **Validates: Requirements 1.2**

  - [ ] 2.3 Create template validation utilities
    - Implement validateTemplateStructure() for Excel file validation
    - Support RSAF template structure (header row, term column, planned/actual columns)
    - _Requirements: 7.2, 11.6_

- [ ] 3. Implement budget project CRUD operations
  - [ ] 3.1 Create BudgetProject schema and repository
    - Define schema with name, templateType, dateRange, currency, aircraftScope, status
    - Implement repository methods: create, findAll, findOne, update, delete
    - Add compound indexes for filtering and performance
    - _Requirements: 1.1, 1.3, 1.6_

  - [ ] 3.2 Implement BudgetProjectsService
    - Implement create() with aircraft scope resolution
    - Implement plan row generation (term × aircraft combinations)
    - Implement findAll() with year and status filters
    - Implement update() and delete() with authorization checks
    - _Requirements: 1.4, 1.5, 9.2_

  - [ ]* 3.3 Write property test for plan row generation completeness
    - **Property 3: Plan Row Generation Completeness**
    - **Validates: Requirements 1.5**

  - [ ]* 3.4 Write property test for project round-trip consistency
    - **Property 4: Project Round-Trip Consistency**
    - **Validates: Requirements 1.6**

  - [ ] 3.5 Create BudgetProjectsController
    - Implement POST /api/budget-projects (create)
    - Implement GET /api/budget-projects (list with filters)
    - Implement GET /api/budget-projects/:id (get details)
    - Implement PUT /api/budget-projects/:id (update)
    - Implement DELETE /api/budget-projects/:id (Admin only)
    - Add @Roles() decorators for authorization
    - _Requirements: 1.1, 1.3, 13.2, 13.5_

  - [ ]* 3.6 Write property test for required field validation
    - **Property 2: Required Field Validation**
    - **Validates: Requirements 1.1, 1.3, 14.5**

- [ ] 4. Checkpoint - Ensure project CRUD tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement budget plan rows and actuals
  - [ ] 5.1 Create BudgetPlanRow schema and repository
    - Define schema with projectId, termId, termName, termCategory, aircraftId, aircraftType, plannedAmount
    - Add unique compound index on (projectId, termId, aircraftId)
    - Implement repository methods for CRUD operations
    - _Requirements: 3.1, 3.2_

  - [ ] 5.2 Create BudgetActual schema and repository
    - Define schema with projectId, termId, period, aircraftId, aircraftType, amount, notes, createdBy
    - Add compound indexes for aggregation queries
    - Implement repository methods with aggregation support
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.3 Implement table data operations in BudgetProjectsService
    - Implement getTableData() to fetch and format table view data
    - Implement updatePlanRow() with validation and audit logging
    - Implement updateActual() with period validation and audit logging
    - Calculate row totals, column totals, and grand totals
    - _Requirements: 2.1, 2.5, 2.6, 3.4, 3.5, 4.4_

  - [ ]* 5.4 Write property test for row total accuracy
    - **Property 7: Row Total Accuracy**
    - **Validates: Requirements 2.6**

  - [ ]* 5.5 Write property test for column total accuracy
    - **Property 8: Column Total Accuracy**
    - **Validates: Requirements 2.6**

  - [ ]* 5.6 Write property test for remaining budget invariant
    - **Property 10: Remaining Budget Invariant**
    - **Validates: Requirements 3.5, 4.6**

  - [ ] 5.7 Add table data endpoints to BudgetProjectsController
    - Implement GET /api/budget-projects/:id/table-data
    - Implement PATCH /api/budget-projects/:id/plan-row/:rowId
    - Implement PATCH /api/budget-projects/:id/actual/:period
    - Add input validation with class-validator decorators
    - _Requirements: 2.4, 2.5, 2.10, 14.1, 14.2_

  - [ ]* 5.8 Write property test for non-negative amount validation
    - **Property 6: Non-Negative Amount Validation**
    - **Validates: Requirements 2.4, 14.1, 14.2**

  - [ ]* 5.9 Write property test for fiscal period validation
    - **Property 13: Fiscal Period Validation**
    - **Validates: Requirements 4.2, 14.3**

- [ ] 6. Implement audit trail system
  - [ ] 6.1 Create BudgetAuditLog schema and repository
    - Define schema with projectId, entityType, entityId, action, fieldChanged, oldValue, newValue, userId, timestamp
    - Add indexes for querying by project and user
    - Implement repository methods for logging and querying
    - _Requirements: 8.1, 8.2_

  - [ ] 6.2 Add audit logging to all mutation operations
    - Add audit logging to project create/update/delete
    - Add audit logging to plan row updates
    - Add audit logging to actual updates
    - Include user ID from JWT token in all audit entries
    - _Requirements: 8.1, 13.4_

  - [ ]* 6.3 Write property test for audit trail creation
    - **Property 21: Audit Trail Creation**
    - **Validates: Requirements 8.1, 13.4**

  - [ ] 6.4 Create audit endpoints
    - Implement GET /api/budget-audit/:projectId (get audit log)
    - Implement GET /api/budget-audit/:projectId/summary (get summary)
    - Support filtering by date range, user, and change type
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ]* 6.5 Write property test for audit log sort order
    - **Property 22: Audit Log Sort Order**
    - **Validates: Requirements 8.4**

- [ ] 7. Checkpoint - Ensure data entry and audit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement budget analytics service
  - [ ] 8.1 Create BudgetAnalyticsService with KPI calculations
    - Implement getKPIs() with aggregation pipeline
    - Calculate: totalBudgeted, totalSpent, remainingBudget, budgetUtilization
    - Calculate: burnRate, averageMonthlySpend, forecastMonthsRemaining, forecastDepletionDate
    - Support filtering by date range, aircraft type, and term search
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.2 Write property test for burn rate formula
    - **Property 16: Burn Rate Formula**
    - **Validates: Requirements 5.2**

  - [ ]* 8.3 Write property test for forecast formula
    - **Property 17: Forecast Formula**
    - **Validates: Requirements 5.3**

  - [ ] 8.4 Implement chart data methods in BudgetAnalyticsService
    - Implement getMonthlySpendByTerm() - stacked bar chart data
    - Implement getCumulativeSpendVsBudget() - line chart data
    - Implement getSpendDistribution() - donut/pie chart data
    - Implement getBudgetedVsSpentByAircraftType() - grouped bar chart data
    - Implement getTop5OverspendTerms() - ranked list data
    - Implement getSpendingHeatmap() - optional heatmap data
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 8.5 Write property test for filter application consistency
    - **Property 18: Filter Application Consistency**
    - **Validates: Requirements 5.10**

  - [ ] 8.6 Create BudgetAnalyticsController
    - Implement GET /api/budget-analytics/:projectId/kpis
    - Implement GET /api/budget-analytics/:projectId/monthly-spend
    - Implement GET /api/budget-analytics/:projectId/cumulative-spend
    - Implement GET /api/budget-analytics/:projectId/spend-distribution
    - Implement GET /api/budget-analytics/:projectId/budgeted-vs-spent
    - Implement GET /api/budget-analytics/:projectId/top-overspend
    - Implement GET /api/budget-analytics/:projectId/heatmap
    - Add query parameter support for filters
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [ ] 9. Implement Excel import/export functionality
  - [ ] 9.1 Create BudgetImportService
    - Implement parseExcelFile() using xlsx library
    - Validate file structure against template definition
    - Extract planned amounts and actual amounts from Excel
    - Generate preview data for user confirmation
    - Implement importData() to create plan rows and actuals
    - _Requirements: 3.3, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Write property test for Excel structure validation
    - **Property 19: Excel Structure Validation**
    - **Validates: Requirements 7.2, 7.4**

  - [ ] 9.3 Create BudgetExportService
    - Implement exportToExcel() to generate Excel file
    - Format data to match RSAF template structure
    - Include spending terms, planned amounts, monthly actuals, and totals
    - Preserve currency formatting and number formats
    - Support filtered data export
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

  - [ ]* 9.4 Write property test for Excel import round-trip
    - **Property 11: Excel Import Round-Trip**
    - **Validates: Requirements 3.3, 7.5**

  - [ ]* 9.5 Write property test for export data completeness
    - **Property 20: Export Data Completeness**
    - **Validates: Requirements 7.6**

  - [ ] 9.6 Create import/export endpoints
    - Implement POST /api/budget-import/excel (import file)
    - Implement POST /api/budget-import/validate (validate without importing)
    - Implement GET /api/budget-export/:projectId/excel (export to Excel)
    - Add file upload handling with size limits (10MB max)
    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 10. Checkpoint - Ensure backend analytics and import/export tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement frontend custom hooks
  - [ ] 11.1 Create useBudgetProjects hook
    - Implement useProjects() query with filters
    - Implement useProject() query for single project
    - Implement useCreateProject() mutation
    - Implement useUpdateProject() mutation
    - Implement useDeleteProject() mutation
    - Implement useTableData() query
    - Implement useUpdatePlanRow() mutation
    - Implement useUpdateActual() mutation
    - Add query invalidation after mutations
    - _Requirements: 1.1, 1.3, 2.5_

  - [ ] 11.2 Create useBudgetAnalytics hook
    - Implement useKPIs() query with filters
    - Implement useMonthlySpend() query with filters
    - Implement useCumulativeSpend() query
    - Implement useSpendDistribution() query with filters
    - Implement useBudgetedVsSpent() query
    - Implement useTop5Overspend() query
    - Implement useHeatmap() query
    - Add 5-minute stale time for analytics caching
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 11.3 Create useBudgetAudit hook
    - Implement useAuditLog() query with filters
    - Implement useAuditSummary() query
    - _Requirements: 8.2, 8.3_

- [ ] 12. Implement budget projects list page
  - [ ] 12.1 Create BudgetProjectsListPage component
    - Display projects table with columns: name, template, date range, budgeted, spent, status
    - Add year filter dropdown
    - Add "Create New Project" button
    - Implement row click navigation to detail page
    - Add loading states and error handling
    - _Requirements: 1.7, 9.1, 9.2_

  - [ ]* 12.2 Write property test for year filter accuracy
    - **Property 23: Year Filter Accuracy**
    - **Validates: Requirements 9.2**

  - [ ] 12.3 Create project creation dialog/form
    - Form fields: name, template type, date range, currency, aircraft scope
    - Use React Hook Form with Zod validation
    - Support aircraft scope selection (individual, type, group)
    - Display validation errors inline
    - Show success toast on creation
    - _Requirements: 1.1, 1.3, 1.4, 14.5, 14.6_

- [ ] 13. Implement budget table component with inline editing
  - [ ] 13.1 Create BudgetTable component
    - Display spending terms as rows, months as columns
    - Show planned amount column before monthly actuals
    - Implement sticky headers (term names, month columns)
    - Display row totals and column totals
    - Show grand totals (budgeted, spent, remaining)
    - Add loading skeleton and error states
    - _Requirements: 2.1, 2.2, 2.6, 2.7_

  - [ ] 13.2 Implement inline cell editing
    - Enable editing on cell click
    - Validate input (non-negative numbers only)
    - Show validation errors inline
    - Implement optimistic updates with rollback on error
    - Show save success/error feedback
    - Debounce rapid edits (300ms)
    - _Requirements: 2.3, 2.4, 2.5, 2.9, 2.10_

  - [ ] 13.3 Add sticky KPI cards above table
    - Display: Total Budgeted, Total Spent, Remaining Budget, Burn Rate
    - Update in real-time as data changes
    - Use sticky positioning to keep visible on scroll
    - _Requirements: 2.7, 2.8_

- [ ] 14. Implement budget project detail page
  - [ ] 14.1 Create BudgetProjectDetailPage component
    - Display project header with name, date range, template type
    - Add tabs: Table View, Analytics, Audit Log
    - Implement breadcrumb navigation
    - Add "Export to Excel" button
    - _Requirements: 9.3, 9.4, 9.5_

  - [ ] 14.2 Integrate BudgetTable component in Table View tab
    - Pass project ID to BudgetTable
    - Handle loading and error states
    - _Requirements: 2.1, 2.5_

  - [ ] 14.3 Create audit log tab
    - Display audit entries in reverse chronological order
    - Show: timestamp, user, action, field changed, old/new values
    - Add filters: date range, user, change type
    - Implement pagination for large logs
    - _Requirements: 8.2, 8.3, 8.4_

- [ ] 15. Checkpoint - Ensure frontend table and editing work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement budget analytics page
  - [ ] 16.1 Create BudgetAnalyticsPage component
    - Add filter panel: date range, aircraft type, intl/domestic, term search
    - Display 6 KPI cards in grid layout
    - Add "Export to PDF" button
    - Implement progressive loading (KPIs first, then charts)
    - _Requirements: 5.1, 5.10, 5.11, 6.1_

  - [ ] 16.2 Create analytics chart components
    - Create MonthlySpendByTermChart (stacked bar using Recharts)
    - Create CumulativeSpendChart (line chart with target line)
    - Create SpendDistributionChart (donut/pie chart)
    - Create BudgetedVsSpentChart (grouped bar chart)
    - Create Top5OverspendList (ranked list with horizontal bars)
    - Create SpendingHeatmap (optional grid heatmap)
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ] 16.3 Implement filter functionality
    - Connect filter inputs to analytics queries
    - Debounce filter changes (300ms)
    - Update all charts when filters change
    - Show loading states during filter updates
    - _Requirements: 5.10, 5.11_

- [ ] 17. Implement PDF export functionality
  - [ ] 17.1 Create BudgetPDFExport component
    - Use jsPDF + html2canvas for client-side generation
    - Implement multi-page layout with A4 dimensions
    - Add report header with project name, date range, filters, timestamp
    - Add KPI summary section
    - Add charts section (capture at 2x scale for high resolution)
    - Add tables section (top 5 overspend + key totals)
    - Add page numbers and footers
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9_

  - [ ] 17.2 Implement PDF generation logic
    - Capture chart elements as high-res images
    - Handle page breaks for multi-page content
    - Format tables for print layout
    - Show loading indicator during generation (10-15 seconds)
    - Trigger download when complete
    - _Requirements: 6.7, 6.10_

- [ ] 18. Implement Excel export functionality
  - [ ] 18.1 Create Excel export button and handler
    - Add "Export to Excel" button on project detail page
    - Call export API endpoint
    - Handle file download
    - Show loading state during export
    - _Requirements: 7.5_

  - [ ] 18.2 Test Excel export with filtered data
    - Verify export respects current filters
    - Verify all data is included
    - Verify formatting is preserved
    - _Requirements: 7.6, 7.7, 7.8_

- [ ] 19. Implement navigation and routing
  - [ ] 19.1 Add budget routes to React Router
    - Add /budget-projects route (list page)
    - Add /budget-projects/:id route (detail page)
    - Add /budget-projects/:id/analytics route (analytics page)
    - Implement protected routes with role checks
    - _Requirements: 13.2_

  - [ ] 19.2 Add sidebar navigation entry
    - Add "Budget Projects" entry to AppShell sidebar
    - Use appropriate icon (e.g., DollarSign or Calculator)
    - Mark old "Budget & Cost" as deprecated (comment out or hide)
    - _Requirements: 9.3_

- [ ] 20. Implement security and authorization
  - [ ]* 20.1 Write property test for authentication requirement
    - **Property 27: Authentication Requirement**
    - **Validates: Requirements 13.1**

  - [ ]* 20.2 Write property test for role-based access control
    - **Property 28: Role-Based Access Control**
    - **Validates: Requirements 13.2, 13.5**

  - [ ] 20.3 Add role checks to all mutation endpoints
    - Verify Editor/Admin role for create/update operations
    - Verify Admin role for delete operations
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 13.2, 13.5_

  - [ ] 20.4 Implement frontend role-based UI
    - Hide delete buttons for non-Admin users
    - Disable editing for Viewer role
    - Show role indicator in UI (optional)
    - _Requirements: 13.3, 13.6_

- [ ] 21. Checkpoint - Ensure analytics, export, and security work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Implement data independence verification
  - [ ]* 22.1 Write property test for data independence
    - **Property 24: Data Independence**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 22.2 Write property test for aircraft deletion preservation
    - **Property 25: Aircraft Deletion Preservation**
    - **Validates: Requirements 10.6**

  - [ ] 22.3 Verify budget calculations don't query other modules
    - Review all analytics queries to ensure they only use budget collections
    - Verify no joins with maintenance, AOG, or work order collections
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 23. Implement mobile responsive design
  - [ ] 23.1 Add responsive styles to projects list page
    - Use responsive grid for project cards on mobile
    - Stack filters vertically on small screens
    - _Requirements: 15.1, 15.2_

  - [ ] 23.2 Add responsive styles to budget table
    - Enable horizontal scrolling on tablets
    - Use card-based layout on mobile (<768px)
    - Maintain sticky headers on mobile
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 23.3 Add responsive styles to analytics page
    - Stack KPI cards vertically on mobile
    - Scale charts for smaller screens
    - Prioritize critical charts on mobile
    - _Requirements: 15.5, 15.6_

- [ ] 24. Performance optimization
  - [ ] 24.1 Add database indexes
    - Create indexes as specified in design document
    - Verify query performance with explain()
    - _Requirements: 12.1_

  - [ ] 24.2 Implement frontend optimizations
    - Add virtual scrolling for tables with 100+ rows
    - Memoize expensive calculations (totals, percentages)
    - Implement lazy loading for analytics charts
    - Add debouncing for filter inputs (300ms)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 24.3 Test performance with large datasets
    - Test table rendering with 1000+ rows
    - Test analytics with 12+ months of data
    - Verify response times meet requirements (<2s for table, <1s for filters)
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 25. Write integration tests
  - [ ]* 25.1 Write E2E test for project creation flow
    - Create project → Verify plan rows → Enter planned amounts → Verify totals

  - [ ]* 25.2 Write E2E test for data entry flow
    - Open project → Edit cell → Save → Verify total → Refresh → Verify persisted

  - [ ]* 25.3 Write E2E test for analytics flow
    - Enter actuals → Open analytics → Verify KPIs → Apply filters → Verify charts

  - [ ]* 25.4 Write E2E test for export flow
    - Create project → Export Excel → Verify download → Export PDF → Verify generated

- [ ] 26. Final checkpoint - Ensure all tests pass and feature is complete
  - Run full test suite (unit, property, integration, E2E)
  - Verify all 28 correctness properties pass
  - Test all user flows manually
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (28 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- The implementation follows a bottom-up approach: data → backend → frontend → analytics → export
- All backend code follows NestJS module-based architecture
- All frontend code uses React functional components with TypeScript
- TanStack Query handles all API state management with proper invalidation
