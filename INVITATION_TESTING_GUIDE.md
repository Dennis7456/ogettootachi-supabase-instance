# User Invitation System Testing Guide

## 🎯 Overview

Your law firm website has a comprehensive user invitation system that allows admins to invite staff
members. This guide will help you test the complete invitation flow with your online Supabase
application.

## 🔧 **System Components**

### **Database Functions**

- ✅ `create_user_invitation()` - Creates new invitations
- ✅ `accept_user_invitation()` - Handles invitation acceptance
- ✅ `get_pending_invitations()` - Lists pending invitations
- ✅ `cancel_invitation()` - Cancels invitations

### **Edge Functions**

- ✅ `handle-invitation` - Main invitation processing
- ✅ `send-invitation-email` - Email sending functionality

### **React App Features**

- ✅ Admin dashboard with invitation management
- ✅ User invitation form
- ✅ Invitation acceptance page
- ✅ Email templates and notifications

## 📋 **Prerequisites**

1. **Admin User**: You need at least one admin user in your system
2. **Online Supabase**: Your production Supabase instance running
3. **Environment Variables**: Proper configuration for Edge Functions
4. **Email Service** (Optional): Resend API key for email functionality

## 🧪 **Testing Methods**

### **Method 1: Automated Testing Script**

```bash
cd ogettootachi-supabase-instance

# Set your credentials
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export TEST_EMAIL="test@example.com"

# Run the comprehensive test
node test-invitation-system.js
```

### **Method 2: Manual Testing via React App**

1. **Create Admin User** (if you don't have one):

   ```bash
   # Go to your React app
   cd ../ogetto-otachi-frontend
   npm run dev

   # Visit: http://localhost:5173/admin/registration
   # Create your first admin user
   ```

2. **Test Invitation Creation**:
   - Login as admin: `http://localhost:5173/admin/login`
   - Go to User Management section
   - Create a new invitation
   - Verify invitation appears in pending list

3. **Test Invitation Acceptance**:
   - Copy the invitation URL from the admin dashboard
   - Open in incognito window or different browser
   - Complete the invitation acceptance flow

### **Method 3: Database Direct Testing**

Connect to your Supabase dashboard and run these SQL commands:

```sql
-- Check if invitation functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%invitation%';

-- Test creating an invitation (as admin)
SELECT create_user_invitation(
  'test@example.com',
  'staff',
  72
);

-- Check pending invitations
SELECT * FROM get_pending_invitations();

-- View invitation records
SELECT id, email, role, invitation_token, expires_at, accepted_at
FROM user_invitations
ORDER BY created_at DESC;
```

## 🔍 **Test Scenarios**

### **Scenario 1: Complete Invitation Flow**

1. **Admin creates invitation**
   - Email: `newstaff@example.com`
   - Role: `staff`
   - Expected: Invitation created with token

2. **System sends email** (if configured)
   - Expected: Email sent to invitee
   - Contains: Invitation URL with token

3. **User accepts invitation**
   - User clicks invitation URL
   - Provides: Name and password
   - Expected: Account created, invitation marked accepted

4. **User can login**
   - Use newly created credentials
   - Expected: Successful login with `staff` role

### **Scenario 2: Edge Cases**

1. **Duplicate invitations**
   - Try inviting same email twice
   - Expected: Error "User already has a pending invitation"

2. **Expired invitations**
   - Wait for invitation to expire (72 hours)
   - Try to accept
   - Expected: Error "Invalid or expired invitation token"

3. **Invalid tokens**
   - Use fake invitation token
   - Expected: Error "Invalid or expired invitation token"

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Only admins can create invitations"**

**Solution**: Ensure you have an admin user with `role = 'admin'` in the profiles table

### **Issue 2: "Function create_user_invitation does not exist"**

**Solution**: Run your Supabase migrations:

```bash
cd ogettootachi-supabase-instance
supabase db push
```

### **Issue 3: "Edge Function not found"**

**Solution**: Deploy your Edge Functions:

```bash
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email
```

### **Issue 4: Email not sending**

**Solution**: Configure your email service:

```bash
supabase secrets set RESEND_API_KEY="your-resend-api-key"
```

## ✅ **Verification Checklist**

- [ ] Admin user exists in the system
- [ ] Database functions are deployed
- [ ] Edge Functions are deployed
- [ ] Invitation can be created successfully
- [ ] Invitation appears in pending list
- [ ] Invitation URL is generated correctly
- [ ] Email is sent (if configured)
- [ ] Invitation can be accepted
- [ ] New user can login after acceptance
- [ ] User has correct role assigned

## 🔧 **Configuration for Online Supabase**

### **1. Get Your Credentials**

From your Supabase Dashboard (`https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api`):

```bash
# Your Project URL
SUPABASE_URL="https://your-project-ref.supabase.co"

# Your Service Role Key (keep secret!)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Your Anon Key (public)
SUPABASE_ANON_KEY="eyJhbGci..."
```

### **2. Set Environment Variables for Edge Functions**

```bash
cd ogettootachi-supabase-instance

# Core Supabase settings
supabase secrets set SUPABASE_URL="https://your-project-ref.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="your-anon-key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email service (optional)
supabase secrets set RESEND_API_KEY="your-resend-api-key"

# Frontend URL
supabase secrets set FRONTEND_URL="https://your-domain.com"
```

### **3. Deploy Functions**

```bash
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email
```

### **4. Test the Configuration**

```bash
# Run the test script
node test-invitation-system.js
```

## 📊 **Expected Test Results**

When everything is working correctly, you should see:

```
🧪 Testing User Invitation System
================================

✅ Database Connection: Connected to Supabase successfully
✅ Admin User Check: Found existing admin user: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
✅ Create Invitation: Invitation created successfully
✅ Get Pending Invitations: Found X pending invitations
✅ Edge Function - Handle Invitation: Edge function executed successfully
⚠️  Email Function: Email function failed (expected if not configured)
✅ React App Integration: React app can access invitation data (X records)
✅ Cleanup: Test invitation cleaned up

📊 Test Summary
===============
✅ Passed: 6
⚠️  Warnings: 1
❌ Failed: 0
📝 Total Tests: 7

🎉 All critical tests passed! Your invitation system is working.
```

## 🎯 **Next Steps After Testing**

1. **Configure Email Service**: Set up Resend API for production emails
2. **Test in Production**: Verify everything works with your live domain
3. **User Documentation**: Create guides for your staff on using invitations
4. **Monitoring**: Set up logging and monitoring for invitation flows

## 🆘 **Need Help?**

If tests fail, check:

1. **Database**: Ensure all migrations are applied
2. **Permissions**: Verify RLS policies allow admin access
3. **Functions**: Check Edge Functions are deployed
4. **Environment**: Confirm all environment variables are set
5. **Admin User**: Ensure you have a user with `role = 'admin'`

Your invitation system is comprehensive and production-ready! 🎉
