# Budget Projects Utilities

This directory contains utility functions for budget project operations, including template validation for Excel imports.

## Template Validator

The template validator provides comprehensive validation for Excel files against budget template structures.

### Features

- **Structure Validation**: Validates Excel file structure against template definitions
- **Column Validation**: Ensures required columns (term, planned, actual) are present
- **Data Type Validation**: Validates numeric values, dates, and text fields
- **Spending Term Matching**: Matches Excel terms against template taxonomy
- **RSAF Template Support**: Specialized validation for RSAF template structure
- **Detailed Error Reporting**: Provides specific error messages with cell locations

### Usage

#### Basic Template Validation

```typescript
import { validateTemplateStructure } from './utils/template-validator';
import { RSAF_TEMPLATE } from './templates/spending-terms.registry';

const data: ExcelData = {
  headers: {
    D: 'Clause Description',
    E: 'A330',
    F: 'G650ER-1',
    // ... more headers
  },
  rows: [
    {
      rowNumber: 4,
      cells: {
        D: 'Off Base Maintenance International - Scheduled',
        E: 100000,
        F: 50000,
      },
    },
  ],
};

const result = validateTemplateStructure(data, RSAF_TEMPLATE);

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Validation warnings:', result.warnings);
}
```

#### RSAF Template Validation

```typescript
import { validateRSAFTemplateStructure } from './utils/template-validator';

const result = validateRSAFTemplateStructure(data, RSAF_TEMPLATE);
```

#### Column Validation

```typescript
import { validateRequiredColumns } from './utils/template-validator';

const headers = {
  D: 'Clause Description',
  E: 'A330',
  // ... more headers
};

const missingColumns = validateRequiredColumns(headers, RSAF_TEMPLATE);

if (missingColumns.length > 0) {
  console.error('Missing columns:', missingColumns);
}
```

#### Cell Value Validation

```typescript
import { validateCellValue } from './utils/template-validator';

const error = validateCellValue(1000, 'number', 'E4');

if (error) {
  console.error('Invalid cell value:', error.message);
}
```

#### Spending Term Matching

```typescript
import { validateSpendingTerms } from './utils/template-validator';

const excelTerms = [
  'Off Base Maintenance International - Scheduled',
  'Scheduled Maintenance - A Check',
];

const templateTerms = RSAF_TEMPLATE.spendingTerms.map((t) => t.name);

const result = validateSpendingTerms(excelTerms, templateTerms);

console.log('Matched terms:', result.matched);
console.log('Unmatched terms:', result.unmatched);
console.log('Missing terms:', result.missing);
```

#### Date Format Validation

```typescript
import { validateDateFormat } from './utils/template-validator';

const error = validateDateFormat('2025-01', 'O4');

if (error) {
  console.error('Invalid date format:', error.message);
}
```

### Validation Result Structure

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'missing_column' | 'invalid_header' | 'invalid_structure' | 'missing_data' | 'invalid_value';
  message: string;
  location?: string; // e.g., "Row 5, Column D"
  expected?: string;
  actual?: string;
}

interface ValidationWarning {
  type: 'empty_cell' | 'unexpected_format' | 'data_quality';
  message: string;
  location?: string;
}
```

### Excel Data Structure

```typescript
interface ExcelData {
  headers: Record<string, string>; // Column letter -> header value
  rows: ExcelRow[];
  metadata?: {
    sheetName?: string;
    rowCount?: number;
    columnCount?: number;
  };
}

interface ExcelRow {
  rowNumber: number;
  cells: Record<string, any>; // Column letter -> cell value
}
```

### RSAF Template Structure

The RSAF template has the following structure:

- **Header Row**: Row 3
- **Term Column**: Column D (Clause Description)
- **Planned Columns**: Columns E, F, G, H (A330, G650ER-1, G650ER-2, PMO)
- **Actual Columns**: Columns O-AX (36 months, 3 years)

### Validation Rules

#### Required Validations (Errors)

1. **Header Row**: Must exist and not be empty
2. **Term Column**: Must exist at specified position (Column D)
3. **Data Rows**: At least one data row must exist
4. **Numeric Values**: Amount columns must contain numeric values
5. **Non-Negative**: Amount values must be >= 0
6. **Template Type**: Must match expected template type

#### Optional Validations (Warnings)

1. **Empty Term Cells**: Some term cells are empty
2. **Missing Planned Columns**: Some planned columns not found
3. **Missing Actual Columns**: Many actual columns missing (>50%)
4. **Unexpected Headers**: Column headers don't match expected format

### Supported Date Formats

The validator supports the following date formats:

- `YYYY-MM` (e.g., "2025-01")
- `MM/YYYY` (e.g., "01/2025")
- Excel date serial numbers (e.g., 44927)
- ISO date strings (e.g., "2025-01-15")

### Error Handling

The validator provides detailed error messages with:

- **Error Type**: Category of the error
- **Message**: Human-readable description
- **Location**: Cell or column location (e.g., "Row 5, Column D")
- **Expected**: What was expected
- **Actual**: What was found

### Integration with Budget Import Service

The template validator is integrated with the `BudgetImportService`:

```typescript
import { BudgetImportService } from './services/budget-import.service';

const importService = new BudgetImportService(templatesService);

try {
  const result = await importService.validateExcelStructure(data, 'RSAF');
  console.log('Validation successful');
} catch (error) {
  // BadRequestException with detailed errors
  console.error('Validation failed:', error.response);
}
```

### Testing

The template validator includes comprehensive unit tests:

```bash
npm test -- template-validator.spec.ts
```

Test coverage includes:

- Valid template structure validation
- Missing header/column detection
- Invalid data type detection
- Negative value detection
- Empty cell handling
- Spending term matching
- Date format validation
- RSAF-specific validation

### Requirements Validation

This implementation validates the following requirements:

- **Requirement 7.2**: Excel file structure validation against template
- **Requirement 11.6**: Template structure validation

### Future Enhancements

Potential future enhancements:

1. **Custom Template Support**: Validation for additional template types
2. **Formula Validation**: Support for Excel formulas in cells
3. **Conditional Validation**: Rules based on cell dependencies
4. **Batch Validation**: Validate multiple sheets at once
5. **Performance Optimization**: Streaming validation for large files

## Related Files

- `template-validator.ts` - Main validation utilities
- `template-validator.spec.ts` - Unit tests
- `../templates/spending-terms.registry.ts` - Template definitions
- `../services/budget-import.service.ts` - Import service integration
