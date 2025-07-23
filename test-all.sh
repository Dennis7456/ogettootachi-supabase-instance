#!/bin/bash

# Comprehensive Test Runner for Supabase Project
# Usage: ./test-all.sh

set -e

echo "🚀 RUNNING COMPREHENSIVE TEST SUITE"
echo "===================================="
echo "Started: $(date)"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Supabase local instance
if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
    echo "❌ Supabase is not running. Starting local instance..."
    supabase start
fi

# Check Mailpit
if ! curl -s http://127.0.0.1:54324/api/v1/info > /dev/null; then
    echo "❌ Mailpit is not accessible. Ensure it's running."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Ensure dependencies are installed
echo "📦 Installing dependencies..."
npm install

# Run database migrations for test environment
echo "🗄️ Preparing test database..."
supabase migration up

# Run Supabase local instance checks
echo "🔬 Checking Supabase local configuration..."
supabase status

# Run tests with detailed output and generate coverage report
echo "🧪 EXECUTING TEST SUITE"
echo "======================="

# Capture test output and result
set +e
NODE_OPTIONS=--experimental-vm-modules npx vitest run \
    --coverage \
    --reporter=verbose \
    --reporter=html
TEST_RESULT=$?
set -e

# Generate summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="

if [ $TEST_RESULT -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Your Supabase project is working perfectly."
    echo "🚀 Safe to deploy or make changes."
else
    echo "🚨 SOME TESTS FAILED!"
    echo "❌ Review test output and address issues."
    echo "🔧 System needs attention before deployment."
fi

# Exit with test result
exit $TEST_RESULT
