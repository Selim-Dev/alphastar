# Alpha Star — Budgetary Sheet (Rv1) Deep Analysis & Dashboard Utilization Plan

**Source file:** `BUDGETARY SHEET (Rv1).xlsx`

Goal: explain what this workbook contains, what’s usable today, what’s broken (and why), and propose a **simple but high-impact** way to utilize it as dashboard input—without overcomplicating the requirements.

---

## 1) What this workbook represents

This workbook is a **budget model / financial planning template** that mixes:
- A **budget breakdown by cost clauses & aircraft groups** (best sheet: `RSAF`).
- A **Bill of Quantities / cost classification model** with mark-ups and escalation across years (`Total-USD (2)`, `BoQ 2 (2)`).
- **Account-code based summaries per aircraft registration** (`Data sum`, `AC sum`).
- **Rate / subscription / tool cost lists** (e.g., `A330-CS`).
- A small **currency reference** (`DDL`).

The most important thing to note: **a lot of sheets rely on Excel formulas**, and in this uploaded version many formulas are broken (`#REF!`). That means we should treat those sheets as **structure/templates** (good metadata), not as reliable numeric truth until the client provides the missing linked data or we rebuild the calculation in the dashboard/ETL.

---

## 2) Workbook structure (sheets overview)

Sheets included:
- `RSAF` — budget by clause & aircraft group + 3-year distribution (most useful immediately).
- `Data sum` — account codes down the rows, aircraft registrations across columns (template for per-aircraft allocation).
- `A330-CS` — list of priced tools/subscriptions/services (rate list style).
- `Total-USD (2)` — BoQ classification + markup + escalation across Year 1/2/3 (structure is useful, values mostly `#REF!`).
- `BoQ 2 (2)` / `AC sum` — additional matrix summaries (values mostly `#REF!`).
- `AS4.1` / `ACM-KA` — P&L-style templates (revenues, variable costs, fixed costs), mostly `#REF!`.
- `DDL` — currency setup (USD=1, SAR=3.75).

---

## 3) Critical data-quality finding: why you see `#REF!`

Many sheets contain **broken references** (Excel `#REF!`), which usually means:
- The workbook originally referenced **other workbooks/sheets** not included in this upload, OR
- Rows/columns were removed after building formulas, OR
- The file was exported without preserving linked sources.

**Impact on us:**
- We can still use these sheets to understand **cost structure and required dimensions** (accounts, aircraft, categories).
- For dashboard calculations, we should **not depend** on the Excel formulas; instead, we rebuild the model in our database and compute KPIs from clean inputs.

Sheets with the highest `#REF!` density:

| sheet         |   non_empty_cells |   ref_cells |   ref_ratio |
|:--------------|------------------:|------------:|------------:|
| AC sum        |               394 |         353 |   0.895939  |
| AS4.1         |              1566 |        1362 |   0.869732  |
| Data sum      |              2293 |        1912 |   0.833842  |
| ACM-KA        |               256 |         185 |   0.722656  |
| BoQ 2 (2)     |               293 |         192 |   0.65529   |
| Total-USD (2) |               641 |         362 |   0.564743  |
| A330-CS       |               794 |          42 |   0.0528967 |
| RSAF          |               241 |           0 |   0         |

---

## 4) Deep dive: `RSAF` sheet (the most actionable one)

### 4.1 What it contains
`RSAF` is a **budget breakdown by clause**, split by aircraft groups + PMO, plus totals.

Key columns (observed from the sheet layout):
- **Clause #** and **Clause Description** (18 clauses).
- **A330, G650ER-1, G650ER-2, PMO** (budget allocation by aircraft group/contract bucket).
- **Total Budgeted**, **Total Budget Spent**, **Remaining Total Budget**, and **Total Budget**.
- A 3-year month distribution area (FIRST YEAR / SECOND YEAR / THIRD YEAR) with fiscal-year style months starting around April.

### 4.2 Totals & highlights
- **Total Budget (all clauses):** `70,245,647` (currency depends on workbook context; see `DDL`).
- **In this version, Total Budget Spent appears as 0**, which suggests this sheet is mainly a *planning* template, not a live spending tracker.

Top clauses by total budget (from this workbook):

|   Clause # | Clause Description                     | Total Budget   |
|-----------:|:---------------------------------------|:---------------|
|          6 | Spare Parts                            | 10,816,107     |
|         10 | Subscriptions                          | 6,957,930      |
|          3 | Engines and APU corporate care program | 6,889,933      |
|         18 | Training                               | 6,211,723      |
|         11 | Insurance                              | 5,316,374      |
|          9 | Fuel                                   | 4,947,051      |
|         13 | Manpower                               | 4,943,059      |
|         12 | Cabin crew                             | 4,650,345      |

### 4.3 How RSAF helps the KPI dashboard (simple + high impact)
Even with basic scope, RSAF unlocks strong value:
- **Budget vs Actual Spend** (monthly / yearly) by clause and by aircraft group.
- **Remaining budget** and **burn rate**.
- **Top cost drivers** (which clauses consume most budget).
- If we connect utilization counters later: **cost per flight hour** and **cost per cycle** per aircraft/fleet.

---

## 5) Deep dive: `Data sum` / `AC sum` sheets (allocation template)

### What they are
- These sheets are a **matrix**: rows are **Account codes & account descriptions**, columns are **aircraft registrations** (HZ-A2, HZ-A3, …).
- In this upload, values are mostly `#REF!`, but the *structure is very valuable* because it defines:
  - Which **account codes** the finance team expects to track
  - Which **aircraft registrations** are in-scope

### How to use them in the dashboard (without overcomplication)
Use them as a blueprint for building a simple input form/table:
- Users enter **Actual Spend** per month (or per day) with:
  - Aircraft registration (or aircraft group)
  - Account code / cost category
  - Amount + currency
  - Optional notes/attachments

---

## 6) Deep dive: `A330-CS` sheet (rate list / subscription cost list)

### What it looks like
This sheet behaves like a **rate card** / priced list. Rows contain vendor or tool/service names (e.g., Jeppesen, AirNav, iPad OPT, etc.), with:
- Unit price
- Quantity
- Line total
- Notes (often “Ask AN”)

Sample extracted rows:

|   Row |   Code/Line | Item / Vendor / Description   | Unit Price   | Qty   |   Line Total | Notes   |
|------:|------------:|:------------------------------|:-------------|:------|-------------:|:--------|
|     2 |         nan | Alpha Star Aviation Services  |              |       |          nan |         |
|     3 |         nan | RSAF project                  |              |       |          nan |         |
|     4 |         nan | Airbus A330                   |              |       |          nan |         |
|     9 |         nan | Utilization                   |              |       |          nan |         |
|    10 |         nan | Hours Per Year                | #REF!        |       |          nan |         |
|    11 |         nan | Leg Ratio                     | #REF!        |       |          nan |         |
|    12 |         nan | FH Domestic ratio             | #REF!        |       |          nan |         |
|    13 |         nan | FH International ratio        | #REF!        |       |          nan |         |
|    14 |         nan | Cycles                        | #REF!        |       |          nan |         |
|    15 |         nan | FH rate                       | #REF!        |       |          nan |         |
|    18 |         nan | Fixed costs (Per Year):       |              |       |          nan |         |
|    19 |         nan | Description                   | Cost         |       |          nan |         |

### How to use it (simple and impactful)
- Store these items as a **Rate List** table (vendor/service → unit price, currency).
- When maintenance/ops teams log a cost item in the dashboard, we can:
  - Pick it from the list → auto-fill unit price
  - Multiply by quantity → compute expected cost
- This creates immediate KPIs like: **cost by vendor**, **top subscriptions**, **unexpected extra costs**.

---

## 7) Deep dive: `Total-USD (2)` + `BoQ 2 (2)` (BoQ classification & forecasting logic)

### What these sheets aim to do
They define a Bill of Quantities approach with:
- A **BoQ Classification** (e.g., fuel, additional work, etc.)
- A **Mark-up %** (e.g., 0.07)
- **Escalation %** to forecast Year 2 / Year 3 from Year 1 (e.g., 0.03)

### How we use them without building a complex finance engine
Keep it minimal:
- Use BoQ Classification as a **tag** on budget/spend lines.
- Keep Mark-up and Escalation as **config values** (admin editable).
- If the client wants forecasting later, apply a simple formula:
  - `year2_planned = year1_planned * (1 + escalation)`

---

## 8) Currency reference (`DDL` sheet)

- `USD` rate stored as: `USD`
- `SAR` rate stored as: `SAR` (i.e., 1 USD ≈ SAR SAR in this template)

**Dashboard simplification:** store all values in a **base currency** (e.g., SAR), and keep the FX rate editable in settings.

---

## 9) Recommended “basic but high impact” dashboard scope using this workbook

### 9.1 Budget module (minimum viable)
**Inputs** (simple):
1) **Budget Plan** (import from `RSAF`): clause + aircraft group + year → planned amount
2) **Actual Spend** (manual or Excel upload monthly): date/month + clause/account + aircraft/aircraft group + amount

**Outputs (KPIs):**
- Budget vs Actual (YTD / monthly)
- Remaining budget
- Burn rate (spend per month)
- Top 5 cost clauses
- Cost split by aircraft group (A330 vs G650 vs PMO)

### 9.2 Cost efficiency (connects nicely with utilisation)
Once we connect your utilisation counters sheet:
- `cost_per_flight_hour = actual_cost / flight_hours`
- `cost_per_cycle = actual_cost / cycles`

This is extremely impactful for the client and still keeps the system simple.

### 9.3 Rate List (optional but very helpful)
- Import `A330-CS` (and any similar rate sheets) into a Rate List module.
- Use it to standardize costs and reduce manual mistakes.

---

## 10) Easiest “proper” way to convert this workbook into dashboard inputs

### Table 1 — budget_plan (from RSAF)
```text
budget_plan
- fiscal_year (e.g., 2025)
- clause_id (1..18)
- clause_description
- aircraft_group (A330 | G650ER-1 | G650ER-2 | PMO)
- planned_amount
- currency
```

### Table 2 — actual_spend (manual monthly entry or upload)
```text
actual_spend
- period (YYYY-MM or date)
- aircraft_registration (optional) OR aircraft_group
- clause_id OR account_code
- boq_classification (optional)
- amount
- currency
- vendor/service (optional)
- notes, attachments (optional)
```

### Table 3 — rate_list (from A330-CS and similar)
```text
rate_list
- item_id
- vendor_or_service
- unit_price
- currency
- applicability (aircraft_type, business_line, etc.)
```

**Why this is the easiest path:**
- Matches the workbook’s intent (plan vs actual).
- Avoids complex dependencies on Excel formulas.
- Produces immediate, credible KPIs that the client asked for (end-of-day/month/year stats on spending and drivers).

---

## 11) What we should ask the client for (small requests, big payoff)

To make this workbook fully usable, without scope creep:
1) Confirm **currency** of the RSAF sheet amounts (USD or SAR).
2) Provide the missing linked workbook(s) (if `#REF!` is due to external references), OR confirm we should treat those as templates only.
3) Confirm whether budget should be tracked by **aircraft registration** or **aircraft group** at first (I recommend group first, then drill down later).

---

## 12) Summary (what this adds to the project)

- This workbook is a **budget baseline + rate structure** reference.
- The `RSAF` sheet is immediately usable to build a **Budget vs Actual** dashboard that will impress the client with minimal complexity.
- The account matrices (`Data sum`, `AC sum`) define the **dimensions** needed to allocate costs per tail number later.
- The `A330-CS` sheet is a ready-made **rate list** to standardize costing and improve KPI accuracy.
