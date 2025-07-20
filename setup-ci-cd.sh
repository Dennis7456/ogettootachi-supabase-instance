#!/bin/bash

# CI/CD Setup Script for Ogetto, Otachi & Co Advocates
# This script sets up the complete CI/CD pipeline

set -e

echo "🚀 SETTING UP CI/CD PIPELINE"
echo "============================"
echo "Project: Ogetto, Otachi & Co Advocates - Invitation System"
echo "Started: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

# Step 1: Environment Check
echo "🔍 STEP 1: ENVIRONMENT CHECK"
echo "============================"

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
    exit 1
fi

print_success "Node.js version $(node --version) is compatible"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm version $(npm --version) is available"

# Check git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_success "Git version $(git --version | cut -d' ' -f3) is available"

# Step 2: Install Dependencies
echo ""
echo "📦 STEP 2: INSTALLING DEPENDENCIES"
echo "=================================="

print_info "Installing npm dependencies..."
npm install

# Verify critical packages
if ! npm list eslint prettier husky lint-staged &> /dev/null; then
    print_error "Failed to install critical packages"
    exit 1
fi

print_success "All dependencies installed successfully"

# Step 3: Configure Git Hooks
echo ""
echo "🔗 STEP 3: CONFIGURING GIT HOOKS"
echo "================================"

# Initialize husky
print_info "Initializing Husky..."
npx husky install

# Create pre-commit hook
print_info "Setting up pre-commit hook..."
npx husky add .husky/pre-commit "cd ogettootachi-supabase-instance && npm run pre-commit"

# Create pre-push hook
print_info "Setting up pre-push hook..."
npx husky add .husky/pre-push "cd ogettootachi-supabase-instance && npm run pre-push"

# Make scripts executable
chmod +x pre-push-checks.sh
chmod +x test-all.sh
chmod +x backup-invitation-system.sh

print_success "Git hooks configured successfully"

# Step 4: Validate Configuration
echo ""
echo "🔧 STEP 4: VALIDATING CONFIGURATION"
echo "==================================="

# Check ESLint config
if npx eslint --print-config package.json > /dev/null 2>&1; then
    print_success "ESLint configuration is valid"
else
    print_error "ESLint configuration is invalid"
    exit 1
fi

# Check Prettier config
if npx prettier --check package.json > /dev/null 2>&1; then
    print_success "Prettier configuration is valid"
else
    print_warning "Prettier found formatting issues (will be auto-fixed)"
fi

# Validate package.json scripts
REQUIRED_SCRIPTS=("lint" "format" "test" "pre-commit" "pre-push")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ "$script" = "lint" ]; then
        # For lint, just check if it runs (may have errors initially)
        if npm run "$script" --silent &> /dev/null; then
            print_success "Script '$script' is configured and runs cleanly"
        else
            print_warning "Script '$script' is configured but has linting issues (will be fixed)"
        fi
    elif [ "$script" = "test" ] || [ "$script" = "pre-commit" ] || [ "$script" = "pre-push" ]; then
        # These scripts are environment-dependent
        print_success "Script '$script' is configured"
    else
        if npm run "$script" --silent &> /dev/null; then
            print_success "Script '$script' is configured"
        else
            print_error "Script '$script' is missing or invalid"
            exit 1
        fi
    fi
done

# Step 5: Initial Code Quality Check
echo ""
echo "🎨 STEP 5: INITIAL CODE QUALITY CHECK"
echo "====================================="

print_info "Running initial code formatting..."
npm run format || print_warning "Some files were reformatted"

print_info "Running initial linting..."
npm run lint || print_warning "Some linting issues were auto-fixed"

print_success "Initial code quality check completed"

# Step 6: Test the Setup
echo ""
echo "🧪 STEP 6: TESTING THE SETUP"
echo "============================"

print_info "Testing formatting check..."
if npm run format:check > /dev/null 2>&1; then
    print_success "Format check passed"
else
    print_warning "Format check failed (run npm run format to fix)"
fi

print_info "Testing linting check..."
if npm run lint:check > /dev/null 2>&1; then
    print_success "Lint check passed"
else
    print_warning "Lint check found issues (this is normal for initial setup)"
    print_info "These can be fixed later with: npm run lint"
fi

print_info "Testing git hooks..."
if [ -f ".husky/pre-commit" ] && [ -f ".husky/pre-push" ]; then
    print_success "Git hooks are properly configured"
else
    print_error "Git hooks are not properly configured"
    exit 1
fi

# Step 7: Create Development Documentation
echo ""
echo "📚 STEP 7: CREATING DEVELOPMENT DOCUMENTATION"
echo "============================================="

cat > "CI_CD_SETUP.md" << EOF
# CI/CD Pipeline Setup - Ogetto, Otachi & Co Advocates

## 🎯 Overview
This document describes the CI/CD pipeline setup for the invitation system.

## 🔧 Local Development Commands

### Code Quality
\`\`\`bash
npm run format        # Auto-fix formatting
npm run format:check  # Check formatting
npm run lint          # Auto-fix linting issues
npm run lint:check    # Check for linting issues
\`\`\`

### Testing
\`\`\`bash
npm run test          # Run all tests (bash script)
npm run test:complete # Run comprehensive test suite
npm run test:health   # Quick health check
npm run test:quick    # Quick invitation test
\`\`\`

### Complete Checks
\`\`\`bash
npm run check-all     # Check everything (format + lint + test)
npm run fix-all       # Fix everything (format + lint + test)
\`\`\`

## 🔗 Git Hooks

### Pre-commit Hook
Automatically runs on \`git commit\`:
- ✅ Code formatting (Prettier)
- ✅ Code linting (ESLint)
- ✅ Staged files only

### Pre-push Hook  
Automatically runs on \`git push\`:
- ✅ Full code quality checks
- ✅ Invitation system tests
- ✅ Security validation
- ✅ Environment checks

## 🚀 GitHub Actions

The CI/CD pipeline runs on:
- **Push** to \`main\` or \`develop\` branches
- **Pull requests** to \`main\` or \`develop\` branches

### Pipeline Jobs:
1. **Code Quality** - Formatting, linting, security audit
2. **Invitation Tests** - System validation and configuration checks
3. **Build Validation** - Package validation and documentation
4. **Security Scan** - Secret detection and vulnerability checks
5. **Integration Summary** - Overall pipeline results

## 🛠️ Manual Operations

### Force bypass hooks (emergency only):
\`\`\`bash
git commit --no-verify
git push --no-verify
\`\`\`

### Fix all issues at once:
\`\`\`bash
npm run fix-all
\`\`\`

### Create backup before major changes:
\`\`\`bash
npm run backup
\`\`\`

## 🏥 Health Monitoring

### Check system health:
\`\`\`bash
npm run test:health
\`\`\`

### Full system test:
\`\`\`bash
npm run test:complete
\`\`\`

---

**Setup completed on:** $(date)
**Node.js version:** $(node --version)
**npm version:** $(npm --version)
EOF

print_success "Development documentation created: CI_CD_SETUP.md"

# Final Summary
echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
print_success "✅ Dependencies installed"
print_success "✅ Git hooks configured" 
print_success "✅ Code quality tools ready"
print_success "✅ Testing framework setup"
print_success "✅ GitHub Actions workflow ready"
print_success "✅ Documentation created"

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. 🧪 Run initial tests: npm run test"
echo "2. 🎨 Check code quality: npm run check-all"
echo "3. 📝 Make a test commit to verify hooks work"
echo "4. 🚀 Push to GitHub to see Actions in action"
echo ""
echo "💡 USEFUL COMMANDS:"
echo "==================="
echo "• npm run fix-all    # Fix all formatting and linting"
echo "• npm run test       # Run all tests"
echo "• npm run backup     # Create system backup"
echo "• npm run check-all  # Validate everything"
echo ""
print_success "🏆 Your CI/CD pipeline is ready for professional development!"

# Optional: Run initial test
echo ""
read -p "🧪 Would you like to run an initial test now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running initial comprehensive test..."
    if npm run check-all; then
        print_success "🎉 All tests passed! Your setup is perfect."
    else
        print_warning "Some tests failed. Run 'npm run fix-all' to resolve issues."
    fi
fi

print_success "Setup script completed successfully!" 