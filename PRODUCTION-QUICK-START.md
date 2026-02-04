# Production Quick Start - Alpha Star Aviation

## 🚀 Initial Setup (One-Time)

### 1. Clear Database & Run Production Seed

```cmd
# Drop existing database (if needed)
mongosh
use alphastar-kpis
db.dropDatabase()
exit

# Run production seed (creates ONLY users + aircraft)
cd backend
npm run seed:prod
```

**Creates:**
- ✅ 1 Admin user
- ✅ 27 Aircraft
- ❌ NO dummy data

---

### 2. Login & Change Password

```
URL: http://localhost:5173
Email: admin@alphastarav.com
Password: Admin@123!

⚠️ CHANGE PASSWORD IMMEDIATELY!
```

---

### 3. Create User Accounts

**Admin Panel → Create Users**

**Editors (Operations Team):**
- Operations Manager
- Maintenance Manager
- Planning Manager

**Viewers (Management):**
- CEO / Fleet Director
- Finance Manager
- Operations Director

---

## 📊 Data Entry Order (Critical!)

### STEP 1: Verify Aircraft (5 minutes)
**Aircraft Page**
- Review all 27 aircraft
- Update any missing info
- Set correct status (Active/Parked)

---

### STEP 2: Input Current Counters (30-60 minutes)
**MOST IMPORTANT STEP!**

**Option A: Manual Entry**
- Go to each aircraft detail page
- Add current utilization counters
- Enter today's cumulative values

**Option B: Excel Import (Recommended)**
1. Import Page → Download "Utilization Counters" template
2. Fill one row per aircraft with current values
3. Upload and confirm

**Required Data:**
```
Aircraft | Date       | Airframe Hours | Airframe Cycles | Engine Hours | APU Hours
HZ-A42   | 2025-01-31 | 12500.5       | 4200           | 8500.2       | 6200.0
HZ-SKY1  | 2025-01-31 | 45000.0       | 15000          | 28000.0      | 12000.0
...
```

---

### STEP 3: Start Daily Status (Daily)
**Availability Page**

**For each aircraft, each day:**
```
POS Hours: 24 (default)
NMCM-S Hours: Scheduled maintenance downtime
NMCM-U Hours: Unscheduled maintenance downtime
NMCS Hours: Parts waiting downtime
```

**Example:**
```
Aircraft fully available: POS=24, NMCM-S=0, NMCM-U=0 → 100% available
Scheduled inspection: POS=24, NMCM-S=4, NMCM-U=0 → 83.3% available
AOG (parts waiting): POS=24, NMCM-S=0, NMCS=24 → 0% available
```

---

### STEP 4: Setup Budget (Optional)
**Budget Page**
- Create fiscal year budget plan
- Enter planned amounts per clause
- Record actual spend monthly

---

### STEP 5: Begin Operations Tracking
**As events occur:**
- Log AOG events (AOG Events page)
- Record maintenance tasks (Maintenance page)
- Track work orders (Work Orders page)
- Document discrepancies (Discrepancies page)

---

## 📅 Daily Routine

### Morning (10-15 minutes)
1. ✅ Update yesterday's daily status (all aircraft)
2. ✅ Update utilization counters (aircraft that flew)
3. ✅ Review active AOG events

### Throughout Day
1. ✅ Log new AOG events
2. ✅ Record maintenance tasks
3. ✅ Update work order statuses

### End of Day (5 minutes)
1. ✅ Verify all entries complete
2. ✅ Check dashboard for data quality

---

## 🔧 Commands Reference

### Seed Scripts
```cmd
# Production seed (users + aircraft only)
npm run seed:prod

# Development seed (includes dummy data)
npm run seed

# Clear and reseed
mongosh
use alphastar-kpis
db.dropDatabase()
exit
npm run seed:prod
```

### Start Application
```cmd
# Backend
cd backend
npm run start:dev

# Frontend (new terminal)
cd frontend
npm run dev
```

---

## 📋 Data Entry Checklist

### Initial Setup (One-Time)
- [ ] Run production seed script
- [ ] Change admin password
- [ ] Create user accounts (3-5 users)
- [ ] Verify aircraft data (27 aircraft)
- [ ] **Input current utilization counters (CRITICAL!)**

### Daily Tasks
- [ ] Update daily status (availability)
- [ ] Update utilization counters (after flights)
- [ ] Log AOG events (as they occur)
- [ ] Record maintenance tasks

### Weekly Tasks
- [ ] Review availability metrics
- [ ] Check overdue work orders
- [ ] Verify data completeness

### Monthly Tasks
- [ ] Record budget actual spend
- [ ] Close completed work orders
- [ ] Generate executive reports

---

## 🆘 Quick Troubleshooting

### "Counter values cannot decrease"
**Solution:** Enter cumulative totals, not daily deltas
```
Wrong: Yesterday=12500, Today flew 6.5 hours, Enter: 6.5 ❌
Right: Yesterday=12500, Today flew 6.5 hours, Enter: 12506.5 ✅
```

### "Hours must be between 0 and 24"
**Solution:** Check daily status hours don't exceed 24
```
POS=24, NMCM-S=4, NMCM-U=2, NMCS=0 → Total=6 ✅
POS=24, NMCM-S=20, NMCM-U=10, NMCS=0 → Total=30 ❌ (exceeds 24)
```

### Missing aircraft in dropdown
**Solution:** 
- Verify aircraft exists in Aircraft page
- Check aircraft status (Parked may be filtered)
- Refresh browser

---

## 📚 Documentation

- **Full Guide:** `PRODUCTION-DATA-ENTRY-GUIDE.md`
- **Counters vs Status:** `DAILY-COUNTERS-VS-STATUS-EXPLAINED.md`
- **Local Setup:** `LOCAL-SETUP-GUIDE.md`
- **API Docs:** http://localhost:3000/api

---

## 🎯 Success Criteria

After initial setup, you should have:
- ✅ Admin password changed
- ✅ 3-5 user accounts created
- ✅ 27 aircraft verified
- ✅ Current utilization counters entered (all aircraft)
- ✅ First day of daily status recorded
- ✅ Dashboard showing real data (not empty)

**You're ready for production! 🚀**

---

## 📞 Support

For detailed instructions, see: `PRODUCTION-DATA-ENTRY-GUIDE.md`

For technical issues, check: `LOCAL-SETUP-GUIDE.md`
