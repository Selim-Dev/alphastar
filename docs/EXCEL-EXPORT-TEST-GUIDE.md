# Excel Export Test Guide

## Task 18.2: Test Excel Export with Filtered Data

This guide provides manual testing steps to verify Requirements 7.5, 7.6, 7.7, 7.8.

---

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Frontend running on `http://localhost:5173`
3. MongoDB running with test data
4. User account with Editor or Admin role

---

## Test 1: Basic Excel Export

### Steps:
1. Log in to the application
2. Navigate to **Budget Projects** page
3. Open an existing project or create a new one:
   - Name: "Excel Export Test"
   - Template: RSAF
   - Date Range: Jan 1, 2025 - Dec 31, 2025
   - Aircraft Scope: A330, G650ER
4. Add some sample data:
   - Enter planned amounts for 5-10 spending terms
   - Enter actual amounts for 2-3 months
5. Click the **"Export to Excel"** button in the header
6. Wait for the download to complete

### Expected Results:
- ✅ Button shows loading state during export
- ✅ Excel file downloads automatically
- ✅ Filename format: `{project-name}_{date}.xlsx`
- ✅ File size > 0 bytes

---

## Test 2: Verify Excel File Structure

### Steps:
1. Open the downloaded Excel file in Microsoft Excel or LibreOffice
2. Check the worksheet structure

### Expected Results:
- ✅ **Row 1**: Title "RSAF Budget Template"
- ✅ **Row 2**: Project name
- ✅ **Row 3**: Column headers
  - Column C: "#"
  - Column D: "Clause Description"
  - Column E: "A330 Total"
  - Column F: "G650ER-1 Total"
  - Column G: "G650ER-2 Total"
  - Column H: "PMO Total"
  - Column I: "Total Budgeted"
  - Column K: "Total Budget Spent"
  - Column M: "Remaining Total Budget"
- ✅ **Row 4**: Month headers (Jan 2025, Feb 2025, etc.)
- ✅ **Row 5+**: Data rows with spending terms
- ✅ **Last Row**: TOTAL row with sum formulas

---

## Test 3: Verify Data Completeness (Requirement 7.6)

### Steps:
1. In the application, note the number of spending terms with data
2. In the application, note the planned amounts and actual amounts
3. Open the Excel file
4. Count the number of data rows (excluding header and total)
5. Compare planned amounts in Excel with application
6. Compare actual amounts in Excel with application

### Expected Results:
- ✅ Number of Excel rows matches number of terms in application
- ✅ All planned amounts are present and correct
- ✅ All actual amounts are present and correct
- ✅ No data is missing or truncated
- ✅ Totals match between Excel and application

---

## Test 4: Verify Number Formatting (Requirement 7.7)

### Steps:
1. Open the Excel file
2. Click on cells with numeric values (E5, F5, I5, K5, M5)
3. Check the cell format in Excel

### Expected Results:
- ✅ Currency values display with comma separators (e.g., 10,000.00)
- ✅ Number format is set to `#,##0.00`
- ✅ Negative values (if any) display correctly
- ✅ Zero values display as 0.00 or blank (depending on template)

---

## Test 5: Verify Excel Formulas

### Steps:
1. Open the Excel file
2. Click on cell I5 (Total Budgeted for first term)
3. Check the formula bar - should show: `=E5+F5+G5+H5`
4. Click on cell K5 (Total Spent for first term)
5. Check the formula bar - should show: `=SUM(O5:AX5)` or similar
6. Click on cell M5 (Remaining for first term)
7. Check the formula bar - should show: `=I5-K5`
8. Click on cell I{last} (Total Budgeted in TOTAL row)
9. Check the formula bar - should show: `=SUM(I5:I{n})`

### Expected Results:
- ✅ Total Budgeted uses addition formula
- ✅ Total Spent uses SUM formula
- ✅ Remaining uses subtraction formula
- ✅ TOTAL row uses SUM formulas
- ✅ All formulas calculate correctly

---

## Test 6: Verify Column Widths and Styling

### Steps:
1. Open the Excel file
2. Check column widths
3. Check if text is readable without scrolling

### Expected Results:
- ✅ Column C (clause number): ~5 characters wide
- ✅ Column D (description): ~40 characters wide
- ✅ Numeric columns: ~15 characters wide
- ✅ All text is visible without truncation
- ✅ Headers are bold (if styling is applied)

---

## Test 7: Test Export with Different Data Scenarios

### Scenario A: Empty Project
1. Create a new project without any data
2. Export to Excel
3. Verify: Excel contains all spending terms with zero values

### Scenario B: Partial Data
1. Create a project with only planned amounts (no actuals)
2. Export to Excel
3. Verify: Planned amounts are present, actual columns are empty or zero

### Scenario C: Large Dataset
1. Create a project with data for all 12 months
2. Export to Excel
3. Verify: All 12 months are included, file opens without errors

### Expected Results:
- ✅ All scenarios export successfully
- ✅ No errors or crashes
- ✅ Data integrity maintained in all cases

---

## Test 8: Test Export with Filters (Requirement 7.8)

**Note**: This test is for the POST endpoint with filters (optional feature).

### Steps:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this JavaScript code:

```javascript
const projectId = 'YOUR_PROJECT_ID'; // Replace with actual ID
const token = localStorage.getItem('token');

fetch(`/api/budget-import-export/export/${projectId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    aircraftTypes: ['A330'],
    dateRange: {
      start: '2025-01-01',
      end: '2025-03-31',
    },
  }),
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-export.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
});
```

4. Open the downloaded file

### Expected Results:
- ✅ Export includes only A330 data (if filter is implemented)
- ✅ Export includes only Jan-Mar 2025 data (if filter is implemented)
- ✅ OR: Endpoint returns 404/501 if not yet implemented (acceptable)

---

## Test 9: Error Handling

### Test 9A: Export Non-Existent Project
1. Try to export a project with invalid ID
2. Expected: Error message displayed, no file downloaded

### Test 9B: Export Without Authentication
1. Log out
2. Try to access export URL directly
3. Expected: 401 Unauthorized error

### Test 9C: Export with Network Error
1. Stop the backend server
2. Try to export
3. Expected: Error message displayed with retry option

### Expected Results:
- ✅ All error cases handled gracefully
- ✅ User-friendly error messages displayed
- ✅ No browser crashes or unhandled exceptions

---

## Test 10: Cross-Browser Compatibility

### Steps:
1. Test export in Chrome
2. Test export in Firefox
3. Test export in Edge
4. Test export in Safari (if available)

### Expected Results:
- ✅ Export works in all browsers
- ✅ File downloads correctly in all browsers
- ✅ Excel file opens correctly regardless of browser used

---

## Test 11: Round-Trip Test (Import → Export)

### Steps:
1. Export a project to Excel
2. Make a small change to the Excel file (e.g., change a planned amount)
3. Import the modified Excel file back into the project
4. Export again
5. Compare the two Excel files

### Expected Results:
- ✅ Import succeeds without errors
- ✅ Changes are reflected in the application
- ✅ Second export includes the changes
- ✅ File structure remains consistent

---

## Acceptance Criteria Checklist

Based on Requirements 7.5, 7.6, 7.7, 7.8:

- [ ] **7.5**: Export generates Excel file matching template format
- [ ] **7.6**: Export includes spending terms, planned amounts, monthly actuals, and totals
- [ ] **7.7**: Export preserves currency formatting and number formats
- [ ] **7.8**: Export supports filtered data (or gracefully indicates not implemented)

---

## Automated Test Script

For automated testing, run:

```bash
# Install dependencies
npm install xlsx

# Set your JWT token
export TEST_TOKEN="your_jwt_token_here"

# Run the test script
node test-excel-export.js
```

The script will:
1. Create a test project
2. Add sample data
3. Export to Excel
4. Verify file structure
5. Verify data completeness
6. Verify formatting
7. Clean up test data

---

## Troubleshooting

### Issue: Export button doesn't work
- Check browser console for errors
- Verify backend is running
- Check authentication token is valid

### Issue: Excel file is corrupted
- Check backend logs for errors
- Verify XLSX library is installed: `npm list xlsx`
- Try exporting a smaller project

### Issue: Formulas don't calculate
- Open Excel file
- Press Ctrl+Alt+F9 to force recalculation
- Check if formulas are stored as text (look for leading apostrophe)

### Issue: Missing data in export
- Check backend logs for aggregation errors
- Verify MongoDB connection
- Check if data exists in database using MongoDB Compass

---

## Success Criteria

Task 18.2 is complete when:

1. ✅ Export button works on project detail page
2. ✅ Excel file downloads with correct filename
3. ✅ File structure matches RSAF template
4. ✅ All data is included (no missing rows or columns)
5. ✅ Number formatting is preserved
6. ✅ Formulas calculate correctly
7. ✅ Export works with different data scenarios
8. ✅ Error handling works correctly
9. ✅ Cross-browser compatibility verified

---

## Notes

- The export service is implemented in `backend/src/budget-projects/services/budget-export.service.ts`
- The export controller is in `backend/src/budget-projects/controllers/budget-import-export.controller.ts`
- The frontend handler is in `frontend/src/pages/budget/BudgetProjectDetailPage.tsx`
- Filtered export (POST endpoint) is optional and may not be fully implemented yet
