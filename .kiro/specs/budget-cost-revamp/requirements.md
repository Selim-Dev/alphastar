# Requirements Document: Budget & Cost Revamp

## Introduction

The Budget & Cost Revamp feature is a complete redesign of the budgeting system for the Alpha Star Aviation KPIs Dashboard. This feature introduces a template-driven architecture that supports multiple budget project types, starting with the RSAF Excel template. The system is designed to be self-contained and independent from other modules, providing managers with a fast, intuitive interface for budget planning and tracking.

The primary goal is to replace the existing budget system with a modern, manager-friendly solution that supports:
- Template-driven budget projects with aircraft scope selection
- Fast monthly data entry with inline editing
- Comprehensive analytics and visualizations
- Professional PDF export for client presentations
- Complete audit trail for all financial changes

## Glossary

- **Budget_Project**: A self-contained budgeting initiative based on a specific template type, covering a defined date range and aircraft scope
- **Budget_Template**: A predefined structure defining spending terms and layout (e.g., RSAF template with 60+ terms)
- **Spending_Term**: A specific budget line item category (e.g., "Off Base Maintenance International", "Scheduled Maintenance")
- **Aircraft_Scope**: The set of aircraft or aircraft types included in a budget project
- **Planned_Amount**: The budgeted allocation for a specific term and aircraft combination
- **Actual_Spend**: The real expenditure recorded for a specific term in a given month
- **Burn_Rate**: The average monthly spending rate calculated from actual expenditures
- **Budget_Variance**: The difference between planned and actual spending (Remaining = Budgeted - Spent)
- **Fiscal_Period**: A month within the budget project's date range, formatted as YYYY-MM
- **Audit_Trail**: A chronological record of all budget modifications with user attribution

## Requirements

### Requirement 1: Template-Driven Budget Project Management

**User Story:** As a finance manager, I want to create budget projects based on predefined templates, so that I can quickly set up budgets following organizational standards.

#### Acceptance Criteria

1. WHEN a user creates a new budget project, THE System SHALL require selection of a template type (starting with "RSAF Template")
2. WHEN a template is selected, THE System SHALL load the associated spending terms taxonomy (60+ terms for RSAF)
3. WHEN creating a project, THE System SHALL require: project name, template type, date range (start/end), currency, and aircraft scope
4. THE System SHALL support aircraft scope selection by: individual aircraft, aircraft type, or fleet group
5. WHEN a project is created, THE System SHALL generate budget plan rows for all combinations of spending terms and aircraft in scope
6. THE System SHALL store template type with each project to support future template variations
7. WHEN viewing the project list, THE System SHALL display: project name, template type, date range, total budgeted, total spent, and status

### Requirement 2: Fast Monthly Data Entry with Inline Editing

**User Story:** As a finance manager, I want to quickly enter and edit budget data in a spreadsheet-like interface, so that I can update actuals efficiently without navigating multiple screens.

#### Acceptance Criteria

1. WHEN viewing a budget project, THE System SHALL display a table with spending terms as rows and months as columns
2. THE System SHALL display planned amounts in a dedicated column before the monthly actual columns
3. WHEN a user clicks on an editable cell, THE System SHALL enable inline editing without page navigation
4. WHEN a user enters a value, THE System SHALL validate that it is a non-negative number
5. WHEN a user saves a cell edit, THE System SHALL update the database and recalculate all dependent totals immediately
6. THE System SHALL display row totals (sum of monthly actuals) and column totals (sum of all terms for that month)
7. THE System SHALL display header KPI cards showing: Total Budgeted, Total Spent, Remaining Budget, and Burn Rate
8. WHEN the user scrolls, THE System SHALL keep the header KPI cards and column headers visible (sticky positioning)
9. THE System SHALL provide visual feedback for unsaved changes and successful saves
10. WHEN a cell edit fails validation, THE System SHALL display an error message and prevent saving

### Requirement 3: Budget Planning and Allocation

**User Story:** As a finance manager, I want to set planned budget amounts for each spending term and aircraft combination, so that I can establish baseline targets for the fiscal period.

#### Acceptance Criteria

1. WHEN creating a budget project, THE System SHALL generate plan rows for each spending term × aircraft combination
2. THE System SHALL allow users to enter planned amounts for each budget plan row
3. THE System SHALL support bulk import of planned amounts from Excel files
4. THE System SHALL calculate total planned budget across all terms and aircraft
5. WHEN planned amounts are updated, THE System SHALL recalculate remaining budget (Planned - Spent)
6. THE System SHALL display planned amounts in a dedicated column in the table view
7. THE System SHALL support copying planned amounts from a previous project (optional feature)

### Requirement 4: Actual Spend Tracking

**User Story:** As a finance manager, I want to record actual expenditures by month for each spending term, so that I can track budget utilization over time.

#### Acceptance Criteria

1. WHEN a user enters an actual spend amount, THE System SHALL associate it with: spending term, fiscal period (YYYY-MM), and optionally aircraft
2. THE System SHALL validate that the fiscal period falls within the project's date range
3. THE System SHALL allow multiple entries for the same term and period (aggregated in display)
4. WHEN displaying actuals, THE System SHALL sum all entries for the same term and period
5. THE System SHALL calculate cumulative spend (sum of all months up to current period)
6. THE System SHALL calculate variance (Planned - Actual) for each term
7. THE System SHALL highlight overspend conditions (Actual > Planned) with visual indicators

### Requirement 5: Comprehensive Analytics Dashboard

**User Story:** As a finance manager, I want to view analytics and visualizations of budget performance, so that I can identify trends, overspends, and make informed decisions.

#### Acceptance Criteria

1. WHEN viewing the Analytics tab, THE System SHALL display KPI cards for: Total Budgeted, Total Spent, Remaining Budget, Burn Rate, Average Monthly Spend, and Forecast
2. THE System SHALL calculate Burn Rate as: Total Spent / Number of Months with Data
3. THE System SHALL calculate Forecast as: Remaining Budget / Burn Rate (months remaining)
4. THE System SHALL display a stacked bar chart showing Monthly Spend by Term
5. THE System SHALL display a line chart showing Cumulative Spend vs Budget over time
6. THE System SHALL display a donut or pie chart showing Spend Distribution by category
7. THE System SHALL display a bar chart comparing Budgeted vs Spent per Aircraft Type
8. THE System SHALL display a ranked list of Top 5 Overspend Terms (highest variance)
9. THE System SHALL optionally display a heatmap showing spending intensity (terms × months)
10. THE System SHALL support filtering by: date range, aircraft type/group, international vs domestic, and term search
11. WHEN filters are applied, THE System SHALL update all charts and KPIs dynamically

### Requirement 6: Professional PDF Export

**User Story:** As a finance manager, I want to export analytics as a professional PDF report, so that I can share budget performance with stakeholders and clients.

#### Acceptance Criteria

1. WHEN a user clicks "Export PDF", THE System SHALL generate a client-ready PDF report
2. THE System SHALL include a report header with: project name, date range, generation timestamp, and applied filters
3. THE System SHALL include a KPI summary section with all key metrics
4. THE System SHALL include a charts section with all visualizations from the analytics tab
5. THE System SHALL include a tables section with: Top 5 Overspend Terms and key totals
6. THE System SHALL render charts at high resolution (not blurry) suitable for printing
7. THE System SHALL use A4 page layout with proper margins and page breaks
8. THE System SHALL support multi-page output when content exceeds one page
9. THE System SHALL display a loading indicator during PDF generation
10. THE System SHALL provide WYSIWYG output (PDF matches screen display)

### Requirement 7: Excel Import and Export

**User Story:** As a finance manager, I want to import and export budget data via Excel, so that I can work offline and integrate with existing workflows.

#### Acceptance Criteria

1. WHEN creating a project, THE System SHALL support importing planned amounts from an Excel file matching the template format
2. THE System SHALL validate Excel file structure against the selected template
3. WHEN importing, THE System SHALL display a preview of data to be imported
4. THE System SHALL report validation errors (missing columns, invalid values, out-of-range dates)
5. WHEN exporting to Excel, THE System SHALL generate a file matching the template format
6. THE System SHALL include: spending terms, planned amounts, monthly actuals, and calculated totals
7. THE System SHALL preserve formatting (currency symbols, number formats) in Excel export
8. THE System SHALL support exporting filtered data (respecting current filters)

### Requirement 8: Audit Trail and Change History

**User Story:** As a finance manager, I want to see who made changes to budget data and when, so that I can maintain accountability and track modifications.

#### Acceptance Criteria

1. WHEN a user modifies any budget data, THE System SHALL record: user ID, timestamp, field changed, old value, and new value
2. THE System SHALL display an audit log accessible from the project detail page
3. THE System SHALL support filtering audit log by: date range, user, and change type
4. THE System SHALL display audit entries in reverse chronological order (newest first)
5. THE System SHALL include audit information in PDF exports (optional summary section)
6. THE System SHALL retain audit history for the lifetime of the project

### Requirement 9: Year Switcher and Navigation

**User Story:** As a finance manager, I want to quickly switch between fiscal years and navigate between projects, so that I can compare performance across periods.

#### Acceptance Criteria

1. WHEN viewing the budget projects list, THE System SHALL provide a year filter dropdown
2. WHEN a year is selected, THE System SHALL display only projects with date ranges overlapping that year
3. THE System SHALL provide a "Create New Project" button prominently displayed
4. WHEN viewing a project, THE System SHALL provide breadcrumb navigation back to the project list
5. THE System SHALL display the current project name and date range in the page header
6. THE System SHALL support keyboard shortcuts for common actions (optional enhancement)

### Requirement 10: Data Independence and Self-Containment

**User Story:** As a system architect, I want the budget module to be independent from other modules, so that budget calculations are reliable and not affected by changes in other systems.

#### Acceptance Criteria

1. THE System SHALL NOT couple budget calculations to Maintenance Tasks, Work Orders, or AOG Events
2. THE System SHALL only reference Aircraft master data for scope selection and display
3. WHEN calculating budget metrics, THE System SHALL use only data from budget-specific collections
4. THE System SHALL maintain its own spending records independent of other financial modules
5. THE System SHALL support manual entry of all actual spend data (no automatic imports from other modules)
6. WHEN aircraft are deleted from master data, THE System SHALL preserve budget project data with archived aircraft references

### Requirement 11: Spending Terms Taxonomy

**User Story:** As a finance manager, I want to use a standardized taxonomy of spending terms, so that budget categories are consistent across projects.

#### Acceptance Criteria

1. THE System SHALL support the RSAF spending terms taxonomy with 60+ predefined terms
2. THE System SHALL organize terms into categories: Off Base Maintenance (International/Domestic), Scheduled Maintenance, Engines & APU, Landing Gear, Component Repair, Spare Parts, Consumables, Ground Support Equipment, Fuel, Subscriptions, Insurance, Cabin Crew, Manpower, Handling & Permits, Catering, Communication, Miscellaneous, Training
3. THE System SHALL display terms in a hierarchical or grouped structure in the UI
4. THE System SHALL support term search and filtering in the table view
5. THE System SHALL allow future addition of new templates with different term taxonomies
6. THE System SHALL store term definitions at the template level (not hardcoded)

### Requirement 12: Performance and Responsiveness

**User Story:** As a finance manager, I want the system to respond quickly to my actions, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN loading a project table view, THE System SHALL display data within 2 seconds for projects with up to 1000 rows
2. WHEN saving a cell edit, THE System SHALL persist the change and update totals within 500ms
3. WHEN applying filters in analytics, THE System SHALL update charts within 1 second
4. THE System SHALL use pagination or virtual scrolling for tables with more than 100 rows
5. THE System SHALL cache frequently accessed data (spending terms, aircraft list) on the client
6. WHEN generating PDF exports, THE System SHALL complete within 15 seconds for standard reports

### Requirement 13: Security and Access Control

**User Story:** As a system administrator, I want to control who can view and edit budget data, so that financial information is protected.

#### Acceptance Criteria

1. THE System SHALL require authentication for all budget module access
2. THE System SHALL support role-based permissions: Viewer (read-only), Editor (create/edit), Admin (delete/manage)
3. WHEN a Viewer accesses a project, THE System SHALL disable all editing controls
4. WHEN an Editor creates or modifies data, THE System SHALL record their user ID in the audit trail
5. THE System SHALL restrict project deletion to Admin role only
6. THE System SHALL display user role and permissions in the UI (optional indicator)

### Requirement 14: Validation and Error Handling

**User Story:** As a finance manager, I want the system to validate my inputs and provide clear error messages, so that I can correct mistakes quickly.

#### Acceptance Criteria

1. WHEN a user enters a non-numeric value in a currency field, THE System SHALL display an error message and prevent saving
2. WHEN a user enters a negative value, THE System SHALL display an error message (unless explicitly allowed for adjustments)
3. WHEN a user enters a date outside the project's date range, THE System SHALL display an error message
4. WHEN an API request fails, THE System SHALL display a user-friendly error message with retry option
5. THE System SHALL validate required fields (project name, template type, date range) before allowing project creation
6. THE System SHALL display validation errors inline near the affected field

### Requirement 15: Mobile and Responsive Design

**User Story:** As a finance manager, I want to view budget data on tablets and mobile devices, so that I can access information on the go.

#### Acceptance Criteria

1. WHEN viewing on a tablet (768px+), THE System SHALL display the full table view with horizontal scrolling
2. WHEN viewing on a mobile device (<768px), THE System SHALL display a card-based layout for budget rows
3. THE System SHALL maintain sticky headers on mobile devices
4. THE System SHALL support touch gestures for scrolling and navigation
5. THE System SHALL scale charts appropriately for smaller screens
6. THE System SHALL prioritize critical information (KPI cards, totals) in mobile view

## Special Requirements Guidance

### Parser and Serializer Requirements

**Excel Import Parser:**
- THE System SHALL parse Excel files matching the RSAF template format
- THE System SHALL validate column headers against expected template structure
- THE System SHALL handle merged cells and formatted currency values
- THE System SHALL support date formats: YYYY-MM, MM/YYYY, and Excel date serial numbers
- THE Pretty_Printer SHALL format budget data back into valid Excel files matching the template
- FOR ALL valid budget projects, exporting then importing then exporting SHALL produce an equivalent file (round-trip property)

**PDF Export Serializer:**
- THE System SHALL serialize analytics data into PDF format using client-side generation
- THE System SHALL preserve chart fidelity (no blurriness or pixelation)
- THE System SHALL handle multi-page content with proper page breaks
- FOR ALL analytics views, the PDF export SHALL accurately represent the on-screen display (WYSIWYG property)

## Document Format

This requirements document follows the EARS (Easy Approach to Requirements Syntax) pattern with INCOSE quality rules. All requirements use SHALL statements with clear conditions and responses. The glossary defines all technical terms used throughout the document. Each requirement includes a user story for context and detailed acceptance criteria for validation.
