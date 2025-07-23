// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'\;
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'\;
import { 
  corsHeaders, 
  createErrorResponse,
  validateRequiredFields,
  validateEmail
} from '../_shared/error-handler';

// Logging function
function log(entry) {
  console.log(JSON.stringify(entry));
}

// POST handler for creating contact message
async function handleCreateContactMessage(req) {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { name, email, phone, subject, message, practice_area } = await req.json();

    // Validate required fields
    try {
      validateRequiredFields(
        { name, email, subject, message }, 
        ['name', 'email', 'subject', 'message']
      );
    } catch (validationError) {
      return createErrorResponse(validationError, {
        method,
        path,
        statusCode: 400,
        metadata: { missingFields: Object.keys(validationError) }
      });
    }

    // Validate email format
    try {
      validateEmail(email);
    } catch (emailError) {
      return createErrorResponse(emailError, {
        method,
        path,
        statusCode: 400,
        metadata: { invalidEmail: email }
      });
    }

    // Insert contact message into database
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          phone: phone || null,
          subject,
          message,
          practice_area: practice_area || null,
          status: 'new',
          priority: 'normal',
          user_id: null, // No user association for unauthenticated submissions
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse(new Error('Failed to submit contact message'), {
        method,
        path,
        statusCode: 500,
        metadata: { databaseError: error }
      });
    }

    const duration = Date.now() - startTime;

    // Log successful contact message submission
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Contact message submitted successfully',
      method,
      path,
      duration,
      statusCode: 200,
      metadata: {
        contactMessageId: data.id,
        userAuthenticated: false,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you shortly.',
        contact_message: data,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Contact submission error:', error);

    return createErrorResponse(error, {
      method,
      path,
      duration,
      statusCode: 500
    });
  }
}

// GET handler for retrieving contact messages
async function handleGetContactMessages(req) {
  const startTime = Date.now();
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // Extract authorization header
  const authHeader = req.headers.get('authorization');
  
  // Require authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createErrorResponse(new Error('Authorization header required'), {
      method,
      path,
      statusCode: 401,
      metadata: { 
        authHeaderExists: !!authHeader,
        authHeaderValid: authHeader ? authHeader.startsWith('Bearer ') : false
      }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Validate token
    const token = authHeader.split(' ')[1];
    const { 
      data: { user }, 
      error: authError 
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(new Error('Invalid or expired token'), {
        method,
        path,
        statusCode: 401,
        metadata: { 
          authError: authError ? JSON.stringify(authError) : null,
          userExists: !!user
        }
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return createErrorResponse(new Error('User profile not found'), {
        method,
        path,
        statusCode: 403,
        metadata: { 
          profileError: profileError ? JSON.stringify(profileError) : null,
          profileExists: !!profile
        }
      });
    }

    // Check user role
    if (!['admin', 'staff'].includes(profile.role)) {
      return createErrorResponse(new Error('Insufficient permissions'), {
        method,
        path,
        statusCode: 403,
        metadata: { 
          userRole: profile.role,
          requiredRoles: ['admin', 'staff']
        }
      });
    }

    // Get contact messages with optional filtering
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return createErrorResponse(new Error('Limit must be between 1 and 100'), {
        method,
        path,
        statusCode: 400,
        metadata: { limit }
      });
    }
    if (offset < 0) {
      return createErrorResponse(new Error('Offset must be non-negative'), {
        method,
        path,
        statusCode: 400,
        metadata: { offset }
      });
    }

    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse(new Error('Failed to retrieve contact messages'), {
        method,
        path,
        statusCode: 500,
        metadata: { databaseError: error }
      });
    }

    const duration = Date.now() - startTime;

    // Log successful request
    log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Contact messages retrieved successfully',
      method,
      path,
      userId: user.id,
      userRole: profile.role,
      duration,
      statusCode: 200,
      metadata: {
        messagesCount: messages.length,
        filters: { status, priority, limit, offset },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        messages,
        count: messages.length,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Get contact messages error:', error);

    return createErrorResponse(error, {
      method,
      path,
      duration,
      statusCode: 500
    });
  }
}

// Main serve function
export default serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Different strategies based on method
  switch (req.method) {
    case 'GET':
      // Require admin/staff authentication for retrieving messages
      return handleGetContactMessages(req);

    case 'POST':
      // Allow unauthenticated contact message submission
      return handleCreateContactMessage(req);

    default:
      // Handle unsupported methods
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Method not allowed', 
          allowedMethods: ['GET', 'POST', 'OPTIONS'] 
        }), 
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
  }
});
