# MTC Dashboard Files.xlsx — Deep Analysis (as input for Alpha Star KPI Dashboard)

## 1) Context (why this workbook matters)
Alpha Star Aviation Services needs **accurate, time-bounded KPIs** (end-of-day/month/year) about:
- **Aircraft availability** (bookable vs out-of-service) — **dynamic**, not a fixed ~92%.
- **Flight utilization** (flight hours & flight cycles) **per aircraft** (not fleet-only).
- **Maintenance activity** (tasks, man-hours, manpower, cost) **per aircraft and per day/shift**.
- **AOG & defects** at a granular event level with **timestamps + responsibility attribution** (OEM/customs/finance/internal, etc.).

The file **MTC Dashboard Files.xlsx** is useful because it shows how the client’s current world is shaped in Excel:
- **Raw “data tables”** (people, fleet, events, tasks)
- **Pivot/summary layers** (monthly/yearly aggregation)
- A “dashboard tab” consuming the summaries

That pattern maps very well to a web KPI product — we just need to **standardize the inputs** and compute KPIs in a more reliable way.

---

## 2) Workbook anatomy (what’s inside)
The workbook is organized like a mini data-warehouse:

- **Data / masters (inputs):** typically sheets named `* D` or `* Data`
- **Pivots / views:** sheets named `* P`
- **Summaries:** sheets prefixed with `Σ`
- **Dashboard:** `DSHBRD` (mostly charts/visuals)

### Key modules & sheets (high signal)
| Module                                | Sheets                                | What’s inside                                                                                       |
|:--------------------------------------|:--------------------------------------|:----------------------------------------------------------------------------------------------------|
| Aircraft master                       | FLEET D                               | List of aircraft tail numbers, configuration, status.                                               |
| Utilization & availability (computed) | ΣFHFC, ΣFMC, FH FC P, FMC P, FLIGHT P | Monthly flight counts and “mission-capable style” availability breakdown (FMC vs downtime buckets). |
| Defects / discrepancies (events)      | DCRP                                  | Tech-log discrepancy register with discovery/correction info + duration days.                       |
| Inspections (scheduled work)          | 1500-4, ΣINS, INSPECT P               | Inspection phases and basic lifecycle dates/status.                                                 |
| Shift tasks example                   | Detailing D                           | Per-aircraft tasks captured per date/shift, with performers/verifier (payroll numbers).             |
| People & labor cost support           | MNPWER D, OT D, OT Data               | Employee master + overtime/pay components that can feed labor cost KPIs.                            |
| Rates / pricing list                  | GSE-TOOL Rate                         | Rate card-like values (serviceable/unserviceable/condemn) by month/year.                            |
| Quality / NCR log                     | NCR                                   | Non-conformance reports: classification/category/status/deadline.                                   |

---

## 3) What the workbook already calculates (and what we can reuse)

### 3.1 Utilization & “availability style” breakdown (ΣFHFC)
`ΣFHFC` is the clearest representation of “availability logic” in the file.

**Columns present in ΣFHFC:**
- Aircraft, Configuration, 1500-2 Hours, 1500-3 Hours, Date, Month, Flight, FMC, UNSCHED, SCHED, TCTO, PMCM, NMC, NMCS, PMCS, NP

**What it implies (how it’s being used):**
- It’s a **monthly per-aircraft** table.
- It distributes a time bucket into categories like:
  - `FMC` (fully mission/maintenance capable time)
  - `UNSCHED`, `SCHED` (downtime buckets)
  - plus other downtime labels (`NMC`, `NMCS`, `PMCS`, `NP`, etc.)
- This structure is a great starting point for Alpha Star, but:
  - it needs to be **driven by real event timestamps** (AOG/maintenance windows),
  - and it must work **per aircraft registration** (not only configuration/fleet rollups).

✅ **Reusable idea:** keep the “bucketed downtime” concept, but **derive it from event logs** instead of static assumptions.

---

### 3.2 Fleet/configuration rollups (ΣFMC)
`ΣFMC` aggregates similar concepts at a higher level (configuration/month) and includes rate columns (e.g., “FMC Rate”, “Possessed Hours”, etc.).

✅ **Reusable idea:** the dashboard should provide both:
- **Per-aircraft** KPIs (primary requirement)
- Optional **fleet rollups** (same math, grouped)

---

### 3.3 Defects / discrepancy register (DCRP)
`DCRP` is a large “events-like” table and is the closest thing to a defect log.

**Columns present in DCRP:**
- Status, Fleet, TECH LOG NO., Tail No., Date Discd, Discrepancy, WDC, Discovered By, Discovered By2, DEPT, Corrective Action, Date Corrected, Corrected By, Inspected By, Duration (Days), Configuration, Transferred/Info, Repeated?, Year, Month

✅ **Reusable idea:** this becomes a foundation for a new **Defect/Event** table, but it needs upgrades:
- Add **start timestamp** and **end timestamp** (not only dates)
- Add **event type**: Scheduled / Unscheduled / AOG
- Add **responsibility attribution** (Internal vs OEM vs Customs vs Finance…)
- Add **cost fields** + reference links/attachments

---

### 3.4 Shift work capture (Detailing D)
`Detailing D` shows a pattern that matches your requirement: “daily/shift manual logging”.

**Columns present in Detailing D:**
- Aircraft, Date, Performed By, Performed By2, Performed By3, Verified By, Shift, Turn Over

✅ **Reusable idea:** web dashboard input forms should behave like this:
- a row-based log per aircraft per shift/day,
- with references to employees (manpower),
- and an approval/verification step.

---

## 4) What’s missing for Alpha Star (gap analysis)
Even though the workbook has summaries, Alpha Star needs **a different input grain**:

### Missing or insufficient in current Excel structure
1) **Per-aircraft utilization updates**  
   The workbook has rollups, but Alpha Star wants **manual daily input per aircraft**:
   - airframe hours/cycles
   - engine hours/cycles (per engine)
   - APU hours/cycles
   - date of update

2) **True AOG event tracking with attribution**
   Required fields that don’t exist as first-class data:
   - detection time
   - start / end of downtime
   - action timeline (sent to OEM, parts ordered, customs delay, finance hold, etc.)
   - responsibility buckets (Internal/OEM/Customs/Finance/Other)
   - man-hours, manpower, and cost

3) **Maintenance tasks with cost granularity**
   You need tasks per day/shift:
   - aircraft worked on
   - task category (scheduled/unscheduled)
   - work order / MEL / logbook / cabin defect refs
   - man-hours, manpower
   - materials/parts cost
   - total cost per aircraft and per period

---

## 5) Best approach: turn “Excel dashboard logic” into clean dashboard inputs

### 5.1 Recommended input model (minimal, but future-proof)
Instead of copying 34 Excel tabs into the app, build **6–8 core tables** (inputs), then compute everything from them.

**A) Aircraft Master (mostly static, editable)**
- A/C Fleet, A/C Type, A/C Registration, A/C MSN, Owner, Manufacture date, etc.  
- Maps the Excel `FLEET D` concept into a real master list.

**B) Daily Utilization (per aircraft, per date)**
- Date of update
- Airframe hours/cycles
- Engine(s): PN/SN + hours/cycles (Engine 1..4)
- APU: PN/SN + hours/cycles
- (Optional) Propeller hours/cycles
- Status flags: engine owned/loaned, APU owned/loaned

**C) Defect / Logbook Entries (event log)**
- Aircraft, time discovered
- type: scheduled / unscheduled / cabin / MEL-related
- description + references (tech log no., work order no.)
- status, corrected time, verified time
- man-hours, manpower, cost

**D) AOG Events (specialized event log)**
- Aircraft
- detected_at, downtime_start_at, downtime_end_at
- reason code + category (Technical / OEM / Customs / Finance / Ops / Other)
- action taken timeline (free text + attachments)
- responsibility split (e.g., Internal 2h, OEM 3 days)
- cost, man-hours, manpower

**E) Maintenance Tasks (work performed)**
- Aircraft, date/shift
- task type, task category, system/ATA chapter (optional)
- man-hours, manpower
- labor cost (derived) + parts/materials cost (manual or imported)
- link to defect/work order/AOG event if relevant

**F) People & Rates (optional for MVP, but recommended)**
- Employees (from `MNPWER D`-like table)
- Rate cards (labor hourly rates, OEM/3rd party costs, etc.)
- Overtime rules (from `OT D/OT Data` concepts)

> **Why this is the “easiest proper way”:**  
> It matches how Excel works (data tables → summaries), but makes the **inputs clean**, so KPIs become reliable.

---

### 5.2 Input method: what to build first (low friction)
Because the client already uses daily reports and Excel:

**Option 1 (best for adoption): “Excel upload template” + validations**
- Provide a **daily/shift template** (one file) with these tabs:
  1) Utilization (hours/cycles)
  2) Defects & Logbook
  3) AOG Events
  4) Maintenance Tasks
  5) Notes/Playground (title, description, attachments)
- User fills it and uploads → system validates → stores rows → generates KPIs.

**Option 2: Web forms mirroring the template**
- Same structure, but in UI:
  - “Create shift/day log”
  - add rows (like in the current TRS screens)
  - save / save & proceed
  - review → submit

**Practical recommendation:** start with Option 2 (forms) for accuracy, but also add Option 1 later for scale.

---

## 6) How this Excel file helps us build the dashboard (concretely)

### 6.1 It provides a KPI vocabulary
Sheets like `ΣFHFC` / `ΣFMC` show the department already thinks in:
- monthly grouping
- downtime buckets
- rates + hours
So we can keep the same *language* but fix the data quality.

### 6.2 It provides examples of “event logs” and “task logs”
- `DCRP` proves a defects register is needed.
- `Detailing D` proves a per-shift/per-aircraft log pattern works.

### 6.3 It shows the classic Excel architecture we will replicate in software
- Input tables → computed summaries → dashboard visuals  
In the app, summaries become:
- SQL views / materialized views
- scheduled aggregations (daily/monthly)
- API endpoints powering charts

---

## 7) MVP scope (so we don’t overbuild)
If the goal is to deliver value fast:

**Phase 1 (core KPIs)**
- Aircraft Master
- Daily Utilization
- AOG Events
- Maintenance Tasks (with man-hours/manpower)
- Availability calculation per aircraft + fleet rollups
- Reports by date range (month/year/custom)

**Phase 2 (cost & deeper analytics)**
- Rate cards + labor cost automation
- Parts/materials cost
- Defect → task → AOG linking
- SLA/responsibility attribution reports (OEM vs internal vs customs…)

**Phase 3 (nice-to-have)**
- NCR, GSE/TMDE calibration modules (only if they matter to Alpha Star scope)

---

## 8) Simple availability formula you can implement
For a given aircraft and period:

- **Total period time** = number_of_days × 24h
- **Unavailable time** = sum(AOG downtime windows + scheduled maintenance windows)
- **Available time** = Total − Unavailable
- **Availability %** = Available / Total × 100

Then produce a **breakdown**:
- Internal downtime
- OEM downtime
- Customs/tax downtime
- Finance downtime
- Other

This is the “dynamic 92%” the client wants — and it becomes defensible because it is based on logged events.

---

## Appendix A — Quick mapping (Excel → dashboard tables)
- `FLEET D` → `aircraft_master`
- `ΣFHFC` / `ΣFMC` → **computed views** (`availability_monthly`, `availability_fleet_monthly`)
- `DCRP` → `defect_events` (upgrade with timestamps + attribution + cost)
- `Detailing D` → `maintenance_tasks` pattern (row-based shift log)
- `MNPWER D` / `OT D` / `OT Data` → `employees`, `labor_cost_inputs`
- `GSE-TOOL Rate` → `rate_cards` (if cost KPIs are required)

