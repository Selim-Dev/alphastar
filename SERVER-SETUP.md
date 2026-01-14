# Alpha Star Aviation KPIs - Server Setup Guide

## Quick Start (Development Mode)

After pulling the latest code from Git, follow these steps to run the project on your server:

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

The backend `.env` file should already exist. Verify it has:

```bash
cd backend
cat .env
```

Should contain:
```
MONGODB_URI=mongodb://localhost:27017/alphastar-kpi
JWT_SECRET=your-secret-key-here
PORT=3003
NODE_ENV=development
```

The frontend `.env` file should already exist. Verify it has:

```bash
cd ../frontend
cat .env
```

Should contain:
```
VITE_API_URL=http://178.18.246.104:3003/api
```

### 3. Start MongoDB (if not already running)

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# If not running, start it
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

### 4. Seed the Database (First Time Only)

```bash
cd backend
npm run seed
```

This will create:
- Default users (admin, editor, viewer)
- Sample aircraft fleet
- Demo data for 2024 and 2025

### 5. Start the Backend Server

```bash
cd backend
npm run start:dev
```

Backend will run on: `http://178.18.246.104:3003`

### 6. Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5174`

### 7. Access the Application

Open your browser and go to:
- **Frontend**: `http://178.18.246.104:5174` (or `http://localhost:5174`)
- **Backend API**: `http://178.18.246.104:3003/api`

### Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@alphastarav.com | Admin@123! | Admin |
| editor@alphastarav.com | Editor@123! | Editor |
| viewer@alphastarav.com | Viewer@123! | Viewer |

---

## Production Mode (Build & Serve)

For production deployment, you'll want to build the frontend and serve it properly:

### 1. Build the Frontend

```bash
cd frontend
npm run build
```

This creates optimized files in `frontend/dist/`

### 2. Serve Frontend with Nginx or PM2

#### Option A: Using Nginx (Recommended)

Install Nginx if not already installed:
```bash
sudo apt update
sudo apt install nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/alphastar-kpi
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 178.18.246.104;

    # Frontend
    location / {
        root /path/to/your/project/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/alphastar-kpi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option B: Using PM2 (Alternative)

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Create ecosystem file:
```bash
nano ecosystem.config.js
```

Add:
```javascript
module.exports = {
  apps: [
    {
      name: 'alphastar-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start:prod',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'alphastar-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'vite preview --port 5174 --host 0.0.0.0',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Start Backend in Production Mode

```bash
cd backend
npm run build
npm run start:prod
```

Or with PM2:
```bash
pm2 start ecosystem.config.js
```

---

## Useful Commands

### Backend Commands

```bash
cd backend

# Development mode (auto-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Seed database
npm run seed

# Run tests
npm run test
```

### Frontend Commands

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

### Database Commands

```bash
# Connect to MongoDB shell
mongosh alphastar-kpi

# Backup database
mongodump --db alphastar-kpi --out /backup/alphastar-$(date +%Y%m%d)

# Restore database
mongorestore --db alphastar-kpi /backup/alphastar-20250114/alphastar-kpi

# Drop database (careful!)
mongosh alphastar-kpi --eval "db.dropDatabase()"
```

### PM2 Commands (if using PM2)

```bash
# View running processes
pm2 list

# View logs
pm2 logs alphastar-backend
pm2 logs alphastar-frontend

# Restart services
pm2 restart alphastar-backend
pm2 restart alphastar-frontend

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

---

## Troubleshooting

### Port Already in Use

If port 3003 or 5174 is already in use:

```bash
# Find process using port 3003
sudo lsof -i :3003

# Kill the process
sudo kill -9 <PID>
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3003/api/health`
2. Verify `frontend/.env` has correct `VITE_API_URL`
3. Check firewall rules: `sudo ufw status`

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/project

# Fix permissions
chmod -R 755 /path/to/project
```

---

## Updating the Application

When you pull new code from Git:

```bash
# Pull latest code
git pull origin main

# Update backend
cd backend
npm install
npm run build

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services (if using PM2)
pm2 restart all

# Or restart manually
# Stop current processes (Ctrl+C)
# Then start again with npm run start:dev
```

---

## Firewall Configuration

If you need to access the application from other machines:

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow backend port
sudo ufw allow 3003/tcp

# Allow frontend dev port (if needed)
sudo ufw allow 5174/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Performance Monitoring

### Using PM2 Monitor

```bash
pm2 monit
```

### Check System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# MongoDB stats
mongosh alphastar-kpi --eval "db.stats()"
```

---

## Security Checklist

- [ ] Change default JWT_SECRET in backend/.env
- [ ] Change default user passwords after first login
- [ ] Enable firewall (ufw)
- [ ] Set up SSL/TLS certificate (Let's Encrypt)
- [ ] Configure MongoDB authentication
- [ ] Set up regular database backups
- [ ] Keep Node.js and npm updated
- [ ] Review and update dependencies regularly

---

## Support

For issues or questions:
- Check logs: `pm2 logs` or console output
- Review error messages in browser console (F12)
- Check MongoDB logs: `/var/log/mongodb/mongod.log`
- Verify environment variables are set correctly

---

**Last Updated**: January 2025
