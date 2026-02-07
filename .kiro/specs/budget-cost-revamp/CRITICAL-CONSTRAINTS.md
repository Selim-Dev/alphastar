# Budget & Cost Revamp - Critical Constraints & Design Decisions

## ⚠️ CRITICAL CONSTRAINT: Data Independence

### The Rule (MUST BE EXPLICIT IN CODE)

**Budget calculations for this module are TOTALLY INDEPENDENT.**

All budget computations MUST be encapsulated within this module and based only on the budget project's own data (planned + actuals from this template).

### What This Means

✅ **ALLOWED**:
- Query `budgetprojects` collection
- Query `budgetplanrows` collection
- Query `budgetactuals` collection
- Query `budgetauditlog` collection
- Query `aircraft` collection for scope selection and display (names, types, registrations)

❌ **FORBIDDEN**:
- Query `maintenancetasks` collection
- Query `workorders` collection
- Query `aogevents` collection
- Query `discrepancies` collection
- Query `actualspends` collection (old budget system)
- Query `budgetplans` collection (old budget system)
- Any automatic imports from other modules
- Any calculations that depend on other modules' data

### Why This Matters

1. **Reliability**: Budget calculations must not break if other modules change
2. **Simplicity**: Budget is a self-contained financial planning tool
3. **Accuracy**: Budget represents planned spending, not actual operational costs
4. **Future-Proofing**: Multiple budget templates may have different calculation logic

### Code Enforcement

**Backend Services**:
```typescript
// ✅ GOOD: Only queries budget collections
async calculateTotals(projectId: string) {
  const planRows = await this.budgetPlanRowRepository.find({ projectId });
  const actuals = await this.budgetActualRepository.find({ projectId });
  // ... calculate totals
}

// ❌ BAD: Queries maintenance tasks
async calculateTotals(projectId: string) {
  const planRows = await this.budgetPlanRowRepository.find({ projectId });
  const maintenanceCosts = await this.maintenanceTaskRepository.find({ ... }); // FORBIDDEN!
  // ... calculate totals
}
```

**Add Comments**:
```typescript
/**
 * CRITICAL: Budget calculations are INDEPENDENT.
 * This method MUST only query budget-specific collections:
 * - budgetprojects
 * - budgetplanrows
 * - budgetactuals
 * - aircraft (for display only)
 * 
 * DO NOT query maintenance, AOG, work orders, or other modules.
 */
async calculateBudgetKPIs(projectId: string): Promise<BudgetKPIs> {
  // Implementation...
}
```

### Testing Data Independence

**Property 24: Data Independence**

```typescript
describe('Property 24: Data Independence', () => {
  it('budget calculations never query other modules', async () => {
    // Mock all budget collections
    const mockBudgetData = createMockBudgetData();
    
    // Mock other module collections to throw errors
    jest.spyOn(maintenanceTaskRepository, 'find').mockImplementation(() => {
      throw new Error('FORBIDDEN: Budget calculations must not query maintenance tasks');
    });
    
    // Calculate KPIs - should succeed without querying forbidden collections
    const kpis = await budgetAnalyticsService.getKPIs(projectId);
    
    // Verify no forbidden queries were made
    expect(maintenanceTaskRepository.find).not.toHaveBeenCalled();
  });
});
```

## 🎯 Template-Driven Architecture

### The Goal

Support multiple budget project types with different:
- Spending term taxonomies
- Excel template structures
- Calculation logic
- Analysis dashboards

### Current Implementation: RSAF Template

**Spending Terms**: 60+ terms organized by category
**Excel Structure**: 18 clauses × 4 aircraft columns × 36 months
**Calculations**: Standard budget variance (Planned - Actual)

### Future Templates (Examples)

**Sky Prime Aviation Template**:
- Different spending terms
- Different Excel layout
- Same core calculations

**Custom Template Builder**:
- User-defined spending terms
- Flexible Excel mapping
- Configurable analytics

### Code Structure

**Template Registry** (in-memory, not database):
```typescript
// backend/src/budget-projects/templates/spending-terms.registry.ts

export const BUDGET_TEMPLATES = {
  RSAF: {
    type: 'RSAF',
    name: 'RSAF Budget Template',
    spendingTerms: RSAF_SPENDING_TERMS, // 60+ terms
    excelStructure: {
      sheetName: 'RSAF',
      headerRow: 3,
      dataStartRow: 5,
      dataEndRow: 22,
      termColumn: 'D',
      plannedColumns: ['E', 'F', 'G', 'H'],
      actualColumnsRange: 'O:AX',
    },
  },
  // Future templates go here
};
```

**Template Service**:
```typescript
export class BudgetTemplatesService {
  getTemplate(templateType: string): BudgetTemplate {
    const template = BUDGET_TEMPLATES[templateType];
    if (!template) {
      throw new NotFoundException(`Template ${templateType} not found`);
    }
    return template;
  }

  getSpendingTerms(templateType: string): SpendingTerm[] {
    return this.getTemplate(templateType).spendingTerms;
  }

  validateTemplateStructure(data: any, templateType: string): ValidationResult {
    const template = this.getTemplate(templateType);
    // Validate Excel structure matches template definition
  }
}
```

## 📊 Analytics Page - High Impact Requirements

### The Goal

"Astonish the client" with comprehensive, easy-to-understand analytics.

### Must-Have Charts (6+)

1. **Stacked Bar: Monthly Spend by Term**
   - X-axis: Months
   - Y-axis: Spend amount
   - Stacks: Spending terms (color-coded)
   - Purpose: See spending composition over time

2. **Line Chart: Cumulative Spend vs Budget**
   - X-axis: Months
   - Y-axis: Cumulative amount
   - Lines: Actual spend (solid), Budgeted (dashed)
   - Purpose: Track if spending is on pace

3. **Donut/Pie: Spend Distribution by Category**
   - Segments: Spending categories
   - Values: Total spent per category
   - Purpose: See where money is going

4. **Grouped Bar: Budgeted vs Spent per Aircraft Type**
   - X-axis: Aircraft types
   - Y-axis: Amount
   - Bars: Budgeted (blue), Spent (orange)
   - Purpose: Compare aircraft spending

5. **Ranked List: Top 5 Overspend Terms**
   - List with horizontal bars
   - Shows: Term name, variance amount, variance %
   - Purpose: Identify problem areas

6. **Heatmap: Terms × Months** (Optional)
   - Rows: Spending terms
   - Columns: Months
   - Color: Spending intensity (green = low, red = high)
   - Purpose: Spot patterns and anomalies

### Must-Have KPIs (6)

1. **Total Budgeted**: Sum of all planned amounts
2. **Total Spent**: Sum of all actual amounts
3. **Remaining Budget**: Budgeted - Spent
4. **Burn Rate**: Total Spent / Months with Data
5. **Average Monthly Spend**: Total Spent / Months with Data
6. **Forecast**: Remaining Budget / Burn Rate (months remaining)

### Filters (Must Work for All Charts)

- **Date Range**: Year / Quarter / Month / Custom
- **Aircraft Type/Group**: Individual, Type, or "All"
- **International vs Domestic**: Filter terms by suffix
- **Term Search**: Free text search in term names

### Progressive Loading Strategy

**Priority 1** (Load First):
- KPI cards
- Top 5 overspend list

**Priority 2** (Load Second):
- Monthly spend chart
- Cumulative spend chart

**Priority 3** (Load Last):
- Distribution chart
- Aircraft comparison chart
- Heatmap (if implemented)

## 📄 PDF Export - Client-Ready Requirements

### The Goal

Generate professional, print-ready PDF reports suitable for board presentations.

### PDF Export Approach: Option A (Client-Side)

**Why Client-Side**:
- ✅ No server dependencies (no Puppeteer/Playwright)
- ✅ Faster implementation
- ✅ Works offline (if needed)
- ✅ User sees exactly what they get (WYSIWYG)

**Libraries**:
- `jsPDF`: PDF generation
- `html2canvas`: Chart capture

**Implementation**:
```typescript
// frontend/src/components/budget/BudgetPDFExport.tsx

export function BudgetPDFExport({ projectId, filters }: Props) {
  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Page 1: Cover + KPIs
    addCoverPage(pdf, projectName, dateRange, filters);
    addKPISummary(pdf, kpis);
    
    // Page 2: Charts
    pdf.addPage();
    await captureAndAddChart(pdf, 'monthly-spend-chart', 10, 20);
    await captureAndAddChart(pdf, 'cumulative-spend-chart', 10, 120);
    
    // Page 3: Tables
    pdf.addPage();
    addTop5OverspendTable(pdf, top5Data);
    
    // Download
    pdf.save(`budget-report-${projectName}-${timestamp}.pdf`);
  };
  
  return <Button onClick={generatePDF}>Export PDF</Button>;
}
```

### PDF Content Requirements

**Page 1: Cover + KPIs**
- Report title: "Budget Report - [Project Name]"
- Date range: "[Start Date] to [End Date]"
- Filters applied: "[Aircraft Type], [Date Range], etc."
- Generated at: "[Timestamp]"
- Generated by: "[User Name]"
- KPI summary: 6 cards in grid

**Page 2-N: Charts**
- One or two charts per page
- High resolution (2x scale, 300 DPI)
- Chart titles and legends
- Page numbers in footer

**Last Page: Tables**
- Top 5 overspend terms table
- Key totals table
- Footer with disclaimer (optional)

### PDF Quality Requirements

- **Resolution**: 300 DPI (capture charts at 2x scale)
- **Layout**: A4 portrait (210mm × 297mm)
- **Margins**: 10mm all sides
- **Fonts**: Standard (Helvetica, Arial)
- **Colors**: Match on-screen colors
- **Page Breaks**: Proper breaks between sections
- **Page Numbers**: Bottom right corner
- **Generation Time**: <15 seconds for standard report

### WYSIWYG Guarantee

**What You See Is What You Get**:
- PDF must match on-screen display
- Same colors, fonts, and layout
- Same data values and calculations
- Same chart styles and legends

**Testing**:
- Generate PDF with various filter combinations
- Verify all charts are sharp (not blurry)
- Verify multi-page works correctly
- Verify page breaks don't cut off content

## 🚀 UX Requirements - Manager-Friendly

### The User

**Profile**: Manager of an aircraft company
**Technical Level**: Comfortable with Excel, not a developer
**Goals**: Track budget, identify overspends, report to stakeholders
**Pain Points**: Current system is slow, hard to use, requires training

### UX Principles

1. **One-Screen Understandable**: User should grasp the page in 3 seconds
2. **Minimal Training**: Should feel like Excel (familiar)
3. **Fast Feedback**: Instant updates, no waiting
4. **Clear Errors**: Helpful error messages, not technical jargon
5. **Always Exportable**: Excel and PDF always available

### Key UX Features

**Sticky Headers**:
- KPI cards stay visible when scrolling table
- Column headers stay visible when scrolling rows
- Term names stay visible when scrolling months

**Inline Editing**:
- Click cell → Edit → Press Enter → Saved
- No modal dialogs or separate forms
- Validation errors show inline (red border + message)
- Success feedback (green checkmark, toast)

**Optimistic Updates**:
- UI updates immediately (don't wait for server)
- Rollback on error (show error, restore old value)
- Re-fetch to ensure consistency

**Loading States**:
- Skeleton loaders for tables (not spinners)
- Shimmer effect for loading rows
- Disable buttons during save (prevent double-click)

**Empty States**:
- "No data yet" message with helpful text
- "Create your first project" call-to-action
- "No actuals entered" with instructions

## 📱 Mobile Responsive Requirements

### Breakpoints

- **Desktop**: ≥1024px (full table view)
- **Tablet**: 768px-1023px (horizontal scroll)
- **Mobile**: <768px (card-based layout)

### Tablet Behavior (768px-1023px)

- Show full table with horizontal scrolling
- Sticky headers remain functional
- KPI cards in 2×3 grid
- Charts scale to fit width

### Mobile Behavior (<768px)

- Card-based layout for budget rows
- Each card shows: term name, planned, spent, remaining
- Tap card to expand and see monthly breakdown
- KPI cards stack vertically (1 per row)
- Charts scale to fit width (may be simplified)
- Filters collapse into dropdown menu

### Touch Gestures

- Swipe to scroll table horizontally
- Tap to edit cell (show keyboard)
- Pinch to zoom (optional)
- Pull to refresh (optional)

## 🔒 Security Requirements

### Authentication

- All endpoints require valid JWT token
- Token expiration: 8 hours
- Refresh token mechanism for long sessions

### Authorization (Role-Based)

| Role | Read | Create/Update | Delete | User Management |
|------|------|---------------|--------|-----------------|
| Viewer | ✓ | ✗ | ✗ | ✗ |
| Editor | ✓ | ✓ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ |

### Input Validation

- Server-side validation (never trust client)
- Sanitize all inputs (prevent injection)
- Validate file uploads (size, type, content)
- Rate limiting (100 requests/minute per user)

### Audit Trail

- Log all data modifications
- Include: user ID, timestamp, old value, new value
- Retain logs indefinitely (compliance)
- Display in UI (audit log tab)

## 📦 Deployment Strategy

### Phase 1: Parallel Operation (Recommended)

1. Deploy new "Budget Projects" module
2. Add sidebar entry: "Budget Projects (New)"
3. Keep old "Budget & Cost" accessible
4. Comment out budget plan section on Data Import page
5. Add deprecation notice on old system

### Phase 2: User Migration (1-2 months)

1. Train users on new system
2. Encourage migration to new projects
3. Monitor usage (old vs new)
4. Collect feedback and iterate

### Phase 3: Deprecation (After 2 months)

1. Hide old "Budget & Cost" from sidebar
2. Redirect old routes to new system
3. Archive old budget data (read-only)
4. Remove old code (optional)

### No Data Migration Required

- New system is self-contained
- Old data remains in old system
- Optional: Provide migration script if needed

## ✅ Success Criteria

### Functional Requirements

- ✅ All 28 correctness properties pass
- ✅ All unit and integration tests pass
- ✅ Excel round-trip preserves data
- ✅ PDF export generates successfully
- ✅ Audit trail captures all changes
- ✅ Role-based access control works

### Performance Requirements

- ✅ Table loads in <2 seconds (1000 rows)
- ✅ Cell edits save in <500ms
- ✅ Analytics filters update in <1 second
- ✅ PDF export completes in <15 seconds

### UX Requirements

- ✅ Inline editing works smoothly
- ✅ Sticky headers remain visible
- ✅ Mobile responsive on tablets/phones
- ✅ Error messages are clear and helpful

### Quality Requirements

- ✅ Backend: 80%+ code coverage
- ✅ Frontend: 70%+ code coverage
- ✅ No console errors or warnings
- ✅ Passes accessibility audit (WCAG AA)

## 🎯 Next Steps

1. **Review this document** and the other spec files
2. **Ask clarifying questions** if anything is unclear
3. **Start implementation** with Task 1 (backend module structure)
4. **Follow task list sequentially** with checkpoints
5. **Test continuously** (don't wait until the end)

## 📚 Related Documents

- `requirements.md` - 15 requirements, 140+ acceptance criteria
- `design.md` - Technical design, 28 properties, API contracts
- `tasks.md` - 26 major tasks, 80+ subtasks
- `SPEC-SUMMARY.md` - High-level overview
- `RSAF-TEMPLATE-REFERENCE.md` - Excel template structure
- `CRITICAL-CONSTRAINTS.md` - This document

