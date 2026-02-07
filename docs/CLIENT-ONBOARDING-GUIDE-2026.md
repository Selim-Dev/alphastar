# Alpha Star Aviation KPIs Dashboard - Client Onboarding Guide 2026

## Executive Summary

This document provides a step-by-step guide for Alpha Star Aviation to start using the KPIs Dashboard system in 2026. It outlines exactly what data needs to be collected, in what format, and in what order.

---

## Part 1: Getting Started - What You Need to Do First

### Step 1: Verify Your Aircraft Fleet (REQUIRED FIRST)

Before anything else, we need to confirm your current fleet. The system is pre-configured with these aircraft:

| Registration | Fleet Group | Aircraft Type | Engines | Owner | Status |
|--------------|-------------|---------------|---------|-------|--------|
| HZ-A42 | A340 | A340-642 | 4 | Alpha Star Aviation | Active |
| HZ-SKY1 | A340 | A340-212 | 4 | Sky Prime Aviation | Active |
| HZ-SKY2 | A330 | A330-243 | 2 | Sky Prime Aviation | Active |
| HZ-A2 | A320 | A320-214 | 2 | Alpha Star Aviation | Parked |
| HZ-A3 | A320 | A320-214 | 2 | Alpha Star Aviation | Active |
| HZ-A4 | A319 | A319-112 | 2 | Alpha Star Aviation | Active |
| HZ-A5 | A318 | A318-112 | 2 | Alpha Star Aviation | Active |
| HZ-A15 | A320 | A320-216 | 2 | Alpha Star Aviation | Active |
| HZ-SKY4 | A319 | A319-115 | 2 | Sky Prime Aviation | Active |
| HZ-A8 | Hawker | Hawker 900XP | 2 | Alpha Star Aviation | Active |
| HZ-A9 | Hawker | Hawker 900XP | 2 | Alpha Star Aviation | Active |
| HZ-A22 | G650ER | G650ER | 2 | Alpha Star Aviation | Active |
| HZ-A23 | G650ER | G650ER | 2 | Alpha Star Aviation | Active |
| HZ-133 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-134 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-135 | Cessna | Citation Bravo | 2 | RSAF | Active |
| HZ-136 | Cessna | Citation Bravo | 2 | RSAF | Active |

**ACTION REQUIRED**: Please confirm:
1. Is this list accurate?
2. Are there any aircraft to add or remove?
3. Are the statuses (Active/Parked/Leased) correct?
4. Are the owners correct?

---

## Part 2: Budget Module - How to Start

### Understanding the Budget System

The budget system tracks 18 expense categories (clauses) across 4 aircraft groups:

**Aircraft Groups**: A330, G650ER, Cessna, PMO (Program Management Office)

**18 Budget Clauses**:
| ID | Clause Description |
|----|-------------------|
| 1 | Aircraft Lease |
| 2 | Airframe Maintenance |
| 3 | Engines and APU Corporate Care Program |
| 4 | Landing Gear Overhaul |
| 5 | Component Repair |
| 6 | Spare Parts |
| 7 | Consumables |
| 8 | Ground Support Equipment |
| 9 | Fuel |
| 10 | Subscriptions |
| 11 | Insurance |
| 12 | Cabin Crew |
| 13 | Manpower |
| 14 | Handling and Permits |
| 15 | Catering |
| 16 | Communication |
| 17 | Miscellaneous |
| 18 | Training |

### What Data We Need for Budget 2026

**DATA REQUEST #1: Annual Budget Plan for 2026**

Please provide the planned annual budget for each clause and aircraft group in this format:

```
| Aircraft Group | Clause ID | Clause Description | Planned Amount (USD) |
|----------------|-----------|-------------------|---------------------|
| A330           | 1         | Aircraft Lease    | $2,500,000          |
| A330           | 2         | Airframe Maintenance | $1,800,000       |
| A330           | 3         | Engines and APU   | $2,200,000          |
| ... (continue for all 18 clauses) |
| G650ER         | 1         | Aircraft Lease    | $3,000,000          |
| ... (continue for all 18 clauses) |
| Cessna         | 1         | Aircraft Lease    | $800,000            |
| ... (continue for all 18 clauses) |
| PMO            | 1         | Aircraft Lease    | $0                  |
| ... (continue for all 18 clauses) |
```

**Total records needed**: 72 (18 clauses × 4 groups)

### How Budget Tracking Works

1. **You enter**: Annual planned budget for 2026 (one-time setup)
2. **Monthly**: You enter actual spending per clause per aircraft group
3. **System calculates**: 
   - Budget variance (planned vs actual)
   - Burn rate (how fast you're spending)
   - Projected remaining budget
   - Year-over-year comparison

### Entering Actual Spend

Once budget is set up, you'll enter monthly actual spending:

```
| Period  | Aircraft Group | Clause ID | Amount (USD) | Vendor (optional) | Notes |
|---------|----------------|-----------|--------------|-------------------|-------|
| 2026-01 | A330           | 2         | $150,000     | Airbus Services   | January maintenance |
| 2026-01 | A330           | 5         | $45,000      | Component Repair Inc | Hydraulic pump |
```

---

## Part 3: Daily Operations Data

### 3.1 Daily Status (Availability Tracking)

**Purpose**: Track how many hours each aircraft is available for flight each day.

**DATA REQUEST #2: Daily Availability Data**

For each aircraft, for each day, we need:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Date | YYYY-MM-DD format | 2026-01-10 |
| POS Hours | Possessed hours (usually 24) | 24 |
| FMC Hours | Fully Mission Capable hours | 22.5 |
| NMCM-S Hours | Scheduled maintenance downtime | 0.5 |
| NMCM-U Hours | Unscheduled maintenance downtime | 1 |
| NMCS Hours | Supply-related downtime (optional) | 0 |
| Notes | Any relevant notes | "Routine inspection" |

**Formula**: FMC Hours = POS Hours - NMCM-S Hours - NMCM-U Hours - NMCS Hours

**Example**:
```
| Registration | Date       | POS | FMC  | NMCM-S | NMCM-U | NMCS | Notes |
|--------------|------------|-----|------|--------|--------|------|-------|
| HZ-A42       | 2026-01-10 | 24  | 24   | 0      | 0      | 0    | Full availability |
| HZ-A42       | 2026-01-11 | 24  | 20   | 4      | 0      | 0    | Scheduled maintenance |
| HZ-A42       | 2026-01-12 | 24  | 22.5 | 0      | 1.5    | 0    | Minor repair |
```

**How often**: Daily (can be entered daily or imported weekly/monthly)

### 3.2 Daily Counters (Utilization Tracking)

**Purpose**: Track cumulative flight hours and cycles for airframe, engines, and APU.

**DATA REQUEST #3: Daily Counter Readings**

For each aircraft, for each day, we need:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Date | YYYY-MM-DD format | 2026-01-10 |
| Airframe Hours TTSN | Total Time Since New | 12,500.5 |
| Airframe Cycles TCSN | Total Cycles Since New | 4,500 |
| Engine 1 Hours | Engine 1 total hours | 11,000.25 |
| Engine 1 Cycles | Engine 1 total cycles | 4,200 |
| Engine 2 Hours | Engine 2 total hours | 10,800.75 |
| Engine 2 Cycles | Engine 2 total cycles | 4,100 |
| Engine 3 Hours | Engine 3 (4-engine only) | 9,500.0 |
| Engine 3 Cycles | Engine 3 cycles (4-engine only) | 3,800 |
| Engine 4 Hours | Engine 4 (4-engine only) | 9,200.5 |
| Engine 4 Cycles | Engine 4 cycles (4-engine only) | 3,700 |
| APU Hours | APU total hours | 8,500.25 |

**CRITICAL RULE**: Counter values must ALWAYS increase or stay the same. They can NEVER decrease.

**Example for 4-engine aircraft (A340)**:
```
| Reg    | Date       | AF Hours | AF Cycles | E1 Hrs | E1 Cyc | E2 Hrs | E2 Cyc | E3 Hrs | E3 Cyc | E4 Hrs | E4 Cyc | APU Hrs |
|--------|------------|----------|-----------|--------|--------|--------|--------|--------|--------|--------|--------|---------|
| HZ-A42 | 2026-01-10 | 12500.5  | 4500      | 11000  | 4200   | 10800  | 4100   | 9500   | 3800   | 9200   | 3700   | 8500    |
| HZ-A42 | 2026-01-11 | 12506.2  | 4502      | 11005  | 4202   | 10805  | 4102   | 9505   | 3802   | 9205   | 3702   | 8502    |
```

**Example for 2-engine aircraft (A330, G650ER, etc.)**:
```
| Reg     | Date       | AF Hours | AF Cycles | E1 Hrs | E1 Cyc | E2 Hrs | E2 Cyc | APU Hrs |
|---------|------------|----------|-----------|--------|--------|--------|--------|---------|
| HZ-SKY2 | 2026-01-10 | 8500.0   | 3200      | 8200   | 3100   | 8150   | 3050   | 4500    |
| HZ-SKY2 | 2026-01-11 | 8504.5   | 3201      | 8204   | 3101   | 8154   | 3051   | 4501    |
```

---

## Part 4: AOG Events (Aircraft On Ground)

### Understanding AOG Tracking

When an aircraft is grounded, the system tracks:
- When it was detected
- Why it was grounded
- Who is responsible
- What actions were taken
- Parts needed and procurement status
- Costs incurred
- When it returned to service

### DATA REQUEST #4: Current/Recent AOG Events

For any aircraft currently grounded or recently grounded, we need:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Detected At | When AOG was detected | 2026-01-08 14:30 |
| Cleared At | When returned to service (blank if still grounded) | 2026-01-14 11:00 |
| Category | scheduled, unscheduled, or aog | unscheduled |
| Reason Code | Why grounded | Hydraulic System Failure - ATA 29 |
| Responsible Party | Internal, OEM, Customs, Finance, Other | Internal |
| Action Taken | What was done | Replaced hydraulic pump |
| Manpower Count | Number of technicians | 3 |
| Man Hours | Total labor hours | 24 |
| Labor Cost | Cost of labor | $2,200 |
| Parts Cost | Cost of parts | $15,000 |
| External Cost | External services cost | $450 |

### AOG Workflow States

The system tracks AOG events through 18 workflow states:

1. REPORTED → 2. TROUBLESHOOTING → 3. ISSUE_IDENTIFIED → 4. RESOLVED_NO_PARTS (or)
5. PART_REQUIRED → 6. PROCUREMENT_REQUESTED → 7. FINANCE_APPROVAL_PENDING →
8. ORDER_PLACED → 9. IN_TRANSIT → 10. AT_PORT → 11. CUSTOMS_CLEARANCE →
12. RECEIVED_IN_STORES → 13. ISSUED_TO_MAINTENANCE → 14. INSTALLED_AND_TESTED →
15. ENGINE_RUN_REQUESTED → 16. ENGINE_RUN_COMPLETED → 17. BACK_IN_SERVICE → 18. CLOSED

---

## Part 5: Maintenance Tasks

### DATA REQUEST #5: Maintenance Activity Log

For maintenance activities, we need:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Date | Task date | 2026-01-10 |
| Shift | Morning, Evening, Night, Other | Morning |
| Task Type | Type of maintenance | Routine Inspection |
| Task Description | Detailed description | Routine inspection on HZ-A42 |
| Manpower Count | Number of technicians | 2 |
| Man Hours | Total labor hours | 4.5 |
| Cost | Task cost (optional) | $2,500 |

**Task Types** (examples):
- Routine Inspection
- Scheduled Maintenance
- Component Replacement
- System Check
- Lubrication
- Cleaning
- Calibration
- Software Update
- Structural Inspection
- Engine Inspection

---

## Part 6: Work Order Summaries

### Understanding Work Order Tracking

Instead of tracking individual work orders, the system uses monthly summaries per aircraft.

### DATA REQUEST #6: Monthly Work Order Counts

For each aircraft, for each month, we need:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Period | YYYY-MM format | 2026-01 |
| Work Order Count | Number of work orders | 12 |
| Total Cost | Total cost (optional) | $45,000 |
| Notes | Any relevant notes | Routine maintenance |

**Example**:
```
| Registration | Period  | WO Count | Total Cost | Notes |
|--------------|---------|----------|------------|-------|
| HZ-A42       | 2026-01 | 12       | $45,000    | Routine maintenance |
| HZ-A42       | 2026-02 | 8        | $32,000    | Light month |
| HZ-SKY2      | 2026-01 | 10       | $38,000    | Heavy maintenance |
```

---

## Part 7: Discrepancies (Defects)

### DATA REQUEST #7: Defect/Discrepancy Log

For tracking defects by ATA chapter:

| Field | Description | Example |
|-------|-------------|---------|
| Aircraft Registration | Tail number | HZ-A42 |
| Date Detected | When found | 2026-01-10 |
| ATA Chapter | Standard ATA code | 29 |
| Discrepancy Text | Description | Hydraulic leak observed |
| Date Corrected | When fixed (blank if open) | 2026-01-12 |
| Corrective Action | How it was fixed | Seal replaced |
| Responsibility | Internal, OEM, Customs, Finance, Other | Internal |
| Downtime Hours | Hours of downtime | 4.5 |

**Common ATA Chapters**:
| Code | Description |
|------|-------------|
| 21 | Air Conditioning |
| 24 | Electrical Power |
| 27 | Flight Controls |
| 29 | Hydraulic Power |
| 32 | Landing Gear |
| 34 | Navigation |
| 36 | Pneumatic |
| 49 | APU |
| 52 | Doors |
| 71 | Power Plant |
| 72 | Engine |
| 73 | Engine Fuel |
| 74 | Ignition |
| 78 | Exhaust |
| 79 | Oil |
| 80 | Starting |

---

## Part 8: Vacation Plans

### DATA REQUEST #8: Team Vacation Schedules

For Engineering and TPL teams, we need a 48-week vacation schedule:

**Format**: Excel file with two sheets (Engineering, TPL)

Each sheet structure:
- Column A: Employee Name
- Columns B-AY: Week 1 to Week 48 (numeric values: 0, 0.5, 1, etc.)

**Cell Values**:
- 0 = No vacation
- 0.5 = Half week vacation
- 1 = Full week vacation

**Example**:
```
| Employee Name    | W1 | W2 | W3 | W4 | W5 | ... | W48 |
|------------------|----|----|----|----|----| ... |-----|
| Ahmed Al-Rashid  | 0  | 1  | 0.5| 0  | 0  | ... | 0   |
| Fatima Hassan    | 0  | 0  | 1  | 0  | 0  | ... | 1   |
| Mohammed Ali     | 0  | 1  | 0  | 0  | 0  | ... | 0   |
```

---

## Part 9: Historical Data (For Year-over-Year Comparison)

### DATA REQUEST #9: 2025 Historical Data

To enable year-over-year comparison, we need 2025 data for:

1. **Daily Status** (last 90 days of 2025 minimum)
2. **Daily Counters** (last 90 days of 2025 minimum)
3. **Budget Plans** (2025 annual budget)
4. **Actual Spend** (2025 monthly spending)

---

## Part 10: Data Collection Summary

### Priority 1 - Required to Start (Week 1)

| Data Type | Format | Records Needed | Who Provides |
|-----------|--------|----------------|--------------|
| Aircraft Fleet Confirmation | List | 16-20 aircraft | Operations |
| Budget Plan 2026 | Excel | 72 records (18 clauses × 4 groups) | Finance |
| Current Counter Readings | Excel | 1 per aircraft | Maintenance |

### Priority 2 - Core Operations (Week 2-3)

| Data Type | Format | Records Needed | Who Provides |
|-----------|--------|----------------|--------------|
| Daily Status (Jan 2026) | Excel | ~300 records | Operations |
| Daily Counters (Jan 2026) | Excel | ~300 records | Maintenance |
| Active AOG Events | Form/Excel | As needed | Maintenance |

### Priority 3 - Historical & Supporting (Week 3-4)

| Data Type | Format | Records Needed | Who Provides |
|-----------|--------|----------------|--------------|
| Maintenance Tasks | Excel | 100-500 records | Maintenance |
| Work Order Summaries | Excel | 12 months × 16 aircraft | Maintenance |
| Discrepancies | Excel | 50-200 records | Quality |
| Actual Spend 2025 | Excel | 864 records | Finance |

### Priority 4 - Optional (Week 4+)

| Data Type | Format | Records Needed | Who Provides |
|-----------|--------|----------------|--------------|
| Vacation Plans 2026 | Excel | 2 sheets | HR |
| Historical Daily Status 2025 | Excel | ~1,400 records | Operations |
| Historical Counters 2025 | Excel | ~1,400 records | Maintenance |

---

## Part 11: Excel Templates

The system provides downloadable Excel templates for all data types. Access them at:

**Import Page** → Select Template Type → Download Template

Available templates:
- Aircraft
- Daily Status
- Daily Counter
- AOG Events
- Maintenance Tasks
- Work Order Summary
- Discrepancies
- Budget Plans
- Actual Spend
- Vacation Plans

---

## Part 12: Questions for the Client

Please answer these questions to help us configure the system correctly:

### Fleet Questions
1. Is the aircraft list accurate? Any additions/removals?
2. Are there any aircraft status changes (Active → Parked, etc.)?
3. Are the owner assignments correct?

### Budget Questions
4. What is your fiscal year? (Calendar year Jan-Dec or different?)
5. Do you have the 2026 budget plan ready?
6. What currency do you use? (USD assumed)

### Operations Questions
7. How often do you want to enter daily status? (Daily, weekly batch, monthly batch?)
8. Do you have historical data from 2025 available?
9. Are there any current AOG events we should enter?

### Team Questions
10. How many people are in the Engineering team?
11. How many people are in the TPL team?
12. Do you have vacation schedules for 2026?

### Integration Questions
13. Do you have existing systems we should import data from?
14. What format is your current data in? (Excel, CSV, other?)
15. Who will be responsible for daily data entry?

---

## Part 13: Next Steps

1. **Review this document** and confirm understanding
2. **Answer the questions** in Part 12
3. **Gather Priority 1 data** (aircraft confirmation, budget plan, current counters)
4. **Schedule kickoff call** to begin data import
5. **Start daily operations** once initial data is loaded

---

## Contact & Support

For questions about data requirements or system usage, refer to:
- **Help Center** in the application (Help icon in sidebar)
- **DEMO-GUIDE.md** for feature walkthroughs
- **DATA-REQUIREMENTS.md** for detailed technical specifications

---

*Document Version: 1.0*
*Date: January 10, 2026*
*For: Alpha Star Aviation*
