@echo off
REM Alpha Star Aviation KPIs - Development Startup Script (Windows)
REM This script starts both backend and frontend in development mode

echo ==========================================
echo Alpha Star Aviation KPIs Dashboard
echo Starting Development Environment
echo ==========================================
echo.

REM Check if MongoDB is running (Windows)
echo Checking MongoDB status...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 (
    echo MongoDB is not running. Please start MongoDB manually.
    echo You can start it with: net start MongoDB
    pause
    exit /b 1
) else (
    echo [OK] MongoDB is running
)

echo.

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ==========================================
echo Starting Backend Server...
echo ==========================================
echo Backend will run on: http://178.18.246.104:3003
echo.

REM Start backend in new window
start "Alpha Star Backend" cmd /k "cd backend && npm run start:dev"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo Starting Frontend Server...
echo ==========================================
echo Frontend will run on: http://localhost:5174
echo.

REM Start frontend in new window
start "Alpha Star Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo [OK] Both servers are starting!
echo ==========================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:5174
echo   Backend:  http://178.18.246.104:3003/api
echo.
echo Default login credentials:
echo   Email:    admin@alphastarav.com
echo   Password: Admin@123!
echo.
echo Two command windows have been opened.
echo Close those windows to stop the servers.
echo.
pause
