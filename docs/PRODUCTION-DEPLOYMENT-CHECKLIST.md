# Production Deployment Checklist - Alpha Star Aviation KPIs Dashboard

## Pre-Deployment Checklist

### ✅ Code & Configuration
- [ ] All TypeScript compilation errors resolved
- [ ] Environment variables configured (`.env` files)
- [ ] MongoDB connection string updated for production
- [ ] JWT secret changed from default
- [ ] CORS origins configured correctly
- [ ] AWS S3 credentials configured (if using attachments)

### ✅ Database Setup
- [ ] MongoDB instance running (local or Atlas)
- [ ] Database name configured
- [ ] Network access configured (Atlas)
- [ ] Backup strategy in place

### ✅ Security
- [ ] Default admin password will be changed after first login
- [ ] SSL/TLS configured for production
- [ ] API rate limiting configured (if needed)
- [ ] Firewall rules configured

---

## Deployment Steps

### STEP 1: Prepare Production Environment

#### 1.1 Server Requirements
- Node.js v18 or higher
- MongoDB v6 or higher
- Minimum 2GB RAM
- 10GB disk space

#### 1.2 Install Dependencies

**Backend:**
```cmd
cd backend
npm install --production
```

**Frontend:**
```cmd
cd frontend
npm install
```

---

### STEP 2: Configure Environment Variables

#### 2.1 Backend Configuration

Create `backend/.env`:
```env
# MongoDB Connection (PRODUCTION)
MONGODB_URI=mongodb://localhost:27017/alphastar-kpis-prod
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alphastar-kpis-prod

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-production-jwt-secret-min-32-characters-long

# Server Port
PORT=3000

# Node Environment
NODE_ENV=production

# CORS Origin (Frontend URL)
CORS_ORIGIN=https://your-domain.com
# OR for local deployment:
# CORS_ORIGIN=http://localhost:5173

# AWS S3 (Optional - for attachments)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=alphastar-attachments-prod
```

#### 2.2 Frontend Configuration

Create `frontend/.env`:
```env
# Backend API URL (PRODUCTION)
VITE_API_URL=https://api.your-domain.com/api
# OR for local deployment:
# VITE_API_URL=http://localhost:3000/api

# App Title
VITE_APP_TITLE=Alpha Star Aviation KPIs Dashboard
```

---

### STEP 3: Initialize Database

#### 3.1 Run Production Seed Script

```cmd
cd backend
npm run seed:prod
```

**This creates:**
- ✅ 1 Admin user (`admin@alphastarav.com` / `Admin@123!`)
- ✅ 27 Aircraft from Alpha Star fleet
- ❌ NO dummy operational data

#### 3.2 Verify Seed Success

Check the output:
```
✅ Created admin user: admin@alphastarav.com
⚠️  IMPORTANT: Change the default password after first login!
✅ Created aircraft: HZ-A42 (A340-642 ACJ)
✅ Created aircraft: HZ-SKY1 (A340-212 ACJ)
...
✨ Production database seed completed!
```

---

### STEP 4: Build & Start Application

#### 4.1 Build Backend (Production)

```cmd
cd backend
npm run build
```

This creates `backend/dist/` folder with compiled JavaScript.

#### 4.2 Build Frontend (Production)

```cmd
cd frontend
npm run build
```

This creates `frontend/dist/` folder with optimized static files.

#### 4.3 Start Backend (Production)

```cmd
cd backend
npm run start:prod
```

Backend runs on: `http://localhost:3000`

#### 4.4 Serve Frontend (Production)

**Option A: Using a web server (Nginx, Apache)**
- Configure web server to serve `frontend/dist/`
- Set up reverse proxy to backend API

**Option B: Using Node.js serve**
```cmd
npm install -g serve
cd frontend
serve -s dist -l 5173
```

Frontend runs on: `http://localhost:5173`

---

### STEP 5: Initial Login & Security Setup

#### 5.1 Access Dashboard

Navigate to: `http://localhost:5173` (or your domain)

#### 5.2 Login with Default Credentials

```
Email: admin@alphastarav.com
Password: Admin@123!
```

#### 5.3 Change Admin Password (CRITICAL!)

1. Click profile icon (top right)
2. Select "Change Password"
3. Enter strong password (min 8 characters, mixed case, numbers, symbols)
4. Save and re-login

**⚠️ SECURITY WARNING:** Never use default password in production!

---

### STEP 6: Create User Accounts

Navigate to: **Admin Panel**

#### 6.1 Create Editor Accounts

**For operations team who will input data:**

```
Name: Operations Manager
Email: ops@alphastarav.com
Role: Editor
Password: [Strong password]
```

**Recommended Editor accounts:**
- Operations Manager (daily status, utilization)
- Maintenance Manager (AOG events, maintenance tasks)
- Planning Manager (work orders, discrepancies)

#### 6.2 Create Viewer Accounts

**For management (read-only access):**

```
Name: Fleet Director
Email: fleet@alphastarav.com
Role: Viewer
Password: [Strong password]
```

**Recommended Viewer accounts:**
- CEO / Fleet Director
- Finance Manager
- Operations Director

---

### STEP 7: Verify Aircraft Data

Navigate to: **Aircraft** page

#### 7.1 Review All Aircraft
- Verify all 27 aircraft are listed
- Check registration numbers
- Verify fleet groups and types

#### 7.2 Update Missing Information
- Fill in any blank aircraft types
- Add missing MSN numbers
- Update dates if available

#### 7.3 Set Aircraft Status
- Mark parked aircraft as "Parked"
- Mark leased aircraft as "Leased"

---

### STEP 8: Client Data Entry Begins

**Hand off to client with instructions:**

See: `PRODUCTION-DATA-ENTRY-GUIDE.md`

**Critical first step for client:**
- Input current utilization counters for all 27 aircraft
- This establishes baseline for all future tracking

---

## Post-Deployment Verification

### ✅ Functional Tests

- [ ] Login works with new admin password
- [ ] All user accounts created successfully
- [ ] Aircraft list displays correctly
- [ ] Can create/edit aircraft
- [ ] Dashboard loads without errors
- [ ] API endpoints respond correctly

### ✅ Security Tests

- [ ] Default password changed
- [ ] JWT authentication working
- [ ] Role-based access control working
- [ ] CORS configured correctly
- [ ] No sensitive data in logs

### ✅ Performance Tests

- [ ] Dashboard loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks

---

## Monitoring & Maintenance

### Daily Monitoring

- [ ] Check application logs for errors
- [ ] Monitor database size
- [ ] Verify backups are running
- [ ] Check API response times

### Weekly Monitoring

- [ ] Review user activity logs
- [ ] Check for failed login attempts
- [ ] Monitor disk space usage
- [ ] Review error rates

### Monthly Maintenance

- [ ] Update dependencies (security patches)
- [ ] Review and archive old data
- [ ] Optimize database indexes
- [ ] Generate system health report

---

## Backup Strategy

### Database Backups

**Daily Backups:**
```cmd
mongodump --db alphastar-kpis-prod --out backup/$(date +%Y%m%d)
```

**Weekly Full Backups:**
```cmd
mongodump --db alphastar-kpis-prod --gzip --archive=backup/weekly-$(date +%Y%m%d).gz
```

**Backup Retention:**
- Daily: Keep 7 days
- Weekly: Keep 4 weeks
- Monthly: Keep 12 months

### Application Backups

- [ ] Backup `.env` files (securely)
- [ ] Backup custom configurations
- [ ] Backup uploaded files (S3 or local)

---

## Rollback Plan

### If Deployment Fails

**Step 1: Stop Application**
```cmd
# Stop backend
pkill -f "node dist/main"

# Stop frontend (if using serve)
pkill -f "serve"
```

**Step 2: Restore Database**
```cmd
mongorestore --db alphastar-kpis-prod backup/YYYYMMDD/alphastar-kpis-prod
```

**Step 3: Revert to Previous Version**
```cmd
git checkout previous-stable-tag
npm install
npm run build
npm run start:prod
```

---

## Troubleshooting

### Issue: Cannot connect to MongoDB

**Check:**
- MongoDB service is running
- Connection string is correct
- Network access configured (Atlas)
- Firewall allows connection

**Solution:**
```cmd
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Test connection
mongosh "mongodb://localhost:27017/alphastar-kpis-prod"
```

### Issue: Frontend cannot reach backend

**Check:**
- Backend is running on correct port
- CORS origin configured correctly
- `VITE_API_URL` points to correct backend URL

**Solution:**
- Verify backend logs for CORS errors
- Check browser console for network errors
- Test API directly: `curl http://localhost:3000/api/health`

### Issue: Login fails after password change

**Check:**
- JWT secret is consistent
- Token expiration settings
- Browser cookies/localStorage

**Solution:**
- Clear browser cache and cookies
- Verify JWT_SECRET in `.env`
- Check backend logs for authentication errors

---

## Production URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | https://your-domain.com | Main application |
| Backend API | https://api.your-domain.com/api | REST API |
| API Docs | https://api.your-domain.com/api | Swagger UI |
| MongoDB | mongodb://... | Database connection |

---

## Support Contacts

**Technical Support:**
- System Administrator: [email]
- Database Administrator: [email]
- Application Support: [email]

**Documentation:**
- Production Data Entry Guide: `PRODUCTION-DATA-ENTRY-GUIDE.md`
- Quick Start Guide: `PRODUCTION-QUICK-START.md`
- Local Setup Guide: `LOCAL-SETUP-GUIDE.md`

---

## Success Criteria

Deployment is successful when:

- ✅ Application accessible via production URL
- ✅ Admin password changed from default
- ✅ User accounts created (3-5 users)
- ✅ All 27 aircraft verified
- ✅ Dashboard loads without errors
- ✅ Client can login and navigate
- ✅ Backups configured and tested
- ✅ Monitoring in place

**Client is ready to begin data entry! 🚀**

---

## Next Steps for Client

1. **Input Current Utilization Counters** (CRITICAL!)
   - See: `PRODUCTION-DATA-ENTRY-GUIDE.md` - STEP 4
   - Use Excel import for faster entry

2. **Start Daily Status Tracking**
   - Record availability daily
   - Track downtime causes

3. **Begin Operational Tracking**
   - Log AOG events as they occur
   - Record maintenance tasks
   - Track work orders

**For detailed instructions, provide client with:**
- `PRODUCTION-DATA-ENTRY-GUIDE.md`
- `PRODUCTION-QUICK-START.md`
- `DAILY-COUNTERS-VS-STATUS-EXPLAINED.md`
