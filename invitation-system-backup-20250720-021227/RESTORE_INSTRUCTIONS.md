# Invitation System Restore Instructions

## To restore from this backup:

### 1. Configuration Files:
```bash
cp auth.toml ../config/
cp config.toml ../
```

### 2. Edge Functions:
```bash
cp -r functions/handle-invitation ../supabase/functions/
cp -r functions/send-invitation-email ../supabase/functions/
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email
```

### 3. Test Scripts:
```bash
cp *.js ../
```

### 4. Verify Restore:
```bash
cd ..
node test-invitation-system-complete.js
```

**Created:** Sun Jul 20 02:12:27 CDT 2025
**From:** /Users/denniskiplangat/Documents/law-firm-website/ogettootachi-supabase-instance
