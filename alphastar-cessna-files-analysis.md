# Alpha Star — Cessna Files Workbook Deep Analysis & How It Helps the KPI Dashboard

**Source file:** `Cessna Files.xlsx`

This workbook looks like an **export/working model from the current maintenance/operations system** for the Cessna Citation Bravo fleet. It already contains the exact concepts the client requested (availability per aircraft, utilization, work orders, discrepancies), but in a spreadsheet form.

The best way to use it is: **treat it as a reference + bootstrap dataset**, then rebuild the logic in our dashboard using clean input tables (manual entry or controlled Excel upload).

---

## 1) Fleet scope inside this workbook

Aircraft master list (from `Sheet5`):

| Aircraft   | MSN      | Customer   |
|:-----------|:---------|:-----------|
| HZ-133     | 550-1115 | RSAF       |
| HZ-134     | 550-1116 | RSAF       |
| HZ-135     | 550-1126 | RSAF       |
| HZ-136     | 550-1127 | RSAF       |

---

## 2) What’s inside the tabs (what each sheet is for)

Below are the tabs that matter most for our project, grouped by dashboard feature.

### A) Availability / Status (core client KPI)

#### `ASH` — Aircraft Status History (daily, per aircraft)
- **Grain:** 1 row per **aircraft per day**.
- **Coverage in this file:** 2022-10-01 → 2024-05-31 (609 days per aircraft).
- **Key columns:** `FMC`, `NMCM-S`, `NMCM-U`, `NMCM-T`, `NMCS`, `POS`, `Ass Hrs` (hours per day, usually totals around 24).
- **Interpretation (very useful for us):** `FMC` ≈ “Fully Mission Capable hours”. `NMCM/NMCS` are downtime buckets (scheduled vs unscheduled). `POS` behaves like the daily available-hours baseline (often 24).

**How this directly helps our dashboard:**
- We can compute **dynamic availability per aircraft** as: `availability_pct = FMC / POS * 100` (daily → monthly → yearly).
- We can break availability down into **Scheduled downtime vs Unscheduled downtime** using `NMCM-S` vs `NMCM-U`.

Example computed averages from this file (FMC/POS):

| Aircraft   |   days |   total_pos_hours |   total_fmc_hours |   avg_availability_pct |
|:-----------|-------:|------------------:|------------------:|-----------------------:|
| HZ-133     |    609 |           7271.94 |           6505.39 |                  89.15 |
| HZ-134     |    609 |           4285.52 |           3080.75 |                  71.38 |
| HZ-135     |    609 |          10444.7  |           7855.08 |                  75.13 |
| HZ-136     |    609 |          13282.3  |          11160.3  |                  84.02 |

Example last months (availability %):

| month   |   HZ-133 |   HZ-134 |   HZ-135 |   HZ-136 |
|:--------|---------:|---------:|---------:|---------:|
| 2023-12 |    100   |     88.2 |     80.8 |     56.1 |
| 2024-01 |     80.7 |     87.1 |     99.1 |     92.3 |
| 2024-02 |     96.6 |     90.7 |     56.8 |    100   |
| 2024-03 |     68.7 |     83.6 |     99.1 |    100   |
| 2024-04 |    100   |     48.9 |    100   |     98.1 |
| 2024-05 |    100   |     73.5 |    100   |     92.2 |

#### `RATE` — Daily calendar of hours (per month, per aircraft)
- Looks like a **calendar layout** (Jan/Feb/… with dates as columns) where each aircraft row has values like `24` or smaller numbers.
- This is essentially another representation of **daily available hours**. It can be used as a visual source, but the **ASH table is more dashboard-friendly** because it’s already normalized (row-based).

#### `∑` and `CMMA` — Summaries / pivot outputs
- `∑` is a pivot-style summary (Hours/Sorties + FMC by month).
- `CMMA` is a monthly summary of FMC/NMC rates derived from the raw tables.
- These are great to **validate** our dashboard calculations later, but we don’t need to ingest them as inputs.

---

### B) Utilization (Flight Hours + Sorties/Cycles)

#### `PT` — Monthly performance / utilization
- **Coverage in this file:** 2022-10-31 → 2024-04-30.
- **Key columns (fleet level):** `Contracted Sorties`, `Total Sorties Flown`, `Contracted Flying Hours`, `Total Flying Hours`, and the rate fields (`FMC Rate`, `NMCM Rate`, etc.).
- The sheet also includes **per-aircraft monthly** rows (Aircraft + Month + Flight Hours + Sorties).

**How this helps:**
- It gives a ready-made way to show **monthly flight hours and sorties per aircraft** (exactly what the client asked for).
- It also links directly to availability: you can show **Availability % vs Utilization** side-by-side.

#### `DSR` — Daily Status Report (management view)
- Contains a compact per-aircraft board: `Status`, `Airframe Hours`, `Cycle`, `Next Inspection`, `Remaining Hours/Days`, `Location`, `Discrepancy / Parts / MEL`, `Estimated Time in Completion`, and `Cancelled/Remarks`.
- This is basically a blueprint for a dashboard page: **“Today’s Fleet Status”**.

---

### C) Defects, Logbook, and Work Orders (maintenance execution)

#### `DCRP` — Logbook Discrepancy Register
- Rows: **565** discrepancy entries.
- Coverage: 2022-09-26 → 2024-06-05.
- Key columns: `A/C`, `Date`, `ATA`, `Discrepancy`, `Discovered By`, `Date Corrected`, `Corrective Action`, `Mechanic`, `Inspector`, `Duration`.

What we can produce from it immediately:
- # discrepancies per aircraft / per month
- Top ATA chapters driving defects
- Mean time to resolve (Date Corrected - Date)

Per-aircraft discrepancy summary (from this file):

| A/C    |   discrepancies |   open_discrepancies |   avg_resolution_days |
|:-------|----------------:|---------------------:|----------------------:|
| HZ-133 |             121 |                    0 |                   6.3 |
| HZ-134 |              80 |                    0 |                   0.7 |
| HZ-135 |             165 |                    0 |                   6.1 |
| HZ-136 |             199 |                    0 |                   0.7 |

Top ATA chapters by count:

| ATA   |   count |
|:------|--------:|
| 34    |     146 |
| 05    |      61 |
| 32    |      59 |
| 25    |      44 |
| 33    |      40 |
| 21    |      23 |
| 24    |      19 |
| 27    |      18 |
| -     |      17 |
| 23    |      17 |

#### `WO` — Work Order Register
- Rows: **266** work orders.
- Coverage (Date In/Out): 2022-12-15 → 2024-05-16 (Date Out up to 2024-05-16).
- Key columns: `AC`, `WO #`, `Due Date`, `Description`, `Status`, `Date In`, `Date Out`, `CRS No.`, `MR Number`, `Date Requested`, `Date Required`.

This is perfect for KPI like:
- Open vs Closed work orders
- Average turnaround time (`Date Out - Date In`)
- Overdue work orders (Due Date passed and not closed)

Work order status distribution (from this file):

| Status   |   Count |
|:---------|--------:|
| C        |     172 |
| FD       |      76 |
| PF       |       9 |
| FI       |       5 |
| FR       |       2 |
| X        |       2 |

Per-aircraft WO summary (sample):

| AC     |   work_orders |   closed |   avg_turnaround_days |
|:-------|--------------:|---------:|----------------------:|
| HZ-133 |            61 |       40 |                   6.1 |
| HZ-134 |            46 |       25 |                  14   |
| HZ-135 |            71 |       44 |                   0.2 |
| HZ-136 |            88 |       63 |                   0.5 |

#### `CRS` — Link between aircraft, WO and CRS number
- Useful to connect work orders to certification/closure artifacts (audit trail).

---

### D) Maintenance planning / scheduled tasks

#### `Reg Task` — Maintenance tasks master list (program)
- This sheet is a **task catalog** with intervals.
- Key columns: `ATA`, `Task`, `Task/Sub-Task`, and interval fields like `Hrs`, `Dy`, `Mo`, `Cycle`, plus `Tolerance`.

How it helps (without overcomplicating the dashboard):
- Build a simple **Upcoming Maintenance** widget per aircraft:
  - Due-by date window (next 30/60/90 days)
  - Due-by hours/cycles window (next 50/100 hours or next N cycles)
- Later, once we have accurate daily counters (airframe/engine/APU), we can compute **next due** and **overdue** automatically.

#### `TL` — Techlog index (aircraft + techlog number + month/year)
- Helps trace where flight/techlog entries came from and supports auditing.

---

## 3) What this workbook teaches us about the client’s current availability logic

The client said their current software calculates availability in a generic/static way. This workbook shows the *better approach* already:
- Availability is daily and per aircraft (not just fleet type).
- The day is broken into **hours by status buckets** (FMC vs NMCM-S/NMCM-U/etc).

So for the dashboard MVP, we can implement:
- **Daily status hours input (per aircraft)** → compute availability dynamically for any period.
- Later extend with **AOG event attribution** (Internal vs OEM vs Customs vs Finance) as separate downtime categories.

---

## 4) How we should utilize this file in our project (simple, high impact)

### 4.1 Use it as a blueprint for 3 core dashboard pages

**Page 1 — Fleet Overview (Monthly/Yearly)**
- Availability % per aircraft and fleet average (from ASH-like input)
- Flight hours + sorties (from PT-like input)
- # Work Orders + # Discrepancies (WO + DCRP)

**Page 2 — Aircraft Detail (Tail number drill-down)**
- Availability timeline (daily chart)
- Downtime split: Scheduled vs Unscheduled
- Work Orders list + Turnaround time
- Discrepancy list (filter by ATA, date)

**Page 3 — Maintenance Execution (Ops/QA view)**
- WOs by status and by aircraft
- Average closure time / backlog
- Top ATA / recurring defects

### 4.2 Use the workbook as a *data migration/bootstrap*
- Import historical ASH/PT/WO/DCRP into our DB so the dashboard works immediately with history.
- Then switch to controlled **manual entry or Excel upload** for daily operations (same structure).

---

## 5) Easiest “proper” input model (minimal tables)

To keep the scope basic but future-proof, we should normalize into these inputs:

```text
aircraft_master
- registration (HZ-133)
- msn
- operator/customer
- aircraft_type
```

```text
aircraft_daily_status  (ASH-style)
- date
- aircraft_registration
- pos_hours (baseline, typically 24)
- fmc_hours (available/bookable)
- nmcm_s_hours (scheduled downtime)
- nmcm_u_hours (unscheduled downtime)
- nmcs_hours (supply downtime / if applicable)
- notes / attachments (optional)
```

```text
aircraft_monthly_utilization (PT-style)
- month (YYYY-MM)
- aircraft_registration
- flight_hours
- sorties (or cycles)
```

```text
work_orders (WO-style)
- wo_number
- aircraft_registration
- description
- status
- date_in, date_out, due_date
- mr_number, crs_number
```

```text
discrepancies (DCRP-style)
- date_detected
- aircraft_registration
- ata
- discrepancy_text
- date_corrected (nullable)
- corrective_action
- responsibility (Internal | OEM | Customs | Finance | Other)  <-- MVP can start blank
- downtime_hours (optional in MVP)
```

```text
maintenance_tasks_master (Reg Task-style) [optional in MVP]
- ata
- task_code / title
- interval_hours / interval_days / interval_cycles
- tolerance
```

---

## 6) Practical recommendation (MVP approach)

If we want **maximum impact with minimum complexity**, start with:
1) **ASH-style daily status input** (this solves Availability properly).
2) **PT-style monthly utilization input** (hours + sorties).
3) **WO + DCRP import + basic filters** (gives immediate maintenance transparency).

Then, add the client’s requested AOG attribution as an enhancement (still using the same event table).

---

## 7) Notes for implementation (important details)

- Several columns store time as Excel **durations** (e.g., `349 days, 19:31:12`). We must convert these to **hours** correctly in ETL.
- Some sheets are **outputs/pivots**. We should compute KPIs from normalized inputs and use pivots only for validation.
- The structure here is a good prototype to replicate for the rest of the fleet (Airbus, Gulfstream, etc.).
