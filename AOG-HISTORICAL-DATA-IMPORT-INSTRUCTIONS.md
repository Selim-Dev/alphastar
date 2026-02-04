# AOG Historical Data Import Instructions

## Overview

You now have a ready-to-import Excel file containing **197 historical AOG/OOS events** from 2024-2026.

**File created:** `aog_historical_data_import.xlsx`

## What's in the File?

The Excel file contains all your historical data with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Aircraft | Aircraft registration | HZ-A11, HZ-SK7, VP-CSK |
| Defect Description | What went wrong | "OXYGEN GENERATOR PAX IS DUE" |
| Location | ICAO airport code | OERK, LFSB, LFBF |
| Category | Event type | AOG, S-MX, U-MX, MRO, CLEANING |
| Start Date | When event started | 2024-01-04 |
| Start Time | Time event started | 23:59 |
| Finish Date | When event ended | 2024-01-11 (empty = still active) |
| Finish Time | Time event ended | 16:00 (empty = still active) |

## Event Breakdown

Your data includes:
- **AOG events** - Critical aircraft on ground incidents
- **S-MX events** - Scheduled maintenance
- **U-MX events** - Unscheduled maintenance
- **MRO events** - MRO facility visits
- **CLEANING events** - Operational cleaning

## Import Process

### Step 1: Start the Backend Server

```powershell
cd backend
npm run start:dev
```

Wait for the message: `Application is running on: http://localhost:3000`

### Step 2: Start the Frontend

Open a new terminal:

```powershell
cd frontend
npm run dev
```

Wait for the message showing the local URL (usually `http://localhost:5173`)

### Step 3: Login to Dashboard

1. Open your browser to the frontend URL
2. Login with your credentials:
   - **Admin**: admin@alphastarav.com / Admin@123!
   - **Editor**: editor@alphastarav.com / Editor@123!

### Step 4: Navigate to Import Page

1. Click on **"Import"** in the navigation menu
2. Or go directly to: `http://localhost:5173/import`

### Step 5: Upload the Excel File

1. Select **"AOG Events"** from the import type dropdown
2. Click **"Choose File"** or drag and drop
3. Select `aog_historical_data_import.xlsx`
4. Click **"Upload"**

### Step 6: Review Validation Results

The system will validate your data and show:

✅ **Success indicators:**
- Number of valid rows
- Aircraft registrations found
- Date/time parsing successful

⚠️ **Warnings (if any):**
- Unknown aircraft registrations (will need to create aircraft first)
- Invalid date formats
- Missing required fields

### Step 7: Confirm Import

1. Review the validation summary
2. Click **"Confirm Import"** to proceed
3. Wait for the import to complete

### Step 8: Verify Import

1. Navigate to **AOG Events** page (`/aog/list`)
2. You should see all 197 events listed
3. Check filters work correctly:
   - Filter by aircraft
   - Filter by category
   - Filter by date range
4. Click on individual events to see details

## Important Notes

### Aircraft Registration Matching

The import will try to match aircraft registrations from your data to existing aircraft in the system. If an aircraft doesn't exist, you have two options:

**Option A: Create Aircraft First (Recommended)**
1. Go to Admin page or Aircraft management
2. Add missing aircraft before importing AOG data
3. Then run the import

**Option B: Skip Unknown Aircraft**
- The import will skip events for unknown aircraft
- You can import them later after creating the aircraft

### Legacy Data Handling

All imported events will be marked as **legacy data** (`isLegacy: true`), which means:

✅ **Available:**
- Event timeline
- Total downtime calculation
- Category and location tracking
- Basic analytics

❌ **Limited:**
- No three-bucket breakdown (no milestone data)
- No cost tracking (not in historical data)
- No manpower data (not in historical data)

### Active Events

Events without a finish date/time will be imported as **active AOG events**:
- `clearedAt` will be `null`
- They'll appear in the "Active AOG" list
- You can update them later when resolved

## Troubleshooting

### Issue: "Aircraft not found"

**Solution:**
1. Check the aircraft registration spelling
2. Ensure aircraft exists in the system
3. Create missing aircraft first

### Issue: "Invalid date format"

**Solution:**
1. Check date format is YYYY-MM-DD
2. Check time format is HH:MM (24-hour)
3. Ensure no extra spaces or special characters

### Issue: "Category not recognized"

**Solution:**
The system expects: AOG, S-MX, U-MX, MRO, CLEANING
- Check for typos in the Category column
- Ensure exact match (case-sensitive)

### Issue: Import takes too long

**Expected behavior:**
- 197 events should import in 10-30 seconds
- If it takes longer, check:
  - Backend server is running
  - Database connection is active
  - No network issues

## After Import

### Recommended Next Steps

1. **Review imported data**
   - Check event counts by aircraft
   - Verify date ranges are correct
   - Spot-check a few events for accuracy

2. **Update critical events** (optional)
   - Add responsible party for major incidents
   - Add cost data if available
   - Add milestone timestamps for recent events

3. **Create Daily Status records** (optional)
   - For accurate availability calculations
   - Can be auto-generated from AOG events
   - Or manually entered for each day

4. **Set up ongoing data entry**
   - Use the AOG Event creation form for new events
   - Include milestone timestamps going forward
   - Record costs and manpower data

## Data Quality Tips

### For Future AOG Events

To get full analytics benefits, when creating new AOG events:

1. **Use the full form** (not Excel import)
2. **Include milestone timestamps:**
   - Reported At
   - Procurement Requested At (if parts needed)
   - Available at Store At (if parts needed)
   - Installation Complete At
   - Test Start At (if testing required)
   - Up & Running At

3. **Record costs:**
   - Internal Cost (labor, man-hours)
   - External Cost (vendors, third-party)

4. **Assign responsibility:**
   - Internal, OEM, Customs, Finance, Other

5. **Add attachments:**
   - Work orders
   - Photos
   - Reports

## Support

If you encounter issues:

1. **Check the console logs:**
   - Backend: Terminal running `npm run start:dev`
   - Frontend: Browser developer console (F12)

2. **Check validation errors:**
   - The import UI will show specific errors
   - Fix the Excel file and re-upload

3. **Test with small batch first:**
   - Try importing just 5-10 events first
   - Verify they import correctly
   - Then import the full dataset

## Summary

✅ **You have:**
- Excel file ready: `aog_historical_data_import.xlsx`
- 197 historical events from 2024-2026
- Proper format matching system requirements

✅ **Next action:**
1. Start backend and frontend servers
2. Login to dashboard
3. Go to Import page
4. Upload the Excel file
5. Confirm import
6. Verify data in AOG Events page

🎉 **You're ready to import!**

---

**File created:** January 31, 2026  
**Source data:** `aog_oos_seed_data_clean.md`  
**Conversion script:** `convert-aog-data-to-excel.js`
