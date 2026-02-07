# Seed Scripts Comparison

## Overview

The Alpha Star Aviation KPIs Dashboard includes two seed scripts for different purposes:

1. **Development Seed** (`seed.ts`) - For testing and development
2. **Production Seed** (`seed-production.ts`) - For production deployment

---

## Development Seed (`npm run seed`)

### Purpose
Create a fully populated database with realistic dummy data for:
- Testing features
- Demonstrating functionality
- Development and debugging
- Training and demos

### What It Creates

| Data Type | Count | Description |
|-----------|-------|-------------|
| **Users** | 3 | Admin, Editor, Viewer |
| **Aircraft** | 27 | Alpha Star fleet |
| **Daily Status** | 2,430 | 90 days × 27 aircraft |
| **Utilization Counters** | 2,430 | 90 days × 27 aircraft |
| **AOG Events** | 81-135 | 3-5 per aircraft with milestones |
| **Maintenance Tasks** | 135-480 | 3-8 per day for 30-60 days |
| **Work Orders** | 135-270 | 5-10 per aircraft |
| **Discrepancies** | 81-216 | 3-8 per aircraft |
| **Budget Plans** | 72 | 18 clauses × 4 groups |
| **Actual Spend** | 864 | 12 months × 18 clauses × 4 groups |
| **Historical Data (2024)** | 4,860 | 90 days × 27 aircraft (status + counters) |

**Total Records:** ~11,000+ records

### Command
```cmd
cd backend
npm run seed
```

### Use Cases
- ✅ Local development
- ✅ Feature testing
- ✅ Demo presentations
- ✅ Training sessions
- ✅ UI/UX testing
- ✅ Performance testing
- ❌ Production deployment

### Advantages
- Instant fully-populated dashboard
- Realistic data patterns
- Year-over-year comparison data
- All features immediately testable
- No manual data entry needed

### Disadvantages
- Contains dummy data (not real operations)
- May confuse users if used in production
- Requires cleanup before real data entry
- Large dataset (slower seed time)

---

## Production Seed (`npm run seed:prod`)

### Purpose
Create a minimal database with ONLY essential data for production:
- User accounts
- Aircraft master data
- NO operational data (client inputs actual data)

### What It Creates

| Data Type | Count | Description |
|-----------|-------|-------------|
| **Users** | 1 | Admin only |
| **Aircraft** | 27 | Alpha Star fleet |
| **Daily Status** | 0 | Client inputs actual data |
| **Utilization Counters** | 0 | Client inputs current counters |
| **AOG Events** | 0 | Client logs actual events |
| **Maintenance Tasks** | 0 | Client records actual tasks |
| **Work Orders** | 0 | Client tracks actual work orders |
| **Discrepancies** | 0 | Client documents actual issues |
| **Budget Plans** | 0 | Client creates budget (optional) |
| **Actual Spend** | 0 | Client records actual expenses |

**Total Records:** 28 records (1 user + 27 aircraft)

### Command
```cmd
cd backend
npm run seed:prod
```

### Use Cases
- ✅ Production deployment
- ✅ Client go-live
- ✅ Real operational data
- ✅ Clean slate for actual tracking
- ❌ Development testing
- ❌ Demo presentations

### Advantages
- Clean database (no dummy data)
- Client inputs real operational data
- No confusion with fake data
- Fast seed time (28 records only)
- Production-ready

### Disadvantages
- Empty dashboard initially
- Requires manual data entry
- No historical data for testing
- Features not immediately visible

---

## Side-by-Side Comparison

| Aspect | Development Seed | Production Seed |
|--------|------------------|-----------------|
| **Command** | `npm run seed` | `npm run seed:prod` |
| **Records Created** | ~11,000+ | 28 |
| **Seed Time** | 30-60 seconds | 2-5 seconds |
| **Users** | 3 (Admin, Editor, Viewer) | 1 (Admin only) |
| **Aircraft** | 27 | 27 |
| **Operational Data** | 90 days of dummy data | None (client inputs) |
| **Dashboard State** | Fully populated | Empty (ready for data) |
| **Use Case** | Development, Testing, Demo | Production, Go-Live |
| **Data Quality** | Realistic but fake | Real operational data |
| **Historical Data** | Yes (2024 YoY) | No (client builds history) |
| **Budget Data** | Yes (sample budgets) | No (client creates) |
| **AOG Events** | Yes (81-135 events) | No (client logs actual) |

---

## When to Use Each

### Use Development Seed When:
- 🔧 Setting up local development environment
- 🧪 Testing new features
- 📊 Creating demo presentations
- 👥 Training new users
- 🐛 Debugging issues
- 📈 Testing dashboard visualizations
- 🎨 UI/UX development

### Use Production Seed When:
- 🚀 Deploying to production server
- 📅 Going live with client
- 📝 Starting actual operational tracking
- 🏢 Client wants clean slate
- 💼 Real business operations
- 📊 Building real historical data

---

## Migration Path

### From Development to Production

If you've been using development seed and want to switch to production:

**Step 1: Backup (if needed)**
```cmd
mongodump --db alphastar-kpis --out backup/
```

**Step 2: Drop Database**
```cmd
mongosh
use alphastar-kpis
db.dropDatabase()
exit
```

**Step 3: Run Production Seed**
```cmd
cd backend
npm run seed:prod
```

**Step 4: Follow Data Entry Guide**
See: `PRODUCTION-DATA-ENTRY-GUIDE.md`

---

## Data Entry After Production Seed

After running production seed, follow this order:

### 1. Security Setup (5 minutes)
- Change admin password
- Create user accounts

### 2. Verify Aircraft (5 minutes)
- Review 27 aircraft
- Update missing information

### 3. Input Current Counters (30-60 minutes)
**CRITICAL STEP!**
- Enter current utilization counters for all aircraft
- Use Excel import for faster entry

### 4. Start Daily Tracking (Daily)
- Record daily status (availability)
- Update utilization counters (after flights)
- Log operational events

See full guide: `PRODUCTION-DATA-ENTRY-GUIDE.md`

---

## Script Locations

```
backend/src/scripts/
├── seed.ts                  # Development seed (full dummy data)
├── seed-production.ts       # Production seed (minimal data)
├── import-historical.ts     # Import historical data (optional)
└── clear-aog-events.ts      # Clear AOG events (utility)
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/scripts/seed.ts",
    "seed:prod": "ts-node -r tsconfig-paths/register src/scripts/seed-production.ts",
    "seed:historical": "ts-node -r tsconfig-paths/register src/scripts/import-historical.ts",
    "seed:all": "npm run seed && npm run seed:historical"
  }
}
```

---

## Recommendations

### For Development Team
```cmd
npm run seed
```
- Use development seed
- Full dummy data for testing
- Faster feature development

### For Production Deployment
```cmd
npm run seed:prod
```
- Use production seed
- Clean slate for client
- Real operational data only

### For Demos/Training
```cmd
npm run seed
```
- Use development seed
- Shows all features populated
- Realistic data patterns

---

## Summary

**Development Seed:**
- 🎯 Purpose: Testing, development, demos
- 📊 Data: ~11,000 records of dummy data
- ⏱️ Time: 30-60 seconds
- ✅ Use: Development, testing, training

**Production Seed:**
- 🎯 Purpose: Production deployment
- 📊 Data: 28 records (users + aircraft)
- ⏱️ Time: 2-5 seconds
- ✅ Use: Go-live, real operations

**Choose based on your needs:**
- Development/Testing → `npm run seed`
- Production/Go-Live → `npm run seed:prod`
