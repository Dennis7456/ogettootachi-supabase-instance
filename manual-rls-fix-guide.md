# Manual RLS Fix Guide for Practice Areas

## 🎯 **Problem**
The `practice_areas` table has Row Level Security (RLS) enabled, but there are no policies that allow anonymous users to read the data. This is why the frontend can't see the practice areas.

## 🔧 **Solution: Fix RLS Policies in Supabase Dashboard**

### **Step 1: Access Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: `szbjuskqrfthmjehknly` (LawFirmProject)
3. Navigate to **Authentication** → **Policies**

### **Step 2: Find the practice_areas Table**
1. In the Policies section, look for the `practice_areas` table
2. Click on it to see current policies

### **Step 3: Add RLS Policy**
1. Click **"New Policy"** or **"Add Policy"**
2. Use these settings:

**Policy Name:** `Allow anonymous read of active practice areas`

**Target Roles:** `anon, authenticated`

**Policy Definition:** `SELECT`

**Using Expression:** `is_active = true`

### **Step 4: Alternative - Quick Fix**
If you can't create the policy, you can temporarily disable RLS:

1. Go to **Table Editor** → `practice_areas`
2. Click the **Settings** icon (gear)
3. **Disable Row Level Security** (temporarily)

### **Step 5: Test the Fix**
1. Visit your Firebase site: https://ogetto-otachi-law-firm.web.app
2. Navigate to Practice Areas page
3. Check if practice areas are now visible

## 📋 **SQL Commands (if you have database access)**

If you have direct database access, you can run these SQL commands:

```sql
-- Enable RLS
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow anonymous read of active practice areas" ON practice_areas;

-- Create the policy
CREATE POLICY "Allow anonymous read of active practice areas" 
ON practice_areas 
FOR SELECT 
TO anon, authenticated 
USING (is_active = true);
```

## 🧪 **Verification**

After applying the fix, the frontend should be able to read practice areas. You can verify by:

1. Opening browser developer tools
2. Going to the Practice Areas page
3. Checking the console logs (we added debug logs)
4. You should see: `✅ PracticeAreasPage: Data found, transforming...`

## 🚨 **Important Notes**

- **Don't reset your local database** - this fix only affects the remote database
- The practice areas data is already in the remote database (54 records)
- This is purely a permissions/RLS issue
- Once fixed, your frontend will immediately work

## 📞 **Need Help?**

If you're still having issues after applying the RLS fix:
1. Check the browser console for debug logs
2. Verify the policy was created correctly
3. Test with the anon key using our test script
