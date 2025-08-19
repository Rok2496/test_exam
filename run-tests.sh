#!/bin/bash

# Yalla Admin Web - Automated Test Runner
# This script runs the complete test suite for admin-dev.yalla.systems

echo "🚀 Starting Yalla Admin Web Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test-results

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

print_status "Installing Playwright browsers..."
npx playwright install

if [ $? -ne 0 ]; then
    print_warning "Failed to install Playwright browsers. Some tests may fail."
fi

print_success "Playwright browsers installed"

# Run different test suites
echo ""
print_status "Running Homepage Tests..."
npx playwright test tests/homepage.spec.js --reporter=line

echo ""
print_status "Running Error Handling Tests..."
npx playwright test tests/error-handling.spec.js --reporter=line

echo ""
print_status "Running Security Tests..."
npx playwright test tests/security.spec.js --reporter=line

echo ""
print_status "Running Cross-Browser Tests..."
npx playwright test tests/cross-browser.spec.js --reporter=line

echo ""
print_status "Running Full Test Suite..."
npx playwright test --reporter=html

# Generate final report
echo ""
print_status "Generating test report..."
npx playwright show-report --host=127.0.0.1 --port=9323 &
REPORT_PID=$!

print_success "Test execution completed!"
echo ""
echo "📊 Test Results:"
echo "  - HTML Report: http://127.0.0.1:9323"
echo "  - Screenshots: ./test-results/"
echo "  - JSON Report: ./test-results/results.json"
echo "  - JUnit Report: ./test-results/results.xml"
echo ""
echo "📋 Manual Testing:"
echo "  - Review: ./test-plan.md"
echo "  - Exploratory Report: ./exploratory-testing-report.md"
echo ""

# Keep the report server running for a while
print_status "Test report server will run for 60 seconds..."
sleep 60
kill $REPORT_PID 2>/dev/null

print_success "Test suite execution completed!"