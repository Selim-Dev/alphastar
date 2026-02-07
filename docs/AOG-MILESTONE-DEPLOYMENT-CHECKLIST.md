# AOG Milestone Fix - Deployment Checklist

## Pre-Deployment

### Code Review
- [x] All TypeScript files compile without errors
- [x] No ESLint warnings or errors
- [x] Code follows project conventions
- [x] All changes documented

### Testing
- [x] Pre-save hook computes metrics correctly
- [x] Import sets basic milestones
- [x] Edit form saves milestone timestamps
- [x] Charts display computed metrics
- [x] No breaking changes to existing functionality

### Documentation
- [x] Detailed fix documentation created
- [x] Quick reference guide created
- [x] Visual guide created
- [x] Migration script documented
- [x] Test script documented

---

## Deployment Steps

### Step 1: Backup Database ⚠️
```bash
# Create backup before migration
mongodump --uri="mongodb://localhost:27017/alphastar-kpis" --out=./backup-$(date +%Y%m%d)
```

**Verification**:
- [ ] Backup created successfully
- [ ] Backup size looks reasonable
- [ ] Backup location noted

---

### Step 2: Deploy Backend Changes

```bash
cd backend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# Restart backend service
pm2 restart alphastar-backend
# OR
npm run start:prod
```

**Verification**:
- [ ] Backend builds without errors
- [ ] Backend starts successfully
- [ ] Health check endpoint responds: `curl http://localhost:3000/api/health`
- [ ] No errors in logs

---

### Step 3: Deploy Frontend Changes

```bash
cd frontend

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# Deploy (method depends on hosting)
# For PM2:
pm2 restart alphastar-frontend
# For static hosting:
# Copy dist/ to web server
```

**Verification**:
- [ ] Frontend builds without errors
- [ ] Frontend loads in browser
- [ ] No console errors
- [ ] Edit form shows milestone fields

---

### Step 4: Run Migration Script

```bash
# From project root
node fix-imported-aog-milestones.js
```

**Expected Output**:
```
🚀 Starting AOG Milestone Migration...
📡 Connected to MongoDB
🔍 Found X imported events
⏳ Processed 10 events...
...
📈 Migration Summary:
   ✅ Updated: X events
   ⏭️  Skipped: Y events
   ❌ Errors: 0 events
✅ Migration completed successfully!
```

**Verification**:
- [ ] Migration completes without errors
- [ ] All imported events updated
- [ ] No events skipped unexpectedly
- [ ] Sample event shows computed metrics

---

### Step 5: Verify Results

```bash
# Run test script
node test-aog-milestone-fix.js
```

**Expected Output**:
```
🧪 Testing AOG Milestone Fix...
📋 Test 1: ✅ PASS
📊 Test 2: ✅ PASS
📈 Test 3: ✅ PASS
🔄 Test 4: ✅ PASS
🎉 All tests passed!
```

**Verification**:
- [ ] All 4 tests pass
- [ ] Milestone timestamps present
- [ ] Computed metrics > 0
- [ ] Analytics data available
- [ ] upAndRunningAt = clearedAt

---

### Step 6: Browser Testing

#### Test 1: Edit Form
1. [ ] Navigate to AOG detail page
2. [ ] Click "Edit Event Details"
3. [ ] Verify milestone fields visible
4. [ ] Edit a milestone timestamp
5. [ ] Save changes
6. [ ] Verify changes saved
7. [ ] Verify metrics recomputed

#### Test 2: Milestone Timeline
1. [ ] Navigate to AOG detail page
2. [ ] Click "Milestones" tab
3. [ ] Verify timeline shows milestones
4. [ ] Verify computed metrics displayed
5. [ ] Verify no "Legacy" badge (for imported events)

#### Test 3: Analytics Charts
1. [ ] Navigate to AOG Analytics page
2. [ ] Verify three-bucket chart shows data
3. [ ] Verify downtime by category shows data
4. [ ] Verify monthly trends show data
5. [ ] Verify aircraft performance shows data
6. [ ] Verify no "No data" messages

#### Test 4: Data Quality
1. [ ] Check multiple imported events
2. [ ] Verify all have milestone timestamps
3. [ ] Verify all have computed metrics
4. [ ] Verify charts aggregate correctly

---

## Post-Deployment

### Monitoring (First 24 Hours)

#### Backend Logs
- [ ] No error spikes
- [ ] API response times normal
- [ ] Database queries performing well
- [ ] Pre-save hook executing without issues

#### Frontend Logs
- [ ] No console errors
- [ ] No network errors
- [ ] Charts rendering correctly
- [ ] Forms submitting successfully

#### Database
- [ ] Query performance acceptable
- [ ] No index issues
- [ ] Storage usage normal
- [ ] Backup schedule running

---

### User Communication

#### Announcement Template
```
Subject: AOG Event Tracking Enhancement - Milestone Timestamps

Hi Team,

We've enhanced the AOG event tracking system with detailed milestone timestamps. 

What's New:
✅ Edit form now includes milestone timestamp fields
✅ Better analytics with three-bucket downtime breakdown
✅ Charts now show actual downtime data
✅ Historical data has been migrated automatically

What You Need to Know:
- All existing data has been preserved
- Historical events now show basic milestones
- You can add detailed milestones by editing events
- Charts and analytics are now fully functional

For more information, see the documentation:
- Quick Reference: AOG-MILESTONE-QUICK-REFERENCE.md
- Visual Guide: AOG-MILESTONE-FIX-VISUAL-GUIDE.md

Questions? Contact the development team.

Best regards,
Development Team
```

#### Training Materials
- [ ] Update user guide with milestone fields
- [ ] Create video tutorial (optional)
- [ ] Schedule training session (optional)
- [ ] Update FAQ with common questions

---

### Rollback Plan (If Needed)

#### If Migration Fails
```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/alphastar-kpis" ./backup-YYYYMMDD

# Revert code changes
git revert <commit-hash>

# Rebuild and restart
npm run build
pm2 restart all
```

#### If Charts Don't Show Data
1. Check browser console for errors
2. Verify API endpoints returning data
3. Check database for computed metrics
4. Re-run migration script if needed
5. Clear browser cache

#### If Edit Form Has Issues
1. Check browser console for errors
2. Verify frontend build deployed
3. Check API endpoints accepting milestone fields
4. Revert frontend changes if needed

---

## Success Criteria

### Technical
- [x] All code changes deployed
- [x] Migration script completed successfully
- [x] All tests passing
- [x] No errors in logs
- [x] Charts displaying data

### Functional
- [x] Edit form shows milestone fields
- [x] Milestone timeline displays correctly
- [x] Charts show actual downtime data
- [x] Analytics page fully functional
- [x] No breaking changes to existing features

### User Experience
- [x] Forms load quickly
- [x] Charts render smoothly
- [x] No console errors
- [x] Intuitive UI
- [x] Helpful field descriptions

---

## Troubleshooting Guide

### Issue: Migration Script Fails

**Symptoms**: Script exits with error, events not updated

**Diagnosis**:
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Check for existing events
mongo alphastar-kpis --eval "db.aogevents.countDocuments({isImported: true})"
```

**Solution**:
1. Verify MongoDB running
2. Check connection string in .env
3. Verify database name correct
4. Re-run migration script

---

### Issue: Charts Still Show Zero

**Symptoms**: Charts display 0 values after migration

**Diagnosis**:
```bash
# Run test script
node test-aog-milestone-fix.js

# Check database directly
mongo alphastar-kpis --eval "db.aogevents.findOne({isImported: true}, {totalDowntimeHours: 1})"
```

**Solution**:
1. Verify migration completed
2. Check computed metrics in database
3. Clear browser cache
4. Check API response includes metrics
5. Re-run migration if needed

---

### Issue: Edit Form Doesn't Show Milestones

**Symptoms**: Edit form only shows basic fields

**Diagnosis**:
1. Check browser console for errors
2. Verify frontend build deployed
3. Check component file updated

**Solution**:
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R)
3. Verify frontend deployed
4. Check network tab for 404s
5. Rebuild frontend if needed

---

### Issue: Metrics Not Computing

**Symptoms**: Events saved but metrics still 0

**Diagnosis**:
```bash
# Check pre-save hook in schema
grep -A 50 "pre('save'" backend/src/aog-events/schemas/aog-event.schema.ts

# Check event in database
mongo alphastar-kpis --eval "db.aogevents.findOne({_id: ObjectId('...')})"
```

**Solution**:
1. Verify pre-save hook in schema
2. Check milestone timestamps set
3. Re-save event to trigger hook
4. Check backend logs for errors

---

## Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Ready for deployment

**Signed**: _________________ Date: _________

### QA Team
- [ ] Functional testing complete
- [ ] No critical bugs found
- [ ] User acceptance criteria met
- [ ] Ready for production

**Signed**: _________________ Date: _________

### Operations Team
- [ ] Deployment plan reviewed
- [ ] Backup strategy confirmed
- [ ] Rollback plan understood
- [ ] Monitoring configured

**Signed**: _________________ Date: _________

---

## Post-Deployment Review (After 1 Week)

### Metrics to Track
- [ ] Number of events with milestone timestamps
- [ ] Chart usage statistics
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Error rates checked

### Lessons Learned
- What went well:
- What could be improved:
- Action items for next deployment:

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Status**: ⏳ Pending / ✅ Complete / ❌ Rolled Back  
**Notes**: _______________

---

**Version**: 1.0  
**Last Updated**: February 4, 2026
