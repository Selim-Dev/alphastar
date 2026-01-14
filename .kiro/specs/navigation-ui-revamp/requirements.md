# Requirements Document

## Introduction

The Alpha Star Aviation KPI Dashboard requires a comprehensive UI/UX navigation modernization and frontend/backend synchronization effort. The current system uses in-page tabs for several modules (Maintenance Tasks, Work Orders, Discrepancies) which breaks deep-linking, bookmarking, and consistent navigation patterns. The AOG Events module already follows the correct pattern with nested routes and sidebar sublists. This initiative will standardize navigation across all modules, ensure Daily Status bulk import parity with other data types, and synchronize all routes, endpoints, and data models between frontend and backend.

## Glossary

- **KPI_Dashboard**: The web-based system for tracking and visualizing aviation operational metrics
- **Nested_Routes**: URL-based routing where sub-views have their own distinct URLs (e.g., `/maintenance/tasks/log`)
- **Sidebar_Sublist**: Expandable navigation items in the sidebar that reveal child navigation links
- **Deep_Linking**: The ability to navigate directly to a specific view via URL
- **Tab_Navigation**: In-page navigation using tab buttons that switch content without changing URL
- **Import_Workflow**: The multi-step process of template download, file upload, validation preview, and confirmation
- **Upsert_Strategy**: Database operation that updates existing records or inserts new ones based on unique key
- **FMC_Hours**: Fully Mission Capable hours - time when aircraft is available for operations
- **POS_Hours**: Possessed hours - baseline hours (typically 24 per day)
- **NMCM_S_Hours**: Not Mission Capable Maintenance - Scheduled downtime hours
- **NMCM_U_Hours**: Not Mission Capable Maintenance - Unscheduled downtime hours
- **Alert_Deep_Link**: Dashboard alert that navigates to a specific sub-route with preserved context

## Requirements

### Requirement 1

**User Story:** As a user, I want all module sub-views to have distinct URLs, so that I can bookmark, share, and directly navigate to specific views.

#### Acceptance Criteria

1. WHEN a user navigates to a Maintenance Tasks sub-view THEN the KPI_Dashboard SHALL display a unique URL for each view (Log Task: `/maintenance/tasks/log`, Summary: `/maintenance/tasks/analytics`, Task List: `/maintenance/tasks`)
2. WHEN a user navigates to a Work Orders sub-view THEN the KPI_Dashboard SHALL display a unique URL for each view (New WO: `/work-orders/new`, Analytics: `/work-orders/analytics`, Work Orders List: `/work-orders`)
3. WHEN a user navigates to a Discrepancies sub-view THEN the KPI_Dashboard SHALL display a unique URL for each view (New: `/discrepancies/new`, Analytics: `/discrepancies/analytics`, Discrepancies List: `/discrepancies`)
4. WHEN a user refreshes the browser on any sub-view THEN the KPI_Dashboard SHALL restore the exact same view without losing context
5. WHEN a user copies and shares a sub-view URL THEN the recipient SHALL land on the exact same view when opening the link

### Requirement 2

**User Story:** As a user, I want the sidebar to show expandable sublists for modules with multiple views, so that I can navigate consistently across the application.

#### Acceptance Criteria

1. WHEN a user views the sidebar THEN the KPI_Dashboard SHALL display expandable parent items for Maintenance Tasks, Work Orders, and Discrepancies modules
2. WHEN a user clicks on an expandable sidebar item THEN the KPI_Dashboard SHALL reveal child navigation links for that module's sub-views
3. WHEN a user is on any sub-view of a module THEN the KPI_Dashboard SHALL highlight both the parent item and the active child link in the sidebar
4. WHEN a user navigates to a sub-view via URL THEN the KPI_Dashboard SHALL auto-expand the parent sidebar item and highlight the active child
5. WHEN the sidebar is collapsed THEN the KPI_Dashboard SHALL show tooltips for parent items and maintain navigation functionality

### Requirement 3

**User Story:** As a user, I want dashboard alerts to deep-link to the correct sub-route, so that I can quickly access relevant information from alert notifications.

#### Acceptance Criteria

1. WHEN a user clicks an AOG-related alert THEN the KPI_Dashboard SHALL navigate to `/aog/list` with the relevant event highlighted or filtered
2. WHEN a user clicks a Work Order alert THEN the KPI_Dashboard SHALL navigate to `/work-orders` with the work order ID in query params for highlighting
3. WHEN a user clicks a Discrepancy alert THEN the KPI_Dashboard SHALL navigate to `/discrepancies` with appropriate filters applied
4. WHEN a user clicks a Maintenance alert THEN the KPI_Dashboard SHALL navigate to `/maintenance/tasks` with relevant context preserved
5. WHEN an alert includes filter context (date range, aircraft) THEN the KPI_Dashboard SHALL preserve those filters in the destination URL

### Requirement 4

**User Story:** As a data entry operator, I want Daily Status bulk import to work with the same quality as other import types, so that I can efficiently import availability data.

#### Acceptance Criteria

1. WHEN a user downloads the Daily Status template THEN the KPI_Dashboard SHALL generate an Excel file with columns for Aircraft Registration, Date, POS Hours, NMCM-S Hours, NMCM-U Hours, NMCS Hours, and Notes
2. WHEN a user uploads a Daily Status Excel file THEN the KPI_Dashboard SHALL parse and validate each row with specific error messages for invalid data
3. WHEN validation errors exist in Daily Status data THEN the KPI_Dashboard SHALL display row-by-row error messages identifying hour range violations (0-24), downtime sum exceeding POS hours, and missing required fields
4. WHEN a user confirms Daily Status import THEN the KPI_Dashboard SHALL calculate FMC hours automatically (POS - NMCM_S - NMCM_U - NMCS) and store records
5. WHEN a duplicate Daily Status record exists (same aircraft and date) THEN the KPI_Dashboard SHALL reject the duplicate and report it as an error
6. WHEN Daily Status import completes THEN the KPI_Dashboard SHALL create an import log record with filename, timestamp, success count, and error details

### Requirement 5

**User Story:** As a developer, I want frontend and backend routes, endpoints, and data models to be synchronized, so that the system is maintainable and consistent.

#### Acceptance Criteria

1. WHEN comparing frontend routes to backend endpoints THEN the KPI_Dashboard SHALL have matching naming conventions (kebab-case for routes, consistent API paths)
2. WHEN comparing frontend TypeScript types to backend DTOs THEN the KPI_Dashboard SHALL have matching field names and types
3. WHEN comparing import type enums THEN the KPI_Dashboard SHALL have identical values in frontend and backend
4. WHEN comparing export type enums THEN the KPI_Dashboard SHALL have identical values in frontend and backend
5. WHEN a new route or endpoint is added THEN the KPI_Dashboard SHALL update both frontend and backend to maintain synchronization

### Requirement 6

**User Story:** As a user, I want backward compatibility for existing URLs, so that my bookmarks and shared links continue to work.

#### Acceptance Criteria

1. WHEN a user navigates to the legacy `/events` route THEN the KPI_Dashboard SHALL redirect to `/aog/list`
2. WHEN a user navigates to a legacy tab-based URL (if any existed) THEN the KPI_Dashboard SHALL redirect to the equivalent nested route
3. WHEN implementing new routes THEN the KPI_Dashboard SHALL maintain existing route aliases for backward compatibility
4. WHEN a redirect occurs THEN the KPI_Dashboard SHALL preserve any query parameters from the original URL

### Requirement 7

**User Story:** As a user, I want consistent header actions across all module views, so that I can perform common operations predictably.

#### Acceptance Criteria

1. WHEN a user views any module list view THEN the KPI_Dashboard SHALL display an Export button in the header
2. WHEN a user views any module form view THEN the KPI_Dashboard SHALL display appropriate action buttons (Save, Clear, Cancel)
3. WHEN a user views any module analytics view THEN the KPI_Dashboard SHALL display date range filters and export options
4. WHEN a user has Editor or Admin role THEN the KPI_Dashboard SHALL display Create/Edit actions in appropriate views
5. WHEN a user has Viewer role THEN the KPI_Dashboard SHALL hide Create/Edit actions but maintain read-only access

### Requirement 8

**User Story:** As a user, I want breadcrumb navigation on nested routes, so that I can understand my location and navigate back easily.

#### Acceptance Criteria

1. WHEN a user is on a nested route THEN the KPI_Dashboard SHALL display breadcrumbs showing the navigation path (e.g., "Maintenance → Tasks → Log Task")
2. WHEN a user clicks a breadcrumb item THEN the KPI_Dashboard SHALL navigate to that level in the hierarchy
3. WHEN a user is on a top-level route THEN the KPI_Dashboard SHALL display a single breadcrumb or hide breadcrumbs entirely
4. WHEN breadcrumbs are displayed THEN the KPI_Dashboard SHALL use consistent styling and truncation for long labels

