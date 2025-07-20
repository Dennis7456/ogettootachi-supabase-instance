# CI/CD Pipeline Setup - Ogetto, Otachi & Co Advocates

## 🎯 Overview

This document describes the CI/CD pipeline setup for the invitation system.

## 🔧 Local Development Commands

### Code Quality

```bash
npm run format        # Auto-fix formatting
npm run format:check  # Check formatting
npm run lint          # Auto-fix linting issues
npm run lint:check    # Check for linting issues
```

### Testing

```bash
npm run test          # Run all tests (bash script)
npm run test:complete # Run comprehensive test suite
npm run test:health   # Quick health check
npm run test:quick    # Quick invitation test
```

### Complete Checks

```bash
npm run check-all     # Check everything (format + lint + test)
npm run fix-all       # Fix everything (format + lint + test)
```

## 🔗 Git Hooks

### Pre-commit Hook

Automatically runs on `git commit`:

- ✅ Code formatting (Prettier)
- ✅ Code linting (ESLint)
- ✅ Staged files only

### Pre-push Hook

Automatically runs on `git push`:

- ✅ Full code quality checks
- ✅ Invitation system tests
- ✅ Security validation
- ✅ Environment checks

## 🚀 GitHub Actions

The CI/CD pipeline runs on:

- **Push** to `main` or `develop` branches
- **Pull requests** to `main` or `develop` branches

### Pipeline Jobs:

1. **Code Quality** - Formatting, linting, security audit
2. **Invitation Tests** - System validation and configuration checks
3. **Build Validation** - Package validation and documentation
4. **Security Scan** - Secret detection and vulnerability checks
5. **Integration Summary** - Overall pipeline results

## 🛠️ Manual Operations

### Force bypass hooks (emergency only):

```bash
git commit --no-verify
git push --no-verify
```

### Fix all issues at once:

```bash
npm run fix-all
```

### Create backup before major changes:

```bash
npm run backup
```

## 🏥 Health Monitoring

### Check system health:

```bash
npm run test:health
```

### Full system test:

```bash
npm run test:complete
```

---

**Setup completed on:** Sun Jul 20 02:32:17 CDT 2025 **Node.js version:** v23.11.0 **npm version:**
10.9.2
