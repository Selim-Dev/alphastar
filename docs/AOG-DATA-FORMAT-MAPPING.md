# AOG Data Format Mapping

## Overview

This document shows how your original markdown data maps to the Excel import format.

## Column Mapping

| Your Original Column | Excel Column | System Field | Notes |
|---------------------|--------------|--------------|-------|
| AIRCRAFT | Aircraft | `aircraftId` | Must match existing aircraft registration |
| WO / Defect | Defect Description | `reasonCode` + `actionTaken` | Combined into one description |
| Location | Location | `location` | ICAO airport code |
| AOG/OOS | Category | `category` | Mapped to system categories |
| Start Date | Start Date | `detectedAt` (date part) | YYYY-MM-DD format |
| Time | Start Time | `detectedAt` (time part) | HH:MM format (24-hour) |
| Finish Date | Finish Date | `clearedAt` (date part) | YYYY-MM-DD format (empty = active) |
| Time.1 | Finish Time | `clearedAt` (time part) | HH:MM format (empty = active) |
| Total Days/Time | *(computed)* | `totalDowntimeHours` | System calculates automatically |

## Category Mapping

Your data uses these categories, which map directly to system categories:

| Your Category | System Category | Description |
|--------------|-----------------|-------------|
| AOG | `aog` | Aircraft On Ground (critical) |
| S-MX | `scheduled` | Scheduled Maintenance |
| U-MX | `unscheduled` | Unscheduled Maintenance |
| MRO | `mro` | MRO Facility Visit |
| CLEANING | `cleaning` | Operational Cleaning |

## Example Mappings

### Example 1: Complete AOG Event

**Your Original Data:**
```
AIRCRAFT: VP-CSK
WO / Defect: OXYGEN GENERATOR PAX IS DUE
Location: OERK
AOG/OOS: AOG
Start Date: 2024-01-04
Time: 23:59
Finish Date: 2024-01-11
Time.1: 16:00
Total Days/Time: 280 Hrs
```

**Excel Format:**
```
Aircraft: VP-CSK
Defect Description: OXYGEN GENERATOR PAX IS DUE
Location: OERK
Category: AOG
Start Date: 2024-01-04
Start Time: 23:59
Finish Date: 2024-01-11
Finish Time: 16:00
```

**System Creates:**
```json
{
  "aircraftId": "<VP-CSK ObjectId>",
  "detectedAt": "2024-01-04T23:59:00Z",
  "clearedAt": "2024-01-11T16:00:00Z",
  "category": "aog",
  "reasonCode": "OXYGEN GENERATOR PAX IS DUE",
  "actionTaken": "OXYGEN GENERATOR PAX IS DUE",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0,
  "isLegacy": true,
  "totalDowntimeHours": 280.02
}
```

### Example 2: Scheduled Maintenance (Long Duration)

**Your Original Data:**
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

**Excel Format:**
```
Aircraft: HZ-A11
Defect Description: MRO VISIT FOR S-MX
Location: LFBF
Category: S-MX
Start Date: 2023-10-06
Start Time: 15:00
Finish Date: 2024-05-09
Finish Time: 15:00
```

**System Creates:**
```json
{
  "aircraftId": "<HZ-A11 ObjectId>",
  "detectedAt": "2023-10-06T15:00:00Z",
  "clearedAt": "2024-05-09T15:00:00Z",
  "category": "scheduled",
  "reasonCode": "MRO VISIT FOR S-MX",
  "actionTaken": "MRO VISIT FOR S-MX",
  "location": "LFBF",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0,
  "isLegacy": true,
  "totalDowntimeHours": 5184
}
```

### Example 3: Active Event (No Finish Date)

**Your Original Data:**
```
AIRCRAFT: HZ-SK5
WO / Defect: R GCU FAIL
Location: OERK
AOG/OOS: AOG
Start Date: 2026-01-27
Time: 08:04
Finish Date: (empty)
Time.1: (empty)
Total Days/Time: (empty)
```

**Excel Format:**
```
Aircraft: HZ-SK5
Defect Description: R GCU FAIL
Location: OERK
Category: AOG
Start Date: 2026-01-27
Start Time: 08:04
Finish Date: (empty)
Finish Time: (empty)
```

**System Creates:**
```json
{
  "aircraftId": "<HZ-SK5 ObjectId>",
  "detectedAt": "2026-01-27T08:04:00Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "R GCU FAIL",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0,
  "isLegacy": true,
  "totalDowntimeHours": "<computed from now>"
}
```

## Default Values for Legacy Data

Since your historical data doesn't include all fields, the system uses these defaults:

| Field | Default Value | Reason |
|-------|---------------|--------|
| `responsibleParty` | `Internal` | Can be updated later if known |
| `manpowerCount` | `0` | Historical data unavailable |
| `manHours` | `0` | Historical data unavailable |
| `internalCost` | `0` | Historical data unavailable |
| `externalCost` | `0` | Historical data unavailable |
| `isLegacy` | `true` | Marks as imported historical data |
| `reportedAt` | Same as `detectedAt` | No milestone data available |
| `upAndRunningAt` | Same as `clearedAt` | No milestone data available |

## What Gets Computed Automatically?

The system automatically calculates:

1. **Total Downtime Hours**
   ```
   totalDowntimeHours = (clearedAt - detectedAt) in hours
   ```

2. **Active Status**
   ```
   isActive = (clearedAt === null)
   ```

3. **Duration Display**
   ```
   If < 24 hours: "X hours"
   If >= 24 hours: "X days Y hours"
   ```

## Data Validation Rules

The import will validate:

✅ **Required Fields:**
- Aircraft (must exist in system)
- Defect Description (not empty)
- Category (must be: AOG, S-MX, U-MX, MRO, CLEANING)
- Start Date (valid date format)
- Start Time (valid time format)

✅ **Optional Fields:**
- Location (can be empty)
- Finish Date (empty = active event)
- Finish Time (empty = active event)

✅ **Date/Time Validation:**
- Start Date must be valid date (YYYY-MM-DD)
- Start Time must be valid time (HH:MM)
- Finish Date must be >= Start Date (if provided)
- Finish Time must be >= Start Time (if same day)

## Aircraft Registration Matching

The system will try to match aircraft registrations:

**Exact Match (Case-Insensitive):**
- Your data: `HZ-A11` → System: `HZ-A11` ✅
- Your data: `hz-a11` → System: `HZ-A11` ✅
- Your data: `VP-CSK` → System: `VP-CSK` ✅

**Partial Match (Trimmed):**
- Your data: ` HZ-A11 ` → System: `HZ-A11` ✅
- Your data: `HZ-A11  ` → System: `HZ-A11` ✅

**No Match:**
- Your data: `HZ-A99` → System: (not found) ❌
- Action: Create aircraft first, then re-import

## Location Codes

Your data uses ICAO airport codes:

| Code | Airport | Country |
|------|---------|---------|
| OERK | King Khaled International Airport | Saudi Arabia (Riyadh) |
| LFSB | EuroAirport Basel-Mulhouse-Freiburg | France/Switzerland |
| LFBF | Châteauroux-Déols Airport | France |
| OEJN | King Abdulaziz International Airport | Saudi Arabia (Jeddah) |
| OJAI | Prince Abdul Mohsin Bin Abdulaziz Airport | Saudi Arabia (Yanbu) |
| OMDB | Dubai International Airport | UAE |
| EDDH | Hamburg Airport | Germany |

These are preserved as-is in the system.

## Time Zone Handling

**Important:** All times are stored in UTC (Coordinated Universal Time).

- Your data times are assumed to be in local time
- System converts to UTC for storage
- Display times are shown in user's local timezone

**Example:**
- Your data: `2024-01-04 23:59` (local time)
- System stores: `2024-01-04T23:59:00Z` (UTC)
- Display: Converts to user's timezone

## Summary

Your data format is **perfectly compatible** with the Excel import format. The conversion script has already mapped everything correctly:

✅ All 197 events converted  
✅ Column names mapped  
✅ Categories mapped  
✅ Date/time formats correct  
✅ Ready to import  

**Next step:** Upload `aog_historical_data_import.xlsx` to the Import page!

---

**Reference Documents:**
- `AOG-DATA-READY-SUMMARY.md` - Quick start guide
- `AOG-HISTORICAL-DATA-IMPORT-INSTRUCTIONS.md` - Detailed instructions
- `AOG-IMPORT-GUIDE.md` - General import guide
- `AOG-EVENT-CREATION-GUIDE.md` - Event creation guide
