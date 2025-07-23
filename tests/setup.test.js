/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

// Vitest or Jest global imports
import { describe, it, expect, beforeAll } from 'vitest';

// Local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const _supabase = createClient(supabaseUrl, supabaseAnonKey);
const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

describe('Supabase Project Setup', () => {
  beforeAll(async () => {
    // Wait for Supabase to be ready
    await new Promise((_resolve) => setTimeout(_resolve, 2000));
  });

  describe('Database Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await _supabase.from('profiles').select('*').limit(1);
      
      console.log('Database Connection Test:', {
        data: data ? data.length : null,
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Unexpected database connection error: ${JSON.stringify(error)}`);
    });

    it('should have vector extension enabled', async () => {
      const { data, error } = await _supabaseService.rpc('vector_test');
      
      console.log('Vector Extension Test:', {
        data: JSON.stringify(data),
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Vector extension not enabled: ${JSON.stringify(error)}`);
    });
  });

  describe('Database Schema', () => {
    it('should have profiles table', async () => {
      const { data, error } = await _supabaseService.rpc('get_table_info', { table_name: 'profiles' });
      
      console.log('Profiles Table Test:', {
        data: JSON.stringify(data),
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Error checking profiles table: ${JSON.stringify(error)}`);
      expect(data).toBeDefined('Profiles table not found');
    });

    it('should have documents table', async () => {
      const { data, error } = await _supabaseService.rpc('get_table_info', { table_name: 'documents' });
      
      console.log('Documents Table Test:', {
        data: JSON.stringify(data),
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Error checking documents table: ${JSON.stringify(error)}`);
      expect(data).toBeDefined('Documents table not found');
    });
  });

  describe('Authentication', () => {
    it('should allow anonymous access', async () => {
      try {
        const { data, error } = await _supabase.from('profiles').select('*').limit(1);
        
        console.log('Anonymous Access Test:', {
          data: data ? data.length : null,
          error: JSON.stringify(error)
        });

        expect(error).toBeNull(`Unexpected error during anonymous access: ${JSON.stringify(error)}`);
        expect(data).toBeDefined('No data returned');
      } catch (err) {
        console.error('Unexpected error in anonymous access test:', err);
        throw err;
      }
    });

    it('should have service role access', async () => {
      try {
        const { data, error } = await _supabaseService.from('profiles').select('*').limit(1);
        
        console.log('Service Role Access Test:', {
          data: data ? data.length : null,
          error: JSON.stringify(error)
        });

        expect(error).toBeNull(`Unexpected error during service role access: ${JSON.stringify(error)}`);
        expect(data).toBeDefined('No data returned');
      } catch (err) {
        console.error('Unexpected error in service role access test:', err);
        throw err;
      }
    });
  });

  describe('Row Level Security', () => {
    it('should enforce RLS on profiles', async () => {
      try {
        const { data, error } = await _supabase.from('profiles').select('*');
        
        console.log('Profiles RLS Test:', {
          data: data ? data.length : null,
          error: JSON.stringify(error)
        });

        expect(error).not.toBeNull('RLS not enforced on profiles');
      } catch (err) {
        console.error('Unexpected error during profiles RLS test:', err);
        throw err;
      }
    });

    it('should enforce RLS on documents', async () => {
      try {
        const { data, error } = await _supabase.from('documents').select('*');
        
        console.log('Documents RLS Test:', {
          data: data ? data.length : null,
          error: JSON.stringify(error)
        });

        expect(error).not.toBeNull('RLS not enforced on documents');
      } catch (err) {
        console.error('Unexpected error during documents RLS test:', err);
        throw err;
      }
    });
  });

  describe('Vector Embeddings', () => {
    it('should support vector operations', async () => {
      const testVector = [0.1, 0.2, 0.3];
      const { data, error } = await _supabaseService.rpc('vector_similarity', { 
        query_vector: testVector,
        similarity_threshold: 0.5
      });
      
      console.log('Vector Similarity Test:', {
        data: JSON.stringify(data),
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Vector similarity test failed: ${JSON.stringify(error)}`);
    });
  });

  describe('Chatbot Conversations', () => {
    it('should allow inserting conversation records', async () => {
      const testConversation = {
        session_id: 'test_session_' + Date.now(),
        user_id: null,
        messages: [{ role: 'user', content: 'Test message' }]
      };

      const { data, error } = await _supabaseService
        .from('chatbot_conversations')
        .insert(testConversation)
        .select();
      
      console.log('Chatbot Conversation Insertion Test:', {
        data: JSON.stringify(data),
        error: JSON.stringify(error)
      });

      expect(error).toBeNull(`Failed to insert chatbot conversation: ${JSON.stringify(error)}`);
      expect(data).toBeDefined('No conversation record returned');
    });
  });

  describe('Profile Creation Trigger', () => {
    it('should automatically create a profile when a new user is created', async () => {
      // Generate a unique test email
      const testEmail = `test_profile_${Date.now()}@example.com`;
      
      console.log('Starting profile creation test');
      console.log('Test email:', testEmail);

      // Sign up a new user
      const {
        data: { user, session },
        error: signUpError
      } = await _supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
        options: {
          data: {
            full_name: 'Profile Test User',
            role: 'user'
          }
        }
      });

      // Log signup details
      console.log('Signup result:', {
        user: !!user,
        session: !!session,
        signUpError: JSON.stringify(signUpError)
      });

      expect(signUpError).toBeNull(`Signup failed: ${JSON.stringify(signUpError)}`);
      expect(user).toBeDefined('User was not created');
      expect(session).toBeDefined('Session was not created');

      // Wait for trigger to run
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch the profile
      const { data: profileData, error: profileError } = await _supabaseService
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Log profile fetch result
      console.log('Profile fetch result:', {
        profileData: JSON.stringify(profileData),
        profileError: JSON.stringify(profileError)
      });

      // Validate profile
      expect(profileError).toBeNull(`Profile fetch failed: ${JSON.stringify(profileError)}`);
      expect(profileData).toBeDefined('Profile not created');
      expect(profileData.email).toBe(testEmail);
      expect(profileData.first_name).toBe('Profile');
      expect(profileData.last_name).toBe('Test User');
      expect(profileData.role).toBe('user');

      // Clean up the created user and profile
      const { error: deleteUserError } = await _supabaseService.auth.admin.deleteUser(user.id);
      expect(deleteUserError).toBeNull(`Error deleting user: ${JSON.stringify(deleteUserError)}`);
      console.log('Cleaned up test user:', user.id);
    });
  });
});
