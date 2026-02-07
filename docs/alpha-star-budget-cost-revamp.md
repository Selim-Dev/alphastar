# Alpha Star — Budget & Cost Revamp Spec (based on provided XLSX + screenshots)

> Source template: **BUDGETARY SHEET (Rv1) (1).xlsx**  
> Primary sheet analyzed: **`RSAF`** (table starts at row 3/4)

## 1) Context

You have:
- An **Excel budgetary sheet** (attached as both image and the `.xlsx`) that is used today for Budget & Cost.
- A dashboard app called **Alpha Star — Aviation KPIs**, with a left sidebar containing:
  - **Operations:** Dashboard, Fleet Availability, Daily Status  
  - **Maintenance:** AOG & Events, Maintenance Tasks, Work Orders, Discrepancies  
  - **Finance:** **Budget & Cost**  
  - **Administration:** Vacation Plan, Data Import, Settings  
  - **Support:** Help Center  

You want to **revamp Budget & Cost**, because aircrafts already exist in the system now (so the current import/static handling is no longer the best UX).

---

## 2) Critical Note (MUST be explicit in the project docs)

### Budget calculations are isolated
**The budget generated from this Excel template is totally independent.**  
All calculations are **encapsulated inside the provided file structure** and **must not depend on any other feature/module** (maintenance tasks, work orders, discrepancies, etc.).

This module should be treated as:
- A **self-contained budgeting engine + UI** for this specific template/version.
- Not a shared “finance ledger” for the whole system.

### Multiple budget project types are expected
We may later have **other “Budget Projects”** with:
- Different sheet shapes / calculation logic
- Different analysis dashboards (charts & KPIs)
- Separate term taxonomies

So the implementation should support **budget templates** (or “project types”), not one hard-coded screen forever.

---

## 3) What the current XLSX represents (observations)

### 3.1 Static aircraft columns (in this template)
The budget table is built around **fixed aircraft columns**:
- **A330**
- **G650ER-1**
- **G650ER-2**
- **PMO**

In the current file, each clause (spending category) has a **budgeted amount per aircraft column**, and then totals are computed.

> In the revamp, we should keep the “concept” (budget by aircraft / aircraft type), but the UI should be driven by the aircrafts already in the system (no heavy import-first workflow).

---

## 4) Excel sheet structure (as implemented in `RSAF`)

### 4.1 Layout summary
The table begins at:
- **Row 3**: main headers (aircraft columns + year blocks)
- **Row 4**: sub-headers (e.g., “Total”, month names)
- **Rows 5 → 22**: the 18 clauses (spending categories)
- **Row 23**: totals (SUM of each aircraft column + Total Budgeted)

### 4.2 Columns dictionary (exactly from the file)
| Column | Meaning | Notes / Formula in the file |
|---|---|---|
| C | `#` | Clause index (1..18) |
| D | `Clause Description` | Clause name |
| E | `A330 Total` | Budgeted for A330 |
| F | `G650ER-1 Total` | Budgeted for G650ER-1 |
| G | `G650ER-2 Total` | Budgeted for G650ER-2 |
| H | `PMO Total` | Budgeted for PMO |
| I | `Total Budgeted` | `=E+F+G+H` per row |
| K | `Total Budget Spent` | `=SUM(O:AX)` per row (monthly actuals across 3 years) |
| M | `Remaining Total Budget` | `=I-K` per row |
| O..AX | Monthly actual spend inputs | User enters “spent” amounts per month per clause |
| BA | `Total Budget` (copy) | In this file it duplicates remaining: `=I-K` |

> There are spacer columns between some totals (e.g., J, L, N) used for formatting.

### 4.3 Year / Month blocks
Monthly columns used by the calculation:
- **Spent range:** `O .. AX`  
- **Total spent per clause:** `SUM(Ox:AXx)`  

The sheet groups months into year blocks (row 3 shows):  
- `FIRST YEAR` starts at **O**
- `SECOND YEAR` starts at **AA**
- `THIRD YEAR` starts at **AM**

Row 4 contains month labels for those columns (some labels appear duplicated / missing in the template, but the calculation still uses the full range `O..AX`).

### 4.4 Clauses in this sheet (18 rows)
Below are the clauses as they appear in the XLSX:

| # | Clause Description |
|---:|---|
| 1 | Off base maintenance. |
| 2 | Scheduled maintenance (time change item-ADs-SB) |
| 3 | Engines and APU corporate care program |
| 4 | Third line unscheduled maintenance – modification – refurbishment |
| 5 | Aircraft interior (cabin appearance program) |
| 6 | Spare Parts |
| 7 | Ground Equipment |
| 8 | Ground Handling |
| 9 | Fuel |
| 10 | Subscriptions |
| 11 | Insurance |
| 12 | Cabin crew |
| 13 | Manpower |
| 14 | Administration and miscellaneous |
| 15 | Credit card |
| 16 | Tablets & SIM cards & mobile phone |
| 17 | Uniforms and accessories |
| 18 | Training |

### 4.5 Totals row (from the XLSX)
The totals row (row 23) sums the entire table:

- **A330 Total:** 10,293,768  
- **G650ER-1 Total:** 24,141,819  
- **G650ER-2 Total:** 24,141,819  
- **PMO Total:** 11,668,241  
- **Grand Total Budgeted:** **70,245,647**

---

## 5) Spending terms list (project taxonomy)

You provided the official spending terms list for the project (including Intl/Dom variants).  
We should treat this as the canonical “terms taxonomy” for the Alpha Star Budget & Cost project type.

```js
const spendingTerms = [
  "Off Base Maintenance (International)",
  "Off Base Maintenance (Domestic)",

  "Scheduled Maintenance (time change item-ADs-SB) (International)",
  "Scheduled Maintenance (time change item-ADs-SB) (Domestic)",

  "Engines & APU Corporate Care Program (International)",
  "Engines & APU Corporate Care Program (Domestic)",

  "Third Line Unscheduled Maintenance – Modification – Refurbishment (International)",
  "Third Line Unscheduled Maintenance – Modification – Refurbishment (Domestic)",

  "Aircraft Interior (Cabin Appearance Program) (International)",
  "Aircraft Interior (Cabin Appearance Program) (Domestic)",

  "Spare Parts (International)",
  "Spare Parts (Domestic)",

  "Ground Equipment (International)",
  "Ground Equipment (Domestic)",

  "Ground Handling (International)",
  "Ground Handling (Domestic)",

  "Fuel (International)",
  "Fuel (Domestic)",

  "Subscriptions (International)",
  "Subscriptions (Domestic)",

  "Insurance (International)",
  "Insurance (Domestic)",

  "Cabin Crew",

  "Cabin Crew - Manpower Flight Attendant (International)",
  "Cabin Crew - Manpower Flight Attendant (Domestic)",

  "Cabin Crew - Training (International)",
  "Cabin Crew - Training (Domestic)",

  "Cabin Crew - Accommodation (International)",
  "Cabin Crew - Accommodation (Domestic)",

  "Cabin Crew - Additional Work Flight Attendant (International)",
  "Cabin Crew - Additional Work Flight Attendant (Domestic)",

  "Manpower (International)",
  "Manpower (Domestic)",

  "Administration & Miscellaneous",

  "Administration & Miscellaneous - Office (International)",
  "Administration & Miscellaneous - Office (Domestic)",

  "Administration & Miscellaneous - Miscellaneous (International)",
  "Administration & Miscellaneous - Miscellaneous (Domestic)",

  "Ticket (International)",
  "Ticket (Domestic)",

  "Crew Transportation (International)",
  "Crew Transportation (Domestic)",

  "Aircraft Delivery (International)",
  "Aircraft Delivery (Domestic)",

  "Hotels (International)",
  "Hotels (Domestic)",

  "Catering (International)",
  "Catering (Domestic)",

  "Commissary (International)",
  "Commissary (Domestic)",

  "Credit Card (International)",
  "Credit Card (Domestic)",

  "Tablets & SIM Cards & Mobile Phone (International)",
  "Tablets & SIM Cards & Mobile Phone (Domestic)",

  "Uniforms & Accessories (International)",
  "Uniforms & Accessories (Domestic)",

  "Training (International)",
  "Training (Domestic)",

  "Additional Work (International)",
  "Additional Work (Domestic)",

  "Fleet Management",
];
```

---

## 6) Revamp direction (product + UX)

### 6.1 Sidebar / navigation
- You said we can **comment out** the current **Finance → Budget & Cost** implementation and ship a **new module** (even with a new name).
- This is recommended because the backend + frontend handling is different now.

Suggested options:
- Keep label: **Budget & Cost (Revamped)** (safe for users)
- Or rename: **Budget Projects** (future-proof for multiple template types)

### 6.2 UX goals (manager-friendly)
This user is the manager of an aircraft company, so the UX should be:
- **One-screen understandable** (table + totals + filters)
- **Low friction input** (edit monthly spend without complex forms)
- **Fast insights** (KPIs + charts + “where are we overspending?”)

Practical UX choices:
- Default to **current year** view + a simple **year switcher**
- Inline editing for monthly cells
- Sticky top summary cards (Budgeted / Spent / Remaining)
- “Export to Excel” always available
- Clear audit trail: “who edited which month amount”

### 6.3 Data model suggestion (template-driven)
To support “other budget projects” later:

- **BudgetProject**
  - id, name, templateType, dateRange, currency
  - aircraftScope (types or tail numbers)
- **BudgetTerm**
  - id, name (from `spendingTerms`), category grouping
- **BudgetPlanRow**
  - termId + aircraftId/typeId → budgeted amount
- **BudgetActual**
  - termId + month → spent amount (+ optional aircraft split if required)
- **BudgetComputed**
  - totals, remaining, rollups (can be computed on the fly or materialized)

---

## 7) NEW Analysis page (to “astonish the client”)

Add an **Analysis** tab inside the new Budget module.

### 7.1 KPI cards (top)
- Total Budgeted
- Total Spent
- Remaining
- Burn rate (spent / budgeted)
- Average monthly spend
- Forecast (simple projection based on last N months)

### 7.2 Charts (high impact, easy to read)
1. **Stacked bar (Monthly Spend by Term)**
2. **Line chart (Cumulative Spend vs Cumulative Budget)**
3. **Donut / pie (Spend distribution by term)**
4. **Bar chart (Budgeted vs Spent per Aircraft Type)**
5. **Top 5 overspend terms** (ranked list + badges)
6. Optional: **Heatmap table** (terms × months)

### 7.3 Filters
- Date range (year / quarter / month)
- Aircraft type (A330, G650ER-1, …) or “All”
- Intl vs Domestic (if you map terms accordingly)
- Term search

---

## 8) Implementation notes (important)

- The module should **not** depend on any other system data for its calculations.
- Aircrafts **exist in the system**, so we should allow the manager to:
  - Pick aircraft types / tails that are in-scope for the project
  - Generate a budget table from that scope
- Keep an “Import from Excel” option only as a convenience (not required to start).
- Ensure we can support **future budget templates** without rewriting everything.

---

## 9) Deliverables checklist

- [ ] New module route (Finance → Budget Projects / Budget & Cost Revamped)
- [ ] Template: “Alpha Star Budgetary Sheet (RSAF)”
- [ ] Data entry table (budgeted + monthly spend)
- [ ] Summary totals + export
- [ ] Analysis page with charts + filters
- [ ] Permissions + audit log
- [ ] Ability to add more budget project types later

---

## Appendix A — Files provided
- `BUDGETARY SHEET (Rv1) (1).xlsx` (used for structure + totals extraction)
- Screenshot: sidebar showing **Finance → Budget & Cost**
- Screenshot: budgetary table showing the same clause list and totals

