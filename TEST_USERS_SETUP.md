# Test Users Setup Guide

This guide explains how to set up and manage test users for the law firm website application.

## 🚀 Quick Start

### Option 1: Reset Database and Create Test Users (Recommended for fresh start)

```bash
# Reset the database and create test users
node reset-db-and-create-test-users.js
```

### Option 2: Create Test Users Only (Add to existing database)

```bash
# Create test users without resetting the database
node create-test-users-only.js
```

### Option 3: Check Current Test Users

```bash
# Verify existing test users
node check-test-users.js
```

### Option 4: Check Profile Schema

```bash
# View complete profile structure and data
node check-profile-schema.js
```

## 📝 Test User Credentials

After running the setup scripts, you'll have these test users available:

### 🔧 Admin User
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Title**: Senior Partner
- **Experience**: 15 years
- **Specializations**: Corporate Law, Commercial Litigation, Mergers & Acquisitions
- **Access**: Full admin dashboard with all permissions

### 👨‍💼 Staff User
- **Email**: `staff@test.com`
- **Password**: `staff123`
- **Role**: `staff`
- **Title**: Senior Legal Assistant
- **Experience**: 8 years
- **Specializations**: Legal Research, Document Preparation, Client Communication
- **Access**: Staff dashboard with limited permissions

## 🔗 Test URLs

- **Admin Dashboard**: http://localhost:5173/admin/login
- **Staff Dashboard**: http://localhost:5173/staff/login
- **Frontend**: http://localhost:5173

## 📋 Available Scripts

### 1. `reset-db-and-create-test-users.js`
**Purpose**: Complete database reset and test user creation
**What it does**:
- Deletes all existing users from the database
- Creates fresh test users (admin, staff)
- Creates **complete profiles** with all fields filled out
- Verifies the setup

**Use when**:
- Starting fresh development
- Need to clear all data
- Setting up a new environment

### 2. `create-test-users-only.js`
**Purpose**: Add test users to existing database
**What it does**:
- Checks for existing test users
- Creates test users only if they don't exist
- Creates **complete profiles** with all fields filled out
- Preserves existing data
- Verifies the setup

**Use when**:
- Adding test users to existing data
- Don't want to lose current data
- Setting up additional test accounts

### 3. `check-test-users.js`
**Purpose**: Verify and display current test users
**What it does**:
- Lists all test users in the database
- Shows user credentials
- Displays basic profile information
- Provides test URLs

**Use when**:
- Need to check current test users
- Forgot test credentials
- Verifying setup

### 4. `check-profile-schema.js`
**Purpose**: View complete profile structure and data
**What it does**:
- Shows all available profile fields
- Displays complete profile data for test users
- Helps understand the profile structure

**Use when**:
- Need to see complete profile data
- Understanding profile field structure
- Debugging profile issues

## 🛠️ Prerequisites

### 1. Supabase Local Development
Make sure Supabase is running locally:

```bash
# Check if Supabase is running
supabase status

# Start Supabase if not running
supabase start
```

### 2. Node.js Dependencies
Install required dependencies:

```bash
npm install @supabase/supabase-js
```

### 3. Database Schema
Ensure the database has the required tables:
- `auth.users` (managed by Supabase)
- `profiles` (custom table for user profiles)

## 🔧 Script Details

### Database Reset Process
1. **List Users**: Gets all existing users from Supabase Auth
2. **Delete Users**: Removes each user (cascades to related data)
3. **Create Users**: Creates new test users with proper roles
4. **Create Complete Profiles**: Adds comprehensive profile data for each user
5. **Verify Setup**: Confirms all users and profiles are created

### User Creation Process
1. **Auth User**: Creates user in Supabase Auth with email/password
2. **Complete Profile Data**: Inserts comprehensive profile record with all fields
3. **Email Confirmation**: Automatically confirms email for testing
4. **Role Assignment**: Sets appropriate role (admin/staff)

## 🚨 Important Notes

### Security
- These scripts use the **service role key** for admin operations
- Test passwords are simple for development purposes
- **Never use these credentials in production**

### Data Persistence
- `reset-db-and-create-test-users.js` **deletes all users**
- `create-test-users-only.js` preserves existing data
- Always backup important data before resetting

### Environment
- Scripts are configured for **local development** (127.0.0.1:54321)
- For remote/production, update the Supabase URL and keys

## 🔄 Common Workflows

### Fresh Development Setup
```bash
# 1. Start Supabase
supabase start

# 2. Reset and create test users
node reset-db-and-create-test-users.js

# 3. Start frontend
cd ../ogetto-otachi-frontend
npm run dev
```

### Adding Test Users to Existing Data
```bash
# 1. Check current users
node check-test-users.js

# 2. Add test users if needed
node create-test-users-only.js
```

### Troubleshooting
```bash
# 1. Check Supabase status
supabase status

# 2. Check test users
node check-test-users.js

# 3. Check complete profile data
node check-profile-schema.js

# 4. Reset if needed
node reset-db-and-create-test-users.js
```

## 📊 Complete User Profiles

Each test user has a comprehensive profile with all fields filled out:

### Admin Profile Fields
- **Basic Info**: Full name, email, phone, role, title
- **Professional**: Occupation, area of focus, years of experience
- **Specializations**: Array of legal specializations
- **Areas of Practice**: Comprehensive practice areas
- **Certifications**: Professional certifications
- **Education**: Degree, institution, year, additional degrees
- **Memberships**: Professional memberships
- **Bio**: Professional biography
- **Personal Story**: Detailed personal narrative
- **Status**: Active status and timestamps

### Staff Profile Fields
- **Basic Info**: Full name, email, phone, role, title
- **Professional**: Occupation, area of focus, years of experience
- **Specializations**: Array of support specializations
- **Areas of Practice**: Support and administrative areas
- **Certifications**: Professional certifications
- **Education**: Degree, institution, year, additional degrees
- **Memberships**: Professional memberships
- **Bio**: Professional biography
- **Personal Story**: Detailed personal narrative
- **Status**: Active status and timestamps

## 🎯 Testing Scenarios

### Admin Testing
- Login with `admin@test.com` / `admin123`
- Access admin dashboard
- Test user management
- Test system settings
- View complete profile data

### Staff Testing
- Login with `staff@test.com` / `staff123`
- Access staff dashboard
- Test limited permissions
- Verify role restrictions
- View complete profile data

## 🔍 Troubleshooting

### Common Issues

1. **Supabase not running**
   ```bash
   supabase start
   ```

2. **Users not created**
   ```bash
   node check-test-users.js
   # Check for errors in output
   ```

3. **Incomplete profiles**
   ```bash
   node check-profile-schema.js
   # Verify all fields are populated
   ```

4. **Login issues**
   - Verify credentials from `check-test-users.js`
   - Check if frontend is running
   - Ensure Supabase is accessible

5. **Permission errors**
   - Verify user roles in profiles table
   - Check RLS policies
   - Ensure proper role assignment

### Debug Commands
```bash
# Check Supabase status
supabase status

# Check test users
node check-test-users.js

# Check complete profile data
node check-profile-schema.js

# View Supabase logs
supabase logs

# Reset everything
node reset-db-and-create-test-users.js
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify Supabase is running properly
3. Check the script output for error messages
4. Ensure all prerequisites are met
5. Use `check-profile-schema.js` to verify profile completeness

---

**Note**: These scripts are for development and testing purposes only. Never use test credentials in production environments.
