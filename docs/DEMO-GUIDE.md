# Alpha Star Aviation KPIs Dashboard - Demo Guide

## Introduction

Welcome to the Alpha Star Aviation KPIs Dashboard demonstration guide. This document provides everything you need to successfully present the dashboard to stakeholders, including aviation terminology, module descriptions, a step-by-step demo script, and expected outcomes.

---

## Glossary of Aviation Terms

### Availability & Status Terms

| Term | Full Name | Description |
|------|-----------|-------------|
| **FMC** | Fully Mission Capable | Hours per day an aircraft is available for flight operations (typically 18-24 hours) |
| **NMC** | Not Mission Capable | Hours when aircraft cannot perform missions |
| **NMCM-S** | Not Mission Capable Maintenance - Scheduled | Downtime due to planned maintenance activities |
| **NMCM-U** | Not Mission Capable Maintenance - Unscheduled | Downtime due to unexpected maintenance needs |
| **NMCS** | Not Mission Capable Supply | Downtime waiting for parts or supplies |
| **POS** | Possessed Hours | Total hours aircraft is in possession (typically 24 hours/day) |
| **AOG** | Aircraft On Ground | Critical status when aircraft cannot fly due to maintenance issues |

### Counter & Utilization Terms

| Term | Full Name | Description |
|------|-----------|-------------|
| **TTSN** | Total Time Since New | Cumulative flight hours since aircraft manufacture |
| **TCSN** | Total Cycles Since New | Cumulative takeoff/landing cycles since manufacture |
| **FH** | Flight Hours | Hours of actual flight time |
| **FC** | Flight Cycles | Number of takeoff/landing cycles |
| **APU** | Auxiliary Power Unit | Secondary power system for ground operations |
| **MSN** | Manufacturer Serial Number | Unique identifier assigned by aircraft manufacturer |

### Maintenance Terms

| Term | Description |
|------|-------------|
| **Work Order (WO)** | Formal document authorizing maintenance work |
| **CRS** | Certificate of Release to Service - confirms maintenance completion |
| **MR** | Maintenance Release - authorization to return aircraft to service |
| **OEM** | Original Equipment Manufacturer (e.g., Airbus, Boeing) |


### ATA Chapters

ATA (Air Transport Association) chapters are standardized codes for aircraft systems. The dashboard tracks discrepancies by these chapters:

| Chapter | System |
|---------|--------|
| **21** | Air Conditioning |
| **24** | Electrical Power |
| **27** | Flight Controls |
| **29** | Hydraulic Power |
| **32** | Landing Gear |
| **34** | Navigation |
| **36** | Pneumatic |
| **49** | Auxiliary Power Unit (APU) |
| **52** | Doors |
| **71** | Power Plant |
| **72** | Engine |
| **73** | Engine Fuel |
| **74** | Ignition |
| **78** | Exhaust |
| **79** | Oil |
| **80** | Starting |

### Budget Clauses

The dashboard tracks 18 standard budget categories:

| Clause | Description |
|--------|-------------|
| **1** | Aircraft Lease |
| **2** | Airframe Maintenance |
| **3** | Engines and APU Corporate Care Program |
| **4** | Landing Gear Overhaul |
| **5** | Component Repair |
| **6** | Spare Parts |
| **7** | Consumables |
| **8** | Ground Support Equipment |
| **9** | Fuel |
| **10** | Subscriptions |
| **11** | Insurance |
| **12** | Cabin Crew |
| **13** | Manpower |
| **14** | Handling and Permits |
| **15** | Catering |
| **16** | Communication |
| **17** | Miscellaneous |
| **18** | Training |

---

## Dashboard Modules

### 1. Executive Dashboard (`/`)

**Purpose:** Provides a high-level overview of fleet performance through key performance indicators (KPIs).

**Key Features:**
- Fleet Availability Percentage - real-time calculation based on FMC hours
- Total Flight Hours - aggregated across all aircraft
- Total Cycles - cumulative takeoff/landing count
- Active AOG Count - aircraft currently grounded
- Trend charts showing historical performance

**Who Uses It:** Executives, Operations Managers, Fleet Managers

### 2. Availability Module (`/availability`)

**Purpose:** Deep dive into aircraft availability metrics with filtering and trend analysis.

**Key Features:**
- Availability trend charts over time
- Aircraft-by-aircraft availability breakdown
- Filter by date range and aircraft
- Drill-down to daily status details
- Export availability reports

**Who Uses It:** Operations Managers, Maintenance Planners

### 3. Maintenance Module (`/maintenance`)

**Purpose:** Log and track shift-based maintenance activities with man-hours and costs.

**Key Features:**
- Log maintenance tasks by shift (Morning, Evening, Night)
- Track man-hours and costs per task
- Link tasks to work orders
- Summary statistics by aircraft, shift, and task type
- Cost analysis and trending

**Who Uses It:** Maintenance Supervisors, Shift Leads, Cost Analysts

### 4. AOG Events Module (`/aog-events`)

**Purpose:** Track Aircraft On Ground events with responsibility attribution for accountability.

**Key Features:**
- Log AOG events with start/end times
- Assign responsibility (Internal, OEM, Customs, Finance, Other)
- Track downtime duration and costs
- Responsibility attribution charts
- Active AOG monitoring

**Who Uses It:** Operations Managers, Maintenance Directors, Finance

### 5. Work Orders Module (`/work-orders`)

**Purpose:** Manage formal maintenance work orders with status tracking and turnaround time analysis.

**Key Features:**
- Create and track work orders
- Status workflow (Open → InProgress → Closed/Deferred)
- Due date tracking with overdue alerts
- Turnaround time metrics
- Link to maintenance tasks

**Who Uses It:** Maintenance Planners, Quality Assurance

### 6. Discrepancies Module (`/discrepancies`)

**Purpose:** Track defects and issues by ATA chapter for pattern analysis and reliability improvement.

**Key Features:**
- Log discrepancies with ATA chapter classification
- Track corrective actions
- Top defect categories chart
- Responsibility attribution
- Open vs. closed discrepancy tracking

**Who Uses It:** Quality Assurance, Reliability Engineers, Maintenance Directors

### 7. Budget Module (`/budget`)

**Purpose:** Track budget plans vs. actual spending with variance analysis.

**Key Features:**
- Budget vs. Actual comparison charts
- Variance visualization (under/over budget)
- Breakdown by budget clause
- Aircraft group filtering
- Burn rate analysis
- Cost per flight hour metrics

**Who Uses It:** Finance Managers, Operations Directors, Executives

### 8. Import Module (`/import`)

**Purpose:** Bulk data import from Excel files for efficient data entry.

**Key Features:**
- Download Excel templates for each data type
- Upload and validate Excel files
- Preview data before import
- Error reporting and validation
- Import history log

**Who Uses It:** Data Entry Staff, Administrators

### 9. Admin Module (`/admin`)

**Purpose:** User management and system administration with role-based access control.

**Key Features:**
- View all system users
- Create new users with role assignment
- Role descriptions (Admin, Editor, Viewer)
- Data health check panel
- Seed data trigger (for demo/testing)

**Who Uses It:** System Administrators

---


## Step-by-Step Demo Script

### Pre-Demo Setup

1. **Ensure the database is seeded** with demo data
   - Navigate to Admin page → Health Check Panel
   - Verify all collections show non-zero counts
   - If empty, click "Run Seed Script" button

2. **Verify the application is running**
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173`

---

### Demo Walkthrough

#### Step 1: Login (2 minutes)

1. Open the application at `http://localhost:5173`
2. You'll see the login page with Alpha Star Aviation branding
3. Login with Admin credentials:
   - Email: `admin@alphastarav.com`
   - Password: `Admin@123!`
4. **Talking Point:** "The system uses role-based access control. Admins have full access, Editors can modify data, and Viewers have read-only access."

#### Step 2: Executive Dashboard Overview (5 minutes)

1. After login, you land on the Executive Dashboard
2. **Highlight the four KPI cards:**
   - Fleet Availability: Shows real-time availability percentage
   - Total Flight Hours: Cumulative hours across the fleet
   - Total Cycles: Total takeoff/landing cycles
   - Active AOG: Number of aircraft currently grounded

3. **Talking Point:** "These KPIs replace the static Excel reports. The availability percentage is calculated dynamically from actual daily status data, not estimated."

4. **Show the trend charts:**
   - Point out the availability trend over time
   - Explain how this helps identify patterns

5. **Demonstrate auto-refresh:**
   - "The dashboard automatically refreshes every 30 seconds to show the latest data"

#### Step 3: Availability Deep Dive (5 minutes)

1. Click "Availability" in the sidebar
2. **Show the aircraft filter dropdown:**
   - "We can filter by specific aircraft or view the entire fleet"
   - Select a specific aircraft (e.g., HZ-A42)

3. **Show the date range filter:**
   - Adjust the date range to show last 30 days
   - Point out how the chart updates

4. **Highlight the availability table:**
   - "Each row shows daily FMC hours, scheduled downtime, and unscheduled downtime"
   - "This granular data feeds into the overall availability calculation"

5. **Talking Point:** "This replaces the manual Excel tracking where availability was estimated at ~92%. Now we have actual data."

#### Step 4: Maintenance Task Entry (5 minutes)

1. Click "Maintenance" in the sidebar
2. **Show the task list:**
   - Point out tasks organized by date and shift
   - Show the cost and man-hours columns

3. **Create a new task (if Editor/Admin):**
   - Click "Add Task"
   - Select an aircraft
   - Choose shift (Morning/Evening/Night)
   - Enter task type and description
   - Add man-hours and cost
   - Save the task

4. **Talking Point:** "Maintenance supervisors can log tasks in real-time during their shifts. This data feeds into cost analysis and resource planning."

5. **Show the summary statistics:**
   - Total tasks, man-hours, and costs
   - Breakdown by shift

#### Step 5: AOG Events & Responsibility (3 minutes)

1. Click "AOG Events" in the sidebar
2. **Show the responsibility chart:**
   - "This pie chart shows downtime attributed to each responsible party"
   - "Internal, OEM, Customs, Finance, and Other"

3. **Talking Point:** "This accountability tracking helps identify where delays are coming from and drives improvement initiatives."

4. **Show active AOG events:**
   - Point out any events without a cleared date
   - "These are aircraft currently on ground"

#### Step 6: Budget Analysis (5 minutes)

1. Click "Budget" in the sidebar
2. **Show the Budget vs. Actual chart:**
   - "Each bar represents a budget clause"
   - "Green indicates under budget, red indicates over budget"

3. **Filter by aircraft group:**
   - Select "A330" or "G650ER"
   - Show how the view updates

4. **Highlight variance analysis:**
   - Point out clauses that are over budget
   - "This helps finance identify areas needing attention"

5. **Talking Point:** "Budget tracking is now real-time instead of monthly Excel reconciliation."

#### Step 7: Export Demonstration (2 minutes)

1. Go to any data page (e.g., Availability)
2. **Click the Export button:**
   - "Data can be exported to Excel for offline analysis or reporting"
   - Show the downloaded file

3. **Talking Point:** "While we're moving away from Excel for daily operations, we still support Excel exports for stakeholders who need offline access."

#### Step 8: Admin & Health Check (3 minutes)

1. Click "Admin" in the sidebar
2. **Show the user list:**
   - "All system users with their roles"
   - Explain the three roles

3. **Show the Health Check panel:**
   - "This shows record counts for all collections"
   - "Useful for verifying the system has data"

4. **Talking Point:** "Administrators can manage users and monitor system health from this single page."

---


## Expected Outcomes

After running the seed script, the following should be populated:

### Data Counts (Approximate)

| Collection | Expected Records | Notes |
|------------|------------------|-------|
| Aircraft | 17 | All fleet groups represented |
| Daily Status | ~1,530 | 90 days × 17 aircraft |
| Utilization Counters | ~1,530 | 90 days × 17 aircraft |
| AOG Events | ~60 | 3-5 per aircraft |
| Maintenance Tasks | ~600 | Across all shifts |
| Work Orders | ~120 | All statuses represented |
| Discrepancies | ~90 | 16+ ATA chapters |
| Budget Plans | ~72 | 18 clauses × 4 groups |
| Actual Spend | ~864 | 12 months of data |
| Users | 3 | Admin, Editor, Viewer |

### Charts Should Display

| Page | Chart/Visualization | Expected Content |
|------|---------------------|------------------|
| Dashboard | KPI Cards | Non-zero values for all 4 KPIs |
| Dashboard | Availability Trend | Line chart with data points |
| Availability | Availability Chart | Trend line showing 85-95% range |
| Availability | Aircraft Table | All aircraft with daily data |
| Budget | Budget vs Actual | Bar chart with variance colors |
| AOG Events | Responsibility Chart | Pie/bar with all 5 parties |
| Discrepancies | Top ATA Chapters | Bar chart with 10+ chapters |
| Maintenance | Summary Stats | Task counts and costs |

### Dropdowns Should Populate

- Aircraft filter dropdown on all relevant pages
- Fleet group filter on budget page
- Shift filter on maintenance page
- Status filter on work orders page

### Export Functionality

| Feature | Location | Description |
|---------|----------|-------------|
| **Data Export** | All data pages | Export button downloads current view as Excel file |
| **Filtered Export** | Availability, Maintenance, etc. | Exports respect active filters (date range, aircraft) |
| **Template Download** | Import page | Download blank Excel templates for each data type |
| **Bulk Import** | Import page | Upload filled templates to bulk-create records |

**Available Export Types:**

| Data Type | Export Fields | Notes |
|-----------|---------------|-------|
| Aircraft | Registration, Type, Fleet Group, Owner, Status | Master data export |
| Daily Status | Date, Aircraft, FMC Hours, NMCM-S, NMCM-U | Availability data |
| Utilization | Date, Aircraft, TTSN, TCSN, Engine Hours | Counter readings |
| AOG Events | Aircraft, Dates, Duration, Responsibility, Costs | Downtime tracking |
| Maintenance Tasks | Date, Shift, Aircraft, Task Type, Man-Hours, Cost | Labor tracking |
| Work Orders | WO Number, Aircraft, Status, Dates, CRS/MR | Work order list |
| Discrepancies | Aircraft, ATA Chapter, Description, Status | Defect tracking |
| Budget | Clause, Aircraft Group, Planned vs Actual | Financial data |

**Import Templates:**

| Template | Purpose | Key Fields |
|----------|---------|------------|
| Aircraft Template | Add new aircraft to fleet | Registration, Type, MSN, Owner |
| Daily Status Template | Bulk upload availability data | Date, Aircraft, FMC Hours |
| Utilization Template | Bulk upload counter readings | Date, Aircraft, TTSN, TCSN |
| Maintenance Template | Bulk upload maintenance tasks | Date, Shift, Task Type, Hours |

---

## Login Credentials

### Demo Users

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@alphastarav.com` | `Admin@123!` | Full access: read, create, update, delete, user management |
| **Editor** | `editor@alphastarav.com` | `Editor@123!` | Read and write: can create and update records |
| **Viewer** | `viewer@alphastarav.com` | `Viewer@123!` | Read-only: can view all data but cannot modify |

### Role Capabilities

| Capability | Admin | Editor | Viewer |
|------------|-------|--------|--------|
| View Dashboard | ✓ | ✓ | ✓ |
| View All Data | ✓ | ✓ | ✓ |
| Export Data | ✓ | ✓ | ✓ |
| Create Records | ✓ | ✓ | ✗ |
| Update Records | ✓ | ✓ | ✗ |
| Delete Records | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ |
| Run Seed Script | ✓ | ✗ | ✗ |

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Empty dropdowns | Run the seed script from Admin page |
| Charts show no data | Verify date range includes seeded data (last 90 days) |
| Login fails | Check credentials are correct (case-sensitive password) |
| API errors | Ensure backend is running on port 3000 |
| Slow loading | Check MongoDB connection; may need to wait for initial load |

### Quick Fixes

1. **Reset Demo Data:**
   - Go to Admin → Health Check
   - Click "Run Seed Script"
   - Wait for completion message

2. **Clear Browser Cache:**
   - If UI looks broken, clear browser cache and refresh

3. **Check Backend Status:**
   - Visit `http://localhost:3000/api` to verify API is running

---

## Contact

For technical support during the demo, contact the development team.

---

*Last Updated: December 2025*
