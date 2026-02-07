# PDF Export OKLCH Fix - Testing Guide

## Quick Test

1. **Start the application**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Open browser to `http://localhost:5173`
   - Login with credentials
   - Go to Dashboard page

3. **Test PDF Export**:
   - Click the "PDF Report" button in the top-right
   - Wait for generation (10-15 seconds)
   - Verify PDF downloads successfully

## Expected Results

### ✅ Success Indicators

1. **No console errors** - Check browser console for errors
2. **PDF downloads** - File named `AlphaStar-Executive-Summary-YYYY-MM-DD.pdf`
3. **PDF opens correctly** - Can view in PDF reader
4. **All content visible** - Charts, text, cards all rendered
5. **Colors are correct** - White backgrounds, dark text, visible borders
6. **High quality** - Text is crisp and readable

### ❌ Failure Indicators

1. **Console error**: "Attempting to parse an unsupported color function"
2. **PDF is blank** or partially rendered
3. **Colors are wrong** (dark backgrounds, invisible text)
4. **Charts are missing** or broken
5. **Text is blurry** or pixelated

## Detailed Testing Checklist

### Visual Quality Tests

- [ ] **Header Section**
  - [ ] Alpha Star Aviation logo/title visible
  - [ ] Date range displayed correctly
  - [ ] Report generation timestamp present

- [ ] **KPI Cards**
  - [ ] All 4 primary KPI cards visible
  - [ ] Numbers are readable
  - [ ] Icons are visible
  - [ ] Borders are present

- [ ] **Charts**
  - [ ] Trend charts render correctly
  - [ ] Bar charts have visible bars
  - [ ] Chart labels are readable
  - [ ] Legend is visible
  - [ ] Colors are distinguishable

- [ ] **Fleet Health Gauge**
  - [ ] Circular gauge renders
  - [ ] Score number is visible
  - [ ] Color coding is correct

- [ ] **Alerts Panel**
  - [ ] Alert cards visible
  - [ ] Priority colors correct
  - [ ] Text is readable

- [ ] **Footer**
  - [ ] Confidential notice present
  - [ ] Timestamp visible

### Color Tests

Test in both light and dark mode:

- [ ] **Light Mode**
  - [ ] White backgrounds
  - [ ] Dark text (#1f2937)
  - [ ] Gray borders (#e2e8f0)
  - [ ] Aviation blue accent (#0891b2)

- [ ] **Dark Mode**
  - [ ] Converts to light for PDF
  - [ ] No dark backgrounds in PDF
  - [ ] Text is dark and readable

### Browser Compatibility Tests

- [ ] **Chrome/Edge**
  - [ ] PDF generates without errors
  - [ ] Colors are correct
  - [ ] Charts render properly

- [ ] **Firefox**
  - [ ] PDF generates without errors
  - [ ] Colors are correct
  - [ ] Charts render properly

- [ ] **Safari** (if available)
  - [ ] PDF generates without errors
  - [ ] Colors are correct
  - [ ] Charts render properly

### Performance Tests

- [ ] **Generation Time**
  - [ ] Completes in < 20 seconds
  - [ ] Progress indicator shows

- [ ] **File Size**
  - [ ] PDF is < 3MB
  - [ ] Reasonable for email attachment

- [ ] **Memory Usage**
  - [ ] No memory leaks
  - [ ] Browser remains responsive

## Console Verification

Open browser DevTools (F12) and check for:

### ✅ Expected Console Output

```
[PDF Export] Starting generation...
[PDF Export] Dashboard content found
[PDF Export] Wrapper created
[PDF Export] Styles applied
[PDF Export] Canvas generated
[PDF Export] PDF created successfully
```

### ❌ Errors to Watch For

```
❌ Attempting to parse an unsupported color function "oklch"
❌ Dashboard content not found
❌ html2canvas failed
❌ TypeError: Cannot read property 'style' of null
```

## Manual Color Inspection

1. **Open generated PDF**
2. **Zoom to 200%**
3. **Check these elements**:

   - Text color should be dark gray/black
   - Backgrounds should be white or light gray
   - Borders should be visible light gray
   - Charts should have distinct colors
   - No invisible text
   - No dark backgrounds

## Automated Test (Optional)

If you want to automate testing:

```javascript
// test-pdf-export.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to dashboard
  await page.goto('http://localhost:5173');
  
  // Login
  await page.type('input[type="email"]', 'admin@alphastarav.com');
  await page.type('input[type="password"]', 'Admin@123!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForSelector('[data-pdf-content]');
  
  // Click PDF export button
  await page.click('button:has-text("PDF Report")');
  
  // Wait for download
  await page.waitForTimeout(15000);
  
  // Check for errors
  const errors = await page.evaluate(() => {
    return window.console.errors || [];
  });
  
  if (errors.length === 0) {
    console.log('✅ PDF export test passed');
  } else {
    console.log('❌ PDF export test failed:', errors);
  }
  
  await browser.close();
})();
```

## Regression Testing

After the fix, verify these scenarios still work:

- [ ] **Dashboard loads normally** without PDF export
- [ ] **Charts render correctly** in browser
- [ ] **Theme switching** works (light/dark mode)
- [ ] **Filters work** (date range, aircraft selection)
- [ ] **Other export functions** still work (Excel, CSV)
- [ ] **Navigation** to other pages works

## Troubleshooting

### Problem: PDF is still blank

**Check**:
1. Is `data-pdf-content` attribute present on dashboard container?
2. Are there any console errors?
3. Try increasing wait time in `ExecutivePDFExport.tsx`

### Problem: Colors are still wrong

**Check**:
1. Verify `pdfColors` palette in `applyPDFStyles()`
2. Check if CSS custom properties are being replaced
3. Inspect the cloned document in debugger

### Problem: Charts are missing

**Check**:
1. Increase wait time before capture
2. Verify Recharts components are rendering
3. Check if chart containers have proper dimensions

### Problem: Text is blurry

**Check**:
1. Verify `scale: 2` in html2canvas options
2. Check PDF viewer zoom level
3. Try increasing scale to 3 for higher quality

## Success Criteria

The fix is successful if:

1. ✅ PDF generates without "oklch" error
2. ✅ All dashboard content is visible in PDF
3. ✅ Colors are appropriate for print (light backgrounds, dark text)
4. ✅ Charts render correctly with visible data
5. ✅ Text is crisp and readable
6. ✅ File size is reasonable (< 3MB)
7. ✅ Generation completes in < 20 seconds
8. ✅ Works in all major browsers

## Reporting Issues

If you encounter issues, provide:

1. **Browser and version**
2. **Console error messages**
3. **Screenshot of dashboard before export**
4. **Screenshot of generated PDF (if any)**
5. **Steps to reproduce**
6. **Expected vs actual behavior**

## Next Steps

After successful testing:

1. ✅ Mark fix as verified
2. ✅ Update documentation
3. ✅ Deploy to staging
4. ✅ User acceptance testing
5. ✅ Deploy to production

---

**Test Date**: February 4, 2026  
**Tester**: [Your Name]  
**Status**: [ ] Pass / [ ] Fail  
**Notes**: _____________________
