/* eslint-disable no-console, no-undef, no-unused-vars */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function checkAdminJWT() {
  try {
    // Sign in as admin user
    const { _data: _authData, _error: _authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    
    logError('Auth error', _authError);
    if (_authError) return;

    // Get the JWT token
    const {
      _data: { session },
    } = await _supabase.auth.getSession();

    if (session) {
      // Decode JWT (basic decode without verification)
      const _tokenParts = session.access_token.split('.');
      
      if (_tokenParts.length === 3) {
        const _payload = JSON.parse(
          Buffer.from(_tokenParts[1], 'base64').toString()
        );
        
        console.log('JWT Payload:', _payload);
      }
    }

    // Check if user has admin role in profile
    const { _data: _profile, _error: _profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', _authData.user.id)
      .single();
    
    logError('Profile error', _profileError);

    if (_profile) {
      console.log('Admin Profile:', _profile);
    }
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}

checkAdminJWT();
