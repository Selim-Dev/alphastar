# Task 5: Budget Plan Rows and Actuals - Implementation Complete

## Summary

Task 5 has been successfully implemented and verified. All subtasks are complete:

- ✅ 5.1 Create BudgetPlanRow schema and repository
- ✅ 5.2 Create BudgetActual schema and repository  
- ✅ 5.3 Implement table data operations in BudgetProjectsService
- ✅ 5.7 Add table data endpoints to BudgetProjectsController

## Implementation Details

### 1. Schemas (Already Existed)

**BudgetPlanRow Schema** (`schemas/budget-plan-row.schema.ts`):
- Fields: projectId, termId, termName, termCategory, aircraftId, aircraftType, plannedAmount
- Indexes: 
  - Unique compound: (projectId, termId, aircraftId)
  - projectId
  - termId

**BudgetActual Schema** (`schemas/budget-actual.schema.ts`):
- Fields: projectId, termId, period, aircraftId, aircraftType, amount, notes, createdBy
- Indexes:
  - (projectId, termId, period)
  - (projectId, period)
  - period

### 2. Repositories (Already Existed)

**BudgetPlanRowRepository** (`repositories/budget-plan-row.repository.ts`):
- CRUD operations: create, createMany, findById, update
- Query methods: findByProjectId, findByProjectAndTerm
- Aggregation: getTotalPlannedByProject
- Cleanup: deleteByProjectId

**BudgetActualRepository** (`repositories/budget-actual.repository.ts`):
- CRUD operations: create, findById, update, upsert
- Query methods: findByProjectId, findByProjectAndPeriod, findByProjectTermAndPeriod
- Aggregation: getTotalSpentByProject, getDistinctPeriodsByProject, getActualsByTermAndPeriod
- Cleanup: deleteByProjectId

### 3. Service Methods (Added)

**BudgetProjectsService** (`services/budget-projects.service.ts`):

#### getTableData(projectId: string)
Returns formatted table data for display:
```typescript
{
  projectId: string;
  periods: string[];               // ["2025-01", "2025-02", ...]
  rows: BudgetTableRow[];          // Plan rows with actuals
  columnTotals: Record<string, number>;  // Sum per period
  grandTotal: {
    budgeted: number;
    spent: number;
    remaining: number;
  };
}
```

**Features**:
- Generates periods from project date range
- Builds actuals map for efficient lookup
- Calculates row totals (sum of monthly actuals)
- Calculates column totals (sum of all terms per period)
- Calculates grand totals (budgeted, spent, remaining)
- Computes variance and variance percentage per row

#### updatePlanRow(projectId, rowId, dto, userId)
Updates a plan row's planned amount with:
- Project and row validation
- Audit logging (old value → new value)
- User attribution

#### updateActual(projectId, period, dto, userId)
Updates or creates an actual spend entry with:
- Period format validation (YYYY-MM)
- Period range validation (within project date range)
- Upsert operation (create if not exists, update if exists)
- Audit logging (create or update action)
- User attribution

#### generatePeriods(startDate, endDate)
Helper method that generates list of periods (YYYY-MM) from start to end date.

### 4. Controller Endpoints (Added)

**BudgetProjectsController** (`controllers/budget-projects.controller.ts`):

#### GET /api/budget-projects/:id/table-data
- Returns formatted table data for a project
- No authentication required (uses JwtAuthGuard from controller level)
- Response includes periods, rows, column totals, and grand totals

**Route Order**: Placed before `GET :id` to avoid route conflict (more specific routes first).

## Validation & Testing

### Test Results
All tests passed successfully:

```
✓ Login successful
✓ Project created with 65 plan rows (RSAF template)
✓ Table data retrieved with correct structure
✓ Plan row updated and verified
✓ Actual spend updated and verified
✓ Row totals accurate (sum of monthly actuals)
✓ Column totals accurate (sum of all terms per period)
✓ Grand totals accurate (budgeted, spent, remaining)
✓ Remaining budget invariant holds (planned - spent)
✓ Test project cleaned up
```

### Verified Calculations

1. **Row Total Accuracy**: For each row, totalSpent = sum of all monthly actuals
2. **Column Total Accuracy**: For each period, columnTotal = sum of all term amounts
3. **Grand Total Accuracy**: 
   - totalBudgeted = sum of all plannedAmounts
   - totalSpent = sum of all row totalSpent
   - totalRemaining = totalBudgeted - totalSpent
4. **Remaining Budget Invariant**: For each row, remaining = plannedAmount - totalSpent

### Requirements Validated

- ✅ Requirement 2.1: Table displays spending terms as rows and months as columns
- ✅ Requirement 2.5: Cell edits update database and recalculate totals
- ✅ Requirement 2.6: Row totals and column totals displayed correctly
- ✅ Requirement 3.1: Plan rows generated for each term × aircraft combination
- ✅ Requirement 3.2: Planned amounts can be entered and updated
- ✅ Requirement 3.4: Total planned budget calculated correctly
- ✅ Requirement 3.5: Remaining budget calculated as (Planned - Spent)
- ✅ Requirement 4.1: Actual spend entries associated with term, period, and aircraft
- ✅ Requirement 4.2: Period validated to be within project date range
- ✅ Requirement 4.4: Multiple entries for same term/period aggregated in display

## API Endpoints

### GET /api/budget-projects/:id/table-data
**Description**: Get formatted table data for a project

**Response**:
```json
{
  "projectId": "string",
  "periods": ["2025-01", "2025-02", ...],
  "rows": [
    {
      "rowId": "string",
      "termId": "string",
      "termName": "string",
      "termCategory": "string",
      "aircraftId": "string?",
      "aircraftType": "string?",
      "plannedAmount": 0,
      "actuals": {
        "2025-01": 0,
        "2025-02": 0,
        ...
      },
      "totalSpent": 0,
      "remaining": 0,
      "variance": 0,
      "variancePercent": 0
    }
  ],
  "columnTotals": {
    "2025-01": 0,
    "2025-02": 0,
    ...
  },
  "grandTotal": {
    "budgeted": 0,
    "spent": 0,
    "remaining": 0
  }
}
```

### PATCH /api/budget-projects/:id/plan-row/:rowId
**Description**: Update a plan row's planned amount

**Request Body**:
```json
{
  "plannedAmount": 50000
}
```

**Response**:
```json
{
  "message": "Plan row updated successfully"
}
```

### PATCH /api/budget-projects/:id/actual/:period
**Description**: Update or create an actual spend entry

**Request Body**:
```json
{
  "termId": "string",
  "amount": 12500,
  "aircraftId": "string?",
  "aircraftType": "string?",
  "notes": "string?"
}
```

**Response**:
```json
{
  "message": "Actual updated successfully"
}
```

## Next Steps

The following optional property-based test tasks remain:
- 5.4 Write property test for row total accuracy
- 5.5 Write property test for column total accuracy
- 5.6 Write property test for remaining budget invariant
- 5.8 Write property test for non-negative amount validation
- 5.9 Write property test for fiscal period validation

These are marked as optional and can be implemented later for additional test coverage.

## Files Modified

1. `backend/src/budget-projects/services/budget-projects.service.ts`
   - Added `getTableData()` method
   - Added `generatePeriods()` helper method

2. `backend/src/budget-projects/controllers/budget-projects.controller.ts`
   - Added `GET :id/table-data` endpoint
   - Reordered routes for proper precedence

## Test Script

Created `test-budget-table-data.js` for comprehensive testing of:
- Project creation
- Table data retrieval
- Plan row updates
- Actual spend updates
- Calculation accuracy
- Data integrity

---

**Status**: ✅ COMPLETE  
**Date**: February 8, 2026  
**Verified**: All tests passing, calculations accurate, requirements met
