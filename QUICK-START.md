# Quick Start Guide

## After Git Pull - Run in Development Mode

### Linux/Mac (Easiest Way)

```bash
# Make script executable (first time only)
chmod +x start-dev.sh

# Run the startup script
./start-dev.sh
```

### Windows (Easiest Way)

```cmd
# Just double-click start-dev.bat
# Or run from command prompt:
start-dev.bat
```

### Manual Start (Any OS)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

---

## Access the Application

- **Frontend**: http://178.18.246.104:5174 (or http://localhost:5174)
- **Backend API**: http://178.18.246.104:3003/api

---

## Default Login

| Email | Password | Role |
|-------|----------|------|
| admin@alphastarav.com | Admin@123! | Admin |

---

## First Time Setup

If this is your first time running the project:

1. **Install Node.js** (if not installed)
   - Download from: https://nodejs.org/
   - Version 18 or higher recommended

2. **Install MongoDB** (if not installed)
   - Linux: `sudo apt install mongodb`
   - Mac: `brew install mongodb-community`
   - Windows: Download from https://www.mongodb.com/

3. **Start MongoDB**
   - Linux: `sudo systemctl start mongod`
   - Mac: `brew services start mongodb-community`
   - Windows: `net start MongoDB`

4. **Seed the Database**
   ```bash
   cd backend
   npm run seed
   ```

5. **Run the startup script** (see above)

---

## Stopping the Servers

- **If using startup script**: Press `Ctrl+C` in the terminal
- **If using Windows batch file**: Close the command windows
- **If running manually**: Press `Ctrl+C` in each terminal

---

## Troubleshooting

### "Port already in use"
```bash
# Kill process on port 3003 (backend)
npx kill-port 3003

# Kill process on port 5174 (frontend)
npx kill-port 5174
```

### "MongoDB connection failed"
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list  # Mac
sc query MongoDB  # Windows

# Start MongoDB if not running
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac
net start MongoDB  # Windows
```

### "Module not found" errors
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Frontend can't connect to backend
1. Check `frontend/.env` file exists with:
   ```
   VITE_API_URL=http://178.18.246.104:3003/api
   ```
2. Restart frontend: `Ctrl+C` then `npm run dev`

---

## Need More Help?

See the full documentation:
- **SERVER-SETUP.md** - Complete server setup guide
- **DEPLOYMENT.md** - Production deployment guide
- **DEMO-GUIDE.md** - Demo walkthrough

---

**Quick Commands Reference**

```bash
# Backend
cd backend
npm run start:dev    # Development mode
npm run build        # Build for production
npm run start:prod   # Production mode
npm run seed         # Seed database

# Frontend
cd frontend
npm run dev          # Development mode
npm run build        # Build for production
npm run preview      # Preview production build

# Database
mongosh alphastar-kpi              # Connect to database
npm run seed                       # Seed demo data (from backend folder)
```
