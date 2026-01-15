# AOG Workflow Quick Reference

## Simplified Milestone-Based Workflow

### Overview
The AOG workflow now uses **milestone timestamps** instead of complex state transitions. Set timestamps as events occur, and the system automatically calculates downtime in three buckets.

---

## Milestone Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. REPORTED                                                    │
│     └─> When AOG was detected                                   │
│         [Required]                                              │
│                                                                 │
│  2. PROCUREMENT REQUESTED                                       │
│     └─> When parts were requested                               │
│         [Optional - skip if no parts needed]                    │
│                                                                 │
│  3. AVAILABLE AT STORE                                          │
│     └─> When parts arrived                                      │
│         [Optional - only if parts were ordered]                 │
│                                                                 │
│  4. ISSUED BACK                                                 │
│     └─> When parts issued to maintenance                        │
│         [Optional - tracking point]                             │
│                                                                 │
│  5. INSTALLATION COMPLETE                                       │
│     └─> When repair work finished                               │
│         [Required]                                              │
│                                                                 │
│  6. TEST START                                                  │
│     └─> When ops testing started                                │
│         [Optional - skip if no ops test]                        │
│                                                                 │
│  7. UP & RUNNING                                                │
│     └─> When aircraft returned to service                       │
│         [Required]                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Three Downtime Buckets

### 🔧 Technical Time (Blue)
**Formula**: `(Reported → Procurement Requested) + (Available at Store → Installation Complete)`

**What it measures**: Time spent on troubleshooting and installation work

**High technical time indicates**:
- Complex troubleshooting required
- Difficult installation procedures
- Need for specialized skills/tools

### 📦 Procurement Time (Amber)
**Formula**: `(Procurement Requested → Available at Store)`

**What it measures**: Time waiting for parts to arrive

**High procurement time indicates**:
- Supply chain delays
- Part availability issues
- Vendor performance problems

### ✈️ Ops Time (Purple)
**Formula**: `(Test Start → Up & Running)`

**What it measures**: Time spent on operational testing and validation

**High ops time indicates**:
- Testing delays
- Operational approval bottlenecks
- Pilot/crew availability issues

---

## Common Scenarios

### Scenario 1: Standard AOG (All Milestones)
```
Reported → Procurement Requested → Available at Store → 
Issued Back → Installation Complete → Test Start → Up & Running

Result: All three buckets have values
```

### Scenario 2: No Parts Needed
```
Reported → [SKIP PROCUREMENT] → Installation Complete → Up & Running

Result: 
- Technical Time: Full downtime
- Procurement Time: 0
- Ops Time: 0
```

### Scenario 3: Parts Already in Store
```
Reported → Procurement Requested (same time) → Available at Store (same time) → 
Installation Complete → Up & Running

Result:
- Technical Time: Most of downtime
- Procurement Time: 0 or near-zero
- Ops Time: 0
```

### Scenario 4: No Ops Test Required
```
Reported → Procurement Requested → Available at Store → 
Installation Complete → [SKIP TEST] → Up & Running

Result:
- Technical Time: Troubleshooting + Installation
- Procurement Time: Waiting for parts
- Ops Time: 0
```

---

## How to Use the System

### Creating a New AOG Event

1. **Navigate**: Go to AOG → Log Event
2. **Fill Basic Info**: Aircraft, category, reason, responsible party
3. **Set Reported Time**: Defaults to detection time (can adjust)
4. **Save**: Event is created with initial milestone

### Updating Milestones

1. **Open Event**: Click on event from AOG list
2. **Go to Milestones Tab**: View current milestone timeline
3. **Click "Edit Milestones"**: Opens edit form
4. **Set Timestamps**: Fill in milestones as they occur
5. **Save**: System computes downtime automatically

### Viewing History

1. **Open Event**: Click on event from AOG list
2. **Go to History Tab**: View audit trail
3. **See Changes**: Who set what milestone and when

### Understanding Next Steps

1. **Right Sidebar**: "Suggested Next Step" panel
2. **Guidance**: Shows what milestone to set next
3. **Context**: Explains why that milestone is next
4. **Flexibility**: Can skip optional milestones

---

## Best Practices

### ✅ Do's

- **Set milestones as they occur** - Don't wait until the end
- **Skip optional milestones** - If no parts needed, skip procurement
- **Use accurate timestamps** - Precision matters for analytics
- **Add notes** - Document why milestones were set
- **Review history** - Check audit trail for accuracy

### ❌ Don'ts

- **Don't backfill all at once** - Set milestones in real-time
- **Don't guess timestamps** - Use actual times
- **Don't skip required milestones** - Reported, Installation Complete, Up & Running are mandatory
- **Don't set out-of-order** - System validates chronological order

---

## Validation Rules

### Chronological Order
```
reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt ≤ 
issuedBackAt ≤ installationCompleteAt ≤ testStartAt ≤ upAndRunningAt
```

### Required Milestones
- `reportedAt` - Always required (defaults to detectedAt)
- `installationCompleteAt` - Required for closed events
- `upAndRunningAt` - Required for closed events (defaults to clearedAt)

### Optional Milestones
- `procurementRequestedAt` - Only if parts needed
- `availableAtStoreAt` - Only if parts ordered
- `issuedBackAt` - Optional tracking point
- `testStartAt` - Only if ops test required

---

## Analytics & Reporting

### Dashboard View
- **Total Downtime**: Sum of all three buckets
- **Bucket Breakdown**: Percentage distribution
- **Bottleneck Identification**: Which bucket is highest

### Filters Available
- Aircraft
- Fleet Group
- Date Range
- Responsible Party

### Export Options
- Excel export with full milestone details
- PDF report with three-bucket charts
- CSV for custom analysis

---

## Troubleshooting

### "Timestamp validation error"
**Problem**: Milestones are out of chronological order

**Solution**: Check that each milestone is >= previous milestone

### "Metrics showing 0"
**Problem**: Computed metrics not calculating

**Solution**: Ensure both endpoints of calculation are set (e.g., for Procurement Time, need both procurementRequestedAt and availableAtStoreAt)

### "History not showing"
**Problem**: Milestone history is empty

**Solution**: History is only recorded when milestones are updated after initial creation. Legacy events don't have history.

### "Next Step not updating"
**Problem**: Suggested next step doesn't change

**Solution**: Refresh the page after saving milestones. The panel analyzes current state on load.

---

## Support & Documentation

- **Full Guide**: `.kiro/steering/aog-analytics-simplified.md`
- **Requirements**: `.kiro/specs/aog-analytics-simplification/requirements.md`
- **Design Decisions**: `.kiro/specs/aog-analytics-simplification/design.md`
- **Implementation Summary**: `AOG-SIMPLIFIED-WORKFLOW-SUMMARY.md`

---

**Quick Help**: Press `?` in the AOG module for in-app help (coming soon)

**Last Updated**: January 15, 2026
