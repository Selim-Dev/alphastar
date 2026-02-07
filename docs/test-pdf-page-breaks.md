# PDF Page Break Fix - Testing Guide

## Quick Test

1. **Generate PDF**:
   - Navigate to Dashboard
   - Click "PDF Report" button
   - Wait for generation

2. **Open PDF** and check:
   - Performance Trend chart is NOT split between pages
   - All charts are complete on single pages
   - No awkward splits in the middle of content

## Visual Inspection Checklist

### Page 1 Content
- [ ] Header with logo and date
- [ ] Fleet Health Score gauge (complete)
- [ ] KPI cards (all 4 complete)
- [ ] Status summary bar (complete)
- [ ] No partial charts at bottom

### Page 2 Content
- [ ] Performance Trend chart (COMPLETE - not split)
- [ ] Chart title is with the chart
- [ ] Chart is readable and not cut off
- [ ] Proper spacing before chart

### General Checks
- [ ] No charts split between pages
- [ ] No grid layouts split between pages
- [ ] Titles stay with their content
- [ ] Reasonable white space (not excessive)
- [ ] Professional appearance

## Console Verification

Open browser DevTools (F12) and look for:

```
[PDF] Pushing section 5 to next page (height: 450px, would split at: 650px)
[PDF] Pushing section 7 to next page (height: 380px, would split at: 720px)
```

These logs indicate sections were detected and moved to avoid splitting.

## Expected Behavior

### ✅ Good PDF Layout

```
┌─────────────────────────────────────┐
│ Page 1                              │
│ ─────────────────────────────────── │
│ Header                              │
│ Fleet Health Gauge                  │
│ KPI Cards (4 cards)                 │
│ Status Summary Bar                  │
│ (spacing)                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Page 2                              │
│ ─────────────────────────────────── │
│ Performance Trend Chart (COMPLETE)  │
│ Fleet Comparison                    │
│ Footer                              │
└─────────────────────────────────────┘
```

### ❌ Bad PDF Layout (Before Fix)

```
┌─────────────────────────────────────┐
│ Page 1                              │
│ ─────────────────────────────────── │
│ Header                              │
│ Fleet Health Gauge                  │
│ KPI Cards (4 cards)                 │
│ Status Summary Bar                  │
│ Performance Trend (TOP HALF) ❌     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Page 2                              │
│ ─────────────────────────────────── │
│ Performance Trend (BOTTOM HALF) ❌  │
│ Fleet Comparison                    │
│ Footer                              │
└─────────────────────────────────────┘
```

## Specific Test Cases

### Test Case 1: Performance Trend Chart
**Expected**: Chart appears complete on page 2
**Check**: 
- [ ] Chart title visible
- [ ] All data points visible
- [ ] Legend visible
- [ ] No cut-off at top or bottom

### Test Case 2: Fleet Comparison
**Expected**: Both top and bottom performers visible together
**Check**:
- [ ] Top 3 performers visible
- [ ] Bottom 3 performers visible
- [ ] Not split between pages

### Test Case 3: Grid Layouts
**Expected**: All cards in a grid stay together
**Check**:
- [ ] KPI cards (4 cards) all on same page
- [ ] Cost efficiency cards together
- [ ] No grid split between pages

### Test Case 4: Chart Titles
**Expected**: Titles stay with their charts
**Check**:
- [ ] "Performance Trend" title with chart
- [ ] "Fleet Comparison" title with content
- [ ] No orphaned titles at bottom of page

## Regression Testing

Ensure these still work:

- [ ] PDF generates without errors
- [ ] Colors are correct (white backgrounds, dark text)
- [ ] All content is visible
- [ ] Charts render correctly
- [ ] File size is reasonable (< 3MB)
- [ ] Generation time is acceptable (< 20 seconds)

## Browser Testing

Test in multiple browsers:

### Chrome/Edge
- [ ] Page breaks work correctly
- [ ] No split charts
- [ ] Console logs appear

### Firefox
- [ ] Page breaks work correctly
- [ ] No split charts
- [ ] Console logs appear

### Safari (if available)
- [ ] Page breaks work correctly
- [ ] No split charts
- [ ] Console logs appear

## Troubleshooting

### Problem: Chart still splits

**Check console for:**
```
[PDF] Pushing section X to next page...
```

If no logs appear:
1. Section may not match selectors
2. Section may be too tall (> 80% page height)
3. Function may not be called

**Solution:**
- Add specific selector for your chart
- Check if `addPageBreakHints()` is called
- Verify section has correct class names

### Problem: Too much white space

**Possible causes:**
- Multiple sections pushed to next page
- Spacing calculation too aggressive

**Solution:**
- Reduce spacing buffer in code (20px → 10px)
- Adjust page height calculation
- Check if sections can be made smaller

### Problem: No console logs

**Check:**
1. Is DevTools open?
2. Is console filter set to "All"?
3. Are there any errors preventing execution?

**Solution:**
- Open DevTools before clicking "PDF Report"
- Clear console and try again
- Check for JavaScript errors

## Success Criteria

The fix is successful if:

1. ✅ Performance Trend chart is NOT split between pages
2. ✅ All charts appear complete on single pages
3. ✅ Titles stay with their content
4. ✅ No excessive white space
5. ✅ Professional appearance maintained
6. ✅ Console shows page break adjustments
7. ✅ Works in all major browsers

## Reporting Issues

If you find issues, provide:

1. **Screenshot of PDF** showing the split
2. **Console logs** from PDF generation
3. **Browser and version**
4. **Dashboard content** (which sections are visible)
5. **Expected vs actual** page breaks

## Next Steps

After successful testing:

1. ✅ Verify in development
2. ✅ Test with different dashboard configurations
3. ✅ Test with different date ranges (more/less data)
4. ✅ Deploy to staging
5. ✅ User acceptance testing
6. ✅ Deploy to production

---

**Test Date**: February 4, 2026  
**Tester**: [Your Name]  
**Status**: [ ] Pass / [ ] Fail  
**Notes**: _____________________

## Additional Notes

- The fix uses CSS page break properties which are well-supported
- Page height calculations are approximate (96 DPI)
- Very tall sections (> 80% page) may still split (by design)
- Console logs help debug page break decisions
