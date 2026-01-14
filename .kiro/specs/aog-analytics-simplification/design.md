# Design Document: AOG Analytics Simplification

## Overview

This design document describes the simplification of the AOG (Aircraft On Ground) workflow and analytics system. The current 18-state workflow is being replaced with a streamlined milestone-based approach that focuses on three primary downtime buckets: Technical, Procurement, and Ops. This simplification improves usability for MCC operators while providing accurate, actionable analytics for management.

The design also includes dashboard enhancements: removing less valuable components (OperationalEfficiencyPanel, InsightsPanel, CostEfficiencyCard) and adding a "Coming Soon" section for upcoming features.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  DashboardPage          │  AOGAnalyticsPage    │  AOGDetailPage     │
│  - Fleet Health Gauge   │  - Three-Bucket      │  - Milestone       │
│  - Status Summary       │    Breakdown Chart   │    Timeline        │
│  - KPI Cards            │  - Downtime Summary  │  - Cost Summary    │
│  - Coming Soon Section  │  - Event Timeline    │  - Edit Form       │
│  (removed: Insights,    │                      │                    │
│   CostEfficiency,       │                      │                    │
│   OperationalEfficiency)│                      │                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                            │
├─────────────────────────────────────────────────────────────────────┤
│  AOGEventsController                                                │
│  ├── GET /aog-events                    (list with filters)        │
│  ├── GET /aog-events/:id                (single event)             │
│  ├── POST /aog-events                   (create)                   │
│  ├── PUT /aog-events/:id                (update)                   │
│  ├── GET /aog-events/analytics          (downtime by responsibility)│
│  └── GET /aog-events/analytics/buckets  (three-bucket breakdown)   │
│                                                                     │
│  DashboardController (simplified)                                   │
│  ├── GET /dashboard/kpis                                           │
│  ├── GET /dashboard/trends                                         │
│  ├── GET /dashboard/health-score                                   │
│  ├── GET /dashboard/alerts                                         │
│  └── (removed: /operational-efficiency, /insights, /cost-efficiency)│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MongoDB                                     │
├─────────────────────────────────────────────────────────────────────┤
│  aogevents collection                                               │
│  - Existing fields preserved                                        │
│  - New milestone timestamp fields                                   │
│  - Computed downtime metrics                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Simplified Workflow States

The 18-state workflow is replaced with 7 milestone timestamps:

```
┌──────────┐    ┌─────────────────────┐    ┌───────────────────┐
│ Reported │───▶│ Procurement         │───▶│ Available at      │
│          │    │ Requested           │    │ Store             │
└──────────┘    │ (optional)          │    │ (optional)        │
     │          └─────────────────────┘    └───────────────────┘
     │                                              │
     │          ┌─────────────────────┐             │
     │          │ Issued Back         │◀────────────┘
     │          │ (optional)          │
     │          └─────────────────────┘
     │                    │
     ▼                    ▼
┌──────────────────────────────────────┐
│ Installation Complete                │
└──────────────────────────────────────┘
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
┌──────────┐                ┌──────────────┐
│ Test     │───────────────▶│ Up & Running │
│ Start    │                │              │
│(optional)│                └──────────────┘
└──────────┘
```

### Three-Bucket Downtime Model

```
Total Downtime = Technical Time + Procurement Time + Ops Time

Technical Time = (Reported → Procurement Requested) 
               + (Available at Store → Installation Complete)

Procurement Time = (Procurement Requested → Available at Store)

Ops Time = (Test Start → Up & Running)
```

**Special Cases:**
- No part needed: Procurement Time = 0 (skip procurement milestones)
- Part in store: Procurement Time = 0 (Available at Store = Reported)
- No ops test: Ops Time = 0 (skip Test Start milestone)

## Components and Interfaces

### Backend Components

#### AOGEvent Schema (Extended)

```typescript
// New milestone timestamp fields added to existing schema
interface AOGMilestones {
  reportedAt: Date;                    // Required - same as detectedAt
  procurementRequestedAt?: Date;       // Optional - when parts were requested
  availableAtStoreAt?: Date;           // Optional - when parts arrived
  issuedBackAt?: Date;                 // Optional - when parts issued to maintenance
  installationCompleteAt?: Date;       // Required for closed events
  testStartAt?: Date;                  // Optional - when ops testing started
  upAndRunningAt?: Date;               // Required for closed events - same as clearedAt
}

// Computed metrics stored on the record
interface AOGComputedMetrics {
  technicalTimeHours: number;          // Computed Technical bucket
  procurementTimeHours: number;        // Computed Procurement bucket
  opsTimeHours: number;                // Computed Ops bucket
  totalDowntimeHours: number;          // Total from Reported to Up & Running
}

// Simplified cost structure
interface AOGCosts {
  internalCost: number;                // Labor and man-hours
  externalCost: number;                // Vendor and third-party
  totalCost: number;                   // Computed: internal + external
  // Legacy fields preserved for backward compatibility
  costLabor?: number;
  costParts?: number;
  costExternal?: number;
}
```

#### AOGEventsService (Extended Methods)

```typescript
interface AOGEventsService {
  // Existing methods preserved
  create(dto: CreateAOGEventDto, userId: string): Promise<AOGEventDocument>;
  findById(id: string): Promise<AOGEventWithMetrics | null>;
  findAll(filter?: AOGEventFilter): Promise<AOGEventWithMetrics[]>;
  update(id: string, dto: UpdateAOGEventDto, userId: string): Promise<AOGEventDocument>;
  delete(id: string): Promise<AOGEventDocument | null>;
  
  // New/modified methods
  computeDowntimeMetrics(event: AOGEvent): AOGComputedMetrics;
  updateMilestone(id: string, milestone: string, timestamp: Date, userId: string): Promise<AOGEventDocument>;
  getThreeBucketAnalytics(filter: AOGAnalyticsFilter): Promise<ThreeBucketAnalytics>;
  
  // Removed methods (from old 18-state workflow)
  // transitionStatus() - no longer needed
  // getStageBreakdown() - replaced by getThreeBucketAnalytics()
  // getBottleneckAnalytics() - replaced by getThreeBucketAnalytics()
}
```

#### New Analytics Endpoint

```typescript
// GET /api/aog-events/analytics/buckets
interface ThreeBucketAnalytics {
  summary: {
    totalEvents: number;
    activeEvents: number;
    totalDowntimeHours: number;
    averageDowntimeHours: number;
  };
  buckets: {
    technical: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
    procurement: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
    ops: {
      totalHours: number;
      averageHours: number;
      percentage: number;
    };
  };
  byAircraft: Array<{
    aircraftId: string;
    registration: string;
    technicalHours: number;
    procurementHours: number;
    opsHours: number;
    totalHours: number;
  }>;
}
```

### Frontend Components

#### Dashboard Changes

**Components to Remove:**
- `OperationalEfficiencyPanel` - MTBF/MTTR metrics not client-relevant
- `InsightsPanel` - Automated insights not valuable for this use case
- `CostEfficiencyCard` - Cost per flight hour not needed

**New Component: ComingSoonSection**

```typescript
interface ComingSoonSectionProps {
  className?: string;
}

// Displays placeholder tiles for upcoming features
// - "Aircraft at MRO" tile
// - "Vacation Plan" tile
// No backend API calls required
```

#### AOG Analytics Page Updates

```typescript
// Updated AOGAnalyticsPage component structure
interface AOGAnalyticsPageState {
  dateRange: DateRange;
  aircraftFilter: string;
  fleetFilter: string;
}

// New chart: Three-Bucket Breakdown
interface ThreeBucketChartProps {
  data: ThreeBucketAnalytics;
  isLoading: boolean;
}

// Updated summary cards
interface DowntimeSummaryProps {
  totalDowntime: number;
  technicalTime: number;
  procurementTime: number;
  opsTime: number;
  eventCount: number;
}
```

#### AOG Detail Page Updates

```typescript
// Simplified milestone timeline
interface MilestoneTimelineProps {
  milestones: {
    reported: Date;
    procurementRequested?: Date;
    availableAtStore?: Date;
    issuedBack?: Date;
    installationComplete?: Date;
    testStart?: Date;
    upAndRunning?: Date;
  };
  computedMetrics: AOGComputedMetrics;
}

// Simplified cost display
interface CostSummaryProps {
  internalCost: number;
  externalCost: number;
  totalCost: number;
}
```

## Data Models

### AOGEvent Schema (Updated)

```typescript
@Schema(baseSchemaOptions)
export class AOGEvent {
  // Existing fields preserved
  @Prop({ type: Types.ObjectId, ref: 'Aircraft', required: true, index: true })
  aircraftId: Types.ObjectId;

  @Prop({ required: true })
  detectedAt: Date;  // Authoritative start timestamp

  @Prop()
  clearedAt?: Date;  // Authoritative end timestamp

  @Prop({ required: true, enum: AOGCategory })
  category: AOGCategory;

  @Prop({ required: true })
  reasonCode: string;

  @Prop({ required: true, enum: ResponsibleParty, index: true })
  responsibleParty: ResponsibleParty;

  @Prop({ required: true })
  actionTaken: string;

  @Prop({ required: true, min: 0 })
  manpowerCount: number;

  @Prop({ required: true, min: 0 })
  manHours: number;

  // NEW: Milestone timestamps
  @Prop()
  reportedAt?: Date;  // Defaults to detectedAt

  @Prop()
  procurementRequestedAt?: Date;

  @Prop()
  availableAtStoreAt?: Date;

  @Prop()
  issuedBackAt?: Date;

  @Prop()
  installationCompleteAt?: Date;

  @Prop()
  testStartAt?: Date;

  @Prop()
  upAndRunningAt?: Date;  // Defaults to clearedAt

  // NEW: Computed metrics (stored for performance)
  @Prop({ min: 0, default: 0 })
  technicalTimeHours: number;

  @Prop({ min: 0, default: 0 })
  procurementTimeHours: number;

  @Prop({ min: 0, default: 0 })
  opsTimeHours: number;

  @Prop({ min: 0, default: 0 })
  totalDowntimeHours: number;

  // NEW: Simplified cost fields
  @Prop({ min: 0, default: 0 })
  internalCost: number;

  @Prop({ min: 0, default: 0 })
  externalCost: number;

  // Legacy cost fields preserved
  @Prop({ min: 0 })
  costLabor?: number;

  @Prop({ min: 0 })
  costParts?: number;

  @Prop({ min: 0 })
  costExternal?: number;

  // Existing fields preserved
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updatedBy: Types.ObjectId;

  // Legacy indicator for events without new milestone fields
  @Prop({ type: Boolean })
  isLegacy?: boolean;

  // Timestamp tracking for milestones
  @Prop({ type: [MilestoneHistoryEntrySchema], default: [] })
  milestoneHistory: MilestoneHistoryEntry[];
}

// Sub-document for milestone history
@Schema({ _id: false })
export class MilestoneHistoryEntry {
  @Prop({ required: true })
  milestone: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;
}
```

### DTOs

```typescript
// Create AOG Event DTO (updated)
export class CreateAOGEventDto {
  @IsString()
  aircraftId: string;

  @IsDateString()
  detectedAt: string;

  @IsOptional()
  @IsDateString()
  clearedAt?: string;

  @IsEnum(AOGCategory)
  category: AOGCategory;

  @IsString()
  reasonCode: string;

  @IsEnum(ResponsibleParty)
  responsibleParty: ResponsibleParty;

  @IsString()
  actionTaken: string;

  @IsNumber()
  @Min(0)
  manpowerCount: number;

  @IsNumber()
  @Min(0)
  manHours: number;

  // New milestone fields
  @IsOptional()
  @IsDateString()
  procurementRequestedAt?: string;

  @IsOptional()
  @IsDateString()
  availableAtStoreAt?: string;

  @IsOptional()
  @IsDateString()
  issuedBackAt?: string;

  @IsOptional()
  @IsDateString()
  installationCompleteAt?: string;

  @IsOptional()
  @IsDateString()
  testStartAt?: string;

  // Simplified cost fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  internalCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  externalCost?: number;
}

// Analytics Filter DTO
export class AOGAnalyticsFilterDto {
  @IsOptional()
  @IsString()
  aircraftId?: string;

  @IsOptional()
  @IsString()
  fleetGroup?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Milestone Timestamp Flexibility

*For any* AOG event, the system should allow procurement milestones (procurementRequestedAt, availableAtStoreAt, issuedBackAt) and ops milestone (testStartAt) to be null while still allowing the event to be marked as resolved (upAndRunningAt set).

**Validates: Requirements 1.3, 1.4, 1.5, 3.3**

### Property 2: Three-Bucket Downtime Calculation Correctness

*For any* AOG event with valid milestone timestamps, the computed downtime metrics should satisfy:
- technicalTimeHours = hours(reportedAt → procurementRequestedAt) + hours(availableAtStoreAt → installationCompleteAt)
- procurementTimeHours = hours(procurementRequestedAt → availableAtStoreAt)
- opsTimeHours = hours(testStartAt → upAndRunningAt)
- totalDowntimeHours = hours(reportedAt → upAndRunningAt)

**Validates: Requirements 2.1, 2.2, 2.3, 2.7**

### Property 3: Zero-Value Handling for Missing Milestones

*For any* AOG event where procurement milestones are null, procurementTimeHours should equal 0. *For any* AOG event where testStartAt is null, opsTimeHours should equal 0.

**Validates: Requirements 2.4, 2.5, 2.6**

### Property 4: Timestamp Chronological Ordering Validation

*For any* AOG event with multiple milestone timestamps set, the system should reject timestamps that violate chronological order: reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt ≤ issuedBackAt ≤ installationCompleteAt ≤ testStartAt ≤ upAndRunningAt.

**Validates: Requirements 3.2, 9.4**

### Property 5: Total Cost Calculation

*For any* AOG event with cost values, totalCost should equal internalCost + externalCost.

**Validates: Requirements 4.3**

### Property 6: Aggregation Consistency

*For any* set of AOG events matching a filter, the sum of individual event downtime metrics should equal the aggregated totals returned by the analytics endpoint. The three bucket percentages should sum to 100% (within rounding tolerance).

**Validates: Requirements 5.2, 5.3, 5.4, 6.2, 6.3**

### Property 7: Legacy Event Backward Compatibility

*For any* existing AOG event without new milestone fields, the system should:
- Preserve all existing field values
- Compute metrics using detectedAt as reportedAt and clearedAt as upAndRunningAt
- Set isLegacy flag to true
- Not cause errors when displayed or queried

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 8: Import Validation

*For any* AOG event import, the system should:
- Reject events with out-of-order timestamps
- Reject events with non-existent aircraft registrations
- Compute and store downtime metrics after successful import

**Validates: Requirements 9.2, 9.4, 9.5**

## Error Handling

### Validation Errors

| Error Code | Condition | HTTP Status | Message |
|------------|-----------|-------------|---------|
| INVALID_TIMESTAMP_ORDER | Milestone timestamps out of order | 400 | "Timestamp {milestone} cannot be before {previousMilestone}" |
| AIRCRAFT_NOT_FOUND | Aircraft ID doesn't exist | 400 | "Aircraft with ID {id} not found" |
| MISSING_REQUIRED_MILESTONE | Required milestone missing for closed event | 400 | "Installation Complete and Up & Running required for closed events" |
| INVALID_COST_VALUE | Negative cost value | 400 | "Cost values must be non-negative" |

### Computation Errors

| Error Code | Condition | Handling |
|------------|-----------|----------|
| MISSING_TIMESTAMPS | Cannot compute metrics due to missing timestamps | Set computed values to 0, log warning |
| LEGACY_EVENT | Event lacks new milestone fields | Use detectedAt/clearedAt, set isLegacy=true |

### API Error Responses

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: {
    field?: string;
    constraint?: string;
  };
}
```

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Downtime Calculation Tests**
   - Test Technical Time calculation with all milestones present
   - Test Procurement Time = 0 when no procurement milestones
   - Test Ops Time = 0 when no testStartAt
   - Test edge case: all milestones at same timestamp

2. **Validation Tests**
   - Test timestamp ordering validation
   - Test required milestone validation for closed events
   - Test cost value validation

3. **Legacy Compatibility Tests**
   - Test legacy event detection
   - Test metric computation for legacy events
   - Test display of legacy events

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs using fast-check:

1. **Property Test: Downtime Calculation Correctness**
   - Generate random valid milestone timestamps
   - Verify computed metrics match expected formulas
   - Tag: **Feature: aog-analytics-simplification, Property 2: Three-Bucket Downtime Calculation Correctness**

2. **Property Test: Zero-Value Handling**
   - Generate events with various null milestone combinations
   - Verify appropriate bucket values are 0
   - Tag: **Feature: aog-analytics-simplification, Property 3: Zero-Value Handling for Missing Milestones**

3. **Property Test: Timestamp Ordering Validation**
   - Generate random timestamp sequences (both valid and invalid)
   - Verify validation correctly accepts/rejects
   - Tag: **Feature: aog-analytics-simplification, Property 4: Timestamp Chronological Ordering Validation**

4. **Property Test: Aggregation Consistency**
   - Generate multiple events with random metrics
   - Verify sum of individual metrics equals aggregated totals
   - Tag: **Feature: aog-analytics-simplification, Property 6: Aggregation Consistency**

### Integration Tests

1. **API Integration Tests**
   - Test full CRUD flow with new milestone fields
   - Test analytics endpoint with various filters
   - Test import/export with milestone timestamps

2. **Dashboard Integration Tests**
   - Verify Coming Soon section renders without API calls
   - Verify removed components don't appear
   - Verify AOG charts use new three-bucket data

### Test Configuration

- Property-based tests: minimum 100 iterations per property
- Use fast-check for TypeScript property-based testing
- Mock MongoDB for unit tests
- Use test database for integration tests
