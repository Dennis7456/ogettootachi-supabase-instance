#!/bin/bash

# Simple script to run all invitation system tests
# Usage: ./test-all.sh

echo "🚀 RUNNING ALL INVITATION SYSTEM TESTS"
echo "======================================"
echo "Started: $(date)"
echo ""

# Counter for passed/failed tests
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local critical="$3"
    
    echo "🧪 Running: $test_name"
    echo "💻 Command: $test_command"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ PASS: $test_name"
        PASSED=$((PASSED + 1))
    else
        echo "❌ FAIL: $test_name"
        if [ "$critical" = "true" ]; then
            echo "🚨 CRITICAL FAILURE!"
        fi
        FAILED=$((FAILED + 1))
    fi
    
    TOTAL=$((TOTAL + 1))
    echo ""
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
    echo "❌ Supabase is not running. Start it with: supabase start"
    exit 1
fi

if ! curl -s http://127.0.0.1:54324/api/v1/info > /dev/null; then
    echo "❌ Mailpit is not accessible. Check if it's running."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Run all tests
echo "🧪 EXECUTING TEST SUITE"
echo "======================="

run_test "Health Monitor" "node monitor-invitation-system.js" "true"
run_test "Quick Invitation Test" "node quick-test-invitation.js test-runner@example.com staff 'Test Runner'" "true"
run_test "Configuration Check" "grep -q 'smtp_port = 1025' config/auth.toml" "true"
run_test "Comprehensive Test Suite" "node test-invitation-system-complete.js" "true"

# Calculate success rate
SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))

# Generate summary
echo "📊 TEST SUMMARY"
echo "==============="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📈 Success Rate: $SUCCESS_RATE%"
echo "⏱️  Completed: $(date)"
echo ""

# Determine overall status
if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Your invitation system is working perfectly."
    echo "🚀 Safe to deploy or make changes."
    exit 0
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo "⚠️  MOSTLY HEALTHY - Some tests failed"
    echo "💡 Review failed tests and consider fixing."
    echo "🔧 System is functional but could be improved."
    exit 1
else
    echo "🚨 SYSTEM UNHEALTHY - Multiple test failures!"
    echo "❌ DO NOT deploy until issues are fixed."
    echo "🛠️  Address failures immediately."
    exit 2
fi 
// CI/CD Pipeline Test Comment
