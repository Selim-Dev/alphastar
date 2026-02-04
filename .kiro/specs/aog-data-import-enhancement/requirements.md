# Requirements Document: AOG Data Import & Enhancement

## Introduction

This specification addresses the need to import and effectively utilize the client's historical AOG/OOS (Aircraft On Ground / Out of Service) data from 2024-2026. The client has provided comprehensive historical data in Excel format that needs to be integrated into the system. Since the system is currently empty, we have full flexibility to design the optimal data structure and user experience based on the actual data patterns observed.

## Glossary

- **AOG**: Aircraft On Ground - Critical grounding event requiring immediate attention
- **OOS**: Out of Service - Aircraft unavailable for operations
- **S-MX**: Scheduled Maintenance - Planned maintenance activities
- **U-MX**: Unscheduled Maintenance - Reactive maintenance due to defects
- **MRO**: Maintenance Repair Overhaul - Extended facility-based maintenance
- **ICAO Code**: International Civil Aviation Organization airport identifier (e.g., OERK, LFSB)
- **Active Event**: AOG event where Finish Date is empty (still ongoing)
- **Resolved Event**: AOG event where Finish Date is populated (completed)
- **Event Status**: Simple status tracking (Active, Resolved) - not the complex 18-state workflow

## Requirements

### Requirement 1: Excel Template for Historical AOG Data

**User Story:** As a maintenance manager, I want a simplified Excel template for importing historical AOG/OOS data, so that I can easily prepare and upload past events.

#### Acceptance Criteria

1. WHEN downloading the AOG Events template THEN the system SHALL provide an Excel file with two sheets (Data and Instructions)
2. WHEN viewing the Data sheet THEN the system SHALL show columns (Aircraft, Defect Description, Location, Category, Start Date, Start Time, Finish Date, Finish Time)
3. WHEN viewing the Instructions sheet THEN the system SHALL display column descriptions, data types, required fields, and allowed values
4. WHEN the Aircraft column is used THEN the system SHALL accept aircraft registration (e.g., HZ-A42) or aircraft name for easier data entry
5. WHEN the Category column is used THEN the system SHALL provide dropdown values (AOG, S-MX, U-MX, MRO, CLEANING) in the template
6. WHEN the Location column is used THEN the system SHALL accept ICAO codes (e.g., OERK, LFSB) and mark it as optional
7. WHEN the Start Date/Time columns are used THEN the system SHALL accept format YYYY-MM-DD and HH:MM
8. WHEN the Finish Date/Time columns are empty THEN the system SHALL treat the event as active (still ongoing)

### Requirement 2: Simplified Import Process

**User Story:** As a non-technical administrator, I want a simple import process with clear validation, so that I can successfully import historical data without technical expertise.

#### Acceptance Criteria

1. WHEN uploading an Excel file THEN the system SHALL validate the file format before processing
2. WHEN validation finds errors THEN the system SHALL display a preview showing which rows have errors and why
3. WHEN validation succeeds THEN the system SHALL show a preview of valid rows with a count summary
4. WHEN viewing the preview THEN the system SHALL display (Total Rows, Valid Rows, Invalid Rows, Active Events, Resolved Events)
5. WHEN confirming import THEN the system SHALL process only valid rows and skip invalid rows
6. WHEN import completes THEN the system SHALL display a success message with counts (imported, skipped, errors)
7. WHEN import has errors THEN the system SHALL provide a downloadable error report with row numbers and issues
8. WHEN the Aircraft column contains an aircraft name THEN the system SHALL attempt to match it to a registration (case-insensitive)

### Requirement 3: AOG Event Detail Page Clarity

**User Story:** As a maintenance manager, I want clear visual distinction between active and resolved events on the detail page, so that I can quickly understand the event status.

#### Acceptance Criteria

1. WHEN viewing an active event (clearedAt=null) THEN the system SHALL display a prominent "ACTIVE" badge in red at the top of the page
2. WHEN viewing a resolved event (clearedAt populated) THEN the system SHALL display a "RESOLVED" badge in green at the top of the page
3. WHEN viewing the milestone timeline THEN the system SHALL clearly show which milestones are set and which are missing
4. WHEN viewing an active event THEN the system SHALL show "Up & Running At" as "Not yet cleared" or "Still active"
5. WHEN editing milestones THEN the system SHALL validate that "Up & Running At" equals "Cleared At" for consistency
6. WHEN viewing the event timeline THEN the system SHALL display a visual indicator showing current status (active vs resolved)
7. WHEN an event is cleared THEN the system SHALL automatically set "Up & Running At" to match "Cleared At" if not already set
8. WHEN viewing a legacy event THEN the system SHALL show a "Legacy Event - Limited Data" badge to indicate imported historical data

### Requirement 4: Default Values for Minimal Data

**User Story:** As a data administrator, I want the system to apply sensible defaults for missing fields, so that historical data with minimal information can still be imported.

#### Acceptance Criteria

1. WHEN the Defect Description is missing THEN the system SHALL use "Historical AOG Event" as default
2. WHEN the Location is missing THEN the system SHALL leave it as null (optional field)
3. WHEN Responsible Party is missing THEN the system SHALL default to "Other"
4. WHEN Action Taken is missing THEN the system SHALL use "See defect description" as default
5. WHEN Manpower Count is missing THEN the system SHALL default to 1
6. WHEN Man Hours is missing THEN the system SHALL calculate from duration (clearedAt - detectedAt) or default to 0 for active events
7. WHEN importing events THEN the system SHALL set isLegacy=true to indicate limited analytics
8. WHEN importing events THEN the system SHALL set reportedAt=detectedAt and upAndRunningAt=clearedAt for consistency

### Requirement 5: Simplified Event Status Model

**User Story:** As a maintenance manager, I want a simple status model that reflects how we actually track events, so that the system matches our workflow.

#### Acceptance Criteria

1. WHEN an event has no Finish Date THEN the system SHALL mark it as status="Active"
2. WHEN an event has a Finish Date THEN the system SHALL mark it as status="Resolved"
3. WHEN viewing the AOG list THEN the system SHALL display status as a badge (Active=red, Resolved=green)
4. WHEN filtering events THEN the system SHALL provide status filter options (All, Active Only, Resolved Only)
5. WHEN an event transitions from Active to Resolved THEN the system SHALL record the transition timestamp
6. WHEN viewing event history THEN the system SHALL show when the event was created, when it was resolved, and total duration
7. THE system SHALL NOT use the complex 18-state workflow for imported historical data
8. THE system SHALL focus on simple, actionable status (Active vs Resolved) that matches the client's data format

### Requirement 6: Event Duration Tracking

**User Story:** As a fleet analyst, I want to see how long each event lasted, so that I can identify patterns and problem areas.

#### Acceptance Criteria

1. WHEN an event is resolved THEN the system SHALL calculate duration as (Finish Date/Time - Start Date/Time)
2. WHEN an event is active THEN the system SHALL calculate duration as (Current Time - Start Date/Time)
3. WHEN displaying duration THEN the system SHALL show it in human-readable format (e.g., "5 days 3 hours", "280 hours", "2 months")
4. WHEN viewing the AOG list THEN the system SHALL display duration for each event
5. WHEN viewing analytics THEN the system SHALL group events by duration ranges (< 24hrs, 1-7 days, 1-4 weeks, > 1 month)
6. WHEN an active event exceeds 7 days THEN the system SHALL flag it as "Extended Downtime" with a warning indicator
7. WHEN an active event exceeds 30 days THEN the system SHALL flag it as "Long-term MRO" (expected for major overhauls)

### Requirement 7: Enhanced List Page UI

**User Story:** As a maintenance manager, I want the AOG list page to visually distinguish between event types and show key metrics at a glance, so that I can quickly assess the fleet status.

#### Acceptance Criteria

1. WHEN viewing the AOG list page THEN the system SHALL display category badges with color coding (AOG=red, U-MX=amber, S-MX=blue, MRO=purple, Cleaning=green)
2. WHEN viewing the AOG list page THEN the system SHALL show location with ICAO code
3. WHEN viewing the AOG list page THEN the system SHALL display duration in human-readable format (e.g., "5 days", "280 hrs")
4. WHEN viewing the AOG list page THEN the system SHALL show quick stats cards (Active AOG count, This Month count, Avg Duration, Total Hours)
5. WHEN an event is active THEN the system SHALL display a pulsing red indicator and "ACTIVE" badge
6. WHEN viewing the AOG list page THEN the system SHALL sort active events to the top by default

### Requirement 8: Enhanced Analytics Page

**User Story:** As a fleet manager, I want to see analytics broken down by category, location, and aircraft, so that I can identify patterns and problem areas.

#### Acceptance Criteria

1. WHEN viewing the analytics page THEN the system SHALL display a category breakdown chart showing event count and percentage by category
2. WHEN viewing the analytics page THEN the system SHALL display a location heatmap showing top 5 locations by event count
3. WHEN viewing the analytics page THEN the system SHALL display a duration distribution chart (< 24hrs, 1-7 days, 1-4 weeks, > 1 month)
4. WHEN viewing the analytics page THEN the system SHALL display an aircraft reliability ranking (most reliable and needs attention)
5. WHEN viewing the analytics page THEN the system SHALL display a monthly trend chart showing event count over time
6. WHEN filtering by date range THEN the system SHALL update all analytics charts accordingly
7. WHEN filtering by fleet group THEN the system SHALL update all analytics charts accordingly

### Requirement 9: Dashboard Integration

**User Story:** As an executive, I want to see AOG status prominently on the main dashboard, so that I can quickly assess fleet availability.

#### Acceptance Criteria

1. WHEN viewing the main dashboard THEN the system SHALL display an "AOG Status" widget showing active event count
2. WHEN viewing the main dashboard THEN the system SHALL list up to 3 active AOG events with aircraft, issue, and duration
3. WHEN viewing the main dashboard THEN the system SHALL display a "Fleet Availability Impact" widget showing current availability percentage
4. WHEN viewing the main dashboard THEN the system SHALL show which aircraft are unavailable and why
5. WHEN viewing the main dashboard THEN the system SHALL display the impact on target availability (e.g., "-4.5% below target")

### Requirement 10: Event Detail Page Enhancements

**User Story:** As a maintenance technician, I want to see a complete timeline and related events for each AOG event, so that I can understand the full context.

#### Acceptance Criteria

1. WHEN viewing an event detail page THEN the system SHALL display a visual timeline from detectedAt to clearedAt
2. WHEN viewing a legacy event detail page THEN the system SHALL show an upgrade prompt to add milestone data
3. WHEN viewing an event detail page THEN the system SHALL display a "Related Events" section showing other events for the same aircraft
4. WHEN viewing an event detail page THEN the system SHALL calculate and display business impact metrics (lost flight hours, availability impact)
5. WHEN viewing an event detail page THEN the system SHALL show location information with ICAO code

### Requirement 11: Data Quality and Validation

**User Story:** As a data administrator, I want to ensure imported data meets quality standards, so that analytics are reliable.

#### Acceptance Criteria

1. WHEN importing data THEN the system SHALL validate that Start Date is not in the future
2. WHEN importing data THEN the system SHALL validate that Finish Date >= Start Date (if provided)
3. WHEN importing data THEN the system SHALL validate that aircraft registration exists in the system
4. WHEN importing data THEN the system SHALL validate that Location is a valid ICAO code (if provided)
5. WHEN validation fails THEN the system SHALL provide a detailed error report with row numbers and issues
6. WHEN importing data THEN the system SHALL allow the user to download a validation report before committing the import

### Requirement 12: Dashboard Integration for Maximum Impact

**User Story:** As an executive, I want to see AOG status prominently on the main dashboard with clear metrics, so that I can quickly assess fleet health and take action.

#### Acceptance Criteria

1. WHEN viewing the main dashboard THEN the system SHALL display an "Active AOG Events" card showing count with red indicator
2. WHEN viewing the main dashboard THEN the system SHALL display "Total AOG Events This Month" card showing count and trend
3. WHEN viewing the main dashboard THEN the system SHALL display "Average AOG Duration" card showing hours/days
4. WHEN viewing the main dashboard THEN the system SHALL display "Total Downtime Hours" card showing cumulative hours for the period
5. WHEN viewing the main dashboard THEN the system SHALL list up to 5 active AOG events with (Aircraft, Issue, Location, Duration)
6. WHEN clicking on an active event THEN the system SHALL navigate to the event detail page
7. WHEN viewing the main dashboard THEN the system SHALL display a "Fleet Availability Impact" section showing which aircraft are unavailable
8. WHEN viewing the main dashboard THEN the system SHALL display a mini chart showing AOG events trend over last 6 months

### Requirement 13: Export and Reporting

**User Story:** As a compliance officer, I want to export AOG data in various formats, so that I can meet regulatory reporting requirements.

#### Acceptance Criteria

1. WHEN exporting AOG data THEN the system SHALL support Excel format with all event fields
2. WHEN exporting AOG data THEN the system SHALL support PDF format with executive summary
3. WHEN exporting AOG data THEN the system SHALL include filters applied (date range, aircraft, category)
4. WHEN exporting AOG data THEN the system SHALL include summary statistics (total events, total downtime, avg duration)
5. WHEN exporting AOG data THEN the system SHALL include charts and visualizations in PDF format

### Requirement 14: Import Template and Guidance

**User Story:** As a data entry clerk, I want clear guidance on the expected Excel format, so that I can prepare data correctly for import.

#### Acceptance Criteria

1. WHEN accessing the import page THEN the system SHALL provide a downloadable Excel template with correct column headers
2. WHEN accessing the import page THEN the system SHALL display format requirements (date format, time format, category values)
3. WHEN accessing the import page THEN the system SHALL provide example rows showing correct data format
4. WHEN accessing the import page THEN the system SHALL display a list of valid aircraft registrations
5. WHEN accessing the import page THEN the system SHALL display a list of valid ICAO location codes

### Requirement 15: Bulk Operations

**User Story:** As a maintenance manager, I want to perform bulk operations on imported events, so that I can efficiently manage large datasets.

#### Acceptance Criteria

1. WHEN selecting multiple events THEN the system SHALL allow bulk update of category
2. WHEN selecting multiple events THEN the system SHALL allow bulk update of responsible party
3. WHEN selecting multiple events THEN the system SHALL allow bulk deletion (with confirmation)
4. WHEN selecting multiple events THEN the system SHALL allow bulk export
5. WHEN performing bulk operations THEN the system SHALL provide a progress indicator and summary of results

### Requirement 16: Data Utilization and Insights

**User Story:** As a fleet manager, I want the system to automatically generate insights from the imported data, so that I can make data-driven decisions.

#### Acceptance Criteria

1. WHEN viewing the analytics page THEN the system SHALL display "Top 3 Problem Aircraft" based on event count and total downtime
2. WHEN viewing the analytics page THEN the system SHALL display "Most Common Issues" based on defect description patterns
3. WHEN viewing the analytics page THEN the system SHALL display "Busiest Locations" showing where most events occur
4. WHEN viewing the analytics page THEN the system SHALL display "Category Distribution" showing breakdown of AOG vs S-MX vs U-MX vs MRO
5. WHEN viewing the analytics page THEN the system SHALL display "Monthly Trend" showing event count over time with trend line
6. WHEN viewing the analytics page THEN the system SHALL display "Average Resolution Time" by category
7. WHEN viewing the analytics page THEN the system SHALL highlight any aircraft with > 10 events in the selected period
8. WHEN viewing the analytics page THEN the system SHALL show "Fleet Health Score" based on event frequency and duration

### Requirement 17: Event List Optimization

**User Story:** As a maintenance coordinator, I want the event list to be highly functional and informative, so that I can quickly find and act on events.

#### Acceptance Criteria

1. WHEN viewing the event list THEN the system SHALL display columns (Status Badge, Aircraft, Category Badge, Defect Summary, Location, Start Date, Duration, Actions)
2. WHEN viewing the event list THEN the system SHALL sort active events to the top by default
3. WHEN viewing the event list THEN the system SHALL allow sorting by any column (Aircraft, Category, Start Date, Duration)
4. WHEN viewing the event list THEN the system SHALL allow filtering by (Status, Category, Aircraft, Location, Date Range)
5. WHEN viewing the event list THEN the system SHALL display a search box for defect description
6. WHEN viewing the event list THEN the system SHALL show pagination with configurable page size (10, 25, 50, 100)
7. WHEN viewing the event list THEN the system SHALL display quick stats above the table (Total Events, Active, Resolved, Avg Duration)
8. WHEN clicking on an event row THEN the system SHALL navigate to the event detail page
9. WHEN hovering over a category badge THEN the system SHALL show a tooltip with category description
10. WHEN viewing the event list THEN the system SHALL highlight rows for active events with a subtle background color

