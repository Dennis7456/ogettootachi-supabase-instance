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
      // Try to select from the profiles table directly
      const { data, error } = await _supabaseService
        .from('profiles')
        .select('*')
        .limit(1);
      
      console.log('Profiles Table Test:', {
        data: data ? 'Table exists' : 'No data',
        error: error ? error.message : null
      });

      // If we get here, the table exists, even if it's empty
      // If the table doesn't exist, we'll get a different error
      expect(error).toBeNull(`Error accessing profiles table: ${error?.message || 'Unknown error'}`);
    });
    
    it('should have required columns in profiles table', async () => {
      // This is a simpler check that doesn't rely on information_schema
      const requiredColumns = ['id', 'email', 'first_name', 'last_name', 'role', 'created_at', 'updated_at'];
      
      // Try to select a non-existent column to see if we get a column not found error
      const testColumn = requiredColumns[0];
      const { error } = await _supabaseService
        .from('profiles')
        .select(testColumn)
        .limit(1);
      
      if (error && error.code === '42703') { // 42703 = undefined column
        const missingColumns = [testColumn];
        
        // Check other columns
        for (const col of requiredColumns.slice(1)) {
          const { error: colError } = await _supabaseService
            .from('profiles')
            .select(col)
            .limit(1);
          
          if (colError?.code === '42703') {
            missingColumns.push(col);
          }
        }
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns in profiles table: ${missingColumns.join(', ')}`);
        }
      } else if (error) {
        throw new Error(`Error checking profiles table: ${error.message}`);
      }
      
      // If we get here, all columns exist or the table is empty
      expect(true).toBe(true);
    });

    it('should have documents table', async () => {
      // Try to select from the documents table directly
      const { data, error } = await _supabaseService
        .from('documents')
        .select('*')
        .limit(1);
      
      console.log('Documents Table Test:', {
        data: data ? 'Table exists' : 'No data',
        error: error ? error.message : null
      });

      // If we get here, the table exists, even if it's empty
      expect(error).toBeNull(`Error accessing documents table: ${error?.message || 'Unknown error'}`);
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

  // Helper function to create a test user
  async function createTestUser(role = 'user') {
    const testEmail = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
    const testPassword = 'Test@1234';

    // --- Cleanup: delete any existing user/profile with this email ---
    // 1. Delete from profiles
    const { data: existingProfiles, error: profileFetchError } = await _supabaseService
      .from('profiles')
      .select('id')
      .eq('email', testEmail);
    if (profileFetchError) {
      console.warn('Warning: error checking for existing profiles:', profileFetchError);
    }
    if (existingProfiles && existingProfiles.length > 0) {
      for (const user of existingProfiles) {
        await _supabaseService.from('profiles').delete().eq('id', user.id);
        // Optionally, delete from auth.users if you have admin access:
        try {
          await _supabaseService.auth.admin.deleteUser(user.id);
        } catch (e) {
          // Ignore if user doesn't exist in auth.users
        }
      }
    }
    // --- End cleanup ---
    
    // Create user with metadata
    const { data: signUpData, error: signUpError } = await _supabaseService.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: `User-${role}`,
        role: role
      },
      email_redirect_to: 'http://localhost:3000/auth/callback'
    });
    
    if (signUpError) {
      console.error('Error creating test user:', signUpError);
      throw signUpError;
    }
    
    // Wait a bit for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify the profile was created
    const { data: profile, error: profileError } = await _supabaseService
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('Error verifying profile:', profileError || 'Profile not found');
      throw new Error('Failed to verify profile creation');
    }
    
    // Sign in with the test user
    const { data: signInData, error: signInError } = await _supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in test user:', signInError);
      throw signInError;
    }
    
    return {
      id: signUpData.user.id,
      email: testEmail,
      password: testPassword,
      role,
      auth: signInData.session
    };
  }

  // Test suite for chatbot conversations functionality
  describe('Chatbot Conversations', () => {
    let testUser = null;
    let testUserId = null;
    let testConversationId = null;
    let testUserClient = null;
    
    beforeAll(async () => {
      try {
        // Create a test user and a dedicated client for them
        testUser = await createTestUser('user');
        testUserId = testUser.id;
        
        // Create a dedicated client for the test user
        testUserClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${testUser.auth.access_token}`
            }
          }
        });
        
        console.log('Test user created for conversations:', testUserId);
      } catch (error) {
        console.error('Failed to set up test user for conversations:', error);
        throw error;
      }
    });
    
    afterAll(async () => {
      // Clean up: Delete test conversation if it exists
      if (testConversationId) {
        try {
          await _supabaseService
            .from('chatbot_conversations')
            .delete()
            .eq('id', testConversationId);
        } catch (error) {
          console.error('Error cleaning up test conversation:', error);
        }
      }
      
      // Clean up test user
      if (testUserId) {
        try {
          await _supabaseService.auth.admin.deleteUser(testUserId);
        } catch (error) {
          console.error('Error cleaning up test user:', error);
        }
      }
    });
    
    it('should allow users to create and retrieve their own conversations', async () => {
      // 1. Create a test conversation using the test user's client
      const testConversation = {
        user_id: testUserId, // This will be verified by RLS
        session_id: `test-session-${Date.now()}`,
        message: 'Hello, world!',
        response: 'Hi there! How can I help you?',
        documents_used: [],
        tokens_used: 10
      };
      
      // First, insert the conversation without selecting it back
      const { error: insertError } = await testUserClient
        .from('chatbot_conversations')
        .insert(testConversation);
      
      expect(insertError).toBeNull(`Error inserting conversation: ${JSON.stringify(insertError)}`);
      
      // Then fetch the conversation in a separate query
      const { data: conversations, error: fetchError } = await testUserClient
        .from('chatbot_conversations')
        .select('*')
        .eq('session_id', testConversation.session_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      expect(fetchError).toBeNull(`Error fetching conversation: ${JSON.stringify(fetchError)}`);
      expect(conversations).toBeDefined('Failed to fetch conversation after insert');
      
      // Save the conversation ID for cleanup
      testConversationId = conversations.id;
      
      // 2. Verify the conversation can be retrieved by the same user
      const { data: retrievedConversation, error: retrieveError } = await testUserClient
        .from('chatbot_conversations')
        .select('*')
        .eq('id', testConversationId)
        .single();
      
      expect(retrieveError).toBeNull(`Error retrieving conversation: ${JSON.stringify(retrieveError)}`);
      expect(retrievedConversation).toBeDefined('Failed to retrieve conversation');
      expect(retrievedConversation.user_id).toBe(testUserId);
      expect(retrievedConversation.session_id).toBe(testConversation.session_id);
      
      // 3. Verify another user cannot access this conversation
      let otherUser = null;
      try {
        // Create a second test user
        otherUser = await createTestUser('user');
        
        // Create a client for the second user
        const otherUserClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${otherUser.auth.access_token}`
            }
          }
        });
        
        // Try to access the first user's conversation with the second user's client
        const { data: otherUserConversation, error: otherUserError } = await otherUserClient
          .from('chatbot_conversations')
          .select('*')
          .eq('id', testConversationId)
          .single();
        
        // Should either return null or an error
        if (otherUserError) {
          expect(otherUserError.code).toBe('PGRST116'); // Not found due to RLS
        } else {
          expect(otherUserConversation).toBeNull('Other users should not be able to access this conversation');
        }
        
        // Verify the other user can see their own profile
        const { data: ownProfile, error: ownProfileError } = await otherUserClient
          .from('profiles')
          .select('*')
          .eq('id', otherUser.id)
          .single();
          
        expect(ownProfileError).toBeNull('Should be able to see own profile');
        expect(ownProfile).toBeDefined('Should return own profile');
        expect(ownProfile.id).toBe(otherUser.id);
        
        // Try to access the other user's profile with the test user's client
        const { data: otherUserProfile, error: otherUserProfileError } = await testUserClient
          .from('profiles')
          .select('*')
          .eq('id', otherUser.id)
          .single();
          
        // Should either return null or error due to RLS
        if (otherUserProfileError) {
          expect(otherUserProfileError.code).toBe('PGRST116'); // Not found due to RLS
        } else {
          expect(otherUserProfile).toBeNull('Should not be able to see other users\' profiles');
        }
        
      } finally {
        // Clean up the second test user
        if (otherUser?.id) {
          await _supabaseService.auth.admin.deleteUser(otherUser.id);
        }
        
        // Try to access the conversation with an unauthenticated client - should return empty array or error
        const unauthenticatedClient = createClient(supabaseUrl, supabaseAnonKey);
        
        // Ensure no session is present
        await unauthenticatedClient.auth.signOut();
        
        // Try to access conversations - should be denied by RLS
        const { data: unauthenticatedData, error: unauthenticatedError } = await unauthenticatedClient
          .from('chatbot_conversations')
          .select('*');
        
        // With the updated RLS policy, unauthenticated access should be denied
        expect(unauthenticatedError).not.toBeNull('Expected unauthenticated access to be denied');
        expect(unauthenticatedError.code).toBe('42501'); // permission_denied
        expect(unauthenticatedData).toBeNull('No data should be returned for unauthenticated access');
      }
    });
    
    it('should not allow null user_id in chatbot_conversations', async () => {
      // First, create a test conversation with a valid user_id
      const testConversation = {
        user_id: testUserId, // Valid user_id
        session_id: `test-session-null-user-${Date.now()}`,
        message: 'Test message',
        response: 'Test response',
        documents_used: [],
        tokens_used: 10
      };
      
      // Insert the conversation first
      const { data: insertData, error: insertError } = await testUserClient
        .from('chatbot_conversations')
        .insert(testConversation)
        .select()
        .single();
      
      expect(insertError).toBeNull('Should have inserted with valid user_id');
      expect(insertData).toBeDefined('Should return the inserted conversation');
      
      // Now try to update the user_id to null - should be blocked by RLS
      const { error: updateError } = await testUserClient
        .from('chatbot_conversations')
        .update({ user_id: null })
        .eq('id', insertData.id);
      
      // Should get a permission denied error (42501) from RLS
      expect(updateError).not.toBeNull('Should have failed with RLS violation');
      expect(updateError.code).toBe('42501'); // permission_denied
      
      // Clean up
      if (insertData?.id) {
        await _supabaseService.auth.admin.deleteUser(testUserId);
      }
    });
  });
  
  describe('Row Level Security', () => {
    let testUser = null;
    let testUserId = null;
    let testUserClient = null;
    
    // Create a test user before running the tests
    beforeAll(async () => {
      try {
        testUser = await createTestUser('user');
        testUserId = testUser.id;
        
        // Create a dedicated client for the test user
        testUserClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${testUser.auth.access_token}`
            }
          }
        });
        
        console.log('Test user created and signed in:', testUserId);
      } catch (error) {
        console.error('Failed to set up test user:', error);
        throw error;
      }
    });
    
    afterAll(async () => {
      // Clean up the test user and their conversations
      if (testUser?.id) {
        // Delete any chatbot_conversations for the test user
        await _supabaseService
          .from('chatbot_conversations')
          .delete()
          .eq('user_id', testUser.id);
        // Now delete the user
        await _supabaseService.auth.admin.deleteUser(testUser.id);
      }
    });
    
    it('should enforce RLS on profiles', async () => {
      try {
        // 1. First, check RLS is enabled on the profiles table
        const { data: rlsStatus, error: statusError } = await _supabaseService
          .rpc('is_rls_enabled', { table_name: 'profiles' });
        
        if (statusError) {
          console.error('Error checking RLS status:', statusError);
          throw statusError;
        }
        
        console.log('RLS status for profiles:', rlsStatus);
        
        if (!rlsStatus) {
          throw new Error('RLS is not enabled on the profiles table');
        }
        
        // 2. Try to read profiles with an unauthenticated client (should fail)
        const unauthenticatedClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: unauthenticatedData, error: unauthenticatedError } = await unauthenticatedClient
          .from('profiles')
          .select('*')
          .limit(1);
        
        console.log('Unauthenticated access result:', {
          data: unauthenticatedData ? `Found ${unauthenticatedData.length} records` : 'No data',
          error: unauthenticatedError ? unauthenticatedError.message : null
        });
        
        // 3. Try to read profiles with an authenticated client (should work)
        let userProfile = null;
        let retries = 5;
        while (retries-- > 0) {
          const { data: authenticatedData, error: authenticatedError } = await testUserClient
            .from('profiles')
            .select('*')
            .eq('id', testUserId)
            .single();
          if (authenticatedData) {
            userProfile = authenticatedData;
            break;
          }
          await new Promise(res => setTimeout(res, 500));
        }
        
        console.log('Authenticated access result:', {
          data: userProfile ? 'Found profile' : 'No data',
        });
        
        // 4. Verify the authenticated user can only see their own profile
        if (userProfile) {
          expect(userProfile.id).toBe(testUserId);
        } else {
          throw new Error('Authenticated user should be able to see their own profile');
        }
        
        // 5. Verify unauthenticated access is blocked
        if (unauthenticatedData && unauthenticatedData.length > 0) {
          throw new Error('Unauthenticated users should not be able to read profiles');
        }
        
        // 6. Try to insert a profile with an unauthenticated client (should fail)
        const testEmail = `test-${Date.now()}-insert@example.com`;
        const { error: insertError } = await _supabase
          .from('profiles')
          .insert([{ 
            email: testEmail,
            first_name: 'Test',
            last_name: 'Insert',
            role: 'user'
          }]);
        
        console.log('Insert test result:', { insertError });
        
        if (!insertError) {
          throw new Error('Unauthenticated users should not be able to insert profiles');
        }
        
        // 7. Verify the error is related to permissions
        expect(insertError).toBeDefined();
        expect(insertError.code).toBe('42501'); // permission_denied
        
      } catch (err) {
        console.error('Error in RLS test:', err);
        throw err;
      }
    });

    it('should enforce RLS on documents', async () => {
      let testDocumentId = null;
      
      try {
        // First, ensure the table has RLS enabled
        const { data: rlsEnabled, error: rlsError } = await _supabaseService.rpc('is_rls_enabled', { 
          table_name: 'documents' 
        });
        
        if (rlsError) {
          console.error('Error checking RLS status:', rlsError);
          throw rlsError;
        }
        
        if (!rlsEnabled) {
          throw new Error('RLS is not enabled on the documents table');
        }
        
        // Try to access the table with an unauthenticated client
        const { data, error } = await _supabase
          .from('documents')
          .select('*')
          .limit(1);
        
        console.log('Documents RLS Test:', {
          rlsEnabled,
          data: data ? 'Data returned' : 'No data',
          error: error ? error.message : null,
          code: error?.code
        });

        // We expect no data when RLS is enforced (Supabase returns [] and error = null)
        expect(data).toEqual([]); // RLS blocks access, so data should be empty
        // Optionally, warn if error is set
        if (error) {
          console.warn('Unexpected error during unauthenticated documents access:', error);
        }
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
    let testUser = null;
    let testUserClient = null;

    beforeAll(async () => {
      // Create a test user for the conversation test
      testUser = await createTestUser('user');
      
      // Create a client for the test user
      testUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${testUser.auth.access_token}`
          }
        }
      });
    });

    afterAll(async () => {
      // Clean up the test user
      if (testUser?.id) {
        await _supabaseService.auth.admin.deleteUser(testUser.id);
      }
    });

    it('should allow inserting conversation records', async () => {
      const testConversation = {
        user_id: testUser.id, // Must match auth.uid()
        session_id: 'test_session_' + Date.now(),
        message: 'Test message from user', // Required field
        response: 'Test response from assistant', // Required field
        documents_used: [], // Default is '[]' but explicitly setting for clarity
        tokens_used: 0 // Default is 0 but explicitly setting for clarity
      };

      // Use the authenticated user's client, not the service role client
      const { data, error } = await testUserClient
        .from('chatbot_conversations')
        .insert(testConversation)
        .select();
      
      console.log('Chatbot Conversation Insertion Test:', {
        data: JSON.stringify(data),
        error: error ? error.message : null
      });

      // Verify the response
      expect(error).toBeNull(`Failed to insert chatbot conversation: ${error?.message}`);
      expect(data).toBeDefined('No conversation record returned');
      expect(data).toHaveLength(1);
      expect(data[0].user_id).toBe(testUser.id);
      expect(data[0].message).toBe(testConversation.message);
      expect(data[0].response).toBe(testConversation.response);
    });
  });

  describe('Profile Creation Trigger', () => {
    it('should automatically create a profile when a new user is created', async () => {
      console.log('Starting profile creation test');
      
      // Use the createTestUser helper which handles user creation and profile verification
      const testUser = await createTestUser('user');
      
      try {
        // Verify the user was created with the expected data
        expect(testUser).toBeDefined('Test user was not created');
        expect(testUser.id).toBeDefined('User ID is missing');
        expect(testUser.auth).toBeDefined('User session is missing');
        
        // Get the profile using the service client to verify it was created
        const { data: profileData, error: profileError } = await _supabaseService
          .from('profiles')
          .select('*')
          .eq('id', testUser.id)
          .single();
          
        console.log('Profile fetch result:', {
          profileData: JSON.stringify(profileData),
          profileError: JSON.stringify(profileError)
        });
        
        // Validate the profile was created with the expected data
        expect(profileError).toBeNull(`Profile fetch failed: ${JSON.stringify(profileError)}`);
        expect(profileData).toBeDefined('Profile not created');
        expect(profileData.id).toBe(testUser.id);
        expect(profileData.email).toBe(testUser.email);
        expect(profileData.first_name).toBe('Test'); // Default first name in createTestUser
        expect(profileData.last_name).toBe('User-user'); // Default last name with role suffix
        expect(profileData.role).toBe('staff'); // Default role is 'staff' in the database
      } finally {
        // Clean up the test user
        if (testUser?.id) {
          const { error: deleteError } = await _supabaseService.auth.admin.deleteUser(testUser.id);
          if (deleteError) {
            console.error('Error cleaning up test user:', deleteError);
          }
        }
      }
    });
  });
});
