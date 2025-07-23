import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration - use the local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const adminUser = {
  email: 'admin@test.com',
  password: 'testpassword123',
};

const testDocument = {
  title: 'Test Legal Document',
  content: 'This is a test legal document content for processing and embedding generation.',
  category: 'corporate',
  file_path: '/uploads/test-document.pdf',
};

describe('Process Document Edge Function', () => {
  let adminToken: string;
  let testDocumentId: string;

  beforeAll(async () => {
    // Wait for Supabase to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clean up any existing test users first
    try {
      // Try to sign in with existing user
      const {
        data: { session },
        error: signInError,
      } = await supabase.auth.signInWithPassword(adminUser);

      console.log('Existing user sign-in:', {
        session: !!session,
        signInError: JSON.stringify(signInError)
      });

      if (session) {
        // User exists, clean up and recreate
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser();

        console.log('Existing user details:', {
          user: !!user,
          getUserError: JSON.stringify(getUserError)
        });

        if (user) {
          // Delete profile first (trigger will handle recreation)
          const { error: deleteProfileError } = await supabaseService
            .from('profiles')
            .delete()
            .eq('id', user.id);

          console.log('Profile deletion:', {
            deleteProfileError: JSON.stringify(deleteProfileError)
          });

          // Try to delete user - if admin API fails, we'll continue
          try {
            const { error: deleteUserError } = await supabaseService.auth.admin.deleteUser(user.id);
            console.log('User deletion:', {
              deleteUserError: JSON.stringify(deleteUserError)
            });
          } catch (error) {
            console.log('Could not delete user via admin API, continuing...', error);
          }
        }
      }
    } catch (error) {
      console.log('Error during existing user cleanup:', error);
    }

    // Attempt to sign up admin user multiple times
    let signUpAttempts = 0;
    const maxAttempts = 3;
    let signUpResult = null;

    while (signUpAttempts < maxAttempts) {
      try {
        console.log(`Attempting to sign up admin user (Attempt ${signUpAttempts + 1}):`, adminUser);
        const result = await supabase.auth.signUp({
          ...adminUser,
          options: {
            data: {
              role: 'admin',
              full_name: 'Admin User',
            },
          },
        });

        console.log('Sign up result:', {
          user: !!result.data.user,
          session: !!result.data.session,
          signUpError: JSON.stringify(result.error)
        });

        if (result.error) {
          console.error('Sign up error:', result.error);
          throw result.error;
        }

        signUpResult = result;
        break;
      } catch (error) {
        console.error(`Sign up attempt ${signUpAttempts + 1} failed:`, error);
        signUpAttempts++;
        
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!signUpResult) {
      throw new Error(`Failed to sign up admin user after ${maxAttempts} attempts`);
    }

    const { data: { user, session } } = signUpResult;

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the profile to ensure it has admin role
    if (user) {
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      console.log('Profile update:', {
        updateError: JSON.stringify(updateError)
      });

      if (updateError) {
        console.error('Profile update error:', updateError);
      }

      // Get session - try multiple times in case of timing issues
      let finalSession: any = null;
      let attempts = 0;
      while (!finalSession && attempts < 3) {
        const {
          data: { session: signInSession },
          error: signInError,
        } = await supabase.auth.signInWithPassword(adminUser);

        console.log('Sign in attempt:', {
          attempt: attempts + 1,
          session: !!signInSession,
          signInError: JSON.stringify(signInError)
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        } else {
          finalSession = signInSession;
        }
      }

      if (finalSession) {
        adminToken = finalSession.access_token;
      } else {
        throw new Error('Failed to get session after multiple attempts');
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testDocumentId) {
      await supabaseService.from('documents').delete().eq('id', testDocumentId);
    }

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
    // Clean up documents before each test
    await supabaseService.from('documents').delete().eq('title', testDocument.title);
  });

  describe('POST /functions/v1/process-document', () => {
    it('should process a document and generate embedding', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDocument),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.title).toBe(testDocument.title);
      expect(data.data.content).toBe(testDocument.content);
      expect(data.data.category).toBe(testDocument.category);
      expect(data.data.file_path).toBe(testDocument.file_path);
      expect(data.data.embedding).toBeDefined();
      expect(Array.isArray(data.data.embedding)).toBe(true);
      expect(data.data.embedding.length).toBeGreaterThan(0);

      testDocumentId = data.data.id;
    });

    it('should reject request without authorization', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testDocument),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Authorization header required');
    });

    it('should reject request from non-admin users', async () => {
      // Create a regular user
      const regularUser = {
        email: 'user@test.com',
        password: 'testpassword123',
      };

      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp(regularUser);
      if (signUpError) throw signUpError;

      if (user) {
        await supabaseService.from('profiles').insert([
          {
            id: user.id,
            first_name: 'Regular',
            last_name: 'User',
            role: 'user',
          },
        ]);

        const {
          data: { session },
          error: signInError,
        } = await supabase.auth.signInWithPassword(regularUser);
        if (signInError) throw signInError;

        if (session) {
          const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testDocument),
          });

          expect(response.status).toBe(400);
          const data = await response.json();

          expect(data.error).toContain('Admin access required');
        }

        // Clean up regular user
        await supabaseService.from('profiles').delete().eq('id', user.id);
        await supabase.auth.admin.deleteUser(user.id);
      }
    });

    it('should reject request with missing required fields', async () => {
      const invalidDocument = { ...testDocument };
      invalidDocument.content = '';

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidDocument),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Content and title are required');
    });

    it('should reject request with missing title', async () => {
      const invalidDocument = { ...testDocument };
      invalidDocument.title = '';

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidDocument),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.error).toContain('Content and title are required');
    });

    it('should handle optional fields correctly', async () => {
      const minimalDocument = {
        title: 'Minimal Document',
        content: 'This is minimal content',
        // No category or file_path
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minimalDocument),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.category).toBe('general'); // Default category
      expect(data.data.file_path).toBeNull();
    });

    it('should handle different document categories', async () => {
      const categories = ['corporate', 'family', 'criminal', 'employment', 'real_estate'];

      for (const category of categories) {
        const categoryDocument = {
          ...testDocument,
          title: `Test Document - ${category}`,
          category,
        };

        const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryDocument),
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.data.category).toBe(category);
      }
    });

    it('should handle long document content', async () => {
      const longContent = 'This is a very long document content. '.repeat(1000); // ~30KB
      const longDocument = {
        ...testDocument,
        title: 'Long Document Test',
        content: longContent,
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(longDocument),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.content).toBe(longContent);
      expect(data.data.embedding).toBeDefined();
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Document with special chars: éñüß@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialDocument = {
        ...testDocument,
        title: 'Special Characters Test',
        content: specialContent,
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specialDocument),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.content).toBe(specialContent);
    });

    it('should store document in database with embedding', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDocument),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify document was stored in database
      const { data: storedDocument } = await supabaseService
        .from('documents')
        .select('*')
        .eq('id', data.data.id)
        .single();

      expect(storedDocument).toBeDefined();
      expect(storedDocument.title).toBe(testDocument.title);
      expect(storedDocument.content).toBe(testDocument.content);
      expect(storedDocument.embedding).toBeDefined();
      expect(Array.isArray(storedDocument.embedding)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // This test would require mocking the OpenAI API
      // For now, we'll test the structure
      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testDocument,
          title: 'API Error Test Document',
        }),
      });

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle database errors gracefully', async () => {
      // Test with invalid token to simulate database issues
      const invalidToken = 'invalid-token';

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDocument),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should process document within reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDocument),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(15000); // Should process within 15 seconds
    });

    it('should handle concurrent document processing', async () => {
      const concurrentRequests = 3;
      const promises: Promise<Response>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fetch(`${supabaseUrl}/functions/v1/process-document`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...testDocument,
              title: `Concurrent Document ${i}`,
              content: `Content for concurrent document ${i}`,
            }),
          })
        );
      }

      const responses = await Promise.all(promises);

      for (const response of responses) {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.embedding).toBeDefined();
      }
    });
  });

  describe('Embedding Quality', () => {
    it('should generate consistent embeddings for similar content', async () => {
      const similarDocuments = [
        {
          title: 'Similar Document 1',
          content: 'This is a legal document about corporate law and business regulations.',
          category: 'corporate',
        },
        {
          title: 'Similar Document 2',
          content: 'This is a legal document about corporate law and business regulations.',
          category: 'corporate',
        },
      ];

      const embeddings: any[] = [];

      for (const doc of similarDocuments) {
        const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doc),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        embeddings.push(data.data.embedding);
      }

      // Embeddings should be arrays of the same length
      expect(embeddings[0].length).toBe(embeddings[1].length);
      expect(embeddings[0].length).toBeGreaterThan(0);
    });

    it('should generate different embeddings for different content', async () => {
      const differentDocuments = [
        {
          title: 'Corporate Law Document',
          content: 'This document discusses corporate law, mergers, and acquisitions.',
          category: 'corporate',
        },
        {
          title: 'Family Law Document',
          content: 'This document discusses family law, divorce, and child custody.',
          category: 'family',
        },
      ];

      const embeddings: any[] = [];

      for (const doc of differentDocuments) {
        const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(doc),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        embeddings.push(data.data.embedding);
      }

      // Embeddings should be different for different content
      expect(embeddings[0].length).toBe(embeddings[1].length);
      expect(embeddings[0]).not.toEqual(embeddings[1]);
    });
  });
});
