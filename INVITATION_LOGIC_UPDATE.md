# Invitation Logic Update - Advanced User Status Handling

## Overview

Updated the `handle-invitation` Edge Function to implement advanced logic that allows invitations only for inactive/pending users, while preventing re-invitations for active users.

## New Logic Flow

### 1. **New Email Addresses**
- ✅ **Allowed**: Can be invited normally
- ✅ **Action**: Creates new user, profile, and invitation
- ✅ **Result**: Sends invitation email

### 2. **Active Users** (Email confirmed + Profile active)
- ❌ **Blocked**: Cannot be re-invited
- ❌ **Error**: "User with this email is already active and cannot be re-invited"
- ❌ **Status**: 400 Bad Request

### 3. **Inactive/Pending Users** (Email not confirmed OR Profile inactive)
- ✅ **Allowed**: Can be re-invited
- ✅ **Action**: Updates existing invitation and resends email
- ✅ **Result**: Sends new invitation email with updated token

## Technical Implementation

### User Status Check
```typescript
// Check if user exists and their status
const existingUser = existingUsers.users.find(u => u.email === email)

if (existingUser) {
  // Check profile status
  const { data: userProfile } = await supabaseClient
    .from('profiles')
    .select('is_active, email_confirmed')
    .eq('id', existingUser.id)
    .single()

  // Determine if user is active
  const isUserActive = existingUser.email_confirmed_at && userProfile?.is_active

  if (isUserActive) {
    // Block re-invitation for active users
    return 400 error
  } else {
    // Allow re-invitation for inactive users
    // Update existing invitation and resend email
  }
}
```

### Re-invitation Process
For inactive users:
1. **Find existing invitation** in `user_invitations` table
2. **Generate new token** for security
3. **Update invitation record** with new token and extended expiry
4. **Increment resend count** to track re-invitations
5. **Send new email** with updated invitation link

## User Experience

### For New Users
- Normal invitation flow
- Creates account and sends invitation email

### For Active Users
- Clear error message: "User with this email is already active and cannot be re-invited"
- Prevents duplicate invitations
- Maintains system integrity

### For Inactive Users
- Seamless re-invitation process
- New invitation email sent
- Updated token for security
- Extended expiry time

## Security Benefits

1. **Prevents Spam**: Active users cannot be re-invited
2. **Secure Tokens**: New tokens generated for re-invitations
3. **Tracking**: Resend count tracks invitation attempts
4. **Expiry Management**: Extended expiry for re-invitations

## Error Handling

### 400 Bad Request
- User is already active
- Invalid request data

### 500 Internal Server Error
- Database connection issues
- Email sending failures
- Profile status check failures

## Database Changes

### user_invitations Table
- `resend_count`: Tracks number of re-invitations
- `updated_at`: Timestamp of last update
- `expires_at`: Extended expiry for re-invitations

### profiles Table
- `is_active`: Determines user activity status
- `email_confirmed`: Email confirmation status

## Testing Scenarios

### Test Case 1: New User
1. Invite new email address
2. ✅ Should create user and send invitation
3. ✅ Should return 200 success

### Test Case 2: Active User
1. Try to invite email of confirmed, active user
2. ❌ Should return 400 error
3. ❌ Should not send email

### Test Case 3: Inactive User
1. Invite email of unconfirmed/inactive user
2. ✅ Should update existing invitation
3. ✅ Should send new email
4. ✅ Should return 200 success

## Files Modified

1. **Updated**: `supabase/functions/handle-invitation/index.ts`
   - Added user status checking logic
   - Implemented re-invitation for inactive users
   - Fixed `btoa` compatibility issue
   - Enhanced error handling

## Deployment

The updated function has been deployed to production:
```bash
supabase functions deploy handle-invitation
```

## Next Steps

1. **Test the new logic** with various user states
2. **Monitor logs** for any issues
3. **Update frontend** to handle new error messages
4. **Add analytics** to track invitation patterns 