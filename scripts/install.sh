#!/bin/bash

# ClickUp to Google Drive Backup Agent Installation Script

set -e

echo "🚀 ClickUp to Google Drive Backup Agent Installation"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make scripts executable
chmod +x setup-credentials.js
chmod +x backup-script.js

# Check if Docker is available (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker detected - you can use Docker deployment"
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose detected"
    else
        echo "⚠️  Docker Compose not found - install for easier deployment"
    fi
else
    echo "⚠️  Docker not detected - you can still use the standalone script"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: node setup-credentials.js"
echo "2. Run: npm start"
echo "3. Open http://localhost:5678 in your browser"
echo "4. Import the workflow: clickup-backup-workflow.json"
echo "5. Activate the workflow"
echo ""
echo "📚 For more information, see README.md"