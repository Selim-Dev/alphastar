---
inclusion: always
---

# Alpha Star Aviation - Development Guidelines

## Code Style & Conventions

### TypeScript
- Strict mode enabled; avoid `any` types
- Use interfaces for DTOs and schemas, types for unions/utilities
- Prefer `readonly` for immutable properties
- Use enums for fixed value sets (status, roles, shifts)

### Backend (NestJS)
- Follow module-based architecture: `module → controller → service → repository`
- DTOs in `/dto`, schemas in `/schemas`, repositories in `/repositories`
- Use class-validator decorators for input validation
- Repository pattern for all database operations
- Services handle business logic; controllers handle HTTP concerns only
- Use `@Public()` decorator for unauthenticated endpoints
- Apply `@Roles()` decorator for role-based access control

### Frontend (React)
- Functional components with TypeScript
- Custom hooks in `/hooks` for API operations (TanStack Query)
- Shared UI components in `/components/ui`
- Page components in `/pages`
- Use Zod schemas for form validation with React Hook Form
- Invalidate queries after mutations for data consistency

## Naming Conventions
- Files: kebab-case (`daily-status.service.ts`)
- Classes/Interfaces: PascalCase (`DailyStatusService`)
- Variables/Functions: camelCase (`getAggregatedAvailability`)
- Database collections: lowercase plural (`dailystatus`, `aogevents`)
- API routes: kebab-case (`/api/daily-status`, `/api/aog-events`)

## Aviation Domain Rules
- Aircraft registrations: always UPPERCASE (e.g., `HZ-A42`)
- Counter values are monotonic (only increase)
- Hours must be 0-24 for daily status fields
- ATA chapters follow standard aviation classification
- Currency defaults to USD (US Dollar)
- Fiscal year format: 4-digit year (e.g., 2025)
- Period format: `YYYY-MM` for budget tracking

## Data Validation
- `clearedAt >= detectedAt` for AOG events
- `fmcHours = posHours - nmcmSHours - nmcmUHours - nmcsHours`
- Engine 3/4 fields required only for 4-engine aircraft
- Work order numbers must be unique
- Email addresses stored lowercase

## API Patterns
- All list endpoints support filtering via query params
- Use ObjectId references for relationships
- Include `updatedBy` field for audit trail
- Return paginated results for large datasets
- Analytics endpoints use aggregation pipelines

## Error Handling
- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`)
- Frontend: display toast notifications for errors
- Log errors with context for debugging

## Testing
- E2E tests in `/backend/test`
- Use Jest for backend testing
- Mock external services (S3, MongoDB) in tests

---

## CEO Dashboard Enhancements - Purpose & Rationale

### Why These Enhancements Matter

The Alpha Star Aviation KPI Dashboard serves dual purposes: daily operational tracking AND executive-level reporting. The CEO Dashboard Enhancements transform the existing operational dashboard into a board-presentation-ready tool that communicates fleet health, performance trends, and actionable insights at a glance.

### Key Design Principles

1. **Single-Glance Understanding**: Executives have limited time. Every element must communicate value within 3 seconds.
2. **Composite Metrics**: The Fleet Health Score combines multiple KPIs into one actionable number (0-100).
3. **Contextual Comparison**: Period-over-period deltas show whether things are improving or declining.
4. **Proactive Alerting**: The Alerts Panel surfaces issues before they become crises.
5. **Visual Hierarchy**: Large numbers for primary metrics, supporting data in smaller text.

### Fleet Health Score Formula

```
Fleet Health Score = (
  Availability Score × 0.40 +
  AOG Impact Score × 0.25 +
  Budget Health Score × 0.20 +
  Maintenance Efficiency Score × 0.15
)

Where:
- Availability Score = Fleet Availability % (capped at 100)
- AOG Impact Score = 100 - (Active AOG Count × 10), min 0
- Budget Health Score = 100 - Budget Utilization %, min 0 (under budget = 100)
- Maintenance Efficiency Score = 100 - (Overdue WO Count × 5), min 0
```

### Alert Priority Levels

| Level | Color | Trigger Conditions |
|-------|-------|-------------------|
| Critical | Red | Active AOG events, Aircraft availability < 70% |
| Warning | Amber | Overdue work orders, Budget > 90%, Availability < 85% |
| Info | Blue | Upcoming maintenance due within 7 days |

### Target Values (Configurable)

| Metric | Default Target | Source |
|--------|---------------|--------|
| Fleet Availability | 92% | Industry standard for premium aviation |
| Budget Utilization | 100% | Fiscal year budget plan |
| Work Order Turnaround | 5 days | Internal SLA |

### Implementation Notes

- All enhancements use existing API endpoints where possible
- New backend endpoints only for composite calculations (Fleet Health Score)
- Sparklines use last 7 data points from existing trend data
- Period comparison uses same date range logic as existing filters
- PDF export uses client-side generation (html2pdf or similar)

### Component Placement on Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Fleet Health Score (Gauge)  │  Alerts Panel (Right Side)  │
├─────────────────────────────────────────────────────────────┤
│  Fleet Status Summary Bar (Full Width)                      │
├─────────────────────────────────────────────────────────────┤
│  KPI Cards with Sparklines & Deltas (4 cards)              │
├─────────────────────────────────────────────────────────────┤
│  Cost Efficiency Cards (Cost/FH, Cost/Cycle)               │
├─────────────────────────────────────────────────────────────┤
│  Trend Charts with Target Lines (2 charts)                 │
├─────────────────────────────────────────────────────────────┤
│  Fleet Comparison (Top 3 / Bottom 3 Performers)            │
└─────────────────────────────────────────────────────────────┘
```

### Color Palette for Executive View

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Healthy/Good | #22c55e (green-500) | #4ade80 (green-400) |
| Warning/Caution | #f59e0b (amber-500) | #fbbf24 (amber-400) |
| Critical/Bad | #ef4444 (red-500) | #f87171 (red-400) |
| Neutral/Info | #3b82f6 (blue-500) | #60a5fa (blue-400) |
| Target Line | #6b7280 (gray-500) | #9ca3af (gray-400) |
