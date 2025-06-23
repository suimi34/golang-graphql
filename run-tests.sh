#!/bin/bash

echo "🧪 Running Playwright tests for User Registration"
echo "================================================="

# Check if frontend is built
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend not built. Building now..."
    ./build-frontend.sh
    if [ $? -ne 0 ]; then
        echo "❌ Frontend build failed"
        exit 1
    fi
else
    echo "✅ Frontend build found"
fi

# Check if server binary exists
if [ ! -f "bin/server" ]; then
    echo "❌ Server binary not found. Building now..."
    go build -o ./bin/server .
    if [ $? -ne 0 ]; then
        echo "❌ Server build failed"
        exit 1
    fi
else
    echo "✅ Server binary found"
fi

# Navigate to tests directory
cd tests

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Test dependency installation failed"
        exit 1
    fi
fi

# Install Playwright browsers if needed
echo "🌐 Ensuring Playwright browsers are installed..."
npx playwright install --with-deps

# Run tests
echo "🏃 Running tests..."
if [ "$1" = "--headed" ]; then
    npm run test:headed
elif [ "$1" = "--ui" ]; then
    npm run test:ui
elif [ "$1" = "--debug" ]; then
    npm run test:debug
else
    npm test
fi

# Check test results
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "📊 View detailed report: npm run report"
else
    echo "❌ Some tests failed"
    echo "📊 View detailed report: npm run report"
    exit 1
fi
