# Create Missing Aircraft for AOG Import

## Missing Aircraft (9 total)

You need to create these 9 aircraft before importing the AOG historical data:

1. ❌ **HZ-SKY** - Appears to be a variant of HZ-SKY1
2. ❌ **HZ-SKY 1** - Note the space! This is different from HZ-SKY1
3. ❌ **HZ-XY7** - Unknown aircraft
4. ❌ **M-IIII** - Gulfstream (similar to M-III which exists)
5. ❌ **SU-SME** - Wet lease aircraft
6. ❌ **SU-SMK** - Wet lease aircraft
7. ❌ **VP-CAL** - Cessna Citation
8. ❌ **VP-CMJ** - Similar to HZ-CMJ which exists
9. ❌ **VP-CSK** - Cessna Citation

## Option 1: Create via UI (Recommended for accuracy)

1. Login to dashboard (admin@alphastarav.com / Admin@123!)
2. Navigate to Aircraft management page
3. Click "Add Aircraft"
4. For each missing aircraft, enter:
   - **Registration**: (exact as shown above)
   - **Fleet Group**: (A340, Cessna, Gulfstream, etc.)
   - **Aircraft Type**: (specific model)
   - **Owner**: (Alpha Star Aviation, Sky Prime Aviation, or RSAF)
   - **Engines Count**: (2 or 4)
   - **Status**: active

## Option 2: Create via API Script

Run this script to create all missing aircraft with default values:

```bash
node create-missing-aircraft-api.js
```

**Note**: This will create aircraft with generic fleet groups. You should update them later with correct information.

## Option 3: Fix Data Issues First

Some aircraft might be data quality issues:

### HZ-SKY vs HZ-SKY1
- Your data has both "HZ-SKY" and "HZ-SKY1"
- These might be the same aircraft
- **Recommendation**: Update Excel file to use consistent registration

### HZ-SKY 1 (with space)
- This has a space in the registration
- Likely a typo for "HZ-SKY1"
- **Recommendation**: Fix in Excel file before import

### M-IIII vs M-III
- Seed has "M-III"
- Your data has "M-IIII" (4 I's)
- **Recommendation**: Verify correct registration

## Recommended Approach

1. **First, clean the data**:
   - Fix "HZ-SKY 1" → "HZ-SKY1" (remove space)
   - Verify "M-IIII" vs "M-III"
   - Consolidate "HZ-SKY" and "HZ-SKY1" if they're the same

2. **Then create remaining aircraft** via UI with correct details

3. **Finally, import the AOG data**

## Quick Fix Script

I'll create a script to clean the Excel file and fix obvious issues.

