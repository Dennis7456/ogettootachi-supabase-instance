# 📧 Production Email Setup Guide

## 🎯 Overview

For production, your invitation emails will be sent to **real email addresses** using a professional
email service. Here's how to set it up:

## 🚀 **Option 1: Resend (Recommended)**

Resend is modern, reliable, and developer-friendly.

### **Step 1: Sign Up for Resend**

1. Go to: https://resend.com
2. Create account with your law firm email
3. Verify your account

### **Step 2: Add Your Domain**

1. **Add Domain**: `ogettootachi.com` (or your domain)
2. **Add DNS Records**: Resend will provide you with:
   ```
   TXT record: v=spf1 include:_spf.resend.com ~all
   CNAME record: resend._domainkey.ogettootachi.com
   ```
3. **Verify Domain**: Usually takes 15-30 minutes

### **Step 3: Get API Key**

1. Go to **API Keys** section
2. Create new API key
3. **Copy the key** (starts with `re_`)

### **Step 4: Configure Production Environment**

#### **A. Supabase Dashboard Configuration**

```bash
# Go to your Supabase Dashboard
https://supabase.com/dashboard/project/YOUR_PROJECT_ID

# Navigate to: Settings > Edge Functions > Environment Variables
# Add these variables:
```

| Variable Name               | Value                                  |
| --------------------------- | -------------------------------------- |
| `RESEND_API_KEY`            | `re_your_resend_api_key_here`          |
| `FRONTEND_URL`              | `https://yourdomain.com`               |
| `SUPABASE_URL`              | `https://your-project-ref.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key                  |

#### **B. React App Environment**

Update your production `.env.production`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### **Step 5: Deploy Functions**

```bash
# Deploy your Edge Functions to production
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email
```

---

## 🚀 **Option 2: Supabase Built-in Email (Alternative)**

Supabase also has built-in email capabilities:

### **Step 1: Configure SMTP in Supabase**

1. Go to: **Supabase Dashboard > Authentication > Settings**
2. **Enable Custom SMTP**
3. **Configure SMTP Settings**:
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: your_resend_api_key
   Sender Email: noreply@ogettootachi.com
   Sender Name: Ogetto, Otachi & Company Advocates
   ```

### **Step 2: Customize Email Templates**

1. Go to: **Authentication > Email Templates**
2. **Update Templates** with your law firm branding
3. **Test Email Delivery**

---

## 🚀 **Option 3: Gmail/Google Workspace (Simple)**

If you use Google Workspace for your law firm:

### **Step 1: Enable App Passwords**

1. Go to Google Account settings
2. Enable 2FA if not already enabled
3. Generate App Password for "Mail"

### **Step 2: Configure SMTP**

```bash
Host: smtp.gmail.com
Port: 587
Username: your-law-firm-email@ogettootachi.com
Password: your_app_password
```

---

## 🔧 **Testing Production Email**

### **Step 1: Deploy to Staging**

```bash
# Test with staging environment first
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
```

### **Step 2: Send Test Invitation**

1. Use your React app test form
2. Send invitation to your own email
3. Check if email arrives in your inbox

### **Step 3: Verify Email Content**

- ✅ Professional law firm branding
- ✅ Correct "from" address
- ✅ Working invitation links
- ✅ Mobile-responsive design

---

## 📧 **What Production Emails Look Like**

### **From Address**:

`noreply@ogettootachi.com` or `invitations@ogettootachi.com`

### **Subject**:

`You're Invited to Join Ogetto, Otachi & Company Advocates`

### **Content**:

```html
Professional email with: ✅ Law firm logo and branding ✅ Personal invitation message ✅ Role
information (Staff/Admin) ✅ Secure "Accept Invitation" button ✅ Expiry information (72 hours) ✅
Company contact information ✅ Mobile-responsive design
```

### **Email Flow**:

1. **User receives email** in their inbox
2. **Clicks "Accept Invitation"**
3. **Redirected to your website**
4. **Sets up password**
5. **Gets access to dashboard**

---

## 🛡️ **Security & Best Practices**

### **Domain Authentication**

- ✅ **SPF Records**: Prevent spoofing
- ✅ **DKIM Signing**: Verify authenticity
- ✅ **DMARC Policy**: Email security
- ✅ **SSL/TLS**: Encrypted email delivery

### **Professional Setup**

```bash
From: Ogetto, Otachi & Company <noreply@ogettootachi.com>
Reply-To: admin@ogettootachi.com
Subject: [Professional] You're Invited to Join Our Team
```

### **Deliverability**

- ✅ **Verified Domain**: Higher delivery rates
- ✅ **Professional Templates**: Avoid spam filters
- ✅ **Reputation Monitoring**: Track delivery metrics
- ✅ **Bounce Handling**: Manage failed deliveries

---

## 🚀 **Quick Production Setup (5 Minutes)**

### **For Immediate Production Use:**

1. **Sign up for Resend**: https://resend.com
2. **Get API key**: Copy from dashboard
3. **Add to Supabase**:
   ```bash
   # Supabase Dashboard > Settings > Edge Functions
   RESEND_API_KEY=re_your_key_here
   ```
4. **Deploy functions**:
   ```bash
   supabase functions deploy --no-verify-jwt
   ```
5. **Test with real email**: Send invitation to yourself!

---

## 📊 **Monitoring & Analytics**

### **Email Delivery Tracking**

- ✅ **Delivery Rates**: Monitor successful sends
- ✅ **Open Rates**: Track email engagement
- ✅ **Click Rates**: Monitor invitation acceptance
- ✅ **Bounce Rates**: Handle failed deliveries

### **Resend Dashboard Features**

- 📧 **Real-time Delivery**: See emails as they're sent
- 📊 **Analytics**: Delivery and engagement metrics
- 🔍 **Logs**: Detailed delivery information
- ⚠️ **Alerts**: Get notified of issues

---

## 🎯 **Cost Considerations**

### **Resend Pricing** (as of 2024):

- **Free Tier**: 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails
- **Perfect for law firms**: Most firms send <1,000 invitations/month

### **Supabase Email**:

- **Included**: Basic email functionality
- **Custom SMTP**: Use your preferred provider

---

## 🔧 **Troubleshooting Production**

### **"Emails not delivered"**

1. Check spam folder
2. Verify domain DNS records
3. Check Resend dashboard for delivery status
4. Verify email addresses are valid

### **"From address issues"**

1. Ensure domain is verified
2. Use proper from address format
3. Set up SPF/DKIM records

### **"Links not working"**

1. Verify FRONTEND_URL is correct
2. Check HTTPS configuration
3. Test invitation flow end-to-end

---

## ✅ **Production Checklist**

- [ ] Email service configured (Resend/SMTP)
- [ ] Domain verified with DNS records
- [ ] Environment variables set in Supabase
- [ ] Edge Functions deployed to production
- [ ] Email templates customized
- [ ] Test invitation sent and received
- [ ] Links working correctly
- [ ] Mobile email display tested
- [ ] Spam filter testing completed
- [ ] Delivery monitoring set up

**Your law firm's invitation system will be production-ready!** 🚀
