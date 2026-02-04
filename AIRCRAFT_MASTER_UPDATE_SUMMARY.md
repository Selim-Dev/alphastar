# Aircraft Master Data Update Summary

## Overview
Updated the Aircraft Master data model to include two new optional fields: `certificationDate` and `inServiceDate`. This update aligns with the real-world aircraft data from Alpha Star Aviation fleet.

## Changes Made

### 1. Backend Schema (`backend/src/aircraft/schemas/aircraft.schema.ts`)
**Changed Fields:**
- `manufactureDate?: Date` - **Changed from required to optional**
- `certificationDate?: Date` - Optional field for aircraft certification date
- `inServiceDate?: Date` - Optional field for when aircraft entered service

**Rationale:** Some aircraft only have certification dates or in-service dates, not manufacture dates.

**Status:** ✅ Updated

---

### 2. Backend DTOs

#### Create Aircraft DTO (`backend/src/aircraft/dto/create-aircraft.dto.ts`)
**Changed Fields:**
```typescript
@ApiPropertyOptional({
  example: '2015-06-15',
  description: 'Aircraft manufacture date (ISO 8601 format)',
})
@IsOptional()
@IsDateString({}, { message: 'Manufacture date must be a valid ISO 8601 date string' })
manufactureDate?: string;  // CHANGED: Now optional

@ApiPropertyOptional({
  example: '2015-08-20',
  description: 'Aircraft certification date (ISO 8601 format)',
})
@IsOptional()
@IsDateString({}, { message: 'Certification date must be a valid ISO 8601 date string' })
certificationDate?: string;

@ApiPropertyOptional({
  example: '2015-09-01',
  description: 'Aircraft in-service date (ISO 8601 format)',
})
@IsOptional()
@IsDateString({}, { message: 'In-service date must be a valid ISO 8601 date string' })
inServiceDate?: string;
```

**Status:** ✅ Updated

#### Update Aircraft DTO (`backend/src/aircraft/dto/update-aircraft.dto.ts`)
**Added Fields:** Same as Create DTO (all optional)

**Status:** ✅ Updated

---

### 3. Backend Service (`backend/src/aircraft/services/aircraft.service.ts`)
**Updated Interfaces:**
- `CreateAircraftData` - Changed `manufactureDate?: Date` (now optional), added `certificationDate?: Date` and `inServiceDate?: Date`
- `UpdateAircraftData` - Added `certificationDate?: Date` and `inServiceDate?: Date`

**Status:** ✅ Updated

---

### 4. Frontend Types (`frontend/src/types/index.ts`)
**Updated Aircraft Interface:**
```typescript
export interface Aircraft {
  _id: string;
  id?: string;
  registration: string;
  fleetGroup: string;
  aircraftType: string;
  msn: string;
  owner: string;
  manufactureDate: string;
  certificationDate?: string;  // NEW
  inServiceDate?: string;      // NEW
  enginesCount: number;
  status: 'active' | 'parked' | 'leased';
  createdAt: string;
  updatedAt: string;
}
```

**Status:** ✅ Updated

---

### 5. Frontend UI (`frontend/src/pages/AircraftDetailPage.tsx`)
**Updated Display:**
- Added conditional rendering for `certificationDate` if present
- Added conditional rendering for `inServiceDate` if present
- Both fields display in the Aircraft Information card

**Status:** ✅ Updated

---

### 6. Seed Data (`backend/src/scripts/seed.ts`)
**Updated AIRCRAFT_DATA:**
- Replaced all 17 aircraft records with new data from `frontend/new_aircraft_master.ts`
- Includes proper values for `certificationDate` and `inServiceDate` where available
- Uses `undefined` for null values to match TypeScript conventions
- Updated fleet groups to match actual data (e.g., "AIRBUS A320 FAMILY", "GULFSTREAM")
- Updated MSN values to match actual aircraft data
- Added new aircraft types (ATR, CITATION LATITUDE, KING AIR)

**Fixed Utilization Counter Calculation:**
- Now uses the earliest available date (manufactureDate, certificationDate, or inServiceDate)
- Falls back to a default date (2010-01-01) if all dates are missing
- Prevents NaN errors when calculating aircraft age

**Total Aircraft:** 27 (increased from 17)

**Status:** ✅ Updated

---

### 7. Excel Import Template (`backend/src/import-export/services/excel-template.service.ts`)
**Updated Aircraft Template:**
- Changed `aircraftType` from required to optional
- Changed `msn` from required to optional
- **Changed `manufactureDate` from required to optional**
- Added `certificationDate` column (optional, date type)
- Added `inServiceDate` column (optional, date type)
- Updated example rows to show both scenarios (with and without optional dates)
- Updated descriptions to reflect real fleet groups

**Status:** ✅ Updated

---

## Database Migration

**No migration required!** The new fields are optional, so existing aircraft records will continue to work without modification. New records can include these fields if available.

---

## Testing Checklist

### Backend
- [ ] Run seed script: `npm run seed` (in backend directory)
- [ ] Verify aircraft creation with new fields via API
- [ ] Verify aircraft update with new fields via API
- [ ] Test Excel import with new template

### Frontend
- [ ] Verify aircraft detail page displays new fields when present
- [ ] Verify aircraft detail page handles missing fields gracefully
- [ ] Test aircraft list/table views

### Excel Import
- [ ] Download new aircraft template
- [ ] Import aircraft with all fields populated
- [ ] Import aircraft with optional fields empty
- [ ] Verify validation works correctly

---

## API Examples

### Create Aircraft with New Fields
```bash
POST /api/aircraft
{
  "registration": "HZ-TEST",
  "fleetGroup": "AIRBUS A320 FAMILY",
  "aircraftType": "A320-214",
  "msn": "1234",
  "owner": "Alpha Star Aviation",
  "manufactureDate": "2015-06-15",
  "certificationDate": "2015-08-20",
  "inServiceDate": "2015-09-01",
  "enginesCount": 2,
  "status": "active"
}
```

### Update Aircraft with New Fields
```bash
PUT /api/aircraft/:id
{
  "certificationDate": "2015-08-20",
  "inServiceDate": "2015-09-01"
}
```

---

## Excel Template Format

| Registration | Fleet Group | Aircraft Type | MSN | Owner | Manufacture Date | Certification Date | In Service Date | Engines Count | Status |
|--------------|-------------|---------------|-----|-------|------------------|-------------------|-----------------|---------------|--------|
| HZ-A42 | AIRBUS 340 | A340-642 ACJ | 924 | Alpha Star Aviation | 2008-08-04 | | 2012-05-25 | 4 | active |
| HZ-SKY1 | AIRBUS 340 | A340-212 ACJ | 9 | Alpha Star Aviation | | 1993-01-13 | 1993-01-13 | 4 | active |

**Note:** Empty cells for optional date fields are acceptable.

---

## Files Modified

1. ✅ `backend/src/aircraft/schemas/aircraft.schema.ts`
2. ✅ `backend/src/aircraft/dto/create-aircraft.dto.ts`
3. ✅ `backend/src/aircraft/dto/update-aircraft.dto.ts`
4. ✅ `backend/src/aircraft/services/aircraft.service.ts`
5. ✅ `frontend/src/types/index.ts`
6. ✅ `frontend/src/pages/AircraftDetailPage.tsx`
7. ✅ `backend/src/scripts/seed.ts`
8. ✅ `backend/src/import-export/services/excel-template.service.ts`

---

## Next Steps

1. **Run the seed script** to populate the database with updated aircraft data:
   ```bash
   cd backend
   npm run seed
   ```

2. **Test the changes** in the frontend by viewing aircraft details

3. **Download the new Excel template** and test importing aircraft data

4. **Update any existing documentation** that references the aircraft data structure

---

## Notes

- All new fields are **optional** to maintain backward compatibility
- The seed data now includes **27 aircraft** from the actual Alpha Star Aviation fleet
- Excel import supports both populated and empty values for optional fields
- Frontend gracefully handles missing optional fields with conditional rendering
- No breaking changes to existing API contracts
