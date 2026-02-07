# AOG Analytics - Quick Start Guide

## What Was Fixed

✅ **Analytics page now uses the correct component** that displays three-bucket downtime analytics
✅ **PDF export functionality added** with dynamic filenames based on filters
✅ **Cost calculation improved** to use new simplified cost fields
✅ **Fleet groups expanded** to include all aircraft types

## How to Use the Analytics Page

### 1. Access the Page
Navigate to: **AOG → Analytics** in the sidebar menu

Or directly: `http://localhost:5173/aog/analytics`

### 2. Understanding the Three-Bucket Model

The analytics page breaks down AOG downtime into three categories:

| Bucket | What It Measures | Example |
|--------|------------------|---------|
| **Technical** | Troubleshooting + Installation work | Diagnosing issue, installing parts |
| **Procurement** | Waiting for parts to arrive | Part ordered but not yet received |
| **Ops** | Operational testing | Post-repair validation flights |

### 3. Using Filters

#### Date Range Filters
- **All Time**: Shows all AOG events (default)
- **Last 7 Days**: Events from the past week
- **Last 30 Days**: Events from the past month
- **This Month**: Events in the current calendar month
- **Last Month**: Events from the previous calendar month
- **Custom Range**: Pick specific start and end dates

#### Aircraft Filters
- **Fleet Group**: Filter by aircraft type (A340, A330, G650ER, etc.)
- **Aircraft**: Filter by specific tail number (HZ-A42, HZ-SKY, etc.)

**Note**: Fleet and Aircraft filters are mutually exclusive. Selecting one clears the other.

### 4. Reading the Dashboard

#### Summary Cards (Top Row)
- **Total Events**: Number of AOG events in the selected period
- **Active AOG**: Currently unresolved AOG events
- **Total Downtime**: Sum of all downtime hours
- **Avg Downtime**: Average hours per event
- **Total Cost**: Sum of all AOG-related costs

#### Bucket Summary Cards (Second Row)
- Shows hours and percentage for each bucket
- Helps identify where most time is spent

#### Three-Bucket Charts
- **Bar Chart**: Visual comparison of hours in each bucket
- **Pie Chart**: Percentage distribution across buckets

#### Per-Aircraft Breakdown Table
- Detailed breakdown by aircraft registration
- Shows technical, procurement, and ops hours for each aircraft
- Sortable columns
- Export to Excel functionality

#### Event Timeline (Bottom)
- Recent events in chronological order
- Shows category, responsible party, and duration
- Click to view full event details

### 5. Exporting to PDF

1. Apply desired filters (date range, fleet, aircraft)
2. Click **"Export PDF"** button in the top-right corner
3. PDF will download with a descriptive filename

**Filename Format**:
- `aog-analytics-all-time.pdf` (no filters)
- `aog-analytics-2025-01-01-to-2025-01-31.pdf` (date range)
- `aog-analytics-2025-01-01-to-2025-01-31-A340.pdf` (with fleet filter)
- `aog-analytics-2025-01-01-to-2025-01-31-HZ-A42.pdf` (with aircraft filter)

## Troubleshooting

### "No data available" Message

**Possible Causes**:

1. **No AOG events in database**
   - **Solution**: Run the seed script to create sample data
   ```bash
   cd backend
   npx ts-node -r tsconfig-paths/register src/scripts/seed-milestone-aog.ts
   ```

2. **Filters too restrictive**
   - **Solution**: Try "All Time" with no aircraft/fleet filter
   - Clear all filters and see if data appears

3. **Backend not running**
   - **Solution**: Start the backend server
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Frontend not connected to backend**
   - **Solution**: Check that frontend is pointing to correct API URL
   - Default: `http://localhost:3000/api`

### Charts Not Displaying

**Possible Causes**:

1. **Data exists but no milestone timestamps**
   - **Solution**: Events need milestone fields for three-bucket analytics
   - Legacy events will show in timeline but not in bucket charts

2. **Browser console errors**
   - **Solution**: Open browser DevTools (F12) and check Console tab
   - Look for API errors or JavaScript errors

### PDF Export Not Working

**Possible Causes**:

1. **Browser popup blocker**
   - **Solution**: Allow popups for this site

2. **Large dataset**
   - **Solution**: Apply filters to reduce data size before exporting

## Tips for Best Results

### 1. Start Broad, Then Narrow
- Begin with "All Time" to see all data
- Then apply filters to focus on specific periods or aircraft

### 2. Compare Time Periods
- Use "This Month" vs "Last Month" to see trends
- Use custom ranges to compare specific periods

### 3. Identify Bottlenecks
- Look at bucket percentages
- High procurement time? → Supply chain issues
- High technical time? → Complex repairs or training needs
- High ops time? → Testing process delays

### 4. Track by Fleet
- Compare different fleet groups
- Identify which aircraft types have more issues

### 5. Monitor Active AOG
- Keep an eye on the "Active AOG" card
- High number indicates current operational impact

## Key Metrics to Watch

### Fleet Health Indicators
- **Active AOG Count**: Should be as low as possible
- **Average Downtime**: Lower is better (target: < 24 hours)
- **Procurement Time %**: High percentage indicates supply chain issues

### Cost Efficiency
- **Total Cost**: Track spending trends
- **Cost per Event**: Calculate by dividing total cost by total events

### Operational Impact
- **Total Downtime Hours**: Direct impact on fleet availability
- **Events per Aircraft**: Identify problem aircraft

## Related Pages

- **AOG List**: View and manage individual AOG events
- **AOG Log**: Create new AOG events
- **AOG Detail**: View detailed information for a specific event

## Need Help?

- Check the **Help Center** (Help icon in sidebar)
- Review the **AOG Analytics User Guide** (`AOG-ANALYTICS-USER-GUIDE.md`)
- See the **System Architecture** (`.kiro/steering/system-architecture.md`)

---

**Quick Reference Card**

| Action | How To |
|--------|--------|
| View all AOG data | Select "All Time" date range |
| Filter by aircraft type | Use "Fleet Group" dropdown |
| Filter by specific aircraft | Use "Aircraft" dropdown |
| Export to PDF | Click "Export PDF" button |
| See recent events | Scroll to "Event Timeline" section |
| Compare aircraft | Check "Per-Aircraft Breakdown" table |
| Identify bottlenecks | Look at three-bucket chart percentages |

---

**Last Updated**: February 3, 2026
