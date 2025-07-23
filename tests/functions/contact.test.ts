import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration - use the local Supabase instance
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Reusable headers for direct edge function calls
const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${supabaseAnonKey}`,
};
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const testContactMessage = {
  name: 'Test Contact',
  email: 'contact@example.com',
  phone: '+1234567890',
  subject: 'Test Subject',
  message: 'This is a test contact message',
  practice_area: 'Corporate Law',
};

// Generate a unique email for the admin user for each test run
const randomStr = Math.random().toString(36).substring(2, 10);
const adminUser = {
  email: `admin-contact-${randomStr}@test.com`,
  password: 'testpassword123',
};

describe('Contact Edge Function', () => {
  let adminToken: string;

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
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
    // Clean up contact messages before each test
    await supabaseService.from('contact_messages').delete().eq('email', testContactMessage.email);
  });

  describe('POST /functions/v1/contact', () => {
    it('should create a new contact message with valid data', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(testContactMessage),
      });

      // Log detailed response information
      console.log('Contact Message Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Your message has been sent successfully');
      expect(data.contact_message).toBeDefined();
      expect(data.contact_message.name).toBe(testContactMessage.name);
      expect(data.contact_message.email).toBe(testContactMessage.email);
      expect(data.contact_message.status).toBe('new');
      expect(data.contact_message.priority).toBe('normal');
    });

    it('should reject contact message with missing required fields', async () => {
      const invalidMessage = { ...testContactMessage };
      invalidMessage.name = '';

      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(invalidMessage),
      });

      // Log detailed response information
      console.log('Missing Fields Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject contact message with invalid email format', async () => {
      const invalidMessage = { ...testContactMessage, email: 'invalid-email' };

      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(invalidMessage),
      });

      // Log detailed response information
      console.log('Invalid Email Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should handle optional fields correctly', async () => {
      const minimalMessage = {
        name: 'Minimal Contact',
        email: 'minimal@example.com',
        subject: 'Minimal Subject',
        message: 'Minimal message content',
        // No phone or practice_area
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(minimalMessage),
      });

      // Log detailed response information
      console.log('Optional Fields Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.contact_message.phone).toBeNull();
      expect(data.contact_message.practice_area).toBeNull();
    });
  });

  describe('GET /functions/v1/contact', () => {
    beforeEach(async () => {
      // Create test contact messages
      await supabaseService.from('contact_messages').insert([
        { ...testContactMessage, name: 'Contact 1', status: 'new' },
        {
          ...testContactMessage,
          name: 'Contact 2',
          status: 'read',
          priority: 'high',
        },
        {
          ...testContactMessage,
          name: 'Contact 3',
          status: 'resolved',
          priority: 'urgent',
        },
      ]);
    });

    it('should return contact messages for authenticated admin user', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages).toBeDefined();
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it('should reject request without authorization', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
        method: 'GET',
        headers: authHeaders,
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Authorization header required');
    });

    it('should filter messages by status', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact?status=new`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages.every((msg: any) => msg.status === 'new')).toBe(true);
    });

    it('should filter messages by priority', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact?priority=high`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages.every((msg: any) => msg.priority === 'high')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/contact?limit=2&offset=0`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.messages.length).toBeLessThanOrEqual(2);
    });
  });
});
