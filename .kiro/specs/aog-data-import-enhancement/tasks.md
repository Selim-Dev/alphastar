# Implementation Plan: AOG Data Import & Enhancement

## Overview

This implementation plan breaks down the AOG data import and UI enhancement feature into discrete, manageable tasks. The focus is on fast iteration without property-based or unit testing.

## Tasks

- [x] 1. Update AOG Event Schema for Simplified Model
  - Ensure `location` field exists (string, optional)
  - Ensure `category` enum includes all values (aog, scheduled, unscheduled, mro, cleaning)
  - Add `status` virtual field (computed from clearedAt: null = 'active', else = 'resolved')
  - Add `durationHours` virtual field (computed from detectedAt and clearedAt or current time)
  - Add `isImported` boolean field (default: false)
  - Remove or make optional complex workflow fields (currentStatus, blockingReason, etc.)
  - _Requirements: 5.1, 5.2, 6.1, 6.2_

- [-] 2. Create Simplified Excel Template for AOG Import
  - [x] 2.1 Update ExcelTemplateService with AOG template definition
    - Define columns: Aircraft, Defect Description, Location, Category, Start Date, Start Time, Finish Date, Finish Time
    - Set required fields: Aircraft, Defect Description, Category, Start Date, Start Time
    - Set optional fields: Location, Finish Date, Finish Time
    - Add category enum values: AOG, S-MX, U-MX, MRO, CLEANING
    - Add example rows (active and resolved events)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 2.2 Add template download endpoint
    - Implement GET /api/import/template/aog_events
    - Return Excel file with Data and Instructions sheets
    - _Requirements: 1.1, 14.1_

- [x] 3. Implement AOG Import Validation
  - [x] 3.1 Update ExcelParserService for AOG validation
    - Parse Aircraft column (registration or name)
    - Parse Defect Description
    - Parse Location (ICAO code, optional)
    - Parse Category (map AOG → 'aog', S-MX → 'scheduled', etc.)
    - Parse Start Date + Start Time → detectedAt
    - Parse Finish Date + Finish Time → clearedAt (null if empty)
    - Validate aircraft exists in database
    - Validate category is valid
    - Validate dates are valid format
    - Validate Finish Date >= Start Date (if provided)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 3.2 Add aircraft name → registration lookup
    - Implement fuzzy matching for aircraft names
    - Handle case-insensitive matching
    - _Requirements: 2.8, 3.1, 3.2, 3.3_

- [x] 4. Implement AOG Import Processing
  - [x] 4.1 Update ImportService with AOG processing logic
    - For each valid row, create AOGEvent document
    - Set aircraftId from lookup
    - Set detectedAt from Start Date + Time
    - Set clearedAt from Finish Date + Time (or null)
    - Map category (AOG → 'aog', S-MX → 'scheduled', etc.)
    - Set location (ICAO code or null)
    - Set reasonCode from Defect Description
    - Apply default values:
      - responsibleParty = 'Other'
      - actionTaken = 'See defect description'
      - manpowerCount = 1
      - manHours = calculated from duration or 0
    - Set isImported = true
    - Calculate status ('active' if clearedAt is null, else 'resolved')
    - Calculate durationHours
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [x] 4.2 Add import summary response
    - Return counts: imported, skipped, errors
    - Return error details with row numbers
    - _Requirements: 2.6, 2.7_

- [x] 5. Checkpoint - Test Import with Client Data
  - Download template
  - Fill with sample data from client's Excel file
  - Upload and validate
  - Confirm import
  - Verify events are created correctly
  - Check active vs resolved status
  - Check duration calculations

- [ ] 6. Enhance AOG List Page UI
  - [x] 6.1 Add category badge component
    - Create CategoryBadge component with color coding
    - AOG = red, U-MX = amber, S-MX = blue, MRO = purple, CLEANING = green
    - Add icon for each category
    - Add tooltip with category description
    - _Requirements: 7.1, 17.9_
  
  - [x] 6.2 Add status badge component
    - Create StatusBadge component
    - Active = red badge with pulsing animation
    - Resolved = green badge
    - _Requirements: 5.3, 17.1, 17.10_
  
  - [x] 6.3 Add location display
    - Show ICAO code if available
    - Show "N/A" if location is null
    - _Requirements: 7.2, 17.1_
  
  - [x] 6.4 Add duration formatting
    - Format duration in human-readable format
    - < 24 hours: "X hours"
    - 1-7 days: "X days Y hours"
    - > 7 days: "X days"
    - > 30 days: "X months Y days"
    - _Requirements: 6.3, 7.3, 17.1_
  
  - [x] 6.5 Add quick stats cards above table
    - Total Events count
    - Active Events count (red)
    - Resolved Events count (green)
    - Average Duration
    - _Requirements: 7.4, 17.7_
  
  - [x] 6.6 Add filters and sorting
    - Status filter (All, Active Only, Resolved Only)
    - Category filter (multi-select)
    - Aircraft filter (dropdown)
    - Location filter (dropdown)
    - Date range filter
    - Sort by: Aircraft, Category, Start Date, Duration
    - _Requirements: 5.4, 17.3, 17.4_
  
  - [x] 6.7 Add search functionality
    - Search box for defect description
    - Real-time filtering as user types
    - _Requirements: 17.5_
  
  - [x] 6.8 Add pagination
    - Configurable page size (10, 25, 50, 100)
    - Page navigation controls
    - _Requirements: 17.6_
  
  - [x] 6.9 Sort active events to top by default
    - Active events appear first
    - Then resolved events sorted by start date descending
    - _Requirements: 7.5, 17.2_
  
  - [x] 6.10 Add row highlighting for active events
    - Subtle background color for active event rows
    - _Requirements: 17.10_

- [x] 7. Enhance AOG Detail Page UI
  - [x] 7.1 Add prominent status badge at top
    - Large "ACTIVE" badge in red for active events
    - Large "RESOLVED" badge in green for resolved events
    - _Requirements: 3.1, 3.2_
  
  - [x] 7.2 Add visual timeline
    - Show detectedAt → clearedAt timeline
    - Show duration prominently
    - For active events, show "Still Active" instead of clearedAt
    - _Requirements: 3.6, 10.1_
  
  - [x] 7.3 Add related events section
    - Show other events for the same aircraft
    - Display as a list with date, category, duration
    - Link to each event detail page
    - _Requirements: 10.3_
  
  - [x] 7.4 Add edit functionality
    - Allow editing category, location, defect description
    - Allow marking as resolved (set clearedAt)
    - Validate clearedAt >= detectedAt
    - _Requirements: 3.5, 3.7_

- [x] 8. Implement Analytics Endpoints
  - [x] 8.1 Add category breakdown endpoint
    - GET /api/aog-events/analytics/category-breakdown
    - Group events by category
    - Calculate count, percentage, total hours for each
    - Support date range filtering
    - _Requirements: 8.1, 16.4_
  
  - [x] 8.2 Add location heatmap endpoint
    - GET /api/aog-events/analytics/location-heatmap
    - Group events by location
    - Calculate count and percentage for each
    - Return top N locations (default: 5)
    - _Requirements: 8.2, 16.3_
  
  - [x] 8.3 Add duration distribution endpoint
    - GET /api/aog-events/analytics/duration-distribution
    - Group events by duration ranges (< 24hrs, 1-7 days, 1-4 weeks, > 1 month)
    - Calculate count and percentage for each range
    - _Requirements: 8.3, 6.5_
  
  - [x] 8.4 Add aircraft reliability endpoint
    - GET /api/aog-events/analytics/aircraft-reliability
    - Rank aircraft by event count and total downtime
    - Return top 3 most reliable and top 3 needing attention
    - _Requirements: 8.4, 16.1_
  
  - [x] 8.5 Add monthly trend endpoint
    - GET /api/aog-events/analytics/monthly-trend
    - Group events by month
    - Calculate count and total hours for each month
    - Support date range filtering
    - _Requirements: 8.5, 16.5_
  
  - [x] 8.6 Add insights generation endpoint
    - GET /api/aog-events/analytics/insights
    - Calculate top problem aircraft (> 10 events)
    - Identify most common issues (group by defect patterns)
    - Calculate busiest locations
    - Calculate average resolution time by category
    - Calculate fleet health score (0-100)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_

- [x] 9. Create Analytics Page UI
  - [x] 9.1 Add category breakdown chart
    - Pie chart or bar chart showing category distribution
    - Display count and percentage for each category
    - Color-coded by category
    - _Requirements: 8.1, 16.4_
  
  - [x] 9.2 Add location heatmap chart
    - Bar chart showing top 5 locations
    - Display count for each location
    - _Requirements: 8.2, 16.3_
  
  - [x] 9.3 Add duration distribution chart
    - Bar chart showing duration ranges
    - Display count for each range
    - _Requirements: 8.3, 6.5_
  
  - [x] 9.4 Add aircraft reliability ranking
    - Two lists: Most Reliable (top 3) and Needs Attention (top 3)
    - Display aircraft registration, event count, total hours
    - Color-coded indicators
    - _Requirements: 8.4, 16.1_
  
  - [x] 9.5 Add monthly trend chart
    - Line chart showing event count over time
    - Add trend line
    - Display total hours as secondary axis
    - _Requirements: 8.5, 16.5_
  
  - [x] 9.6 Add insights panel
    - Display auto-generated insights
    - Top problem aircraft
    - Most common issues
    - Busiest locations
    - Average resolution time by category
    - Fleet health score with gauge
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_
  
  - [x] 9.7 Add date range filter
    - Date picker for start and end dates
    - Apply to all charts and insights
    - _Requirements: 8.6, 8.7_

- [x] 10. Implement Dashboard Integration
  - [x] 10.1 Add AOG summary endpoint
    - GET /api/dashboard/aog-summary
    - Calculate active count, total this month, avg duration, total downtime
    - Get list of active events (up to 5)
    - Get list of unavailable aircraft
    - Get trend data (last 6 months)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_
  
  - [x] 10.2 Add AOG metric cards to dashboard
    - Active AOG Events card (red, with count)
    - Total AOG Events This Month card (with trend)
    - Average AOG Duration card (hours/days)
    - Total Downtime Hours card (cumulative)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [x] 10.3 Add active events list widget
    - Display up to 5 active events
    - Show aircraft, issue, location, duration
    - Link to event detail page
    - _Requirements: 12.5, 12.6_
  
  - [x] 10.4 Add fleet availability impact widget
    - Show which aircraft are unavailable
    - Display reason and duration
    - Calculate percentage impact on fleet
    - _Requirements: 12.7_
  
  - [x] 10.5 Add mini trend chart
    - Line chart showing last 6 months
    - Event count per month
    - _Requirements: 12.8_

- [x] 11. Add Export Functionality
  - [x] 11.1 Add Excel export for AOG events
    - Export filtered events to Excel
    - Include all fields
    - Apply current filters
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 11.2 Add PDF export for analytics
    - Export analytics page to PDF
    - Include charts and summary statistics
    - _Requirements: 13.2, 13.4, 13.5_

- [x] 12. Final Testing and Polish
  - Test with full client dataset (200+ events)
  - Verify all analytics calculations
  - Test dashboard widgets
  - Check mobile responsiveness
  - Fix any UI/UX issues
  - Optimize performance

- [x] 13. Documentation and Handoff
  - Create import guide for client
  - Document template format
  - Document API endpoints
  - Create user guide for analytics page
  - Update system architecture documentation

## Notes

- No property-based testing or unit testing for fast iteration
- Focus on manual testing and integration testing
- Use client's actual data for testing
- Prioritize core functionality over edge cases
- Keep UI simple and intuitive for non-technical users
