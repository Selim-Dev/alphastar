# AOG Event Creation Guide

## Overview

This guide explains how to create AOG events correctly, covering both **simple/legacy events** (imported historical data) and **full events** (with milestone tracking).

## Understanding the Two Approaches

### Approach 1: Simple/Legacy Events (Historical Data)

**Use when:**
- Importing historical data from Excel
- You only have basic information (start date, end date, defect description)
- No detailed milestone tracking available

**Required Fields:**
- `aircraftId` - Aircraft ObjectId
- `detectedAt` - When the event started
- `category` - Event type (aog, scheduled, unscheduled, mro, cleaning)
- `reasonCode` - Defect description
- `responsibleParty` - Who is responsible
- `actionTaken` - What was done
- `manpowerCount` - Number of people (can be 0 for historical)
- `manHours` - Total hours (can be 0 for historical)

**Optional Fields:**
- `clearedAt` - When resolved (null = still active)
- `location` - ICAO airport code
- `internalCost` - Internal costs
- `externalCost` - External costs

**Example from your seed data:**

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting in progress",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

### Approach 2: Full Events (With Milestone Tracking)

**Use when:**
- Creating new events going forward
- You want detailed analytics (three-bucket breakdown)
- You can track milestones as the event progresses

**Required Fields:** (Same as Approach 1)

**Additional Optional Milestone Fields:**
- `reportedAt` - When issue was first reported (defaults to detectedAt)
- `procurementRequestedAt` - When parts were requested
- `availableAtStoreAt` - When parts arrived
- `issuedBackAt` - When parts issued to maintenance
- `installationCompleteAt` - When repair work finished
- `testStartAt` - When ops testing started
- `upAndRunningAt` - When aircraft returned to service (defaults to clearedAt)

**Example:**

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00Z",
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Replaced GCU unit",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 3,
  "manHours": 24,
  "reportedAt": "2026-01-27T08:04:00Z",
  "procurementRequestedAt": "2026-01-27T10:30:00Z",
  "availableAtStoreAt": "2026-01-29T14:00:00Z",
  "installationCompleteAt": "2026-01-30T16:00:00Z",
  "upAndRunningAt": "2026-01-31T08:00:00Z",
  "clearedAt": "2026-01-31T08:00:00Z",
  "internalCost": 5000,
  "externalCost": 15000
}
```

## Mapping Your Seed Data to API

Looking at your seed data, here's how to map it:

### Example 1: Active Event (HZ-SK5)

**Seed Data:**
```
AIRCRAFT: HZ-SK5
WO / Defect: R GCU FAIL
Location: OERK
AOG/OOS: AOG
Start Date: 2026-01-27
Time: 08:04
Finish Date: (empty)
Time.1: (empty)
```

**API Request:**
```json
POST /api/aog-events
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:04:00Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting in progress",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

### Example 2: Resolved Event (HZ-A24)

**Seed Data:**
```
AIRCRAFT: HZ-A24
WO / Defect: Engine No:2 Low Torque.
Location: OERK
AOG/OOS: AOG
Start Date: 2026-01-22
Time: 12:00
Finish Date: 2026-01-23
Time.1: 07:00
Total Days/Time: 19HRS
```

**API Request:**
```json
POST /api/aog-events
{
  "aircraftId": "507f1f77bcf86cd799439013",
  "detectedAt": "2026-01-22T12:00:00Z",
  "clearedAt": "2026-01-23T07:00:00Z",
  "category": "aog",
  "reasonCode": "Engine No:2 Low Torque",
  "actionTaken": "Engine troubleshooting and repair completed",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

### Example 3: Scheduled Maintenance (HZ-A11)

**Seed Data:**
```
AIRCRAFT: HZ-A11
WO / Defect: MRO VISIT FOR S-MX
Location: LFBF
AOG/OOS: S-MX
Start Date: 2023-10-06
Time: 15:00
Finish Date: 2024-05-09
Time.1: 15:00
Total Days/Time: 5184 Hrs
```

**API Request:**
```json
POST /api/aog-events
{
  "aircraftId": "507f1f77bcf86cd799439014",
  "detectedAt": "2023-10-06T15:00:00Z",
  "clearedAt": "2024-05-09T15:00:00Z",
  "category": "scheduled",
  "reasonCode": "MRO VISIT FOR S-MX",
  "actionTaken": "Scheduled maintenance completed at MRO facility",
  "location": "LFBF",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

## Category Mapping

Your seed data uses these values in the "AOG/OOS" column:

| Seed Data Value | API Category Value | Description |
|-----------------|-------------------|-------------|
| AOG | `aog` | Aircraft On Ground (critical) |
| S-MX | `scheduled` | Scheduled Maintenance |
| U-MX | `unscheduled` | Unscheduled Maintenance |
| MRO | `mro` | MRO Facility Visit |
| CLEANING | `cleaning` | Operational Cleaning |

## Best Practices

### For Historical Data Import (Your Current Situation)

1. **Use the Excel Import Feature** (Recommended)
   - Download template from Import page
   - Fill with your seed data
   - Upload and validate
   - Confirm import
   - System automatically sets `isLegacy=true`

2. **Or Create via API** (Manual)
   - Use simple approach (Approach 1)
   - Set `manpowerCount=0` and `manHours=0` for historical data
   - Set `responsibleParty='Internal'` as default
   - System will calculate duration automatically

### For New Events Going Forward

1. **Start Simple**
   - Create event with basic fields when issue is detected
   - Set `clearedAt=null` for active events

2. **Update with Milestones**
   - As event progresses, update with milestone timestamps
   - Use PUT /api/aog-events/:id to add milestones

3. **Close Event**
   - When resolved, set `clearedAt` and `upAndRunningAt`
   - System calculates three-bucket breakdown automatically

## Common Scenarios

### Scenario 1: Quick AOG Event (No Parts Needed)

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:00:00Z",
  "clearedAt": "2026-01-27T16:00:00Z",
  "category": "aog",
  "reasonCode": "Software reset required",
  "actionTaken": "Performed software reset",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 2,
  "manHours": 4,
  "reportedAt": "2026-01-27T08:00:00Z",
  "installationCompleteAt": "2026-01-27T12:00:00Z",
  "upAndRunningAt": "2026-01-27T16:00:00Z",
  "internalCost": 800
}
```

**Result:** No procurement time, only technical time.

### Scenario 2: AOG with Parts Procurement

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-01-27T08:00:00Z",
  "clearedAt": "2026-01-31T16:00:00Z",
  "category": "aog",
  "reasonCode": "Hydraulic pump failure",
  "actionTaken": "Replaced hydraulic pump",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 3,
  "manHours": 24,
  "reportedAt": "2026-01-27T08:00:00Z",
  "procurementRequestedAt": "2026-01-27T10:00:00Z",
  "availableAtStoreAt": "2026-01-30T14:00:00Z",
  "installationCompleteAt": "2026-01-31T12:00:00Z",
  "upAndRunningAt": "2026-01-31T16:00:00Z",
  "internalCost": 5000,
  "externalCost": 15000
}
```

**Result:** Three-bucket breakdown shows technical, procurement, and ops time.

### Scenario 3: Scheduled Maintenance

```json
{
  "aircraftId": "507f1f77bcf86cd799439012",
  "detectedAt": "2026-02-01T08:00:00Z",
  "clearedAt": "2026-02-05T16:00:00Z",
  "category": "scheduled",
  "reasonCode": "A-Check scheduled maintenance",
  "actionTaken": "Completed A-Check tasks",
  "location": "LFSB",
  "responsibleParty": "Internal",
  "manpowerCount": 5,
  "manHours": 120,
  "internalCost": 25000
}
```

**Result:** Scheduled maintenance tracked for planning purposes.

## Validation Rules

The system validates:

1. **Required Fields**
   - `aircraftId` must exist in database
   - `detectedAt` is required
   - `category` must be valid enum value
   - `reasonCode` is required
   - `responsibleParty` is required
   - `actionTaken` is required
   - `manpowerCount` >= 0
   - `manHours` >= 0

2. **Date Logic**
   - `clearedAt` must be >= `detectedAt` (if provided)
   - Milestone timestamps must be in chronological order

3. **Milestone Order** (if provided)
   ```
   reportedAt ≤ procurementRequestedAt ≤ availableAtStoreAt 
   ≤ issuedBackAt ≤ installationCompleteAt ≤ testStartAt 
   ≤ upAndRunningAt
   ```

## Default Values

If you don't provide these fields, the system uses defaults:

| Field | Default Value | When |
|-------|---------------|------|
| `reportedAt` | Same as `detectedAt` | If not provided |
| `upAndRunningAt` | Same as `clearedAt` | If not provided |
| `isLegacy` | `false` | For new events |
| `isLegacy` | `true` | For imported events |

## Computed Fields

The system automatically calculates:

- `status` - 'active' if `clearedAt` is null, else 'resolved'
- `durationHours` - Hours between `detectedAt` and `clearedAt` (or now)
- `technicalTimeHours` - Technical bucket time (if milestones provided)
- `procurementTimeHours` - Procurement bucket time (if milestones provided)
- `opsTimeHours` - Ops bucket time (if milestones provided)
- `totalDowntimeHours` - Total downtime (reportedAt → upAndRunningAt)

## Updating Events

### Update Basic Fields

```json
PUT /api/aog-events/:id
{
  "actionTaken": "Updated action description",
  "location": "OEJN"
}
```

### Mark as Resolved

```json
PUT /api/aog-events/:id
{
  "clearedAt": "2026-01-31T16:00:00Z",
  "upAndRunningAt": "2026-01-31T16:00:00Z",
  "actionTaken": "Issue resolved, aircraft returned to service"
}
```

### Add Milestones Progressively

**Step 1: Report Issue**
```json
POST /api/aog-events
{
  "aircraftId": "...",
  "detectedAt": "2026-01-27T08:00:00Z",
  "category": "aog",
  "reasonCode": "Hydraulic leak",
  "actionTaken": "Investigating",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 2,
  "manHours": 0,
  "reportedAt": "2026-01-27T08:00:00Z"
}
```

**Step 2: Request Parts**
```json
PUT /api/aog-events/:id
{
  "procurementRequestedAt": "2026-01-27T10:00:00Z",
  "actionTaken": "Parts requested from supplier"
}
```

**Step 3: Parts Arrive**
```json
PUT /api/aog-events/:id
{
  "availableAtStoreAt": "2026-01-29T14:00:00Z",
  "actionTaken": "Parts received, starting installation"
}
```

**Step 4: Installation Complete**
```json
PUT /api/aog-events/:id
{
  "installationCompleteAt": "2026-01-30T16:00:00Z",
  "manHours": 24,
  "actionTaken": "Installation complete, testing"
}
```

**Step 5: Resolved**
```json
PUT /api/aog-events/:id
{
  "clearedAt": "2026-01-31T08:00:00Z",
  "upAndRunningAt": "2026-01-31T08:00:00Z",
  "actionTaken": "Aircraft returned to service",
  "internalCost": 5000,
  "externalCost": 15000
}
```

## Recommendations

### For Your Current Situation (Historical Data)

1. **Use Excel Import** - Fastest way to import your seed data
   - Maps directly to your Excel format
   - Handles all validation
   - Sets `isLegacy=true` automatically

2. **Accept Limited Analytics** - Historical data won't have:
   - Three-bucket breakdown
   - Milestone tracking
   - Detailed cost analysis

3. **Focus on Timeline** - You'll still get:
   - Event count by aircraft
   - Duration calculations
   - Category distribution
   - Location analysis
   - Trend analysis

### For Future Events

1. **Start with Basic Info** - When issue detected:
   - Aircraft, date/time, category, description
   - Set as active (`clearedAt=null`)

2. **Add Milestones as You Go** - Update event:
   - When parts requested
   - When parts arrive
   - When installation complete
   - When testing starts
   - When resolved

3. **Track Costs** - Add costs when known:
   - Internal labor costs
   - External vendor costs

4. **Assign Responsibility** - Accurately set:
   - Internal, OEM, Customs, Finance, Other
   - Helps identify bottlenecks

## Summary

**For Historical Data (Your Seed Data):**
- Use simple approach (Approach 1)
- Required: aircraft, dates, category, description
- Optional: location, costs
- System handles the rest

**For New Events:**
- Start simple, add details as event progresses
- Use milestones for detailed analytics
- Track costs and manpower
- Update status when resolved

**Key Takeaway:**
The system is flexible - you can use it simply (like your historical data) or with full detail (for new events). Both approaches work, but full detail gives better analytics.

