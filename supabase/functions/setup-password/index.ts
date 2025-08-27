// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

serve(async (req) => {
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return withCorsJson({ success: false, error: 'Missing token or password' }, 400, req)
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Find invitation
    const { data: invitation, error: invError } = await supabaseService
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invError || !invitation) {
      return withCorsJson({ success: false, error: 'Invalid or expired invitation' }, 400, req)
    }

    // List users and find by email
    const { data: usersList } = await supabaseService.auth.admin.listUsers()
    const existing = usersList.users.find(u => u.email === invitation.email)

    let userId = existing?.id

    if (existing) {
      // Update password and confirm email
      const { error: updErr } = await supabaseService.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      })
      if (updErr) {
        return withCorsJson({ success: false, error: updErr.message || 'Failed to update user' }, 500, req)
      }
    } else {
      // Create user
      const { data: createData, error: createErr } = await supabaseService.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: invitation.full_name || invitation.email,
          role: invitation.role || 'staff',
        },
      })
      if (createErr || !createData?.user?.id) {
        return withCorsJson({ success: false, error: createErr?.message || 'Failed to create user' }, 500, req)
      }
      userId = createData.user.id
    }

    if (!userId) {
      return withCorsJson({ success: false, error: 'User id not resolved' }, 500, req)
    }

    // Upsert profile
    const profileData: any = {
      id: userId,
      email: invitation.email,
      full_name: invitation.full_name || invitation.email,
      role: invitation.role || 'staff',
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const { error: profileErr } = await supabaseService
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (profileErr) {
      return withCorsJson({ success: false, error: profileErr.message || 'Failed to upsert profile' }, 500, req)
    }

    // Mark invitation as accepted
    const { error: invUpdErr } = await supabaseService
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString(), status: 'accepted', accepted_by: userId })
      .eq('id', invitation.id)

    if (invUpdErr) {
      return withCorsJson({ success: false, error: invUpdErr.message || 'Failed to update invitation' }, 500, req)
    }

    return withCorsJson({ success: true, user_id: userId }, 200, req)
  } catch (e) {
    console.error('setup-password error', e)
    return withCorsJson({ success: false, error: 'Internal server error' }, 500, req)
  }
})


