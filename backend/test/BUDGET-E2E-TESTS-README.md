# Budget & Cost Revamp E2E Tests

## Overview

This document describes the comprehensive End-to-End (E2E) integration tests for the Budget & Cost Revamp feature. These tests validate complete user workflows from project creation through data entry, analytics, and export.

## Test File

**Location**: `backend/test/budget-projects.e2e-spec.ts`

## Prerequisites

Before running the E2E tests, ensure:

1. **MongoDB is running** (locally or via Docker)
2. **Seed data is loaded** with test users:
   ```bash
   npm run seed
   ```
3. **Environment variables are configured** in `.env` file

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only budget E2E tests
npm run test:e2e -- budget-projects.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- budget-projects.e2e-spec.ts --verbose
```

## Test Suites

### 1. E2E Test 1: Project Creation Flow

**Purpose**: Validates the complete project creation workflow

**Steps**:
1. Create a new budget project with RSAF template
2. Verify plan rows are automatically generated
3. Enter planned amounts for budget rows
4. Verify totals are calculated correctly

**Validates Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.4

**Expected Behavior**:
- Project is created with correct template type
- Plan rows generated for all term × aircraft combinations
- Planned amounts are persisted
- Grand totals reflect entered amounts

### 2. E2E Test 2: Data Entry Flow

**Purpose**: Validates inline editing and data persistence

**Steps**:
1. Open existing project
2. Edit a cell (enter actual spend)
3. Save the change
4. Verify totals update immediately
5. Refresh the page
6. Verify data persisted correctly

**Validates Requirements**: 2.1, 2.3, 2.4, 2.5, 2.6, 4.1, 4.4

**Expected Behavior**:
- Cell edits save successfully
- Row totals and column totals update
- Grand total reflects changes
- Data persists across page refreshes

### 3. E2E Test 3: Analytics Flow

**Purpose**: Validates analytics calculations and filtering

**Steps**:
1. Enter actual spend data for multiple months
2. Navigate to Analytics tab
3. Verify KPIs are calculated correctly
4. Apply date range filters
5. Verify charts update with filtered data

**Validates Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.10

**Expected Behavior**:
- KPIs show correct values (total spent, burn rate, etc.)
- Filters apply to all analytics
- Chart data reflects filtered results
- Cumulative spend calculations are accurate

### 4. E2E Test 4: Export Flow

**Purpose**: Validates Excel and PDF export functionality

**Steps**:
1. Create project with data
2. Export to Excel
3. Verify file download and format
4. Verify PDF data endpoints are accessible

**Validates Requirements**: 7.5, 7.6, 7.7, 6.1, 6.2

**Expected Behavior**:
- Excel file downloads with correct MIME type
- File contains all project data
- PDF data endpoints return complete data
- Charts are accessible for PDF generation

## Additional Integration Tests

### Audit Trail Test

**Purpose**: Validates audit logging functionality

**Validates Requirements**: 8.1, 8.2, 8.4

**Expected Behavior**:
- All changes are logged
- Audit entries contain user ID, timestamp, action
- Entries are sorted by timestamp (newest first)

### Authorization Test

**Purpose**: Validates role-based access control

**Validates Requirements**: 13.2, 13.5

**Expected Behavior**:
- Editor role cannot delete projects
- Admin role required for delete operations
- 403 Forbidden returned for insufficient permissions

### Input Validation Test

**Purpose**: Validates input validation rules

**Validates Requirements**: 14.1, 14.2, 14.5

**Expected Behavior**:
- Missing required fields rejected with 400
- Negative amounts rejected
- Validation errors include field details

### Filter Test

**Purpose**: Validates year filter on project list

**Validates Requirements**: 9.2

**Expected Behavior**:
- Year filter returns only matching projects
- Date range overlap logic works correctly

### Totals Calculation Test

**Purpose**: Validates all total calculations

**Validates Requirements**: 2.6, 3.4, 3.5

**Expected Behavior**:
- Row totals = sum of monthly actuals
- Column totals = sum of all terms for that month
- Grand total = sum of all row totals

## Test Data

The tests use the following test data:

- **Project Name**: "E2E Test Project 2025"
- **Template**: RSAF
- **Date Range**: 2025-01-01 to 2025-12-31
- **Currency**: USD
- **Aircraft Scope**: A330 aircraft type
- **Test Users**:
  - Admin: admin@alphastarav.com / Admin@123!
  - Editor: editor@alphastarav.com / Editor@123!

## Cleanup

The tests automatically clean up test data in the `afterAll` hook:

```typescript
await connection.collection('budgetprojects').deleteMany({
  name: /E2E Test/,
});
await connection.collection('budgetplanrows').deleteMany({});
await connection.collection('budgetactuals').deleteMany({});
await connection.collection('budgetauditlog').deleteMany({});
```

## Troubleshooting

### Tests Fail with 404 Errors

**Issue**: Budget endpoints return 404

**Solution**: Ensure BudgetProjectsModule is registered in AppModule:
```typescript
@Module({
  imports: [
    // ...
    BudgetProjectsModule,
    // ...
  ],
})
export class AppModule {}
```

### Tests Fail with Authentication Errors

**Issue**: Login returns 401 or token is invalid

**Solution**: 
1. Run seed script to create test users
2. Verify MongoDB is running
3. Check JWT_SECRET in .env file

### Tests Timeout

**Issue**: Tests exceed timeout limit

**Solution**: Increase timeout in test file:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Database Connection Errors

**Issue**: Cannot connect to MongoDB

**Solution**:
1. Start MongoDB: `docker-compose up -d mongodb`
2. Verify MONGODB_URI in .env
3. Check MongoDB is accessible on port 27017

## Performance Considerations

- Tests use real database (not mocked)
- Each test suite creates and cleans up data
- Total execution time: ~10-15 seconds
- Tests run sequentially to avoid conflicts

## Coverage

These E2E tests provide coverage for:

- ✅ Project CRUD operations
- ✅ Plan row generation
- ✅ Inline data entry
- ✅ Total calculations (row, column, grand)
- ✅ Analytics KPIs
- ✅ Chart data endpoints
- ✅ Excel export
- ✅ Audit trail
- ✅ Authorization
- ✅ Input validation
- ✅ Filtering

## Future Enhancements

Potential additions to the E2E test suite:

1. **Excel Import Test**: Upload Excel file and verify data import
2. **Concurrent Edit Test**: Multiple users editing same project
3. **Large Dataset Test**: Project with 1000+ rows
4. **Performance Test**: Measure response times under load
5. **PDF Generation Test**: Full PDF export validation (requires headless browser)

## Related Documentation

- [Requirements Document](../../.kiro/specs/budget-cost-revamp/requirements.md)
- [Design Document](../../.kiro/specs/budget-cost-revamp/design.md)
- [Tasks Document](../../.kiro/specs/budget-cost-revamp/tasks.md)
- [Implementation Summary](../../backend/src/budget-projects/IMPLEMENTATION-SUMMARY.md)

## Notes

- All subtasks in Task 25 are marked as optional (`*`)
- Tests are provided for reference and future validation
- Manual testing may be preferred for MVP delivery
- Tests can be run selectively as needed during development
