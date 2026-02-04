# Design Document: AOG Data Import & Enhancement

## Overview

This design document outlines the technical implementation for importing historical AOG/OOS data and enhancing the UI to maximize the value of this data. The design leverages the existing Excel import infrastructure while simplifying the user experience for non-technical administrators.

### Design Principles

1. **Simplicity First**: Simple Active/Resolved status model instead of complex 18-state workflow
2. **Leverage Existing**: Use existing ExcelTemplateService and ExcelParserService
3. **Visual Clarity**: Clear status indicators, category badges, and duration displays
4. **Data-Driven Insights**: Automatic generation of insights from imported data
5. **Fast Iteration**: Focus on core functionality, skip property/unit testing for now

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  Import Page  │  AOG List  │  AOG Detail  │  Analytics  │  Dashboard │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
├─────────────────────────────────────────────────────────────┤
│  Import Controller  │  AOG Controller  │  Analytics Service │
│  Excel Parser       │  AOG Service     │  Dashboard Service │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database (MongoDB)                       │
├─────────────────────────────────────────────────────────────┤
│  aogevents collection  │  aircraft collection  │  importlogs │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Excel Template Structure

#### Template Definition

```typescript
{
  name: 'AOG Events (Simplified)',
  columns: [
    { 
      header: 'Aircraft', 
      key: 'aircraft', 
      type: 'string', 
      required: true,
      description: 'Aircraft registration (e.g., HZ-A42) or name'
    },
    { 
      header: 'Defect Description', 
      key: 'defectDescription', 
      type: 'string', 
      required: true,
      description: 'What went wrong'
    },
    { 
      header: 'Location', 
      key: 'location', 
      type: 'string', 
      required: false,
      description: 'ICAO airport code (e.g., OERK, LFSB)'
    },
    { 
      header: 'Category', 
      key: 'category', 
      type: 'enum', 
      required: true,
      enumValues: ['AOG', 'S-MX', 'U-MX', 'MRO', 'CLEANING'],
      description: 'Event category'
    },
    { 
      header: 'Start Date', 
      key: 'startDate', 
      type: 'date', 
      required: true,
      description: 'YYYY-MM-DD format'
    },
    { 
      header: 'Start Time', 
      key: 'startTime', 
      type: 'string', 
      required: true,
      description: 'HH:MM format (24-hour)'
    },
    { 
      header: 'Finish Date', 
      key: 'finishDate', 
      type: 'date', 
      required: false,
      description: 'YYYY-MM-DD format (empty = still active)'
    },
    { 
      header: 'Finish Time', 
      key: 'finishTime', 
      type: 'string', 
      required: false,
      description: 'HH:MM format (24-hour)'
    }
  ],
  exampleRows: [
    {
      aircraft: 'HZ-A42',
      defectDescription: 'Engine hydraulic leak',
      location: 'OERK',
      category: 'AOG',
      startDate: '2024-01-15',
      startTime: '08:30',
      finishDate: '2024-01-17',
      finishTime: '14:45'
    },
    {
      aircraft: 'HZ-SK5',
      defectDescription: 'Scheduled A-check',
      location: 'LFSB',
      category: 'S-MX',
      startDate: '2024-02-01',
      startTime: '09:00',
      finishDate: '2024-02-05',
      finishTime: '17:00'
    },
    {
      aircraft: 'HZ-A10',
      defectDescription: 'Engine replacement',
      location: 'OERK',
      category: 'U-MX',
      startDate: '2025-01-03',
      startTime: '07:00',
      finishDate: '',  // Active event
      finishTime: ''
    }
  ]
}
```

### 2. Data Models

#### AOGEvent Schema (Simplified)

```typescript
interface AOGEvent {
  // Core fields
  aircraftId: ObjectId;           // Reference to Aircraft
  detectedAt: Date;               // Start Date + Time combined
  clearedAt: Date | null;         // Finish Date + Time combined (null = active)
  
  // Category and description
  category: 'aog' | 'scheduled' | 'unscheduled' | 'mro' | 'cleaning';
  reasonCode: string;             // Defect Description
  location: string | null;        // ICAO code (optional)
  
  // Status (computed)
  status: 'active' | 'resolved';  // Computed from clearedAt
  
  // Duration (computed)
  durationHours: number;          // Computed from dates
  
  // Default values for imports
  responsibleParty: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other';  // Default: 'Other'
  actionTaken: string;            // Default: 'See defect description'
  manpowerCount: number;          // Default: 1
  manHours: number;               // Default: calculated from duration or 0
  
  // Metadata
  isImported: boolean;            // true for Excel imports
  updatedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Category Mapping

```typescript
const CATEGORY_MAP = {
  'AOG': 'aog',
  'S-MX': 'scheduled',
  'U-MX': 'unscheduled',
  'MRO': 'mro',
  'CLEANING': 'cleaning'
};

const CATEGORY_CONFIG = {
  aog: {
    label: 'AOG',
    color: 'red',
    icon: 'AlertCircle',
    priority: 1,
    description: 'Aircraft On Ground - Critical'
  },
  unscheduled: {
    label: 'U-MX',
    color: 'amber',
    icon: 'Wrench',
    priority: 2,
    description: 'Unscheduled Maintenance'
  },
  scheduled: {
    label: 'S-MX',
    color: 'blue',
    icon: 'Calendar',
    priority: 3,
    description: 'Scheduled Maintenance'
  },
  mro: {
    label: 'MRO',
    color: 'purple',
    icon: 'Building2',
    priority: 4,
    description: 'Maintenance Repair Overhaul'
  },
  cleaning: {
    label: 'CLEANING',
    color: 'green',
    icon: 'Sparkles',
    priority: 5,
    description: 'Operational Cleaning'
  }
};
```

### 3. Import Flow

#### Step 1: Template Download

```
User clicks "Download Template" 
  → ExcelTemplateService.generateTemplate('aog_events')
  → Returns Excel file with Data and Instructions sheets
  → User fills in data
```

#### Step 2: File Upload and Validation

```
User uploads Excel file
  → ImportController.uploadForPreview()
  → ExcelParserService.parseExcelFile()
  → Validates each row:
      - Aircraft exists in database
      - Category is valid
      - Dates are valid
      - Start Date <= Finish Date (if provided)
  → Returns ParseResult with validRows and invalidRows
  → Frontend displays preview with validation summary
```

#### Step 3: Import Confirmation

```
User confirms import
  → ImportController.confirmImport()
  → ImportService.processAOGImport()
  → For each valid row:
      - Look up aircraftId by registration
      - Combine Start Date + Time → detectedAt
      - Combine Finish Date + Time → clearedAt (or null)
      - Map category (AOG → 'aog', S-MX → 'scheduled', etc.)
      - Set defaults (responsibleParty='Other', actionTaken='See defect description')
      - Calculate durationHours
      - Set status ('active' if clearedAt is null, else 'resolved')
      - Set isImported=true
      - Create AOGEvent document
  → Returns import summary (imported, skipped, errors)
```

### 4. API Endpoints

#### Import Endpoints (Existing)

```typescript
GET  /api/import/template/aog_events
  → Download Excel template
  → Returns: Excel file buffer

POST /api/import/preview
  → Upload Excel file for validation
  → Body: multipart/form-data with file
  → Returns: { totalRows, validRows, invalidRows, errors[] }

POST /api/import/confirm
  → Confirm and process import
  → Body: { importType: 'aog_events', validatedData: ParsedRow[] }
  → Returns: { imported, skipped, errors[] }
```

#### AOG Event Endpoints (New/Enhanced)

```typescript
GET  /api/aog-events
  → List AOG events with filters
  → Query params: status, category, aircraftId, location, startDate, endDate, page, limit
  → Returns: { events: AOGEvent[], total, page, limit }

GET  /api/aog-events/:id
  → Get single event details
  → Returns: AOGEvent with aircraft details

PUT  /api/aog-events/:id
  → Update event (e.g., mark as resolved)
  → Body: { clearedAt?, category?, reasonCode?, location? }
  → Returns: Updated AOGEvent

GET  /api/aog-events/active
  → Get all active events
  → Returns: AOGEvent[]

GET  /api/aog-events/active/count
  → Get count of active events
  → Returns: { count: number }
```

#### Analytics Endpoints (New)

```typescript
GET  /api/aog-events/analytics/category-breakdown
  → Get event count and percentage by category
  → Query params: startDate, endDate, aircraftId
  → Returns: { 
      categories: [
        { category: 'aog', count: 45, percentage: 38, totalHours: 1240 },
        { category: 'scheduled', count: 32, percentage: 27, totalHours: 890 },
        ...
      ]
    }

GET  /api/aog-events/analytics/location-heatmap
  → Get top locations by event count
  → Query params: startDate, endDate, limit (default: 5)
  → Returns: {
      locations: [
        { location: 'OERK', count: 52, percentage: 44 },
        { location: 'LFSB', count: 28, percentage: 24 },
        ...
      ]
    }

GET  /api/aog-events/analytics/duration-distribution
  → Get event count by duration ranges
  → Query params: startDate, endDate
  → Returns: {
      ranges: [
        { range: '< 24 hours', count: 42, percentage: 35 },
        { range: '1-7 days', count: 51, percentage: 43 },
        { range: '1-4 weeks', count: 18, percentage: 15 },
        { range: '> 1 month', count: 7, percentage: 6 }
      ]
    }

GET  /api/aog-events/analytics/aircraft-reliability
  → Get aircraft ranked by event count and downtime
  → Query params: startDate, endDate
  → Returns: {
      mostReliable: [
        { aircraftId, registration, eventCount: 2, totalHours: 45 },
        ...
      ],
      needsAttention: [
        { aircraftId, registration, eventCount: 12, totalHours: 1240 },
        ...
      ]
    }

GET  /api/aog-events/analytics/monthly-trend
  → Get event count by month
  → Query params: startDate, endDate
  → Returns: {
      months: [
        { month: '2024-01', count: 8, totalHours: 320 },
        { month: '2024-02', count: 12, totalHours: 480 },
        ...
      ]
    }

GET  /api/aog-events/analytics/insights
  → Get auto-generated insights
  → Query params: startDate, endDate
  → Returns: {
      topProblemAircraft: [
        { registration: 'HZ-A25', eventCount: 12, totalHours: 1240 },
        ...
      ],
      mostCommonIssues: [
        { issue: 'Hydraulic leak', count: 15 },
        ...
      ],
      busiestLocations: [
        { location: 'OERK', count: 52 },
        ...
      ],
      averageResolutionTime: {
        aog: 48,
        scheduled: 120,
        unscheduled: 36,
        mro: 720,
        cleaning: 12
      },
      fleetHealthScore: 75  // 0-100 based on event frequency and duration
    }
```

#### Dashboard Endpoints (Enhanced)

```typescript
GET  /api/dashboard/aog-summary
  → Get AOG summary for dashboard
  → Query params: period (default: 'current_month')
  → Returns: {
      activeCount: 3,
      totalThisMonth: 12,
      avgDurationHours: 48,
      totalDowntimeHours: 1240,
      activeEvents: [
        { id, aircraft, defect, location, durationHours },
        ...
      ],
      unavailableAircraft: [
        { registration, reason, durationDays },
        ...
      ],
      trendData: [
        { month: '2024-08', count: 10 },
        ...
      ]
    }
```

## Error Handling

### Import Validation Errors

```typescript
interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

// Example errors:
{
  row: 5,
  field: 'aircraft',
  message: 'Aircraft registration not found: HZ-XYZ',
  value: 'HZ-XYZ'
}

{
  row: 12,
  field: 'startDate',
  message: 'Invalid date format. Expected YYYY-MM-DD',
  value: '01/15/2024'
}

{
  row: 18,
  field: 'finishDate',
  message: 'Finish Date must be >= Start Date',
  value: '2024-01-10'
}
```

### API Error Responses

```typescript
// 400 Bad Request
{
  statusCode: 400,
  message: 'Invalid category value',
  error: 'Bad Request'
}

// 404 Not Found
{
  statusCode: 404,
  message: 'AOG event not found',
  error: 'Not Found'
}

// 422 Unprocessable Entity
{
  statusCode: 422,
  message: 'Validation failed',
  errors: [
    { field: 'clearedAt', message: 'Must be >= detectedAt' }
  ]
}
```

## Testing Strategy

**Note**: Property-based testing and unit testing are skipped for fast iteration. Focus on manual testing and integration testing.

### Manual Testing Checklist

1. **Import Flow**
   - Download template
   - Fill with sample data
   - Upload and validate
   - Confirm import
   - Verify events in list

2. **Event List**
   - View all events
   - Filter by status (Active/Resolved)
   - Filter by category
   - Search by defect description
   - Sort by columns
   - Check pagination

3. **Event Detail**
   - View active event
   - View resolved event
   - Check status badge
   - Check duration calculation
   - Edit event
   - Mark as resolved

4. **Analytics**
   - Category breakdown chart
   - Location heatmap
   - Duration distribution
   - Aircraft reliability ranking
   - Monthly trend
   - Insights generation

5. **Dashboard**
   - Active AOG count
   - Total this month
   - Avg duration
   - Total downtime
   - Active events list
   - Unavailable aircraft
   - Trend chart

### Integration Testing

- Test with real client data (2024-2026 Excel file)
- Verify all 200+ events import correctly
- Check active events are identified
- Verify analytics calculations
- Test dashboard widgets

## Implementation Notes

### Phase 1: Core Import (Priority 1)
- Update ExcelTemplateService with simplified AOG template
- Update ExcelParserService with AOG validation
- Update ImportService with AOG processing
- Test with client data

### Phase 2: UI Enhancements (Priority 1)
- AOG List page with status badges, category badges, filters
- AOG Detail page with clear status indicator
- Quick stats cards on list page

### Phase 3: Analytics (Priority 2)
- Category breakdown endpoint and chart
- Location heatmap endpoint and chart
- Duration distribution endpoint and chart
- Aircraft reliability endpoint and ranking
- Monthly trend endpoint and chart
- Insights generation endpoint

### Phase 4: Dashboard Integration (Priority 2)
- AOG summary endpoint
- Dashboard widgets (4 metric cards)
- Active events list
- Unavailable aircraft section
- Mini trend chart

### Phase 5: Polish (Priority 3)
- Export functionality
- Bulk operations
- Advanced filters
- Mobile responsiveness
