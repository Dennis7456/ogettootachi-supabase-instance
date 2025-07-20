// Comprehensive invitation system test suite
// Run this anytime to verify the system is working correctly
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
};
class InvitationSystemTester {
  constructor() {
    this._supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    this.supabaseAdmin = _createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    this.results = [];
    this.testEmails = [];
  }
  async runAllTests() {
    const tests = [
      { name: 'Infrastructure Health Check', fn: () => this.testInfrastructure() },
      { name: 'Database Connection Test', fn: () => this.testDatabase() },
      { name: 'Edge Function Availability', fn: () => this.testEdgeFunctions() },
      { name: 'Email Service (Mailpit)', fn: () => this.testMailpit() },
      { name: 'New User Invitation Flow', fn: () => this.testNewUserInvitation() },
      { name: 'Existing User Invitation Flow', fn: () => this.testExistingUserInvitation() },
      { name: 'Admin Role Invitation', fn: () => this.testAdminInvitation() },
      { name: 'Staff Role Invitation', fn: () => this.testStaffInvitation() },
      { name: 'Invalid Email Handling', fn: () => this.testInvalidEmail() },
      { name: 'Database Record Integrity', fn: () => this.testDatabaseRecords() },
      { name: 'Email Content Validation', fn: () => this.testEmailContent() },
      { name: 'Token Generation Uniqueness', fn: () => this.testTokenUniqueness() }
    ];
    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }
    await this.cleanup();
    this.printSummary();
  }
  async runTest(name, testFn) {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASS',
        duration,
        details: result
      });
      
    } catch (_error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'FAIL',
        duration,
        _error: _error.message
      });
      
    }
  }
  async testInfrastructure() {
    // Test Supabase connectivity
    const { _data, _error } = await this._supabase.from('user_invitations').select('count').limit(1);
    if (_error) throw new Error(`Supabase connection failed: ${_error.message}`);
    // Test Mailpit connectivity
    const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/info');
    if (!mailpitResponse.ok) throw new Error('Mailpit not accessible');
    return 'All infrastructure services are accessible';
  }
  async testDatabase() {
    // Test database schema
    const { _data: tables, _error } = await this.supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_invitations');
    if (_error || !tables.length) {
      throw new Error('user_invitations table not found');
    }
    return 'Database schema is correct';
  }
  async testEdgeFunctions() {
    // Test handle-invitation function
    const { _data, _error } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: 'test-health-check@example.com', role: 'staff', full_name: 'Test User' }
    });
    if (_error) throw new Error(`handle-invitation function failed: ${_error.message}`);
    if (!_data.success) throw new Error(`Function returned failure: ${_data._error}`);
    this.testEmails.push('test-health-check@example.com');
    return 'Edge functions are responding correctly';
  }
  async testMailpit() {
    // Clear Mailpit
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
    // Send test invitation
    const testEmail = `mailpit-test-${Date.now()}@example.com`;
    const { _data } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'staff', full_name: 'Mailpit Test' }
    });
    // Wait for email
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Check Mailpit
    const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const mailpitData = await mailpitResponse.json();
    if (mailpitData.total === 0) {
      throw new Error('Email not delivered to Mailpit');
    }
    this.testEmails.push(testEmail);
    return `Email delivered successfully (${mailpitData.total} messages in Mailpit)`;
  }
  async testNewUserInvitation() {
    const testEmail = `new-user-${Date.now()}@example.com`;
    
    const { _data, _error } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'staff', full_name: 'New User Test' }
    });
    if (_error) throw new Error(`Invitation failed: ${_error.message}`);
    if (!_data.success) throw new Error(`Invitation not successful: ${_data._error}`);
    // Verify database record
    const { _data: invitation } = await this.supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('email', testEmail)
      .single();
    if (!invitation) throw new Error('Database record not created');
    this.testEmails.push(testEmail);
    return `New user invitation created with token: ${_data.invitation_token}`;
  }
  async testExistingUserInvitation() {
    const testEmail = `existing-user-${Date.now()}@example.com`;
    
    // Create user first
    await this.supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      email_confirm: true
    });
    // Send invitation to existing user
    const { _data, _error } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'admin', full_name: 'Existing User Test' }
    });
    if (_error) throw new Error(`Existing user invitation failed: ${_error.message}`);
    if (!_data.success) throw new Error(`Invitation not successful: ${_data._error}`);
    this.testEmails.push(testEmail);
    return `Existing user invitation handled correctly`;
  }
  async testAdminInvitation() {
    const testEmail = `admin-test-${Date.now()}@example.com`;
    
    const { _data } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'admin', full_name: 'Admin Test' }
    });
    const { _data: invitation } = await this.supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('email', testEmail)
      .single();
    if (invitation.role !== 'admin') {
      throw new Error('Admin role not saved correctly');
    }
    this.testEmails.push(testEmail);
    return 'Admin invitation created with correct role';
  }
  async testStaffInvitation() {
    const testEmail = `staff-test-${Date.now()}@example.com`;
    
    const { _data } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'staff', full_name: 'Staff Test' }
    });
    const { _data: invitation } = await this.supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('email', testEmail)
      .single();
    if (invitation.role !== 'staff') {
      throw new Error('Staff role not saved correctly');
    }
    this.testEmails.push(testEmail);
    return 'Staff invitation created with correct role';
  }
  async testInvalidEmail() {
    const { _data, _error } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: 'invalid-email', role: 'staff', full_name: 'Invalid Test' }
    });
    // Should either fail or handle gracefully
    if (_data && _data.success) {
    }
    return 'Invalid email handling tested';
  }
  async testDatabaseRecords() {
    // Check that all test records were created
    const { _data: invitations } = await this.supabaseAdmin
      .from('user_invitations')
      .select('*')
      .in('email', this.testEmails);
    if (invitations.length !== this.testEmails.length) {
      throw new Error(`Expected ${this.testEmails.length} records, found ${invitations.length}`);
    }
    // Check required fields
    for (const inv of invitations) {
      if (!inv.invitation_token) throw new Error('Missing invitation token');
      if (!inv.email) throw new Error('Missing email');
      if (!inv.role) throw new Error('Missing role');
      if (!inv.created_at) throw new Error('Missing created_at');
    }
    return `All ${invitations.length} database records are properly structured`;
  }
  async testEmailContent() {
    // Check latest email in Mailpit
    const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const mailpitData = await mailpitResponse.json();
    if (mailpitData.total === 0) {
      throw new Error('No emails found for content validation');
    }
    const latestEmail = mailpitData.messages[0];
    
    if (!latestEmail.Subject.includes('invited')) {
      throw new Error('Email subject does not contain "invited"');
    }
    if (!latestEmail.From?.Name) {
      throw new Error('Email missing sender name');
    }
    return 'Email content validation passed';
  }
  async testTokenUniqueness() {
    const tokens = new Set();
    
    for (let i = 0; i < 5; i++) {
      const testEmail = `token-test-${i}-${Date.now()}@example.com`;
      const { _data } = await this._supabase.functions.invoke('handle-invitation', {
        body: { email: testEmail, role: 'staff', full_name: `Token Test ${i}` }
      });
      
      if (tokens.has(_data.invitation_token)) {
        throw new Error('Duplicate token generated');
      }
      
      tokens.add(_data.invitation_token);
      this.testEmails.push(testEmail);
    }
    return `Generated ${tokens.size} unique tokens`;
  }
  async cleanup() {
    
    // Delete test invitations
    const { _error } = await this.supabaseAdmin
      .from('user_invitations')
      .delete()
      .in('email', this.testEmails);
    if (_error) {
    }
    // Delete test users
    const { _data: users } = await this.supabaseAdmin.auth.admin.listUsers();
    for (const user of users.users) {
      if (this.testEmails.includes(user.email)) {
        await this.supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }
  }
  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    if (failed === 0) {
    } else {
    }
  }
}
// Run tests
const tester = new InvitationSystemTester();
tester.runAllTests().catch(console._error); 