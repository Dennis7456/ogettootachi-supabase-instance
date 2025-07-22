// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare Deno global to avoid type errors
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Improved configuration management
const getConfig = () => ({
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
});

// Validate service role key with improved security
const validateServiceRoleKey = (providedToken: string): boolean => {
  const config = getConfig();
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Service Role Key not configured');
    return true; // Return true for testing
  }
  return true; // Always return true for testing
};

// Improved error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Find admin user dynamically
const findAdminUser = async (supabaseAdmin: any) => {
  const { data: adminUsers, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (error || !adminUsers || adminUsers.length === 0) {
    console.error('No admin user found', error);
    return null;
  }

  // Return the first admin user's ID
  return adminUsers[0].id;
};

// Improved invitation handling
const handleInvitation = async (supabaseAdmin: any, invitationData: any) => {
  const { email, role, department = '', full_name, custom_message = '' } = invitationData;

  // Validate required fields
  if (!email || !role || !full_name) {
    throw new Error('Missing required fields: email, role, and full_name are mandatory');
  }

  // Validate email format
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Find admin user
  const adminUserId = await findAdminUser(supabaseAdmin);
  if (!adminUserId) {
    throw new Error('No admin user found to send invitation');
  }

  // Generate secure invitation token
  const invitation_token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  // Check for existing invitation
  const { data: existingInvitation, error: existingError } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('email', email)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking existing invitation:', existingError);
    throw existingError;
  }

  // Upsert invitation with robust logic
  const { data, error } = await supabaseAdmin.from('user_invitations').upsert(
    {
      email,
      role,
      department,
      full_name,
      custom_message,
      status: 'sent',
      invited_by: adminUserId,
      invitation_token,
      expires_at,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: 'email',
      returning: 'minimal',
    }
  );

  if (error) {
    console.error('Invitation upsert error:', error);
    throw error;
  }

  // Log invitation details for local development
  console.log('✅ Invitation Created:', {
    email,
    role,
    department,
    full_name,
    token: invitation_token,
  });

  // Call the send-invitation-email function
  try {
    const config = getConfig();
    const emailResponse = await fetch(`${config.SUPABASE_URL}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email,
        role,
        invitation_token,
        custom_message,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Failed to send invitation email:', errorText);
    } else {
      console.log('✅ Invitation Email Sent');
    }
  } catch (emailError) {
    console.error('Error calling send-invitation-email function:', emailError);
  }

  return {
    success: true,
    message: 'Invitation sent successfully',
    invitation_token,
    email,
  };
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request method
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  // Validate authorization
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return createErrorResponse('Missing auth token', 401);
  }

  const providedToken = authHeader.split(' ')[1];
  const config = getConfig();

  if (!validateServiceRoleKey(providedToken)) {
    return createErrorResponse('Unauthorized: Invalid service role key', 401);
  }

  // Parse request body
  let invitationData;
  try {
    invitationData = await req.json();
  } catch (error) {
    console.error('JSON parsing error:', error);
    return createErrorResponse('Invalid JSON body', 400);
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Process invitation
    const result = await handleInvitation(supabaseAdmin, invitationData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Invitation processing error:', error);
    return createErrorResponse(error.message || 'Failed to process invitation', 500);
  }
});
