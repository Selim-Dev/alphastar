# Daily Status Management - Design Document

## Overview

The Daily Status Management feature provides a comprehensive interface for managing aircraft availability data that drives fleet availability calculations. This feature bridges the critical gap between the backend daily status data and user interaction, enabling maintenance coordinators to input, view, and manage the primary data source for fleet availability KPIs.

## Architecture

### Frontend Architecture
- **Page Component**: `DailyStatusPage.tsx` - Main page container with filters and data table
- **Form Components**: `DailyStatusForm.tsx` - Create/edit form with validation
- **Summary Components**: `DailyStatusSummary.tsx` - KPI cards and trend charts
- **Custom Hook**: `useDailyStatus.ts` - Already exists, will be extended
- **Navigation**: Add "Daily Status" to Operations section in sidebar

### Backend Architecture
- **Existing API**: `/api/daily-status` endpoints already implemented
- **Data Model**: `DailyStatus` schema already exists with required fields
- **Import Service**: Extend existing Excel import service for daily status templates

## Components and Interfaces

### DailyStatusPage Component
```typescript
interface DailyStatusPageProps {}

interface DailyStatusFilters {
  dateRange: { startDate: Date; endDate: Date };
  aircraftId?: string;
  fleetGroup?: string;
  availabilityThreshold?: number;
}
```

### DailyStatusForm Component
```typescript
interface DailyStatusFormProps {
  initialData?: DailyStatus;
  onSubmit: (data: DailyStatusFormData) => void;
  onCancel: () => void;
}

interface DailyStatusFormData {
  aircraftId: string;
  date: Date;
  posHours: number;
  nmcmSHours: number;
  nmcmUHours: number;
  nmcsHours?: number;
  notes?: string;
}
```

### DailyStatusSummary Component
```typescript
interface DailyStatusSummaryProps {
  filters: DailyStatusFilters;
}

interface SummaryStats {
  averageAvailability: number;
  totalAircraftTracked: number;
  recordsWithDowntime: number;
  belowThresholdCount: number;
}
```

## Data Models

### Existing DailyStatus Schema
The backend already has the complete schema:
```typescript
interface DailyStatus {
  _id: string;
  aircraftId: string;
  date: Date;
  posHours: number;        // Default: 24
  fmcHours: number;        // Calculated: posHours - downtime
  nmcmSHours: number;      // Scheduled maintenance downtime
  nmcmUHours: number;      // Unscheduled maintenance downtime
  nmcsHours?: number;      // Supply-related downtime
  notes?: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Calculated Fields
```typescript
interface DailyStatusWithCalculations extends DailyStatus {
  availabilityPercentage: number; // (fmcHours / posHours) * 100
  totalDowntime: number;          // nmcmSHours + nmcmUHours + (nmcsHours || 0)
  aircraftRegistration: string;   // Populated from aircraft reference
  fleetGroup: string;             // Populated from aircraft reference
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Availability percentage calculation accuracy
*For any* daily status record with valid hour values, the calculated availability percentage should equal (fmcHours / posHours) * 100
**Validates: Requirements 1.3**

Property 2: Filter result consistency
*For any* combination of date range, aircraft, and fleet group filters, all returned records should match the specified filter criteria
**Validates: Requirements 1.2**

Property 3: Table sorting correctness
*For any* column in the daily status table, sorting should produce records in the correct ascending or descending order based on that column's values
**Validates: Requirements 1.4**

Property 4: Availability threshold highlighting
*For any* daily status record, records with availability below 85% should have amber styling and records below 70% should have red styling
**Validates: Requirements 1.5**

Property 5: POS hours validation
*For any* daily status form submission, POS hours values outside the range 0-24 should be rejected with appropriate error messages
**Validates: Requirements 2.2**

Property 6: FMC hours automatic calculation
*For any* combination of POS hours and downtime hours, FMC hours should automatically equal POS hours minus the sum of all downtime categories
**Validates: Requirements 2.3**

Property 7: Duplicate record prevention
*For any* aircraft and date combination, attempting to create a second daily status record should be rejected by the system
**Validates: Requirements 2.4**

Property 8: Dashboard refresh on record creation
*For any* successful daily status record creation, the fleet availability KPI on the dashboard should reflect the updated data
**Validates: Requirements 2.5**

Property 9: Downtime hours validation
*For any* daily status record, the sum of all downtime hours should never exceed the POS hours value
**Validates: Requirements 3.2**

Property 10: Audit trail maintenance
*For any* daily status record update, the updatedBy and updatedAt fields should be correctly set to reflect who made the change and when
**Validates: Requirements 3.3**

Property 11: Metrics recalculation on update
*For any* daily status record update, fleet availability metrics should be recalculated immediately to reflect the changes
**Validates: Requirements 3.4**

Property 12: Import validation completeness
*For any* Excel file uploaded for daily status import, all required fields and data formats should be validated before processing
**Validates: Requirements 4.2**

Property 13: Import duplicate handling
*For any* import file containing duplicate records, the system should skip duplicates and accurately report the count of skipped items
**Validates: Requirements 4.3**

Property 14: Import referential integrity
*For any* daily status import, all aircraft registrations referenced in the import data should exist in the system or be rejected
**Validates: Requirements 4.4**

Property 15: Trend chart data accuracy
*For any* selected time period, the availability trend chart should display data points that accurately reflect the calculated fleet availability for each time interval
**Validates: Requirements 5.2**

Property 16: Downtime pattern analysis
*For any* set of daily status records, the breakdown of scheduled vs unscheduled maintenance hours should accurately sum the respective downtime categories
**Validates: Requirements 5.3**

Property 17: Threshold counting accuracy
*For any* availability threshold value, the count of aircraft below that threshold should accurately reflect the number of aircraft with availability percentages below the threshold
**Validates: Requirements 5.4**

Property 18: Filter-responsive statistics
*For any* change in applied filters, summary statistics should recalculate to reflect only the filtered data set
**Validates: Requirements 5.5**

Property 19: Role-based UI element visibility
*For any* user role, action buttons and UI elements should be visible only if the user has permission to perform those actions
**Validates: Requirements 6.5**

Property 20: Export filter consistency
*For any* active filter combination, the exported Excel file should contain only the records that match the current filter criteria
**Validates: Requirements 7.1**

Property 21: Export data completeness
*For any* export operation, the generated file should include both raw daily status data and calculated availability percentages
**Validates: Requirements 7.2**

Property 22: Export formatting correctness
*For any* exported daily status file, dates should be in Excel date format and numbers should be properly formatted for Excel calculations
**Validates: Requirements 7.3**

Property 23: Export structure integrity
*For any* export file, column headers should be present and data relationships should be maintained correctly
**Validates: Requirements 7.4**

## Error Handling

### Frontend Error Handling
- **Form Validation**: Real-time validation with clear error messages for invalid hour values
- **API Errors**: Toast notifications for network failures with retry options
- **Import Errors**: Detailed error tables showing row-level validation failures
- **Loading States**: Skeleton components during data fetching
- **Empty States**: Helpful messages when no data is available with action buttons

### Backend Error Handling
- **Validation Errors**: Structured error responses with field-specific messages
- **Duplicate Prevention**: Clear error messages for duplicate aircraft/date combinations
- **Referential Integrity**: Descriptive errors for invalid aircraft references
- **Business Rule Violations**: Specific errors for invalid hour calculations
- **Import Processing**: Detailed error logging with row numbers and specific issues

### Error Recovery
- **Auto-save**: Form data preserved during navigation or errors
- **Retry Mechanisms**: Automatic retry for transient network failures
- **Graceful Degradation**: Core functionality available even if some features fail
- **User Guidance**: Clear next steps provided for all error scenarios

## Testing Strategy

### Unit Testing
- **Form Validation**: Test all validation rules for hour inputs and calculations
- **Data Transformations**: Test availability percentage calculations and data formatting
- **Component Rendering**: Test conditional rendering based on user roles and data states
- **API Integration**: Mock API responses to test error handling and success flows

### Property-Based Testing
The system will use **fast-check** (JavaScript property-based testing library) to verify correctness properties:

- **Minimum 100 iterations** per property test to ensure thorough coverage
- **Custom generators** for realistic daily status data (valid hour ranges, aircraft references)
- **Shrinking capabilities** to find minimal failing examples
- **Integration with Jest** for seamless test execution

Each property-based test will include a comment referencing the specific correctness property from this design document using the format:
`// **Feature: daily-status-management, Property X: [property description]**`

### Integration Testing
- **End-to-End Workflows**: Test complete user journeys from data entry to dashboard updates
- **Import Process**: Test full import workflow with various Excel file scenarios
- **Cross-Module Integration**: Verify dashboard KPI updates when daily status changes
- **Role-Based Access**: Test permission enforcement across all user roles

### Performance Testing
- **Large Dataset Handling**: Test with thousands of daily status records
- **Import Performance**: Measure import speed with large Excel files
- **Dashboard Refresh**: Ensure KPI recalculation completes within acceptable time
- **Concurrent Users**: Test multiple users editing daily status simultaneously

## Implementation Architecture

### Navigation Integration
Add "Daily Status" to the Operations section in `Sidebar.tsx`:
```typescript
{
  label: 'Operations',
  items: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/availability', label: 'Fleet Availability', icon: Plane },
    { path: '/daily-status', label: 'Daily Status', icon: Calendar }, // NEW
  ],
}
```

### Backend Integration
Extend existing services without breaking changes:

1. **Import Service**: Add `ImportType.DailyStatus` enum value
2. **Excel Parser**: Add daily status template definition
3. **Excel Template**: Create daily status template with proper validation
4. **API Routes**: Daily status endpoints already exist, no changes needed

### Frontend Architecture
```
src/pages/DailyStatusPage.tsx          // Main page component
src/components/daily-status/
  ├── DailyStatusTable.tsx             // Data table with filters
  ├── DailyStatusForm.tsx              // Create/edit form
  ├── DailyStatusSummary.tsx           // KPI cards and charts
  ├── DailyStatusFilters.tsx           // Filter controls
  └── DailyStatusImport.tsx            // Import integration
```

### State Management
- **TanStack Query**: Extend existing `useDailyStatus` hook
- **Form State**: React Hook Form with Zod validation
- **Filter State**: URL-based state management for shareable links
- **Cache Invalidation**: Automatic refresh of dashboard queries

### Database Integration
No schema changes required - daily status schema already exists:
- Uses existing `DailyStatus` collection
- Leverages existing indexes for performance
- Maintains audit trail with `updatedBy` field

This design ensures seamless integration with the existing Alpha Star Aviation KPI Dashboard while providing a modern, intuitive interface for managing the critical daily status data that drives fleet availability calculations.
