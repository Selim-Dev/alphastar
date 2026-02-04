# AOG Event Creation - Quick Reference Card

## Two Ways to Create AOG Events

### 🔵 Simple/Legacy (Historical Data)

**When:** Importing old data, minimal information available

**Required Fields:**
```json
{
  "aircraftId": "ObjectId",
  "detectedAt": "ISO 8601 date",
  "category": "aog|scheduled|unscheduled|mro|cleaning",
  "reasonCode": "Description",
  "responsibleParty": "Internal|OEM|Customs|Finance|Other",
  "actionTaken": "What was done",
  "manpowerCount": 0,
  "manHours": 0
}
```

**Optional:**
- `clearedAt` - When resolved (null = active)
- `location` - ICAO code (e.g., OERK)
- `internalCost` - Internal costs
- `externalCost` - External costs

### 🟢 Full (With Milestones)

**When:** New events, want detailed analytics

**All Simple fields PLUS:**
```json
{
  "reportedAt": "When reported",
  "procurementRequestedAt": "When parts requested",
  "availableAtStoreAt": "When parts arrived",
  "installationCompleteAt": "When repair done",
  "testStartAt": "When testing started",
  "upAndRunningAt": "When back in service"
}
```

## Category Mapping

| Your Data | API Value | Badge Color |
|-----------|-----------|-------------|
| AOG | `aog` | 🔴 Red |
| S-MX | `scheduled` | 🔵 Blue |
| U-MX | `unscheduled` | 🟡 Amber |
| MRO | `mro` | 🟣 Purple |
| CLEANING | `cleaning` | 🟢 Green |

## Quick Examples

### Active Event (No End Date)
```json
{
  "aircraftId": "507f...",
  "detectedAt": "2026-01-27T08:04:00Z",
  "clearedAt": null,
  "category": "aog",
  "reasonCode": "R GCU FAIL",
  "actionTaken": "Troubleshooting",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

### Resolved Event
```json
{
  "aircraftId": "507f...",
  "detectedAt": "2026-01-22T12:00:00Z",
  "clearedAt": "2026-01-23T07:00:00Z",
  "category": "aog",
  "reasonCode": "Engine Low Torque",
  "actionTaken": "Repaired",
  "location": "OERK",
  "responsibleParty": "Internal",
  "manpowerCount": 0,
  "manHours": 0
}
```

## Validation Rules

✅ **Must Have:**
- Aircraft must exist
- `detectedAt` required
- Valid category
- `clearedAt` >= `detectedAt` (if provided)

✅ **Milestones Must Be In Order:**
```
reported → procurement → available → 
installation → test → running
```

## Auto-Calculated Fields

The system calculates:
- ✅ `status` - active or resolved
- ✅ `durationHours` - total downtime
- ✅ `technicalTimeHours` - if milestones provided
- ✅ `procurementTimeHours` - if milestones provided
- ✅ `opsTimeHours` - if milestones provided

## Common Mistakes to Avoid

❌ **Don't:**
- Use future dates
- Set `clearedAt` before `detectedAt`
- Mix up category values (use API values, not your Excel values)
- Forget to convert times to UTC/ISO 8601

✅ **Do:**
- Use ISO 8601 format: `2026-01-27T08:04:00Z`
- Look up aircraft ObjectId first
- Use lowercase for category: `aog` not `AOG`
- Set `clearedAt=null` for active events

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Create | `/api/aog-events` | POST |
| Update | `/api/aog-events/:id` | PUT |
| Get One | `/api/aog-events/:id` | GET |
| List All | `/api/aog-events` | GET |
| Delete | `/api/aog-events/:id` | DELETE |

## Import vs API

### Use Excel Import When:
- ✅ You have historical data in Excel
- ✅ You want to import many events at once
- ✅ You want automatic validation

### Use API When:
- ✅ Creating events programmatically
- ✅ Integrating with other systems
- ✅ Need real-time event creation

## Need Help?

📖 **Full Guides:**
- `AOG-EVENT-CREATION-GUIDE.md` - Detailed guide
- `AOG-IMPORT-GUIDE.md` - Excel import guide
- `AOG-API-DOCUMENTATION.md` - Complete API reference

🔧 **Support:**
- Email: support@alphastarav.com
- Check validation errors in API response
- Review examples in documentation

---

**Pro Tip:** For your historical data, use the Excel import feature. It's the fastest way and handles all the mapping automatically!

