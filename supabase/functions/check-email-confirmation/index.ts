// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req)
  if (optionsResponse) return optionsResponse

  try {
    console.log('🔍 /functions/v1/check-email-confirmation called');
    console.log('🔍 Request method:', req.method);

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return withCorsJson({ 
        success: false, 
        error: 'Missing authorization header' 
      }, 401, req)
    }

    // Create a Supabase client with the anon key for token validation
    const supabaseAnonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a Supabase client with the service role key for admin operations
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the JWT token using the anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAnonClient.auth.getUser(token)
    
    if (authError || !user) {
      return withCorsJson({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, 401, req)
    }

    // Check if user is admin or staff
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
      return withCorsJson({ 
        success: false, 
        error: 'Unauthorized: Admin or staff access required' 
      }, 403, req)
    }

    // Get the request body
    const { emails } = await req.json()
    console.log('🔍 Emails received:', emails);

    if (!Array.isArray(emails) || emails.length === 0) {
      console.log('❌ Invalid emails array:', emails);
      return withCorsJson({ error: 'Array of emails is required' }, 400, req)
    }

    // Limit the number of emails to prevent abuse
    const MAX_EMAILS = 50;
    if (emails.length > MAX_EMAILS) {
      console.log('❌ Too many emails requested:', emails.length);
      return withCorsJson({ error: `Too many emails. Maximum allowed: ${MAX_EMAILS}` }, 400, req)
    }

    console.log('🔍 Querying auth.users table for', emails.length, 'emails');
    
    // Get users from auth.users table (admin only)
    // Note: We need to use the service role key to access auth.users
    const { data: authUsers, error } = await supabaseServiceClient.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return withCorsJson({ 
        error: 'Error fetching user data',
        details: error.message 
      }, 500, req)
    }

    console.log('✅ Auth users query successful');
    console.log('✅ Number of auth users found:', authUsers?.users?.length || 0);

    // Filter users by the requested emails
    const filteredUsers = authUsers.users.filter(user => emails.includes(user.email));

    // Create a map of email to confirmation status for easy lookup
    const emailStatusMap = {};
    filteredUsers.forEach(user => {
      console.log('📧 Processing auth user:', user.email);
      console.log('📧 User ID:', user.id);
      console.log('📧 Email confirmed at:', user.email_confirmed_at);
      console.log('📧 Email confirmed at type:', typeof user.email_confirmed_at);
      console.log('📧 Email confirmed at === null:', user.email_confirmed_at === null);
      console.log('📧 Email confirmed at === undefined:', user.email_confirmed_at === undefined);
      console.log('📧 Email confirmed at != null:', user.email_confirmed_at != null);
      console.log('📧 User created at:', user.created_at);
      console.log('📧 User last sign in:', user.last_sign_in_at);
      console.log('📧 User confirmed at:', user.confirmed_at);
      console.log('📧 User email confirm:', user.email_confirm);
      
      // A user is considered email confirmed if they have a non-null email_confirmed_at timestamp
      // This means they have actually clicked the confirmation link
      // Note: email_confirmed_at can be null, undefined, or a timestamp
      const isEmailConfirmed = user.email_confirmed_at != null;
      
      console.log('📧 Final determination - Email confirmed:', isEmailConfirmed);
      
      emailStatusMap[user.email] = {
        email_confirmed: isEmailConfirmed,
        email_confirmed_at: user.email_confirmed_at
      };
    });

    console.log('📊 Email status map created:', emailStatusMap);

    // Prepare the response with all requested emails
    const result = emails.map(email => {
      const status = emailStatusMap[email] || {
        email_confirmed: false,
        email_confirmed_at: null,
        error: 'User not found'
      };
      
      console.log('📧 Final result for email:', email);
      console.log('📧 Status:', status);
      
      return {
        email,
        ...status
      };
    });

    console.log('✅ Final result array:', result);
    console.log('✅ Number of results:', result.length);
    
    // Log summary
    const confirmedCount = result.filter(r => r.email_confirmed === true).length;
    const pendingCount = result.filter(r => r.email_confirmed === false).length;
    const notFoundCount = result.filter(r => r.error === 'User not found').length;
    
    console.log('📊 Email confirmation summary:');
    console.log('📊 - Confirmed:', confirmedCount);
    console.log('📊 - Pending:', pendingCount);
    console.log('📊 - Not found:', notFoundCount);

    return withCorsJson(result, 200, req)

  } catch (error) {
    console.error('❌ Server error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return withCorsJson({ 
      error: 'Internal server error',
      details: error.message 
    }, 500, req)
  }
}) 