# Requirements Document

## Introduction

This document specifies the requirements for a complete revamp of the AOG (Aircraft On Ground) events feature in the Alpha Star Aviation KPIs Dashboard. The current flat, single-event model with static procurement milestones is replaced by a hierarchical Parent Event / Sub-Event architecture with dynamic department handoffs. The revamp includes a rebuilt backend, frontend, and simplified analytics that reflect real-world grounding incidents where one aircraft grounding can involve multiple sub-events across multiple departments.

## Glossary

- **Event_System**: The AOG events backend and frontend feature set, including data models, API endpoints, UI pages, and analytics
- **Parent_Event**: A top-level record representing one aircraft grounding incident; acts as a skeleton container with no category of its own
- **Sub_Event**: A child record under a Parent_Event representing a specific maintenance activity (AOG, Scheduled, or Unscheduled) with its own timeline and department handoffs
- **Department_Handoff**: A timestamped record of an aircraft (or work item) being sent to and returned from a specific department (Procurement, Engineering, Quality, or Operations/Testing)
- **Technical_Time**: The time the aircraft is in possession of the technical/maintenance team, calculated as total sub-event duration minus the sum of all department handoff durations
- **Department_Time**: The sum of time spent at external departments, calculated from the Sent_At and Returned_At timestamps of each Department_Handoff
- **Category**: The classification of a Sub_Event: AOG (critical grounding), Scheduled (planned maintenance), or Unscheduled (unplanned maintenance)
- **Dashboard**: The executive KPI overview page at the root route that displays fleet-wide metrics including active AOG count
- **Form_Repeater**: A dynamic UI pattern allowing users to add, remove, and edit multiple Department_Handoff entries within a single Sub_Event form

## Requirements

### Requirement 1: Parent Event Data Model

**User Story:** As a maintenance manager, I want a parent event to represent one aircraft grounding incident, so that all related maintenance activities are grouped under a single record.

#### Acceptance Criteria

1. THE Event_System SHALL store a Parent_Event with the following fields: aircraftId (reference to Aircraft), detectedAt (date the grounding was detected), clearedAt (optional date the aircraft returned to service), location (ICAO airport code), notes (optional free text), attachments (list of S3 keys), and updatedBy (reference to User).
2. THE Parent_Event SHALL NOT contain a category field; categories are derived from Sub_Events.
3. THE Parent_Event SHALL NOT contain a responsibleParty field.
4. THE Parent_Event SHALL NOT contain static milestone fields (procurementRequestedAt, availableAtStoreAt, issuedBackAt, installationCompleteAt, testStartAt, upAndRunningAt).
5. WHEN a Parent_Event has at least one active Sub_Event (clearedAt is null), THE Event_System SHALL consider the Parent_Event as active.
6. WHEN all Sub_Events of a Parent_Event have a non-null clearedAt, THE Event_System SHALL consider the Parent_Event as completed.
7. THE Event_System SHALL compute totalDowntimeHours for a Parent_Event as the difference between clearedAt (or current time if active) and detectedAt, expressed in hours.
8. THE Event_System SHALL store the Parent_Event in a MongoDB collection named `aogevents`.

### Requirement 2: Sub-Event Data Model

**User Story:** As a maintenance manager, I want to create multiple sub-events under a parent event, so that I can track each distinct maintenance activity (AOG, scheduled, unscheduled) that occurs during a single grounding incident.

#### Acceptance Criteria

1. THE Event_System SHALL store a Sub_Event with the following fields: parentEventId (reference to Parent_Event), category (enum: AOG, Scheduled, Unscheduled), reasonCode (string describing the issue), actionTaken (string describing corrective action), detectedAt (when this sub-event issue was detected), clearedAt (optional, when this sub-event was resolved), manpowerCount (number of technicians), manHours (total labor hours), departmentHandoffs (array of Department_Handoff entries), notes (optional free text), and updatedBy (reference to User).
2. THE Event_System SHALL only allow the following category values for a Sub_Event: "aog", "scheduled", "unscheduled".
3. THE Event_System SHALL NOT allow the category values "mro" or "cleaning".
4. WHEN a Sub_Event is created, THE Event_System SHALL validate that the parentEventId references an existing Parent_Event.
5. WHEN a Sub_Event clearedAt is provided, THE Event_System SHALL validate that clearedAt is greater than or equal to detectedAt.
6. THE Event_System SHALL store Sub_Events in a MongoDB collection named `aogsubevents`.
7. THE Event_System SHALL compute totalDowntimeHours for a Sub_Event as the difference between clearedAt (or current time if active) and detectedAt, expressed in hours.

### Requirement 3: Department Handoff Model

**User Story:** As a maintenance manager, I want to record each time work is handed off to a department and when it returns, so that I can track where time is being spent during a grounding event.

#### Acceptance Criteria

1. THE Event_System SHALL store each Department_Handoff as an embedded sub-document within a Sub_Event, containing: department (enum: Procurement, Engineering, Quality, Operations), sentAt (timestamp when sent to department), returnedAt (optional timestamp when returned from department), and notes (optional free text).
2. THE Event_System SHALL allow multiple Department_Handoff entries per Sub_Event.
3. THE Event_System SHALL allow the same department to appear multiple times in the Department_Handoff list of a single Sub_Event.
4. WHEN a Department_Handoff returnedAt is provided, THE Event_System SHALL validate that returnedAt is greater than or equal to sentAt.
5. THE Event_System SHALL compute the duration of each Department_Handoff as the difference between returnedAt (or current time if returnedAt is null) and sentAt, expressed in hours.

### Requirement 4: Time Bucket Calculations

**User Story:** As a maintenance manager, I want to see how much time was spent with the technical team versus each external department, so that I can identify bottlenecks in the resolution process.

#### Acceptance Criteria

1. THE Event_System SHALL compute Department_Time for a Sub_Event as the sum of all Department_Handoff durations (sentAt to returnedAt for each handoff).
2. THE Event_System SHALL compute Technical_Time for a Sub_Event as the total Sub_Event duration (detectedAt to clearedAt) minus the total Department_Time.
3. IF Technical_Time computes to a negative value, THEN THE Event_System SHALL set Technical_Time to zero.
4. THE Event_System SHALL compute per-department time totals by summing durations of all Department_Handoffs grouped by department name.
5. THE Event_System SHALL store computed Technical_Time and Department_Time on the Sub_Event record for query performance.
6. WHEN a Department_Handoff is added, updated, or removed, THE Event_System SHALL recompute Technical_Time and Department_Time for the affected Sub_Event.

### Requirement 5: Parent Event CRUD API

**User Story:** As a frontend developer, I want REST API endpoints for creating, reading, updating, and deleting parent events, so that the UI can manage grounding incidents.

#### Acceptance Criteria

1. THE Event_System SHALL expose `POST /api/aog-events` to create a Parent_Event, requiring aircraftId and detectedAt, and returning the created record with its generated ID.
2. THE Event_System SHALL expose `GET /api/aog-events` to list Parent_Events with optional query filters: aircraftId, fleetGroup, startDate, endDate, and status (active or completed).
3. THE Event_System SHALL expose `GET /api/aog-events/:id` to retrieve a single Parent_Event with its populated Sub_Events and computed metrics.
4. THE Event_System SHALL expose `PUT /api/aog-events/:id` to update a Parent_Event's mutable fields (clearedAt, location, notes).
5. THE Event_System SHALL expose `DELETE /api/aog-events/:id` to delete a Parent_Event and all associated Sub_Events.
6. WHEN a Parent_Event is retrieved, THE Event_System SHALL include a computed categories array derived from the distinct categories of its Sub_Events.
7. WHEN a Parent_Event is retrieved, THE Event_System SHALL include computed aggregate metrics: total sub-event count, total downtime hours, total technical time, and total department time across all Sub_Events.
8. THE Event_System SHALL require authentication (valid JWT) for all Parent_Event endpoints.
9. THE Event_System SHALL restrict DELETE operations to users with the Admin role.

### Requirement 6: Sub-Event CRUD API

**User Story:** As a frontend developer, I want REST API endpoints for managing sub-events within a parent event, so that the UI can track individual maintenance activities.

#### Acceptance Criteria

1. THE Event_System SHALL expose `POST /api/aog-events/:parentId/sub-events` to create a Sub_Event under a specified Parent_Event.
2. THE Event_System SHALL expose `GET /api/aog-events/:parentId/sub-events` to list all Sub_Events for a given Parent_Event.
3. THE Event_System SHALL expose `GET /api/aog-events/:parentId/sub-events/:subId` to retrieve a single Sub_Event with computed time metrics.
4. THE Event_System SHALL expose `PUT /api/aog-events/:parentId/sub-events/:subId` to update a Sub_Event's fields including category, reasonCode, actionTaken, clearedAt, manpowerCount, manHours, and notes.
5. THE Event_System SHALL expose `DELETE /api/aog-events/:parentId/sub-events/:subId` to delete a single Sub_Event.
6. WHEN a Sub_Event is created or updated, THE Event_System SHALL recompute the time bucket metrics (Technical_Time, Department_Time, per-department totals).
7. THE Event_System SHALL require authentication (valid JWT) for all Sub_Event endpoints.

### Requirement 7: Department Handoff Management API

**User Story:** As a frontend developer, I want API endpoints to add, update, and remove department handoffs within a sub-event, so that the UI can manage the dynamic handoff form repeater.

#### Acceptance Criteria

1. THE Event_System SHALL expose `POST /api/aog-events/:parentId/sub-events/:subId/handoffs` to add a Department_Handoff to a Sub_Event, requiring department and sentAt fields.
2. THE Event_System SHALL expose `PUT /api/aog-events/:parentId/sub-events/:subId/handoffs/:handoffId` to update a Department_Handoff's fields (department, sentAt, returnedAt, notes).
3. THE Event_System SHALL expose `DELETE /api/aog-events/:parentId/sub-events/:subId/handoffs/:handoffId` to remove a Department_Handoff from a Sub_Event.
4. WHEN a Department_Handoff is added, updated, or removed, THE Event_System SHALL recompute the Sub_Event's time bucket metrics.
5. THE Event_System SHALL require authentication (valid JWT) for all Department_Handoff endpoints.

### Requirement 8: Parent Event List Page

**User Story:** As a maintenance manager, I want a list page showing all grounding incidents with key summary information, so that I can quickly see the status of all events.

#### Acceptance Criteria

1. THE Event_System SHALL display a table of Parent_Events showing: aircraft registration, location, detected date, cleared date (or "Active" badge), categories (derived from sub-events), sub-event count, total downtime hours, and status.
2. THE Event_System SHALL provide filter controls for: aircraft (dropdown), fleet group (dropdown), status (active/completed/all), and date range (start and end date pickers).
3. THE Event_System SHALL provide a "Create Event" button that opens a form to create a new Parent_Event.
4. WHEN a user clicks a row in the table, THE Event_System SHALL navigate to the Parent_Event detail page.
5. THE Event_System SHALL sort the table by detectedAt in descending order by default.
6. THE Event_System SHALL display a loading skeleton while data is being fetched.

### Requirement 9: Parent Event Detail Page

**User Story:** As a maintenance manager, I want a detail page for a grounding incident that shows all sub-events and allows me to manage them, so that I can track the full lifecycle of a grounding.

#### Acceptance Criteria

1. THE Event_System SHALL display the Parent_Event header with: aircraft registration, location, detected date, cleared date, total downtime, and status badge.
2. THE Event_System SHALL display a list of Sub_Events under the Parent_Event, each showing: category badge, reason code, detected date, cleared date, technical time, department time, and status.
3. THE Event_System SHALL provide an "Add Sub-Event" button that opens a form to create a new Sub_Event under the current Parent_Event.
4. WHEN a user clicks a Sub_Event in the list, THE Event_System SHALL expand or navigate to the Sub_Event detail view showing department handoffs.
5. THE Event_System SHALL allow inline editing of the Parent_Event fields (clearedAt, location, notes) from the detail page.
6. THE Event_System SHALL display a time breakdown summary showing total Technical_Time and per-department time across all Sub_Events of the Parent_Event.
7. THE Event_System SHALL provide a delete button for the Parent_Event, visible only to Admin users, with a confirmation dialog.

### Requirement 10: Sub-Event Form with Department Handoff Repeater

**User Story:** As a maintenance manager, I want a form to create and edit sub-events with a dynamic repeater for department handoffs, so that I can record each department interaction.

#### Acceptance Criteria

1. THE Event_System SHALL display a Sub_Event form with fields: category (dropdown: AOG, Scheduled, Unscheduled), reasonCode (text input), actionTaken (text area), detectedAt (date-time picker), clearedAt (optional date-time picker), manpowerCount (number input), and manHours (number input).
2. THE Event_System SHALL display a Form_Repeater section for Department_Handoffs with an "Add Handoff" button.
3. WHEN the user clicks "Add Handoff", THE Event_System SHALL add a new row with: department (dropdown: Procurement, Engineering, Quality, Operations), sentAt (date-time picker), returnedAt (optional date-time picker), and notes (optional text input).
4. THE Event_System SHALL allow the user to remove any Department_Handoff row from the Form_Repeater.
5. THE Event_System SHALL validate that returnedAt is greater than or equal to sentAt for each Department_Handoff before submission.
6. THE Event_System SHALL validate all required fields before allowing form submission.
7. WHEN the form is submitted successfully, THE Event_System SHALL display a success toast notification and refresh the parent event data.

### Requirement 11: Analytics Overview

**User Story:** As a maintenance manager, I want a simplified analytics page showing key metrics derived from sub-events, so that I can understand event patterns and time distribution.

#### Acceptance Criteria

1. THE Event_System SHALL expose `GET /api/aog-events/analytics/summary` returning: total event count (parent events), active event count, completed event count, total sub-event count, and total downtime hours.
2. THE Event_System SHALL expose `GET /api/aog-events/analytics/category-breakdown` returning: for each category (AOG, Scheduled, Unscheduled), the count of sub-events, total downtime hours, and percentage of total downtime.
3. THE Event_System SHALL expose `GET /api/aog-events/analytics/time-breakdown` returning: total Technical_Time, and per-department time totals (Procurement, Engineering, Quality, Operations), with percentages.
4. THE Event_System SHALL support query filters on all analytics endpoints: aircraftId, fleetGroup, category, startDate, and endDate.
5. THE Event_System SHALL derive all analytics data from Sub_Events, since Parent_Events are skeleton containers.

### Requirement 12: Analytics Page UI

**User Story:** As a maintenance manager, I want a clean, modern analytics page with charts and summary cards, so that I can visualize event patterns at a glance.

#### Acceptance Criteria

1. THE Event_System SHALL display summary cards at the top of the analytics page showing: total events, active events, completed events, and total downtime hours.
2. THE Event_System SHALL display a category breakdown chart (bar or pie chart) showing the distribution of sub-events by category (AOG, Scheduled, Unscheduled) with downtime hours.
3. THE Event_System SHALL display a time breakdown chart showing Technical_Time versus each department's time as a stacked bar or horizontal bar chart.
4. THE Event_System SHALL provide filter controls on the analytics page for: aircraft (dropdown), fleet group (dropdown), category (dropdown), and date range (start and end date pickers).
5. WHEN filters are changed, THE Event_System SHALL re-fetch and re-render all analytics data.
6. THE Event_System SHALL display a loading skeleton for each chart section while data is being fetched.
7. IF no data matches the current filters, THEN THE Event_System SHALL display an appropriate empty state message.

### Requirement 13: Dashboard Integration

**User Story:** As an executive, I want the main dashboard to correctly reflect AOG metrics from the new hierarchical event model, so that fleet-wide KPIs remain accurate.

#### Acceptance Criteria

1. THE Dashboard SHALL display the active AOG count as the number of Parent_Events where clearedAt is null.
2. THE Dashboard SHALL compute MTTR (Mean Time To Repair) using Parent_Event durations (clearedAt minus detectedAt) for completed events.
3. THE Dashboard SHALL include AOG-related alerts using the new Parent_Event model: a critical alert when any Parent_Event is active, and a warning alert when a Parent_Event has been active for more than 48 hours.
4. WHEN the Dashboard fetches AOG summary data, THE Event_System SHALL return data compatible with the existing dashboard KPI interfaces.
5. THE Dashboard SHALL display the total downtime hours from Parent_Events in the AOG summary section.

### Requirement 14: Backend Cleanup

**User Story:** As a developer, I want the old AOG event model fields and logic removed, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE Event_System SHALL remove the following fields from the AOG event schema: responsibleParty, currentStatus, blockingReason, statusHistory, partRequests, estimatedCostLabor, estimatedCostParts, estimatedCostExternal, budgetClauseId, budgetPeriod, isBudgetAffecting, linkedActualSpendId, costAuditTrail, attachmentsMeta, isLegacy, reportedAt, procurementRequestedAt, availableAtStoreAt, issuedBackAt, installationCompleteAt, testStartAt, upAndRunningAt, technicalTimeHours, procurementTimeHours, opsTimeHours, milestoneHistory, and isImported.
2. THE Event_System SHALL remove the AOGWorkflowStatus, BlockingReason, PartRequestStatus, and ResponsibleParty enums.
3. THE Event_System SHALL remove the MilestoneHistoryEntry, StatusHistoryEntry, PartRequest, CostAuditEntry, and AttachmentMeta sub-document schemas.
4. THE Event_System SHALL remove the MRO and Cleaning values from the AOGCategory enum.
5. THE Event_System SHALL remove all workflow-related service methods (transitionStatus, getStatusHistory, addPartRequest, updatePartRequest, generateActualSpend, updateBudgetIntegration).
6. THE Event_System SHALL remove the old three-bucket computation logic (procurementTimeHours, opsTimeHours based on static milestones).
7. THE Event_System SHALL update all existing indexes to match the new data model.

### Requirement 15: Frontend Cleanup

**User Story:** As a developer, I want old AOG UI components and pages removed and replaced with the new hierarchical model UI, so that the frontend is clean and consistent.

#### Acceptance Criteria

1. THE Event_System SHALL remove or replace the following obsolete frontend components: MilestoneTimeline, MilestoneEditForm, ThreeBucketChart (old version), AttachmentsTab (old AOG-specific version), and all workflow-related components.
2. THE Event_System SHALL remove the old AOG analytics components that are no longer relevant: ForecastChart, RiskScoreGauge, ReliabilityScoreCards, WaterfallChart, BucketTrendChart, MovingAverageChart, YearOverYearChart, AircraftHeatmap, ParetoChart, CostBreakdownChart, CostEfficiencyMetrics, AOGDataQualityIndicator, and EnhancedAOGAnalyticsPDFExport.
3. THE Event_System SHALL remove the old utility functions: reliabilityScore.ts, riskScore.ts, costAnalysis.ts, and sampleData.ts.
4. THE Event_System SHALL update the frontend routing so that `/aog/list` renders the new Parent_Event list page, `/aog/:id` renders the new Parent_Event detail page, and `/aog/analytics` renders the new simplified analytics page.
5. THE Event_System SHALL update the useAOGEvents hook to use the new API endpoints and data structures.

### Requirement 16: Location Field Fix

**User Story:** As a maintenance manager, I want the location field to save correctly when creating an event, so that I can track where grounding incidents occur.

#### Acceptance Criteria

1. WHEN a Parent_Event is created with a location value, THE Event_System SHALL persist the location field to the database.
2. WHEN a Parent_Event is retrieved, THE Event_System SHALL return the location field in the response.
3. THE Event_System SHALL include the location field in the create DTO validation.
