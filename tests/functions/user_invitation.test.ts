/// <reference path="../types.d.ts" />
/// <reference types="@supabase/supabase-js" />

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import testHelpers from '../test-helpers.js';

// Define types for invitation record
interface InvitationRecord {
  id: string;
  email: string;
  role: string;
  status: string;
  invitation_token: string;
  expires_at: string;
  created_at?: string;
}

describe('User Invitation System', () => {
  let supabase: any;
  let supabaseAdmin: any;
  let testAdmin: any;
  let testUsers: any[] = [];

  beforeAll(async () => {
    // Initialize Supabase clients
    supabase = testHelpers.supabase;
    supabaseAdmin = testHelpers.supabaseAdmin;

    // Create test admin user
    testAdmin = await testHelpers.createTestUser({ role: 'admin' });
    testUsers.push(testAdmin);
  });

  afterAll(async () => {
    // Cleanup test users
    await testHelpers.cleanupTestUsers(testUsers);
  });

  describe('Invitation Flow', () => {
    const testInviteEmail = `test_invite_${Date.now()}@example.com`;
    const testInviteRole = 'staff';
    const testFullName = 'Test Invitee';

    it('should send an invitation successfully', async () => {
      console.log('Starting invitation test with email:', testInviteEmail);

      const { data, error } = await supabase.functions.invoke('handle-invitation', {
        body: { 
          email: testInviteEmail, 
          role: testInviteRole, 
          full_name: testFullName 
        },
        headers: {
          'Authorization': `Bearer ${testAdmin.token}`
        }
      });

      // Log detailed error information
      if (error) {
        console.error('Invitation Send Error:', {
          status: error.status,
          message: error.message,
          context: JSON.stringify(error.context, null, 2)
        });
      }

      // Log response data
      console.log('Invitation Send Response:', {
        data: JSON.stringify(data, null, 2),
        error: JSON.stringify(error, null, 2)
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Invitation sent');
      expect(data.invitation_token).toBeDefined();
    });

    it('should prevent duplicate invitation', async () => {
      console.log('Starting duplicate invitation test with email:', testInviteEmail);

      const { data, error } = await supabase.functions.invoke('handle-invitation', {
        body: { 
          email: testInviteEmail, 
          role: testInviteRole, 
          full_name: testFullName 
        },
        headers: {
          'Authorization': `Bearer ${testAdmin.token}`
        }
      });

      // Log detailed error information
      if (error) {
        console.error('Duplicate Invitation Error:', {
          status: error.status,
          message: error.message,
          context: JSON.stringify(error.context, null, 2)
        });
      }

      // Log response data
      console.log('Duplicate Invitation Response:', {
        data: JSON.stringify(data, null, 2),
        error: JSON.stringify(error, null, 2)
      });

      expect(error).toBeDefined();
      expect(data).toBeNull();
      expect(error.status).toBe(409);
    });

    it('should allow force resend of invitation', async () => {
      console.log('Starting force resend test with email:', testInviteEmail);

      // Attempt to force resend the invitation
      const { data, error } = await supabase.functions.invoke('handle-invitation', {
        body: { 
          email: testInviteEmail, 
          role: testInviteRole, 
          full_name: testFullName,
          force_resend: true
        },
        headers: {
          'Authorization': `Bearer ${testAdmin.token}`
        }
      });

      // Log detailed error information
      if (error) {
        console.error('Force Resend Error:', {
          status: error.status,
          message: error.message,
          context: JSON.stringify(error.context, null, 2),
          fullError: JSON.stringify(error, null, 2)
        });

        // Log additional context about the request
        console.log('Force Resend Request Details:', {
          email: testInviteEmail,
          role: testInviteRole,
          forceResend: true,
          authToken: testAdmin.token ? 'Present' : 'Missing'
        });
      }

      // Log response data
      console.log('Force Resend Response:', {
        data: JSON.stringify(data, null, 2),
        error: JSON.stringify(error, null, 2)
      });

      // Detailed error handling
      if (error) {
        // Log the full error object for debugging
        console.error('Full Error Object:', error);

        // Check for specific error types
        if (error.context && error.context.status) {
          console.error('Error Status:', error.context.status);
          console.error('Error Response:', error.context.response);
        }
      }

      // Assertions with more detailed error messages
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Invitation resent');
    });

    it('should validate invitation record', async () => {
      console.log('Validating invitation record for email:', testInviteEmail);

      // First, check how many records exist
      const { data: allInvitations, error: listError } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('email', testInviteEmail);

      // Log all invitation records
      console.log('All Invitation Records:', {
        count: allInvitations?.length || 0,
        records: JSON.stringify(allInvitations, null, 2),
        listError: JSON.stringify(listError, null, 2)
      });

      // If multiple records exist, log details about each
      if (allInvitations && allInvitations.length > 1) {
        console.warn('Multiple invitation records found:', 
          allInvitations.map((inv: InvitationRecord, index: number) => ({
            index,
            id: inv.id,
            status: inv.status,
            createdAt: inv.created_at,
            expiresAt: inv.expires_at
          }))
        );
      }

      // Attempt to fetch a single record
      const { data: invitations, error } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('email', testInviteEmail)
        .single();

      // Log detailed error information
      if (error) {
        console.error('Invitation Record Error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      // Log invitation details
      console.log('Invitation Record:', {
        invitations: JSON.stringify(invitations, null, 2),
        error: JSON.stringify(error, null, 2)
      });

      // Detailed assertions with more context
      if (error) {
        console.error('Full error details:', JSON.stringify(error, null, 2));
        
        // If no rows returned, check the list of all records
        if (error.code === 'PGRST116') {
          console.warn('No single record found. Checking all records...');
          if (allInvitations && allInvitations.length > 0) {
            console.warn('Records exist but single fetch failed:', 
              allInvitations.map((inv: InvitationRecord) => inv.id)
            );
          }
        }
      }

      expect(error).toBeNull(`Unexpected error fetching invitation: ${JSON.stringify(error)}`);
      expect(invitations).toBeDefined();
      expect(invitations.email).toBe(testInviteEmail);
      expect(invitations.role).toBe(testInviteRole);
      expect(invitations.status).toBe('sent');
      expect(invitations.invitation_token).toBeDefined();
      expect(invitations.expires_at).toBeDefined();
    });

    it('should validate invitation expiration', async () => {
      console.log('Validating invitation expiration for email:', testInviteEmail);

      const { data: invitations, error } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('email', testInviteEmail)
        .single();

      // Log detailed error information
      if (error) {
        console.error('Invitation Expiration Error:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
      }

      // Log invitation details
      console.log('Invitation Expiration Record:', {
        invitations: JSON.stringify(invitations, null, 2),
        error: JSON.stringify(error, null, 2)
      });

      expect(error).toBeNull();
      expect(invitations).toBeDefined();

      const expirationDate = new Date(invitations.expires_at);
      const currentDate = new Date();
      const expirationDuration = expirationDate.getTime() - currentDate.getTime();

      // Check if expiration is around 72 hours (with some buffer)
      expect(expirationDuration).toBeGreaterThan(71 * 60 * 60 * 1000);
      expect(expirationDuration).toBeLessThan(73 * 60 * 60 * 1000);
    });
  });
});
