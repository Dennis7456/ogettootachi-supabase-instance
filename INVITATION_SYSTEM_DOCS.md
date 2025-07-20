# 📧 Invitation System Documentation

## 🎯 **Overview**

The invitation system allows admins to send secure invitations to new users, enabling them to create
accounts with predefined roles (admin/staff). The system handles both new and existing users,
ensures email delivery, and provides secure token-based registration.

## 🏗️ **Architecture**

### **Components:**

1. **Frontend (React)**: UserManagement component for sending invitations
2. **Backend (Supabase Edge Functions)**:
   - `handle-invitation`: Main invitation logic
   - `send-invitation-email`: Email delivery service
3. **Database**: `user_invitations` table for tracking invitations
4. **Email Service**: Mailpit (local) / Resend (production)

### **Flow:**

```
React UI → handle-invitation → Database Record → send-invitation-email → Email Delivery
```

## 🔧 **Key Configuration**

### **Critical Files:**

- `ogettootachi-supabase-instance/config/auth.toml` - SMTP configuration
- `ogettootachi-supabase-instance/supabase/functions/handle-invitation/index.ts`
- `ogettootachi-supabase-instance/supabase/functions/send-invitation-email/index.ts`

### **SMTP Settings (auth.toml):**

```toml
smtp_host = "127.0.0.1"
smtp_port = 1025  # CRITICAL: Must be 1025 for Mailpit
smtp_user = ""
smtp_pass = ""
```

**⚠️ WARNING**: Never change `smtp_port` from 1025 - this breaks email delivery!

## 🧪 **Testing & Monitoring**

### **Daily Testing:**

```bash
# Quick health check
node monitor-invitation-system.js

# Comprehensive test suite
node test-invitation-system-complete.js

# Quick invitation test
node quick-test-invitation.js test@example.com admin "Test User"
```

### **Before Code Changes:**

```bash
# 1. Run full test suite
node test-invitation-system-complete.js

# 2. Make your changes

# 3. Run tests again to ensure no regressions
node test-invitation-system-complete.js

# 4. Test specific functionality
node quick-test-invitation.js your-email@domain.com admin "Your Name"
```

### **Health Monitoring:**

```bash
# Check current health
node monitor-invitation-system.js

# View health history
node monitor-invitation-system.js history
```

## 🚨 **Critical Dependencies**

### **DO NOT MODIFY without testing:**

1. **SMTP Port Configuration** (must be 1025)
2. **Edge Function Response Format** (must include `success` property)
3. **Database Schema** (`user_invitations` table structure)
4. **Supabase Auth Configuration**

### **Safe to Modify:**

1. Email templates (test thoroughly)
2. Frontend UI components
3. Additional invitation fields
4. Logging and monitoring

## 🔒 **Security Considerations**

### **Token Security:**

- Tokens are UUID v4 (cryptographically secure)
- Tokens expire after 72 hours
- Tokens are single-use only

### **Access Control:**

- Only authenticated admins can send invitations
- Role-based permissions enforced
- Input validation on all fields

## 🛠️ **Troubleshooting**

### **No Emails in Mailpit:**

1. Check Supabase is running: `supabase status`
2. Check SMTP port: `grep smtp_port config/auth.toml` (should be 1025)
3. Restart Supabase: `supabase stop && supabase start`
4. Run health check: `node monitor-invitation-system.js`

### **"Failed to send invitation" Error:**

1. Check Edge Functions: `supabase functions list`
2. Test function directly: `node test-email-function-directly.js`
3. Check logs: Check Supabase dashboard for function logs

### **Database Errors:**

1. Check table exists: `supabase db inspect`
2. Check permissions: Verify RLS policies
3. Test connection: `node monitor-invitation-system.js`

## 🔄 **Backup & Recovery**

### **Database Backup:**

```bash
# Export invitations table
supabase db dump --table user_invitations > invitations_backup.sql

# Restore if needed
supabase db reset
# Then re-run migrations
```

### **Configuration Backup:**

```bash
# Backup critical config
cp config/auth.toml config/auth.toml.backup
cp supabase/functions/handle-invitation/index.ts supabase/functions/handle-invitation/index.ts.backup
cp supabase/functions/send-invitation-email/index.ts supabase/functions/send-invitation-email/index.ts.backup
```

## 🚀 **Production Deployment**

### **Environment Variables:**

```bash
# Set production email API key
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FRONTEND_URL=https://yourdomain.com
```

### **Pre-deployment Checklist:**

- [ ] All tests passing locally
- [ ] Edge functions deployed: `supabase functions deploy`
- [ ] Environment variables set
- [ ] DNS records configured for email domain
- [ ] Email templates tested

## 📊 **Performance Monitoring**

### **Key Metrics:**

- Invitation creation time (< 1 second)
- Email delivery time (< 30 seconds)
- Database query performance (< 100ms)
- System uptime (> 99%)

### **Monitoring Commands:**

```bash
# Real-time health monitoring
while true; do
  node monitor-invitation-system.js
  sleep 3600  # Check every hour
done

# Performance testing
time node quick-test-invitation.js test@example.com staff "Performance Test"
```

## 🔧 **Development Guidelines**

### **Before Making Changes:**

1. **Read this documentation completely**
2. **Run full test suite**: `node test-invitation-system-complete.js`
3. **Understand the flow**: React → Edge Functions → Database → Email
4. **Make small, incremental changes**
5. **Test after each change**

### **After Making Changes:**

1. **Run tests immediately**: `node test-invitation-system-complete.js`
2. **Test with real email**: `node quick-test-invitation.js your-email@domain.com admin "Test"`
3. **Check Mailpit**: `http://127.0.0.1:54324`
4. **Monitor for 24 hours**: `node monitor-invitation-system.js`

### **Code Change Approval Checklist:**

- [ ] All existing tests pass
- [ ] New functionality has tests
- [ ] Email delivery still works
- [ ] Performance hasn't degraded
- [ ] Documentation updated

## 🆘 **Emergency Recovery**

### **If System Breaks:**

1. **Stop making changes immediately**
2. **Run diagnostics**: `node test-invitation-system-complete.js`
3. **Check recent changes**: Review git history
4. **Restore from backup** if necessary
5. **Run health check**: `node monitor-invitation-system.js`

### **Emergency Contacts:**

- System Administrator: [Your email]
- Backup Developer: [Backup email]
- Supabase Support: [If needed]

## 📋 **Regular Maintenance Tasks**

### **Weekly:**

- [ ] Run full test suite
- [ ] Check health monitoring logs
- [ ] Review invitation activity
- [ ] Clean up old test data

### **Monthly:**

- [ ] Update dependencies (test thoroughly)
- [ ] Review and clean old invitations
- [ ] Performance analysis
- [ ] Backup critical configurations

### **Quarterly:**

- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Disaster recovery testing

---

## 🎯 **Quick Reference**

### **Essential Commands:**

```bash
# Test everything
node test-invitation-system-complete.js

# Health check
node monitor-invitation-system.js

# Quick test
node quick-test-invitation.js email@domain.com role "Name"

# View emails
open http://127.0.0.1:54324

# Get invitation links
node get-invitation-links.js
```

### **Critical Settings:**

- **SMTP Port**: 1025 (never change)
- **Supabase URL**: http://127.0.0.1:54321
- **Mailpit URL**: http://127.0.0.1:54324

**🚨 Remember: Test before every change, monitor after every deployment!**
