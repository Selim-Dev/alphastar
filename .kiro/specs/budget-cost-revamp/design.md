# Design Document: Budget & Cost Revamp

## Overview

The Budget & Cost Revamp feature introduces a modern, template-driven budgeting system for the Alpha Star Aviation KPIs Dashboard. The design emphasizes simplicity, speed, and independence from other modules while providing comprehensive analytics and professional reporting capabilities.

### Key Design Principles

1. **Self-Contained Architecture**: Budget calculations are completely independent, using only Aircraft master data for scope selection
2. **Template-Driven Flexibility**: Support multiple budget template types with different spending term taxonomies
3. **Manager-First UX**: Spreadsheet-like interface with inline editing, sticky headers, and instant feedback
4. **Performance-Optimized**: Fast data entry, real-time calculations, and responsive analytics
5. **Professional Output**: High-quality PDF exports suitable for client presentations

### Technology Stack

- **Backend**: NestJS modules with controller → service → repository pattern
- **Frontend**: React with TypeScript, TanStack Query for state management
- **Database**: MongoDB with Mongoose ODM
- **Charts**: Recharts (consistent with existing AOG Analytics)
- **PDF Export**: Client-side generation using jsPDF + html2canvas
- **Excel Processing**: xlsx library for import/export

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Budget Projects List Page                                   │
│  Budget Project Detail Page (Table View)                     │
│  Budget Analytics Page                                       │
│  Budget Import/Export Components                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (NestJS)                           │
├─────────────────────────────────────────────────────────────┤
│  Budget Projects Module                                      │
│  ├─ BudgetProjectsController                                │
│  ├─ BudgetProjectsService                                   │
│  └─ BudgetProjectsRepository                                │
│                                                              │
│  Budget Templates Module                                     │
│  ├─ BudgetTemplatesService                                  │
│  └─ SpendingTermsRegistry                                   │
│                                                              │
│  Budget Analytics Module                                     │
│  ├─ BudgetAnalyticsController                               │
│  └─ BudgetAnalyticsService                                  │
│                                                              │
│  Budget Import/Export Module                                 │
│  ├─ BudgetImportService                                     │
│  └─ BudgetExportService                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (MongoDB)                         │
├─────────────────────────────────────────────────────────────┤
│  budgetprojects                                              │
│  budgetplanrows                                              │
│  budgetactuals                                               │
│  budgetauditlog                                              │
│  aircraft (reference only)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Module Boundaries

**Budget Projects Module**: Manages project lifecycle (CRUD operations)
**Budget Templates Module**: Provides template definitions and spending terms
**Budget Analytics Module**: Computes KPIs, aggregations, and chart data
**Budget Import/Export Module**: Handles Excel and PDF generation

### Data Flow

1. **Project Creation**: User selects template → System loads spending terms → User defines scope → System generates plan rows
2. **Data Entry**: User edits cell → Frontend validates → API persists → System recalculates totals → Frontend updates display
3. **Analytics**: User applies filters → Frontend requests aggregated data → Backend computes metrics → Frontend renders charts
4. **PDF Export**: User clicks export → Frontend captures charts → Client generates PDF → User downloads file

## Components and Interfaces

### Backend Components

#### 1. Budget Projects Controller

```typescript
@Controller('api/budget-projects')
export class BudgetProjectsController {
  @Post()
  @Roles('Editor', 'Admin')
  async create(@Body() dto: CreateBudgetProjectDto): Promise<BudgetProject>;

  @Get()
  async findAll(@Query() filters: BudgetProjectFiltersDto): Promise<BudgetProject[]>;

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BudgetProjectDetail>;

  @Put(':id')
  @Roles('Editor', 'Admin')
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetProjectDto): Promise<BudgetProject>;

  @Delete(':id')
  @Roles('Admin')
  async delete(@Param('id') id: string): Promise<void>;

  @Get(':id/table-data')
  async getTableData(@Param('id') id: string): Promise<BudgetTableData>;

  @Patch(':id/plan-row/:rowId')
  @Roles('Editor', 'Admin')
  async updatePlanRow(@Param('id') id: string, @Param('rowId') rowId: string, @Body() dto: UpdatePlanRowDto): Promise<void>;

  @Patch(':id/actual/:period')
  @Roles('Editor', 'Admin')
  async updateActual(@Param('id') id: string, @Param('period') period: string, @Body() dto: UpdateActualDto): Promise<void>;
}
```

#### 2. Budget Projects Service

```typescript
export class BudgetProjectsService {
  async create(dto: CreateBudgetProjectDto, userId: string): Promise<BudgetProject>;
  async findAll(filters: BudgetProjectFiltersDto): Promise<BudgetProject[]>;
  async findOne(id: string): Promise<BudgetProjectDetail>;
  async update(id: string, dto: UpdateBudgetProjectDto, userId: string): Promise<BudgetProject>;
  async delete(id: string): Promise<void>;
  
  // Table data operations
  async getTableData(projectId: string): Promise<BudgetTableData>;
  async updatePlanRow(projectId: string, rowId: string, plannedAmount: number, userId: string): Promise<void>;
  async updateActual(projectId: string, termId: string, period: string, amount: number, userId: string): Promise<void>;
  
  // Calculation methods
  async recalculateTotals(projectId: string): Promise<BudgetTotals>;
  async calculateBurnRate(projectId: string): Promise<number>;
  async calculateForecast(projectId: string): Promise<ForecastData>;
}
```

#### 3. Budget Analytics Service

```typescript
export class BudgetAnalyticsService {
  async getKPIs(projectId: string, filters: AnalyticsFiltersDto): Promise<BudgetKPIs>;
  async getMonthlySpendByTerm(projectId: string, filters: AnalyticsFiltersDto): Promise<MonthlySpendData[]>;
  async getCumulativeSpendVsBudget(projectId: string): Promise<CumulativeData[]>;
  async getSpendDistribution(projectId: string, filters: AnalyticsFiltersDto): Promise<DistributionData[]>;
  async getBudgetedVsSpentByAircraftType(projectId: string): Promise<AircraftTypeData[]>;
  async getTop5OverspendTerms(projectId: string): Promise<OverspendTerm[]>;
  async getSpendingHeatmap(projectId: string): Promise<HeatmapData>;
}
```

#### 4. Budget Templates Service

```typescript
export class BudgetTemplatesService {
  getTemplate(templateType: string): BudgetTemplate;
  getSpendingTerms(templateType: string): SpendingTerm[];
  validateTemplateStructure(data: any, templateType: string): ValidationResult;
}
```

### Frontend Components

#### 1. Budget Projects List Page

```typescript
// Location: frontend/src/pages/budget/BudgetProjectsListPage.tsx
export function BudgetProjectsListPage() {
  // Features:
  // - Year filter dropdown
  // - Create new project button
  // - Projects table with: name, template, date range, budgeted, spent, status
  // - Click row to navigate to detail page
}
```

#### 2. Budget Project Detail Page

```typescript
// Location: frontend/src/pages/budget/BudgetProjectDetailPage.tsx
export function BudgetProjectDetailPage() {
  // Features:
  // - Sticky KPI cards: Total Budgeted, Total Spent, Remaining, Burn Rate
  // - Tabs: Table View, Analytics, Audit Log
  // - Table View: Spending terms × months grid with inline editing
  // - Row and column totals
  // - Export to Excel button
}
```

#### 3. Budget Analytics Page

```typescript
// Location: frontend/src/pages/budget/BudgetAnalyticsPage.tsx
export function BudgetAnalyticsPage() {
  // Features:
  // - Filter panel: date range, aircraft type, intl/domestic, term search
  // - KPI cards: 6 metrics
  // - Charts: 6+ visualizations
  // - Export to PDF button
}
```

#### 4. Budget Table Component

```typescript
// Location: frontend/src/components/budget/BudgetTable.tsx
export function BudgetTable({ projectId }: { projectId: string }) {
  // Features:
  // - Editable cells with inline validation
  // - Sticky headers (term names, month columns)
  // - Row totals (sum of actuals)
  // - Column totals (sum of terms)
  // - Loading states and error handling
  // - Optimistic updates with rollback on error
}
```

#### 5. Budget Analytics Charts

```typescript
// Location: frontend/src/components/budget/charts/
// - MonthlySpendByTermChart.tsx (stacked bar)
// - CumulativeSpendChart.tsx (line chart with target)
// - SpendDistributionChart.tsx (donut/pie)
// - BudgetedVsSpentChart.tsx (grouped bar)
// - Top5OverspendList.tsx (ranked list with bars)
// - SpendingHeatmap.tsx (optional grid heatmap)
```

#### 6. Budget PDF Export Component

```typescript
// Location: frontend/src/components/budget/BudgetPDFExport.tsx
export function BudgetPDFExport({ projectId, filters }: Props) {
  // Features:
  // - Multi-page PDF generation
  // - Report header with metadata
  // - KPI summary section
  // - Charts section (high-res captures)
  // - Tables section (top overspends)
  // - Loading indicator during generation
}
```

### Custom Hooks

```typescript
// Location: frontend/src/hooks/useBudgetProjects.ts
export function useBudgetProjects() {
  const useProjects = (filters?: BudgetProjectFiltersDto) => useQuery(...);
  const useProject = (id: string) => useQuery(...);
  const useCreateProject = () => useMutation(...);
  const useUpdateProject = () => useMutation(...);
  const useDeleteProject = () => useMutation(...);
  const useTableData = (projectId: string) => useQuery(...);
  const useUpdatePlanRow = () => useMutation(...);
  const useUpdateActual = () => useMutation(...);
  return { useProjects, useProject, useCreateProject, ... };
}

// Location: frontend/src/hooks/useBudgetAnalytics.ts
export function useBudgetAnalytics(projectId: string) {
  const useKPIs = (filters?: AnalyticsFiltersDto) => useQuery(...);
  const useMonthlySpend = (filters?: AnalyticsFiltersDto) => useQuery(...);
  const useCumulativeSpend = () => useQuery(...);
  const useSpendDistribution = (filters?: AnalyticsFiltersDto) => useQuery(...);
  const useBudgetedVsSpent = () => useQuery(...);
  const useTop5Overspend = () => useQuery(...);
  const useHeatmap = () => useQuery(...);
  return { useKPIs, useMonthlySpend, ... };
}
```

## Data Models

### 1. Budget Project

**Collection**: `budgetprojects`

```typescript
interface BudgetProject {
  _id: ObjectId;
  name: string;                    // e.g., "RSAF FY2025 Budget"
  templateType: string;            // e.g., "RSAF"
  dateRange: {
    start: Date;                   // e.g., 2025-01-01
    end: Date;                     // e.g., 2025-12-31
  };
  currency: string;                // e.g., "USD"
  aircraftScope: {
    type: 'individual' | 'type' | 'group';
    aircraftIds?: ObjectId[];      // For individual aircraft
    aircraftTypes?: string[];      // For aircraft types (e.g., ["A330", "G650ER"])
    fleetGroups?: string[];        // For fleet groups
  };
  status: 'draft' | 'active' | 'closed';
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ name: 1 }` - unique
- `{ templateType: 1, status: 1 }`
- `{ 'dateRange.start': 1, 'dateRange.end': 1 }`

### 2. Budget Plan Row

**Collection**: `budgetplanrows`

```typescript
interface BudgetPlanRow {
  _id: ObjectId;
  projectId: ObjectId;             // Reference to BudgetProject
  termId: string;                  // Spending term ID (e.g., "off-base-maint-intl")
  termName: string;                // Display name
  termCategory: string;            // Category grouping
  aircraftId?: ObjectId;           // Optional: specific aircraft
  aircraftType?: string;           // Optional: aircraft type
  plannedAmount: number;           // Budgeted amount
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ projectId: 1, termId: 1, aircraftId: 1 }` - unique compound
- `{ projectId: 1 }`
- `{ termId: 1 }`

### 3. Budget Actual

**Collection**: `budgetactuals`

```typescript
interface BudgetActual {
  _id: ObjectId;
  projectId: ObjectId;             // Reference to BudgetProject
  termId: string;                  // Spending term ID
  period: string;                  // YYYY-MM format
  aircraftId?: ObjectId;           // Optional: specific aircraft
  aircraftType?: string;           // Optional: aircraft type
  amount: number;                  // Actual spend amount
  notes?: string;                  // Optional notes
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ projectId: 1, termId: 1, period: 1 }` - compound for aggregation
- `{ projectId: 1, period: 1 }`
- `{ period: 1 }`

### 4. Budget Audit Log

**Collection**: `budgetauditlog`

```typescript
interface BudgetAuditEntry {
  _id: ObjectId;
  projectId: ObjectId;
  entityType: 'project' | 'planRow' | 'actual';
  entityId: ObjectId;
  action: 'create' | 'update' | 'delete';
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  userId: ObjectId;
  timestamp: Date;
}
```

**Indexes**:
- `{ projectId: 1, timestamp: -1 }`
- `{ userId: 1, timestamp: -1 }`
- `{ entityType: 1, entityId: 1 }`

### 5. Spending Term Definition

**In-Memory Structure** (not stored in DB, defined in code):

```typescript
interface SpendingTerm {
  id: string;                      // e.g., "off-base-maint-intl"
  name: string;                    // e.g., "Off Base Maintenance International"
  category: string;                // e.g., "Maintenance"
  description?: string;
  sortOrder: number;
}

interface BudgetTemplate {
  type: string;                    // e.g., "RSAF"
  name: string;                    // e.g., "RSAF Budget Template"
  spendingTerms: SpendingTerm[];
  excelStructure: {
    headerRow: number;
    termColumn: string;
    plannedColumns: string[];
    actualColumns: string[];
  };
}
```

### 6. Computed Data Structures

**Budget Table Data** (computed on-demand):

```typescript
interface BudgetTableData {
  projectId: string;
  periods: string[];               // ["2025-01", "2025-02", ...]
  rows: BudgetTableRow[];
  columnTotals: Record<string, number>;  // { "2025-01": 50000, ... }
  grandTotal: {
    budgeted: number;
    spent: number;
    remaining: number;
  };
}

interface BudgetTableRow {
  termId: string;
  termName: string;
  termCategory: string;
  aircraftId?: string;
  aircraftType?: string;
  plannedAmount: number;
  actuals: Record<string, number>; // { "2025-01": 5000, "2025-02": 4500, ... }
  totalSpent: number;
  remaining: number;
  variance: number;                // Planned - Spent
  variancePercent: number;         // (Variance / Planned) * 100
}
```

**Budget KPIs** (computed on-demand):

```typescript
interface BudgetKPIs {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;       // (Spent / Budgeted) * 100
  burnRate: number;                // Spent / Months with data
  averageMonthlySpend: number;
  forecastMonthsRemaining: number; // Remaining / Burn rate
  forecastDepletionDate: Date | null;
}
```

## Data Flow Examples

### Example 1: Creating a Budget Project

```
1. User fills form: name="RSAF FY2025", template="RSAF", 
   dateRange={start: 2025-01-01, end: 2025-12-31}, 
   aircraftScope={type: 'type', aircraftTypes: ['A330', 'G650ER']}

2. Frontend validates and sends POST /api/budget-projects

3. Backend BudgetProjectsService:
   a. Creates BudgetProject document
   b. Loads RSAF spending terms (60+ terms)
   c. For each term × aircraft type combination:
      - Creates BudgetPlanRow with plannedAmount=0
   d. Returns created project

4. Frontend navigates to project detail page
```

### Example 2: Inline Cell Edit

```
1. User clicks cell for term="Off Base Maint Intl", period="2025-01"
2. User types "15000" and presses Enter

3. Frontend:
   a. Validates input (non-negative number)
   b. Optimistically updates UI
   c. Sends PATCH /api/budget-projects/:id/actual/2025-01
      Body: { termId: "off-base-maint-intl", amount: 15000 }

4. Backend:
   a. Finds or creates BudgetActual document
   b. Updates amount field
   c. Records audit log entry
   d. Returns success

5. Frontend:
   a. Confirms optimistic update
   b. Invalidates queries to refresh totals
   c. Shows success toast
```

### Example 3: Analytics KPI Calculation

```
1. User opens Analytics tab

2. Frontend sends GET /api/budget-analytics/:id/kpis

3. Backend BudgetAnalyticsService:
   a. Aggregates all BudgetPlanRows for project:
      totalBudgeted = SUM(plannedAmount)
   
   b. Aggregates all BudgetActuals for project:
      totalSpent = SUM(amount)
   
   c. Calculates derived metrics:
      remainingBudget = totalBudgeted - totalSpent
      budgetUtilization = (totalSpent / totalBudgeted) * 100
   
   d. Calculates burn rate:
      periodsWithData = COUNT(DISTINCT period FROM BudgetActuals)
      burnRate = totalSpent / periodsWithData
   
   e. Calculates forecast:
      forecastMonthsRemaining = remainingBudget / burnRate
      forecastDepletionDate = currentDate + forecastMonthsRemaining months
   
   f. Returns BudgetKPIs object

4. Frontend displays KPI cards with values
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Template Loading Consistency

*For any* budget template type, loading the template SHALL return the same set of spending terms on every invocation.

**Validates: Requirements 1.2**

### Property 2: Required Field Validation

*For any* budget project creation request missing required fields (name, template type, date range, currency, or aircraft scope), the system SHALL reject the request with a validation error.

**Validates: Requirements 1.1, 1.3, 14.5**

### Property 3: Plan Row Generation Completeness

*For any* valid budget project with N spending terms and M aircraft in scope, the system SHALL generate exactly N × M budget plan rows.

**Validates: Requirements 1.5**

### Property 4: Project Round-Trip Consistency

*For any* budget project, creating the project then retrieving it SHALL return a project with the same template type, date range, currency, and aircraft scope.

**Validates: Requirements 1.6**

### Property 5: Table Structure Consistency

*For any* budget project, the table data response SHALL contain rows for all spending terms and columns for all months in the project's date range.

**Validates: Requirements 2.1**

### Property 6: Non-Negative Amount Validation

*For any* actual spend or planned amount input that is negative or non-numeric, the system SHALL reject the input with a validation error.

**Validates: Requirements 2.4, 14.1, 14.2**

### Property 7: Row Total Accuracy

*For any* budget table row, the row total SHALL equal the sum of all monthly actual amounts for that row.

**Validates: Requirements 2.6**

### Property 8: Column Total Accuracy

*For any* month column in the budget table, the column total SHALL equal the sum of all spending term amounts for that month.

**Validates: Requirements 2.6**

### Property 9: Total Budget Calculation

*For any* budget project, the total planned budget SHALL equal the sum of all budget plan row planned amounts.

**Validates: Requirements 3.4**

### Property 10: Remaining Budget Invariant

*For any* budget project at any point in time, the remaining budget SHALL equal (total planned budget - total spent).

**Validates: Requirements 3.5, 4.6**

### Property 11: Excel Import Round-Trip

*For any* valid budget project, exporting to Excel then importing then exporting again SHALL produce an equivalent Excel file with the same data values.

**Validates: Requirements 3.3, 7.5**

### Property 12: Actual Entry Completeness

*For any* actual spend entry, the created record SHALL contain all required fields: spending term ID, fiscal period, amount, and user ID.

**Validates: Requirements 4.1**

### Property 13: Fiscal Period Validation

*For any* actual spend entry with a fiscal period outside the project's date range, the system SHALL reject the entry with a validation error.

**Validates: Requirements 4.2, 14.3**

### Property 14: Actual Aggregation Accuracy

*For any* spending term and fiscal period with multiple actual entries, the displayed amount SHALL equal the sum of all entry amounts.

**Validates: Requirements 4.4**

### Property 15: Cumulative Spend Calculation

*For any* budget project and any month M, the cumulative spend up to month M SHALL equal the sum of all actual amounts from the project start date through month M.

**Validates: Requirements 4.5**

### Property 16: Burn Rate Formula

*For any* budget project with N months containing actual spend data, the burn rate SHALL equal (total spent / N).

**Validates: Requirements 5.2**

### Property 17: Forecast Formula

*For any* budget project with positive burn rate, the forecast months remaining SHALL equal (remaining budget / burn rate).

**Validates: Requirements 5.3**

### Property 18: Filter Application Consistency

*For any* analytics query with filters applied, all returned data points SHALL match the filter criteria (date range, aircraft type, term search).

**Validates: Requirements 5.10**

### Property 19: Excel Structure Validation

*For any* Excel file with structure not matching the selected template, the import validation SHALL reject the file with specific error messages.

**Validates: Requirements 7.2, 7.4**

### Property 20: Export Data Completeness

*For any* budget project, the Excel export SHALL contain all spending terms, all planned amounts, and all actual amounts present in the database.

**Validates: Requirements 7.6**

### Property 21: Audit Trail Creation

*For any* modification to budget data (project, plan row, or actual), the system SHALL create an audit log entry with user ID, timestamp, and changed values.

**Validates: Requirements 8.1, 13.4**

### Property 22: Audit Log Sort Order

*For any* audit log query, the returned entries SHALL be sorted by timestamp in descending order (newest first).

**Validates: Requirements 8.4**

### Property 23: Year Filter Accuracy

*For any* year filter value Y, all returned projects SHALL have date ranges that overlap with year Y.

**Validates: Requirements 9.2**

### Property 24: Data Independence

*For any* budget calculation (totals, KPIs, analytics), the system SHALL query only budget-specific collections (budgetprojects, budgetplanrows, budgetactuals) and aircraft master data, never querying maintenance, AOG, or work order collections.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 25: Aircraft Deletion Preservation

*For any* budget project referencing an aircraft, deleting that aircraft from the aircraft master data SHALL NOT delete or modify the budget project data.

**Validates: Requirements 10.6**

### Property 26: Term Search Filtering

*For any* term search query string S, all returned spending terms SHALL have names containing S (case-insensitive).

**Validates: Requirements 11.4**

### Property 27: Authentication Requirement

*For any* budget API endpoint request without valid authentication token, the system SHALL reject the request with 401 Unauthorized.

**Validates: Requirements 13.1**

### Property 28: Role-Based Access Control

*For any* delete operation on a budget project, if the requesting user's role is not Admin, the system SHALL reject the request with 403 Forbidden.

**Validates: Requirements 13.2, 13.5**



## Error Handling

### Backend Error Handling

**Validation Errors**:
- Use NestJS `@ValidationPipe` with class-validator decorators
- Return 400 Bad Request with detailed error messages
- Include field-level errors in response body

**Not Found Errors**:
- Return 404 Not Found when project/row/actual doesn't exist
- Include resource type and ID in error message

**Authorization Errors**:
- Return 401 Unauthorized for missing/invalid auth tokens
- Return 403 Forbidden for insufficient permissions
- Include required role in error message

**Database Errors**:
- Catch MongoDB errors and return 500 Internal Server Error
- Log full error details server-side
- Return generic error message to client (don't expose internals)

**Business Logic Errors**:
- Return 422 Unprocessable Entity for business rule violations
- Examples: fiscal period outside date range, negative amounts
- Include specific violation details in error message

### Frontend Error Handling

**API Request Errors**:
- Display toast notifications for all API errors
- Show user-friendly error messages (not raw API responses)
- Provide retry button for transient failures

**Validation Errors**:
- Display inline error messages near affected fields
- Prevent form submission until errors are resolved
- Clear errors when user corrects input

**Network Errors**:
- Display "Connection lost" message for network failures
- Automatically retry failed requests (with exponential backoff)
- Show offline indicator in UI

**Loading States**:
- Display skeleton loaders for data fetching
- Show spinner for mutations (save, delete)
- Disable buttons during async operations to prevent double-submission

**Optimistic Updates**:
- Apply updates immediately in UI for better UX
- Rollback on error and show error message
- Re-fetch data to ensure consistency

### Error Recovery Strategies

**Partial Failures**:
- For bulk operations (Excel import), report which rows succeeded and which failed
- Allow user to fix failed rows and retry

**Data Consistency**:
- Use transactions for multi-document updates (project + plan rows)
- Rollback all changes if any part fails

**Audit Trail**:
- Log all errors with context (user, project, operation)
- Include error details in audit log for debugging

## Testing Strategy

### Dual Testing Approach

The Budget & Cost Revamp feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
**Property Tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Unit Testing

**Backend Unit Tests** (Jest):

1. **Service Layer Tests**:
   - Test specific calculation examples (burn rate, forecast)
   - Test error conditions (invalid dates, missing data)
   - Test edge cases (zero budget, no actuals)
   - Mock repository layer

2. **Controller Tests**:
   - Test request validation (missing fields, invalid types)
   - Test authorization (role checks)
   - Test response formatting
   - Mock service layer

3. **Repository Tests**:
   - Test MongoDB queries (aggregations, filters)
   - Test data transformations
   - Use in-memory MongoDB for isolation

**Frontend Unit Tests** (Vitest + React Testing Library):

1. **Component Tests**:
   - Test rendering with different props
   - Test user interactions (clicks, inputs)
   - Test error states and loading states
   - Mock API hooks

2. **Hook Tests**:
   - Test query invalidation after mutations
   - Test error handling
   - Test optimistic updates
   - Mock TanStack Query

3. **Utility Tests**:
   - Test calculation functions (totals, percentages)
   - Test date formatting
   - Test currency formatting

### Property-Based Testing

**Configuration**:
- Use fast-check library for TypeScript
- Minimum 100 iterations per property test
- Each test references its design document property

**Property Test Examples**:

```typescript
// Property 3: Plan Row Generation Completeness
// Feature: budget-cost-revamp, Property 3: For any valid budget project with N terms and M aircraft, system generates N × M plan rows

import fc from 'fast-check';

describe('Property 3: Plan Row Generation Completeness', () => {
  it('generates correct number of plan rows for any project', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          termCount: fc.integer({ min: 1, max: 100 }),
          aircraftCount: fc.integer({ min: 1, max: 20 }),
        }),
        async ({ termCount, aircraftCount }) => {
          // Generate project with termCount terms and aircraftCount aircraft
          const project = await createTestProject(termCount, aircraftCount);
          
          // Verify plan rows count
          const planRows = await getPlanRows(project.id);
          expect(planRows.length).toBe(termCount * aircraftCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 7: Row Total Accuracy
// Feature: budget-cost-revamp, Property 7: For any budget table row, row total equals sum of monthly actuals

describe('Property 7: Row Total Accuracy', () => {
  it('row total equals sum of actuals for any row', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.float({ min: 0, max: 1000000 }), { minLength: 1, maxLength: 12 }),
        async (monthlyAmounts) => {
          // Create row with random monthly actuals
          const row = await createTestRow(monthlyAmounts);
          
          // Get table data
          const tableData = await getTableData(row.projectId);
          const rowData = tableData.rows.find(r => r.termId === row.termId);
          
          // Verify row total
          const expectedTotal = monthlyAmounts.reduce((sum, amt) => sum + amt, 0);
          expect(rowData.totalSpent).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 10: Remaining Budget Invariant
// Feature: budget-cost-revamp, Property 10: For any project, remaining = planned - spent

describe('Property 10: Remaining Budget Invariant', () => {
  it('remaining budget equals planned minus spent for any project', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          plannedAmount: fc.float({ min: 0, max: 10000000 }),
          spentAmount: fc.float({ min: 0, max: 10000000 }),
        }),
        async ({ plannedAmount, spentAmount }) => {
          // Create project with planned and spent amounts
          const project = await createTestProjectWithAmounts(plannedAmount, spentAmount);
          
          // Get KPIs
          const kpis = await getKPIs(project.id);
          
          // Verify invariant
          const expectedRemaining = plannedAmount - spentAmount;
          expect(kpis.remainingBudget).toBeCloseTo(expectedRemaining, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 11: Excel Import Round-Trip
// Feature: budget-cost-revamp, Property 11: Export → Import → Export produces equivalent file

describe('Property 11: Excel Import Round-Trip', () => {
  it('round-trip preserves data for any project', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          termCount: fc.integer({ min: 5, max: 20 }),
          monthCount: fc.integer({ min: 6, max: 12 }),
        }),
        async ({ termCount, monthCount }) => {
          // Create project with random data
          const project = await createTestProjectWithData(termCount, monthCount);
          
          // Export to Excel
          const excel1 = await exportToExcel(project.id);
          
          // Import from Excel
          const importedProject = await importFromExcel(excel1);
          
          // Export again
          const excel2 = await exportToExcel(importedProject.id);
          
          // Verify equivalence (compare data values, not binary)
          const data1 = parseExcelData(excel1);
          const data2 = parseExcelData(excel2);
          expect(data2).toEqual(data1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**End-to-End Tests** (Playwright):

1. **Project Creation Flow**:
   - Create project → Verify plan rows generated → Enter planned amounts → Verify totals

2. **Data Entry Flow**:
   - Open project → Edit cell → Save → Verify total updated → Refresh page → Verify persisted

3. **Analytics Flow**:
   - Enter actuals → Open analytics → Verify KPIs → Apply filters → Verify charts updated

4. **Export Flow**:
   - Create project with data → Export Excel → Verify file downloaded → Export PDF → Verify file generated

### Performance Testing

**Load Tests**:
- Test table rendering with 1000+ rows
- Test analytics with 12+ months of data
- Test Excel export with large datasets
- Measure response times and optimize slow queries

**Stress Tests**:
- Test concurrent edits by multiple users
- Test rapid cell edits (typing speed)
- Test filter changes (debouncing)

### Test Coverage Goals

- Backend: 80%+ code coverage
- Frontend: 70%+ code coverage
- All correctness properties: 100% coverage (28 properties)
- Critical paths: 100% E2E coverage

## API Endpoints Reference

### Budget Projects

- `POST /api/budget-projects` - Create project
- `GET /api/budget-projects` - List projects (filterable by year, status)
- `GET /api/budget-projects/:id` - Get project details
- `PUT /api/budget-projects/:id` - Update project
- `DELETE /api/budget-projects/:id` - Delete project (Admin only)
- `GET /api/budget-projects/:id/table-data` - Get table view data
- `PATCH /api/budget-projects/:id/plan-row/:rowId` - Update planned amount
- `PATCH /api/budget-projects/:id/actual/:period` - Update actual amount

### Budget Templates

- `GET /api/budget-templates` - List available templates
- `GET /api/budget-templates/:type` - Get template definition
- `GET /api/budget-templates/:type/terms` - Get spending terms for template

### Budget Analytics

- `GET /api/budget-analytics/:projectId/kpis` - Get KPI summary
- `GET /api/budget-analytics/:projectId/monthly-spend` - Get monthly spend by term
- `GET /api/budget-analytics/:projectId/cumulative-spend` - Get cumulative spend vs budget
- `GET /api/budget-analytics/:projectId/spend-distribution` - Get spend distribution by category
- `GET /api/budget-analytics/:projectId/budgeted-vs-spent` - Get budgeted vs spent by aircraft type
- `GET /api/budget-analytics/:projectId/top-overspend` - Get top 5 overspend terms
- `GET /api/budget-analytics/:projectId/heatmap` - Get spending heatmap (optional)

### Budget Import/Export

- `POST /api/budget-import/excel` - Import from Excel file
- `POST /api/budget-import/validate` - Validate Excel file without importing
- `GET /api/budget-export/:projectId/excel` - Export to Excel
- `POST /api/budget-export/:projectId/pdf` - Generate PDF report (returns PDF blob)

### Budget Audit

- `GET /api/budget-audit/:projectId` - Get audit log for project
- `GET /api/budget-audit/:projectId/summary` - Get audit summary (change count by user)

## Deployment Considerations

### Database Indexes

Create these indexes for optimal performance:

```javascript
// budgetprojects
db.budgetprojects.createIndex({ name: 1 }, { unique: true });
db.budgetprojects.createIndex({ templateType: 1, status: 1 });
db.budgetprojects.createIndex({ 'dateRange.start': 1, 'dateRange.end': 1 });

// budgetplanrows
db.budgetplanrows.createIndex({ projectId: 1, termId: 1, aircraftId: 1 }, { unique: true });
db.budgetplanrows.createIndex({ projectId: 1 });
db.budgetplanrows.createIndex({ termId: 1 });

// budgetactuals
db.budgetactuals.createIndex({ projectId: 1, termId: 1, period: 1 });
db.budgetactuals.createIndex({ projectId: 1, period: 1 });
db.budgetactuals.createIndex({ period: 1 });

// budgetauditlog
db.budgetauditlog.createIndex({ projectId: 1, timestamp: -1 });
db.budgetauditlog.createIndex({ userId: 1, timestamp: -1 });
db.budgetauditlog.createIndex({ entityType: 1, entityId: 1 });
```

### Environment Variables

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/alphastar-kpi
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=alphastar-budget-exports  # For Excel/PDF storage (optional)

# Frontend
VITE_API_URL=http://localhost:3000
VITE_ENABLE_PDF_EXPORT=true
```

### Migration Strategy

**Phase 1: Parallel Operation**
- Deploy new Budget & Cost Revamp module alongside existing budget system
- Add new sidebar entry "Budget Projects (New)"
- Keep old "Budget & Cost" accessible but mark as deprecated

**Phase 2: Data Migration** (Optional)
- Provide migration script to convert old budget data to new format
- Map old budget clauses to new spending terms
- Preserve historical data in audit log

**Phase 3: Deprecation**
- After 1-2 months, hide old budget system from sidebar
- Redirect old routes to new system
- Archive old budget data

### Performance Optimization

**Backend**:
- Use MongoDB aggregation pipelines for analytics (avoid N+1 queries)
- Cache template definitions in memory (they don't change)
- Use projection to return only needed fields
- Implement pagination for large project lists

**Frontend**:
- Use TanStack Query caching (5-minute stale time for analytics)
- Implement virtual scrolling for tables with 100+ rows
- Debounce filter changes (300ms delay)
- Lazy load analytics charts (render on tab open)
- Memoize expensive calculations (totals, percentages)

**Database**:
- Use compound indexes for common query patterns
- Monitor slow queries and add indexes as needed
- Consider read replicas for analytics queries (if load is high)

### Security Considerations

**Authentication**:
- All endpoints require valid JWT token
- Token expiration: 8 hours
- Refresh token mechanism for long sessions

**Authorization**:
- Role-based access control (Viewer, Editor, Admin)
- Viewers: read-only access
- Editors: create/update projects and data
- Admins: delete projects, manage users

**Input Validation**:
- Validate all inputs server-side (never trust client)
- Sanitize user inputs to prevent injection attacks
- Limit file upload sizes (Excel: 10MB max)

**Data Protection**:
- Encrypt sensitive data at rest (MongoDB encryption)
- Use HTTPS for all API requests
- Implement rate limiting (100 requests/minute per user)

**Audit Trail**:
- Log all data modifications with user attribution
- Retain audit logs indefinitely for compliance
- Include IP address and user agent in audit entries

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Multi-Currency Support**:
   - Support multiple currencies in same project
   - Automatic currency conversion using exchange rates
   - Display amounts in user's preferred currency

2. **Budget Approval Workflow**:
   - Submit project for approval
   - Multi-level approval chain
   - Email notifications for approvers
   - Version history with rollback

3. **Variance Alerts**:
   - Automatic alerts when spending exceeds threshold (e.g., 90% of budget)
   - Email/SMS notifications
   - Configurable alert rules per term

4. **Budget Forecasting**:
   - Machine learning-based spend prediction
   - Seasonal trend analysis
   - What-if scenario modeling

5. **Additional Templates**:
   - Sky Prime Aviation template
   - Custom template builder
   - Template versioning

6. **Advanced Analytics**:
   - Year-over-year comparison
   - Budget vs actual trend analysis
   - Cost driver analysis (Pareto charts)
   - Predictive analytics (forecast depletion date)

7. **Collaboration Features**:
   - Comments on budget rows
   - @mentions for team members
   - Real-time collaborative editing
   - Change notifications

8. **Mobile App**:
   - Native iOS/Android apps
   - Offline data entry with sync
   - Push notifications for alerts

### Technical Debt to Address

1. **Caching Strategy**:
   - Implement Redis for server-side caching
   - Cache analytics results (invalidate on data change)
   - Cache template definitions

2. **Real-Time Updates**:
   - WebSocket support for live updates
   - Show when other users are editing same project
   - Conflict resolution for concurrent edits

3. **Batch Operations**:
   - Bulk update multiple cells at once
   - Bulk import from multiple Excel files
   - Batch delete actuals

4. **Advanced Excel Features**:
   - Support Excel formulas in import
   - Preserve cell formatting (colors, borders)
   - Support multiple sheets per file

## Summary

The Budget & Cost Revamp feature provides a modern, template-driven budgeting system that is:

- **Self-contained**: Independent from other modules, using only Aircraft master data
- **Fast**: Inline editing, optimistic updates, real-time calculations
- **Comprehensive**: Full analytics suite with 6+ visualizations
- **Professional**: High-quality PDF exports for client presentations
- **Auditable**: Complete change history with user attribution
- **Extensible**: Template-based architecture supports future budget types

The design emphasizes simplicity for managers while providing powerful analytics for decision-making. All 28 correctness properties ensure data integrity and calculation accuracy across all operations.
