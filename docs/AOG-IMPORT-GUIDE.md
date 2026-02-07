# AOG/OOS Data Import Guide

## Overview

This guide explains how to import historical AOG/OOS data from Excel into the Alpha Star Aviation KPI Dashboard.

## Excel Format Requirements

### Required Columns

| Excel Column | System Field | Notes |
|--------------|--------------|-------|
| AIRCRAFT | `aircraftId` | Must match existing aircraft registration (e.g., HZ-A11) |
| WO / Defect | `reasonCode` + `actionTaken` | Split into reason and action |
| Location | `location` | ICAO airport code (e.g., OERK, LFSB) |
| AOG/OOS | `category` | Maps to: AOG, S-MX, U-MX, MRO, CLEANING |
| Start Date | `detectedAt` (date) | **Accepts: YYYY-MM-DD or MM/DD/YYYY** |
| Time | `detectedAt` (time) | Combined with Start Date (HH:MM format) |
| Finish Date | `clearedAt` (date) | **Accepts: YYYY-MM-DD or MM/DD/YYYY** (optional for active events) |
| Time.1 | `clearedAt` (time) | Combined with Finish Date (optional) |
| Total Days/Time | Computed | System calculates from detectedAt and clearedAt |

### Date Format Flexibility ✨

**Good news!** The system now accepts dates in multiple formats:

- **ISO Format**: `YYYY-MM-DD` (e.g., `2026-01-21`)
- **US Format**: `MM/DD/YYYY` (e.g., `1/24/2026` or `01/24/2026`)
- **Mixed Formats**: You can use both formats in the same file!

**Examples of valid dates:**
```
Start Date       Finish Date
2026-01-21       2026-01-22      ✅ ISO format
1/24/2026        1/25/2026       ✅ US format
2026-01-21       1/22/2026       ✅ Mixed formats
01/24/2026       01/25/2026      ✅ With leading zeros
```

**Time format** remains `HH:MM` (24-hour format, e.g., `14:30`)

### Category Mapping

| Excel Value | System Category | Description |
|-------------|-----------------|-------------|
| AOG | `aog` | Aircraft On Ground (critical) |
| S-MX | `scheduled` | Scheduled Maintenance |
| U-MX | `unscheduled` | Unscheduled Maintenance |
| MRO | `mro` | MRO Facility Visit |
| CLEANING | `cleaning` | Operational Cleaning |

### Default Values for Missing Data

Since historical data lacks some fields, the import will use these defaults:

| Field | Default Value | Reason |
|-------|---------------|--------|
| `responsibleParty` | `Internal` | Can be updated later |
| `manpowerCount` | `0` | Historical data unavailable |
| `manHours` | `0` | Historical data unavailable |
| `isLegacy` | `true` | Marks as imported historical data |
| `reportedAt` | Same as `detectedAt` | No milestone data available |
| `upAndRunningAt` | Same as `clearedAt` | No milestone data available |

## Import Process

### Step 1: Prepare Excel File

1. Ensure aircraft registrations match exactly (case-insensitive)
2. Verify ICAO location codes are valid
3. Check date/time formats are consistent
4. Remove any duplicate entries

### Step 2: Upload via Import Page

1. Navigate to `/import` page
2. Select "AOG Events" as import type
3. Upload Excel file
4. Review validation errors (if any)
5. Confirm import

### Step 3: Post-Import Verification

1. Check AOG List page for imported events
2. Verify aircraft assignments are correct
3. Update `responsibleParty` for critical events
4. Add milestone data for recent events (optional)

## Data Quality Recommendations

### For Future Data Entry

To get full analytics benefits, include:

1. **Milestone Timestamps** (for events after import):
   - `reportedAt` - When issue was first reported
   - `procurementRequestedAt` - When parts were requested (if applicable)
   - `availableAtStoreAt` - When parts arrived
   - `installationCompleteAt` - When repair work finished
   - `testStartAt` - When ops testing started (if applicable)
   - `upAndRunningAt` - When aircraft returned to service

2. **Cost Data**:
   - `internalCost` - Labor and man-hours cost
   - `externalCost` - Vendor and third-party costs

3. **Manpower Data**:
   - `manpowerCount` - Number of technicians involved
   - `manHours` - Total labor hours

4. **Responsible Party**:
   - Accurately assign: Internal, OEM, Customs, Finance, Other

## Relationship with Daily Status

### Important: AOG Events vs Daily Status

**AOG Events** and **Daily Status** are complementary but serve different purposes:

#### AOG Events (Event-Based)
- Track specific grounding incidents
- Focus on downtime causes and resolution
- Include milestone tracking for bottleneck analysis
- Used for: Root cause analysis, cost tracking, responsibility attribution

#### Daily Status (Time-Based)
- Track aircraft availability every day (24-hour periods)
- Record FMC (Fully Mission Capable) hours
- Record NMC (Not Mission Capable) hours by type:
  - `nmcmSHours` - Scheduled maintenance
  - `nmcmUHours` - Unscheduled maintenance
  - `nmcsHours` - Supply/parts waiting
- Used for: Availability percentage, fleet-wide metrics, trend analysis

### How They Work Together

```
Example: HZ-A11 has an AOG event on 2024-01-04

AOG Event Record:
- detectedAt: 2024-01-04 23:59
- clearedAt: 2024-01-11 16:00
- category: aog
- reasonCode: "OXYGEN GENERATOR PAX IS DUE"
- totalDowntimeHours: 280 hours

Daily Status Records (should be created for each day):
- 2024-01-04: posHours=24, fmcHours=0, nmcmUHours=24 (unscheduled)
- 2024-01-05: posHours=24, fmcHours=0, nmcmUHours=24
- 2024-01-06: posHours=24, fmcHours=0, nmcmUHours=24
- ...
- 2024-01-11: posHours=24, fmcHours=8, nmcmUHours=16 (cleared at 16:00)
```

### Recommendation for Client

**For historical AOG/OOS data import:**

1. **Import AOG events first** (from the provided Excel)
   - This gives you the event timeline and downtime tracking
   - Marks events as `isLegacy=true` for limited analytics

2. **Optionally create Daily Status records** (if needed for availability metrics)
   - For each day an aircraft was OOS, create a daily status entry
   - Set `fmcHours=0` and `nmcmSHours` or `nmcmUHours` based on event category
   - This enables accurate availability percentage calculations

3. **Going forward, maintain both**:
   - Create AOG event when incident occurs
   - Update daily status every day (can be automated)
   - This gives complete visibility: event details + daily availability

### Suggested Format for Client

If the client wants to provide daily status data alongside AOG events, suggest this format:

```
Daily Status Template:
| Aircraft | Date | POS Hours | FMC Hours | NMCM-S Hours | NMCM-U Hours | Notes |
|----------|------|-----------|-----------|--------------|--------------|-------|
| HZ-A11   | 2024-01-04 | 24 | 0 | 0 | 24 | AOG - Oxygen Generator |
| HZ-A11   | 2024-01-05 | 24 | 0 | 0 | 24 | AOG - Oxygen Generator |
```

**Or**, the system can auto-generate daily status from AOG events:
- When AOG event is created, automatically create daily status entries for the downtime period
- User can manually adjust if needed

## Example Import Scenarios

### Scenario 1: Simple AOG Event (Complete Data)

```
Excel Row:
AIRCRAFT: HZ-A11
WO / Defect: OXYGEN GENERATOR PAX IS DUE
Location: OERK
AOG/OOS: AOG
Start Date: 2024-01-04
Time: 23:59
Finish Date: 2024-01-11
Time.1: 16:00
Total Days/Time: 280 Hrs

System Creates:
{
  aircraftId: <HZ-A11 ObjectId>,
  detectedAt: 2024-01-04T23:59:00Z,
  clearedAt: 2024-01-11T16:00:00Z,
  category: 'aog',
  reasonCode: 'OXYGEN GENERATOR PAX IS DUE',
  actionTaken: 'OXYGEN GENERATOR PAX IS DUE', // Same as reason if not split
  location: 'OERK',
  responsibleParty: 'Internal', // Default
  manpowerCount: 0, // Default
  manHours: 0, // Default
  isLegacy: true,
  totalDowntimeHours: 280.02 // Computed
}
```

### Scenario 2: Active AOG Event (No Finish Date)

```
Excel Row:
AIRCRAFT: HZ-SK5
WO / Defect: R GCU FAIL
Location: OERK
AOG/OOS: AOG
Start Date: 2026-01-27
Time: 08:04
Finish Date: (empty)
Time.1: (empty)
Total Days/Time: (empty)

System Creates:
{
  aircraftId: <HZ-SK5 ObjectId>,
  detectedAt: 2026-01-27T08:04:00Z,
  clearedAt: null, // Active event
  category: 'aog',
  reasonCode: 'R GCU FAIL',
  actionTaken: 'R GCU FAIL',
  location: 'OERK',
  responsibleParty: 'Internal',
  manpowerCount: 0,
  manHours: 0,
  isLegacy: true,
  totalDowntimeHours: <computed from now>
}
```

### Scenario 3: Scheduled Maintenance (S-MX)

```
Excel Row:
AIRCRAFT: HZ-A11
WO / Defect: MRO VISIT FOR S-MX
Location: LFBF
AOG/OOS: S-MX
Start Date: 2023-10-06
Time: 15:00
Finish Date: 2024-05-09
Time.1: 15:00
Total Days/Time: 5184 Hrs

System Creates:
{
  aircraftId: <HZ-A11 ObjectId>,
  detectedAt: 2023-10-06T15:00:00Z,
  clearedAt: 2024-05-09T15:00:00Z,
  category: 'scheduled', // Mapped from S-MX
  reasonCode: 'MRO VISIT FOR S-MX',
  actionTaken: 'MRO VISIT FOR S-MX',
  location: 'LFBF',
  responsibleParty: 'Internal',
  manpowerCount: 0,
  manHours: 0,
  isLegacy: true,
  totalDowntimeHours: 5184
}
```

## Analytics Impact

### With Legacy Data (isLegacy=true)

**Available Analytics:**
- Total downtime hours
- Event count by aircraft
- Event count by category
- Event count by location
- Timeline visualization
- Active vs resolved events

**Limited Analytics:**
- ❌ Three-bucket breakdown (no milestone data)
- ❌ Procurement bottleneck analysis
- ❌ Cost analysis (no cost data)
- ❌ Manpower efficiency (no manpower data)

### With Full Data (isLegacy=false)

**All Analytics Available:**
- ✅ Three-bucket downtime (Technical, Procurement, Ops)
- ✅ Bottleneck identification
- ✅ Cost per event and cost trends
- ✅ Manpower efficiency
- ✅ Responsibility attribution
- ✅ Complete milestone timeline

## Recommendations for Client

1. **Import historical data as-is** (2024, 2025, 2026 data)
   - Accept that legacy data has limited analytics
   - Focus on timeline and event tracking

2. **For new events (going forward)**:
   - Use the full AOG event creation form
   - Include milestone timestamps as events progress
   - Record costs and manpower data
   - Assign responsible parties accurately

3. **Gradually enhance historical data** (optional):
   - For critical events, add milestone data if available
   - Update responsible party for major incidents
   - Add cost data if records exist

4. **Maintain daily status separately**:
   - Either manually or auto-generate from AOG events
   - Ensures accurate availability percentage calculations

## Support

For questions or issues with import:
- Check validation errors in import UI
- Verify aircraft registrations match exactly
- Contact system administrator for bulk imports
