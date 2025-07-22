import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

// Configuration
const config = {
  // You'll need to update these with your online Supabase credentials,
  SUPABASE_URL:
    process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  TEST_EMAIL: process.env.TEST_EMAIL || 'test-invitation@example.com',
  TEST_ADMIN_EMAIL:
    process.env.TEST_ADMIN_EMAIL || 'admin@ogettoandotachi.co.ke',
};

// Create Supabase client with service role key
const _supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
);

class InvitationTester {
  constructor() {
    this.testResults = [];
    this.invitationId = null;
    this.invitationToken = null;
    this.adminUserId = null;
  }

  log(test, status, message, data = null) {
    const result = {
      test,
      status, // 'success', 'warning', 'error'
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);
    const icon =
      status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    if (data && status !== 'success') {
      debugLog(`${icon} ${test}: ${message}`, data);
    }
  }

  async testDatabaseConnection() {
    try {
      const { data: _data, error } = await _supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      this.log(
        'Database Connection',
        'success',
        'Connected to Supabase successfully'
      );
      return true;
    } catch (error) {
      this.log(
        'Database Connection',
        'error',
        'Failed to connect to Supabase',
        error.message
      );
      return false;
    }
  }

  async findOrCreateAdminUser() {
    try {
      // First, try to find an existing admin
      const { data: adminProfiles, error: profileError } = await _supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (profileError) {
        throw profileError;
      }

      if (adminProfiles && adminProfiles.length > 0) {
        this.adminUserId = adminProfiles[0].id;
        this.log(
          'Admin User Check',
          'success',
          'Admin user found successfully'
        );
        return true;
      }

      // If no admin found, try to create one for testing
      this.log(
        'Admin User Check',
        'warning',
        'No admin user found. You need to create an admin user first.'
      );
      this.log(
        'Admin User Check',
        'warning',
        'Please create an admin user through your React app or manually.'
      );
      return false;
    } catch (error) {
      this.log(
        'Admin User Check',
        'error',
        'Error checking for admin user',
        error.message
      );
      return false;
    }
  }

  async testCreateInvitation() {
    if (!this.adminUserId) {
      this.log(
        'Create Invitation',
        'error',
        'No admin user available to create invitation'
      );
      return false;
    }

    try {
      // Test the database function directly
      const { data, error } = await _supabase.rpc('create_user_invitation', {
        invite_email: config.TEST_EMAIL,
        user_role: 'staff',
        expires_in_hours: 72,
      });

      if (error) {
        throw error;
      }

      this.invitationId = data.id;
      this.invitationToken = data.invitation_token;

      this.log(
        'Create Invitation',
        'success',
        'Invitation created successfully',
        {
          id: data.id,
          email: data.email,
          role: data.role,
          token: data.invitation_token,
          expires_at: data.expires_at,
          invitation_url: data.invitation_url,
        }
      );
      return true;
    } catch (error) {
      this.log(
        'Create Invitation',
        'error',
        'Failed to create invitation',
        error.message
      );
      return false;
    }
  }

  async testGetPendingInvitations() {
    try {
      const { data, error } = await _supabase.rpc('get_pending_invitations');

      if (error) {
        throw error;
      }

      this.log(
        'Get Pending Invitations',
        'success',
        `Found ${data.length} pending invitations`,
        data
      );
      return true;
    } catch (error) {
      this.log(
        'Get Pending Invitations',
        'error',
        'Failed to get pending invitations',
        error.message
      );
      return false;
    }
  }

  async testEdgeFunctionHandleInvitation() {
    try {
      const testData = {
        email: `edge-test-${Date.now()}@example.com`,
        role: 'staff',
        full_name: 'Edge Test User',
        custom_message: 'This is a test invitation via Edge Function',
      };

      const { data: _data, error } = await _supabase.functions.invoke(
        'handle-invitation',
        {
          body: testData,
        }
      );

      if (error) {
        throw error;
      }

      this.log(
        'Edge Function - Handle Invitation',
        'success',
        'Edge function executed successfully',
        _data
      );
      return true;
    } catch (error) {
      this.log(
        'Edge Function - Handle Invitation',
        'error',
        'Edge function failed',
        error.message
      );
      return false;
    }
  }

  async testEmailFunction() {
    if (!this.invitationToken) {
      this.log(
        'Email Function',
        'warning',
        'No invitation token available for email test'
      );
      return false;
    }

    try {
      const { data: _data, error } = await _supabase.functions.invoke(
        'send-invitation-email',
        {
          body: {
            email: config.TEST_EMAIL,
            role: 'staff',
            invitation_token: this.invitationToken,
            custom_message: 'This is a test invitation email',
          },
        }
      );

      if (error) {
        throw error;
      }

      this.log(
        'Email Function',
        'success',
        'Email function executed successfully',
        _data
      );
      return true;
    } catch (error) {
      this.log(
        'Email Function',
        'warning',
        'Email function failed (expected if not configured)',
        error.message
      );
      return false;
    }
  }

  async testInvitationAcceptance() {
    if (!this.invitationToken) {
      this.log(
        'Invitation Acceptance',
        'warning',
        'No invitation token available for acceptance test'
      );
      return false;
    }

    try {
      const { data: _data, error } = await _supabase.rpc(
        'accept_user_invitation',
        {
          invitation_token: this.invitationToken,
          first_name: 'Test',
          last_name: 'User',
          password: 'TestPassword123!',
        }
      );

      if (error) {
        throw error;
      }

      this.log(
        'Invitation Acceptance',
        'success',
        'Invitation accepted successfully',
        _data
      );
      return true;
    } catch (error) {
      this.log(
        'Invitation Acceptance',
        'error',
        'Failed to accept invitation',
        error.message
      );
      return false;
    }
  }

  async testReactAppIntegration() {
    try {
      // Test if the React app's Supabase client can access the invitation functions
      const { data: _data, error } = await _supabase
        .from('user_invitations')
        .select('*')
        .limit(5);

      if (error) {
        throw error;
      }

      this.log(
        'React App Integration',
        'success',
        'Successfully accessed user_invitations table'
      );
      return true;
    } catch (error) {
      this.log(
        'React App Integration',
        'error',
        'React app integration test failed',
        error.message
      );
      return false;
    }
  }

  async cleanup() {
    // Clean up test data
    if (this.invitationId) {
      try {
        await _supabase
          .from('user_invitations')
          .delete()
          .eq('id', this.invitationId);

        this.log('Cleanup', 'success', 'Test invitation cleaned up');
      } catch (error) {
        this.log(
          'Cleanup',
          'warning',
          'Failed to clean up test invitation',
          error.message
        );
      }
    }

    // Clean up test user if created
    try {
      const { data: testUsers } = await _supabase.auth.admin.listUsers();
      const testUser = testUsers.users.find(
        (u) => u.email === config.TEST_EMAIL
      );

      if (testUser) {
        await _supabase.auth.admin.deleteUser(testUser.id);
        this.log('Cleanup', 'success', 'Test user cleaned up');
      }
    } catch (error) {
      this.log(
        'Cleanup',
        'warning',
        'Failed to clean up test user',
        error.message
      );
    }
  }

  printSummary() {
    const results = {
      success: this.testResults.filter((r) => r.status === 'success').length,
      warning: this.testResults.filter((r) => r.status === 'warning').length,
      error: this.testResults.filter((r) => r.status === 'error').length,
    };

    if (results.error === 0 && results.success > 0) {
      debugLog(
        '\n🎉 All critical tests passed! Your invitation system is working.'
      );
    } else if (results.error > 0) {
      debugLog('\n❌ Some tests failed. Please review the details above.');
    }
  }

  async runAllTests() {
    // Core infrastructure tests
    const connected = await this.testDatabaseConnection();

    if (!connected) {
      return;
    }

    const adminFound = await this.findOrCreateAdminUser();

    if (!adminFound) {
      debugLog(
        '\n⚠️  Cannot proceed with invitation tests without an admin user.'
      );
      debugLog(
        'Please create an admin user first and then run this test again.'
      );
      return;
    }

    // Invitation functionality tests
    await this.testCreateInvitation();
    await this.testGetPendingInvitations();
    await this.testEdgeFunctionHandleInvitation();
    await this.testEmailFunction();
    // Note: Not testing acceptance as it would consume the invitation
    // await this.testInvitationAcceptance()
    await this.testReactAppIntegration();

    // Cleanup and summary
    await this.cleanup();
    this.printSummary();
  }
}

// Check if configuration is provided
if (
  config.SUPABASE_URL.includes('your-project-ref') ||
  config.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')
) {
  debugLog(
    '\nPlease update the configuration at the top of this file with your actual Supabase credentials:'
  );
  debugLog(
    '1. Update your environment variables with real Supabase credentials'
  );
  throw new Error('Invalid Supabase configuration');
}

// Run the tests
const tester = new InvitationTester();
tester.runAllTests().catch((error) => {
  debugLog('❌ Test execution failed:', error);
  process.exit(1);
});
