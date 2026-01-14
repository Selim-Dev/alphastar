# Requirements Document

## Introduction

The Alpha Star Aviation KPIs Dashboard has a stakeholder demo scheduled for tomorrow. While the core functionality exists, several critical issues prevent a successful demo: aircraft dropdowns don't populate, charts show empty states, theme inconsistency between sidebar (dark) and content (light), and there's no user guide explaining how to use the system. This feature addresses these demo-blocking issues by fixing data wiring, enhancing the existing seed data to populate all charts, fixing theme consistency, polishing the UI for a modern look, and creating comprehensive documentation.

## Glossary

- **KPI_Dashboard**: The Alpha Star Aviation web-based system for tracking aviation operational metrics
- **Aircraft_Dropdown**: UI select component that lists available aircraft for filtering and selection
- **Demo_Seed**: Enhancement to existing seed script that populates the database with realistic sample data for demonstration purposes
- **Demo_Guide**: Documentation explaining how to navigate and use the dashboard for stakeholder presentations
- **Data_Wiring**: The connection between frontend components and backend API endpoints
- **Reference_Data**: Master data like aircraft, fleet groups, and owners that other records depend on
- **Theme_Consistency**: Ensuring sidebar and content area both respond correctly to dark/light mode toggle
- **RBAC**: Role-Based Access Control allowing Admin users to create and manage other users with appropriate permissions

## Requirements

### Requirement 1

**User Story:** As a demo presenter, I want aircraft dropdowns to populate correctly, so that I can filter data by aircraft during the demonstration.

#### Acceptance Criteria

1. WHEN a page with an aircraft filter loads THEN the KPI_Dashboard SHALL fetch aircraft data from the API and populate the dropdown with all active aircraft registrations
2. WHEN the aircraft API request fails THEN the KPI_Dashboard SHALL display an error message with a retry button instead of an empty dropdown
3. WHEN aircraft data is loading THEN the KPI_Dashboard SHALL display a loading indicator in the dropdown
4. WHEN no aircraft exist in the database THEN the KPI_Dashboard SHALL display a helpful message directing users to add aircraft or run the seed script

### Requirement 2

**User Story:** As a demo presenter, I want the existing seed script enhanced with comprehensive data, so that all dashboard charts and tables display meaningful visualizations during the demonstration.

#### Acceptance Criteria

1. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create aircraft records for all fleet groups (A340, A330, A320 family, G650ER, Hawker, Cessna) with realistic registrations and specifications matching Alpha Star fleet
2. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create 90 days of daily status records per aircraft with realistic availability variations (FMC hours between 18-24, occasional scheduled and unscheduled downtime)
3. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create 90 days of utilization counter records per aircraft with monotonically increasing values and realistic daily flight hours (2-8 hours per day)
4. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create AOG events with varied responsible parties (Internal, OEM, Customs, Finance, Other) and realistic durations to populate the responsibility attribution chart
5. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create maintenance tasks across all shifts (Morning, Evening, Night) with varied task types and costs to populate the maintenance summary charts
6. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create work orders with mixed statuses (Open, InProgress, Closed, Deferred) including some overdue items to demonstrate the overdue detection feature
7. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create discrepancies across multiple ATA chapters (21, 24, 27, 29, 32, 34, 36, 49, 52, 71, 72, 73, 74, 78, 79, 80) to populate the top defects chart
8. WHEN the enhanced seed script runs THEN the KPI_Dashboard SHALL create budget plans for fiscal year 2025 and actual spend records across multiple months that show realistic variance patterns (some under budget, some over budget)

### Requirement 3

**User Story:** As a demo presenter, I want a demo guide document, so that I can explain the dashboard features and workflows to stakeholders.

#### Acceptance Criteria

1. WHEN a user reads the demo guide THEN the Demo_Guide SHALL explain the glossary of aviation terms used in the dashboard (FMC, TTSN, AOG, ATA chapters, etc.)
2. WHEN a user reads the demo guide THEN the Demo_Guide SHALL describe each dashboard module and its purpose
3. WHEN a user reads the demo guide THEN the Demo_Guide SHALL provide a step-by-step demo script with specific pages to visit and features to highlight
4. WHEN a user reads the demo guide THEN the Demo_Guide SHALL list the expected outcomes (populated dropdowns, charts with data, export functionality)
5. WHEN a user reads the demo guide THEN the Demo_Guide SHALL include login credentials for demo users (admin, editor, viewer)

### Requirement 4

**User Story:** As a developer, I want a data health check panel, so that I can quickly verify the database has sufficient demo data.

#### Acceptance Criteria

1. WHEN a developer accesses the health check THEN the KPI_Dashboard SHALL display counts for all collections (aircraft, daily status, utilization, AOG events, maintenance tasks, work orders, discrepancies, budget plans, actual spend)
2. WHEN a developer accesses the health check THEN the KPI_Dashboard SHALL display the last successful API fetch timestamp
3. WHEN any collection has zero records THEN the KPI_Dashboard SHALL highlight that collection as needing attention
4. WHEN the health check renders THEN the KPI_Dashboard SHALL provide a button to trigger the demo seed script (Admin only)

### Requirement 5

**User Story:** As a demo presenter, I want dashboard data to refresh automatically, so that any changes made during the demo appear without manual page reloads.

#### Acceptance Criteria

1. WHEN the dashboard page is open THEN the KPI_Dashboard SHALL poll the KPI endpoints every 30 seconds for updated data
2. WHEN a user returns to the browser tab THEN the KPI_Dashboard SHALL refetch data on window focus
3. WHEN a user creates or updates a record THEN the KPI_Dashboard SHALL invalidate related queries and refetch fresh data

### Requirement 6

**User Story:** As a demo presenter, I want the theme to be consistent across sidebar and content, so that the dashboard looks professional and cohesive.

#### Acceptance Criteria

1. WHEN the user selects dark mode THEN the KPI_Dashboard SHALL apply dark theme to both the sidebar and the main content area
2. WHEN the user selects light mode THEN the KPI_Dashboard SHALL apply light theme to both the sidebar and the main content area
3. WHEN the theme changes THEN the KPI_Dashboard SHALL transition colors smoothly without jarring flashes
4. WHEN the dashboard renders THEN the KPI_Dashboard SHALL display a modern, aviation-grade aesthetic with consistent spacing, shadows, and typography

### Requirement 7

**User Story:** As an administrator, I want to manage users with role-based access control, so that I can create accounts for team members with appropriate permissions.

#### Acceptance Criteria

1. WHEN an Admin user accesses the admin page THEN the KPI_Dashboard SHALL display a list of all users with their email, name, and role
2. WHEN an Admin user creates a new user THEN the KPI_Dashboard SHALL allow setting email, name, password, and role (Admin, Editor, Viewer)
3. WHEN a Viewer user attempts to create or modify data THEN the KPI_Dashboard SHALL reject the action and display an authorization error
4. WHEN an Editor user creates or modifies operational data THEN the KPI_Dashboard SHALL permit the action
5. WHEN the admin page loads THEN the KPI_Dashboard SHALL display role descriptions explaining what each role can do

### Requirement 8

**User Story:** As a demo presenter, I want all charts to display meaningful data, so that the dashboard demonstrates its full analytical capabilities.

#### Acceptance Criteria

1. WHEN the executive dashboard loads THEN the KPI_Dashboard SHALL display KPI cards with non-zero values for fleet availability, total flight hours, total cycles, and active AOG count
2. WHEN the availability page loads THEN the KPI_Dashboard SHALL display availability trend charts with data points across the date range
3. WHEN the budget page loads THEN the KPI_Dashboard SHALL display budget vs actual charts with variance visualization
4. WHEN the AOG events page loads THEN the KPI_Dashboard SHALL display downtime by responsibility pie/bar chart
5. WHEN the discrepancies page loads THEN the KPI_Dashboard SHALL display top ATA chapters bar chart
6. WHEN the maintenance page loads THEN the KPI_Dashboard SHALL display maintenance summary with task counts and costs

