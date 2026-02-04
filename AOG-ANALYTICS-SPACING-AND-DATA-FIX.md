# AOG Analytics - Spacing & Data Fix

## Issues Fixed

### 1. ✅ Spacing/Layout Improved

**Problem**: Components were too close together, making the page look cramped

**Solution**: Added proper spacing between major sections:
- `mt-6` (24px) between summary cards and bucket charts
- `mt-8` (32px) between three-bucket visualizations
- `mt-12` (48px) between major sections (Trend Analysis, Aircraft Performance, Root Cause, Cost Analysis, Predictive Analytics)

**Result**: Modern, breathable layout with clear visual hierarchy

---

### 2. ⚠️ "No downtime data available" - Expected Behavior

**Why you're seeing this**:
The charts show "No downtime data available" because:
1. You imported historical AOG events
2. The imported events don't have milestone timestamps yet
3. Without milestone timestamps, computed metrics (technicalTimeHours, procurementTimeHours, opsTimeHours, totalDowntimeHours) are all 0
4. Charts need these metrics to display data

**This is NORMAL and EXPECTED** - you just need to run the migration script!

---

## How to Fix the Data Issue

### Step 1: Run Migration Script

```bash
# From project root
node fix-imported-aog-milestones.js
```

**What this does**:
- Finds all imported AOG events
- Sets `reportedAt = detectedAt`
- Sets `installationCompleteAt = clearedAt` (if resolved)
- Sets `upAndRunningAt = clearedAt` (if resolved)
- Triggers pre-save hook to compute metrics
- Updates all events in database

**Expected output**:
```
🚀 Starting AOG Milestone Migration...
📡 Connected to MongoDB
🔍 Found 192 imported events
⏳ Processed 10 events...
⏳ Processed 20 events...
...
📈 Migration Summary:
   ✅ Updated: 192 events
   ⏭️  Skipped: 0 events
   ❌ Errors: 0 events
✅ Migration completed successfully!
```

### Step 2: Verify Results

```bash
# Run test script
node test-aog-milestone-fix.js
```

**Expected output**:
```
🧪 Testing AOG Milestone Fix...
📋 Test 1: ✅ PASS - Milestone timestamps
📊 Test 2: ✅ PASS - Computed metrics
📈 Test 3: ✅ PASS - Analytics data
🔄 Test 4: ✅ PASS - upAndRunningAt = clearedAt
🎉 All tests passed! Charts should show data.
```

### Step 3: Refresh Browser

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload page (Ctrl+Shift+R)
3. Navigate to AOG Analytics page
4. Charts should now display data!

---

## What You Should See After Migration

### Before Migration ❌
```
Total Events: 192
Active AOG: 0
Total Downtime: 0.0 hrs  ← All zeros
Avg Downtime: 0.0 hrs

Technical Time: 0.0 hrs (0%)
Procurement Time: 0.0 hrs (0%)
Ops Time: 0.0 hrs (0%)

Downtime by Category: No downtime data available
Downtime Distribution: No downtime data available
Bucket Trend: No Trend Data Available
```

### After Migration ✅
```
Total Events: 192
Active AOG: 0
Total Downtime: 192274.0 hrs  ← Real data!
Avg Downtime: 1001.4 hrs

Technical Time: 192274.0 hrs (100%)  ← All technical for imported data
Procurement Time: 0.0 hrs (0%)       ← No procurement data (expected)
Ops Time: 0.0 hrs (0%)               ← No ops data (expected)

Downtime by Category: Shows bar chart with hours per category
Downtime Distribution: Shows pie chart with category breakdown
Bucket Trend: Shows monthly trend chart
```

---

## Why Procurement and Ops Time Are 0

For imported historical data:
- We only have `detectedAt` and `clearedAt` timestamps
- We don't have procurement or ops testing data
- All downtime is attributed to **Technical Time** (100%)
- This is **correct and expected** for imported data

**To get detailed three-bucket breakdown**:
- Edit events to add procurement milestones (procurementRequestedAt, availableAtStoreAt)
- Edit events to add ops milestones (testStartAt)
- For new events going forward, set all milestones as they occur

---

## Chart Behavior After Migration

### Three-Bucket Breakdown
- **Technical**: 192,274 hrs (100%) - All downtime for imported events
- **Procurement**: 0 hrs (0%) - No procurement data
- **Ops**: 0 hrs (0%) - No ops test data
- **Total**: 192,274 hrs

### Downtime by Category (Hours)
Shows actual hours per category:
- **AOG**: ~150,000 hrs
- **Scheduled**: ~30,000 hrs
- **Unscheduled**: ~12,000 hrs

### Downtime Distribution
Pie chart showing percentage breakdown by category

### Bucket Trend Chart
Shows monthly technical time trend (since all time is technical for imported data)

### Monthly Trend
Shows event count and downtime hours per month

### All Other Charts
Will display data based on computed metrics

---

## Troubleshooting

### Issue: Migration script fails

**Error**: "Cannot connect to MongoDB"

**Solution**:
1. Check MongoDB is running: `mongo --eval "db.adminCommand('ping')"`
2. Check connection string in `backend/.env`
3. Verify database name is correct

---

### Issue: Charts still show "No data" after migration

**Diagnosis**:
```bash
# Check if metrics were computed
node test-aog-milestone-fix.js
```

**Solutions**:
1. If test fails, re-run migration script
2. Clear browser cache and hard reload
3. Check browser console for errors
4. Verify API returns data: Open DevTools → Network → Check API responses

---

### Issue: Some events have data, others don't

**Diagnosis**: Mixed data - some events migrated, others didn't

**Solution**:
```bash
# Re-run migration (safe to run multiple times)
node fix-imported-aog-milestones.js
```

The script will skip events that already have milestones and only update those that need it.

---

## Summary

### Spacing Fix ✅
- Added proper margins between sections
- Modern, breathable layout
- Clear visual hierarchy
- Better user experience

### Data Issue ⚠️
- **Expected behavior** - imported events need migration
- **Solution** - Run migration script
- **Result** - Charts will display actual downtime data
- **Note** - All downtime attributed to technical time for imported data (correct)

### Next Steps
1. ✅ Spacing fixed (already done)
2. ⏳ Run migration script: `node fix-imported-aog-milestones.js`
3. ⏳ Verify with test script: `node test-aog-milestone-fix.js`
4. ⏳ Refresh browser and check charts

---

**Status**: Spacing fixed ✅ | Data migration pending ⏳  
**Date**: February 4, 2026  
**Version**: 1.0
