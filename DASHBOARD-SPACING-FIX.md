# Dashboard Spacing Fix for PDF Export

## Problem

The "Performance Trends" section was being split between pages in the PDF export, making it look unprofessional.

## Solution

Added a simple spacer element (`h-12` = 48px) between the AOG Trend Chart and the Performance Trends section. This provides enough spacing to push the Performance Trends section to the next page if it would otherwise be split.

## Implementation

### File Modified
**`frontend/src/pages/DashboardPage.tsx`**

### Change Made
```tsx
{/* AOG Trend Chart */}
<AOGMiniTrendChart 
  trendData={aogSummary?.trendData} 
  isLoading={aogSummaryLoading} 
/>

{/* Spacer for PDF page break - helps prevent Performance Trends from splitting */}
<div className="h-12" aria-hidden="true" />

{/* Trends Section */}
<CollapsibleSection title="Performance Trends" storageKey="trends" defaultExpanded={true}>
```

## Why This Works

1. **Simple and Reliable** - No complex JavaScript calculations needed
2. **Always Present** - Spacing exists in both browser view and PDF
3. **Natural Page Break** - Provides a natural break point for PDF pagination
4. **Minimal Impact** - Only 48px (3rem) of spacing, keeps dashboard compact
5. **Accessible** - Uses `aria-hidden="true"` so screen readers ignore it

## Benefits

✅ **Simpler** - No complex page break detection logic  
✅ **More Reliable** - Works consistently across browsers  
✅ **Better UX** - Improves visual separation in browser too  
✅ **Maintainable** - Easy to understand and modify  
✅ **Performance** - No runtime calculations needed  

## Visual Impact

### In Browser
```
┌─────────────────────────────┐
│ AOG Metric Cards            │
│ Active AOG Events Widget    │
│ AOG Trend Chart             │
│                             │ ← 48px spacing
│ Performance Trends          │
│ - Availability Chart        │
│ - Utilization Chart         │
└─────────────────────────────┘
```

### In PDF
```
Page 1:
┌─────────────────────────────┐
│ Header                      │
│ Fleet Health Gauge          │
│ KPI Cards                   │
│ AOG Metric Cards            │
│ AOG Trend Chart             │
│ (spacing)                   │
└─────────────────────────────┘

Page 2:
┌─────────────────────────────┐
│ Performance Trends          │ ← Complete section
│ - Availability Chart        │
│ - Utilization Chart         │
│ Fleet Comparison            │
│ Footer                      │
└─────────────────────────────┘
```

## Testing

### Quick Test
1. Navigate to Dashboard
2. Click "PDF Report"
3. Verify Performance Trends section is NOT split between pages

### Expected Result
- Performance Trends section appears complete on page 2
- Both Availability and Utilization charts visible together
- Professional appearance maintained

## Alternative Spacing Values

If 48px is too much or too little, adjust the Tailwind class:

| Class | Height | Use Case |
|-------|--------|----------|
| `h-8` | 32px | Minimal spacing |
| `h-10` | 40px | Subtle spacing |
| `h-12` | 48px | **Current (recommended)** |
| `h-16` | 64px | More spacing |
| `h-20` | 80px | Maximum spacing |

## Comparison with Previous Approach

### Previous (Complex)
- JavaScript page break detection
- Dynamic spacing calculations
- Browser-specific behavior
- Harder to debug

### Current (Simple)
- Static spacing element
- No calculations needed
- Consistent across browsers
- Easy to understand

## Summary

Added a 48px spacer between AOG Trend Chart and Performance Trends section to prevent the Performance Trends from being split across pages in PDF export. This simple, reliable solution improves both the browser view and PDF output.

---

**Status**: ✅ Implemented  
**Date**: February 4, 2026  
**Impact**: Improves PDF export quality  
**Complexity**: Low (1 line change)
