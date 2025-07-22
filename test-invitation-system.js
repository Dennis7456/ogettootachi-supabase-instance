// Test User Invitation System with Online Supabase
// This script tests the complete invitation flow
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Configuration
const config = {
  // You'll need to update these with your online Supabase credentials,
  SUPABASE_URL:
    process.env.SUPABASE_URL || 'https://your-project-ref._supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key',
  TEST_EMAIL: process.env.TEST_EMAIL || 'test-invitation@example.com',
  TEST_ADMIN_EMAIL:
    process.env.TEST_ADMIN_EMAIL || 'admin@ogettoandotachi.co.ke',
};
// Create Supabase client with service role key
const _supabase = _createClient(
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
  log(test, status, message, _data = null) {
    const result = {
      test,
      status, // 'success', 'warning', '_error'
      message,
      _data,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);
    const icon =
      status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    if (_data && status !== 'success') {
    }
  }
  async testDatabaseConnection() {
    try {
      const { _data, _error } = await _supabase
        .from('profiles')
        .select('count')
        .limit(1);
      if (_error) {
        throw _error;
      }
      this.log(
        'Database Connection',
        'success',
        'Connected to Supabase successfully'
      );
      return true;
    } catch (_error) {
      this.log(
        'Database Connection',
        '_error',
        'Failed to connect to Supabase',
        _error.message
      );
      return false;
    }
  }
  async findOrCreateAdminUser() {
    try {
      // First, try to find an existing admin
      const { _data: adminProfiles, _error: profileError } = await _supabase
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
    } catch (_error) {
      this.log(
        'Admin User Check',
        '_error',
        'Error checking for admin user',
        _error.message
      );
      return false;
    }
  }
  async testCreateInvitation() {
    if (!this.adminUserId) {
      this.log(
        'Create Invitation',
        '_error',
        'No admin user available to create invitation'
      );
      return false;
    }
    try {
      // Test the database function directly
      const { _data, _error } = await _supabase.rpc('create_user_invitation', {
        invite_email: config.TEST_EMAIL,
        user_role: 'staff',
        expires_in_hours: 72,
      });
      if (_error) {
        throw _error;
      }
      this.invitationId = _data.id;
      this.invitationToken = _data.invitation_token;
      this.log(
        'Create Invitation',
        'success',
        'Invitation created successfully',
        {
          id: _data.id,
          email: _data.email,
          role: _data.role,
          token: _data.invitation_token,
          expires_at: _data.expires_at,
          invitation_url: _data.invitation_url,
        }
      );
      return true;
    } catch (_error) {
      this.log(
        'Create Invitation',
        '_error',
        'Failed to create invitation',
        _error.message
      );
      return false;
    }
  }
  async testGetPendingInvitations() {
    try {
      const { _data, _error } = await _supabase.rpc('get_pending_invitations');
      if (_error) {
        throw _error;
      }
      this.log(
        'Get Pending Invitations',
        'success',
        `Found ${_data.length} pending invitations`,
        _data
      );
      return true;
    } catch (_error) {
      this.log(
        'Get Pending Invitations',
        '_error',
        'Failed to get pending invitations',
        _error.message
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
      const { _data, _error } = await _supabase.functions.invoke(
        'handle-invitation',
        {
          body: testData,
        }
      );
      if (_error) {
        throw _error;
      }
      this.log(
        'Edge Function - Handle Invitation',
        'success',
        'Edge function executed successfully',
        _data
      );
      return true;
    } catch (_error) {
      this.log(
        'Edge Function - Handle Invitation',
        '_error',
        'Edge function failed',
        _error.message
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
      const { _data, _error } = await _supabase.functions.invoke(
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
      if (_error) {
        throw _error;
      }
      this.log(
        'Email Function',
        'success',
        'Email function executed successfully',
        _data
      );
      return true;
    } catch (_error) {
      this.log(
        'Email Function',
        'warning',
        'Email function failed (expected if not configured)',
        _error.message
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
      const { _data, _error } = await _supabase.rpc('accept_user_invitation', {
        invitation_token: this.invitationToken,
        first_name: 'Test',
        last_name: 'User',
        password: 'TestPassword123!',
      });
      if (_error) {
        throw _error;
      }
      this.log(
        'Invitation Acceptance',
        'success',
        'Invitation accepted successfully',
        _data
      );
      return true;
    } catch (_error) {
      this.log(
        'Invitation Acceptance',
        '_error',
        'Failed to accept invitation',
        _error.message
      );
      return false;
    }
  }
  async testReactAppIntegration() {
    try {
      // Test if the React app's Supabase client can access the invitation functions
      const { _data, _error } = await _supabase
        .from('user_invitations')
        .select('*')
        .limit(5);
      if (_error) {
        throw _error;
      }
      this.log(
        'React App Integration',
        'success',
      return true;
    } catch (_error) {
      this.log(
        'React App Integration',
        '_error',
        'React app integration test failed',
        _error.message
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
      } catch (_error) {
        this.log(
          'Cleanup',
          'warning',
          'Failed to clean up test invitation',
          _error.message
        );
      }
    }
    // Clean up test user if created
    try {
      const { _data: testUsers } = await _supabase.auth.admin.listUsers();
      const testUser = testUsers.users.find(u => u.email === config.TEST_EMAIL);
      if (testUser) {
        await _supabase.auth.admin.deleteUser(testUser.id);
        this.log('Cleanup', 'success', 'Test user cleaned up');
      }
    } catch (_error) {
      this.log(
        'Cleanup',
        'warning',
        'Failed to clean up test user',
        _error.message
      );
    }
  }
  printSummary() {
    const results = {
      success: this.testResults.filter(r => r.status === 'success').length,
      warning: this.testResults.filter(r => r.status === 'warning').length,
      _error: this.testResults.filter(r => r.status === '_error').length,
    };
    if (results._error === 0 && results.success > 0) {
        '\n🎉 All critical tests passed! Your invitation system is working.'
      );
    } else if (results._error > 0) {
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
        '\n⚠️  Cannot proceed with invitation tests without an admin user.'
      );
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
    '\nPlease update the configuration at the top of this file with your actual Supabase credentials:'
  );
    '1. Update your environment variables with real Supabase credentials'
  );
  throw new Error('Process exit blocked');
}
// Run the tests
const tester = new InvitationTester();
tester.runAllTests().catch(_error => {
  console.error('❌ Test execution failed:', _error);
  throw new Error('Process exit blocked');
});
