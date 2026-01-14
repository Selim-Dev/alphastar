# Running Alpha Star Aviation KPIs on Your Server

## TL;DR - Fastest Way to Run

After `git pull`, run this on your Linux server:

```bash
# Make script executable (first time only)
chmod +x start-dev.sh

# Start everything
./start-dev.sh
```

Then open: **http://178.18.246.104:5174**

Login: `admin@alphastarav.com` / `Admin@123!`

---

## What the Script Does

The `start-dev.sh` script automatically:

1. ✓ Checks if MongoDB is running (starts it if needed)
2. ✓ Installs dependencies if missing
3. ✓ Starts backend on port 3003
4. ✓ Starts frontend on port 5174
5. ✓ Shows you the URLs to access

---

## Manual Steps (If Script Doesn't Work)

### Step 1: Start MongoDB

```bash
sudo systemctl start mongod
sudo systemctl status mongod  # Verify it's running
```

### Step 2: Install Dependencies (First Time)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### Step 3: Seed Database (First Time Only)

```bash
cd backend
npm run seed
cd ..
```

### Step 4: Start Backend (Terminal 1)

```bash
cd backend
npm run start:dev
```

Leave this terminal running. Backend is now on: **http://178.18.246.104:3003**

### Step 5: Start Frontend (Terminal 2)

Open a new terminal:

```bash
cd frontend
npm run dev
```

Leave this terminal running. Frontend is now on: **http://178.18.246.104:5174**

---

## Accessing from Other Computers

The application is now accessible from any computer on your network:

- **Frontend**: http://178.18.246.104:5174
- **Backend API**: http://178.18.246.104:3003/api

If you can't access from other computers, check firewall:

```bash
# Allow ports through firewall
sudo ufw allow 5174/tcp
sudo ufw allow 3003/tcp
sudo ufw reload
```

---

## Stopping the Servers

Press `Ctrl+C` in each terminal window.

---

## Production Deployment (Optional)

For production, you'll want to:

1. Build the frontend: `cd frontend && npm run build`
2. Use PM2 or systemd to keep services running
3. Use Nginx as reverse proxy
4. Set up SSL certificate

See **SERVER-SETUP.md** for full production deployment guide.

---

## Common Issues

### Issue: "Port 3003 already in use"

**Solution:**
```bash
# Find and kill the process
sudo lsof -i :3003
sudo kill -9 <PID>

# Or use npx
npx kill-port 3003
```

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# View logs if issues
sudo tail -f /var/log/mongodb/mongod.log
```

### Issue: "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Issue: Frontend shows "Network Error" when logging in

**Solution:**
1. Check backend is running: `curl http://localhost:3003/api/health`
2. Verify `frontend/.env` exists with:
   ```
   VITE_API_URL=http://178.18.246.104:3003/api
   ```
3. Restart frontend

---

## File Structure

```
alphastar-kpi-dashboard/
├── backend/              # NestJS backend
│   ├── src/             # Source code
│   ├── .env             # Backend config (MongoDB, JWT, etc.)
│   └── package.json
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── .env            # Frontend config (API URL)
│   └── package.json
├── start-dev.sh        # Linux/Mac startup script
├── start-dev.bat       # Windows startup script
├── QUICK-START.md      # This file
└── SERVER-SETUP.md     # Full deployment guide
```

---

## Environment Files

### backend/.env
```env
MONGODB_URI=mongodb://localhost:27017/alphastar-kpi
JWT_SECRET=your-secret-key-here
PORT=3003
NODE_ENV=development
```

### frontend/.env
```env
VITE_API_URL=http://178.18.246.104:3003/api
```

These files should already exist in your repository.

---

## Next Steps

1. **First time?** Run `cd backend && npm run seed` to create demo data
2. **Login** with admin@alphastarav.com / Admin@123!
3. **Explore** the dashboard and features
4. **Read** DEMO-GUIDE.md for a walkthrough

---

## Support

- **Quick Start**: QUICK-START.md
- **Full Setup**: SERVER-SETUP.md
- **Production**: DEPLOYMENT.md
- **Demo Guide**: DEMO-GUIDE.md
- **Help Center**: Available in the app (Help icon in sidebar)

---

**Last Updated**: January 2025
