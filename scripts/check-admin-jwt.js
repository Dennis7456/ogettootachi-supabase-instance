import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminJWT() {
  console.log('=== Checking Admin JWT ===\n');

  try {
    // Sign in as admin user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Admin user authenticated');
    console.log('User ID:', authData.user.id);
    console.log('User metadata:', authData.user.user_metadata);
    console.log('App metadata:', authData.user.app_metadata);

    // Get the JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('\n=== JWT Token Info ===');
      console.log('Access token exists:', !!session.access_token);
      console.log('Token length:', session.access_token?.length || 0);
      
      // Decode JWT (basic decode without verification)
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('\nJWT Payload:');
        console.log('Role:', payload.role);
        console.log('User ID:', payload.sub);
        console.log('Email:', payload.email);
        console.log('Full payload:', JSON.stringify(payload, null, 2));
      }
    }

    // Check if user has admin role in profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
    } else {
      console.log('\n=== Profile Info ===');
      console.log('Profile role:', profile.role);
      console.log('Is active:', profile.is_active);
      console.log('Full name:', profile.full_name);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkAdminJWT(); 