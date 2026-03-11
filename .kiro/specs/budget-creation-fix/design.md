# Budget Project Creation Fix - Bugfix Design

## Overview

The Budget & Cost Revamp module's project creation is broken because it assumes all budget columns map to aircraft in the aircraft master data collection. The real RSAF budget template uses 4 columns: A330, G650ER-1, G650ER-2, and PMO — where "PMO" is not an aircraft and "G650ER-1"/"G650ER-2" are custom labels that don't match aircraft types. The fix replaces the aircraft-scope-based column model with a simple free-text `columnNames: string[]` field, updates the DTO validation, service logic, schema, frontend dialog, and seeds the first RSAF budget project with actual budgetary sheet data.

## Glossary

- **Bug_Condition (C)**: The condition where a user attempts to create a budget project with column names that are not valid aircraft identifiers (MongoIds, aircraft types, or fleet groups in the master data)
- **Property (P)**: The system accepts any free-text string array as column names and creates the correct term × column plan row structure
- **Preservation**: Existing budget table display, variance calculations, actuals tracking, Excel export, and analytics must remain unchanged
- **`columnNames`**: New `string[]` field replacing `aircraftScope` — stores user-provided column labels (e.g., ["A330", "G650ER-1", "G650ER-2", "PMO"])
- **`aircraftScope`**: Old field with `type`, `aircraftIds`, `aircraftTypes`, `fleetGroups` — validated against aircraft master data
- **`resolveAircraftScope()`**: Service method that queries aircraft collection to resolve scope to aircraft IDs — root cause of the failure
- **`generatePlanRows()`**: Service method that creates BudgetPlanRow documents for each term × aircraft combination — produces wrong structure when scope resolution fails
- **Plan Row**: A `BudgetPlanRow` document representing one spending term for one column, with a `plannedAmount`
- **RSAF Template**: The 18-clause × 4-column budget template used by RSAF (Royal Saudi Air Force)

## Bug Details

### Fault Condition

The bug manifests when a user creates a budget project with column names that don't exist as aircraft in the master data. The `CreateBudgetProjectDto` validates `aircraftIds` with `@IsMongoId()`, `resolveAircraftScope()` queries the aircraft service and returns empty results for non-aircraft entries like "PMO", and `generatePlanRows()` then creates a flat structure (one row per term) instead of the expected multi-column structure (one row per term × column).

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type CreateBudgetProjectDto
  OUTPUT: boolean
  
  RETURN input.aircraftScope.type IN ['individual', 'type', 'group']
         AND ANY columnLabel IN input.desiredColumnNames
             WHERE columnLabel NOT IN aircraftMasterData.registrations
             AND columnLabel NOT IN aircraftMasterData.aircraftTypes
             AND columnLabel NOT IN aircraftMasterData.fleetGroups
END FUNCTION
```

### Examples

- **Example 1**: User creates project with columns ["A330", "G650ER-1", "G650ER-2", "PMO"]. Expected: project created with 4 columns and 65×4=260 plan rows. Actual: backend rejects request because "PMO" is not a valid MongoId, or if using type scope, "G650ER-1" doesn't match any aircraft type.
- **Example 2**: User selects scope type "type" and checks "G650ER". Expected: two separate columns "G650ER-1" and "G650ER-2". Actual: system resolves to all aircraft of type G650ER, losing the distinction between the two custom labels.
- **Example 3**: User tries to add "PMO" as a column. Expected: "PMO" appears as a budget column. Actual: no checkbox for "PMO" exists in the UI since it's not in the aircraft collection.
- **Edge case**: User creates project with a single column "Operations". Expected: project created with 65 plan rows (one per term). Actual: fails validation.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Budget table display with planned amounts, actuals, variance, and remaining calculations per row must continue to work exactly as before
- Excel export must continue to generate the correct RSAF structure with column headers matching the project's column names
- Actual spend recording per spending term per column per period must continue to work
- Budget analytics (KPIs, burn rate, distribution charts) must continue to aggregate correctly
- Audit trail logging for all budget modifications must continue to work
- Role-based access control (Viewer/Editor/Admin) must remain unchanged

**Scope:**
All inputs that do NOT involve project creation or the `aircraftScope`/`columnNames` field should be completely unaffected by this fix. This includes:
- Viewing existing budget projects
- Editing planned amounts in existing projects
- Recording actuals against existing projects
- Exporting existing projects to Excel/PDF
- Budget analytics calculations
- Audit log viewing

## Hypothesized Root Cause

Based on the code analysis, the root causes are:

1. **DTO Validation Mismatch**: `AircraftScopeDto` in `create-budget-project.dto.ts` uses `@IsMongoId({ each: true })` on `aircraftIds`, requiring valid MongoDB ObjectIds. Free-text column names like "PMO" or "G650ER-1" are not ObjectIds and fail validation before reaching the service layer.

2. **Aircraft-Dependent Scope Resolution**: `resolveAircraftScope()` in `budget-projects.service.ts` queries `aircraftService.findAll()` and filters by `aircraftType` or `fleetGroup`. Non-aircraft entries return zero matches, and custom labels like "G650ER-1" don't match any aircraft type exactly.

3. **Plan Row Generation Depends on Aircraft IDs**: `generatePlanRows()` iterates over resolved `aircraftIds` (ObjectIds) and calls `aircraftService.findById()` for each to get the `aircraftType`. When `aircraftIds` is empty (due to failed resolution), it falls back to creating one row per term without any column association, producing a flat structure.

4. **Frontend Locked to Aircraft Master Data**: `CreateProjectDialog.tsx` uses `useAircraft()` to populate checkboxes from the aircraft collection. There is no mechanism to enter arbitrary text column names.

5. **Schema Stores Aircraft References**: `budget-project.schema.ts` stores `aircraftScope.aircraftIds` as `Types.ObjectId[]`, tightly coupling the schema to the aircraft collection.

## Correctness Properties

Property 1: Fault Condition - Free-Text Column Names Accepted

_For any_ input where `columnNames` is a non-empty array of strings (including non-aircraft names like "PMO", "Operations", "G650ER-1"), the fixed `create()` method SHALL accept the column names without querying the aircraft collection, create the project with the exact column names stored, and generate exactly `spendingTerms.length × columnNames.length` plan rows.

**Validates: Requirements 2.1, 2.3, 2.4**

Property 2: Preservation - Existing Budget Table and Calculations

_For any_ existing budget project (whether created with old `aircraftScope` or new `columnNames`), the fixed `getTableData()` method SHALL produce the same planned amounts, actuals, variance, remaining, and grand totals as the original method, preserving all display and calculation behavior.

**Validates: Requirements 3.1, 3.2, 3.4, 3.5**

Property 3: Preservation - Plan Row Structure Integrity

_For any_ budget project created with N column names and a template with M spending terms, the system SHALL have exactly N × M plan rows, each with a unique `(termId, columnName)` combination, and each plan row SHALL have the correct `termName`, `termCategory`, and `columnName` fields.

**Validates: Requirements 2.3, 2.4**

Property 4: Preservation - Excel Export Column Headers

_For any_ budget project with column names, the Excel export SHALL use the exact column name strings as column headers, preserving the user-provided labels throughout the export lifecycle.

**Validates: Requirements 2.4, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `backend/src/budget-projects/dto/create-budget-project.dto.ts`

**Changes**:
1. **Remove `AircraftScopeDto` class entirely** — no longer needed
2. **Add `columnNames` field** to `CreateBudgetProjectDto` — `@IsArray()`, `@IsString({ each: true })`, `@ArrayMinSize(1)` — accepts any string array
3. **Remove `aircraftScope` field** from `CreateBudgetProjectDto`

---

**File**: `backend/src/budget-projects/schemas/budget-project.schema.ts`

**Changes**:
1. **Add `columnNames` field** — `@Prop({ type: [String], required: true })` — stores the free-text column names
2. **Keep `aircraftScope` field as optional** for backward compatibility with existing projects — change `required: true` to `required: false`

---

**File**: `backend/src/budget-projects/schemas/budget-plan-row.schema.ts`

**Changes**:
1. **Add `columnName` field** — `@Prop()` — stores the column label string (e.g., "PMO", "A330")
2. **Keep `aircraftId` and `aircraftType` fields** for backward compatibility
3. **Update unique index** to `{ projectId: 1, termId: 1, columnName: 1 }` (add a new index, keep old one for legacy data)

---

**File**: `backend/src/budget-projects/schemas/budget-actual.schema.ts`

**Changes**:
1. **Add `columnName` field** — `@Prop()` — stores the column label for actuals tracking
2. **Keep `aircraftId` and `aircraftType` fields** for backward compatibility

---

**File**: `backend/src/budget-projects/services/budget-projects.service.ts`

**Changes**:
1. **Replace `resolveAircraftScope()` call** in `create()` — use `dto.columnNames` directly instead of resolving aircraft IDs
2. **Rewrite `generatePlanRows()`** — iterate over `columnNames: string[]` instead of `aircraftIds: string[]`, store `columnName` on each plan row instead of `aircraftId`/`aircraftType`
3. **Store `columnNames`** on the project document instead of `aircraftScope`
4. **Update `getTableData()`** — use `columnName` field for grouping plan rows and actuals instead of `aircraftId`
5. **Remove `resolveAircraftScope()` method** — no longer needed
6. **Remove `AircraftService` dependency** from constructor if no longer used elsewhere in this service

---

**File**: `backend/src/budget-projects/dto/update-budget-project.dto.ts`

**Changes**:
1. **Add optional `columnNames` field** — allows updating column names on existing projects
2. **Remove `aircraftScope` field** from update DTO

---

**File**: `frontend/src/types/budget-projects.ts`

**Changes**:
1. **Add `columnNames: string[]`** to `BudgetProject` interface
2. **Keep `aircraftScope` as optional** for backward compatibility
3. **Update `CreateBudgetProjectDto`** — replace `aircraftScope` with `columnNames: string[]`
4. **Update `UpdateBudgetProjectDto`** — replace `aircraftScope` with optional `columnNames`
5. **Add `columnName?: string`** to `BudgetPlanRow` and `BudgetActual` interfaces
6. **Add `columnName?: string`** to `BudgetTableRow` interface

---

**File**: `frontend/src/components/budget/CreateProjectDialog.tsx`

**Changes**:
1. **Remove `useAircraft()` hook** — no longer needed
2. **Remove aircraft scope type selector** and all checkbox sections
3. **Add tag input component** — free-text input where user types a column name and presses Enter/comma to add it as a tag
4. **Update Zod schema** — replace `aircraftScopeType`, `aircraftIds`, `aircraftTypes`, `fleetGroups` with `columnNames: z.array(z.string()).min(1)`
5. **Update `onSubmit`** — send `columnNames` instead of `aircraftScope`
6. **Show tags as removable chips** — each column name displayed as a chip with an X button

---

**File**: `backend/src/scripts/seed.ts`

**Changes**:
1. **Add RSAF budget project seed** — create a project named "RSAF FY2025 Budget" with:
   - `templateType: 'RSAF'`
   - `columnNames: ['A330', 'G650ER-1', 'G650ER-2', 'PMO']`
   - `dateRange: { start: 2025-04-01, end: 2028-03-31 }` (3-year fiscal period starting April)
   - `currency: 'USD'`
   - `status: 'active'`
2. **Seed plan rows with planned amounts** from the budgetary sheet — 18 clauses × 4 columns with the actual amounts from the RSAF template reference (grand totals: A330=10,293,768, G650ER-1=24,141,819, G650ER-2=24,141,819, PMO=11,668,241)

**Note on RSAF Seed Spending Terms**: The RSAF template has 18 high-level clauses, but the system uses 65 granular spending terms. For the seed, we need to map the 18 clause totals to the 65 terms. The simplest approach: assign each clause's planned amount to the first spending term in that clause's category, with remaining terms in the category set to 0. This preserves the total per clause while using the existing term structure.

---

**File**: `frontend/src/components/budget/BudgetTable.tsx`

**Changes**:
1. **Update row key and grouping** — use `columnName` instead of `aircraftId` for row identification
2. **Display `columnName`** instead of `aircraftType` in the sub-label under term names

---

**File**: `frontend/src/hooks/useBudgetProjects.ts`

**Changes**:
1. **Update `useCreateProject` mutation** — send `columnNames` instead of `aircraftScope`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to create budget projects with non-aircraft column names via the API. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **PMO Column Test**: POST `/api/budget-projects` with aircraftScope type "type" and aircraftTypes ["PMO"] — will fail because "PMO" is not an aircraft type in the master data (will fail on unfixed code)
2. **Custom Label Test**: POST with aircraftScope type "type" and aircraftTypes ["G650ER-1"] — will fail because "G650ER-1" is not an exact aircraft type match (will fail on unfixed code)
3. **Mixed Column Test**: POST with a mix of valid aircraft types and "PMO" — will partially resolve, producing wrong plan row count (will fail on unfixed code)
4. **Empty Resolution Test**: POST with aircraftScope type "group" and fleetGroups ["PMO"] — resolveAircraftScope returns empty array, generatePlanRows creates flat structure (will fail on unfixed code)

**Expected Counterexamples**:
- Backend returns 400 Bad Request for non-MongoId aircraftIds
- resolveAircraftScope returns empty array for non-aircraft entries
- generatePlanRows creates N rows instead of N×M rows
- Possible causes: @IsMongoId validation, aircraft collection query, empty aircraftIds fallback

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := createProject_fixed(input)
  ASSERT result.project.columnNames == input.columnNames
  ASSERT count(result.planRows) == spendingTerms.length * input.columnNames.length
  ASSERT EACH planRow HAS columnName IN input.columnNames
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL project WHERE project EXISTS in database DO
  tableData_original := getTableData_original(project.id)
  tableData_fixed := getTableData_fixed(project.id)
  ASSERT tableData_original.grandTotal == tableData_fixed.grandTotal
  ASSERT tableData_original.rows.length == tableData_fixed.rows.length
  FOR EACH row IN tableData_original.rows DO
    ASSERT row.plannedAmount == corresponding_fixed_row.plannedAmount
    ASSERT row.totalSpent == corresponding_fixed_row.totalSpent
    ASSERT row.remaining == corresponding_fixed_row.remaining
  END FOR
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing project operations (view table, record actuals, export), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Table Data Preservation**: Verify getTableData returns identical results for projects created with the new columnNames field vs manually constructed equivalent data
2. **Actuals Recording Preservation**: Verify recording actuals against a column-name-based project works identically to the old aircraft-based approach
3. **Analytics Preservation**: Verify budget KPIs and analytics produce correct results with column-name-based projects
4. **Excel Export Preservation**: Verify Excel export uses columnNames as headers and produces valid RSAF structure

### Unit Tests

- Test CreateBudgetProjectDto validation accepts any string array for columnNames
- Test CreateBudgetProjectDto validation rejects empty columnNames array
- Test generatePlanRows creates correct number of rows for N terms × M columns
- Test generatePlanRows stores correct columnName on each plan row
- Test getTableData groups rows correctly by columnName
- Test RSAF seed data has correct structure and amounts
- Test backward compatibility: projects with old aircraftScope field still load

### Property-Based Tests

- Generate random arrays of column name strings and verify project creation succeeds with correct plan row count
- Generate random planned amounts across columns and verify variance calculations are correct
- Generate random actuals across periods and columns and verify totals match

### Integration Tests

- Test full project creation flow: create project with ["A330", "G650ER-1", "G650ER-2", "PMO"] → verify plan rows → update planned amounts → record actuals → verify table data
- Test seed data: run seed → verify RSAF project exists with correct structure and amounts
- Test backward compatibility: create project with old API format → verify it still works (if supported) or returns clear error
