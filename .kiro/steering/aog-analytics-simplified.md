# AOG Analytics Simplified Model - Developer Guide

## Overview

This document describes the simplified AOG (Aircraft On Ground) analytics model implemented to replace the complex 18-state workflow system. The new model focuses on accurate downtime tracking through milestone timestamps and three-bucket analytics that provide actionable insights for management.

## Three-Bucket Downtime Model

### Concept

The simplified model categorizes all AOG downtime into three primary buckets that represent the major phases of aircraft recovery:

1. **Technical Time** - Time spent on technical troubleshooting and installation work
2. **Procurement Time** - Time spent waiting for parts to arrive
3. **Ops Time** - Time spent on operational testing and validation

### Formula

```
Total Downtime = Technical Time + Procurement Time + Ops Time

Technical Time = (Reported → Procurement Requested) 
               + (Available at Store → Installation Complete)

Procurement Time = (Procurement Requested → Available at Store)

Ops Time = (Test Start → Up & Running)
```

### Why This Model?

The previous 18-state workflow was too complex for operational use. The three-bucket model:
- Clearly identifies bottlenecks (technical issues vs procurement delays vs ops testing)
- Aligns with how management thinks about AOG resolution
- Simplifies data entry while maintaining accuracy
- Provides actionable metrics for process improvement

## Milestone Timestamps

### Required Milestones

| Milestone | Field Name | Description | When to Set |
|-----------|-----------|-------------|-------------|
| Reported | `reportedAt` | When AOG was first detected | Always set (defaults to `detectedAt`) |
| Installation Complete | `installationCompleteAt` | When repair work is finished | Required for closed events |
| Up & Running | `upAndRunningAt` | When aircraft returns to service | Required for closed events (defaults to `clearedAt`) |

### Optional Milestones

| Milestone | Field Name | Description | When to Set |
|-----------|-----------|-------------|-------------|
| Procurement Requested | `procurementRequestedAt` | When parts were requested | Only if parts are needed |
| Available at Store | `availableAtStoreAt` | When parts arrived | Only if parts were ordered |
| Issued Back | `issuedBackAt` | When parts issued to maintenance | Optional tracking point |
| Test Start | `testStartAt` | When ops testing started | Only if ops testing required |

### Chronological Order

Timestamps must follow this order (when present):
```
reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt ≤ issuedBackAt 
≤ installationCompleteAt ≤ testStartAt ≤ upAndRunningAt
```

The system validates this order and rejects out-of-sequence timestamps.

## Special Cases

### Case 1: No Part Needed

**Scenario**: Issue resolved without requiring parts (e.g., software reset, adjustment, cleaning)

**Milestone Pattern**:
- `reportedAt`: Set
- `procurementRequestedAt`: NULL
- `availableAtStoreAt`: NULL
- `issuedBackAt`: NULL
- `installationCompleteAt`: Set
- `testStartAt`: Optional
- `upAndRunningAt`: Set

**Result**:
- Procurement Time = 0
- Technical Time = (reportedAt → installationCompleteAt)
- Ops Time = (testStartAt → upAndRunningAt) OR 0 if no test

### Case 2: Part Already in Store

**Scenario**: Required part is already available in warehouse

**Milestone Pattern**:
- `reportedAt`: Set
- `procurementRequestedAt`: Set (same as or very close to reportedAt)
- `availableAtStoreAt`: Set (same as or very close to procurementRequestedAt)
- `issuedBackAt`: Optional
- `installationCompleteAt`: Set
- `testStartAt`: Optional
- `upAndRunningAt`: Set

**Result**:
- Procurement Time = 0 or near-zero (minutes, not days)
- Technical Time = Most of the downtime
- Ops Time = (testStartAt → upAndRunningAt) OR 0 if no test

### Case 3: No Ops Test Required

**Scenario**: Repair doesn't require operational testing (e.g., cosmetic fix, non-critical system)

**Milestone Pattern**:
- `reportedAt`: Set
- `procurementRequestedAt`: Optional
- `availableAtStoreAt`: Optional
- `issuedBackAt`: Optional
- `installationCompleteAt`: Set
- `testStartAt`: NULL
- `upAndRunningAt`: Set (same as or very close to installationCompleteAt)

**Result**:
- Ops Time = 0
- Technical Time = Includes troubleshooting and installation
- Procurement Time = 0 or actual procurement duration

### Case 4: Complete Workflow (All Milestones)

**Scenario**: Standard AOG requiring parts and testing

**Milestone Pattern**: All milestones set in chronological order

**Result**:
- All three buckets have non-zero values
- Total Downtime = sum of all three buckets
- Clear visibility into where time was spent

## Computed Metrics

### Storage

All computed metrics are stored on the AOG event record for performance:

```typescript
interface AOGComputedMetrics {
  technicalTimeHours: number;      // Computed Technical bucket
  procurementTimeHours: number;    // Computed Procurement bucket
  opsTimeHours: number;            // Computed Ops bucket
  totalDowntimeHours: number;      // Total from Reported to Up & Running
}
```

### Calculation Timing

Metrics are computed:
1. When an AOG event is created (if milestones are provided)
2. When an AOG event is updated (if milestones change)
3. On import (after validation)

### Null Handling

- If a milestone is NULL, the corresponding bucket time is set to 0
- If both endpoints of a calculation are NULL, the bucket is 0
- If only one endpoint is NULL, the calculation is skipped and bucket is 0

## Cost Tracking

### Simplified Cost Structure

The model uses two primary cost categories:

```typescript
interface AOGCosts {
  internalCost: number;    // Labor and man-hours
  externalCost: number;    // Vendor and third-party services
  totalCost: number;       // Computed: internal + external
}
```

### Legacy Cost Fields

For backward compatibility, these fields are preserved but not emphasized:
- `costLabor`
- `costParts`
- `costExternal`

## Analytics Endpoints

### Three-Bucket Analytics

**Endpoint**: `GET /api/aog-events/analytics/buckets`

**Query Parameters**:
- `aircraftId` - Filter by specific aircraft
- `fleetGroup` - Filter by fleet group (A330, A340, etc.)
- `startDate` - Start of date range
- `endDate` - End of date range

**Response**:
```typescript
{
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

## Migration Notes for Legacy Events

### Backward Compatibility

The system handles legacy AOG events (created before the simplified model) gracefully:

1. **Detection**: Events without new milestone fields are flagged with `isLegacy: true`
2. **Metric Computation**: 
   - `reportedAt` defaults to `detectedAt`
   - `upAndRunningAt` defaults to `clearedAt`
   - `totalDowntimeHours` = (clearedAt - detectedAt) in hours
   - All bucket times = 0 (cannot be computed without milestones)
3. **Display**: Legacy events show a badge indicating limited analytics available

### No Migration Required

**Important**: No database migration is required. Legacy events continue to work with existing fields. New events use the milestone-based model.

### Gradual Transition

Teams can transition gradually:
- Continue using existing AOG event creation for simple cases
- Start using milestone timestamps for events where detailed tracking is valuable
- Over time, more events will have detailed analytics

## UI Components

### Milestone Timeline

Displays all milestone timestamps in a vertical timeline with:
- Milestone name and timestamp
- Time elapsed between milestones
- Visual indicators for skipped optional milestones
- Computed bucket times highlighted

### Three-Bucket Chart

Visualizes downtime distribution:
- Bar chart showing hours in each bucket
- Pie chart showing percentage distribution
- Color coding: Technical (blue), Procurement (amber), Ops (green)

### Analytics Page

Provides fleet-wide insights:
- Summary cards for total downtime and event count
- Three-bucket breakdown chart
- Filters for aircraft, fleet group, and date range
- Per-aircraft breakdown table

## Best Practices

### Data Entry

1. **Always set reportedAt**: Defaults to detectedAt but can be adjusted if detection was delayed
2. **Set milestones as they occur**: Don't wait until the end to backfill
3. **Skip optional milestones**: If no parts needed, leave procurement milestones NULL
4. **Validate timestamps**: System will reject out-of-order timestamps
5. **Add notes**: Use the milestone history to document why milestones were set

### Analytics Interpretation

1. **High Procurement Time**: Indicates supply chain issues or part availability problems
2. **High Technical Time**: Indicates complex troubleshooting or installation challenges
3. **High Ops Time**: Indicates testing delays or operational approval bottlenecks
4. **Zero buckets**: Normal for special cases (no part needed, no ops test)

### Process Improvement

Use the three-bucket analytics to:
- Identify which phase is the primary bottleneck
- Compare aircraft or fleet groups to find patterns
- Track improvement over time after process changes
- Set targets for each bucket (e.g., procurement < 48 hours)

## API Reference

### Create AOG Event with Milestones

```typescript
POST /api/aog-events
{
  aircraftId: string;
  detectedAt: string;
  category: 'scheduled' | 'unscheduled' | 'aog';
  reasonCode: string;
  responsibleParty: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other';
  actionTaken: string;
  manpowerCount: number;
  manHours: number;
  
  // New milestone fields (all optional)
  procurementRequestedAt?: string;
  availableAtStoreAt?: string;
  issuedBackAt?: string;
  installationCompleteAt?: string;
  testStartAt?: string;
  
  // Simplified costs
  internalCost?: number;
  externalCost?: number;
}
```

### Update AOG Event Milestones

```typescript
PUT /api/aog-events/:id
{
  // Any milestone fields can be updated
  procurementRequestedAt?: string;
  availableAtStoreAt?: string;
  installationCompleteAt?: string;
  upAndRunningAt?: string;
  
  // System will recompute metrics automatically
}
```

### Get Three-Bucket Analytics

```typescript
GET /api/aog-events/analytics/buckets?aircraftId=xxx&startDate=2025-01-01&endDate=2025-01-31
```

## Troubleshooting

### Issue: Timestamp validation error

**Error**: "Timestamp procurementRequestedAt cannot be before reportedAt"

**Solution**: Ensure milestones are in chronological order. Check that:
- reportedAt is set first
- Each subsequent milestone is >= previous milestone
- No timestamps are in the future

### Issue: Metrics not computing

**Problem**: Computed metrics show 0 even though milestones are set

**Solution**: Check that:
- Both endpoints of the calculation are set (e.g., for Procurement Time, need both procurementRequestedAt and availableAtStoreAt)
- Timestamps are valid dates
- Event has been saved (metrics compute on save)

### Issue: Legacy event shows no bucket breakdown

**Expected**: Legacy events (before simplified model) cannot show bucket breakdown

**Solution**: This is normal. Legacy events show total downtime only. To get bucket breakdown, update the event with milestone timestamps.

## Summary

The simplified AOG analytics model provides:
- ✅ Clear, actionable metrics (three buckets)
- ✅ Flexible milestone tracking (skip what's not needed)
- ✅ Backward compatibility (legacy events still work)
- ✅ Easy data entry (fewer required fields)
- ✅ Powerful analytics (identify bottlenecks)

This model balances simplicity for operators with analytical depth for management, making it practical for daily use while providing strategic insights.

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Related Documents**: 
- `.kiro/specs/aog-analytics-simplification/requirements.md`
- `.kiro/specs/aog-analytics-simplification/design.md`
