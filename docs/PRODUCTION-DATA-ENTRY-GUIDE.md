# Production Data Entry Guide - Alpha Star Aviation KPIs Dashboard

## Overview

This guide provides a step-by-step workflow for entering actual operational data into the Alpha Star Aviation KPIs Dashboard for production use.

**Important:** The production seed script creates ONLY:
- ✅ Admin user account
- ✅ 27 aircraft master records

**NO dummy data** is created. You will input all actual operational data.

---

## Prerequisites

### 1. Run Production Seed Script

```cmd
cd backend
npx ts-node -r tsconfig-paths/register src/scripts/seed-production.ts
```

This creates:
- Admin user: `admin@alphastarav.com` / `Admin@123!`
- 27 aircraft from Alpha Star fleet

### 2. Start the Application

```cmd
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Access the Dashboard

Navigate to: **http://localhost:5173**

---

## Data Entry Workflow (In Order)

### STEP 1: Initial Login & Security Setup

#### 1.1 First Login
```
URL: http://localhost:5173
Email: admin@alphastarav.com
Password: Admin@123!
```

#### 1.2 Change Admin Password (CRITICAL!)
1. Click on your profile (top right)
2. Select "Change Password"
3. Enter a strong, unique password
4. Save and re-login

**⚠️ SECURITY:** Never use the default password in production!

---

### STEP 2: Create User Accounts

Navigate to: **Admin Panel** (sidebar)

#### 2.1 Create Editor Accounts (Operations Team)
Create accounts for staff who will input daily data:

**Example:**
```
Name: Operations Manager
Email: ops@alphastarav.com
Role: Editor
Password: [Generate strong password]
```

**Recommended Editor Accounts:**
- Operations Manager (daily status, utilization)
- Maintenance Manager (AOG events, maintenance tasks)
- Planning Manager (work orders, discrepancies)

#### 2.2 Create Viewer Accounts (Management)
Create read-only accounts for executives:

**Example:**
```
Name: Fleet Manager
Email: fleet@alphastarav.com
Role: Viewer
Password: [Generate strong password]
```

**Recommended Viewer Accounts:**
- CEO / Fleet Director
- Finance Manager
- Operations Director

---

### STEP 3: Verify & Update Aircraft Master Data

Navigate to: **Aircraft** (sidebar)

#### 3.1 Review All Aircraft
- Verify all 27 aircraft are listed
- Check registration numbers are correct
- Verify fleet groups and types

#### 3.2 Update Missing Information
For each aircraft with incomplete data:

1. Click on the aircraft
2. Click "Edit" button
3. Fill in missing fields:
   - Aircraft Type (if blank)
   - MSN (if blank)
   - Manufacture Date (if available)
   - Certification Date (if available)
   - In-Service Date (if available)
4. Save changes

#### 3.3 Update Aircraft Status
If any aircraft are currently:
- **Parked:** Change status to "Parked"
- **Leased:** Change status to "Leased"
- **Out of service:** Change status to "Parked"

---

### STEP 4: Input Current Utilization Counters (CRITICAL!)

**This is the most important step** - establishes baseline for all future tracking.

Navigate to: **Aircraft Detail Page** for each aircraft

#### 4.1 Gather Current Counter Data
For each aircraft, collect from maintenance records:
- Airframe Hours TTSN (Total Time Since New)
- Airframe Cycles TCSN (Total Cycles Since New)
- Engine 1 Hours and Cycles
- Engine 2 Hours and Cycles
- Engine 3 Hours and Cycles (4-engine aircraft only)
- Engine 4 Hours and Cycles (4-engine aircraft only)
- APU Hours
- Last Flight Date

#### 4.2 Manual Entry Method

**For each aircraft:**

1. Navigate to Aircraft page
2. Click on aircraft (e.g., HZ-A42)
3. Scroll to "Utilization Counters" section
4. Click "Add Counter Record"
5. Enter today's date
6. Enter current counter values:
   ```
   Date: 2025-01-31
   Airframe Hours TTSN: 12,500.5
   Airframe Cycles TCSN: 4,200
   Engine 1 Hours: 8,500.2
   Engine 1 Cycles: 3,100
   Engine 2 Hours: 8,450.8
   Engine 2 Cycles: 3,050
   APU Hours: 6,200.0
   Last Flight Date: 2025-01-31
   ```
7. Save

**Repeat for all 27 aircraft.**

#### 4.3 Excel Import Method (Recommended for Bulk Entry)

**Faster method for entering all aircraft at once:**

1. Navigate to **Import** page
2. Select "Daily Utilization Counters" template
3. Click "Download Template"
4. Open Excel file
5. Fill in one row per aircraft with current counters:
   ```
   Aircraft Registration | Date       | Airframe Hours TTSN | Airframe Cycles TCSN | ...
   HZ-A42               | 2025-01-31 | 12500.5            | 4200                 | ...
   HZ-SKY1              | 2025-01-31 | 45000.0            | 15000                | ...
   ...
   ```
6. Save Excel file
7. Upload to Import page
8. Review validation results
9. Confirm import

**✅ Advantage:** Enter all 27 aircraft in one Excel file, import once.

---

### STEP 5: Start Daily Status Tracking

Navigate to: **Availability** page

#### 5.1 Understand Daily Status Fields

For each aircraft, each day, record:

| Field | Description | Example |
|-------|-------------|---------|
| **POS Hours** | Possessed hours (usually 24) | 24 |
| **NMCM-S Hours** | Scheduled maintenance downtime | 4 |
| **NMCM-U Hours** | Unscheduled maintenance downtime | 0 |
| **NMCS Hours** | Supply-related downtime (parts waiting) | 0 |
| **FMC Hours** | Auto-calculated: 24 - 4 - 0 - 0 = 20 | 20 |

**Availability = (20 / 24) × 100 = 83.3%**

#### 5.2 Daily Entry Process

**Every day, for each aircraft:**

1. Navigate to Availability page
2. Click "Add Daily Status"
3. Select aircraft
4. Select today's date
5. Enter hours:
   - POS Hours: 24 (default)
   - NMCM-S Hours: Hours in scheduled maintenance
   - NMCM-U Hours: Hours in unscheduled maintenance
   - NMCS Hours: Hours waiting for parts
6. Add notes if needed
7. Save

**Example Scenarios:**

**Scenario 1: Aircraft Fully Available**
```
POS: 24, NMCM-S: 0, NMCM-U: 0, NMCS: 0
FMC: 24 hours (100% available)
```

**Scenario 2: Scheduled Inspection**
```
POS: 24, NMCM-S: 6, NMCM-U: 0, NMCS: 0
FMC: 18 hours (75% available)
```

**Scenario 3: Unscheduled Repair**
```
POS: 24, NMCM-S: 0, NMCM-U: 8, NMCS: 0
FMC: 16 hours (66.7% available)
```

**Scenario 4: AOG (Waiting for Parts)**
```
POS: 24, NMCM-S: 0, NMCM-U: 0, NMCS: 24
FMC: 0 hours (0% available - AOG)
```

#### 5.3 Excel Import for Daily Status (Optional)

For bulk entry of multiple aircraft/days:

1. Navigate to Import page
2. Download "Daily Status" template
3. Fill in Excel with daily status for all aircraft
4. Upload and confirm

---

### STEP 6: Update Daily Utilization Counters (Ongoing)

**After each flight or daily:**

Navigate to: **Aircraft Detail Page** → Utilization Counters

#### 6.1 Daily Update Process

For each aircraft that flew:

1. Navigate to aircraft detail page
2. Click "Add Counter Record"
3. Enter today's date
4. Enter NEW cumulative values (not daily delta):
   ```
   Yesterday: Airframe Hours TTSN = 12,500.5
   Today flew 6.5 hours
   Enter: 12,507.0 (not 6.5!)
   ```
5. Save

**Important:** Always enter cumulative totals, not daily increments.

#### 6.2 Validation

The system will validate:
- ✅ New values >= previous day values (monotonic)
- ❌ Error if new value < previous value

---

### STEP 7: Setup Budget (Optional but Recommended)

Navigate to: **Budget** page

#### 7.1 Create Budget Plan

1. Click "Create Budget Plan"
2. Select fiscal year (e.g., 2025)
3. For each budget clause:
   - Select aircraft group (A330, G650ER, etc.)
   - Enter planned amount
   - Select currency (USD default)
4. Save

**Standard Budget Clauses:**
1. Aircraft Lease
2. Airframe Maintenance
3. Engines and APU Corporate Care Program
4. Landing Gear Overhaul
5. Component Repair
6. Spare Parts
7. Consumables
8. Ground Support Equipment
9. Fuel
10. Subscriptions
11. Insurance
12. Cabin Crew
13. Manpower
14. Handling and Permits
15. Catering
16. Communication
17. Miscellaneous
18. Training

#### 7.2 Record Actual Spend (Monthly)

1. Navigate to Budget page
2. Click "Record Actual Spend"
3. Select period (YYYY-MM format)
4. Select aircraft group
5. Select clause
6. Enter amount spent
7. Add vendor and notes
8. Save

---

### STEP 8: Begin Operational Tracking

#### 8.1 Log AOG Events

Navigate to: **AOG Events** → **Log Event**

**When an aircraft goes AOG:**

1. Click "Log AOG Event"
2. Fill in required fields:
   - Aircraft: Select from dropdown
   - Detected At: Date/time AOG was detected
   - Category: scheduled / unscheduled / aog
   - Reason Code: Brief description
   - Responsible Party: Internal / OEM / Customs / Finance / Other
   - Action Taken: What was done
   - Manpower Count: Number of technicians
   - Man Hours: Total labor hours
3. Optional milestone timestamps:
   - Reported At
   - Procurement Requested At
   - Available At Store At
   - Installation Complete At
   - Test Start At
   - Up And Running At
4. Costs:
   - Internal Cost (labor)
   - External Cost (parts, vendors)
5. Save

**When AOG is cleared:**
1. Navigate to AOG Events
2. Find the event
3. Click "Edit"
4. Enter "Cleared At" date/time
5. Update milestone timestamps if needed
6. Save

#### 8.2 Record Maintenance Tasks

Navigate to: **Maintenance** page

**Daily or per-shift:**

1. Click "Add Maintenance Task"
2. Fill in:
   - Aircraft
   - Date
   - Shift: Morning / Evening / Night / Other
   - Task Type: Routine Inspection / Scheduled Maintenance / etc.
   - Task Description
   - Manpower Count
   - Man Hours
   - Cost (optional)
3. Save

#### 8.3 Track Work Orders

Navigate to: **Work Orders** page

**When opening a work order:**

1. Click "Create Work Order"
2. Fill in:
   - WO Number: Unique identifier
   - Aircraft
   - Description
   - Status: Open
   - Date In: Today
   - Due Date: Target completion
3. Save

**When closing a work order:**

1. Find the work order
2. Click "Edit"
3. Update:
   - Status: Closed
   - Date Out: Completion date
   - CRS Number: Certificate of Release to Service
4. Save

#### 8.4 Document Discrepancies

Navigate to: **Discrepancies** page

**When a defect is found:**

1. Click "Add Discrepancy"
2. Fill in:
   - Aircraft
   - Date Detected
   - ATA Chapter: e.g., "21" (Air Conditioning)
   - Discrepancy Text: Description
   - Responsibility: Internal / OEM / etc.
3. Save

**When corrected:**

1. Find the discrepancy
2. Click "Edit"
3. Update:
   - Date Corrected
   - Corrective Action: What was done
4. Save

---

## Data Entry Best Practices

### Daily Routine (Recommended)

**Morning (Operations Team):**
1. ✅ Update yesterday's daily status for all aircraft
2. ✅ Update utilization counters for aircraft that flew yesterday
3. ✅ Review any active AOG events

**Throughout the Day:**
1. ✅ Log new AOG events as they occur
2. ✅ Record maintenance tasks per shift
3. ✅ Update work order statuses

**End of Day:**
1. ✅ Verify all daily status entries are complete
2. ✅ Check for any missing utilization counter updates
3. ✅ Review dashboard for data quality

### Weekly Tasks

**Monday:**
1. ✅ Review previous week's availability metrics
2. ✅ Check for overdue work orders
3. ✅ Verify all AOG events are properly documented

**Friday:**
1. ✅ Generate weekly report from dashboard
2. ✅ Review fleet availability trends
3. ✅ Plan next week's scheduled maintenance

### Monthly Tasks

**First Week of Month:**
1. ✅ Close previous month's work orders
2. ✅ Record actual spend for budget tracking
3. ✅ Generate monthly executive report
4. ✅ Review YoY comparison metrics

---

## Excel Import Templates

For bulk data entry, use Excel import:

### Available Templates

1. **Aircraft Master** - Update aircraft information
2. **Daily Utilization Counters** - Bulk counter entry
3. **Daily Status** - Bulk availability entry
4. **Maintenance Tasks** - Bulk task entry
5. **AOG Events** - Bulk AOG entry
6. **Budget Plan** - Bulk budget setup

### Import Process

1. Navigate to **Import** page
2. Select template type
3. Click "Download Template"
4. Fill in Excel file (follow column headers exactly)
5. Save file
6. Click "Upload File"
7. Review validation results
8. Fix any errors (red rows)
9. Click "Confirm Import"

**✅ Advantage:** Import hundreds of records at once instead of manual entry.

---

## Data Quality Checks

### Daily Checks

- [ ] All aircraft have daily status entry for today
- [ ] All aircraft that flew have updated counters
- [ ] All AOG events have proper timestamps
- [ ] No negative availability percentages

### Weekly Checks

- [ ] Fleet availability is within expected range (85-95%)
- [ ] No aircraft missing data for >2 days
- [ ] All closed AOG events have cleared dates
- [ ] Work order statuses are up to date

### Monthly Checks

- [ ] Budget actual spend is recorded
- [ ] All work orders are properly closed or updated
- [ ] Discrepancies are reviewed and corrected
- [ ] Executive dashboard shows accurate metrics

---

## Troubleshooting

### Issue: "Counter values cannot decrease"

**Problem:** Trying to enter a value lower than previous day

**Solution:** 
- Check previous day's value
- Enter cumulative total, not daily delta
- If counter was reset (e.g., engine replacement), document in notes

### Issue: "Hours must be between 0 and 24"

**Problem:** Daily status hours exceed 24

**Solution:**
- Verify POS hours = 24 (or actual possessed hours)
- Ensure NMCM-S + NMCM-U + NMCS ≤ POS hours
- Check for data entry errors

### Issue: Missing aircraft in dropdown

**Problem:** Aircraft not showing in selection lists

**Solution:**
- Verify aircraft exists in Aircraft page
- Check aircraft status (Parked aircraft may be filtered)
- Refresh browser page

---

## Support & Documentation

### In-App Help

- Click **Help** icon (?) in top navigation
- Access context-sensitive help on each page
- View glossary for aviation terms

### Documentation Files

- `DAILY-COUNTERS-VS-STATUS-EXPLAINED.md` - Understanding metrics
- `LOCAL-SETUP-GUIDE.md` - Technical setup
- `QUICK-START.md` - Feature overview
- `DEMO-GUIDE.md` - Demo scenarios

### API Documentation

- Navigate to: http://localhost:3000/api
- Swagger UI with all endpoints
- Test API calls directly

---

## Summary Checklist

### Initial Setup (One-Time)
- [ ] Run production seed script
- [ ] Change admin password
- [ ] Create user accounts (Editors, Viewers)
- [ ] Verify aircraft master data
- [ ] Input current utilization counters (all 27 aircraft)

### Daily Operations (Ongoing)
- [ ] Update daily status (availability)
- [ ] Update utilization counters (after flights)
- [ ] Log AOG events (as they occur)
- [ ] Record maintenance tasks (per shift)
- [ ] Update work order statuses

### Weekly Tasks
- [ ] Review availability metrics
- [ ] Check overdue work orders
- [ ] Verify data completeness

### Monthly Tasks
- [ ] Record budget actual spend
- [ ] Close completed work orders
- [ ] Generate executive reports
- [ ] Review YoY trends

---

**Ready to begin? Start with STEP 1: Initial Login & Security Setup**

For questions or issues, refer to the documentation or contact your system administrator.
