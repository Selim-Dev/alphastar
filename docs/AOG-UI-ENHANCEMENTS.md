# AOG UI Enhancements - Recommendations

## Overview

Based on the client's historical AOG/OOS data, here are recommended UI enhancements to make the system more productive and showcase the importance of this data.

## 1. AOG List Page Enhancements

### Current State
- Basic table with filters
- Shows aircraft, category, dates, status

### Recommended Enhancements

#### A. **Category Visual Indicators**

Add color-coded badges for different event types:

```typescript
const categoryConfig = {
  aog: { 
    color: 'red', 
    icon: AlertCircle, 
    label: 'AOG',
    priority: 1 // Highest priority
  },
  unscheduled: { 
    color: 'amber', 
    icon: Wrench, 
    label: 'U-MX',
    priority: 2
  },
  scheduled: { 
    color: 'blue', 
    icon: Calendar, 
    label: 'S-MX',
    priority: 3
  },
  mro: { 
    color: 'purple', 
    icon: Building2, 
    label: 'MRO',
    priority: 4
  },
  cleaning: { 
    color: 'green', 
    icon: Sparkles, 
    label: 'Cleaning',
    priority: 5
  }
};
```

**Visual Example:**
```
┌─────────────────────────────────────────────────────────────┐
│ [🔴 AOG]  HZ-SK5  •  R GCU FAIL  •  OERK  •  Active  •  2d  │
│ [🟡 U-MX] HZ-A10  •  Engine Replacement  •  OERK  •  5d     │
│ [🔵 S-MX] HZ-A11  •  MRO Visit  •  LFBF  •  Resolved  •  216d│
└─────────────────────────────────────────────────────────────┘
```

#### B. **Location Column with Flag Icons**

Show location with country flag or airport icon:

```
OERK 🇸🇦 (King Khalid Intl, Riyadh)
LFSB 🇨🇭 (EuroAirport Basel)
EDDH 🇩🇪 (Hamburg Airport)
```

#### C. **Duration Visualization**

Add visual duration bars:

```
Duration: 280 hrs  [████████████████░░░░] 12 days
Duration: 5184 hrs [████████████████████] 216 days (Long-term MRO)
```

#### D. **Active Events Highlight**

Make active events stand out:
- Pulsing red indicator
- "ACTIVE" badge
- Move to top of list by default
- Show elapsed time updating in real-time

#### E. **Quick Stats Summary**

Add summary cards above the table:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Active AOG   │ This Month   │ Avg Duration │ Total Hours  │
│    3 🔴      │    12 events │    48 hrs    │   1,240 hrs  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## 2. AOG Detail Page Enhancements

### Current State
- Shows event details
- Milestone timeline (for non-legacy)
- Tabs for parts, costs, attachments

### Recommended Enhancements

#### A. **Location Map Integration** (Optional)

Show aircraft location on a map:
- Use ICAO code to display airport location
- Show MRO facility information
- Display distance from home base

#### B. **Legacy Event Upgrade Path**

For legacy events, show a clear upgrade path:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Legacy Event - Limited Analytics Available               │
│                                                              │
│ This event was imported from historical data.               │
│ To enable full analytics, add:                              │
│                                                              │
│ [+ Add Milestone Data]  [+ Add Cost Data]  [+ Add Manpower] │
└─────────────────────────────────────────────────────────────┘
```

#### C. **Event Timeline Visualization**

For all events (legacy and new), show a visual timeline:

```
Jan 04, 2024                                    Jan 11, 2024
    |━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|
    ↑                                              ↑
  Detected                                     Cleared
  23:59                                        16:00
  
  Total Downtime: 280 hours (11 days 16 hours)
```

#### D. **Related Events Section**

Show related events for the same aircraft:

```
┌─────────────────────────────────────────────────────────────┐
│ Related Events for HZ-A11                                    │
│                                                              │
│ • Jan 04, 2024 - Oxygen Generator (280 hrs) ← Current       │
│ • May 23, 2024 - Engine Start Fault (20 hrs)                │
│ • Jul 26, 2024 - Propeller Hub Bolt (126 hrs)               │
│                                                              │
│ [View All Events for HZ-A11]                                 │
└─────────────────────────────────────────────────────────────┘
```

#### E. **Impact Metrics**

Show the business impact:

```
┌─────────────────────────────────────────────────────────────┐
│ Business Impact                                              │
│                                                              │
│ • Lost Flight Hours: ~140 hrs (estimated)                   │
│ • Availability Impact: -11.7% for this aircraft              │
│ • Fleet Impact: -0.8% (1 of 12 aircraft)                    │
│ • Estimated Revenue Loss: $XXX,XXX (if applicable)          │
└─────────────────────────────────────────────────────────────┘
```

## 3. AOG Analytics Page Enhancements

### Current State
- Three-bucket breakdown
- Analytics by responsibility
- Filters for aircraft and date range

### Recommended Enhancements

#### A. **Category Breakdown**

Add analysis by event category:

```
┌─────────────────────────────────────────────────────────────┐
│ Events by Category (2024)                                    │
│                                                              │
│ AOG (Critical)      ████████████████████ 45 events (38%)    │
│ U-MX (Unscheduled)  ████████████ 28 events (24%)            │
│ S-MX (Scheduled)    ████████████████ 32 events (27%)        │
│ MRO (Facility)      ████ 10 events (8%)                     │
│ Cleaning            ██ 3 events (3%)                         │
└─────────────────────────────────────────────────────────────┘
```

#### B. **Location Heatmap**

Show which locations have the most events:

```
┌─────────────────────────────────────────────────────────────┐
│ Top Locations by Event Count                                 │
│                                                              │
│ 1. OERK (Riyadh)     ████████████████████ 52 events         │
│ 2. LFSB (Basel)      ████████████ 28 events                 │
│ 3. EDDH (Hamburg)    ████████ 18 events                     │
│ 4. OEJN (Jeddah)     ████ 9 events                          │
│ 5. OMDB (Dubai)      ███ 6 events                           │
└─────────────────────────────────────────────────────────────┘
```

#### C. **Duration Distribution**

Show distribution of event durations:

```
┌─────────────────────────────────────────────────────────────┐
│ Duration Distribution                                        │
│                                                              │
│ < 24 hrs    ████████████████ 42 events (Quick fixes)        │
│ 1-7 days    ████████████████████ 51 events (Standard)       │
│ 1-4 weeks   ████████ 18 events (Extended)                   │
│ > 1 month   ████ 7 events (Long-term MRO)                   │
│                                                              │
│ Median Duration: 48 hours                                    │
│ Average Duration: 156 hours                                  │
└─────────────────────────────────────────────────────────────┘
```

#### D. **Trend Analysis**

Show trends over time:

```
┌─────────────────────────────────────────────────────────────┐
│ Monthly Trend (2024)                                         │
│                                                              │
│ Events │                                                     │
│   15   │     ●                                               │
│   10   │   ●   ●   ●     ●                                   │
│    5   │ ●       ●   ● ●   ● ● ● ● ●                         │
│    0   └─────────────────────────────────────────────────    │
│        J F M A M J J A S O N D                               │
│                                                              │
│ Trend: ↗️ Increasing in Q2, ↘️ Decreasing in Q4             │
└─────────────────────────────────────────────────────────────┘
```

#### E. **Aircraft Reliability Ranking**

Show which aircraft have the most/least events:

```
┌─────────────────────────────────────────────────────────────┐
│ Aircraft Reliability (2024)                                  │
│                                                              │
│ Most Reliable:                                               │
│ 1. HZ-A9   ✅ 2 events, 45 hrs total                        │
│ 2. HZ-A4   ✅ 3 events, 67 hrs total                        │
│ 3. VP-CAL  ✅ 4 events, 89 hrs total                        │
│                                                              │
│ Needs Attention:                                             │
│ 1. HZ-A25  ⚠️ 12 events, 1,240 hrs total                    │
│ 2. HZ-SK2  ⚠️ 10 events, 890 hrs total                      │
│ 3. HZ-A15  ⚠️ 9 events, 756 hrs total                       │
└─────────────────────────────────────────────────────────────┘
```

## 4. Dashboard Integration

### Recommended Enhancements

#### A. **AOG Status Widget**

Add to main dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│ AOG Status                                                   │
│                                                              │
│ Active Events: 3 🔴                                          │
│                                                              │
│ • HZ-SK5  - R GCU FAIL (2 days)                             │
│ • HZ-A10  - Engine Replacement (5 days)                     │
│ • HZ-XY7  - Water Leak (Active at MRO)                      │
│                                                              │
│ [View All AOG Events]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### B. **Fleet Availability Impact**

Show how AOG events affect fleet availability:

```
┌─────────────────────────────────────────────────────────────┐
│ Fleet Availability                                           │
│                                                              │
│ Current: 87.5% (14 of 16 aircraft available)                │
│                                                              │
│ Unavailable:                                                 │
│ • HZ-SK5  (AOG - 2 days)                                    │
│ • HZ-A10  (U-MX - 5 days)                                   │
│                                                              │
│ Target: 92% ━━━━━━━━━━━━━━━━━━━━ 87.5%                      │
│                                                              │
│ Impact: -4.5% below target due to active AOG events          │
└─────────────────────────────────────────────────────────────┘
```

## 5. Notification & Alert System

### Recommended Enhancements

#### A. **Active AOG Alerts**

Show prominent alerts for active AOG events:

```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 ACTIVE AOG ALERT                                          │
│                                                              │
│ HZ-SK5 has been AOG for 2 days                              │
│ Location: OERK                                               │
│ Issue: R GCU FAIL                                            │
│                                                              │
│ [View Details] [Update Status] [Add Notes]                  │
└─────────────────────────────────────────────────────────────┘
```

#### B. **Long-Duration Warnings**

Alert when events exceed expected duration:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ EXTENDED DOWNTIME WARNING                                 │
│                                                              │
│ HZ-A10 has been down for 5 days (U-MX)                      │
│ Expected: 2-3 days                                           │
│ Exceeded by: 2 days                                          │
│                                                              │
│ Recommended Action: Review procurement status                │
│                                                              │
│ [View Event] [Contact Maintenance]                           │
└─────────────────────────────────────────────────────────────┘
```

## 6. Export & Reporting Enhancements

### Recommended Enhancements

#### A. **Executive Summary Report**

Generate PDF/Excel reports with:
- Event summary by category
- Top 5 aircraft by downtime
- Location analysis
- Cost summary (if available)
- Trend charts

#### B. **Regulatory Compliance Report**

For aviation authorities:
- All AOG events with details
- Corrective actions taken
- Responsible parties
- Resolution times

## 7. Mobile-Friendly Enhancements

### Recommended Enhancements

#### A. **Quick Status View**

Mobile-optimized view showing:
- Active AOG count
- Aircraft status (available/unavailable)
- Quick access to event details

#### B. **Push Notifications**

For critical events:
- New AOG event detected
- Event cleared
- Long-duration warning

## Implementation Priority

### Phase 1 (High Priority - Immediate Value)
1. ✅ Category expansion (AOG, S-MX, U-MX, MRO, Cleaning)
2. ✅ Location field addition
3. Category visual indicators on list page
4. Active events highlight
5. Quick stats summary on list page

### Phase 2 (Medium Priority - Enhanced Analytics)
1. Location heatmap on analytics page
2. Duration distribution analysis
3. Aircraft reliability ranking
4. Category breakdown charts
5. Trend analysis

### Phase 3 (Low Priority - Nice to Have)
1. Location map integration
2. Related events section
3. Impact metrics calculation
4. Executive summary reports
5. Mobile push notifications

## Technical Implementation Notes

### Backend Changes Required

1. **Schema Updates** ✅ (Already done)
   - Added `location` field
   - Expanded `AOGCategory` enum

2. **Import Service**
   - Create Excel parser for client's format
   - Map Excel columns to system fields
   - Handle missing data with defaults
   - Set `isLegacy=true` for imported data

3. **Analytics Service**
   - Add category breakdown endpoint
   - Add location analysis endpoint
   - Add duration distribution endpoint
   - Add aircraft reliability ranking endpoint

### Frontend Changes Required

1. **AOG List Page**
   - Add category badges with colors
   - Add location display
   - Add duration visualization
   - Add active event highlighting
   - Add quick stats cards

2. **AOG Detail Page**
   - Add legacy event upgrade UI
   - Add event timeline visualization
   - Add related events section
   - Add impact metrics (if data available)

3. **AOG Analytics Page**
   - Add category breakdown chart
   - Add location heatmap
   - Add duration distribution chart
   - Add aircraft reliability ranking
   - Add trend analysis chart

4. **Dashboard**
   - Add AOG status widget
   - Add fleet availability impact widget

## Conclusion

These enhancements will:
1. Make historical data more valuable and visible
2. Provide actionable insights for management
3. Highlight the importance of AOG tracking
4. Enable better decision-making
5. Improve operational efficiency

The phased approach allows for incremental implementation while delivering immediate value with Phase 1 changes.
