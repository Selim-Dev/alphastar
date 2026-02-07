# AOG Import Visual Testing Guide

## What You Should See After Re-Import

### 1. Import Preview Screen

**Before clicking "Confirm Import":**

```
┌─────────────────────────────────────────────────────────┐
│ Import Preview - AOG Events                             │
├─────────────────────────────────────────────────────────┤
│ File: aog_historical_data_import_FIXED.xlsx             │
│                                                          │
│ ✅ Valid Rows: 193                                      │
│ ❌ Invalid Rows: 2                                      │
│                                                          │
│ Invalid Rows:                                           │
│ • Row 184: Finish Time: Required when Finish Date...   │
│ • Row 185: Finish Time: Required when Finish Date...   │
│                                                          │
│ [Cancel]  [Confirm Import]                              │
└─────────────────────────────────────────────────────────┘
```

### 2. AOG Events List Page (After Import)

**Status Column - What You Should See:**

```
┌──────────────┬────────────┬──────────────┬─────────────┐
│ Status       │ Aircraft   │ Category     │ Start Date  │
├──────────────┼────────────┼──────────────┼─────────────┤
│ 🟢 Resolved  │ HZ-A11     │ S-MX         │ 2023-10-06  │ ✅ Has Finish Date
│ 🟢 Resolved  │ HZ-SK7     │ S-MX         │ 2023-10-18  │ ✅ Has Finish Date
│ 🟢 Resolved  │ HZ-A2      │ S-MX         │ 2024-01-02  │ ✅ Has Finish Date
│ 🔴 Active    │ HZ-SK5     │ S-MX         │ 2024-02-23  │ ✅ No Finish Date
│ 🔴 Active    │ HZ-A2      │ S-MX         │ 2024-05-05  │ ✅ No Finish Date
│ 🟢 Resolved  │ VP-CSK     │ AOG          │ 2024-01-04  │ ✅ Has Finish Date
└──────────────┴────────────┴──────────────┴─────────────┘
```

**Key Indicators:**
- 🟢 **Green "Resolved" badge** = Event has `clearedAt` date (finished)
- 🔴 **Red "Active" badge** = Event has NO `clearedAt` date (still ongoing)

### 3. Dashboard KPIs

**Before Fix (WRONG):**
```
┌─────────────────────────────────────┐
│ Active AOG Events                   │
│                                     │
│        195                          │ ❌ WRONG!
│                                     │
└─────────────────────────────────────┘
```

**After Fix (CORRECT):**
```
┌─────────────────────────────────────┐
│ Active AOG Events                   │
│                                     │
│         12                          │ ✅ CORRECT!
│                                     │
└─────────────────────────────────────┘
```

### 4. AOG Event Detail Page

**For a Resolved Event (e.g., HZ-A11):**

```
┌─────────────────────────────────────────────────────────┐
│ AOG Event Details - HZ-A11                              │
├─────────────────────────────────────────────────────────┤
│ Status: 🟢 Resolved                                     │ ✅
│                                                          │
│ Timeline:                                               │
│ • Detected: Oct 6, 2023 at 15:00                       │
│ • Cleared: May 9, 2024 at 15:00                        │ ✅ Should exist
│ • Duration: 5,064 hours (211 days)                     │
│                                                          │
│ Milestones:                                             │
│ • Reported At: Oct 6, 2023 at 15:00                    │
│ • Up & Running At: May 9, 2024 at 15:00                │ ✅ Should exist
└─────────────────────────────────────────────────────────┘
```

**For an Active Event (e.g., HZ-SK5):**

```
┌─────────────────────────────────────────────────────────┐
│ AOG Event Details - HZ-SK5                              │
├─────────────────────────────────────────────────────────┤
│ Status: 🔴 Active                                       │ ✅
│                                                          │
│ Timeline:                                               │
│ • Detected: Feb 23, 2024 at 09:00                      │
│ • Cleared: (Not yet cleared)                           │ ✅ Should be empty
│ • Duration: XXX hours (ongoing)                        │
│                                                          │
│ Milestones:                                             │
│ • Reported At: Feb 23, 2024 at 09:00                   │
│ • Up & Running At: (Not yet)                           │ ✅ Should be empty
└─────────────────────────────────────────────────────────┘
```

## Common Issues and What They Mean

### Issue 1: All Events Still Show as Active
**Symptom**: All 193 events have red "Active" badge
**Cause**: The fix didn't work or data wasn't cleared before re-import
**Solution**: 
1. Clear AOG events: `npm run clear-aog`
2. Verify backend is running the NEW code (check build timestamp)
3. Re-import

### Issue 2: No Events Show as Active
**Symptom**: All 193 events have green "Resolved" badge
**Cause**: The 12 events without Finish Date were incorrectly given a `clearedAt` value
**Solution**: Check the Excel file - rows without Finish Date should remain empty

### Issue 3: Wrong Number of Active Events
**Symptom**: Active count is not 12 (e.g., 10, 15, etc.)
**Cause**: Some rows in Excel might have data quality issues
**Solution**: Check which events are showing as active and verify their Finish Date/Time in Excel

## Quick Verification Checklist

- [ ] Import preview shows **193 valid, 2 errors**
- [ ] Import completes successfully
- [ ] AOG Events list shows mix of green and red badges
- [ ] Dashboard shows **~12 active AOG events** (not 195)
- [ ] Clicking on a resolved event shows "Cleared" date
- [ ] Clicking on an active event shows "Not yet cleared"
- [ ] Filter by "Active" shows only ~12 events
- [ ] Filter by "Resolved" shows ~181 events

## Sample Events to Check

| Aircraft | Start Date | Finish Date | Expected Status |
|----------|-----------|-------------|-----------------|
| HZ-A11   | 2023-10-06 | 2024-05-09 | 🟢 Resolved |
| HZ-SK5   | 2024-02-23 | (none) | 🔴 Active |
| VP-CSK   | 2024-01-04 | 2024-01-11 | 🟢 Resolved |
| HZ-A2    | 2024-05-05 | (none) | 🔴 Active |
| HZ-XY7   | 2024-01-03 | 2024-01-06 | 🟢 Resolved |

---

**Pro Tip**: Use the browser's Network tab to inspect the API response and verify that `clearedAt` field is present in resolved events and absent in active events.
