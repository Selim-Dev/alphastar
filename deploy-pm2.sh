#!/bin/bash
# PM2 Deployment Script for Alpha Star Aviation Backend

echo "🚀 Deploying Alpha Star Aviation Backend with PM2..."

# Stop Docker if running
echo "Stopping Docker containers..."
cd ~/alphastar
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Navigate to backend directory
cd ~/alphastar/backend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit ~/alphastar/backend/.env with your actual values!"
    exit 1
fi

# Start with PM2
echo "Starting application with PM2..."
pm2 delete alphastar-backend 2>/dev/null || true
pm2 start dist/main.js --name alphastar-backend \
    --time \
    --env production \
    --max-memory-restart 500M

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check status"
echo "  pm2 logs alphastar-backend  - View logs"
echo "  pm2 restart alphastar-backend  - Restart app"
echo "  pm2 stop alphastar-backend     - Stop app"
echo "  pm2 monit               - Monitor resources"
echo ""
echo "Your API is running at: http://178.18.246.104:3003/api"
