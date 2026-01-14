# Daily Status Management - Requirements Document

## Introduction

The Alpha Star Aviation KPI Dashboard currently calculates fleet availability from daily status data stored in the database, but lacks a user interface for viewing, editing, or inputting daily status records. This creates a critical gap where users cannot manage the primary data source that drives the fleet availability KPI (currently showing 98.2%).

## Glossary

- **Daily Status**: Daily record of aircraft availability hours including possessed hours, fully mission capable hours, and downtime categories
- **POS Hours**: Possessed Hours - total hours aircraft was under operational control (typically 24)
- **FMC Hours**: Fully Mission Capable Hours - hours aircraft was available for flight operations
- **NMCM-S Hours**: Not Mission Capable Maintenance - Scheduled maintenance downtime hours
- **NMCM-U Hours**: Not Mission Capable Maintenance - Unscheduled maintenance downtime hours
- **NMCS Hours**: Not Mission Capable Supply - downtime due to parts/supply issues (optional)
- **Fleet Availability**: Calculated percentage of time aircraft are mission capable across the fleet

## Requirements

### Requirement 1

**User Story:** As a maintenance coordinator, I want to view daily status records for all aircraft, so that I can see the current availability status and historical trends.

#### Acceptance Criteria

1. WHEN a user navigates to the daily status page THEN the system SHALL display a table of daily status records with aircraft registration, date, POS hours, FMC hours, and downtime categories
2. WHEN viewing daily status records THEN the system SHALL allow filtering by date range, aircraft registration, and fleet group
3. WHEN displaying daily status records THEN the system SHALL show calculated availability percentage for each record
4. WHEN viewing the daily status table THEN the system SHALL support sorting by any column
5. WHEN displaying daily status data THEN the system SHALL highlight records with availability below 85% in amber and below 70% in red

### Requirement 2

**User Story:** As a maintenance coordinator, I want to create new daily status records, so that I can log aircraft availability for each day.

#### Acceptance Criteria

1. WHEN a user clicks add daily status THEN the system SHALL display a form with aircraft selection, date picker, and hour input fields
2. WHEN creating a daily status record THEN the system SHALL validate that POS hours are between 0 and 24
3. WHEN entering downtime hours THEN the system SHALL automatically calculate FMC hours as POS hours minus all downtime categories
4. WHEN submitting a daily status record THEN the system SHALL prevent duplicate records for the same aircraft and date
5. WHEN a daily status record is created THEN the system SHALL refresh the fleet availability KPI on the dashboard

### Requirement 3

**User Story:** As a maintenance coordinator, I want to edit existing daily status records, so that I can correct errors or update availability information.

#### Acceptance Criteria

1. WHEN a user clicks edit on a daily status record THEN the system SHALL display a pre-populated form with current values
2. WHEN editing daily status hours THEN the system SHALL validate that the sum of downtime hours does not exceed POS hours
3. WHEN updating a daily status record THEN the system SHALL maintain audit trail information showing who made the change and when
4. WHEN a daily status record is updated THEN the system SHALL recalculate fleet availability metrics immediately
5. WHEN saving changes to daily status THEN the system SHALL display a success confirmation message

### Requirement 4

**User Story:** As a maintenance coordinator, I want to bulk import daily status records from Excel using the existing import system, so that I can efficiently load historical or batch data while maintaining consistency with other import flows.

#### Acceptance Criteria

1. WHEN a user accesses the Data Import page THEN the system SHALL include "Daily Status" as a new import type alongside existing options (Daily Utilization Counters, Maintenance Tasks, AOG Events, Budget Plan, Aircraft Master)
2. WHEN a user selects daily status import type THEN the system SHALL provide a downloadable Excel template with columns: Aircraft Registration, Date, POS Hours, NMCM-S Hours, NMCM-U Hours, NMCS Hours (optional), Notes (optional)
3. WHEN uploading a daily status Excel file THEN the system SHALL validate all required fields, data formats, and business rules using the existing validation framework
4. WHEN processing daily status import THEN the system SHALL prevent duplicate records for the same aircraft and date combination, reporting skipped duplicates
5. WHEN importing daily status data THEN the system SHALL validate that aircraft registrations exist in the system and reject invalid references

### Requirement 5

**User Story:** As a fleet manager, I want to see daily status summary statistics, so that I can understand fleet availability patterns and trends.

#### Acceptance Criteria

1. WHEN viewing the daily status page THEN the system SHALL display summary cards showing average fleet availability, total aircraft tracked, and records with downtime
2. WHEN displaying availability trends THEN the system SHALL show a chart of fleet availability percentage over the selected time period
3. WHEN analyzing downtime patterns THEN the system SHALL show breakdown of scheduled vs unscheduled maintenance hours
4. WHEN viewing fleet status THEN the system SHALL display count of aircraft currently below target availability thresholds
5. WHEN displaying summary statistics THEN the system SHALL update automatically when filters are applied

### Requirement 6

**User Story:** As a system administrator, I want to manage daily status data permissions, so that I can control who can view and modify availability records.

#### Acceptance Criteria

1. WHEN a viewer role user accesses daily status THEN the system SHALL allow read-only access to view records and statistics
2. WHEN an editor role user accesses daily status THEN the system SHALL allow creating and editing daily status records
3. WHEN an admin role user accesses daily status THEN the system SHALL allow all operations including bulk import and data deletion
4. WHEN unauthorized access is attempted THEN the system SHALL redirect to login page with appropriate error message
5. WHEN role permissions are enforced THEN the system SHALL hide action buttons that the user cannot perform

### Requirement 7

**User Story:** As a maintenance coordinator, I want to export daily status data to Excel, so that I can perform external analysis or share reports.

#### Acceptance Criteria

1. WHEN a user clicks export daily status THEN the system SHALL generate an Excel file with all visible records based on current filters
2. WHEN exporting daily status data THEN the system SHALL include calculated availability percentages and summary statistics
3. WHEN generating the export file THEN the system SHALL format dates and numbers appropriately for Excel
4. WHEN export is requested THEN the system SHALL include column headers and maintain data relationships
5. WHEN export completes THEN the system SHALL automatically download the file with a descriptive filename including date range

### Requirement 8

**User Story:** As a system architect, I want daily status management to integrate seamlessly with existing data flows, so that the system maintains data consistency and prevents conflicts.

#### Acceptance Criteria

1. WHEN daily status records are created or updated THEN the system SHALL automatically invalidate and refresh dashboard KPI queries to reflect updated availability calculations
2. WHEN importing daily status data THEN the system SHALL use the existing import infrastructure (ImportService, ExcelParserService, ImportLog) to maintain consistency with other import types
3. WHEN daily status data affects fleet availability THEN the system SHALL ensure calculations remain consistent with existing availability logic in DailyStatusService
4. WHEN daily status records reference aircraft THEN the system SHALL validate aircraft existence using the same validation patterns as utilization counters and maintenance tasks
5. WHEN users navigate between daily status and other pages THEN the system SHALL maintain consistent date range filters and aircraft selections across the application
6. WHEN daily status import is processed THEN the system SHALL log import history in the same format as existing imports for unified audit trails
7. WHEN FMC hours are calculated THEN the system SHALL ensure the formula (POS hours - downtime) produces values that never exceed POS hours or go below zero
8. WHEN daily status data is modified THEN the system SHALL not create conflicts with AOG event timelines or maintenance task schedules
9. WHEN exporting daily status data THEN the system SHALL use the existing export service patterns to maintain consistency with other export functionality
10. WHEN daily status records are displayed THEN the system SHALL use the same UI components (DataTable, FilterBar, KPICard) as other pages for consistent user experience

### Requirement 9

**User Story:** As a maintenance coordinator, I want a modern, intuitive daily status management interface with guided workflows, so that I can efficiently manage availability data with minimal training.

#### Acceptance Criteria

1. WHEN accessing the daily status page THEN the system SHALL display a clean, modern interface with clear visual hierarchy using the existing design system (Tailwind CSS, shadcn/ui components)
2. WHEN creating a new daily status record THEN the system SHALL provide a step-by-step guided form with real-time validation feedback and helpful tooltips explaining each field
3. WHEN entering downtime hours THEN the system SHALL provide visual indicators showing the automatic FMC hours calculation and warn if total downtime approaches or exceeds POS hours
4. WHEN viewing daily status data THEN the system SHALL use color-coded availability indicators (green for >90%, amber for 70-90%, red for <70%) with smooth animations and transitions
5. WHEN filtering or searching data THEN the system SHALL provide instant feedback with loading states, empty states, and clear result counts
6. WHEN performing bulk operations THEN the system SHALL show progress indicators, confirmation dialogs, and success/error notifications with actionable next steps
7. WHEN using the import workflow THEN the system SHALL provide clear step indicators, drag-and-drop file upload, real-time validation preview, and detailed error explanations
8. WHEN viewing summary statistics THEN the system SHALL display interactive charts and KPI cards with hover effects, tooltips, and drill-down capabilities
9. WHEN the interface loads THEN the system SHALL use skeleton loading states, smooth page transitions, and responsive design that works on desktop and tablet devices
10. WHEN errors occur THEN the system SHALL display user-friendly error messages with suggested actions and recovery options, avoiding technical jargon