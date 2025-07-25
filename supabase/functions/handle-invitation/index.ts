import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  withAuth, 
  AuthResult, 
  authenticateRequest 
} from '../_shared/auth.ts';
import { 
  corsHeaders, 
  createErrorResponse
} from '../_shared/error-handler.ts';

// Configuration helper
const getConfig = () => ({
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
});

// Logging function with enhanced error tracking
function log(entry: {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  path?: string;
  userId?: string;
  userRole?: string;
  clientId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, any>;
}) {
  console.log(JSON.stringify(entry));
}

// Validate invitation payload
function validateInvitationPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload) {
    return { valid: false, error: 'Request payload is required' };
  }
  
  const { email, role } = payload;
  
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'A valid email address is required' };
  }
  
  if (!role || !['admin', 'staff', 'manager', 'user'].includes(role)) {
    return { valid: false, error: 'A valid role (admin, staff, manager, user) is required' };
  }
  
  return { valid: true };
}

// Main invitation handler
async function handleInvitation(req: Request, authResult: AuthResult): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Detailed logging of request context
    console.log('Invitation Request Context:', {
      method,
      path,
      authUser: authResult.user?.id,
      authUserRole: authResult.profile?.role,
      headers: Object.fromEntries(req.headers)
    });

    const config = getConfig();
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Parse and validate invitation payload
    let payload: Record<string, any>;
    try {
      payload = await req.json();
      
      // Validate payload structure
      const validation = validateInvitationPayload(payload);
      if (!validation.valid) {
        return createErrorResponse(new Error(`Validation error: ${validation.error}`), {
          method,
          path,
          statusCode: 400,
          metadata: { error: validation.error }
        });
      }
    } catch (parseError: unknown) {
      console.error('Payload Parsing Error:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        stack: parseError instanceof Error ? parseError.stack : undefined,
        rawBody: await req.text()
      });
      return createErrorResponse(new Error('Invalid request payload'), {
        method,
        path,
        statusCode: 400,
        metadata: { error: 'Failed to parse request body as JSON' }
      });
    }

    const { 
      email, 
      role, 
      department, 
      custom_message, 
      full_name,
      force_resend = false 
    } = payload as {
      email: string;
      role: string;
      department?: string;
      custom_message?: string;
      full_name?: string;
      force_resend?: boolean;
    };

    // Validate required fields
    if (!email || !role) {
      console.error('Validation Error: Email and role are required', { email, role });
      throw new Error('Email and role are required');
    }

    // Log initial invitation details
    console.log('Invitation Request Details:', {
      email,
      role,
      department,
      force_resend,
      invitedBy: authResult.user.id
    });

    // Check for existing invitation with error handling
    let existingInvitation = null;
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is fine
        console.error('Error checking for existing invitation:', error);
        throw error;
      }
      
      existingInvitation = data;
    } catch (error) {
      console.error('Database error checking for existing invitation:', error);
      return createErrorResponse(new Error('Database error: Failed to check for existing invitation'), {
        method,
        path,
        statusCode: 500,
        metadata: { error: 'Database error checking for existing invitation' }
      });
    }

    // Log existing invitation details
    console.log('Existing Invitation Check:', {
      existingInvitation: !!existingInvitation
    });

    // Handle duplicate invitation
    if (existingInvitation && !force_resend) {
      console.warn('Duplicate Invitation Attempt', { 
        email, 
        existingInvitationId: existingInvitation.id 
      });
      return new Response(
        JSON.stringify({
          error: 'Invitation already exists',
          details: 'An invitation for this email has already been sent'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Construct invitation link
    const invitationLink = `${config.FRONTEND_URL}/invitation?token=${invitationToken}`;

    // Prepare invitation record
    const invitationRecord = {
      email,
      role,
      department: department || null,
      full_name: full_name || null,
      invitation_token: invitationToken,
      status: 'sent',
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
      invited_by: authResult.user.id,
      custom_message: custom_message || null
    };

    // Insert or update invitation with transaction
    let data;
    try {
      if (existingInvitation) {
        const { data: updated, error: updateError } = await supabase
          .from('user_invitations')
          .update(invitationRecord)
          .eq('email', email)
          .select()
          .single();
        
        if (updateError) throw updateError;
        data = updated;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('user_invitations')
          .insert(invitationRecord)
          .select()
          .single();
        
        if (insertError) throw insertError;
        data = inserted;
      }
    } catch (error) {
      console.error('Error saving invitation:', error);
      return createErrorResponse(new Error('Failed to save invitation'), {
        method,
        path,
        status: 500,
        details: 'Database error saving invitation'
      });
    }

    // Log database operation result
    console.log('Invitation Database Operation:', {
      success: !error,
      error: error ? JSON.stringify(error) : null,
      invitationId: data?.id
    });

    if (error) {
      console.error('Invitation Creation Error', { 
        error: JSON.stringify(error),
        invitationRecord 
      });
      throw error;
    }

    const duration = Date.now() - startTime;

    // Log invitation event
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: force_resend ? 'Invitation resent' : 'Invitation created',
      method,
      path,
      userId: authResult.user.id,
      userRole: authResult.profile?.role || 'unknown',
      duration,
      statusCode: 200,
      metadata: {
        email,
        role,
        invitationId: data.id,
        forceResend: force_resend,
      },
    });

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: force_resend ? 'Invitation resent' : 'Invitation sent',
        invitation_token: invitationToken,
        invitation: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: unknown) {
    // Log any errors that occurred during the process
    console.error('Error in handleInvitation:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return a standardized error response
    return createErrorResponse(error, {
      method,
      path,
      statusCode: 500,
      userId: authResult.user?.id,
      userRole: authResult.profile?.role,
    });
  }
}

// Main serve function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Method not allowed', 
        allowedMethods: ['POST', 'OPTIONS'] 
      }), 
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Invitation requires admin or staff authentication
  return withAuth(handleInvitation, {
    allowedRoles: ['admin', 'staff'],
    requireAuth: true
  })(req);
});
