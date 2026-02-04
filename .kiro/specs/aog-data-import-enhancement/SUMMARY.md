# AOG Data Import & Enhancement - Summary

## Overview

This spec addresses the client's need to import historical AOG/OOS data (2024-2026) and enhance the UI to make this data more valuable and actionable. The approach leverages the existing Excel import infrastructure while simplifying the process for non-technical users.

## Key Insights from Client Data

### Data Structure Analysis

The client provided historical data with these columns:
- **AIRCRAFT**: Registration (e.g., HZ-A42, HZ-SK5)
- **WO / Defect**: Description of the issue
- **Location**: ICAO airport code (e.g., OERK, LFSB, EDDH)
- **AOG/OOS**: Category (AOG, S-MX, U-MX, MRO, CLEANING)
- **Start Date + Time**: When the event began
- **Finish Date + Time**: When resolved (empty = still active)
- **Total Days/Time**: Duration (calculated field)

### Key Patterns Observed

1. **Active Events**: Several events have no Finish Date (still ongoing as of data export)
2. **Long-Duration MRO**: Some S-MX events span 200+ days (normal for major overhauls)
3. **Category Distribution**: 
   - AOG (critical): ~40% of events
   - S-MX (scheduled): ~30% of events
   - U-MX (unscheduled): ~25% of events
   - MRO (facility visits): ~4% of events
   - CLEANING: ~1% of events
4. **Location Concentration**: Most events occur at OERK (Riyadh), LFSB (Basel), EDDH (Hamburg)
5. **Aircraft Reliability**: Some aircraft (HZ-A25, HZ-SK2) have significantly more events than others

## Proposed Solution

### Phase 1: Import Infrastructure (High Priority)

**Leverage Existing System:**
- Extend the existing `ExcelTemplateService` to support a simplified AOG import template
- Use the existing `ExcelParserService` for validation
- Use the existing `ImportService` for processing

**Simplified Template:**
```
Column Headers:
1. Aircraft (required) - Registration or name
2. Defect Description (required) - What went wrong
3. Location (optional) - ICAO code
4. Category (required) - Dropdown: AOG, S-MX, U-MX, MRO, CLEANING
5. Start Date (required) - YYYY-MM-DD
6. Start Time (required) - HH:MM
7. Finish Date (optional) - YYYY-MM-DD (empty = active)
8. Finish Time (optional) - HH:MM
```

**Default Values for Missing Fields:**
- Responsible Party: "Other"
- Action Taken: "See defect description"
- Manpower Count: 1
- Man Hours: Calculated from duration or 0
- isLegacy: true (always for imports)
- reportedAt: Same as detectedAt
- upAndRunningAt: Same as clearedAt (if provided)

### Phase 2: UI Enhancements (High Priority)

**AOG List Page:**
- Color-coded category badges (AOG=red, U-MX=amber, S-MX=blue, MRO=purple, CLEANING=green)
- Location display with ICAO code
- Duration in human-readable format
- Quick stats cards (Active AOG, This Month, Avg Duration, Total Hours)
- Active events highlighted and sorted to top

**AOG Detail Page:**
- Clear "ACTIVE" or "RESOLVED" badge at top
- Visual timeline showing detectedAt → clearedAt
- "Legacy Event" badge for imported historical data
- Clear indication when "Up & Running At" = "Cleared At"
- Related events section (other events for same aircraft)

**AOG Analytics Page:**
- Category breakdown chart (pie/bar)
- Location heatmap (top 5 locations)
- Duration distribution (< 24hrs, 1-7 days, 1-4 weeks, > 1 month)
- Aircraft reliability ranking (most/least reliable)
- Monthly trend chart

**Dashboard Integration:**
- AOG Status widget (active count + top 3 events)
- Fleet Availability Impact widget (% unavailable, which aircraft, why)

### Phase 3: Daily Status Integration (Medium Priority)

**Relationship Between AOG and Daily Status:**
- AOG events represent discrete incidents with start/end times
- Daily Status represents daily availability hours (24-hour breakdown)
- They should be reconciled but kept separate

**Suggested Approach:**
1. Keep AOG events and Daily Status as separate data sources
2. Provide a reconciliation report showing:
   - AOG events without corresponding daily status entries
   - Daily status entries with downtime but no AOG event
3. Add a helper feature: "Generate Daily Status from AOG Event"
   - For each day the aircraft was AOG, create a daily status entry
   - Set nmcmUHours=24 for AOG/U-MX categories
   - Set nmcmSHours=24 for S-MX/MRO categories
4. Make this optional - let the client decide if they want to backfill daily status

## Technical Implementation

### Backend Changes

1. **Update ExcelTemplateService** (`.kiro/specs/aog-data-import-enhancement/backend/excel-template.service.ts`)
   - Add simplified AOG import template definition
   - Support aircraft name → registration lookup
   - Add category dropdown values

2. **Update ExcelParserService** (`.kiro/specs/aog-data-import-enhancement/backend/excel-parser.service.ts`)
   - Add AOG-specific validation rules
   - Handle active events (no finish date)
   - Apply default values for missing fields

3. **Update ImportService** (`.kiro/specs/aog-data-import-enhancement/backend/import.service.ts`)
   - Add AOG import processing logic
   - Set isLegacy=true for all imports
   - Calculate man hours from duration if missing

4. **Update AOGEventSchema** (already done)
   - location field: ✅ Added
   - AOGCategory enum: ✅ Expanded (AOG, S-MX, U-MX, MRO, CLEANING)
   - isLegacy field: ✅ Added

5. **Add Analytics Endpoints**
   - GET /api/aog-events/analytics/category-breakdown
   - GET /api/aog-events/analytics/location-heatmap
   - GET /api/aog-events/analytics/duration-distribution
   - GET /api/aog-events/analytics/aircraft-reliability

### Frontend Changes

1. **AOG List Page** (`frontend/src/pages/aog/AOGListPage.tsx`)
   - Add category badge component
   - Add location display
   - Add quick stats cards
   - Add active event highlighting
   - Add duration formatting

2. **AOG Detail Page** (`frontend/src/pages/aog/AOGDetailPage.tsx`)
   - Add status badge (ACTIVE/RESOLVED)
   - Add legacy event badge
   - Improve milestone timeline clarity
   - Add related events section

3. **AOG Analytics Page** (`frontend/src/pages/aog/AOGAnalyticsPage.tsx`)
   - Add category breakdown chart
   - Add location heatmap
   - Add duration distribution chart
   - Add aircraft reliability ranking
   - Add monthly trend chart

4. **Dashboard** (`frontend/src/pages/DashboardPage.tsx`)
   - Add AOG Status widget
   - Add Fleet Availability Impact widget

## User Guidance

### For the Client (Import Instructions)

**Step 1: Download Template**
1. Go to Import page
2. Select "AOG Events" from dropdown
3. Click "Download Template"

**Step 2: Prepare Data**
1. Open the template in Excel
2. Fill in the Data sheet:
   - **Aircraft**: Enter registration (e.g., HZ-A42) or aircraft name
   - **Defect Description**: Describe what went wrong
   - **Location**: Enter ICAO code (e.g., OERK) or leave empty
   - **Category**: Select from dropdown (AOG, S-MX, U-MX, MRO, CLEANING)
   - **Start Date**: Format YYYY-MM-DD (e.g., 2024-01-15)
   - **Start Time**: Format HH:MM (e.g., 08:30)
   - **Finish Date**: Format YYYY-MM-DD or leave empty if still active
   - **Finish Time**: Format HH:MM or leave empty if still active
3. Review the Instructions sheet for details

**Step 3: Upload and Validate**
1. Go to Import page
2. Upload your Excel file
3. Review the validation preview
4. Fix any errors shown
5. Confirm import

**Step 4: Verify Data**
1. Go to AOG List page
2. Check that events are imported correctly
3. Review active events (no finish date)
4. Check analytics for insights

### Minimal Data Requirements

The client's historical data is the **minimum** required:
- Aircraft registration ✅
- Defect description ✅
- Category ✅
- Start date + time ✅
- Finish date + time (optional - empty = active) ✅

Everything else will use defaults:
- Location: null (optional)
- Responsible Party: "Other"
- Action Taken: "See defect description"
- Manpower Count: 1
- Man Hours: Calculated or 0
- isLegacy: true

## Benefits

### For Management
- **Historical Trends**: See patterns over 2+ years
- **Aircraft Reliability**: Identify problem aircraft
- **Location Analysis**: See which locations have most events
- **Category Breakdown**: Understand AOG vs scheduled vs unscheduled
- **Duration Analysis**: Identify long-duration events

### For Maintenance Teams
- **Active Event Tracking**: Clear visibility of ongoing issues
- **Related Events**: See history for each aircraft
- **Location Context**: Know where aircraft are grounded
- **Category Clarity**: Distinguish critical AOG from routine maintenance

### For Executives
- **Fleet Availability Impact**: See how AOG affects operations
- **Dashboard Widgets**: Quick status at a glance
- **Trend Analysis**: Month-over-month comparisons
- **Reliability Ranking**: Focus on problem aircraft

## Next Steps

1. **Review Requirements**: Confirm the requirements document meets your needs
2. **Proceed to Design**: Create detailed design document with:
   - Excel template structure
   - Import flow diagrams
   - UI mockups
   - API endpoint specifications
3. **Create Tasks**: Break down implementation into discrete tasks
4. **Execute**: Implement Phase 1 (import + basic UI enhancements)

## Questions for Client

1. **Daily Status Integration**: Do you want to automatically generate daily status entries from AOG events, or keep them separate?
2. **Active Events**: Should we import events with no finish date as active, or ask you to provide finish dates first?
3. **Priority**: Which UI enhancements are most important to you? (List page, detail page, analytics, dashboard)
4. **Historical Data**: Is the provided data (2024-2026) complete, or will you provide more historical data?
5. **Ongoing Use**: After importing historical data, will you continue to use the Excel import for new events, or enter them through the UI?
