#!/bin/bash

# Alpha Star Aviation KPIs - Development Startup Script
# This script starts both backend and frontend in development mode

echo "=========================================="
echo "Alpha Star Aviation KPIs Dashboard"
echo "Starting Development Environment"
echo "=========================================="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB status..."
if ! systemctl is-active --quiet mongod; then
    echo "MongoDB is not running. Starting MongoDB..."
    sudo systemctl start mongod
    sleep 2
fi

if systemctl is-active --quiet mongod; then
    echo "✓ MongoDB is running"
else
    echo "✗ Failed to start MongoDB. Please start it manually:"
    echo "  sudo systemctl start mongod"
    exit 1
fi

echo ""

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "=========================================="
echo "Starting Backend Server..."
echo "=========================================="
echo "Backend will run on: http://178.18.246.104:3003"
echo ""

# Start backend in background
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

echo ""
echo "=========================================="
echo "Starting Frontend Server..."
echo "=========================================="
echo "Frontend will run on: http://178.18.246.104:5174"
echo ""

# Start frontend in background
cd frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✓ Both servers are starting!"
echo "=========================================="
echo ""
echo "Access the application at:"
echo "  Frontend: http://178.18.246.104:5174"
echo "  Backend:  http://178.18.246.104:3003/api"
echo ""
echo "Default login credentials:"
echo "  Email:    admin@alphastarav.com"
echo "  Password: Admin@123!"
echo ""
echo "To stop the servers, press Ctrl+C"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""

# Wait for user to stop
wait
