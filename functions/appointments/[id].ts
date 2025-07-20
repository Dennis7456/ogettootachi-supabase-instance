// @ts-nocheck
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

  try {
    // Extract appointment ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const appointmentId = pathParts[pathParts.length - 1];

    if (!appointmentId) {
      throw new Error('Appointment ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

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

    // Handle PUT requests (update appointment)
    if (req.method === 'PUT') {
      const { status, notes } = await req.json();

      if (!status) {
        throw new Error('Status is required');
      }

      // Validate status
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(
          'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
        );
      }

      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to update appointment');
      }

      if (!data) {
        throw new Error('Appointment not found');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment status updated successfully',
          appointment: data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET requests (get single appointment)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to retrieve appointment');
      }

      if (!data) {
        throw new Error('Appointment not found');
      }

      return new Response(
        JSON.stringify({
          success: true,
          appointment: data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle DELETE requests (delete appointment)
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to delete appointment');
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment deleted successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Appointment operation error:', error);
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
});
