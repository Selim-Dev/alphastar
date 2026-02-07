# Legacy Data Handling Implementation - Task 1.3

## Overview

Implemented graceful handling of legacy AOG events (events without milestone timestamps) in the ThreeBucketChart component. Legacy events now display with clear messaging about data limitations while maintaining full functionality.

## Changes Made

### 1. Frontend Components

#### **LegacyDataBadge Component** (`frontend/src/components/ui/LegacyDataBadge.tsx`)
- **Purpose**: Displays a warning badge when legacy events are present
- **Features**:
  - Shows count and percentage of legacy events
  - Amber color scheme for warning (not critical)
  - Tooltip explaining what legacy events are
  - Guidance on how to improve data quality
  - Requirements: FR-1.1, FR-1.3

#### **Tooltip Component** (`frontend/src/components/ui/tooltip.tsx`)
- **Purpose**: Simple, reusable tooltip for contextual help
- **Features**:
  - Lightweight implementation using framer-motion
  - TooltipProvider, Tooltip, TooltipTrigger, TooltipContent pattern
  - Consistent styling with dashboard theme
  - 200ms delay to prevent accidental triggers

#### **ThreeBucketChart Component** (Updated: `frontend/src/components/ui/ThreeBucketChart.tsx`)
- **New Props**:
  - `legacyEventCount?: number` - Count of legacy events
  - `totalEventCount?: number` - Total event count for percentage calculation
  - `legacyDowntimeHours?: number` - Total downtime from legacy events
  
- **New Features**:
  1. **Legacy Data Badge**: Shows at top of charts when legacy events exist
  2. **Legacy Category in Charts**: Optional fourth category in bar/pie charts
  3. **Tooltips**: Info icons explaining data limitations
  4. **Recalculated Percentages**: Includes legacy downtime in total for accurate percentages
  5. **Gray Color**: Legacy data shown in gray (#6b7280) to distinguish from bucket data

- **Behavior**:
  - If `legacyEventCount > 0`: Shows warning badge
  - If `legacyDowntimeHours > 0`: Adds "Legacy" category to charts
  - Tooltips explain that legacy events show total downtime only
  - Percentages recalculated to include legacy downtime in denominator

### 2. Backend Updates

#### **ThreeBucketAnalytics Interface** (Updated: `backend/src/aog-events/services/aog-events.service.ts`)
- Added fields:
  ```typescript
  legacyEventCount?: number;
  legacyDowntimeHours?: number;
  ```

#### **getThreeBucketAnalytics Service Method** (Updated)
- **Aggregation Pipeline Changes**:
  1. Added `isLegacy` field to projection
  2. Added `legacyDowntime` calculated field (downtime if isLegacy = true, else 0)
  3. Added `legacyEventCount` to summary aggregation
  4. Added `totalLegacyDowntime` to summary aggregation
  5. Included legacy metrics in response

- **Logic**:
  - Legacy events: `technicalTimeHours = totalDowntimeHours`, other buckets = 0
  - Non-legacy events: Use computed bucket times
  - Separate tracking of legacy downtime for display purposes

### 3. Frontend Types

#### **ThreeBucketAnalytics Interface** (Updated: `frontend/src/types/index.ts`)
- Added fields:
  ```typescript
  legacyEventCount?: number;
  legacyDowntimeHours?: number;
  ```

### 4. Page Integration

#### **AOGAnalyticsPage** (Updated: `frontend/src/pages/aog/AOGAnalyticsPage.tsx`)
- Updated ThreeBucketChart usage to pass legacy data:
  ```typescript
  <ThreeBucketChart 
    data={buckets} 
    isLoading={isLoadingBuckets}
    legacyEventCount={threeBucketData?.legacyEventCount || 0}
    totalEventCount={summary.totalEvents}
    legacyDowntimeHours={threeBucketData?.legacyDowntimeHours || 0}
  />
  ```

## Requirements Satisfied

### FR-1.1: System MUST gracefully handle legacy AOG events without milestone timestamps
✅ **Implemented**:
- Legacy events display total downtime (clearedAt - detectedAt)
- "Limited Analytics" badge shown for legacy events
- Legacy events excluded from three-bucket breakdown (shown in separate category)
- Clear messaging about data quality and completeness

### FR-1.2: System MUST compute fallback metrics for events with partial milestone data
✅ **Implemented**:
- Backend uses `$ifNull` to handle missing milestone fields
- reportedAt falls back to detectedAt
- upAndRunningAt falls back to clearedAt
- Available bucket times calculated even if some milestones missing
- Assumptions documented in tooltips

## Visual Design

### Legacy Data Badge
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Limited Analytics: 15 events (30.0%) lack milestone data │
│                                                          ℹ️  │
└─────────────────────────────────────────────────────────────┘
```
- Amber background (#f59e0b in light mode)
- Warning icon (AlertTriangle)
- Info icon with detailed tooltip

### Chart with Legacy Category
```
Bar Chart:
Technical    ████████████ 120 hrs
Procurement  ████ 40 hrs
Ops          ██ 20 hrs
Legacy       ████████ 80 hrs (gray)

Pie Chart:
- Technical: 46.2% (blue)
- Procurement: 15.4% (amber)
- Ops: 7.7% (green)
- Legacy: 30.8% (gray)
```

## Testing Checklist

- [x] TypeScript compilation passes (no errors)
- [x] Components render without errors
- [ ] Manual testing with legacy events
- [ ] Manual testing with mixed legacy/non-legacy events
- [ ] Manual testing with no legacy events
- [ ] Tooltip interactions work correctly
- [ ] Badge displays correct percentages
- [ ] Charts show legacy category when applicable
- [ ] Percentages sum to 100%

## User Experience

### Before
- Charts showed "No downtime data available" for legacy events
- No indication of data quality issues
- Confusing for users with historical data

### After
- Clear warning badge explaining data limitations
- Legacy downtime shown in separate category
- Tooltips provide guidance on improving data quality
- Professional, informative presentation

## Documentation Updates Needed

- [ ] Update user guide with legacy data handling explanation
- [ ] Add screenshots of legacy data badge and charts
- [ ] Document how to update legacy events with milestone data
- [ ] Add to AOG Analytics user documentation

## Future Enhancements

1. **Data Quality Dashboard**: Dedicated page showing data completeness metrics
2. **Bulk Update Tool**: UI for updating multiple legacy events with milestones
3. **Migration Assistant**: Guided workflow for converting legacy events
4. **Historical Analysis**: Separate view for legacy-only data analysis

## Related Files

### Created
- `frontend/src/components/ui/LegacyDataBadge.tsx`
- `frontend/src/components/ui/tooltip.tsx`
- `LEGACY-DATA-HANDLING-IMPLEMENTATION.md`

### Modified
- `frontend/src/components/ui/ThreeBucketChart.tsx`
- `frontend/src/pages/aog/AOGAnalyticsPage.tsx`
- `frontend/src/types/index.ts`
- `backend/src/aog-events/services/aog-events.service.ts`

## Requirements Traceability

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| FR-1.1 | LegacyDataBadge, ThreeBucketChart updates | ✅ Complete |
| FR-1.2 | Backend fallback logic with $ifNull | ✅ Complete |
| FR-1.3 | Data quality metrics in response | ✅ Complete |

---

**Implementation Date**: January 2025  
**Task**: 1.3 Implement legacy data handling in existing charts  
**Spec**: `.kiro/specs/aog-analytics-enhancement/`
