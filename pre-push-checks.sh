#!/bin/bash

# Pre-push validation script for Ogetto, Otachi & Co Advocates
# This script runs before git push to ensure code quality

set -e  # Exit on any error

echo "🚀 PRE-PUSH VALIDATION PIPELINE"
echo "==============================="
echo "Project: Ogetto, Otachi & Co Advocates - Invitation System"
echo "Started: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    local color=$3
    echo -e "${color}${status}${NC} ${message}"
}

print_success() {
    print_status "✅" "$1" "$GREEN"
}

print_error() {
    print_status "❌" "$1" "$RED"
}

print_warning() {
    print_status "⚠️ " "$1" "$YELLOW"
}

print_info() {
    print_status "ℹ️ " "$1" "$BLUE"
}

# Function to run a command and check its exit status
run_check() {
    local check_name="$1"
    local command="$2"
    local critical="$3"
    local format_command="$4"

    echo ""
    print_info "Running: $check_name"
    echo "Command: $command"
    
    if eval "$command"; then
        print_success "$check_name passed"
        return 0
    else
        print_warning "$check_name failed"
        
        # If format_command is provided, try to format
        if [ -n "$format_command" ]; then
            print_info "Attempting to automatically format code..."
            if eval "$format_command"; then
                print_success "Code automatically formatted"
                # Re-run the original check after formatting
                if eval "$command"; then
                    print_success "$check_name passed after formatting"
                    return 0
                else
                    print_error "$check_name still fails after formatting"
                    return 1
                fi
            else
                print_error "Automatic formatting failed"
                return 1
            fi
        fi

        if [ "$critical" = "true" ]; then
            print_error "$check_name FAILED (Critical)"
            return 1
        else
            print_warning "$check_name failed (Non-critical)"
            return 0
        fi
    fi
}

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
TOTAL_CHECKS=0

# Function to track check results
track_result() {
    local result=$1
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $result -eq 0 ]; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
}

echo "🔍 STEP 1: ENVIRONMENT VALIDATION"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the correct directory. Please run from the project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Check if Supabase is running (required for tests)
if ! curl -s http://127.0.0.1:54321/health > /dev/null 2>&1; then
    print_error "Supabase is not running. Start it with: supabase start"
    exit 1
fi

# Check if Mailpit is running (required for email tests)
if ! curl -s http://127.0.0.1:54324/api/v1/info > /dev/null 2>&1; then
    print_error "Mailpit is not accessible. Check if it's running."
    exit 1
fi

print_success "Environment validation passed"

echo ""
echo "🎨 STEP 2: CODE FORMATTING CHECK"
echo "================================"

run_check "Prettier Format Check" "npm run format:check" "true" "npm run format"
track_result $?

echo ""
echo "🔍 STEP 3: CODE LINTING"
echo "======================="

run_check "ESLint Check" "npm run lint:check" "true"
track_result $?

echo ""
echo "🧪 STEP 4: INVITATION SYSTEM TESTS"
echo "=================================="

run_check "Health Monitor" "npm run test:health" "true"
track_result $?

run_check "Quick Invitation Test" "npm run test:quick" "true"
track_result $?

run_check "Configuration Validation" "grep -q 'smtp_port = 1025' config/auth.toml" "true"
track_result $?

run_check "Comprehensive Test Suite" "npm run test:complete" "true"
track_result $?

echo ""
echo "🔒 STEP 5: SECURITY CHECKS"
echo "=========================="

# Security Audit
echo "ℹ️  Running: Security Audit"
npm audit --audit-level=moderate

# Secret Detection
echo "ℹ️  Running: Secret Detection"

# Exclude specific patterns and files
EXCLUDED_PATTERNS=(
    "*.html"  # Email templates
    "*.md"    # Markdown files
    "*.json"  # JSON configuration files
    "node_modules/*"  # Exclude node_modules
    ".git/*"  # Exclude git directory
)

# Build exclude pattern for grep
EXCLUDE_ARGS=()
for pattern in "${EXCLUDED_PATTERNS[@]}"; do
    EXCLUDE_ARGS+=("--exclude=$pattern")
done

# More precise secret detection
SECRET_DETECTION=$(grep -r -i -E '(password|secret|key|token|credentials).*=.*['\"][^'\"]{8,}' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude=*.html \
    --exclude=*.md \
    --exclude=*.json \
    . | grep -v 'email-templates')

if [ -n "$SECRET_DETECTION" ]; then
    echo "⚠️  Potential secrets found:"
    echo "$SECRET_DETECTION"
    echo "❌ Secret Detection FAILED (Critical)"
    exit 1
else
    echo "✅ Secret Detection passed"
fi

exit 0

echo ""
echo "📦 STEP 6: BUILD VALIDATION"
echo "==========================="

# Check that critical files exist
run_check "Critical Files Check" "[ -f 'test-invitation-system-complete.js' ] && [ -f 'monitor-invitation-system.js' ] && [ -f 'config/auth.toml' ]" "true"
track_result $?

# Check package.json integrity
run_check "Package.json Validation" "npm ls --depth=0 > /dev/null 2>&1" "false"
track_result $?

echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $CHECKS_PASSED"
echo "Failed: $CHECKS_FAILED"

SUCCESS_RATE=$(( (CHECKS_PASSED * 100) / TOTAL_CHECKS ))
echo "Success Rate: $SUCCESS_RATE%"

echo ""
if [ $CHECKS_FAILED -eq 0 ]; then
    print_success "🎉 ALL VALIDATION CHECKS PASSED!"
    print_success "✅ Code is ready for push"
    print_success "🚀 Invitation system is healthy and secure"
    
    echo ""
    print_info "📋 Pre-push checklist completed:"
    print_info "  ✅ Code formatting (Prettier)"
    print_info "  ✅ Code linting (ESLint)"
    print_info "  ✅ Security checks"
    print_info "  ✅ Invitation system tests"
    print_info "  ✅ Environment validation"
    
    echo ""
    print_success "🏆 PUSH APPROVED - Proceeding with git push..."
    exit 0
    
elif [ $SUCCESS_RATE -ge 80 ]; then
    print_warning "⚠️  MOSTLY HEALTHY - Some non-critical checks failed"
    print_warning "💭 Consider fixing issues before push"
    
    echo ""
    read -p "Do you want to proceed with push anyway? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "🟡 PUSH APPROVED WITH WARNINGS"
        exit 0
    else
        print_info "❌ Push cancelled by user"
        exit 1
    fi
    
else
    print_error "🚨 VALIDATION FAILED - Multiple critical issues found"
    print_error "❌ PUSH REJECTED"
    print_error "🛠️  Fix the issues above before pushing"
    
    echo ""
    print_info "💡 Quick fixes:"
    print_info "  🎨 Run: npm run fix-all"
    print_info "  🔧 Run: npm run format && npm run lint"
    print_info "  🧪 Run: npm run test"
    
    echo ""
    print_error "🚫 PUSH BLOCKED - Please fix issues and try again"
    exit 1
fi 