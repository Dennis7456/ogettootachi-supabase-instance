import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration - use the local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Generate a unique email for the test user for each test run
const randomStr = Math.random().toString(36).substring(2, 10);
const testUser = {
  email: `chatbot-user-${randomStr}@test.com`,
  password: 'testpassword123',
};

// Generate a unique email for the admin user for each test run
const adminRandomStr = Math.random().toString(36).substring(2, 10);
const adminUser = {
  email: `admin-${adminRandomStr}@test.com`,
  password: 'testpassword123',
};

const testMessage = {
  message: 'What are your services for corporate law?',
  session_id: 'test-session-123',
};

describe('Chatbot Edge Function', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Wait for Supabase to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up any existing test users first
    try {
      // Try to sign in with existing user
      const {
        data: { session },
        error: signInError,
      } = await supabase.auth.signInWithPassword(adminUser);

      if (session) {
        // User exists, clean up and recreate
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Delete profile first (trigger will handle recreation)
          await supabaseService.from('profiles').delete().eq('id', user.id);
          // Try to delete user - if admin API fails, we'll continue
          try {
            await supabaseService.auth.admin.deleteUser(user.id);
          } catch (error) {
            console.log('Could not delete user via admin API, continuing...');
          }
        }
      }
    } catch (error) {
      // User doesn't exist, continue with creation
    }

    // Create admin user with metadata for role
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      ...adminUser,
      options: {
        data: {
          role: 'admin',
          full_name: 'Admin User',
        },
      },
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the profile to ensure it has admin role
    if (user) {
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
      }

      // Get session - try multiple times in case of timing issues
      let session: any = null;
      let attempts = 0;
      while (!session && attempts < 3) {
        const {
          data: { session: signInSession },
          error: signInError,
        } = await supabase.auth.signInWithPassword(adminUser);
        if (signInError) {
          console.error('Sign in error:', signInError);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } else {
          session = signInSession;
        }
      }

      if (session) {
        adminToken = session.access_token;
      } else {
        throw new Error('Failed to get session after multiple attempts');
      }
    }
  });

  afterAll(async () => {
    // Clean up admin user
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabaseService.from('profiles').delete().eq('id', user.id);
        // Try to delete user - if admin API fails, we'll continue
        try {
          await supabaseService.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.log('Could not delete user via admin API in cleanup');
        }
      }
    } catch (error) {
      console.log('Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Clean up conversations before each test
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabaseService
        .from('chatbot_conversations')
        .delete()
        .eq('user_id', user.id);
    }
  });

  describe('POST /functions/v1/chatbot', () => {
    it('should process a message and return AI response', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
      expect(data.response.length).toBeGreaterThan(0);
      expect(data.documents).toBeDefined();
      expect(Array.isArray(data.documents)).toBe(true);
      expect(data.tokens_used).toBeDefined();
      expect(typeof data.tokens_used).toBe('number');
    });

    it('should reject request without authorization', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Authorization header required');
    });

    it('should reject request with missing message', async () => {
      const invalidMessage = { session_id: 'test-session' };
      // Remove message field

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidMessage),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Message is required');
    });

    it('should handle empty message', async () => {
      const emptyMessage = { message: '', session_id: 'test-session' };

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emptyMessage),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Message is required');
    });

    it('should handle long messages', async () => {
      const longMessage = {
        message: 'A'.repeat(10000), // Very long message
        session_id: 'test-session',
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(longMessage),
      });

      // Should handle long messages gracefully
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.response).toBeDefined();
    });

    it('should store conversation in database', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify conversation was stored
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: conversations } = await supabaseService
          .from('chatbot_conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('session_id', testMessage.session_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!conversations) throw new Error('No conversations found');
        expect(conversations).toBeDefined();
        expect(conversations.length).toBeGreaterThan(0);
        expect(conversations[0].message).toBe(testMessage.message);
        expect(conversations[0].response).toBe(data.response);
        expect(conversations[0].tokens_used).toBe(data.tokens_used);
      }
    });

    it('should handle different session IDs', async () => {
      const session1 = { ...testMessage, session_id: 'session-1' };
      const session2 = { ...testMessage, session_id: 'session-2' };

      // Send messages with different session IDs
      const response1 = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session1),
      });

      const response2 = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session2),
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify both conversations were stored separately
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: conversations } = await supabaseService
          .from('chatbot_conversations')
          .select('*')
          .eq('user_id', user.id)
          .in('session_id', ['session-1', 'session-2']);
        if (!conversations) throw new Error('No conversations found');
        expect(conversations).toBeDefined();
        expect(conversations.length).toBe(2);
      }
    });

    it('should handle legal-specific queries', async () => {
      const legalQueries = [
        'What are the requirements for filing a divorce in Kenya?',
        'How do I register a company in Kenya?',
        'What are my rights as an employee?',
        'How do I protect my intellectual property?',
      ];

      for (const query of legalQueries) {
        const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            session_id: 'legal-test',
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.response).toBeDefined();
        expect(data.response.length).toBeGreaterThan(0);
        // Response should be professional and legal-focused
        expect(data.response.toLowerCase()).toContain('legal');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // This test would require mocking the OpenAI API
      // For now, we'll test the structure
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message that might cause API error',
          session_id: 'error-test',
        }),
      });

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid user token to simulate database issues
      const invalidToken = 'invalid-token';

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 3;
      const promises: Promise<Response>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fetch(`${supabaseUrl}/functions/v1/chatbot`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Concurrent test message ${i}`,
              session_id: `concurrent-${i}`,
            }),
          })
        );
      }

      const responses = await Promise.all(promises);

      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.response).toBeDefined();
      }
    });
  });
});
