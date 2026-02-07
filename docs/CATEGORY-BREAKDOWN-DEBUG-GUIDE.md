# Category Breakdown Chart - Debugging Guide

## Issue
The "Event Category Distribution" pie chart on the AOG Analytics page shows "No category data available for the selected period" even though AOG events exist with valid category values.

## Root Cause Analysis

### What We Know
1. ✅ AOG events exist in the database with `category` field set (visible in the AOG list table)
2. ✅ Backend endpoint `/api/aog-events/analytics/category-breakdown` exists
3. ✅ Backend aggregation pipeline is correctly implemented
4. ✅ Frontend component `CategoryBreakdownPie` is correctly implemented
5. ✅ Frontend hook `useCategoryBreakdown` is correctly implemented

### Potential Issues

#### 1. Progressive Loading Delay
The `useCategoryBreakdown` hook is set to load only after 500ms (Priority 2):
```typescript
const { data: categoryBreakdownData } = useCategoryBreakdown(
  { ...dateRange, aircraftId, fleetGroup },
  { enabled: loadPriority2 } // Only loads after 500ms
);
```

**Check**: Wait at least 1 second after page load to see if data appears.

#### 2. Date Filter Issue
When "All Time" preset is selected, the date range is an empty object `{}`:
```typescript
dateRange = {} // No startDate or endDate
```

The backend should handle this correctly (no date filter = all events), but verify the API is being called.

#### 3. API Response Format
The backend returns:
```typescript
[
  {
    category: "aog",
    count: 10,
    percentage: 50.0,
    totalHours: 120.5
  },
  // ...
]
```

The frontend expects the same format, so this should work.

#### 4. TanStack Query Caching
The query might be cached with stale data or an error state.

## Debugging Steps

### Step 1: Check Browser Console
With the debug logging added, check the browser console for:
```
📊 Category Breakdown Debug: {
  isLoading: false,
  hasData: true/false,
  dataLength: number,
  data: [...],
  error: any,
  filters: {...}
}
```

### Step 2: Check Network Tab
1. Open browser DevTools → Network tab
2. Filter by "category-breakdown"
3. Refresh the page
4. Check if the API call is made
5. Check the response:
   - Status code (should be 200)
   - Response body (should be an array)

### Step 3: Test API Directly
Use curl or Postman to test the endpoint:

```bash
# Test without filters (all time)
curl http://localhost:3001/api/aog-events/analytics/category-breakdown

# Test with date filters
curl "http://localhost:3001/api/aog-events/analytics/category-breakdown?startDate=2026-01-01&endDate=2026-02-06"
```

Expected response:
```json
[
  {
    "category": "aog",
    "count": 15,
    "percentage": 100.0,
    "totalHours": 250.5
  }
]
```

### Step 4: Check MongoDB Data
If the API returns an empty array, check the database directly:

```javascript
// In MongoDB shell or Compass
db.aogevents.aggregate([
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 }
    }
  }
])
```

This should show all categories and their counts.

## Quick Fixes

### Fix 1: Remove Progressive Loading
If you need the data immediately, remove the `enabled` option:

```typescript
const { data: categoryBreakdownData } = useCategoryBreakdown({
  ...dateRange,
  aircraftId: aircraftFilter || undefined,
  fleetGroup: fleetFilter || undefined,
});
// Remove: { enabled: loadPriority2 }
```

### Fix 2: Add Fleet Group Support
The backend doesn't currently support `fleetGroup` filtering. To add it:

**Backend Controller** (`backend/src/aog-events/aog-events.controller.ts`):
```typescript
return this.aogEventsService.getCategoryBreakdown(
  query.startDate ? new Date(query.startDate) : undefined,
  endDate,
  query.aircraftId,
  query.fleetGroup, // Add this
);
```

**Backend Service** (`backend/src/aog-events/services/aog-events.service.ts`):
```typescript
async getCategoryBreakdown(
  startDate?: Date,
  endDate?: Date,
  aircraftId?: string,
  fleetGroup?: string, // Add this
): Promise<...> {
  const matchStage: Record<string, unknown> = {};

  if (aircraftId) {
    matchStage.aircraftId = new Types.ObjectId(aircraftId);
  }

  // Add fleet group filter
  if (fleetGroup) {
    // Need to lookup aircraft collection to filter by fleet group
    // This requires a $lookup stage before $match
  }
  
  // ... rest of the method
}
```

### Fix 3: Force Query Refetch
If caching is the issue, add `refetchOnMount`:

```typescript
const { data: categoryBreakdownData } = useCategoryBreakdown(
  { ...dateRange, aircraftId, fleetGroup },
  { 
    enabled: loadPriority2,
    refetchOnMount: 'always', // Add this
  }
);
```

## Enhanced Error Display

The updated component now shows more detailed error messages:
- "Data is undefined - check console for details"
- "Data format error - expected array, got [type]"
- "API returned empty array - no events match the filters"
- "Error: [error message]"

This will help identify exactly what's going wrong.

## Next Steps

1. **Check the console logs** - The debug logging will show exactly what data is being received
2. **Check the Network tab** - Verify the API is being called and what it returns
3. **Try different date presets** - Test with "Last 30 Days" instead of "All Time"
4. **Clear filters** - Remove aircraft and fleet filters to see all data
5. **Check backend logs** - See if there are any errors in the NestJS console

## Expected Behavior

When working correctly:
- The API should return an array with 1-3 objects (one for each category: aog, unscheduled, scheduled)
- The pie chart should display with colored segments
- Each segment should show the percentage
- The legend should show event counts and total hours

## Contact

If the issue persists after following these steps, provide:
1. Console log output from the debug logging
2. Network tab screenshot showing the API call and response
3. MongoDB query result showing category distribution
4. Any error messages from browser or backend console
