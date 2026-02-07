# AOG Analytics User Guide - Enhanced Edition

## Overview

The AOG Analytics page is a comprehensive, visually stunning executive dashboard that provides deep insights into your fleet's Aircraft On Ground (AOG) events. With 10+ interactive visualizations, predictive analytics, and automated insights, this tool helps you identify patterns, bottlenecks, and opportunities for improvement.

## Accessing the Analytics Page

Navigate to **AOG** → **Analytics** from the main menu, or visit `/aog/analytics` directly.

## Page Layout

The enhanced analytics page is organized into seven major sections:

```
┌─────────────────────────────────────────────────────────────┐
│ Filters & Data Quality Indicator                            │
├─────────────────────────────────────────────────────────────┤
│ Summary Cards (4 key metrics)                               │
├─────────────────────────────────────────────────────────────┤
│ THREE-BUCKET ANALYSIS SECTION                               │
│ • Bucket Summary Cards                                       │
│ • Bar Chart & Pie Chart                                      │
│ • Bucket Trend Chart (NEW)                                   │
│ • Waterfall Chart (NEW)                                      │
├─────────────────────────────────────────────────────────────┤
│ TREND ANALYSIS SECTION (NEW)                                │
│ • Monthly Trend Chart                                        │
│ • Moving Average Chart                                       │
│ • Year-over-Year Comparison                                  │
├─────────────────────────────────────────────────────────────┤
│ AIRCRAFT PERFORMANCE SECTION (NEW)                          │
│ • Aircraft Heatmap                                           │
│ • Reliability Score Cards                                    │
├─────────────────────────────────────────────────────────────┤
│ ROOT CAUSE ANALYSIS SECTION (NEW)                           │
│ • Pareto Chart                                               │
│ • Category Breakdown Pie                                     │
│ • Responsibility Distribution                                │
├─────────────────────────────────────────────────────────────┤
│ COST ANALYSIS SECTION (NEW)                                 │
│ • Cost Breakdown Chart                                       │
│ • Cost Efficiency Metrics                                    │
├─────────────────────────────────────────────────────────────┤
│ PREDICTIVE ANALYTICS SECTION (NEW)                          │
│ • Forecast Chart                                             │
│ • Risk Score Gauges                                          │
│ • Automated Insights Panel                                   │
└─────────────────────────────────────────────────────────────┘
```

## Data Quality Indicator

At the very top of the page, you'll see a **Data Quality Badge** that shows:

### What It Shows
- **Completeness Percentage**: Percentage of events with complete milestone data
- **Color Coding**:
  - 🟢 Green (>80%): Excellent data quality
  - 🟡 Amber (50-80%): Fair data quality
  - 🔴 Red (<50%): Poor data quality

### Why It Matters
- Events with complete milestone timestamps enable three-bucket analytics
- Legacy events (without milestones) show total downtime only
- Higher data quality = more accurate insights

### How to Improve
- Update recent events with milestone timestamps
- Use the AOG Detail page to add missing milestones
- Follow the AOG Event Creation Guide for new events

---

## Summary Cards

At the top of the page, you'll see four key metrics:

### 1. Total Events
- **What it shows**: Total number of AOG events in the selected period
- **Color coding**: 
  - Green: < 10 events
  - Amber: 10-20 events
  - Red: > 20 events
- **Use case**: Track overall event volume
- **Trend indicator**: Shows increase/decrease vs previous period

### 2. Active Events
- **What it shows**: Number of currently active (unresolved) events
- **Color coding**: Always red to draw attention
- **Use case**: Immediate action items
- **Click to**: Navigate to active events list

### 3. Total Downtime
- **What it shows**: Cumulative hours of aircraft downtime
- **Format**: Displayed in hours or days depending on magnitude
- **Use case**: Understand fleet availability impact
- **Trend indicator**: Shows increase/decrease vs previous period

### 4. Average Duration
- **What it shows**: Mean duration of AOG events
- **Color coding**:
  - Green: < 24 hours
  - Amber: 24-72 hours
  - Red: > 72 hours
- **Use case**: Track resolution efficiency
- **Trend indicator**: Shows improvement/decline vs previous period

---

## THREE-BUCKET ANALYSIS SECTION

This section breaks down downtime into three actionable categories: Technical, Procurement, and Operations.

### Understanding the Three Buckets

**Technical Time** (Blue 🔵)
- Time spent on troubleshooting and installation work
- Includes: Diagnosis, repair work, component installation
- Formula: (Reported → Procurement Requested) + (Available at Store → Installation Complete)

**Procurement Time** (Amber 🟡)
- Time spent waiting for parts to arrive
- Includes: Ordering, shipping, customs clearance
- Formula: (Procurement Requested → Available at Store)

**Ops Time** (Green 🟢)
- Time spent on operational testing and validation
- Includes: Ground tests, flight tests, certification
- Formula: (Test Start → Up & Running)

### Bucket Summary Cards

Three cards showing:
- Total hours in each bucket
- Average hours per event
- Percentage of total downtime

**Interpretation:**
- **High Technical Time**: Complex troubleshooting or installation challenges
- **High Procurement Time**: Supply chain delays or parts availability issues
- **High Ops Time**: Testing delays or operational approval bottlenecks

### Three-Bucket Bar Chart

**What It Shows:**
- Side-by-side bars comparing the three buckets
- Total hours and average per event overlay

**How to Use:**
1. Identify which bucket is the primary bottleneck
2. Compare bucket sizes to understand where time is spent
3. Track changes over time by adjusting date range

### Three-Bucket Pie Chart

**What It Shows:**
- Percentage distribution of downtime across buckets
- Interactive segments with hover details

**How to Use:**
1. Hover over segments to see exact percentages
2. Look for disproportionate segments (e.g., Procurement > 50%)
3. Use as a quick visual indicator of primary bottleneck

### Bucket Trend Chart (NEW)

**What It Shows:**
- Stacked area chart showing how bucket times change over months
- Last 12 months of data with smooth curves

**How to Use:**
1. Identify trends in each bucket over time
2. Spot seasonal patterns (e.g., procurement delays in winter)
3. Verify if process improvements are working (declining trends)

**Example Insights:**
- Procurement time increasing → Supply chain issues
- Technical time decreasing → Improved troubleshooting processes
- Ops time stable → Consistent testing procedures

### Waterfall Chart (NEW)

**What It Shows:**
- Visual breakdown of how downtime accumulates
- Start bar → Technical → Procurement → Ops → Total bar

**How to Use:**
1. See the composition of total downtime at a glance
2. Understand the relative contribution of each bucket
3. Identify which bucket adds the most time

**Example:**
```
Start (0h) → +Technical (45h) → +Procurement (120h) → +Ops (15h) → Total (180h)
```

### Per-Aircraft Breakdown Table

**What It Shows:**
- Detailed breakdown by aircraft registration
- Columns: Registration, Technical Hours, Procurement Hours, Ops Hours, Total Hours

**How to Use:**
1. Sort by any column to identify outliers
2. Click on aircraft to drill down to specific events
3. Compare similar aircraft types to find patterns

---

## TREND ANALYSIS SECTION (NEW)

This section reveals patterns and trends over time to help you anticipate future issues.

### Monthly Trend Chart

**What It Shows:**
- Combo chart with bars (event count) and line (total downtime hours)
- Last 12 months of data
- Dual Y-axes for count and hours

**How to Use:**
1. Identify seasonal patterns (e.g., more events in summer)
2. Track improvement trends (declining line = good)
3. Spot anomalies (sudden spikes)
4. Correlate with operational changes or fleet additions

**What to Look For:**
- **Upward trend**: Investigate causes (aging fleet, maintenance gaps)
- **Downward trend**: Good - maintenance improvements working
- **Spikes**: Identify what happened that month
- **Seasonal patterns**: Plan maintenance accordingly

### Moving Average Chart

**What It Shows:**
- Line chart with two lines:
  - Solid blue line: Actual monthly downtime
  - Dashed gray line: 3-month moving average
- Shaded area showing variance

**How to Use:**
1. Smooth out monthly volatility to see true trends
2. Identify if recent months are above or below average
3. Use moving average for strategic planning

**Interpretation:**
- Actual above moving average → Recent performance worse than trend
- Actual below moving average → Recent performance better than trend
- Widening gap → Increasing volatility

### Year-over-Year Comparison

**What It Shows:**
- Grouped bar chart comparing current year vs previous year
- Same months side-by-side
- Delta indicators showing improvement/decline

**How to Use:**
1. Compare performance year-over-year
2. Identify if improvements are sustained
3. Benchmark against previous year's performance

**Example:**
```
January:  2024: 234h  |  2025: 189h  ↓ 19% improvement
February: 2024: 267h  |  2025: 245h  ↓ 8% improvement
```

---

## AIRCRAFT PERFORMANCE SECTION (NEW)

This section identifies top performers and problem aircraft to focus improvement efforts.

### Aircraft Heatmap

**What It Shows:**
- Grid with aircraft (rows) × months (columns)
- Cell color intensity based on downtime hours:
  - 🟢 Light green (0h): No downtime
  - 🟡 Yellow (1-24h): Minor issues
  - 🟠 Orange (25-100h): Moderate downtime
  - 🔴 Red (>100h): Severe downtime

**How to Use:**
1. Hover over cells to see exact downtime hours
2. Click on cells to drill down to specific aircraft/month
3. Identify patterns:
   - Horizontal red streaks → Chronic aircraft issues
   - Vertical red streaks → Fleet-wide issues in specific month
   - Scattered red cells → Random events

**Example Patterns:**
- HZ-A42 red for 3 consecutive months → Recurring issue, needs investigation
- All aircraft red in July → Fleet-wide issue or seasonal pattern
- Mostly green with occasional yellow → Healthy fleet

### Reliability Score Cards

**What It Shows:**
- Two columns:
  - **Most Reliable** (left): Top 5 aircraft with highest scores
  - **Needs Attention** (right): Top 5 aircraft with lowest scores

**Reliability Score Calculation:**
```
Score = 100 - min(100, (eventCount × 5) + (totalDowntimeHours / 10))
```

**Score Ranges:**
- 90-100: Excellent (green border)
- 70-89: Good (blue border)
- 50-69: Fair (amber border)
- <50: Poor (red border)

**Trend Indicators:**
- ↑ Improving: Score increased by >5 points vs previous period
- → Stable: Score changed by ≤5 points
- ↓ Declining: Score decreased by >5 points

**How to Use:**
1. Celebrate reliable aircraft (recognize good maintenance practices)
2. Investigate aircraft needing attention:
   - Is it an aging aircraft?
   - Recurring issues?
   - Parts availability problems?
3. Compare similar aircraft types to identify outliers

---

## ROOT CAUSE ANALYSIS SECTION (NEW)

This section helps you identify and prioritize the root causes of AOG events.

### Pareto Chart

**What It Shows:**
- Combo chart with bars (event count per reason code) and line (cumulative percentage)
- Top 10 reason codes sorted by frequency
- 80% line marker (Pareto principle)

**How to Use:**
1. Identify the vital few (20% of reasons causing 80% of events)
2. Focus improvement efforts on top reason codes
3. Track if top reasons change over time

**Pareto Principle:**
- Typically, 20% of reason codes account for 80% of events
- Focus on the top 3-5 reason codes for maximum impact

**Example:**
```
Hydraulic System Failure: 25 events (35% cumulative)
Engine Oil Leak: 18 events (60% cumulative)
Landing Gear Issue: 12 events (77% cumulative)
← These 3 reasons account for 77% of all events
```

### Category Breakdown Pie

**What It Shows:**
- Pie chart with three segments:
  - 🔴 AOG (Red): Critical grounding events
  - 🟡 Unscheduled (Amber): Unplanned maintenance
  - 🔵 Scheduled (Blue): Planned maintenance

**How to Use:**
1. Hover over segments to see count and total hours
2. Look for disproportionate segments
3. Track changes over time

**Ideal Distribution:**
- Scheduled > Unscheduled > AOG
- AOG should be <30% of total events

**Red Flags:**
- AOG > 40% → Too many critical events
- Unscheduled > 60% → Reactive maintenance culture

### Responsibility Distribution Chart

**What It Shows:**
- Horizontal bar chart showing downtime by responsible party:
  - 🔵 Internal (Blue): In-house maintenance team
  - 🔴 OEM (Red): Original equipment manufacturer
  - 🟡 Customs (Amber): Customs/regulatory delays
  - 🟢 Finance (Green): Financial/procurement delays
  - 🟣 Other (Purple): Other external parties

**How to Use:**
1. Identify which party is responsible for most downtime
2. Focus improvement efforts accordingly:
   - High Internal → Training, tools, processes
   - High OEM → Vendor management, contracts
   - High Customs → Regulatory relationships, documentation
   - High Finance → Budget allocation, approval processes

**Example:**
```
OEM:      ████████████████████ 456h (45%)
Internal: ████████████ 234h (23%)
Customs:  ████████ 156h (15%)
Finance:  ████ 89h (9%)
Other:    ██ 78h (8%)
```

---

## COST ANALYSIS SECTION (NEW)

This section provides visibility into the financial impact of AOG events.

### Cost Breakdown Chart

**What It Shows:**
- Stacked bar chart with trend line
- Bars: Internal cost (blue) + External cost (amber)
- Line: Total cost trend (red dashed)
- Last 12 months of data

**How to Use:**
1. Track total cost trends over time
2. Identify cost spikes and investigate causes
3. Compare internal vs external cost ratios
4. Use for budget planning and forecasting

**Cost Categories:**
- **Internal Cost**: Labor, man-hours, internal resources
- **External Cost**: Vendor services, parts, third-party support

**Ideal Ratio:**
- Internal:External should be 60:40 to 70:30
- High external costs may indicate dependency on vendors

### Cost Efficiency Metrics

**What It Shows:**
- Two metric cards side by side:
  - **Cost per Hour**: Total cost ÷ Total downtime hours
  - **Cost per Event**: Total cost ÷ Total events
- Delta indicators showing increase/decrease vs previous period
- Sparklines showing last 6 months trend

**How to Use:**
1. Track cost efficiency over time
2. Benchmark against industry standards
3. Identify if costs are increasing or decreasing
4. Use for budget justification and process improvement

**Interpretation:**
- ↓ Decreasing cost per hour → Improved efficiency
- ↑ Increasing cost per hour → Rising costs or longer events
- Stable metrics → Consistent cost management

**Industry Benchmarks:**
- Cost per hour: $500-$2,000 (varies by aircraft type)
- Cost per event: $5,000-$50,000 (varies by severity)

---

## PREDICTIVE ANALYTICS SECTION (NEW)

This section uses historical data to predict future trends and identify risks.

### Forecast Chart

**What It Shows:**
- Line chart with confidence interval
- Solid blue line: Historical actual downtime
- Dashed red line: Predicted downtime (next 3 months)
- Shaded red area: Confidence interval (±20%)
- Vertical line separating historical from forecast

**How to Use:**
1. Anticipate future downtime levels
2. Plan resources and budget accordingly
3. Identify if trend is improving or worsening
4. Use for strategic planning and stakeholder communication

**Forecast Algorithm:**
- Uses simple linear regression on last 12 months
- Formula: y = mx + b (where y = predicted hours, x = month)
- Confidence interval: ±20% of predicted value
- Requires minimum 6 months of historical data

**Example:**
```
Historical: Jan 234h, Feb 267h, Mar 289h
Forecast:   Apr 312h (250-375h), May 336h (269-403h), Jun 359h (287-431h)
Trend: Increasing by ~25h per month
```

### Risk Score Gauges

**What It Shows:**
- Radial gauges for top 3 highest-risk aircraft
- Score range: 0-100 (higher = higher risk)
- Color zones:
  - 🟢 Green (0-30): Low risk
  - 🟡 Amber (31-60): Medium risk
  - 🔴 Red (61-100): High risk
- Risk factors list below each gauge

**Risk Score Calculation:**
```
Risk Score = (
  Recent Event Frequency × 0.40 +
  Average Downtime Trend × 0.30 +
  Cost Trend × 0.20 +
  Recurring Issues × 0.10
) × 100
```

**Risk Factors:**
- Recent event frequency: Events in last 30 days vs average
- Average downtime trend: Increasing/decreasing
- Cost trend: Cost increasing/decreasing
- Recurring issues: Same reason code appearing multiple times

**How to Use:**
1. Identify aircraft at highest risk of future events
2. Schedule preventive maintenance for high-risk aircraft
3. Monitor risk factors and address root causes
4. Track if risk scores improve after interventions

**Example:**
```
HZ-A42: Risk Score 78 (High Risk)
Risk Factors:
• 5 events in last 30 days (vs avg 2)
• Downtime increasing 15% per month
• Costs up 25% vs previous period
• Hydraulic system issue recurring (3x)
```

### Automated Insights Panel

**What It Shows:**
- Card-based layout with up to 5 automated insights
- Each insight includes:
  - Icon (⚠️ warning, ℹ️ info, ✓ success)
  - Title (bold)
  - Description (2-3 sentences)
  - Metric (if applicable)
  - Recommendation (actionable)

**Insight Types:**

1. **High Procurement Time** (⚠️ Warning)
   - Trigger: Procurement time > 50% of total downtime
   - Example: "Parts procurement accounts for 56% of downtime"
   - Recommendation: "Review supplier contracts and inventory levels"

2. **Recurring Issues** (⚠️ Warning)
   - Trigger: Same reason code appears 3+ times in 30 days
   - Example: "Hydraulic system failure occurred 5 times recently"
   - Recommendation: "Consider root cause analysis and preventive maintenance"

3. **Cost Spike** (⚠️ Warning)
   - Trigger: Current month cost > 150% of 3-month average
   - Example: "AOG costs are 175% higher than average"
   - Recommendation: "Review recent high-cost events"

4. **Improving Trend** (✓ Success)
   - Trigger: Downtime decreased by >20% vs previous period
   - Example: "Downtime decreased by 28% this period"
   - Recommendation: "Document successful practices for replication"

5. **Data Quality Issue** (ℹ️ Info)
   - Trigger: >30% of events are legacy (no milestones)
   - Example: "42% of events lack milestone timestamps"
   - Recommendation: "Update recent events with milestone data"

6. **Aircraft at Risk** (⚠️ Warning)
   - Trigger: Aircraft risk score > 70
   - Example: "HZ-A42 shows increasing downtime trend"
   - Recommendation: "Schedule preventive maintenance review"

7. **Seasonal Pattern** (ℹ️ Info)
   - Trigger: Consistent pattern across years
   - Example: "AOG events increase 35% during summer months"
   - Recommendation: "Plan additional resources for peak periods"

8. **Bottleneck Identified** (⚠️ Info)
   - Trigger: One bucket consistently >60% of total time
   - Example: "Procurement time accounts for 68% of downtime"
   - Recommendation: "Focus improvement efforts on supply chain"

**How to Use:**
1. Review insights daily or weekly
2. Prioritize warnings over info messages
3. Act on recommendations promptly
4. Track if insights change after interventions
5. Use insights for management reporting

---

## Category Breakdown Chart

### What It Shows
A pie chart displaying the distribution of events by category:
- **AOG** (Red): Critical grounding events
- **U-MX** (Amber): Unscheduled maintenance
- **S-MX** (Blue): Scheduled maintenance
- **MRO** (Purple): Maintenance facility visits
- **CLEANING** (Green): Operational cleaning

### How to Use It
1. **Hover** over any segment to see exact count and percentage
2. **Click** on a segment to filter the entire page to that category
3. **Look for** disproportionate segments (e.g., if AOG is > 40%, investigate root causes)

### Key Insights
- **High AOG percentage**: Indicates reactive maintenance issues
- **High S-MX percentage**: Good - shows proactive maintenance
- **High U-MX percentage**: May indicate aging fleet or maintenance gaps

## Location Heatmap

### What It Shows
A bar chart showing the top 5 locations (by ICAO code) where events occur most frequently.

### How to Use It
1. **Identify** which airports/facilities have the most events
2. **Compare** event counts across locations
3. **Investigate** why certain locations have higher event rates

### Common Patterns
- **Home base high**: Normal - most operations occur there
- **MRO facility high**: Expected - aircraft sent there for major work
- **Remote location high**: May indicate support/parts availability issues

### Example
```
OERK (Riyadh)    ████████████████████ 52 events (44%)
LFSB (Basel)     ██████████ 28 events (24%)
EDDH (Hamburg)   ██████ 18 events (15%)
LFBF (Bordeaux)  ████ 12 events (10%)
OEJN (Jeddah)    ██ 8 events (7%)
```

## Duration Distribution

### What It Shows
A bar chart grouping events by how long they lasted:
- **< 24 hours**: Quick fixes
- **1-7 days**: Standard repairs
- **1-4 weeks**: Major work
- **> 1 month**: Extended MRO visits

### How to Use It
1. **Identify** the most common duration range
2. **Look for** outliers (events taking unusually long)
3. **Track** improvements over time (more events in shorter durations = better)

### Ideal Distribution
- Most events in "< 24 hours" or "1-7 days"
- Few events in "> 1 month" (unless planned MRO)

### Red Flags
- Many events in "1-4 weeks" or "> 1 month"
- Indicates parts delays or complex issues

## Aircraft Reliability Ranking

### What It Shows
Two lists showing:
1. **Most Reliable**: Top 3 aircraft with fewest events and lowest downtime
2. **Needs Attention**: Top 3 aircraft with most events and highest downtime

### How to Use It
1. **Celebrate** reliable aircraft (good maintenance practices)
2. **Investigate** aircraft needing attention:
   - Is it an aging aircraft?
   - Recurring issues?
   - Parts availability problems?
3. **Compare** similar aircraft types to identify outliers

### Example
```
Most Reliable:
✅ HZ-A42  •  2 events  •  45 hours downtime
✅ HZ-SK7  •  3 events  •  68 hours downtime
✅ HZ-A10  •  4 events  •  92 hours downtime

Needs Attention:
⚠️ HZ-A25  •  12 events  •  1,240 hours downtime
⚠️ HZ-SK5  •  10 events  •  980 hours downtime
⚠️ HZ-A11  •  9 events  •  856 hours downtime
```

## Monthly Trend Chart

### What It Shows
A line chart showing event count and total downtime hours over time (by month).

### How to Use It
1. **Identify** seasonal patterns (e.g., more events in summer)
2. **Track** improvement trends (declining line = good)
3. **Spot** anomalies (sudden spikes)
4. **Correlate** with operational changes or fleet additions

### What to Look For
- **Upward trend**: Investigate causes (aging fleet, maintenance gaps)
- **Downward trend**: Good - maintenance improvements working
- **Spikes**: Identify what happened that month
- **Seasonal patterns**: Plan maintenance accordingly

## Insights Panel

### What It Shows
Auto-generated observations based on your data:

#### 1. Top Problem Aircraft
- Aircraft with > 10 events in the selected period
- Sorted by event count and total downtime
- **Action**: Review maintenance history, consider deeper inspection

#### 2. Most Common Issues
- Grouped by defect description patterns
- Shows frequency of each issue type
- **Action**: Address recurring problems systematically

#### 3. Busiest Locations
- Locations with highest event counts
- **Action**: Ensure adequate support at these locations

#### 4. Average Resolution Time by Category
- Shows how long each category typically takes to resolve
- **Benchmarks**:
  - AOG: < 48 hours (ideal)
  - U-MX: < 36 hours (ideal)
  - S-MX: 3-7 days (planned)
  - MRO: 30-90 days (planned)
  - Cleaning: < 12 hours (ideal)

#### 5. Fleet Health Score
- Composite score (0-100) based on:
  - Active AOG count (lower is better)
  - Event frequency (lower is better)
  - Average downtime (lower is better)
- **Thresholds**:
  - 90-100: Excellent
  - 75-89: Good
  - 60-74: Fair
  - < 60: Needs Improvement

## Filtering and Date Range

### Date Range Selector
Located at the top of the page:
1. **Click** the date range button
2. **Select** start and end dates
3. **Apply** to update all charts and metrics

### Common Date Ranges
- **Last 30 days**: Recent performance
- **Last 90 days**: Quarterly review
- **Last 12 months**: Annual trends
- **Year to date**: Current year performance
- **Custom**: Any specific period

### Tips
- Use shorter ranges (30-90 days) for operational reviews
- Use longer ranges (12+ months) for strategic planning
- Compare same periods year-over-year for trends

## Exporting Data

### PDF Export
1. **Click** "Export PDF" button at top right
2. **Wait** for generation (may take a few seconds)
3. **Download** opens automatically
4. **Contains**: All charts, metrics, and insights

### Excel Export
1. **Click** "Export Excel" button
2. **Download** opens automatically
3. **Contains**: Raw event data with all fields
4. **Use for**: Custom analysis, reporting, archiving

## Best Practices

### Daily Review
- Check **Active Events** count
- Review **Needs Attention** aircraft
- Monitor **Fleet Health Score**

### Weekly Review
- Analyze **Category Breakdown** for patterns
- Review **Monthly Trend** for anomalies
- Check **Most Common Issues** for recurring problems

### Monthly Review
- Compare **period-over-period** metrics
- Review **Aircraft Reliability** rankings
- Analyze **Location Heatmap** for support needs
- Export **PDF report** for management

### Quarterly Review
- Analyze **12-month trends**
- Review **Average Resolution Time** by category
- Assess **Fleet Health Score** trajectory
- Plan **maintenance improvements** based on insights

## Interpreting Results

### Good Signs
- ✅ Fleet Health Score > 80
- ✅ Most events in "< 24 hours" duration
- ✅ Downward trend in monthly chart
- ✅ Low active event count
- ✅ Balanced category distribution (more S-MX than AOG)

### Warning Signs
- ⚠️ Fleet Health Score 60-80
- ⚠️ Many events in "1-4 weeks" duration
- ⚠️ Flat or slightly upward trend
- ⚠️ 3-5 active events
- ⚠️ High U-MX percentage

### Critical Issues
- 🚨 Fleet Health Score < 60
- 🚨 Many events in "> 1 month" duration
- 🚨 Sharp upward trend
- 🚨 > 5 active events
- 🚨 AOG percentage > 40%

## Troubleshooting

### "No data available"
- **Cause**: No events in selected date range
- **Solution**: Expand date range or check if events exist

### Charts not updating
- **Cause**: Browser cache or network issue
- **Solution**: Refresh page or clear browser cache

### Export not working
- **Cause**: Pop-up blocker or network issue
- **Solution**: Allow pop-ups for this site, check network connection

### Incorrect data
- **Cause**: Events not properly categorized or dates incorrect
- **Solution**: Review and update event data on AOG List page

## Related Pages

- **AOG List**: View and manage individual events
- **AOG Detail**: Deep dive into specific events
- **Dashboard**: Fleet-wide KPIs including AOG summary
- **Import**: Upload historical AOG data

## Support

For questions or issues:
1. Check this guide first
2. Review the **AOG Import Guide** for data quality tips
3. Contact system administrator
4. Refer to **System Architecture** documentation for technical details

---

**Last Updated**: January 2026  
**Version**: 1.0  
**Related Documents**: 
- `AOG-IMPORT-GUIDE.md` - Data import instructions
- `CLIENT-AOG-RECOMMENDATIONS.md` - Best practices for data management
- `AOG-ANALYTICS-ENDPOINTS.md` - Technical API reference


---

## Filtering and Date Range

### Date Range Selector
Located at the top of the page:
1. **Click** the date range button
2. **Select** start and end dates
3. **Apply** to update all charts and metrics

### Common Date Ranges
- **Last 30 days**: Recent performance
- **Last 90 days**: Quarterly review
- **Last 12 months**: Annual trends
- **Year to date**: Current year performance
- **Custom**: Any specific period

### Aircraft and Fleet Filters
- **Aircraft Filter**: Select specific aircraft by registration
- **Fleet Group Filter**: Filter by fleet group (A330, A340, G650ER, etc.)
- **Clear Filters**: Reset to show all aircraft

### Tips
- Use shorter ranges (30-90 days) for operational reviews
- Use longer ranges (12+ months) for strategic planning
- Compare same periods year-over-year for trends
- Apply filters before exporting for focused reports

---

## Exporting Data

### Enhanced PDF Export

The enhanced PDF export generates a professional multi-page report with all visualizations.

**What's Included:**
1. **Cover Page**: Title, date range, filters, generation timestamp
2. **Executive Summary**: Key metrics and top 5 insights
3. **Three-Bucket Analysis**: All charts and per-aircraft breakdown
4. **Trend Analysis**: Monthly trends, moving averages, YoY comparison
5. **Aircraft Performance**: Heatmap and reliability scores
6. **Root Cause Analysis**: Pareto chart, category breakdown, responsibility distribution
7. **Cost Analysis**: Cost breakdown and efficiency metrics
8. **Predictive Analytics**: Forecast chart, risk scores, insights
9. **Page Numbers and Footers**: Professional formatting throughout

**How to Export:**
1. **Apply filters** to focus the report (optional)
2. **Click** "Export PDF" button at top right
3. **Wait** for generation (10-15 seconds for full report)
4. **Download** opens automatically
5. **Review** the multi-page PDF

**Tips:**
- Export takes longer for large datasets (be patient)
- Charts are captured at high resolution (300 DPI)
- PDF is print-ready and board-meeting appropriate
- File size typically 2-5 MB depending on data volume

### Excel Export
1. **Click** "Export Excel" button
2. **Download** opens automatically
3. **Contains**: Raw event data with all fields
4. **Use for**: Custom analysis, reporting, archiving

---

## Best Practices

### Daily Review (Operations Team)
- Check **Data Quality Indicator** (aim for >80%)
- Review **Active Events** count
- Check **Needs Attention** aircraft in Reliability Score Cards
- Review **Automated Insights** for warnings
- Monitor **Risk Score Gauges** for high-risk aircraft

### Weekly Review (Maintenance Managers)
- Analyze **Three-Bucket Breakdown** for bottlenecks
- Review **Pareto Chart** for top reason codes
- Check **Responsibility Distribution** to focus improvement efforts
- Review **Cost Efficiency Metrics** for budget tracking
- Analyze **Monthly Trend** for anomalies

### Monthly Review (Department Heads)
- Compare **period-over-period** metrics using trend indicators
- Review **Year-over-Year Comparison** for sustained improvements
- Analyze **Aircraft Heatmap** for chronic issues
- Review **Cost Breakdown** for budget variance
- Check **Forecast Chart** for next quarter planning
- Export **PDF report** for management presentation

### Quarterly Review (Executives)
- Analyze **12-month trends** across all sections
- Review **Moving Average** for strategic trends
- Assess **Fleet Health** using reliability scores
- Review **Predictive Analytics** for resource planning
- Evaluate **Cost per Hour** and **Cost per Event** efficiency
- Plan **maintenance improvements** based on insights
- Present **PDF report** to board or stakeholders

---

## Interpreting Results

### Excellent Performance Indicators
- ✅ Data Quality > 80% (green badge)
- ✅ Most events in "< 24 hours" duration
- ✅ Downward trend in monthly chart
- ✅ Low active event count (< 3)
- ✅ Balanced three-bucket distribution (no bucket > 50%)
- ✅ Reliability scores > 70 for most aircraft
- ✅ Cost per hour decreasing or stable
- ✅ Forecast showing flat or declining trend
- ✅ Risk scores < 40 for all aircraft
- ✅ Mostly "success" insights

### Warning Signs
- ⚠️ Data Quality 50-80% (amber badge)
- ⚠️ Many events in "1-4 weeks" duration
- ⚠️ Flat or slightly upward trend
- ⚠️ 3-5 active events
- ⚠️ One bucket > 60% of total time
- ⚠️ Several aircraft with reliability scores < 50
- ⚠️ Cost per hour increasing
- ⚠️ Forecast showing upward trend
- ⚠️ Risk scores 40-70 for multiple aircraft
- ⚠️ Multiple "warning" insights

### Critical Issues Requiring Immediate Action
- 🚨 Data Quality < 50% (red badge)
- 🚨 Many events in "> 1 month" duration
- 🚨 Sharp upward trend in monthly chart
- 🚨 > 5 active events
- 🚨 Procurement time > 70% of total
- 🚨 Multiple aircraft with reliability scores < 30
- 🚨 Cost per hour spiking significantly
- 🚨 Forecast showing steep upward trend
- 🚨 Risk scores > 70 for any aircraft
- 🚨 Multiple critical "warning" insights

---

## Troubleshooting

### "No data available" in charts
- **Cause**: No events in selected date range or filters too restrictive
- **Solution**: 
  1. Expand date range to last 90 days
  2. Clear aircraft/fleet filters
  3. Check if events exist in AOG List page
  4. Verify events have required fields (detectedAt, clearedAt)

### "Limited Analytics" badge on events
- **Cause**: Events lack milestone timestamps (legacy events)
- **Solution**:
  1. Update events with milestone data using AOG Detail page
  2. Follow AOG Event Creation Guide for new events
  3. Refer to AOG Analytics Simplified Model documentation
  4. Note: Legacy events still show total downtime

### Charts not updating after filter change
- **Cause**: Browser cache or network issue
- **Solution**: 
  1. Refresh page (F5 or Ctrl+R)
  2. Clear browser cache
  3. Check network connection
  4. Try different browser

### PDF export fails or takes too long
- **Cause**: Large dataset, slow network, or browser limitations
- **Solution**:
  1. Apply filters to reduce dataset size
  2. Use shorter date range (e.g., 30 days instead of 12 months)
  3. Close other browser tabs to free memory
  4. Try Chrome or Edge (better PDF generation support)
  5. Wait patiently (can take 15-20 seconds for large reports)
  6. Check browser console for errors (F12)

### Forecast chart shows "Insufficient data"
- **Cause**: Less than 6 months of historical data
- **Solution**:
  1. Expand date range to include more historical data
  2. Import historical AOG events if available
  3. Wait until more data accumulates
  4. Note: Forecast requires minimum 6 months of data

### Risk scores seem incorrect
- **Cause**: Recent data changes or calculation based on limited period
- **Solution**:
  1. Verify date range includes sufficient data (90+ days recommended)
  2. Check if recent events are properly categorized
  3. Review risk factors list below gauge for details
  4. Note: Risk scores are relative to fleet average

### Insights panel empty
- **Cause**: No significant patterns detected or insufficient data
- **Solution**:
  1. Expand date range to 90+ days
  2. Ensure events have complete data (category, reason code, costs)
  3. Check if data quality is sufficient (>50%)
  4. Note: Insights require patterns across multiple events

### Charts render incorrectly or overlap
- **Cause**: Browser zoom level or screen resolution issue
- **Solution**:
  1. Reset browser zoom to 100% (Ctrl+0)
  2. Use minimum screen resolution of 1280x720
  3. Try full-screen mode (F11)
  4. Refresh page after adjusting zoom

### Data seems outdated
- **Cause**: Server-side caching (5-minute TTL)
- **Solution**:
  1. Wait 5 minutes for cache to expire
  2. Create/update an event to invalidate cache
  3. Add `?nocache=true` to URL for testing
  4. Note: Caching improves performance

---

## Keyboard Shortcuts

- **Ctrl+F** or **Cmd+F**: Search within page
- **Ctrl+P** or **Cmd+P**: Print page (alternative to PDF export)
- **Ctrl+R** or **Cmd+R**: Refresh page
- **Ctrl+0** or **Cmd+0**: Reset zoom to 100%
- **F11**: Toggle full-screen mode
- **Esc**: Close modals or tooltips

---

## Accessibility Features

### Color Blindness Support
- All charts use patterns in addition to colors
- Text labels provided for all data points
- High contrast mode available in browser settings

### Screen Reader Support
- All charts have descriptive alt text
- Data tables provided as alternative to visual charts
- ARIA labels on interactive elements

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons and links
- Arrow keys to navigate within charts (where supported)

---

## Performance Tips

### For Faster Loading
1. Use shorter date ranges (30-90 days)
2. Apply aircraft or fleet filters
3. Close unused browser tabs
4. Use modern browser (Chrome, Edge, Firefox)
5. Ensure stable internet connection

### For Better Visualization
1. Use full-screen mode for presentations
2. Adjust browser zoom for optimal viewing
3. Use dark mode for reduced eye strain (if available)
4. Export PDF for offline viewing

### For Accurate Analysis
1. Ensure data quality > 80%
2. Update legacy events with milestones
3. Use consistent date ranges for comparisons
4. Verify event categorization is correct
5. Review automated insights for data quality issues

---

## Related Pages and Resources

### Internal Pages
- **AOG List**: View and manage individual events
- **AOG Detail**: Deep dive into specific events with milestone editing
- **AOG Log**: Create new AOG events
- **Dashboard**: Fleet-wide KPIs including AOG summary
- **Import**: Upload historical AOG data

### Documentation
- **AOG Analytics API Documentation**: Technical API reference
- **AOG Analytics Developer Guide**: Component architecture and data flow
- **AOG Event Creation Guide**: Best practices for data entry
- **AOG Analytics Simplified Model**: Three-bucket methodology
- **System Architecture**: Overall system design

### Support Resources
- **Help Center**: General system help
- **Training Videos**: Video tutorials (if available)
- **FAQ**: Frequently asked questions
- **Contact Support**: support@alphastarav.com

---

## Glossary

**AOG (Aircraft On Ground)**: Critical event where aircraft cannot fly

**Three-Bucket Model**: Downtime categorization into Technical, Procurement, and Ops

**Milestone Timestamps**: Key time points in AOG resolution workflow

**Legacy Event**: Event without milestone timestamps (limited analytics)

**Data Quality**: Percentage of events with complete milestone data

**Reliability Score**: Composite metric (0-100) indicating aircraft reliability

**Risk Score**: Predictive metric (0-100) indicating future event likelihood

**Moving Average**: Statistical smoothing technique to identify trends

**Pareto Chart**: Chart showing vital few vs trivial many (80/20 rule)

**Forecast**: Predictive analytics for future downtime

**Confidence Interval**: Range of likely values for forecast

**Cost per Hour**: Total cost divided by total downtime hours

**Cost per Event**: Total cost divided by total number of events

**YoY (Year-over-Year)**: Comparison of same period in different years

---

## Frequently Asked Questions

**Q: Why do some events show "Limited Analytics"?**  
A: These are legacy events without milestone timestamps. They show total downtime only. Update them with milestones for full analytics.

**Q: How often is data refreshed?**  
A: Data is cached for 5 minutes. Create/update an event to invalidate cache immediately.

**Q: Can I export individual charts?**  
A: Not directly, but you can use browser screenshot tools or export the full PDF report.

**Q: What's the difference between Total Downtime and Three-Bucket Total?**  
A: They should match. Total Downtime = Technical + Procurement + Ops. If they don't match, check milestone timestamps.

**Q: Why is my forecast showing "Insufficient data"?**  
A: Forecast requires minimum 6 months of historical data. Expand your date range or wait for more data.

**Q: Can I customize the insights?**  
A: Insights are auto-generated based on patterns. You cannot customize them, but you can provide feedback to improve algorithms.

**Q: How do I improve my data quality score?**  
A: Update recent events with milestone timestamps using the AOG Detail page. Follow the AOG Event Creation Guide for new events.

**Q: What's a good reliability score?**  
A: 90-100 is excellent, 70-89 is good, 50-69 is fair, <50 needs attention.

**Q: Why are my costs showing as $0?**  
A: Cost data must be entered manually on each AOG event. Update events with internal and external costs.

**Q: Can I compare multiple aircraft side-by-side?**  
A: Use the Aircraft Heatmap or Per-Aircraft Breakdown Table. For detailed comparison, export to Excel.

---

## Version History

**Version 2.0** (February 2025)
- Added 10+ new visualizations
- Implemented three-bucket analytics
- Added predictive analytics and forecasting
- Enhanced PDF export with multi-page support
- Added automated insights generation
- Improved data quality indicators

**Version 1.0** (January 2025)
- Initial release with basic analytics
- Category breakdown and location heatmap
- Monthly trend chart
- Aircraft reliability ranking

---

**Last Updated**: February 3, 2025  
**Version**: 2.0  
**Related Documents**: 
- `AOG-ANALYTICS-API-DOCUMENTATION.md` - API reference
- `AOG-ANALYTICS-DEVELOPER-GUIDE.md` - Technical documentation
- `AOG-IMPORT-GUIDE.md` - Data import instructions
- `CLIENT-AOG-RECOMMENDATIONS.md` - Best practices
- `system-architecture.md` - System architecture
