# Environment Variables Setup Guide

## 📁 Environment Files Structure

This project uses multiple environment files to manage different deployment environments:

```
.env.example          # Template file (safe to commit)
.env.local           # Local development (gitignored)
.env.production      # Production environment (gitignored)
.env                 # Default/fallback (gitignored)
.env.backup          # Backup files (gitignored)
```

## 🚀 Environment Usage

### Local Development
```bash
# Use local Supabase instance
npm run dev          # Uses .env.local (local Supabase)
```

### Production Build
```bash
# Build for production (Firebase hosting)
npm run build        # Uses .env (production Supabase)
```

## 🔧 Environment File Contents

### `.env.local` (Local Development)
```bash
# Local Development Environment Variables
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `.env.production` (Production)
```bash
# Production Environment Variables
VITE_SUPABASE_URL=https://szbjuskqrfthmjehknly.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔄 Switching Environments

### For Local Development
```bash
# Copy local environment
cp .env.local .env
npm run dev
```

### For Production Build
```bash
# Copy production environment
cp .env.production .env
npm run build
firebase deploy --only hosting
```

## 🛡️ Security Best Practices

1. **Never commit sensitive files**: `.env.local`, `.env.production`, `.env` are in `.gitignore`
2. **Use `.env.example`**: Safe template for other developers
3. **Rotate keys regularly**: Update Supabase keys periodically
4. **Environment-specific builds**: Always build with correct environment

## 🔍 Troubleshooting

### Environment Not Loading
```bash
# Check which environment file is being used
echo $NODE_ENV
cat .env | head -5
```

### Build Issues
```bash
# Clear build cache
rm -rf dist/
rm -rf node_modules/.vite/
npm run build
```

### Firebase Deployment Issues
```bash
# Ensure production environment is active
cp .env.production .env
npm run build
firebase deploy --only hosting
```

## 📝 Adding New Environment Variables

1. Add to `.env.example` (template)
2. Add to `.env.local` (local development)
3. Add to `.env.production` (production)
4. Update this documentation

## 🎯 Quick Commands

```bash
# Switch to local development
cp .env.local .env && npm run dev

# Switch to production and deploy
cp .env.production .env && npm run build && firebase deploy --only hosting

# Check current environment
head -3 .env
```
