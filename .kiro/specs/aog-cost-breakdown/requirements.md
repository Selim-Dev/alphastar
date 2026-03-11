# Requirements Document

## Introduction

This feature adds a per-event cost breakdown system to AOG events, allowing users to record granular cost entries by department (similar to the existing department handoff multi-step form). Each cost entry captures the department, internal cost, external cost, and an optional note. The feature also extends the AOG Analytics page with cost breakdown visualizations that respect existing filters (aircraft, fleet group, category, date range), and ensures the PDF export captures the full analytics page including the new cost sections.

## Glossary

- **AOG_Event**: An Aircraft On Ground event tracked in the `aogevents` collection, representing a grounding incident.
- **Cost_Entry**: A single cost record attached to an AOG event, capturing department, internal cost, external cost, and optional note.
- **Department**: The organizational unit responsible for a cost. Values: QC, Engineering, Project Management, Procurement, Technical, Others.
- **Internal_Cost**: Cost incurred by the company's own team (labor, man-hours) in USD.
- **External_Cost**: Cost incurred through external contractors or vendors in USD.
- **AOG_Analytics_Page**: The analytics dashboard at `/aog/analytics` displaying aggregated AOG metrics and charts.
- **Cost_Breakdown_Dialog**: A multi-step form dialog for creating or editing a cost entry on an AOG event.
- **Filter_Bar**: The existing filter controls on the AOG Analytics page (aircraft, fleet group, category, date range).
- **PDF_Export**: The functionality that exports the AOG Analytics page content to a downloadable PDF file.

## Requirements

### Requirement 1: Cost Entry Data Model

**User Story:** As a maintenance manager, I want to record cost breakdowns per department on each AOG event, so that I can track where money is being spent during grounding incidents.

#### Acceptance Criteria

1. THE Cost_Entry SHALL store the following fields: department (required), internalCost (required, number >= 0), externalCost (required, number >= 0), note (optional string), and a reference to the parent AOG_Event.
2. WHEN a Cost_Entry is created, THE System SHALL validate that department is one of: QC, Engineering, Project Management, Procurement, Technical, Others.
3. WHEN a Cost_Entry is created, THE System SHALL validate that internalCost and externalCost are numeric values greater than or equal to zero.
4. THE Cost_Entry SHALL store an updatedBy reference to the user who created or last modified the entry.
5. THE Cost_Entry SHALL store createdAt and updatedAt timestamps automatically.

### Requirement 2: Cost Entry CRUD API

**User Story:** As a developer, I want REST endpoints to create, read, update, and delete cost entries on AOG events, so that the frontend can manage cost breakdowns.

#### Acceptance Criteria

1. WHEN a POST request is sent to `/api/aog-events/:parentId/cost-entries` with valid data, THE System SHALL create a new Cost_Entry and return the created record.
2. WHEN a GET request is sent to `/api/aog-events/:parentId/cost-entries`, THE System SHALL return all Cost_Entry records for the specified AOG_Event.
3. WHEN a PUT request is sent to `/api/aog-events/:parentId/cost-entries/:entryId` with valid data, THE System SHALL update the specified Cost_Entry and return the updated record.
4. WHEN a DELETE request is sent to `/api/aog-events/:parentId/cost-entries/:entryId`, THE System SHALL remove the specified Cost_Entry.
5. IF the parent AOG_Event does not exist, THEN THE System SHALL return a 404 error.
6. IF the Cost_Entry does not exist, THEN THE System SHALL return a 404 error.
7. THE System SHALL require authentication for all cost entry endpoints.
8. THE System SHALL restrict create, update, and delete operations to users with Admin or Editor roles.

### Requirement 3: Cost Breakdown Form UI

**User Story:** As a maintenance manager, I want a multi-step form to add cost breakdowns to an AOG event, so that I can quickly record costs by department.

#### Acceptance Criteria

1. WHEN the user clicks the "Add Cost Breakdown" button on the AOG Detail page, THE Cost_Breakdown_Dialog SHALL open with a multi-step form.
2. THE Cost_Breakdown_Dialog SHALL present step 1 as a department selection with options: QC, Engineering, Project Management, Procurement, Technical, Others.
3. WHEN the user selects a department and proceeds, THE Cost_Breakdown_Dialog SHALL present step 2 with fields for Internal Cost (USD), External Cost (USD), and Note (optional).
4. WHEN the user submits the form with valid data, THE System SHALL create the Cost_Entry and close the dialog.
5. WHEN a Cost_Entry is created successfully, THE System SHALL display a success toast notification.
6. IF the form submission fails, THEN THE System SHALL display an error toast notification.
7. THE "Add Cost Breakdown" button SHALL be placed beside the "Add Sub-Event" button on the AOG Detail page.
8. WHEN the user clicks an existing Cost_Entry, THE Cost_Breakdown_Dialog SHALL open in edit mode with pre-filled values.
9. WHEN the user saves edits to a Cost_Entry, THE System SHALL update the record and display a success toast notification.
10. THE Cost_Breakdown_Dialog SHALL validate that Internal Cost and External Cost are non-negative numbers before submission.

### Requirement 4: Cost Entries Display on AOG Detail Page

**User Story:** As a maintenance manager, I want to see all cost breakdowns listed on the AOG event detail page, so that I can review the cost history for each event.

#### Acceptance Criteria

1. THE AOG_Detail_Page SHALL display a "Cost Breakdown" section showing all Cost_Entry records for the event.
2. WHEN Cost_Entry records exist, THE System SHALL display each entry as a card showing department, internal cost, external cost, total cost, and note.
3. WHEN no Cost_Entry records exist, THE System SHALL display an empty state message indicating no cost breakdowns have been added.
4. THE Cost_Breakdown section SHALL display a summary row showing total internal cost, total external cost, and grand total across all entries.
5. WHEN the user has Admin or Editor role, THE System SHALL display edit and delete actions on each Cost_Entry card.
6. WHEN the user deletes a Cost_Entry, THE System SHALL show a confirmation prompt before deletion.

### Requirement 5: Cost Breakdown Analytics

**User Story:** As an executive, I want to see aggregated cost breakdown analytics on the AOG Analytics page, so that I can understand cost distribution across departments and identify spending patterns.

#### Acceptance Criteria

1. THE AOG_Analytics_Page SHALL include a "Cost Breakdown" section displaying aggregated cost data.
2. THE Cost_Breakdown analytics section SHALL display total internal cost and total external cost as summary cards.
3. THE Cost_Breakdown analytics section SHALL include a bar chart showing internal cost vs external cost per department.
4. THE Cost_Breakdown analytics section SHALL include a pie chart showing cost distribution by department (total cost per department as percentage).
5. WHEN the user applies filters in the Filter_Bar (aircraft, fleet group, category, date range), THE Cost_Breakdown analytics SHALL update to reflect only the filtered AOG events.
6. WHEN no cost entry data exists for the selected filters, THE System SHALL display an appropriate empty state.
7. THE System SHALL provide a backend analytics endpoint that aggregates cost entries by department with support for aircraftId, fleetGroup, category, startDate, and endDate filter parameters.

### Requirement 6: Cost Analytics API

**User Story:** As a developer, I want an analytics endpoint that aggregates cost entries across AOG events, so that the frontend can display cost breakdown charts.

#### Acceptance Criteria

1. WHEN a GET request is sent to `/api/aog-events/analytics/cost-breakdown`, THE System SHALL return aggregated cost data grouped by department.
2. THE response SHALL include for each department: department name, total internal cost, total external cost, total combined cost, and entry count.
3. THE response SHALL include overall totals: grand total internal cost, grand total external cost, and grand total combined cost.
4. WHEN the aircraftId query parameter is provided, THE System SHALL filter cost entries to only those belonging to AOG events for the specified aircraft.
5. WHEN the fleetGroup query parameter is provided, THE System SHALL filter cost entries to only those belonging to AOG events for aircraft in the specified fleet group.
6. WHEN the category query parameter is provided, THE System SHALL filter cost entries to only those belonging to AOG events with the specified category.
7. WHEN startDate and endDate query parameters are provided, THE System SHALL filter cost entries to only those belonging to AOG events detected within the specified date range.

### Requirement 7: PDF Export of Cost Analytics

**User Story:** As an executive, I want the PDF export to capture the entire AOG Analytics page including cost breakdown charts, so that I can share comprehensive reports with stakeholders.

#### Acceptance Criteria

1. WHEN the user clicks the PDF export button on the AOG Analytics page, THE PDF_Export SHALL capture all visible sections including the cost breakdown analytics.
2. THE exported PDF SHALL render cost breakdown charts (bar chart and pie chart) at readable resolution.
3. THE exported PDF SHALL include the cost summary cards with correct totals.
4. WHEN filters are applied, THE exported PDF SHALL reflect the filtered data in the cost breakdown section.
5. IF the cost breakdown section has no data, THE exported PDF SHALL show the empty state message for that section.
