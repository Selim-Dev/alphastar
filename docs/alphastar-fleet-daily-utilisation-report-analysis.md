# Alphastar Fleet Daily Utilisation Report — Deep Analysis & Dashboard Input Design

**Source file:** `Alphastar Fleet Daily Utilisation Report.xlsx`

This document explains what the provided Excel file contains, what it *does not* contain (relative to your KPI needs), how it maps to the client’s dashboard requirements (availability + maintenance + AOG), and the easiest/most proper way to turn it into clean dashboard inputs.

---

## 1) What this Excel file is (and is not)

### What it is
- A **snapshot table per aircraft** containing **cumulative utilization counters** for: **Airframe**, **Engines (1..4)**, and **APU**.
- It also includes two date fields: **APU last update date** and **Last flight date**.

### What it is NOT (important for the dashboard)
- It is **not** a daily shift log of tasks/defects/AOG events (it doesn’t store *events*).
- It does **not** provide **downtime/out-of-service** periods, responsibility attribution (OEM/customs/finance/internal), or cost/man-hours per event.
- It does **not** provide **per-flight** details (routes, legs) — only totals/counters.

---

## 2) Workbook structure

- Populated sheet(s): **Daily Report** (others are empty placeholders).
- Data rows detected (after cleaning non-aircraft/header rows): **31 aircraft records**.

---

## 3) Column dictionary (what each column means)

> **Note:** Some abbreviations (TSNBSI/HSLBSI/CSNBSI/CSLBSI) are aviation engineering counters. If Alpha Star has an internal definition sheet, we should attach it as the official glossary and store it in the dashboard as a reference.

### Core identifiers
- **A/C Registration**: unique aircraft tail / registration (e.g., `HZ-A42`).
- **Model**: aircraft type/model (e.g., `A340-642`, `GIV-X (G450)`, etc.).

### Airframe counters
- **Airframe TTSN (hrs)**: total airframe flight time since new (hours).
- **Airframe TCSN (cycles)**: total airframe cycles since new (cycles).

### Engine counters
- **Engine N TTSN (hrs)**: engine total time since new (hours).
- **Engine N TCSN (cycles)**: engine total cycles since new (cycles).
- **Engine 1/2 TSNBSI, HSLBSI, CSNBSI, CSLBSI**: additional maintenance/inspection counters (appear formula-driven in the sheet).
- **Engine 3/4 HLSV/HSLSV/CLSV/CSLSV** columns exist but are **empty in this file** (see data quality section).

### APU counters
- **APU HOURS / APU CYCLES**: APU cumulative usage.
- **APU last update date**: last date the APU counters were updated in the report.

### Flight activity date
- **Last flight date**: last recorded flight date (missing for several aircraft in this snapshot).

---

## 4) Data-type observations (critical for ingestion)

- **Hours columns are stored as Excel duration/time values**, not plain numbers. In extraction, they convert cleanly to **decimal hours** (example: `79 days + 17:52:00` → `1913.87 hours`).
- Cycles are stored as **integers** (or empty).
- Dates are stored as Excel dates and convert to `YYYY-MM-DD` successfully where present.

---

## 5) Data quality findings (what must be fixed to use it as KPI input)

### 5.1 Missing dates
- **12 aircraft records** have **Last flight date = empty**. This blocks time-based utilization checks and makes it harder to validate deltas day-to-day.

### 5.2 Duplicate registrations
- Duplicate `A/C Registration` values exist: **HZ-A32, M-IIII**.
  - This must be resolved because the registration should be the unique key of the aircraft dimension.

### 5.3 Unused / always-empty columns
- Engine 3/4 shop/service-visit counters (**HLSV/HSLSV/CLSV/CSLSV**) are present but **100% empty** in this file. If Alpha Star wants to track them, we should add them to the daily input form and start populating them; otherwise, drop them from the first version of the model.

### 5.4 Consistency warning: per-engine granularity
- In the original Excel, some Engine 3/4 totals appear formula-driven in a way that can default to **airframe totals**. For 4‑engine aircraft (e.g., A340), engines must be tracked **per engine**; copying airframe totals is not engineering-accurate unless confirmed by the client’s methodology.

---

## 6) How this Excel helps us build the dashboard (and where it fits)

This file is valuable as a **baseline snapshot** of utilization counters. It can be used to:
- Initialize each aircraft’s **starting counters** (airframe/engine/APU hours & cycles).
- Validate daily manual inputs: today’s counters must be **>= yesterday’s** (monotonic).
- Generate utilization KPIs by computing deltas between dates: **daily/monthly/yearly flight hours and cycles** per aircraft and per fleet.

But to compute **Availability (dynamic)** and maintenance/AOG KPIs, we need *event and downtime data* (not present here).

---

## 7) Mapping to your meeting notes (requirements → data)

### Availability (dynamic) per aircraft
- Availability depends on **out-of-service time**, which must be derived from:
  - **Scheduled maintenance windows**
  - **Unscheduled defects**
  - **AOG events** (with attribution: internal vs OEM vs customs vs finance, etc.)
- This Excel does not store downtime; it stores only **usage totals**. So we must add an **Event Log** input model (below).

### Flight hours & cycles
- This Excel provides the required counters to compute:
  - Daily/Monthly/Yearly **Flight Hours**
  - Daily/Monthly/Yearly **Flight Cycles** (one leg = one cycle)
- The dashboard should allow manual input either as:
  1) **cumulative totals** (preferred, easiest to validate), or
  2) **daily increments** (flight hours today, cycles today).

### Maintenance shift activity (daily)
- The shift report should become an **input form**, not an output-only PDF/report.
- Inputs must be normalized by: date, shift, aircraft, task/event, manpower, man-hours, cost.

---

## 8) Easiest & most proper way to make this Excel usable as dashboard input

### Approach A (recommended): store *daily cumulative counters* per aircraft
**Why this is best:**
- Counters are naturally cumulative (TTSN/TCSN).
- Easy validation: today >= yesterday.
- Easy aggregation: deltas over any period (month/year) are computed reliably.

**Daily input table (utilization counters):**
```text
aircraft_daily_counters
- date (YYYY-MM-DD)
- aircraft_registration
- airframe_hours_ttsn
- airframe_cycles_tcsn
- engine1_hours, engine1_cycles, ... engine4_hours, engine4_cycles
- apu_hours, apu_cycles
- last_flight_date (optional)
- updated_by, updated_at
```

Then compute daily deltas:
- `daily_flight_hours = today.airframe_hours_ttsn - yesterday.airframe_hours_ttsn`
- `daily_cycles = today.airframe_cycles_tcsn - yesterday.airframe_cycles_tcsn`

### Approach B: store *daily increments*
Useful if the client prefers daily entry like “today we flew 3.2 hours / 2 cycles”.
But it is harder to validate (risk of missing days) and harder to reconcile with engineering counters.

---

## 9) What else must be added (to meet KPI goals)

### 9.1 Aircraft master data (static but editable)
From Nawaf email + your notes:
```text
aircraft_master
- aircraft_registration (PK)
- fleet (client grouping)
- aircraft_type
- msn
- owner
- date_of_manufacture
- engines_count (2/4/prop)
- status (active/parked/leased)
```

### 9.2 AOG / Defects / Events log (required for dynamic availability)
This is the most important missing piece for availability.
```text
aircraft_events
- event_id (PK)
- aircraft_registration (FK)
- detected_at (timestamp)
- cleared_at (timestamp)
- category: scheduled | unscheduled | AOG
- reason_code (fuselage, seat, avionics, etc.)
- responsible_party: internal | OEM | customs | finance | other
- action_taken (text)
- mel_reference (optional)
- logbook_entry_reference (optional)
- manpower_count, man_hours
- cost_labor, cost_parts, cost_external (optional)
- attachments (optional)
```

**Availability formula (per aircraft, per period):**
- `availability = (total_period_hours - out_of_service_hours) / total_period_hours`
- `out_of_service_hours` comes from summing event durations where category in {scheduled, unscheduled, AOG}.
- Because the client wants attribution: also compute **availability_internal** vs **availability_external** by splitting durations by `responsible_party`.

### 9.3 Maintenance tasks (shift activity input)
```text
maintenance_tasks
- task_id (PK)
- date, shift
- aircraft_registration (FK)
- task_type
- task_description
- start_at, end_at
- manpower_count, man_hours
- cost (optional) + link to rates
- work_order_number (optional)
```

---

## 10) Quick preview of the extracted aircraft snapshot (from this Excel)

| A/C Registration   | Model        |   Airframe TTSN (hrs) |   Airframe TCSN (cycles) |   APU HOURS | APU CYCLES   | APU last update date   | Last flight date    |
|:-------------------|:-------------|----------------------:|-------------------------:|------------:|:-------------|:-----------------------|:--------------------|
| HZ-A42             | A340-642     |              1913.87  |                      551 |      4114   | 2174         | 2025-11-01 00:00:00    | 2025-11-01 00:00:00 |
| HZ-SKY1            | A340-212     |              8864.03  |                     4177 |     12826   | 6737         | 2025-10-13 00:00:00    | 2025-10-21 00:00:00 |
| HZ-SKY2            | A330-243     |              3715.33  |                      864 |      4208   | 1893         | 2025-11-03 00:00:00    | 2025-11-03 00:00:00 |
| HZ-A2              | A320-214     |              8138.1   |                     2549 |     33172   | 35716        | 2024-05-05 00:00:00    | 2024-10-06 00:00:00 |
| HZ-A3              | A320-214     |             33263.2   |                    15995 |     15348   | 13717        | 2025-11-09 00:00:00    | 2025-11-09 00:00:00 |
| HZ-A4              | A319-112     |             23188.9   |                    14496 |     27519   | 29476        | 2025-11-03 00:00:00    | 2025-11-07 00:00:00 |
| HZ-A5              | A318-112     |             12739.7   |                     4928 |     44711   | 28421        | 2025-11-01 00:00:00    | 2025-11-05 00:00:00 |
| HZ-A15             | A320-216     |             34451.9   |                    23319 |     25757   | 24963        | 2025-11-08 00:00:00    | 2025-11-09 00:00:00 |
| HZ-SKY4            | A319-115     |              5665.3   |                     2220 |      6477   | 4411         | 2025-11-02 00:00:00    | 2025-11-09 00:00:00 |
| HZ-A8              | HAWKER 900XP |              7104.22  |                     5171 |      7325   | N/A          | 2024-11-02 00:00:00    | 2025-11-08 00:00:00 |
| HZ-A9              | HAWKER 900XP |              6348.68  |                     4821 |      6794   | N/A          | 2025-11-01 00:00:00    | 2025-11-09 00:00:00 |
| M-IIII             | (G650ER)     |               333.133 |                     3081 |      7338.5 | N/A          | 2024-06-22 00:00:00    | NaT                 |

---

## 11) Recommended ingestion & validation rules

1) **Normalize time units**: convert all duration cells into **decimal hours**.
2) **Uniqueness**: enforce `aircraft_registration` as unique in `aircraft_master` (fix duplicates in the source).
3) **Monotonic counters**: daily totals must never decrease (hours/cycles).
4) **Cycle logic**: cycles should increment by integers (or at least whole numbers); flag non-integer cycles.
5) **Completeness**: require `date` + `aircraft_registration` for every daily row.
6) **Event timestamps**: enforce `cleared_at >= detected_at` and auto-calc duration.
7) **Attribution**: require `responsible_party` for AOG events to support accurate availability responsibility split.

---

## 12) Dashboard outputs enabled by this model (examples)

### Utilization KPIs (per aircraft / fleet)
- Flight hours (daily/monthly/ytd)
- Flight cycles (daily/monthly/ytd)
- Utilization rate: `flight_hours / available_hours`

### Availability KPIs (dynamic, per aircraft)
- Availability % (total)
- Availability split by responsibility (internal vs OEM vs customs vs finance)
- Downtime hours by category (scheduled vs unscheduled vs AOG)

### Maintenance KPIs
- Tasks count per day/shift/aircraft
- Man-hours per aircraft and per task type
- Cost vs expected cost (requires rates table + planned baseline)
- Top aircraft by maintenance cost / man-hours / downtime

### AOG KPIs (granular)
- AOG events count and total downtime per aircraft
- Mean time to detect/close
- OEM delay vs internal delay vs customs/finance delay

---

## 13) Practical next step

Use this Excel as **baseline import** into `aircraft_daily_counters` for a chosen `date_of_snapshot` (the file’s effective date). Then start daily entry in the dashboard (or upload the same-shaped sheet daily). In parallel, implement the **AOG/defects/events module** because that is what unlocks dynamic availability and accurate KPI reporting.
