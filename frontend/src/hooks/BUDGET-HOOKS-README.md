# Budget & Cost Revamp - Frontend Hooks Documentation

## Overview

This document describes the custom React hooks for the Budget & Cost Revamp feature. These hooks provide a clean interface for interacting with the budget projects API using TanStack Query.

## Hooks

### 1. useBudgetProjects

**Location**: `frontend/src/hooks/useBudgetProjects.ts`

**Purpose**: Manages budget project CRUD operations and table data mutations.

**Usage**:

```typescript
import { useBudgetProjects } from '@/hooks';

function MyComponent() {
  const {
    useProjects,
    useProject,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    useTableData,
    useUpdatePlanRow,
    useUpdateActual,
  } = useBudgetProjects();

  // Fetch all projects with filters
  const { data: projects } = useProjects({ year: 2025, status: 'active' });

  // Fetch single project
  const { data: project } = useProject(projectId);

  // Create project mutation
  const createMutation = useCreateProject();
  createMutation.mutate({
    name: 'RSAF FY2025',
    templateType: 'RSAF',
    dateRange: { start: '2025-01-01', end: '2025-12-31' },
    currency: 'USD',
    aircraftScope: { type: 'type', aircraftTypes: ['A330'] },
  });

  // Update project mutation
  const updateMutation = useUpdateProject();
  updateMutation.mutate({
    id: projectId,
    dto: { status: 'active' },
  });

  // Delete project mutation (Admin only)
  const deleteMutation = useDeleteProject();
  deleteMutation.mutate(projectId);

  // Fetch table data
  const { data: tableData } = useTableData(projectId);

  // Update plan row
  const updatePlanMutation = useUpdatePlanRow();
  updatePlanMutation.mutate({
    projectId,
    rowId,
    dto: { plannedAmount: 50000 },
  });

  // Update actual spend
  const updateActualMutation = useUpdateActual();
  updateActualMutation.mutate({
    projectId,
    period: '2025-01',
    dto: { termId: 'off-base-maint-intl', amount: 15000 },
  });
}
```

**Operations**:

| Operation | Type | Description |
|-----------|------|-------------|
| `useProjects(filters?)` | Query | Fetch all projects with optional filters (year, status, templateType) |
| `useProject(id)` | Query | Fetch single project by ID |
| `useCreateProject()` | Mutation | Create new project |
| `useUpdateProject()` | Mutation | Update existing project |
| `useDeleteProject()` | Mutation | Delete project (Admin only) |
| `useTableData(projectId)` | Query | Fetch table view data with rows and totals |
| `useUpdatePlanRow()` | Mutation | Update planned amount for a row |
| `useUpdateActual()` | Mutation | Update actual spend for a period |

**Query Invalidation**:
- After create/update/delete: Invalidates `['budget-projects']`
- After updatePlanRow/updateActual: Invalidates table data and analytics

---

### 2. useBudgetAnalytics

**Location**: `frontend/src/hooks/useBudgetAnalytics.ts`

**Purpose**: Provides analytics queries for KPIs, charts, and visualizations.

**Usage**:

```typescript
import { useBudgetAnalytics } from '@/hooks';

function AnalyticsPage({ projectId }: { projectId: string }) {
  const {
    useKPIs,
    useMonthlySpend,
    useCumulativeSpend,
    useSpendDistribution,
    useBudgetedVsSpent,
    useTop5Overspend,
    useHeatmap,
  } = useBudgetAnalytics(projectId);

  // Fetch KPIs with filters
  const { data: kpis } = useKPIs({
    startDate: '2025-01',
    endDate: '2025-06',
    aircraftType: 'A330',
  });

  // Fetch monthly spend by term (stacked bar chart)
  const { data: monthlySpend } = useMonthlySpend({ termSearch: 'maintenance' });

  // Fetch cumulative spend vs budget (line chart)
  const { data: cumulativeData } = useCumulativeSpend();

  // Fetch spend distribution by category (pie chart)
  const { data: distribution } = useSpendDistribution();

  // Fetch budgeted vs spent by aircraft type (grouped bar chart)
  const { data: aircraftData } = useBudgetedVsSpent();

  // Fetch top 5 overspend terms
  const { data: topOverspend } = useTop5Overspend();

  // Fetch spending heatmap (optional)
  const { data: heatmap } = useHeatmap();
}
```

**Queries**:

| Query | Description | Filters |
|-------|-------------|---------|
| `useKPIs(filters?)` | KPI summary (budgeted, spent, remaining, burn rate, forecast) | startDate, endDate, aircraftType, termSearch |
| `useMonthlySpend(filters?)` | Monthly spend by term (stacked bar chart data) | startDate, endDate, aircraftType, termSearch |
| `useCumulativeSpend()` | Cumulative spend vs budget (line chart data) | None |
| `useSpendDistribution(filters?)` | Spend distribution by category (pie chart data) | startDate, endDate, aircraftType, termSearch |
| `useBudgetedVsSpent()` | Budgeted vs spent by aircraft type (grouped bar chart) | None |
| `useTop5Overspend()` | Top 5 overspend terms (ranked list) | None |
| `useHeatmap()` | Spending heatmap (terms × months grid) | None |

**Caching**:
- All analytics queries have a 5-minute stale time (`staleTime: 5 * 60 * 1000`)
- This reduces server load while keeping data reasonably fresh

---

### 3. useBudgetAudit

**Location**: `frontend/src/hooks/useBudgetAudit.ts`

**Purpose**: Provides audit trail queries for tracking changes.

**Usage**:

```typescript
import { useBudgetAudit } from '@/hooks';

function AuditLogTab({ projectId }: { projectId: string }) {
  const { useAuditLog, useAuditSummary } = useBudgetAudit(projectId);

  // Fetch audit log with filters
  const { data: auditLog } = useAuditLog({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    userId: 'user123',
    action: 'update',
    entityType: 'actual',
  });

  // Fetch audit summary
  const { data: summary } = useAuditSummary();

  return (
    <div>
      <h3>Total Changes: {summary?.totalChanges}</h3>
      <ul>
        {auditLog?.map((entry) => (
          <li key={entry._id}>
            {entry.timestamp}: {entry.action} on {entry.entityType}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Queries**:

| Query | Description | Filters |
|-------|-------------|---------|
| `useAuditLog(filters?)` | Fetch audit log entries | startDate, endDate, userId, action, entityType |
| `useAuditSummary()` | Fetch audit summary (change counts by user and type) | None |

---

## Types

All types are defined in `frontend/src/types/budget-projects.ts` and exported from `frontend/src/types/index.ts`.

### Key Interfaces

```typescript
// Core entities
interface BudgetProject { ... }
interface BudgetPlanRow { ... }
interface BudgetActual { ... }

// Table data
interface BudgetTableData {
  projectId: string;
  periods: string[];
  rows: BudgetTableRow[];
  columnTotals: Record<string, number>;
  grandTotal: { budgeted: number; spent: number; remaining: number };
}

// Analytics
interface BudgetKPIs {
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  burnRate: number;
  averageMonthlySpend: number;
  forecastMonthsRemaining: number;
  forecastDepletionDate: string | null;
}

// Audit
interface BudgetAuditEntry { ... }
interface BudgetAuditSummary { ... }

// Request DTOs
interface CreateBudgetProjectDto { ... }
interface UpdateBudgetProjectDto { ... }
interface UpdatePlanRowDto { ... }
interface UpdateActualDto { ... }

// Filters
interface BudgetProjectFilters { ... }
interface AnalyticsFilters { ... }
interface AuditLogFilters { ... }
```

---

## Best Practices

### 1. Query Keys

All queries use consistent query keys for proper caching and invalidation:

```typescript
// Projects
['budget-projects'] // List
['budget-projects', id] // Single project
['budget-projects', id, 'table-data'] // Table data

// Analytics
['budget-analytics', projectId, 'kpis', filters]
['budget-analytics', projectId, 'monthly-spend', filters]
// ... etc

// Audit
['budget-audit', projectId, 'log', filters]
['budget-audit', projectId, 'summary']
```

### 2. Optimistic Updates

For better UX, consider implementing optimistic updates:

```typescript
const updateActualMutation = useUpdateActual();

// Optimistic update example
updateActualMutation.mutate(
  { projectId, period, dto },
  {
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['budget-projects', projectId, 'table-data']);

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['budget-projects', projectId, 'table-data']);

      // Optimistically update
      queryClient.setQueryData(['budget-projects', projectId, 'table-data'], (old) => {
        // Update logic here
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['budget-projects', projectId, 'table-data'],
        context.previousData
      );
    },
  }
);
```

### 3. Error Handling

Always handle errors in your components:

```typescript
const { data, error, isLoading, isError } = useProjects();

if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage error={error} />;
if (!data) return null;

// Render data
```

### 4. Loading States

Use loading states for better UX:

```typescript
const createMutation = useCreateProject();

<Button
  onClick={() => createMutation.mutate(dto)}
  disabled={createMutation.isPending}
>
  {createMutation.isPending ? 'Creating...' : 'Create Project'}
</Button>
```

---

## API Endpoints

The hooks interact with these backend endpoints:

### Budget Projects
- `GET /api/budget-projects` - List projects
- `POST /api/budget-projects` - Create project
- `GET /api/budget-projects/:id` - Get project
- `PUT /api/budget-projects/:id` - Update project
- `DELETE /api/budget-projects/:id` - Delete project
- `GET /api/budget-projects/:id/table-data` - Get table data
- `PATCH /api/budget-projects/:id/plan-row/:rowId` - Update plan row
- `PATCH /api/budget-projects/:id/actual/:period` - Update actual

### Budget Analytics
- `GET /api/budget-analytics/:projectId/kpis` - Get KPIs
- `GET /api/budget-analytics/:projectId/monthly-spend` - Get monthly spend
- `GET /api/budget-analytics/:projectId/cumulative-spend` - Get cumulative spend
- `GET /api/budget-analytics/:projectId/spend-distribution` - Get distribution
- `GET /api/budget-analytics/:projectId/budgeted-vs-spent` - Get aircraft comparison
- `GET /api/budget-analytics/:projectId/top-overspend` - Get top overspend
- `GET /api/budget-analytics/:projectId/heatmap` - Get heatmap

### Budget Audit
- `GET /api/budget-audit/:projectId` - Get audit log
- `GET /api/budget-audit/:projectId/summary` - Get audit summary

---

## Testing

Example test for a hook:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBudgetProjects } from './useBudgetProjects';

describe('useBudgetProjects', () => {
  it('fetches projects', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useBudgetProjects().useProjects(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Migration from Old Budget System

If migrating from the old budget system (`useBudget` hook):

**Old**:
```typescript
const { data: plans } = useBudgetPlans({ fiscalYear: 2025 });
const { data: variance } = useBudgetVariance({ fiscalYear: 2025 });
```

**New**:
```typescript
const { useProjects } = useBudgetProjects();
const { data: projects } = useProjects({ year: 2025 });

const { useKPIs } = useBudgetAnalytics(projectId);
const { data: kpis } = useKPIs();
```

---

## Support

For questions or issues:
1. Check the design document: `.kiro/specs/budget-cost-revamp/design.md`
2. Review the requirements: `.kiro/specs/budget-cost-revamp/requirements.md`
3. Check the backend implementation: `backend/src/budget-projects/`

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: ✅ Complete
