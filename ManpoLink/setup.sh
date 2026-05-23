#!/bin/bash

# Employee Management System - Quick Setup Script
# Run this script to quickly set up the frontend

echo "🚀 Employee Management System - Setup"
echo "======================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js/npm found"
echo ""

# Navigate to frontend directory
echo "📁 Navigating to frontend directory..."
cd "$(dirname "$0")/frontend" || exit 1
echo "✅ In frontend directory"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "⚙️  Creating .env.local..."
    cp .env.example .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi
echo ""

# Start development server
echo "🎯 Starting development server..."
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Make sure your Django backend is running at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
