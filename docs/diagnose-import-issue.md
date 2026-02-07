# AOG Import Issue Diagnosis

## Problem
All imported AOG events show as "Active" even though they have `clearedAt` and `upAndRunningAt` values set.

## Investigation Steps

### 1. Data Verification
- ✅ Excel file has 181 rows with both Finish Date and Finish Time
- ✅ Excel file has 12 rows without Finish Date (should be active)
- ✅ Excel file has 2 rows with Finish Date but no Finish Time (validation error expected)

### 2. Parser Logic
- ✅ Parser correctly sets `data.clearedAt = Date` when both finishDate and finishTime exist
- ✅ Parser correctly sets `data.clearedAt = null` when both are empty
- ✅ `combineDateAndTime()` creates proper Date objects

### 3. Import Service Logic
- ✅ Import service receives `data.clearedAt` as either Date or null
- ✅ Converts to: `const clearedAt = data.clearedAt instanceof Date ? data.clearedAt : undefined;`
- ✅ Passes `clearedAt` to repository.create()

### 4. Frontend Logic
- ✅ Frontend checks `!row.original.clearedAt` to determine active status
- ✅ This should work for both null and undefined

## Hypothesis

The issue might be one of the following:

### A. Mongoose Serialization Issue
When we pass a Date object to Mongoose, it might not be serializing it correctly to MongoDB.

**Test**: Check if the Date object from `combineDateAndTime()` is a proper JavaScript Date that Mongoose can serialize.

### B. Query Issue
The repository's `findAll()` method might not be returning the `clearedAt` field.

**Test**: Check if the query explicitly selects fields or if it returns all fields.

### C. Type Coercion Issue
The `data.clearedAt instanceof Date` check might be failing if the Date object is not a proper instance.

**Test**: Log the actual type and value of `data.clearedAt` before the instanceof check.

## Recommended Fix

Since we've verified the logic is correct, the issue is likely in how the Date is being passed through. Let's try a more explicit approach:

```typescript
// Instead of:
const clearedAt = data.clearedAt instanceof Date ? data.clearedAt : undefined;

// Try:
let clearedAt: Date | undefined;
if (data.clearedAt && data.clearedAt instanceof Date) {
  clearedAt = new Date(data.clearedAt.getTime()); // Create a fresh Date object
} else {
  clearedAt = undefined;
}
```

This ensures we're passing a fresh Date object to Mongoose, not a potentially modified one from the parser.

## Next Steps

1. Apply the recommended fix
2. Rebuild backend
3. Clear existing AOG events from database
4. Re-import the Excel file
5. Verify that events with Finish Date show as "Resolved" (not Active)
6. Verify that events without Finish Date show as "Active"
