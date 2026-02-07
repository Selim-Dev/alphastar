# Budget & Cost Revamp - Specification

## 📋 Overview

This specification defines the complete redesign of the Budget & Cost module for the Alpha Star Aviation KPIs Dashboard. The new system is template-driven, manager-friendly, and completely independent from other modules.

## 🎯 Goals

1. **Replace** the existing budget system with a modern, template-driven solution
2. **Support** multiple budget project types (starting with RSAF template)
3. **Provide** fast, spreadsheet-like data entry with inline editing
4. **Deliver** comprehensive analytics with 6+ charts and KPIs
5. **Enable** professional PDF exports for client presentations
6. **Maintain** complete audit trail for all financial changes
7. **Ensure** data independence (budget calculations isolated from other modules)

## 📁 Specification Documents

### Core Documents

1. **[requirements.md](./requirements.md)** - Complete requirements specification
   - 15 major requirements
   - 140+ acceptance criteria
   - User stories for each requirement
   - Special requirements for parsers and serializers

2. **[design.md](./design.md)** - Technical design document
   - System architecture and components
   - 4 MongoDB collections with schemas
   - 30+ API endpoints across 4 modules
   - Frontend components and hooks
   - Data models and relationships
   - **28 Correctness Properties** for property-based testing
   - Error handling and testing strategy
   - Performance optimization guidelines

3. **[tasks.md](./tasks.md)** - Implementation task list
   - 26 major tasks
   - 80+ subtasks
   - Checkpoints for validation
   - Property tests for each correctness property
   - Integration tests for end-to-end flows

### Reference Documents

4. **[SPEC-SUMMARY.md](./SPEC-SUMMARY.md)** - High-level overview
   - Quick summary of all requirements
   - Key features and technical highlights
   - Data model summary
   - Implementation approach
   - Testing strategy
   - Estimated effort (90 hours)

5. **[RSAF-TEMPLATE-REFERENCE.md](./RSAF-TEMPLATE-REFERENCE.md)** - Excel template structure
   - Exact column mapping from Excel file
   - 18 spending clauses
   - Monthly columns range (O-AX)
   - Totals row structure
   - Import/export logic
   - Round-trip property

6. **[CRITICAL-CONSTRAINTS.md](./CRITICAL-CONSTRAINTS.md)** - Critical design decisions
   - **Data independence** (MUST READ)
   - Template-driven architecture
   - Analytics page requirements
   - PDF export approach
   - UX requirements
   - Security requirements
   - Deployment strategy

## 🚀 Quick Start

### For Developers

1. **Read in this order**:
   - Start with `SPEC-SUMMARY.md` (10 minutes)
   - Read `CRITICAL-CONSTRAINTS.md` (15 minutes)
   - Review `requirements.md` (30 minutes)
   - Study `design.md` (60 minutes)
   - Understand `RSAF-TEMPLATE-REFERENCE.md` (20 minutes)

2. **Begin implementation**:
   - Follow `tasks.md` sequentially
   - Start with Task 1: Backend module structure
   - Use checkpoints to validate progress
   - Write property tests as you go

3. **Ask questions**:
   - If anything is unclear, ask before coding
   - Refer back to spec documents frequently
   - Update docs if you find gaps or errors

### For Reviewers

1. **Verify completeness**:
   - All requirements have acceptance criteria
   - All acceptance criteria are testable
   - All design decisions are documented
   - All tasks reference requirements

2. **Check correctness**:
   - 28 correctness properties cover all calculations
   - Data independence is enforced
   - Security requirements are comprehensive
   - Performance requirements are realistic

3. **Validate feasibility**:
   - Technology choices are appropriate
   - Estimated effort is reasonable
   - Implementation approach is sound
   - Testing strategy is comprehensive

## 🎨 Key Features

### Template-Driven Projects
- Create budget projects based on predefined templates
- RSAF template with 60+ spending terms
- Support for future templates (Sky Prime, Custom)

### Spreadsheet-Like Interface
- Inline editing with instant feedback
- Sticky headers (KPIs, columns, rows)
- Row and column totals
- Optimistic updates with rollback

### Comprehensive Analytics
- 6 KPI cards (Budgeted, Spent, Remaining, Burn Rate, Avg Monthly, Forecast)
- 6+ charts (Stacked Bar, Line, Donut, Grouped Bar, Ranked List, Heatmap)
- Filters (Date Range, Aircraft Type, Intl/Domestic, Term Search)
- Progressive loading (KPIs first, then charts)

### Professional PDF Export
- Client-side generation (jsPDF + html2canvas)
- Multi-page layout with proper page breaks
- High-resolution charts (2x scale, 300 DPI)
- Report header with metadata and filters
- WYSIWYG output (matches screen display)

### Complete Audit Trail
- Track all changes (who, when, what changed)
- Display in UI (audit log tab)
- Filter by date, user, change type
- Retain indefinitely for compliance

### Excel Import/Export
- Import planned amounts from Excel
- Export to Excel (matches template format)
- Round-trip property (export → import → export = equivalent)
- Validation and error reporting

## ⚠️ Critical Constraints

### Data Independence (MUST-HAVE)

**Budget calculations are TOTALLY INDEPENDENT.**

- ✅ Query only: `budgetprojects`, `budgetplanrows`, `budgetactuals`, `budgetauditlog`, `aircraft` (for display)
- ❌ Never query: `maintenancetasks`, `workorders`, `aogevents`, `discrepancies`, old budget collections

**Why**: Budget is a self-contained financial planning tool, not a cost tracking system.

### Template-Driven Architecture

**Support multiple budget templates** with different:
- Spending term taxonomies
- Excel template structures
- Calculation logic
- Analysis dashboards

**Current**: RSAF template (60+ terms, 18 clauses, 4 aircraft columns)
**Future**: Sky Prime template, Custom template builder

### Manager-Friendly UX

**Target user**: Manager of aircraft company (comfortable with Excel, not a developer)

**Key UX features**:
- One-screen understandable (grasp in 3 seconds)
- Minimal training (feels like Excel)
- Fast feedback (instant updates)
- Clear errors (helpful messages)
- Always exportable (Excel and PDF)

## 📊 Data Model Summary

### Collections

1. **budgetprojects**: Project metadata (name, template, date range, aircraft scope)
2. **budgetplanrows**: Planned amounts (term × aircraft combinations)
3. **budgetactuals**: Actual spend by month (term × period)
4. **budgetauditlog**: Change history (who, when, what changed)

### Key Relationships

```
BudgetProject (1) ──→ (N) BudgetPlanRows
BudgetProject (1) ──→ (N) BudgetActuals
BudgetProject (1) ──→ (N) BudgetAuditLog
```

### Indexes

- `budgetprojects`: name (unique), templateType + status, dateRange
- `budgetplanrows`: projectId + termId + aircraftId (unique), projectId, termId
- `budgetactuals`: projectId + termId + period, projectId + period, period
- `budgetauditlog`: projectId + timestamp, userId + timestamp, entityType + entityId

## 🧪 Testing Strategy

### Dual Testing Approach

1. **Unit Tests**: Specific examples, edge cases, error conditions
2. **Property Tests**: Universal properties across all inputs (28 properties)

### 28 Correctness Properties

All critical calculations and invariants are verified:
- Template loading consistency
- Plan row generation completeness
- Row/column total accuracy
- Remaining budget invariant
- Excel import round-trip
- Burn rate and forecast formulas
- Filter application consistency
- Audit trail creation
- Authentication and authorization
- Data independence

### Coverage Goals

- Backend: 80%+ code coverage
- Frontend: 70%+ code coverage
- All 28 properties: 100% coverage
- Critical paths: 100% E2E coverage

## 📈 Implementation Approach

### Phase 1: Backend Foundation (Tasks 1-10)
- Set up modules and data models
- Implement CRUD operations
- Build analytics service
- Add Excel import/export
- **Checkpoint**: All backend tests pass

### Phase 2: Frontend Core (Tasks 11-15)
- Create custom hooks
- Build projects list page
- Implement budget table with inline editing
- Add project detail page
- **Checkpoint**: Table and editing work correctly

### Phase 3: Analytics & Export (Tasks 16-18)
- Build analytics page with charts
- Implement PDF export
- Add Excel export button
- **Checkpoint**: Analytics and export work correctly

### Phase 4: Polish & Security (Tasks 19-26)
- Add navigation and routing
- Implement security and authorization
- Verify data independence
- Add mobile responsive design
- Optimize performance
- Write integration tests
- **Final Checkpoint**: All tests pass, feature complete

## 🚢 Deployment Strategy

### Parallel Operation (Recommended)

1. Deploy new "Budget Projects" module alongside existing system
2. Add sidebar entry: "Budget Projects (New)"
3. Keep old "Budget & Cost" accessible but mark as deprecated
4. Comment out budget plan section on Data Import page
5. After 1-2 months, hide old system and redirect routes

### No Data Migration Required

- New system is self-contained
- Old data remains in old system
- Optional: Provide migration script if needed later

## ✅ Success Criteria

### Functional
- ✅ All 28 correctness properties pass
- ✅ All unit and integration tests pass
- ✅ Excel round-trip preserves data
- ✅ PDF export generates successfully
- ✅ Audit trail captures all changes
- ✅ Role-based access control works

### Performance
- ✅ Table loads in <2 seconds (1000 rows)
- ✅ Cell edits save in <500ms
- ✅ Analytics filters update in <1 second
- ✅ PDF export completes in <15 seconds

### UX
- ✅ Inline editing works smoothly
- ✅ Sticky headers remain visible
- ✅ Mobile responsive on tablets/phones
- ✅ Error messages are clear and helpful

### Quality
- ✅ Backend: 80%+ code coverage
- ✅ Frontend: 70%+ code coverage
- ✅ No console errors or warnings
- ✅ Passes accessibility audit (WCAG AA)

## 📚 Technology Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Validation**: class-validator decorators
- **Testing**: Jest for unit and property tests

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts (consistent with AOG Analytics)
- **PDF Export**: jsPDF + html2canvas
- **Excel Processing**: xlsx library
- **UI Components**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest + React Testing Library

## 📞 Support

### Questions During Implementation

If you encounter any issues or have questions:

1. **Check the spec documents** - Most questions are answered in the docs
2. **Review related sections** - Cross-reference between requirements, design, and tasks
3. **Ask for clarification** - If something is unclear, ask before proceeding
4. **Update the docs** - If you find gaps or errors, update the spec

### Spec Updates

If you need to update the specification:

1. **Update the relevant document** (requirements, design, or tasks)
2. **Ensure consistency** across all documents
3. **Add a note** explaining why the change was made
4. **Get approval** before implementing the change

## 🎯 Next Steps

1. **Read the spec documents** in the recommended order
2. **Ask clarifying questions** if anything is unclear
3. **Start implementation** with Task 1 (backend module structure)
4. **Follow task list sequentially** with checkpoints
5. **Test continuously** (don't wait until the end)
6. **Update docs** if you find gaps or errors

## 📝 Document Change Log

| Date | Document | Change | Author |
|------|----------|--------|--------|
| 2025-02-08 | All | Initial specification created | Kiro AI |

## 📄 License

This specification is proprietary to Alpha Star Aviation and is confidential. Do not distribute without authorization.

---

**Ready to implement!** 🚀

The specification is complete and comprehensive. All requirements, design decisions, and implementation tasks are documented. You can now proceed with implementation following the task list in `tasks.md`.

