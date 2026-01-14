# Requirements Document

## Introduction

The Alpha Star Aviation KPIs Dashboard requires a comprehensive in-app Help Center to address critical demo and onboarding challenges. Currently, users face empty states without guidance, lack understanding of aviation terminology, and have no structured way to learn the system. This feature creates a professional, always-accessible Help Center with five tabs: Quick Start guide, Module Guides, Glossary & Acronyms, Data Readiness & Troubleshooting, and Demo Mode. The Help Center enables successful stakeholder demos, reduces support burden, and provides self-service documentation for all user roles.

## Glossary

- **Help_Center**: The in-app documentation and guidance system accessible from the sidebar
- **Quick_Start**: A condensed onboarding flow explaining the essential steps to use the dashboard
- **Module_Guide**: Detailed documentation for each dashboard page explaining purpose, inputs, outputs, and troubleshooting
- **Glossary_Entry**: A searchable definition of an aviation term, acronym, or KPI with context and examples
- **Data_Readiness**: A diagnostic view showing what data is required for each page to display content
- **Demo_Mode**: A safe workflow for generating and resetting sample data for stakeholder presentations
- **Demo_Data**: Sample records tagged with isDemo flag that can be safely created and removed without affecting production data
- **Tooltip**: A contextual popup showing a brief definition when hovering over an acronym or term
- **Empty_State**: A UI condition where no data exists to display, requiring user guidance
- **ATA_Chapter**: Air Transport Association chapter classification system for aircraft systems (e.g., 21=Air Conditioning, 32=Landing Gear)
- **FMC_Hours**: Fully Mission Capable hours - time aircraft is available for operations
- **TTSN**: Total Time Since New - cumulative flight hours since aircraft manufacture
- **TCSN**: Total Cycles Since New - cumulative takeoff/landing cycles since manufacture
- **AOG**: Aircraft On Ground - aircraft unable to fly due to maintenance or parts issues
- **MTBF**: Mean Time Between Failures - average operating time between equipment failures
- **MTTR**: Mean Time To Repair - average time to restore equipment to operational status

## Requirements

### Requirement 1

**User Story:** As a dashboard user, I want to access a Help Center from the sidebar, so that I can find documentation and guidance without leaving the application.

#### Acceptance Criteria

1. WHEN the sidebar renders THEN the KPI_Dashboard SHALL display a Help Center navigation item with a help icon below the Administration section
2. WHEN a user clicks the Help Center sidebar item THEN the KPI_Dashboard SHALL navigate to the /help route and display the Help Center page
3. WHEN the Help Center page loads THEN the KPI_Dashboard SHALL display a tabbed interface with five tabs: Quick Start, Module Guides, Glossary, Data Readiness, and Demo Mode
4. WHEN a user selects a tab THEN the KPI_Dashboard SHALL display the corresponding content without page reload
5. WHEN the Help Center renders THEN the KPI_Dashboard SHALL apply consistent styling with the dashboard theme (dark/light mode support)

### Requirement 2

**User Story:** As a new user, I want a Quick Start guide, so that I can learn the essential workflow to use the dashboard effectively.

#### Acceptance Criteria

1. WHEN the Quick Start tab is active THEN the KPI_Dashboard SHALL display a numbered step-by-step onboarding flow with at least 6 steps
2. WHEN displaying each step THEN the KPI_Dashboard SHALL show a step number, title, description, expected outcome, and optional screenshot or icon
3. WHEN a step involves navigation THEN the KPI_Dashboard SHALL provide a clickable link to the relevant page
4. WHEN displaying the Quick Start THEN the KPI_Dashboard SHALL include callout boxes for common issues (e.g., "If aircraft list is empty → go to Data Import or run seed")
5. WHEN the Quick Start renders THEN the KPI_Dashboard SHALL cover: Login, Date Range Selection, Fleet/Aircraft Filtering, KPI Interpretation, Drill-down Navigation, and Export functionality

### Requirement 3

**User Story:** As a dashboard user, I want detailed Module Guides, so that I can understand each page's purpose, required data, and expected outputs.

#### Acceptance Criteria

1. WHEN the Module Guides tab is active THEN the KPI_Dashboard SHALL display an accordion/collapsible list with one section per dashboard module
2. WHEN a module section expands THEN the KPI_Dashboard SHALL display: Purpose, Required Data (collections/endpoints), Step-by-Step Usage, Expected Outputs, Common Empty-State Causes, Key KPI Definitions, and Export Notes
3. WHEN displaying module guides THEN the KPI_Dashboard SHALL include guides for: Dashboard (Executive KPIs), Fleet Availability, Maintenance Tasks, AOG & Events, Work Orders, Discrepancies, Budget & Cost, Data Import, and Admin/User Management
4. WHEN a module guide references a KPI or term THEN the KPI_Dashboard SHALL link to the corresponding Glossary entry
5. WHEN displaying required data THEN the KPI_Dashboard SHALL list the specific API endpoints and MongoDB collections that power the module

### Requirement 4

**User Story:** As a dashboard user, I want a searchable Glossary of aviation terms and acronyms, so that I can understand the specialized terminology used throughout the dashboard.

#### Acceptance Criteria

1. WHEN the Glossary tab is active THEN the KPI_Dashboard SHALL display a search input field and a categorized list of glossary entries
2. WHEN a user types in the search field THEN the KPI_Dashboard SHALL filter glossary entries in real-time to show matching terms
3. WHEN displaying a glossary entry THEN the KPI_Dashboard SHALL show: Term, Definition, Where It Appears (dashboard location), How It's Calculated (if applicable), Why It Matters (executive interpretation), and Example Value
4. WHEN the Glossary renders THEN the KPI_Dashboard SHALL include at least 25 aviation/MRO terms including: AOG, ATA Chapter, FMC, TTSN, TCSN, APU, Man-hours, Downtime, Work Order, Discrepancy, Variance, Burn Rate, Fleet Group, MTBF, MTTR, Dispatch Reliability, NMC, NMCS, POS Hours, Cycle, Flight Hour, Responsible Party, Budget Clause, Fiscal Year, and Fleet Health Score
5. WHEN the Glossary renders THEN the KPI_Dashboard SHALL organize entries by category tags (Operations, Maintenance, Finance, General)

### Requirement 5

**User Story:** As a dashboard user, I want tooltips on acronyms throughout the dashboard, so that I can quickly understand terms without navigating to the Glossary.

#### Acceptance Criteria

1. WHEN an acronym appears in a KPI card, table header, or chart label THEN the KPI_Dashboard SHALL display a tooltip on hover showing the short definition
2. WHEN a tooltip displays THEN the KPI_Dashboard SHALL include a "Learn more" link to the full Glossary entry
3. WHEN implementing tooltips THEN the KPI_Dashboard SHALL apply them to at least: FMC, AOG, TTSN, TCSN, APU, ATA, MTBF, MTTR, and NMC wherever they appear
4. WHEN a tooltip renders THEN the KPI_Dashboard SHALL use consistent styling with the dashboard theme and not obstruct other UI elements

### Requirement 6

**User Story:** As a demo presenter, I want a Data Readiness section, so that I can diagnose why pages appear empty and know exactly how to fix them.

#### Acceptance Criteria

1. WHEN the Data Readiness tab is active THEN the KPI_Dashboard SHALL display a checklist mapping each dashboard page to its required data
2. WHEN displaying a page's data requirements THEN the KPI_Dashboard SHALL show: Page Name, Required Collections, Required API Endpoints, Current Record Count, Status Indicator (OK/Warning/Empty), and Fix Instructions
3. WHEN a collection has zero records THEN the KPI_Dashboard SHALL display a warning indicator and specific instructions to populate it (UI form, Import template, or Seed demo data)
4. WHEN displaying fix instructions THEN the KPI_Dashboard SHALL provide direct links to the relevant page (e.g., link to Import page, link to Admin page)
5. WHEN the Data Readiness tab loads THEN the KPI_Dashboard SHALL fetch current collection counts from the health check endpoint

### Requirement 7

**User Story:** As an administrator, I want a Demo Mode with seed and reset functionality, so that I can quickly populate the dashboard with realistic data for stakeholder presentations.

#### Acceptance Criteria

1. WHEN the Demo Mode tab is active AND the user has Admin role THEN the KPI_Dashboard SHALL display a "Generate Demo Data" button
2. WHEN an Admin clicks "Generate Demo Data" THEN the KPI_Dashboard SHALL call the backend seed endpoint and create tagged demo records across all collections
3. WHEN demo data is generated THEN the KPI_Dashboard SHALL create records with isDemo: true flag to distinguish from production data
4. WHEN demo data generation completes THEN the KPI_Dashboard SHALL invalidate all queries and display a success message with record counts
5. WHEN the Demo Mode tab is active AND the user has Admin role THEN the KPI_Dashboard SHALL display a "Reset Demo Data" button
6. WHEN an Admin clicks "Reset Demo Data" THEN the KPI_Dashboard SHALL delete only records with isDemo: true flag and display a confirmation dialog before proceeding
7. WHEN a non-Admin user views the Demo Mode tab THEN the KPI_Dashboard SHALL display a message indicating Admin access is required for seed/reset operations

### Requirement 8

**User Story:** As a demo presenter, I want a scripted Demo Walkthrough, so that I can follow a structured presentation flow during stakeholder meetings.

#### Acceptance Criteria

1. WHEN the Demo Mode tab is active THEN the KPI_Dashboard SHALL display a "Demo Walkthrough Script" section below the seed/reset buttons
2. WHEN displaying the walkthrough script THEN the KPI_Dashboard SHALL provide numbered steps with: Page to Visit, Features to Highlight, Talking Points, and Expected Visual Output
3. WHEN displaying walkthrough steps THEN the KPI_Dashboard SHALL include clickable links to navigate directly to each page
4. WHEN the walkthrough script renders THEN the KPI_Dashboard SHALL cover at least: Executive Dashboard KPIs, Fleet Health Score, Alerts Panel, Fleet Availability with filters, AOG Analytics by responsibility, Budget Variance charts, and Export functionality
5. WHEN displaying a walkthrough step THEN the KPI_Dashboard SHALL indicate estimated time per section (e.g., "~2 minutes")

### Requirement 9

**User Story:** As a developer, I want the Help Center content to be maintainable, so that documentation can be updated without modifying multiple components.

#### Acceptance Criteria

1. WHEN implementing Help Center content THEN the KPI_Dashboard SHALL store documentation in a structured TypeScript content file (e.g., helpContent.ts) rather than inline JSX
2. WHEN the content file is structured THEN the KPI_Dashboard SHALL use typed interfaces for QuickStartStep, ModuleGuide, GlossaryEntry, DataReadinessItem, and WalkthroughStep
3. WHEN adding new glossary entries or module guides THEN the KPI_Dashboard SHALL require only editing the content file without touching component code
4. WHEN the Help Center renders THEN the KPI_Dashboard SHALL dynamically generate UI from the content data structures

### Requirement 10

**User Story:** As a dashboard user, I want the Help Center to have a modern, professional design, so that it matches the premium quality of the dashboard.

#### Acceptance Criteria

1. WHEN the Help Center renders THEN the KPI_Dashboard SHALL use consistent card styling, spacing, and typography matching the dashboard design system
2. WHEN displaying documentation THEN the KPI_Dashboard SHALL use clear visual hierarchy with headings, subheadings, and body text
3. WHEN displaying callouts or warnings THEN the KPI_Dashboard SHALL use color-coded boxes (info=blue, warning=amber, success=green, error=red)
4. WHEN the Help Center renders THEN the KPI_Dashboard SHALL support both dark and light themes with proper contrast and readability
5. WHEN animations are used THEN the KPI_Dashboard SHALL apply smooth, professional transitions for tab switching and accordion expansion

### Requirement 11

**User Story:** As a backend developer, I want API endpoints for demo data management, so that the frontend can trigger seed and reset operations securely.

#### Acceptance Criteria

1. WHEN implementing demo endpoints THEN the Backend SHALL expose POST /api/demo/seed endpoint protected by Admin role
2. WHEN implementing demo endpoints THEN the Backend SHALL expose POST /api/demo/reset endpoint protected by Admin role
3. WHEN the seed endpoint is called THEN the Backend SHALL create demo records with isDemo: true across all collections (aircraft, dailyStatus, dailyCounters, aogEvents, maintenanceTasks, workOrders, discrepancies, budgetPlans, actualSpend)
4. WHEN the reset endpoint is called THEN the Backend SHALL delete only records where isDemo: true and return the count of deleted records
5. WHEN demo operations complete THEN the Backend SHALL return a response with success status, message, and affected record counts per collection

### Requirement 12

**User Story:** As a database administrator, I want demo data to be clearly tagged, so that it can be safely managed without affecting production records.

#### Acceptance Criteria

1. WHEN creating demo records THEN the Backend SHALL set isDemo: true on each record
2. WHEN querying for demo reset THEN the Backend SHALL use { isDemo: true } filter to identify deletable records
3. WHEN the isDemo field is added THEN the Backend SHALL add it as an optional boolean field to all relevant schemas with default value of undefined (not set for production data)
4. WHEN existing production data exists THEN the Backend SHALL not modify or tag existing records during seed operations

