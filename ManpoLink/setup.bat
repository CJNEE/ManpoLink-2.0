@echo off
REM Employee Management System - Quick Setup Script (Windows)
REM Run this script to quickly set up the frontend

echo.
echo 🚀 Employee Management System - Setup
echo ======================================
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js/npm found
echo.

REM Navigate to frontend directory
echo 📁 Navigating to frontend directory...
cd /d "%~dp0frontend" || exit /b 1
echo ✅ In frontend directory
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo ✅ Dependencies installed
echo.

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo ⚙️  Creating .env.local...
    copy .env.example .env.local
    echo ✅ .env.local created
) else (
    echo ✅ .env.local already exists
)
echo.

REM Start development server
echo 🎯 Starting development server...
echo.
echo Frontend will be available at: http://localhost:5173
echo Make sure your Django backend is running at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
pause
