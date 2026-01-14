# Deployment Guide

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────────┐
│     Vercel      │  HTTPS  │        Contabo Server            │
│   (Frontend)    │ ──────► │  alphastar-backend:3003          │
└─────────────────┘         └──────────────────────────────────┘
                                        │
                                        ▼
                            ┌──────────────────────────────────┐
                            │       MongoDB Atlas              │
                            │   cluster0.0jvpnjs.mongodb.net   │
                            └──────────────────────────────────┘
```

## Backend Deployment (Contabo Server)

### 1. Upload project to server

```bash
# Option A: Git clone
ssh root@your-contabo-ip
cd /opt
git clone https://github.com/your-repo/alphastar-kpi-dashboard.git
cd alphastar-kpi-dashboard

# Option B: SCP upload
scp -r . root@your-contabo-ip:/opt/alphastar-kpi-dashboard/
```

### 2. Configure environment

```bash
# Copy and edit production env file
cp .env.production .env

# Edit with your values (especially JWT_SECRET)
nano .env
```

**Important:** Generate a strong JWT secret:
```bash
openssl rand -base64 64
```

### 3. Build and run

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify deployment

```bash
# Check container status
docker ps | grep alphastar

# Check logs
docker logs alphastar-backend

# Test API
curl http://localhost:3003/api
```

### 5. Seed database (first time only)

```bash
docker exec -it alphastar-backend npm run seed
```

---

## Frontend Deployment (Vercel)

### 1. Connect repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`

### 2. Configure environment variables

In Vercel project settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-contabo-ip:3003/api` or `https://api.yourdomain.com/api` |

### 3. Deploy

Vercel will auto-deploy on push to main branch.

---

## CORS Configuration

The backend needs to allow requests from your Vercel domain. Check `backend/src/main.ts` for CORS settings.

If needed, update to allow your Vercel domain:

```typescript
app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',
    'https://yourdomain.com'
  ],
  credentials: true,
});
```

---

## SSL/HTTPS (Recommended)

### Option A: Nginx reverse proxy with Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.yourdomain.com
```

### Option B: Cloudflare proxy

Point your domain to Contabo IP through Cloudflare for free SSL.

---

## Useful Commands

```bash
# View logs
docker logs -f alphastar-backend

# Restart
docker compose -f docker-compose.prod.yml restart

# Stop
docker compose -f docker-compose.prod.yml down

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build

# Shell into container
docker exec -it alphastar-backend sh
```

---

## Port Summary

| Service | Port | Notes |
|---------|------|-------|
| alphastar-backend | 3003 | Avoids conflict with existing services |
| water-tanks-api | 3002 | Existing |
| aqarix-backend | 3001 | Existing |
