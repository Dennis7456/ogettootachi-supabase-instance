import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  // Handle GET requests (retrieve contact messages)
  if (req.method === 'GET') {
    try {
      // Verify authentication for admin access
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Authorization header required');
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (authError || !user) {
        throw new Error('Invalid token');
      }

      // Check if user is admin/staff
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        throw new Error('Insufficient permissions');
      }

      // Get contact messages with optional filtering
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const priority = url.searchParams.get('priority');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

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
        throw new Error('Failed to retrieve contact messages');
      }

      return new Response(
        JSON.stringify({
          success: true,
          messages,
          count: messages.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Get contact messages error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle POST requests (create contact message)
  if (req.method === 'POST') {
    try {
      const { name, email, phone, subject, message, practice_area } =
        await req.json();

      // Validate required fields
      if (!name || !email || !subject || !message) {
        throw new Error(
          'Missing required fields: name, email, subject, message'
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
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
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to submit contact message');
      }

      // Optional: Send notification email to admin (you can implement this later)
      // await sendNotificationEmail(name, email, subject, message)

      return new Response(
        JSON.stringify({
          success: true,
          message:
            'Your message has been sent successfully. We will get back to you shortly.',
          contact_message: data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Contact submission error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle unsupported methods
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
