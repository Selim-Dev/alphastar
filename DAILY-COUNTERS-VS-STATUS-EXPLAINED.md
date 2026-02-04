# Daily Utilization Counters vs Daily Status - Explained

## Overview

The Alpha Star Aviation KPIs Dashboard tracks two distinct but complementary aspects of aircraft operations:

1. **Daily Utilization Counters** - Track aircraft usage (flight hours and cycles)
2. **Daily Status** - Track aircraft availability (mission capability)

These serve different purposes and answer different questions.

---

## Daily Utilization Counters

### Purpose
Track **cumulative flight hours and cycles** for the airframe, engines, and APU to monitor:
- Total aircraft usage over its lifetime
- Maintenance scheduling based on hours/cycles
- Component life limits
- Operational tempo

### What It Tracks

**Collection:** `dailycounters`

| Field | Description | Example |
|-------|-------------|---------|
| `airframeHoursTtsn` | Total Time Since New (cumulative hours) | 12,500.5 hours |
| `airframeCyclesTcsn` | Total Cycles Since New (cumulative) | 4,200 cycles |
| `engine1Hours` | Engine 1 cumulative hours | 8,500.2 hours |
| `engine1Cycles` | Engine 1 cumulative cycles | 3,100 cycles |
| `engine2Hours` | Engine 2 cumulative hours | 8,450.8 hours |
| `engine2Cycles` | Engine 2 cumulative cycles | 3,050 cycles |
| `engine3Hours` | Engine 3 hours (4-engine aircraft only) | 8,400.0 hours |
| `engine4Hours` | Engine 4 hours (4-engine aircraft only) | 8,380.5 hours |
| `apuHours` | APU cumulative hours | 6,200.0 hours |
| `lastFlightDate` | Date of last flight | 2025-01-31 |

### Key Characteristics

✅ **Monotonic** - Values only increase (never decrease)
✅ **Cumulative** - Tracks total lifetime usage
✅ **Component-specific** - Separate tracking for each engine
✅ **Maintenance-driven** - Used for scheduling inspections and overhauls

### Business Rules

```typescript
// Daily flight hours calculation
dailyFlightHours = today.airframeHoursTtsn - yesterday.airframeHoursTtsn;

// Daily cycles calculation
dailyCycles = today.airframeCyclesTcsn - yesterday.airframeCyclesTcsn;

// Validation: Counters must be >= previous day
if (today.airframeHoursTtsn < yesterday.airframeHoursTtsn) {
  throw new Error('Counter values cannot decrease');
}
```

### Example Scenario

**Aircraft HZ-A42 on January 31, 2025:**
```
Airframe Hours TTSN: 12,500.5 hours
Airframe Cycles TCSN: 4,200 cycles
```

**Next day (February 1, 2025) after 6.5 flight hours and 2 cycles:**
```
Airframe Hours TTSN: 12,507.0 hours  (+6.5)
Airframe Cycles TCSN: 4,202 cycles   (+2)
```

### Use Cases

1. **Maintenance Scheduling**
   - "Engine 1 is at 8,500 hours, overhaul due at 10,000 hours"
   - "APU has 6,200 hours, inspection required every 500 hours"

2. **Utilization Analysis**
   - "Fleet flew 450 hours this month"
   - "Average daily utilization is 5.2 flight hours per aircraft"

3. **Component Life Tracking**
   - "Landing gear has 3,800 cycles, replacement at 5,000 cycles"
   - "Airframe approaching C-Check at 15,000 hours"

---

## Daily Status (Availability)

### Purpose
Track **aircraft availability** on a daily basis to measure:
- How many hours per day the aircraft is mission-capable
- Downtime due to maintenance (scheduled and unscheduled)
- Fleet readiness and operational capability

### What It Tracks

**Collection:** `dailystatus`

| Field | Description | Default | Range |
|-------|-------------|---------|-------|
| `posHours` | Possessed Hours (baseline) | 24 | 0-24 |
| `fmcHours` | Fully Mission Capable Hours | 24 | 0-24 |
| `nmcmSHours` | Not Mission Capable - Scheduled Maintenance | 0 | 0-24 |
| `nmcmUHours` | Not Mission Capable - Unscheduled Maintenance | 0 | 0-24 |
| `nmcsHours` | Not Mission Capable - Supply (parts waiting) | 0 | 0-24 |

### Key Characteristics

✅ **Daily snapshot** - Resets every day (not cumulative)
✅ **Availability-focused** - Measures readiness, not usage
✅ **Downtime tracking** - Categorizes why aircraft is unavailable
✅ **Executive metric** - Used for fleet health reporting

### Business Rules

```typescript
// FMC hours calculation
fmcHours = posHours - nmcmSHours - nmcmUHours - nmcsHours;

// Validation: All values must be 0-24
if (fmcHours < 0 || fmcHours > 24) {
  throw new Error('Hours must be between 0 and 24');
}

// Validation: Total cannot exceed possessed hours
if (nmcmSHours + nmcmUHours + nmcsHours > posHours) {
  throw new Error('Total downtime cannot exceed possessed hours');
}
```

### Example Scenario

**Aircraft HZ-A42 on January 31, 2025:**
```
POS Hours: 24 hours (full day)
NMCM-S Hours: 4 hours (scheduled inspection)
NMCM-U Hours: 0 hours (no unscheduled maintenance)
NMCS Hours: 0 hours (no parts waiting)

FMC Hours = 24 - 4 - 0 - 0 = 20 hours
```

**Availability = (20 / 24) × 100 = 83.3%**

### Use Cases

1. **Fleet Readiness**
   - "Fleet is 92% available today"
   - "HZ-A42 was down for 4 hours due to scheduled maintenance"

2. **Downtime Analysis**
   - "Unscheduled maintenance caused 12 hours of downtime this week"
   - "Parts delays (NMCS) accounted for 8 hours of unavailability"

3. **Executive Reporting**
   - "Fleet availability this month: 91.5% (target: 92%)"
   - "Scheduled maintenance downtime: 15%, Unscheduled: 5%"

---

## Availability Calculation (Detailed)

### Single Day Availability

For a single aircraft on a single day:

```typescript
availabilityPercentage = (fmcHours / posHours) × 100;
```

**Example:**
```
POS Hours: 24
FMC Hours: 20
Availability = (20 / 24) × 100 = 83.3%
```

### Period Availability (Aggregated)

For a single aircraft over multiple days:

```typescript
totalPosHours = sum(posHours) for all days in period;
totalFmcHours = sum(fmcHours) for all days in period;
periodAvailability = (totalFmcHours / totalPosHours) × 100;
```

**Example (7 days):**
```
Day 1: 20/24 FMC hours
Day 2: 24/24 FMC hours
Day 3: 18/24 FMC hours
Day 4: 24/24 FMC hours
Day 5: 22/24 FMC hours
Day 6: 24/24 FMC hours
Day 7: 20/24 FMC hours

Total POS: 168 hours (7 × 24)
Total FMC: 152 hours
Availability = (152 / 168) × 100 = 90.5%
```

### Fleet-Wide Availability

For all aircraft over a period:

```typescript
fleetAvailability = (sum(fmcHours for all aircraft) / sum(posHours for all aircraft)) × 100;
```

**Example (3 aircraft, 1 day):**
```
HZ-A42: 20/24 FMC hours
HZ-SKY1: 24/24 FMC hours
HZ-SKY2: 18/24 FMC hours

Total POS: 72 hours (3 × 24)
Total FMC: 62 hours
Fleet Availability = (62 / 72) × 100 = 86.1%
```

### Why This Matters

**Before the Dashboard:**
- Alpha Star used a static estimate of ~92% availability
- No real-time tracking of downtime causes
- No visibility into scheduled vs unscheduled maintenance impact

**With the Dashboard:**
- Dynamic, accurate availability calculation
- Breakdown by downtime type (scheduled, unscheduled, supply)
- Trend analysis to identify patterns
- Per-aircraft and fleet-wide metrics

---

## Key Differences Summary

| Aspect | Daily Utilization Counters | Daily Status |
|--------|---------------------------|--------------|
| **Purpose** | Track aircraft usage | Track aircraft availability |
| **Metric Type** | Cumulative (lifetime) | Daily snapshot |
| **Primary Value** | Flight hours and cycles | FMC hours (availability) |
| **Trend** | Always increasing | Varies day-to-day |
| **Used For** | Maintenance scheduling | Fleet readiness |
| **Question Answered** | "How much has the aircraft flown?" | "Is the aircraft mission-capable?" |
| **Executive KPI** | Total Flight Hours | Fleet Availability % |
| **Maintenance Focus** | Component life limits | Downtime analysis |
| **Frequency** | After each flight | Daily (24-hour period) |

---

## How They Work Together

### Scenario: Aircraft HZ-A42 on January 31, 2025

**Daily Utilization Counter:**
```
Airframe Hours TTSN: 12,500.5 hours
Daily Flight Hours: 6.5 hours (flew 6.5 hours today)
Airframe Cycles TCSN: 4,202 cycles (2 flights today)
```

**Daily Status:**
```
POS Hours: 24 hours
FMC Hours: 20 hours (available for 20 hours)
NMCM-S Hours: 4 hours (scheduled inspection)
Availability: 83.3%
```

**Interpretation:**
- The aircraft flew 6.5 hours today (utilization)
- It was available for 20 out of 24 hours (availability)
- It was down for 4 hours due to scheduled maintenance
- The 6.5 flight hours occurred during the 20 FMC hours

### Dashboard Integration

**Executive Dashboard Shows:**
```
Fleet Availability: 91.5%  ← From Daily Status
Total Flight Hours: 450    ← From Daily Counters (aggregated)
Total Cycles: 180          ← From Daily Counters (aggregated)
Active AOG Count: 2        ← From AOG Events
```

**Aircraft Detail Page Shows:**
```
Current Availability: 90.5% (last 7 days)  ← From Daily Status
Airframe Hours TTSN: 12,500.5              ← From Daily Counters
Airframe Cycles TCSN: 4,202                ← From Daily Counters
Engine 1 Hours: 8,500.2                    ← From Daily Counters
```

---

## Real-World Example

### Alpha Star Aviation Fleet (27 Aircraft)

**Monthly Report (January 2025):**

**From Daily Utilization Counters:**
- Total Fleet Flight Hours: 1,850 hours
- Total Fleet Cycles: 720 cycles
- Average Daily Utilization: 2.2 hours per aircraft
- Highest Utilization: HZ-A42 (185 hours)
- Lowest Utilization: HZ-A2 (45 hours, parked status)

**From Daily Status:**
- Fleet Availability: 91.8%
- Total POS Hours: 20,088 hours (27 aircraft × 31 days × 24 hours)
- Total FMC Hours: 18,441 hours
- Scheduled Maintenance Downtime: 1,200 hours (6.0%)
- Unscheduled Maintenance Downtime: 447 hours (2.2%)
- Supply-Related Downtime: 0 hours (0%)

**Executive Summary:**
- ✅ Fleet availability of 91.8% meets the 92% target
- ✅ Fleet flew 1,850 hours (on track for annual target)
- ⚠️ Unscheduled maintenance at 2.2% (target: <2%)
- ✅ No supply chain delays this month

---

## API Endpoints

### Daily Utilization Counters
```
GET /api/utilization?aircraftId=xxx&startDate=2025-01-01&endDate=2025-01-31
GET /api/utilization/aggregations?groupBy=month
```

### Daily Status
```
GET /api/daily-status?aircraftId=xxx&startDate=2025-01-01&endDate=2025-01-31
GET /api/daily-status/availability?groupBy=day
GET /api/daily-status/aggregations?groupBy=month
```

### Dashboard KPIs (Combined)
```
GET /api/dashboard/kpis?startDate=2025-01-01&endDate=2025-01-31
```

Returns:
```json
{
  "fleetAvailabilityPercentage": 91.8,  // From Daily Status
  "totalFlightHours": 1850,             // From Daily Counters
  "totalCycles": 720,                   // From Daily Counters
  "activeAOGCount": 2,                  // From AOG Events
  "totalPosHours": 20088,               // From Daily Status
  "totalFmcHours": 18441                // From Daily Status
}
```

---

## Glossary

| Term | Definition |
|------|------------|
| **TTSN** | Total Time Since New - cumulative hours since aircraft was manufactured |
| **TCSN** | Total Cycles Since New - cumulative cycles since aircraft was manufactured |
| **POS** | Possessed - hours the aircraft is in the operator's possession |
| **FMC** | Fully Mission Capable - hours the aircraft is available for operations |
| **NMCM-S** | Not Mission Capable - Scheduled Maintenance |
| **NMCM-U** | Not Mission Capable - Unscheduled Maintenance |
| **NMCS** | Not Mission Capable - Supply (waiting for parts) |
| **APU** | Auxiliary Power Unit - provides power when engines are off |
| **Cycle** | One takeoff and landing sequence |

---

## Summary

**Daily Utilization Counters** answer: *"How much has the aircraft been used?"*
- Cumulative lifetime hours and cycles
- Used for maintenance scheduling
- Monotonically increasing values

**Daily Status** answers: *"Is the aircraft available for operations?"*
- Daily availability percentage
- Used for fleet readiness reporting
- Resets daily, tracks downtime causes

**Together they provide:**
- Complete operational picture
- Maintenance planning data
- Executive KPI metrics
- Trend analysis capabilities

This dual-tracking approach replaces manual Excel tracking with real-time, accurate data that drives better decision-making for Alpha Star Aviation's fleet management.
