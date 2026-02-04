# AOG Milestone Fix - Quick Reference

## Problem Summary

✅ **FIXED**: Edit form now includes milestone timestamps  
✅ **FIXED**: upAndRunningAt now equals clearedAt for imported events  
✅ **FIXED**: Computed metrics (technical/procurement/ops time) now calculate properly  
✅ **FIXED**: Charts now show data instead of all zeros  

## What Changed

### 1. Edit Form Enhancement
**File**: `frontend/src/components/aog/AOGEventEditForm.tsx`

The edit form now includes a "Milestone Timestamps" section with all 7 milestone fields:
- Reported At
- Procurement Requested At
- Available At Store At
- Issued Back At
- Installation Complete At
- Test Start At
- Up & Running At

All fields are optional and have helpful descriptions.

### 2. Automatic Metric Computation
**File**: `backend/src/aog-events/schemas/aog-event.schema.ts`

Added pre-save hook that automatically computes:
- `technicalTimeHours` - Time spent on troubleshooting and installation
- `procurementTimeHours` - Time waiting for parts
- `opsTimeHours` - Time spent on operational testing
- `totalDowntimeHours` - Total time from reported to up & running

### 3. Import Enhancement
**File**: `backend/src/import-export/services/import.service.ts`

Import now sets basic milestones for historical data:
- `reportedAt = detectedAt`
- `installationCompleteAt = clearedAt` (if resolved)
- `upAndRunningAt = clearedAt` (if resolved)

This enables basic analytics even for imported historical data.

## How to Use

### For New Events
1. Create or edit an AOG event
2. Set milestone timestamps as they occur
3. Metrics compute automatically on save
4. Charts display the computed metrics

### For Imported Events
1. Import historical data using Excel template
2. Basic milestones are set automatically
3. Run migration script to update existing data
4. Charts show total downtime (all attributed to technical time)

### For Legacy Events
- Events without milestones show "Legacy" badge
- Display total downtime only
- Edit event to add milestones and unlock full analytics

## Migration Steps

### Step 1: Test Current State
```bash
node test-aog-milestone-fix.js
```

This shows:
- How many events have milestones
- How many events have computed metrics
- Whether analytics data is available
- Whether upAndRunningAt = clearedAt

### Step 2: Run Migration
```bash
node fix-imported-aog-milestones.js
```

This updates all imported events to set milestone timestamps and compute metrics.

### Step 3: Verify Results
```bash
node test-aog-milestone-fix.js
```

All tests should pass after migration.

## Expected Results

### Before Migration
```
Total Events: 50
Total Downtime: 0h
Technical Time: 0h (0%)
Procurement Time: 0h (0%)
Ops Time: 0h (0%)
```

### After Migration
```
Total Events: 50
Total Downtime: 1,234.5h
Technical Time: 1,234.5h (100%)
Procurement Time: 0h (0%)
Ops Time: 0h (0%)
```

For imported events, all downtime is attributed to technical time since we don't have procurement or ops data.

## Chart Behavior

### Three-Bucket Breakdown
- **Technical**: Shows total downtime for imported events
- **Procurement**: 0 for imported events (no procurement data)
- **Ops**: 0 for imported events (no ops test data)

### Downtime by Category
- Shows total downtime hours per category (AOG, Scheduled, Unscheduled)
- Data comes from `totalDowntimeHours` field

### Monthly Trends
- Shows event count and downtime hours per month
- Uses `totalDowntimeHours` for downtime calculation

### Aircraft Performance
- Shows downtime hours per aircraft
- Uses `totalDowntimeHours` for ranking

## Troubleshooting

### Charts Still Show Zero
**Problem**: Charts display 0 values after migration

**Solution**:
1. Check if migration ran successfully: `node test-aog-milestone-fix.js`
2. Verify events have `totalDowntimeHours > 0` in database
3. Clear browser cache and reload page
4. Check browser console for errors

### Edit Form Doesn't Show Milestones
**Problem**: Edit form only shows basic fields

**Solution**:
1. Verify frontend changes deployed: check `AOGEventEditForm.tsx`
2. Clear browser cache and hard reload (Ctrl+Shift+R)
3. Check browser console for errors

### Metrics Not Computing
**Problem**: Events saved but metrics still 0

**Solution**:
1. Verify pre-save hook is in schema: check `aog-event.schema.ts`
2. Check that `reportedAt` and `upAndRunningAt` are set
3. For resolved events, ensure `clearedAt` is set
4. Re-save event to trigger hook

### upAndRunningAt Not Equal to clearedAt
**Problem**: Timestamps don't match for imported events

**Solution**:
1. Run migration script: `node fix-imported-aog-milestones.js`
2. Pre-save hook will set `upAndRunningAt = clearedAt` if not set
3. Verify with test script: `node test-aog-milestone-fix.js`

## API Endpoints

No changes to API endpoints. All existing endpoints work as before:

- `GET /api/aog-events` - List events (includes computed metrics)
- `GET /api/aog-events/:id` - Get single event (includes computed metrics)
- `PUT /api/aog-events/:id` - Update event (recomputes metrics on save)
- `GET /api/aog-events/analytics/buckets` - Three-bucket analytics (uses computed metrics)

## Database Queries

### Find Events with Metrics
```javascript
db.aogevents.find({
  totalDowntimeHours: { $gt: 0 }
})
```

### Find Events Missing Milestones
```javascript
db.aogevents.find({
  isImported: true,
  clearedAt: { $exists: true },
  $or: [
    { reportedAt: { $exists: false } },
    { upAndRunningAt: { $exists: false } }
  ]
})
```

### Check Metric Computation
```javascript
db.aogevents.aggregate([
  { $match: { isImported: true } },
  {
    $group: {
      _id: null,
      totalEvents: { $sum: 1 },
      eventsWithMetrics: {
        $sum: { $cond: [{ $gt: ['$totalDowntimeHours', 0] }, 1, 0] }
      },
      totalDowntime: { $sum: '$totalDowntimeHours' }
    }
  }
])
```

## Files Modified

### Backend
- ✅ `backend/src/aog-events/schemas/aog-event.schema.ts` - Pre-save hook
- ✅ `backend/src/import-export/services/import.service.ts` - Import defaults

### Frontend
- ✅ `frontend/src/components/aog/AOGEventEditForm.tsx` - Milestone fields

### Scripts
- ✅ `fix-imported-aog-milestones.js` - Migration script
- ✅ `test-aog-milestone-fix.js` - Test script

### Documentation
- ✅ `AOG-MILESTONE-EDIT-FIX.md` - Detailed fix documentation
- ✅ `AOG-MILESTONE-QUICK-REFERENCE.md` - This file

## Support

If you encounter issues:

1. Run test script to diagnose: `node test-aog-milestone-fix.js`
2. Check browser console for frontend errors
3. Check backend logs for API errors
4. Verify database connection and data
5. Review documentation files for details

---

**Status**: ✅ Complete  
**Date**: February 4, 2026  
**Version**: 1.0
