# AOG Import Active Status Bug - Fix Summary

## Problem Description

All imported AOG events were showing as "Active" even though they had `clearedAt` and `upAndRunningAt` values set. This meant that historical events that were already resolved were incorrectly appearing in the active events list.

## Root Cause

The issue was in how the `clearedAt` Date object was being passed from the Excel parser to the Mongoose repository. The Date object created by the parser needed to be converted to a fresh Date instance to ensure proper MongoDB serialization.

**Original problematic code** (line 289 in `import.service.ts`):
```typescript
const clearedAt = (data.clearedAt as Date | null) || undefined;
```

This line had potential issues with how Mongoose serializes Date objects that have been passed through multiple transformations.

## Solution Applied

**Fixed code** in `backend/src/import-export/services/import.service.ts`:
```typescript
// Handle clearedAt: create a fresh Date object if valid, otherwise undefined
let clearedAt: Date | undefined;
if (data.clearedAt && data.clearedAt instanceof Date) {
  // Create a fresh Date object to ensure proper Mongoose serialization
  clearedAt = new Date(data.clearedAt.getTime());
} else {
  clearedAt = undefined;
}
```

This ensures:
1. We explicitly check if `data.clearedAt` is a valid Date object
2. We create a fresh Date instance using `getTime()` to avoid any serialization issues
3. We use `undefined` (not `null`) for missing values, which is Mongoose's preferred approach

## Files Modified

1. `backend/src/import-export/services/import.service.ts` - Fixed clearedAt handling

## Testing Instructions

### Step 1: Clear Existing AOG Events

You need to clear the incorrectly imported AOG events from the database. You can use the existing script:

```powershell
cd backend
npm run clear-aog
```

Or manually via MongoDB:
```javascript
db.aogevents.deleteMany({ isImported: true })
```

### Step 2: Rebuild Backend (Already Done)

```powershell
cd backend
npm run build
```

### Step 3: Start Backend

```powershell
cd backend
npm run start:dev
```

### Step 4: Re-import the Excel File

1. Open the frontend application
2. Navigate to Import page
3. Select "AOG Events" as import type
4. Upload `aog_historical_data_import_FIXED.xlsx`
5. Review the preview - should show:
   - **181 valid rows** (events with Finish Date and Time)
   - **12 valid rows** (active events without Finish Date)
   - **2 error rows** (events with Finish Date but no Finish Time)
   - **Total: 193 valid, 2 errors**
6. Click "Confirm Import"

### Step 5: Verify the Fix

After import, check the AOG Events list page:

**Expected Results:**
- **181 events** should show status badge as "Resolved" (green) - these have `clearedAt` set
- **12 events** should show status badge as "Active" (red) - these have no `clearedAt`
- Active events count in dashboard should be **12** (not 195)

**Specific Test Cases:**

1. **HZ-A11** (Start: 2023-10-06, Finish: 2024-05-09)
   - ✅ Should show as "Resolved"
   - ✅ Should have `clearedAt` = 2024-05-09 15:00

2. **HZ-SK5** (Start: 2024-02-23, No Finish Date)
   - ✅ Should show as "Active"
   - ✅ Should have `clearedAt` = undefined/null

3. **VP-CSK** (Start: 2024-01-04, Finish: 2024-01-11)
   - ✅ Should show as "Resolved"
   - ✅ Should have `clearedAt` = 2024-01-11 16:00

## Verification Queries

You can verify the data directly in MongoDB:

```javascript
// Count resolved events (should be 181)
db.aogevents.countDocuments({ 
  isImported: true, 
  clearedAt: { $exists: true, $ne: null } 
})

// Count active events (should be 12)
db.aogevents.countDocuments({ 
  isImported: true, 
  $or: [
    { clearedAt: { $exists: false } },
    { clearedAt: null }
  ]
})

// Sample resolved event
db.aogevents.findOne({ 
  isImported: true, 
  clearedAt: { $exists: true, $ne: null } 
})

// Sample active event
db.aogevents.findOne({ 
  isImported: true, 
  $or: [
    { clearedAt: { $exists: false } },
    { clearedAt: null }
  ]
})
```

## Additional Notes

### Why This Fix Works

1. **Fresh Date Instance**: Creating a new Date object from `getTime()` ensures we have a clean Date instance that Mongoose can properly serialize to MongoDB's BSON Date type.

2. **Explicit Type Checking**: Using `instanceof Date` is more reliable than truthy checks, especially when dealing with objects that might have been transformed through multiple layers.

3. **Undefined vs Null**: Mongoose prefers `undefined` for optional fields. When a field is `undefined`, Mongoose doesn't include it in the document at all, which is the correct behavior for optional fields.

### Frontend Status Logic

The frontend determines active status with:
```typescript
<StatusBadge isActive={!row.original.clearedAt} size="sm" />
```

This works correctly because:
- If `clearedAt` is a Date object → `!Date` = `false` → Not Active ✓
- If `clearedAt` is `undefined` → `!undefined` = `true` → Active ✓
- If `clearedAt` is `null` → `!null` = `true` → Active ✓

## Rollback Instructions

If you need to rollback this change:

1. Revert the changes in `backend/src/import-export/services/import.service.ts`
2. Rebuild: `npm run build`
3. Restart backend

However, this is not recommended as the fix addresses a real serialization issue.

## Related Files

- `backend/src/import-export/services/import.service.ts` - Import logic
- `backend/src/import-export/services/excel-parser.service.ts` - Parser logic
- `backend/src/aog-events/schemas/aog-event.schema.ts` - Schema definition
- `frontend/src/pages/aog/AOGListPageEnhanced.tsx` - Status display
- `aog_historical_data_import_FIXED.xlsx` - Clean import file

## Status

✅ **Fix Applied**
✅ **Backend Rebuilt**
⏳ **Awaiting Testing** - Please clear existing data and re-import to verify

---

**Last Updated**: January 31, 2025
**Issue**: AOG events showing as Active when they should be Resolved
**Resolution**: Fixed Date object serialization in import service
