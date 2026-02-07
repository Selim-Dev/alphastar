# Alpha TRS — Maintenance Activity (Activity Sheet) Workflow

## Where this workflow lives
- System: **Alpha TRS** (Alpha Star Aviation Services)
- Module: **Shift Activity → Maintenance Activity**
- Purpose: create a **Maintenance Shift Activity** record for a specific **date + shift**, then fill multiple sections (supervisors, employees, defects, work orders, etc.), **review**, and **submit**.

---

## 1) Maintenance Activity list (View All)
**Screen:** `Maintenance Activity` (list/table)

What users do:
- View existing maintenance activity records in a table (columns typically include **Date**, **Shift**, **Created By**, **Status**, **Manage**).
- Use **Search** + pagination (“Show N entries”).
- Click **Create New Maintenance Activity** to start a new activity sheet.
- Open an existing record from **Manage** (eye icon).

Output:
- A record shows **Status = SUBMITTED** after final submission.

---

## 2) Create New Maintenance Activity
**Screen:** `Maintenance Activity → Create New`

Inputs (required):
- **Date***  
- **Select Shift*** (e.g., *Morning / Evening / Night / Other Station / …*)

Action:
- Click **Submit** to create the base Maintenance Shift Activity.

Output:
- System creates the activity and moves user into the detailed data-entry steps.

---

## 3) Manage Supervisors
**Screen:** `Maintenance Activity → Manage Supervisors`

Inputs (required fields depend on configuration; validations enforce missing values):
- **Date*** (read-only, from step 2)
- **Select Shift*** (read-only, from step 2)
- **Select Aircrafts Assigned** (can be **ALL FLEET** or specific aircraft like `HZ-A5`, etc.)
- **Select Supervisor**
- **Select Task Description** (examples seen: **Shift Supervisor**, **Shift Supervisor – In Charge**)

Actions:
- **Save** (save progress)
- **Save and Proceed** (save + go to next step)
- **+** button adds additional assignment rows (multiple supervisors / aircraft assignments).

Validation:
- If required fields are missing, system shows a red **Alert! / Invalid Entry** message.

---

## 4) Manage Employees
**Screen:** `Maintenance Activity → Manage Employees`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **Select Employee**
- **Select Aircrafts Assigned** (can assign aircraft(s) per employee)

Actions:
- **+** button adds another employee row (multiple employees can be assigned in the same activity).
- **Save** / **Save and Proceed**
- **Back**

---

## 5) Manage Aircraft in Station
**Screen:** `Maintenance Activity → Manage Aircraft In Station`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **Select Aircraft (A/C)**
- **ADD** (field shown as “ADD”)
- **CADD** (field shown as “CADD”)
- **Action Taken**
- **Man-Power**
- **Man-Hrs**
- **Remark(s)**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple aircraft-in-station entries.
- **Back**

---

## 6) Manage Log Book Defect(s)
**Screen:** `Maintenance Activity → Manage Log Book Defect(s)`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **FMR** (dropdown; example seen: **NO**)
- **Log Book**
- **Action Taken**
- **Man-Power**
- **Man-Hrs**
- **Remark(s)**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple defect entries.
- **Back**

---

## 7) Manage Log Book Cabin
**Screen:** `Maintenance Activity → Manage Log Book Cabin`

Inputs (same pattern as defects):
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **FMR**
- **Log Book**
- **Action Taken**
- **Man-Power**
- **Man-Hrs**
- **Remark(s)**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple cabin log-book entries.
- **Back**

---

## 8) Manage Work Order(s)
**Screen:** `Maintenance Activity → Manage Work Order`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **Work Order**
- **Man-Power**
- **Man-Hrs**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple work orders.
- **Back**

---

## 9) Manage AOG
**Screen:** `Maintenance Activity → Manage AOG`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **Item Description**
- **Action Taken**
- **Man-Power**
- **Man-Hrs**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple AOG items.
- **Back**

---

## 10) Manage MEL
**Screen:** `Maintenance Activity → Manage MEL` (appears in Review; form pattern matches AOG)

Expected inputs (based on review section layout):
- **A/C**
- **Item Description**
- **Action Taken**
- **Man-Power**
- **Man-Hrs**

Actions:
- **Save** / **Save and Proceed**
- **+** to add multiple MEL items.
- **Back**

---

## 11) Manage Other Maintenance Activities
**Screen:** `Maintenance Activity → Manage Other Maintenance Activities`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **Item Description**
- **Action Taken**
- **Man-Power**
- **Man-Hrs**

Actions:
- **Save** / **Save and Proceed**
- **+** button to add multiple entries.
- **Back**

---

## 12) Manage Flight Mechanic Support
**Screen:** `Maintenance Activity → Manage Flight Mechanic Support`

Inputs:
- **Date***, **Select Shift*** (read-only)
- **A/C**
- **Detail**
- **Time (24 HR format)** (placeholder like `hh:mm`)
- **Date** (field shown on this screen)
- **Status**

Actions:
- **Save** / **Save and Proceed**
- **+** button (to add multiple support/report entries)
- **Back**

> Note: This screen is part of the Maintenance Activity module and captures flight-mechanic support/report details as an additional section.

---

## 13) Review Details + Submit
**Screen:** `Maintenance Activity → Review Details`

What users see:
- A consolidated summary of all sections (each rendered as a small table), e.g.:
  - **Supervisors**
  - **Employees**
  - **Log-Book Cabin**
  - **Work Order(s)**
  - **AOG**
  - **MEL**
  - **Other Maintenance Activities**
  - (and other captured sections such as aircraft-in-station / defects / flight mechanic support)

Actions:
- Each section has an **Edit** button to go back and change only that part.
- After review, user **submits** the full activity sheet.

Output:
- Record appears in the list view with **Status = SUBMITTED**.

---

## Implementation notes for your KPIs dashboard (data points available)
From the activity sheet inputs, you can derive KPIs such as:
- Activities created/submitted by **date**, **shift**, **station**
- Count of **aircraft covered** (ALL FLEET vs specific aircraft)
- Total **Man-Power** and **Man-Hours** by date/shift/aircraft
- Counts of:
  - **Log book defects**
  - **Cabin log book items**
  - **Work orders**
  - **AOG items**
  - **MEL items**
  - **Other maintenance activities**
  - **Flight mechanic support entries**
- Top supervisors / employees by assignments, and aircraft frequency

