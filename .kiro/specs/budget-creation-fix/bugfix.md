# Bugfix Requirements Document

## Introduction

The Budget & Cost Revamp module's project creation flow has critical bugs preventing actual use. The system was designed assuming all budget columns map to aircraft in the aircraft master data collection. However, the real RSAF budget template includes columns that are not aircraft (e.g., "PMO" for Project Management Office), and also uses custom labels like "G650ER-1" and "G650ER-2" that don't directly match aircraft types or fleet groups. This architectural mismatch causes project creation to fail entirely, and the UI doesn't allow entering arbitrary column names. Additionally, the first RSAF budget project needs to be pre-populated with actual data from the budgetary sheet.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user tries to create a budget project with column names that are not aircraft registrations, types, or fleet groups (e.g., "PMO") THEN the system rejects the request because the backend DTO validates `aircraftIds` with `@IsMongoId()` and `resolveAircraftScope()` queries the aircraft collection, returning zero matches for non-aircraft entries

1.2 WHEN a user opens the CreateProjectDialog to define budget columns THEN the system only shows checkboxes populated from the aircraft master data (`useAircraft()` hook), making it impossible to enter free-text column names like "PMO", "G650ER-1", or "G650ER-2"

1.3 WHEN `resolveAircraftScope()` returns an empty array (because aircraft types/groups don't match any records in the aircraft collection) THEN `generatePlanRows()` creates rows without aircraft associations, producing a flat structure that doesn't match the expected multi-column budget table layout

1.4 WHEN a user selects aircraft scope type "type" and checks "G650ER" THEN the system cannot distinguish between G650ER-1 and G650ER-2 because these are custom budget column labels, not aircraft types in the master data

1.5 WHEN the system is first deployed THEN there is no pre-populated RSAF budget project with the actual budgetary sheet data (18 clauses × 4 columns: A330, G650ER-1, G650ER-2, PMO), requiring manual creation which itself fails due to bugs 1.1-1.4

### Expected Behavior (Correct)

2.1 WHEN a user creates a budget project with any free-text column names (e.g., "A330", "G650ER-1", "G650ER-2", "PMO") THEN the system SHALL accept the column names as plain strings without validating them against the aircraft master data, and SHALL create the project successfully

2.2 WHEN a user opens the CreateProjectDialog THEN the system SHALL present a free-text input mechanism (e.g., tag input or comma-separated text field) allowing the user to type any column name, replacing the current aircraft-selection checkboxes

2.3 WHEN a budget project is created with free-text column names THEN `generatePlanRows()` SHALL create one plan row per spending term × column name combination, using the column name string as the identifier instead of an aircraft ObjectId

2.4 WHEN a user enters column names like "G650ER-1" and "G650ER-2" THEN the system SHALL treat each as a distinct budget column, preserving the exact user-provided labels throughout the project lifecycle (creation, display, export)

2.5 WHEN the system is seeded or first initialized THEN there SHALL be a pre-populated RSAF budget project with the 4 columns (A330, G650ER-1, G650ER-2, PMO), 18 spending clauses from the RSAF template, and the planned amounts from the actual budgetary sheet

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a budget project already exists in the database with the old `aircraftScope` schema THEN the system SHALL CONTINUE TO display and function correctly for those legacy projects

3.2 WHEN a user views the budget table for a project THEN the system SHALL CONTINUE TO show planned amounts, actuals, variance, and remaining calculations correctly per column and per spending term

3.3 WHEN a user exports a budget project to Excel THEN the system SHALL CONTINUE TO generate the correct RSAF Excel structure with column headers matching the project's column names

3.4 WHEN a user records actual spend against a budget project THEN the system SHALL CONTINUE TO track actuals per spending term per column per period with correct variance calculations

3.5 WHEN budget analytics are computed (KPIs, burn rate, distribution) THEN the system SHALL CONTINUE TO aggregate data correctly across all columns in the project
