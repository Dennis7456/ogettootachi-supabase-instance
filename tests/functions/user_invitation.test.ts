/// <reference path="../types.d.ts" />
/// <reference types="@supabase/supabase-js" />

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
  assert,
} from '../local_assert.ts';
import { createClient } from '@supabase/supabase-js';

// Mock environment setup
const env = Deno.env.toObject();
const SUPABASE_URL = env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY =
  env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5i_FZUmjo6K0nsL4wYloRmk67f1E7c';
const FRONTEND_URL = env.FRONTEND_URL || 'http://localhost:5173';
const SUPABASE_SERVICE_ROLE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9P_TzQz0t4q3YZbvD4yCYNuJiMZ-Y5zWyqFQCSrrs';

// Test data
const TEST_ADMIN_EMAIL = `test_admin_${Date.now()}@example.com`;
const TEST_ADMIN_PASSWORD = `TestPass${Math.random().toString(36).slice(2, 10)}!`;
const TEST_INVITE_EMAIL = `test_invite_${Date.now()}@example.com`;
const TEST_INVITE_ROLE = 'staff';
const TEST_FULL_NAME = 'Test Invitee';

// Cleanup function to remove test user and invitations
async function cleanupTestData(supabaseAdmin: any, supabase: any) {
  try {
    // Stop auto-refresh for both clients
    supabaseAdmin.auth.stopAutoRefresh();
    supabase.auth.stopAutoRefresh();

    // Delete invitation record
    await supabaseAdmin
      .from('user_invitations')
      .delete()
      .eq('email', TEST_INVITE_EMAIL);

    // Fetch user by email to get the correct UUID
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userData) {
      const user = userData.users.find((u) => u.email === TEST_ADMIN_EMAIL);
      if (user) {
        // Delete user by UUID
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Custom type for fetch response
interface CustomFetchResponse extends Response {
  json(): Promise<{
    success?: boolean;
    message?: string;
    error?: string;
  }>;
}

// Deno test suite for invitation functionality
Deno.test('User Invitation Flow', async (t) => {
  // Create Supabase admin client for cleanup
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Create test admin user before running tests
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Disable auto-refresh to prevent timer leaks
  supabase.auth.stopAutoRefresh();
  supabaseAdmin.auth.stopAutoRefresh();

  // Abort controller for managing async operations
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    // Create a new admin user for testing
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
        options: {
          data: {
            role: 'admin',
          },
        },
      }
    );

    if (signUpError) {
      throw new Error(
        `Failed to create test admin user: ${signUpError.message}`
      );
    }

    // Sign in to get token
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      });

    if (loginError) {
      throw new Error(
        `Failed to log in test admin user: ${loginError.message}`
      );
    }

    const adminToken = loginData.session?.access_token || '';

    await t.step('Send initial invitation', async () => {
      // Invoke handle-invitation function with timeout
      let timeoutId: number | undefined;
      const timeoutPromise = new Promise(
        (_, reject) =>
          (timeoutId = setTimeout(
            () => reject(new Error('Invitation request timed out')),
            10000
          ))
      );

      const fetchPromise = fetch(
        'http://localhost:54321/functions/v1/handle-invitation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            email: TEST_INVITE_EMAIL,
            role: TEST_INVITE_ROLE,
            full_name: TEST_FULL_NAME,
          }),
          signal,
        }
      ) as Promise<CustomFetchResponse>;

      try {
        const response = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as CustomFetchResponse;

        // Clear timeout
        if (timeoutId !== undefined) clearTimeout(timeoutId);

        // Check response
        const responseData = await response.json();

        assertEquals(
          response.status,
          200,
          `Invitation failed: ${JSON.stringify(responseData)}`
        );
        assertExists(responseData.success, 'Invitation should be successful');
        assertStringIncludes(
          responseData.message || '',
          'Invitation sent',
          'Incorrect success message'
        );
      } catch (error) {
        // Clear timeout if an error occurs
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        throw error;
      }
    });

    await t.step('Prevent duplicate invitation', async () => {
      const response = (await fetch(
        'http://localhost:54321/functions/v1/handle-invitation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            email: TEST_INVITE_EMAIL,
            role: TEST_INVITE_ROLE,
            full_name: TEST_FULL_NAME,
          }),
          signal,
        }
      )) as CustomFetchResponse;

      // Check response
      const responseData = await response.json();

      assertEquals(
        response.status,
        409,
        'Should return conflict status for duplicate invitation'
      );
      assertStringIncludes(
        responseData.error || '',
        'already exists',
        'Incorrect error message for duplicate invitation'
      );
    });

    await t.step('Force resend invitation', async () => {
      const response = (await fetch(
        'http://localhost:54321/functions/v1/handle-invitation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            email: TEST_INVITE_EMAIL,
            role: TEST_INVITE_ROLE,
            full_name: TEST_FULL_NAME,
            force_resend: true,
          }),
          signal,
        }
      )) as CustomFetchResponse;

      // Check response
      const responseData = await response.json();

      assertEquals(
        response.status,
        200,
        `Force resend failed: ${JSON.stringify(responseData)}`
      );
      assertExists(responseData.success, 'Force resend should be successful');
      assertStringIncludes(
        responseData.message || '',
        'Invitation resent',
        'Incorrect success message for resend'
      );
    });

    await t.step('Validate invitation record', async () => {
      // Fetch the invitation record
      const { data: invitations, error } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('email', TEST_INVITE_EMAIL)
        .single();

      assertEquals(error, null, 'Error fetching invitation record');
      assertExists(invitations, 'Invitation record should exist');
      assertEquals(
        invitations.email,
        TEST_INVITE_EMAIL,
        'Incorrect email in invitation record'
      );
      assertEquals(
        invitations.role,
        TEST_INVITE_ROLE,
        'Incorrect role in invitation record'
      );
      assertEquals(
        invitations.status,
        'sent',
        "Invitation status should be 'sent'"
      );
      assertExists(
        invitations.invitation_token,
        'Invitation token should be generated'
      );
      assertExists(invitations.expires_at, 'Expiration date should be set');
    });

    await t.step('Validate email invitation parameters', async () => {
      // Fetch the invitation record
      const { data: invitations, error } = await supabaseAdmin
        .from('user_invitations')
        .select('*')
        .eq('email', TEST_INVITE_EMAIL)
        .single();

      // Validate invitation parameters
      const expirationDate = new Date(invitations.expires_at);
      const currentDate = new Date();
      const expirationDuration =
        expirationDate.getTime() - currentDate.getTime();

      // Check if expiration is around 72 hours (with some buffer)
      assert(
        expirationDuration > 71 * 60 * 60 * 1000 &&
          expirationDuration < 73 * 60 * 60 * 1000,
        'Invitation should expire in approximately 72 hours'
      );
    });
  } catch (error) {
    console.error('Test error:', error);
    throw error;
  } finally {
    // Always attempt to clean up test data
    await cleanupTestData(supabaseAdmin, supabase);

    // Abort any pending requests
    abortController.abort();
  }
});
