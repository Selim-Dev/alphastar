# Alpha Star Aviation - Data Request for System Go-Live 2026

## Quick Summary: What We Need From You

This document lists all the data we need to get the KPIs Dashboard running with real data. Please coordinate with your teams to gather this information.

---

## 🔴 CRITICAL - Required Before Go-Live

### 1. Aircraft Fleet Confirmation
**Who**: Operations Manager
**Format**: Review and confirm the list below

| Registration | Fleet Group | Type | Engines | Owner | Status | ✓ Correct? |
|--------------|-------------|------|---------|-------|--------|------------|
| HZ-A42 | A340 | A340-642 | 4 | Alpha Star | Active | |
| HZ-SKY1 | A340 | A340-212 | 4 | Sky Prime | Active | |
| HZ-SKY2 | A330 | A330-243 | 2 | Sky Prime | Active | |
| HZ-A2 | A320 | A320-214 | 2 | Alpha Star | Parked | |
| HZ-A3 | A320 | A320-214 | 2 | Alpha Star | Active | |
| HZ-A4 | A319 | A319-112 | 2 | Alpha Star | Active | |
| HZ-A5 | A318 | A318-112 | 2 | Alpha Star | Active | |
| HZ-A15 | A320 | A320-216 | 2 | Alpha Star | Active | |
| HZ-SKY4 | A319 | A319-115 | 2 | Sky Prime | Active | |
| HZ-A8 | Hawker | Hawker 900XP | 2 | Alpha Star | Active | |
| HZ-A9 | Hawker | Hawker 900XP | 2 | Alpha Star | Active | |
| HZ-A22 | G650ER | G650ER | 2 | Alpha Star | Active | |
| HZ-A23 | G650ER | G650ER | 2 | Alpha Star | Active | |
| HZ-133 | Cessna | Citation Bravo | 2 | RSAF | Active | |
| HZ-134 | Cessna | Citation Bravo | 2 | RSAF | Active | |
| HZ-135 | Cessna | Citation Bravo | 2 | RSAF | Active | |
| HZ-136 | Cessna | Citation Bravo | 2 | RSAF | Active | |

**Add any missing aircraft below:**
| Registration | Fleet Group | Type | Engines | Owner | Status |
|--------------|-------------|------|---------|-------|--------|
| | | | | | |

---

### 2. Budget Plan 2026
**Who**: Finance Department
**Format**: Excel file
**Deadline**: Before system go-live

Please provide annual budget for each clause and aircraft group:

| Aircraft Group | Clause ID | Clause Description | Annual Budget (USD) |
|----------------|-----------|-------------------|---------------------|
| A330 | 1 | Aircraft Lease | $ |
| A330 | 2 | Airframe Maintenance | $ |
| A330 | 3 | Engines and APU Corporate Care | $ |
| A330 | 4 | Landing Gear Overhaul | $ |
| A330 | 5 | Component Repair | $ |
| A330 | 6 | Spare Parts | $ |
| A330 | 7 | Consumables | $ |
| A330 | 8 | Ground Support Equipment | $ |
| A330 | 9 | Fuel | $ |
| A330 | 10 | Subscriptions | $ |
| A330 | 11 | Insurance | $ |
| A330 | 12 | Cabin Crew | $ |
| A330 | 13 | Manpower | $ |
| A330 | 14 | Handling and Permits | $ |
| A330 | 15 | Catering | $ |
| A330 | 16 | Communication | $ |
| A330 | 17 | Miscellaneous | $ |
| A330 | 18 | Training | $ |
| G650ER | 1-18 | (Same clauses) | $ |
| Cessna | 1-18 | (Same clauses) | $ |
| PMO | 1-18 | (Same clauses) | $ |

**Total: 72 budget entries (18 clauses × 4 groups)**

---

### 3. Current Aircraft Counter Readings
**Who**: Maintenance/Engineering
**Format**: Excel file
**Deadline**: Before system go-live

For each aircraft, provide the CURRENT cumulative counter readings:

**For 2-Engine Aircraft (A330, A320 family, G650ER, Hawker, Cessna):**

| Registration | Date | Airframe Hours | Airframe Cycles | Engine 1 Hours | Engine 1 Cycles | Engine 2 Hours | Engine 2 Cycles | APU Hours |
|--------------|------|----------------|-----------------|----------------|-----------------|----------------|-----------------|-----------|
| HZ-SKY2 | | | | | | | | |
| HZ-A2 | | | | | | | | |
| HZ-A3 | | | | | | | | |
| (etc.) | | | | | | | | |

**For 4-Engine Aircraft (A340):**

| Registration | Date | AF Hours | AF Cycles | E1 Hrs | E1 Cyc | E2 Hrs | E2 Cyc | E3 Hrs | E3 Cyc | E4 Hrs | E4 Cyc | APU Hrs |
|--------------|------|----------|-----------|--------|--------|--------|--------|--------|--------|--------|--------|---------|
| HZ-A42 | | | | | | | | | | | | |
| HZ-SKY1 | | | | | | | | | | | | |

---

## 🟡 HIGH PRIORITY - Required Within First Week

### 4. Daily Status Data (January 2026)
**Who**: Operations/Dispatch
**Format**: Excel file

For each aircraft, for each day in January 2026:

| Registration | Date | POS Hours | FMC Hours | NMCM-S Hours | NMCM-U Hours | Notes |
|--------------|------|-----------|-----------|--------------|--------------|-------|
| HZ-A42 | 2026-01-01 | 24 | | | | |
| HZ-A42 | 2026-01-02 | 24 | | | | |
| (etc.) | | | | | | |

**Definitions:**
- POS Hours = Possessed hours (usually 24)
- FMC Hours = Fully Mission Capable hours (available for flight)
- NMCM-S Hours = Scheduled maintenance downtime
- NMCM-U Hours = Unscheduled maintenance downtime

**Formula**: FMC = POS - NMCM-S - NMCM-U

---

### 5. Active AOG Events
**Who**: Maintenance Control Center
**Format**: Form or Excel

List any aircraft currently grounded or recently grounded:

| Aircraft | Detected Date/Time | Category | Reason | Responsible Party | Status | Cleared Date/Time |
|----------|-------------------|----------|--------|-------------------|--------|-------------------|
| | | scheduled/unscheduled/aog | | Internal/OEM/Customs/Finance/Other | | |

---

## 🟢 MEDIUM PRIORITY - Required Within First Month

### 6. Maintenance Tasks Log
**Who**: Maintenance Planning
**Format**: Excel file

Recent maintenance activities (last 30-90 days):

| Aircraft | Date | Shift | Task Type | Description | Manpower | Man Hours | Cost |
|----------|------|-------|-----------|-------------|----------|-----------|------|
| | | Morning/Evening/Night | | | | | |

---

### 7. Work Order Summary (Monthly)
**Who**: Maintenance Planning
**Format**: Excel file

Monthly work order counts for 2025 and January 2026:

| Aircraft | Period | Work Order Count | Total Cost | Notes |
|----------|--------|------------------|------------|-------|
| HZ-A42 | 2025-01 | | | |
| HZ-A42 | 2025-02 | | | |
| ... | ... | | | |
| HZ-A42 | 2026-01 | | | |

---

### 8. Discrepancies/Defects Log
**Who**: Quality Assurance
**Format**: Excel file

Recent defects (last 90 days):

| Aircraft | Date Detected | ATA Chapter | Description | Date Corrected | Corrective Action | Downtime Hours |
|----------|---------------|-------------|-------------|----------------|-------------------|----------------|
| | | 21/24/27/29/32/etc. | | | | |

---

### 9. Actual Spend 2025 (Historical)
**Who**: Finance Department
**Format**: Excel file

Monthly spending for 2025 (for year-over-year comparison):

| Period | Aircraft Group | Clause ID | Amount (USD) | Vendor | Notes |
|--------|----------------|-----------|--------------|--------|-------|
| 2025-01 | A330 | 1 | | | |
| 2025-01 | A330 | 2 | | | |
| ... | ... | ... | | | |

---

## 🔵 OPTIONAL - Nice to Have

### 10. Vacation Plans 2026
**Who**: HR Department
**Format**: Excel file with 2 sheets (Engineering, TPL)

48-week vacation schedule for each team:

| Employee Name | W1 | W2 | W3 | W4 | ... | W48 |
|---------------|----|----|----|----|-----|-----|
| | 0/0.5/1 | 0/0.5/1 | 0/0.5/1 | 0/0.5/1 | ... | 0/0.5/1 |

---

### 11. Historical Daily Data (2025)
**Who**: Operations/Maintenance
**Format**: Excel file

If available, last 90 days of 2025:
- Daily Status records
- Daily Counter records

---

## Data Format Requirements

### Date Formats
- Dates: YYYY-MM-DD (e.g., 2026-01-10)
- Periods: YYYY-MM (e.g., 2026-01)
- Timestamps: YYYY-MM-DD HH:MM (e.g., 2026-01-10 14:30)

### Aircraft Registration
- Always UPPERCASE (e.g., HZ-A42, not hz-a42)

### Numbers
- Use decimal point, not comma (e.g., 12500.5, not 12500,5)
- No currency symbols in number fields
- Counter values must always increase (never decrease)

### Hours
- Daily status hours: 0-24 range
- Counter hours: Cumulative total (always increasing)

---

## Contact for Questions

If you have questions about any data requirements, please contact:
- [Your Name/Contact]
- [Email]
- [Phone]

---

## Submission Checklist

| # | Data Type | Responsible Team | Format | Submitted? |
|---|-----------|------------------|--------|------------|
| 1 | Aircraft Fleet Confirmation | Operations | Review list | ☐ |
| 2 | Budget Plan 2026 | Finance | Excel | ☐ |
| 3 | Current Counter Readings | Maintenance | Excel | ☐ |
| 4 | Daily Status (Jan 2026) | Operations | Excel | ☐ |
| 5 | Active AOG Events | MCC | Form/Excel | ☐ |
| 6 | Maintenance Tasks Log | Maintenance | Excel | ☐ |
| 7 | Work Order Summary | Maintenance | Excel | ☐ |
| 8 | Discrepancies Log | Quality | Excel | ☐ |
| 9 | Actual Spend 2025 | Finance | Excel | ☐ |
| 10 | Vacation Plans 2026 | HR | Excel | ☐ |
| 11 | Historical Data 2025 | Ops/Maint | Excel | ☐ |

---

*Please return completed data to: [Your Email]*
*Deadline for Critical Items: [Date]*
