# RSAF Budget Template - Technical Reference

## Overview

This document provides the exact structure of the RSAF budget template as extracted from `BUDGETARY SHEET (Rv1) (1).xlsx`. Use this as the authoritative reference when implementing Excel import/export functionality.

## Excel File Structure

### Sheet Name
- Primary sheet: **RSAF**

### Table Layout

#### Header Rows
- **Row 3**: Main headers (aircraft columns + year blocks)
- **Row 4**: Sub-headers (month names)

#### Data Rows
- **Rows 5-22**: 18 spending clauses (clause data)
- **Row 23**: Totals row (sum of all clauses)

### Column Mapping

| Column | Header | Description | Formula/Notes |
|--------|--------|-------------|---------------|
| C | # | Clause index (1-18) | Static numbers |
| D | Clause Description | Clause name | Text |
| E | A330 Total | Budgeted for A330 | User input |
| F | G650ER-1 Total | Budgeted for G650ER-1 | User input |
| G | G650ER-2 Total | Budgeted for G650ER-2 | User input |
| H | PMO Total | Budgeted for PMO | User input |
| I | Total Budgeted | Sum of aircraft columns | `=E+F+G+H` |
| J | (spacer) | Empty column | - |
| K | Total Budget Spent | Sum of monthly actuals | `=SUM(O:AX)` |
| L | (spacer) | Empty column | - |
| M | Remaining Total Budget | Budgeted - Spent | `=I-K` |
| N | (spacer) | Empty column | - |
| O-AX | Monthly actuals | User enters spent amounts | 36 columns (3 years × 12 months) |
| BA | Total Budget (copy) | Duplicate of remaining | `=I-K` |

### Monthly Columns Range
- **Start**: Column O
- **End**: Column AX
- **Count**: 36 columns (3 years × 12 months)

### Year Blocks (Row 3 Headers)
- **FIRST YEAR**: Starts at column O
- **SECOND YEAR**: Starts at column AA
- **THIRD YEAR**: Starts at column AM

### Month Labels (Row 4)
The template shows month labels in row 4, though some may be duplicated or missing in the original file. The calculation uses the full range O:AX regardless.

## 18 Spending Clauses

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

## Totals Row (Row 23)

From the actual Excel file:

| Aircraft | Total Budgeted |
|----------|----------------|
| A330 | 10,293,768 |
| G650ER-1 | 24,141,819 |
| G650ER-2 | 24,141,819 |
| PMO | 11,668,241 |
| **Grand Total** | **70,245,647** |

## Mapping to New System

### Aircraft Scope
The template has 4 fixed aircraft columns:
- **A330** → Maps to aircraft type "A330"
- **G650ER-1** → Maps to specific aircraft or aircraft type "G650ER"
- **G650ER-2** → Maps to specific aircraft or aircraft type "G650ER"
- **PMO** → Maps to aircraft type or group "PMO"

**Implementation Note**: In the new system, aircraft scope is dynamic (selected from existing aircraft in the system), not hardcoded. The template structure is preserved conceptually, but the UI should allow selecting any aircraft/types.

### Spending Terms Mapping

The 18 clauses in the Excel template map to the expanded 60+ spending terms taxonomy. The mapping is:

| Excel Clause | New System Terms |
|--------------|------------------|
| 1. Off base maintenance | Off Base Maintenance (International), Off Base Maintenance (Domestic) |
| 2. Scheduled maintenance | Scheduled Maintenance (International), Scheduled Maintenance (Domestic) |
| 3. Engines and APU | Engines & APU Corporate Care Program (International), Engines & APU Corporate Care Program (Domestic) |
| 4. Third line unscheduled | Third Line Unscheduled Maintenance (International), Third Line Unscheduled Maintenance (Domestic) |
| 5. Aircraft interior | Aircraft Interior (International), Aircraft Interior (Domestic) |
| 6. Spare Parts | Spare Parts (International), Spare Parts (Domestic) |
| 7. Ground Equipment | Ground Equipment (International), Ground Equipment (Domestic) |
| 8. Ground Handling | Ground Handling (International), Ground Handling (Domestic) |
| 9. Fuel | Fuel (International), Fuel (Domestic) |
| 10. Subscriptions | Subscriptions (International), Subscriptions (Domestic) |
| 11. Insurance | Insurance (International), Insurance (Domestic) |
| 12. Cabin crew | Cabin Crew + sub-categories (Manpower, Training, Accommodation, Additional Work) |
| 13. Manpower | Manpower (International), Manpower (Domestic) |
| 14. Administration | Administration & Miscellaneous + sub-categories (Office, Miscellaneous, Ticket, Crew Transportation, etc.) |
| 15. Credit card | Credit Card (International), Credit Card (Domestic) |
| 16. Tablets & SIM cards | Tablets & SIM Cards & Mobile Phone (International), Tablets & SIM Cards & Mobile Phone (Domestic) |
| 17. Uniforms | Uniforms & Accessories (International), Uniforms & Accessories (Domestic) |
| 18. Training | Training (International), Training (Domestic) |

**Note**: The new system uses a more granular taxonomy (60+ terms) to provide better tracking and analytics. When importing from the old Excel format, terms may need to be mapped or split.

## Excel Import Logic

### Parsing Strategy

1. **Validate Structure**:
   - Check for "RSAF" sheet
   - Verify header row 3 contains expected aircraft columns
   - Verify row 4 contains month labels
   - Verify rows 5-22 contain clause data

2. **Extract Planned Amounts**:
   - Read columns E, F, G, H (rows 5-22)
   - Map to aircraft types: A330, G650ER-1, G650ER-2, PMO
   - Create BudgetPlanRow for each clause × aircraft combination

3. **Extract Actual Amounts**:
   - Read columns O-AX (rows 5-22)
   - Determine fiscal periods from column headers or date range
   - Create BudgetActual for each clause × period with non-zero value

4. **Validate Totals**:
   - Verify row 23 totals match sum of rows 5-22
   - Verify column I totals match sum of columns E-H
   - Verify column K totals match sum of columns O-AX

### Error Handling

- **Missing columns**: Reject import with specific error message
- **Invalid numbers**: Reject import with row/column reference
- **Negative values**: Reject import (budgets must be non-negative)
- **Out-of-range dates**: Reject import with date validation error

## Excel Export Logic

### Generation Strategy

1. **Create Workbook**:
   - Create sheet named "RSAF"
   - Set up header rows (3-4)
   - Set up data rows (5-22)
   - Set up totals row (23)

2. **Populate Planned Amounts**:
   - Query BudgetPlanRows for project
   - Group by aircraft type
   - Write to columns E, F, G, H

3. **Populate Actual Amounts**:
   - Query BudgetActuals for project
   - Group by clause and period
   - Write to columns O-AX (map periods to columns)

4. **Calculate Totals**:
   - Add formulas for column I: `=E+F+G+H`
   - Add formulas for column K: `=SUM(O:AX)`
   - Add formulas for column M: `=I-K`
   - Add formulas for row 23: `=SUM(E5:E22)`, etc.

5. **Apply Formatting**:
   - Currency format for all number columns
   - Bold headers
   - Borders around table
   - Freeze panes at row 5, column E

### Preservation Requirements

- **Number formats**: Currency with 2 decimal places
- **Formulas**: Preserve Excel formulas (don't hardcode values)
- **Column widths**: Auto-fit or use standard widths
- **Row heights**: Standard height (15 points)

## Round-Trip Property

**Property 11: Excel Import Round-Trip**

For any valid budget project:
```
Export → Import → Export → Compare
```

The second export MUST produce an equivalent file with:
- Same planned amounts (within 0.01 tolerance)
- Same actual amounts (within 0.01 tolerance)
- Same totals (within 0.01 tolerance)
- Same structure (rows, columns, headers)

**Note**: Binary file comparison is not required (Excel files have metadata that changes). Compare data values only.

## Implementation Checklist

### Excel Import
- [ ] Parse RSAF sheet structure
- [ ] Extract planned amounts from columns E-H
- [ ] Extract actual amounts from columns O-AX
- [ ] Map clauses to spending terms
- [ ] Validate totals
- [ ] Handle errors gracefully
- [ ] Provide preview before import

### Excel Export
- [ ] Generate RSAF sheet structure
- [ ] Populate planned amounts
- [ ] Populate actual amounts
- [ ] Add formulas for totals
- [ ] Apply formatting
- [ ] Trigger file download
- [ ] Test round-trip property

## Testing Data

### Sample Project for Testing

**Project**: RSAF FY2025 Budget
**Date Range**: 2025-01-01 to 2025-12-31
**Aircraft Scope**: A330, G650ER-1, G650ER-2, PMO

**Sample Planned Amounts** (Clause 1 - Off Base Maintenance):
- A330: 500,000
- G650ER-1: 1,200,000
- G650ER-2: 1,200,000
- PMO: 600,000
- Total: 3,500,000

**Sample Actual Amounts** (Clause 1 - January 2025):
- Total Spent: 250,000

**Expected Remaining**: 3,500,000 - 250,000 = 3,250,000

## References

- Source file: `BUDGETARY SHEET (Rv1) (1).xlsx`
- Sheet: RSAF
- Rows: 3-23 (headers + 18 clauses + totals)
- Columns: C-BA (clause info + aircraft + actuals)

