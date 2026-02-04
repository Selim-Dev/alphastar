# AOG Historical Data Import - Checklist

## Pre-Import Checklist

### ✅ Files Ready

- [x] `aog_historical_data_import.xlsx` created (197 events)
- [x] Conversion script available (`convert-aog-data-to-excel.js`)
- [x] Documentation complete

### ✅ System Requirements

- [ ] Node.js installed
- [ ] MongoDB running
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Frontend dependencies installed (`npm install` in frontend folder)

### ✅ Aircraft Master Data

**Important:** Aircraft must exist in the system before importing AOG events.

Check if these aircraft exist in your system:

**A340 Fleet:**
- [ ] HZ-A11
- [ ] HZ-SKY1
- [ ] HZ-SKY7 (or HZ-SK7)

**A330 Fleet:**
- [ ] HZ-A2
- [ ] HZ-A4
- [ ] HZ-A10
- [ ] HZ-A15
- [ ] HZ-A22
- [ ] HZ-A25

**Gulfstream Fleet:**
- [ ] M-IIII

**Hawker Fleet:**
- [ ] HZ-SK2
- [ ] HZ-SK5 (or HZ-SKY5)

**Cessna Fleet:**
- [ ] VP-CSK
- [ ] VP-CSN
- [ ] VP-CAL

**Other:**
- [ ] HZ-XY7
- [ ] HZ-SKY

**Action if missing:**
1. Go to Aircraft management page
2. Create missing aircraft
3. Then proceed with import

---

## Import Process Checklist

### Step 1: Start Backend

- [ ] Open terminal/PowerShell
- [ ] Navigate to backend folder: `cd backend`
- [ ] Start backend: `npm run start:dev`
- [ ] Wait for: "Application is running on: http://localhost:3000"
- [ ] Keep this terminal open

### Step 2: Start Frontend

- [ ] Open new terminal/PowerShell
- [ ] Navigate to frontend folder: `cd frontend`
- [ ] Start frontend: `npm run dev`
- [ ] Wait for: Local URL (usually http://localhost:5173)
- [ ] Keep this terminal open

### Step 3: Login

- [ ] Open browser to frontend URL
- [ ] Enter credentials:
  - Email: `admin@alphastarav.com`
  - Password: `Admin@123!`
- [ ] Click "Login"
- [ ] Verify you're logged in (see dashboard)

### Step 4: Navigate to Import

- [ ] Click "Import" in navigation menu
- [ ] Or go to: `http://localhost:5173/import`
- [ ] Verify import page loads

### Step 5: Select Import Type

- [ ] Click "Import Type" dropdown
- [ ] Select "AOG Events"
- [ ] Verify selection shows "AOG Events (Simplified)"

### Step 6: Upload File

- [ ] Click "Choose File" button
- [ ] Navigate to project root folder
- [ ] Select `aog_historical_data_import.xlsx`
- [ ] Verify filename appears in UI
- [ ] Click "Upload" button

### Step 7: Review Validation

Wait for validation to complete. Check for:

**Success Indicators:**
- [ ] "Validation successful" message
- [ ] Number of valid rows: 197
- [ ] No critical errors

**Warnings (if any):**
- [ ] Review any warnings
- [ ] Note which aircraft are missing
- [ ] Note any date/time format issues

**If validation fails:**
- [ ] Read error messages carefully
- [ ] Fix issues in Excel file or system
- [ ] Re-upload and validate again

### Step 8: Confirm Import

- [ ] Review validation summary one more time
- [ ] Click "Confirm Import" button
- [ ] Wait for import to complete (10-30 seconds)
- [ ] Look for success message

### Step 9: Verify Import

- [ ] Navigate to AOG Events page (`/aog/list`)
- [ ] Check total event count (should be 197 + any existing)
- [ ] Verify events are listed

**Quick Checks:**
- [ ] Events show correct aircraft
- [ ] Categories are correct (AOG, S-MX, U-MX, MRO, CLEANING)
- [ ] Dates look accurate
- [ ] Active events (no finish date) show as "Active"

### Step 10: Detailed Verification

**Test Filters:**
- [ ] Filter by aircraft (select one aircraft)
- [ ] Filter by category (select AOG)
- [ ] Filter by date range (select 2024-01-01 to 2024-12-31)
- [ ] Clear filters

**Test Individual Event:**
- [ ] Click on any event to open details
- [ ] Verify all fields are populated correctly
- [ ] Check timeline shows start and end dates
- [ ] Verify downtime calculation is correct
- [ ] Close event details

**Test Analytics:**
- [ ] Go to AOG Analytics page (`/aog/analytics`)
- [ ] Verify charts show data
- [ ] Check event count by aircraft
- [ ] Check event count by category
- [ ] Check downtime by aircraft

---

## Post-Import Checklist

### Data Quality Review

- [ ] Spot-check 5-10 events for accuracy
- [ ] Verify aircraft assignments are correct
- [ ] Check date ranges make sense
- [ ] Confirm categories are properly mapped

### Optional Enhancements

**Update Critical Events:**
- [ ] Identify major AOG incidents
- [ ] Add responsible party (Internal, OEM, etc.)
- [ ] Add cost data if available
- [ ] Add notes or attachments

**Create Daily Status Records:**
- [ ] Decide if you need daily status tracking
- [ ] If yes, create daily status for AOG periods
- [ ] This enables availability percentage calculations

### Documentation

- [ ] Save import log (if available)
- [ ] Note any issues encountered
- [ ] Document any data corrections made
- [ ] Update team on import completion

### Training

- [ ] Show team where to find AOG events
- [ ] Demonstrate how to filter and search
- [ ] Explain how to create new events
- [ ] Review analytics and reports

---

## Troubleshooting Checklist

### Backend Not Starting

- [ ] Check MongoDB is running
- [ ] Check port 3000 is not in use
- [ ] Check `.env` file exists in backend folder
- [ ] Check database connection string is correct
- [ ] Run `npm install` again if needed

### Frontend Not Starting

- [ ] Check port 5173 is not in use
- [ ] Check `.env` file exists in frontend folder
- [ ] Check API URL is correct (http://localhost:3000)
- [ ] Run `npm install` again if needed

### Login Issues

- [ ] Verify credentials are correct
- [ ] Check backend is running
- [ ] Check network tab in browser (F12)
- [ ] Try creating a new user if needed

### Upload Issues

- [ ] Verify file is `.xlsx` format (not `.xls` or `.csv`)
- [ ] Check file size is reasonable (< 10MB)
- [ ] Verify file is not corrupted
- [ ] Try re-downloading the file

### Validation Errors

**"Aircraft not found":**
- [ ] Create missing aircraft first
- [ ] Verify registration spelling matches exactly
- [ ] Check for extra spaces or special characters

**"Invalid date format":**
- [ ] Check date is YYYY-MM-DD format
- [ ] Check time is HH:MM format (24-hour)
- [ ] Verify no extra characters or spaces

**"Category not recognized":**
- [ ] Check category is one of: AOG, S-MX, U-MX, MRO, CLEANING
- [ ] Verify exact spelling (case-sensitive)
- [ ] Check for typos

### Import Fails

- [ ] Check backend logs for errors
- [ ] Check browser console for errors
- [ ] Verify database connection is active
- [ ] Try importing smaller batch (10-20 events)
- [ ] Contact system administrator if needed

---

## Success Criteria

Import is successful when:

✅ All 197 events imported without errors  
✅ Events appear in AOG Events list  
✅ Filters work correctly  
✅ Individual event details display properly  
✅ Analytics show data  
✅ No duplicate events created  

---

## Next Steps After Successful Import

1. **Review and validate data**
2. **Update critical events with additional details**
3. **Set up ongoing data entry process**
4. **Train team on using the system**
5. **Start using full AOG form for new events**

---

## Quick Reference

**Files:**
- Import file: `aog_historical_data_import.xlsx`
- Instructions: `AOG-HISTORICAL-DATA-IMPORT-INSTRUCTIONS.md`
- Format mapping: `AOG-DATA-FORMAT-MAPPING.md`
- Summary: `AOG-DATA-READY-SUMMARY.md`

**URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Import page: http://localhost:5173/import
- AOG Events: http://localhost:5173/aog/list
- AOG Analytics: http://localhost:5173/aog/analytics

**Credentials:**
- Admin: admin@alphastarav.com / Admin@123!
- Editor: editor@alphastarav.com / Editor@123!
- Viewer: viewer@alphastarav.com / Viewer@123!

---

**Last Updated:** January 31, 2026  
**Version:** 1.0  
**Status:** Ready for import
