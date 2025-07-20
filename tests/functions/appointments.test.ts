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

// Test data for API requests
const testAppointment = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  practice_area: 'Family Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Test appointment message',
};

// Test data for direct database operations
const testAppointmentDb = {
  client_name: 'Test User',
  client_email: 'test@example.com',
  client_phone: '+1234567890',
  practice_area: 'Family Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Test appointment message',
};

// Generate a unique email for the admin user for each test run
const randomStr = Math.random().toString(36).substring(2, 10);
const adminUser = {
  email: `admin-${randomStr}@test.com`,
  password: 'testpassword123',
};

describe('Appointments Edge Function', () => {
  let adminToken: string;
  let testAppointmentId: string;

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
    // Clean up test data
    if (testAppointmentId) {
      await supabaseService
        .from('appointments')
        .delete()
        .eq('id', testAppointmentId);
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
    // Clean up appointments before each test
    await supabaseService
      .from('appointments')
      .delete()
      .eq('client_email', testAppointment.email);
  });

  describe('POST /functions/v1/appointments', () => {
    it('should create a new appointment with valid data', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAppointment),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Appointment submitted successfully');
      expect(data.appointment).toBeDefined();
      expect(data.appointment.client_name).toBe(testAppointment.name);
      expect(data.appointment.client_email).toBe(testAppointment.email);
      expect(data.appointment.status).toBe('pending');

      testAppointmentId = data.appointment.id;
    });

    it('should reject appointment with missing required fields', async () => {
      const invalidAppointment = { ...testAppointment };
      invalidAppointment.name = '';

      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAppointment),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should reject appointment with invalid email format', async () => {
      const invalidAppointment = { ...testAppointment, email: 'invalid-email' };

      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAppointment),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should reject appointment with past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidAppointment = {
        ...testAppointment,
        preferred_date: pastDate.toISOString().split('T')[0],
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAppointment),
      });

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Appointment date cannot be in the past');
    });

    it('should handle optional fields correctly', async () => {
      const minimalAppointment = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        practice_area: 'Corporate Law',
        preferred_date: '2025-07-15',
        preferred_time: '02:00 PM',
        // No phone or message
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalAppointment),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.appointment.client_phone).toBeNull();
      expect(data.appointment.message).toBeNull();
    });
  });

  describe('GET /functions/v1/appointments', () => {
    beforeEach(async () => {
      // Create test appointments
      await supabaseService.from('appointments').insert([
        { ...testAppointmentDb, client_name: 'User 1' },
        { ...testAppointmentDb, client_name: 'User 2', status: 'confirmed' },
        { ...testAppointmentDb, client_name: 'User 3', status: 'completed' },
      ]);
    });

    it('should return appointments for authenticated admin user', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.appointments).toBeDefined();
      expect(Array.isArray(data.appointments)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it('should reject request without authorization', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Authorization header required');
    });

    it('should filter appointments by status', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments?status=confirmed`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(
        data.appointments.every((apt: any) => apt.status === 'confirmed')
      ).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments?limit=2&offset=0`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.appointments.length).toBeLessThanOrEqual(2);
    });
  });

  describe('PUT /functions/v1/appointments/{id}', () => {
    let appointmentId: string;

    beforeEach(async () => {
      // Create a test appointment
      const { data } = await supabaseService
        .from('appointments')
        .insert([testAppointmentDb])
        .select()
        .single();
      appointmentId = data.id;
    });

    it('should update appointment status', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments/${appointmentId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'confirmed' }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.appointment.status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments/${appointmentId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'invalid_status' }),
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid status');
    });

    it('should update notes', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments/${appointmentId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'confirmed',
            notes: 'Client confirmed appointment',
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.appointment.notes).toBe('Client confirmed appointment');
    });
  });

  describe('DELETE /functions/v1/appointments/{id}', () => {
    let appointmentId: string;

    beforeEach(async () => {
      // Create a test appointment
      const { data } = await supabaseService
        .from('appointments')
        .insert([testAppointmentDb])
        .select()
        .single();
      appointmentId = data.id;
    });

    it('should delete appointment', async () => {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('Appointment deleted successfully');

      // Verify it's actually deleted
      const { data: deletedAppointment } = await supabaseService
        .from('appointments')
        .select()
        .eq('id', appointmentId)
        .single();

      expect(deletedAppointment).toBeNull();
    });
  });
});
