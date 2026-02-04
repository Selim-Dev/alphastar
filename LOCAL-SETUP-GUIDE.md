# Alpha Star Aviation KPIs Dashboard - Local Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your Windows machine:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **MongoDB** (v6 or higher)
   - Download MongoDB Community Server: https://www.mongodb.com/try/download/community
   - OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
   - Verify installation: `mongod --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/download/win

---

## Project Structure

```
alpha-star-aviation/
├── backend/          # NestJS API server
├── frontend/         # React + Vite frontend
├── docker/           # Docker configurations (optional)
└── start-dev.bat     # Windows batch script to start both servers
```

---

## Step 1: MongoDB Setup

### Option A: Local MongoDB Installation

1. **Start MongoDB Service:**
   ```cmd
   net start MongoDB
   ```

2. **Verify MongoDB is running:**
   ```cmd
   mongosh
   ```
   You should see the MongoDB shell. Type `exit` to quit.

3. **Create Database (optional):**
   MongoDB will create the database automatically when you run the seed script.

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Whitelist your IP address in Atlas Network Access

---

## Step 2: Backend Setup

### 1. Navigate to Backend Directory
```cmd
cd backend
```

### 2. Install Dependencies
```cmd
npm install
```

This will install all required packages including:
- NestJS framework
- Mongoose (MongoDB ODM)
- JWT authentication
- bcrypt for password hashing
- And more...

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```cmd
copy .env.example .env
```

Edit `.env` with your settings:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/alphastar-kpis
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alphastar-kpis

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3000

# Node Environment
NODE_ENV=development

# AWS S3 (optional - for file attachments)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=alphastar-attachments

# CORS Origin (frontend URL)
CORS_ORIGIN=http://localhost:5173
```

### 4. Seed the Database

Run the seed script to populate the database with initial data:

```cmd
npm run seed
```

This will create:
- ✅ 3 default users (Admin, Editor, Viewer)
- ✅ 27 aircraft from Alpha Star fleet
- ✅ 90 days of daily status records
- ✅ 90 days of utilization counters
- ✅ AOG events with milestone timestamps
- ✅ Maintenance tasks
- ✅ Work orders
- ✅ Discrepancies
- ✅ Budget plans and actual spend
- ✅ Historical data for YoY comparison

**Default User Credentials:**
```
Admin:  admin@alphastarav.com / Admin@123!
Editor: editor@alphastarav.com / Editor@123!
Viewer: viewer@alphastarav.com / Viewer@123!
```

### 5. Start the Backend Server

```cmd
npm run start:dev
```

The backend API will start on `http://localhost:3000`

**You should see:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/api/auth/login, POST} route
[Nest] INFO [NestApplication] Nest application successfully started
```

**API Documentation:** http://localhost:3000/api (Swagger UI)

---

## Step 3: Frontend Setup

### 1. Open a New Terminal Window

Keep the backend running and open a new terminal.

### 2. Navigate to Frontend Directory
```cmd
cd frontend
```

### 3. Install Dependencies
```cmd
npm install
```

This will install:
- React 18
- Vite (build tool)
- TanStack Query (data fetching)
- TanStack Table (data tables)
- React Hook Form + Zod (forms)
- Tailwind CSS + shadcn/ui (styling)
- Recharts (charts)
- And more...

### 4. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```cmd
copy .env.example .env
```

Edit `.env`:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# App Title
VITE_APP_TITLE=Alpha Star Aviation KPIs Dashboard
```

### 5. Start the Frontend Development Server

```cmd
npm run dev
```

The frontend will start on `http://localhost:5173`

**You should see:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 6. Open in Browser

Navigate to: **http://localhost:5173**

You should see the login page. Use the admin credentials to log in:
- Email: `admin@alphastarav.com`
- Password: `Admin@123!`

---

## Step 4: Using the Convenience Script (Optional)

For easier startup, use the provided batch script:

### From Project Root:
```cmd
start-dev.bat
```

This will:
1. Start the backend server in one terminal
2. Start the frontend server in another terminal
3. Both servers will run concurrently

**To stop both servers:** Close both terminal windows or press `Ctrl+C` in each.

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
- Ensure MongoDB is running: `net start MongoDB`
- Check your `MONGODB_URI` in `.env`
- For Atlas, verify your connection string and IP whitelist

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
- Change the `PORT` in `backend/.env` to a different port (e.g., 3001)
- Or kill the process using port 3000:
  ```cmd
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

#### Seed Script Fails
```
Error: Aircraft with registration HZ-A42 already exists
```

**Solution:**
- This is normal if you've already seeded the database
- The seed script skips existing records
- To start fresh, drop the database:
  ```cmd
  mongosh
  use alphastar-kpis
  db.dropDatabase()
  exit
  ```
  Then run `npm run seed` again

### Frontend Issues

#### API Connection Error
```
Network Error / Failed to fetch
```

**Solution:**
- Ensure backend is running on `http://localhost:3000`
- Check `VITE_API_URL` in `frontend/.env`
- Verify CORS settings in `backend/.env` (CORS_ORIGIN)

#### Port Already in Use
```
Port 5173 is in use, trying another one...
```

**Solution:**
- Vite will automatically try the next available port (5174, 5175, etc.)
- Update `VITE_API_URL` if backend expects a specific frontend URL

#### Build Errors
```
Module not found / Cannot resolve...
```

**Solution:**
- Delete `node_modules` and reinstall:
  ```cmd
  rmdir /s /q node_modules
  npm install
  ```

---

## Development Workflow

### 1. Daily Startup
```cmd
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Making Changes

**Backend Changes:**
- Edit files in `backend/src/`
- NestJS will auto-reload on save
- Check terminal for compilation errors

**Frontend Changes:**
- Edit files in `frontend/src/`
- Vite will hot-reload in browser
- Check browser console for errors

### 3. Database Management

**View Data:**
```cmd
mongosh
use alphastar-kpis
db.aircraft.find().pretty()
db.users.find().pretty()
```

**Reset Database:**
```cmd
mongosh
use alphastar-kpis
db.dropDatabase()
exit

cd backend
npm run seed
```

### 4. Testing API Endpoints

**Using Swagger UI:**
- Navigate to: http://localhost:3000/api
- Click "Authorize" and enter JWT token
- Test endpoints interactively

**Using curl:**
```cmd
# Login
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@alphastarav.com\",\"password\":\"Admin@123!\"}"

# Get Aircraft (with token)
curl http://localhost:3000/api/aircraft ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Building for Production

### Backend
```cmd
cd backend
npm run build
npm run start:prod
```

### Frontend
```cmd
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

---

## Useful Commands

### Backend
```cmd
npm run start:dev      # Start development server with hot-reload
npm run start:debug    # Start with debugging enabled
npm run build          # Build for production
npm run start:prod     # Start production server
npm run seed           # Seed database with initial data
npm run lint           # Run ESLint
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
```

### Frontend
```cmd
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run type-check     # Run TypeScript type checking
```

---

## Project URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3000/api | REST API endpoints |
| API Docs | http://localhost:3000/api | Swagger UI documentation |
| MongoDB | mongodb://localhost:27017 | Local MongoDB instance |

---

## Next Steps

1. ✅ **Explore the Dashboard**
   - Login with admin credentials
   - View aircraft details
   - Check AOG events and analytics
   - Review budget tracking

2. ✅ **Import Data**
   - Download Excel templates from Import page
   - Fill with your data
   - Upload and validate

3. ✅ **Customize**
   - Update aircraft master data
   - Adjust budget clauses
   - Configure user roles

4. ✅ **Learn the System**
   - Read `QUICK-START.md` for feature overview
   - Check `DEMO-GUIDE.md` for demo scenarios
   - Review `DEPLOYMENT.md` for production setup

---

## Getting Help

- **Documentation:** Check the `/docs` folder in the project root
- **API Reference:** http://localhost:3000/api (Swagger)
- **System Architecture:** `.kiro/steering/system-architecture.md`
- **AOG Analytics:** `.kiro/steering/aog-analytics-simplified.md`

---

## Common Development Tasks

### Add a New Aircraft
1. Navigate to Aircraft page
2. Click "Add Aircraft"
3. Fill in the form (registration, fleet group, etc.)
4. Submit

### Import Aircraft from Excel
1. Navigate to Import page
2. Select "Aircraft Master" template
3. Download template
4. Fill with data (see `frontend/new_aircraft_master.ts` for examples)
5. Upload file
6. Review validation results
7. Confirm import

### View AOG Analytics
1. Navigate to AOG Events → Analytics
2. Select date range
3. View three-bucket breakdown (Technical, Procurement, Ops)
4. Filter by aircraft or fleet group

### Export Data
1. Navigate to any page with data tables
2. Click "Export to Excel" button
3. File will download automatically

---

**Happy Coding! 🚀**

For questions or issues, refer to the documentation or check the system architecture guide.
