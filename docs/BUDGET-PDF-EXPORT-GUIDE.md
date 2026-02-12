# Budget Analytics PDF Export - User Guide

## Quick Start

1. Navigate to **Budget Projects** → Select a project → Click **Analytics** tab
2. Apply any desired filters (date range, aircraft type, term search)
3. Wait for all charts to load completely
4. Click **"Export to PDF"** button in the top-right corner
5. Wait 10-15 seconds while the PDF generates
6. PDF will download automatically

## What's Included in the PDF

### 📄 Page 1: Cover Page
- Project name and date range
- Template type (e.g., RSAF)
- Applied filters (if any)
- Generation timestamp
- Company branding

### 📊 Page 2: KPI Summary
- **Total Budgeted**: Total planned budget amount
- **Total Spent**: Total actual expenditure
- **Remaining Budget**: Budget still available
- **Budget Utilization**: Percentage of budget used
- **Burn Rate**: Average monthly spending
- **Forecast**: Estimated months until budget depletion

### 📈 Pages 3-8: Chart Visualizations
1. **Monthly Spend by Term**: Stacked bar chart showing spending trends
2. **Cumulative Spend vs Budget**: Line chart comparing actual vs planned
3. **Spend Distribution by Category**: Pie chart of spending breakdown
4. **Budgeted vs Spent by Aircraft Type**: Grouped bar chart comparison
5. **Top 5 Overspend Terms**: Horizontal bar chart of biggest overruns
6. **Spending Heatmap**: Grid showing spending intensity over time

### 📋 Last Page: Top 5 Overspend Table
- Detailed table with columns:
  - Spending Term name
  - Budgeted amount
  - Spent amount
  - Variance (overspend)

### 🔢 All Pages: Footer
- Page numbers (e.g., "Page 3 of 10")
- Confidentiality notice
- System name

## Filters and Customization

### Date Range Filter
- Filter by specific date range within project period
- Useful for quarterly or monthly reports
- Shows on cover page

### Aircraft Type Filter
- Filter by specific aircraft type (A330, G650ER, etc.)
- Useful for fleet-specific reports
- Shows on cover page

### Term Search Filter
- Search for specific spending terms
- Useful for focused analysis
- Shows on cover page

## Best Practices

### Before Exporting

✅ **Apply filters first**: Set all desired filters before clicking export

✅ **Wait for charts to load**: Ensure all charts are visible (no loading spinners)

✅ **Maximize browser window**: Larger window = better chart quality

✅ **Stable internet**: Ensure good connection for chart rendering

### During Export

⏳ **Don't close the page**: Keep browser tab open during generation

⏳ **Be patient**: Generation takes 10-15 seconds

⏳ **Watch the button**: Button shows "Generating PDF..." with spinner

### After Export

📄 **Check all pages**: Verify all sections are included

📄 **Verify chart quality**: Ensure charts are clear and readable

📄 **Save with descriptive name**: Rename file if needed (default: `{project-name}-analytics-{date}.pdf`)

## Troubleshooting

### Export Button Disabled
**Problem**: Button is grayed out and can't be clicked

**Solution**: Wait for all charts to finish loading. Look for loading spinners or skeleton screens.

### Export Failed Error
**Problem**: Error message appears after clicking export

**Solutions**:
1. Refresh the page and try again
2. Check internet connection
3. Clear browser cache
4. Try a different browser

### Missing Charts in PDF
**Problem**: Some charts are blank or missing in the PDF

**Solutions**:
1. Wait longer before clicking export (ensure all charts are visible)
2. Scroll down to ensure all charts have rendered
3. Refresh page and try again

### Low Quality Charts
**Problem**: Charts appear blurry or pixelated in PDF

**Solutions**:
1. Maximize browser window before exporting
2. Ensure browser zoom is at 100%
3. Use a modern browser (Chrome, Firefox, Edge)

### PDF Too Large
**Problem**: PDF file size is very large (>5 MB)

**Explanation**: This is normal for reports with many charts. PDFs are captured at high resolution (2x scale) for print quality.

**Solutions**:
1. Apply filters to reduce data shown
2. Use PDF compression tools if needed
3. Consider exporting specific sections only (future feature)

## File Naming Convention

Default filename format:
```
{project-name}-analytics-{date}.pdf

Examples:
- RSAF-FY2025-Budget-analytics-2026-02-08.pdf
- A330-Fleet-Budget-analytics-2026-02-08.pdf
```

## Use Cases

### 📊 Executive Presentations
- Export with "All Time" date range
- Include all aircraft types
- Use for board meetings and stakeholder updates

### 📈 Monthly Reports
- Export with current month date range
- Compare to previous month
- Track budget utilization trends

### 🔍 Variance Analysis
- Export with term search filter
- Focus on specific spending categories
- Identify overspend root causes

### ✈️ Fleet-Specific Reports
- Export with aircraft type filter
- Compare fleet performance
- Allocate resources effectively

## Technical Specifications

| Specification | Value |
|---------------|-------|
| Page Size | A4 (210 × 297 mm) |
| Orientation | Portrait |
| Resolution | 300 DPI equivalent (2x scale) |
| File Format | PDF 1.3 |
| Typical File Size | 2-3 MB |
| Generation Time | 10-15 seconds |
| Typical Page Count | 8-12 pages |

## Keyboard Shortcuts

Currently, there are no keyboard shortcuts for PDF export. Use the mouse to click the "Export to PDF" button.

## Browser Compatibility

✅ **Fully Supported**:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

⚠️ **Limited Support**:
- Internet Explorer (not recommended)
- Older browser versions (may have issues)

## Privacy and Security

- PDFs are generated **client-side** (in your browser)
- No data is sent to external servers
- PDFs include "Confidential" notice on all pages
- Suitable for internal and client presentations

## Accessibility

- PDF text is selectable and searchable
- Page numbers aid navigation
- High-contrast colors for readability
- Professional layout suitable for printing

## Printing the PDF

The PDF is optimized for printing:
- A4 paper size
- Portrait orientation
- High-resolution charts (300 DPI)
- Proper margins and spacing
- Page numbers for multi-page documents

## Frequently Asked Questions

### Q: Can I customize the cover page?
**A**: Not currently. The cover page uses standard branding and layout.

### Q: Can I export only specific charts?
**A**: Not currently. All charts are included in the export.

### Q: Can I schedule automatic exports?
**A**: Not currently. Exports must be triggered manually.

### Q: Can I export to Excel instead?
**A**: Yes, use the "Export to Excel" button (Task 18) for raw data export.

### Q: Why does it take 10-15 seconds?
**A**: The system captures high-resolution screenshots of all charts, which takes time to ensure quality.

### Q: Can I export multiple projects at once?
**A**: Not currently. Export one project at a time.

### Q: Is there a file size limit?
**A**: No hard limit, but typical PDFs are 2-3 MB. Very large datasets may produce larger files.

### Q: Can I email the PDF directly?
**A**: Not currently. Download the PDF and attach it to your email manually.

## Support

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Try refreshing the page
3. Try a different browser
4. Contact your system administrator

## Version History

**v1.0** (February 2026)
- Initial release
- Multi-page PDF support
- High-resolution chart capture
- Professional cover page and KPI summary
- Top 5 overspend table
- Page numbers and footers

---

**Last Updated**: February 8, 2026  
**Version**: 1.0  
**Feature**: Budget Analytics PDF Export  
**Task**: 17 - Implement PDF export functionality
