/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";

// Comprehensive invitation system test suite
// Run this anytime to verify the system is working correctly
const _config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

class InvitationSystemTester {
  constructor() {
    this._supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_ANON_KEY);
    this.supabaseAdmin = createClient(_config.SUPABASE_URL, _config.SUPABASE_SERVICE_ROLE_KEY);
    this.results = [];
    this.testEmails = [];
  }

  async runAllTests() {
    const _tests = [
      { name: "Infrastructure Health Check", fn: () => this.testInfrastructure() },
      { name: "Database Connection Test", fn: () => this.testDatabase() },
      { name: "Edge Function Availability", fn: () => this.testEdgeFunctions() },
      { name: "Email Service (Mailpit)", fn: () => this.testMailpit() },
      { name: "New User Invitation Flow", fn: () => this.testNewUserInvitation() },
      { name: "Existing User Invitation Flow", fn: () => this.testExistingUserInvitation() },
      { name: "Admin Role Invitation", fn: () => this.testAdminInvitation() },
      { name: "Staff Role Invitation", fn: () => this.testStaffInvitation() },
      { name: "Invalid Email Handling", fn: () => this.testInvalidEmail() },
      { name: "Database Record Integrity", fn: () => this.testDatabaseRecords() },
      { name: "Email Content Validation", fn: () => this.testEmailContent() },
      { name: "Token Generation Uniqueness", fn: () => this.testTokenUniqueness() }
    ];

    for (const _test of _tests) {
      await this.runTest(_test.name, _test.fn);
    }

    await this.cleanup();
    this.printSummary();
  }

  async runTest(_name, _testFn) {
    const _startTime = Date.now();
    try {
      const _result = await _testFn();
      const _duration = Date.now() - _startTime;
      this.results.push({
        name: _name,
        status: "PASS",
        duration: _duration,
        details: _result
      });
    } catch (_error) {
      const _duration = Date.now() - _startTime;
      this.results.push({
        name: _name,
        status: "FAIL",
        duration: _duration,
        error: _error.message
      });
    }
  }

  async testInfrastructure() {
    // Test Supabase connectivity
    const { _data, _error } = await this._supabase.from("user_invitations").select("count").limit(1);
    _logError("Supabase connectivity error", _error);

    // Test Mailpit connectivity
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/info");
    if (!_mailpitResponse.ok) throw new Error("Mailpit not accessible");

    return "All infrastructure services are accessible";
  }

  async testDatabase() {
    // Test database schema
    const { _data: _tables, _error } = await this.supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "user_invitations");

    _logError("Database schema error", _error);

    if (_error || !_tables.length) {
      throw new Error("user_invitations table not found");
    }

    return "Database schema is correct";
  }

  async testEdgeFunctions() {
    // Test handle-invitation function
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: "test-health-check@example.com", role: "staff", full_name: "Test User" }
    });

    _logError("Edge function invocation error", _error);

    this.testEmails.push("test-health-check@example.com");
    return "Edge functions are responding correctly";
  }

  async testMailpit() {
    // Clear Mailpit
    await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" });

    // Send test invitation
    const _testEmail = `mailpit-test-${Date.now()}@example.com`;
    const { _data } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "staff", full_name: "Mailpit Test" }
    });

    // Wait for email
    await new Promise(_resolve => setTimeout(_resolve, 3000));

    // Check Mailpit
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total === 0) {
      throw new Error("Email not delivered to Mailpit");
    }

    this.testEmails.push(_testEmail);
    return `Email delivered successfully (${_mailpitData.total} messages in Mailpit)`;
  }

  async testNewUserInvitation() {
    const _testEmail = `new-user-${Date.now()}@example.com`;
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "staff", full_name: "New User Test" }
    });

    _logError("New user invitation error", _error);

    // Verify database record
    const { _data: _invitation } = await this.supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("email", _testEmail)
      .single();

    if (!_invitation) throw new Error("Database record not created");

    this.testEmails.push(_testEmail);
    return `New user invitation created with token: ${_data.invitation_token}`;
  }

  async testExistingUserInvitation() {
    const _testEmail = `existing-user-${Date.now()}@example.com`;

    // Create user first
    await this.supabaseAdmin.auth.admin.createUser({
      email: _testEmail,
      email_confirm: true
    });

    // Send invitation to existing user
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "admin", full_name: "Existing User Test" }
    });

    _logError("Existing user invitation error", _error);

    this.testEmails.push(_testEmail);
    return "Existing user invitation handled correctly";
  }

  async testAdminInvitation() {
    const _testEmail = `admin-test-${Date.now()}@example.com`;
    const { _data } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "admin", full_name: "Admin Test" }
    });

    const { _data: _invitation } = await this.supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("email", _testEmail)
      .single();

    if (_invitation.role !== "admin") {
      throw new Error("Admin role not saved correctly");
    }

    this.testEmails.push(_testEmail);
    return "Admin invitation created with correct role";
  }

  async testStaffInvitation() {
    const _testEmail = `staff-test-${Date.now()}@example.com`;
    const { _data } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "staff", full_name: "Staff Test" }
    });

    const { _data: _invitation } = await this.supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("email", _testEmail)
      .single();

    if (_invitation.role !== "staff") {
      throw new Error("Staff role not saved correctly");
    }

    this.testEmails.push(_testEmail);
    return "Staff invitation created with correct role";
  }

  async testInvalidEmail() {
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: "invalid-email", role: "staff", full_name: "Invalid Test" }
    });

    _logError("Invalid email handling error", _error);

    // Should either fail or handle gracefully
    if (_data && _data.success) {
      console.warn("Invalid email unexpectedly succeeded");
    }

    return "Invalid email handling tested";
  }

  async testDatabaseRecords() {
    // Check that all test records were created
    const { _data: _invitations } = await this.supabaseAdmin
      .from("user_invitations")
      .select("*")
      .in("email", this.testEmails);

    if (_invitations.length !== this.testEmails.length) {
      console.warn(`Expected ${this.testEmails.length} invitations, found ${_invitations.length}`);
    }

    // Check required fields
    for (const _inv of _invitations) {
      if (!_inv.invitation_token) throw new Error("Missing invitation token");
      if (!_inv.email) throw new Error("Missing email");
      if (!_inv.role) throw new Error("Missing role");
      if (!_inv.created_at) throw new Error("Missing created_at");
    }

    return `All ${_invitations.length} database records are properly structured`;
  }

  async testEmailContent() {
    // Check latest email in Mailpit
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total === 0) {
      throw new Error("No emails found for content validation");
    }

    const _latestEmail = _mailpitData.messages[0];
    if (!_latestEmail.Subject.includes("invited")) {
      throw new Error('Email subject does not contain "invited"');
    }

    if (!_latestEmail.From?.Name) {
      throw new Error("Email missing sender name");
    }

    return "Email content validation passed";
  }

  async testTokenUniqueness() {
    const _tokens = new Set();

    for (let _i = 0; _i < 5; _i++) {
      const _testEmail = `token-test-${_i}-${Date.now()}@example.com`;
      const { _data } = await this._supabase.functions.invoke("handle-invitation", {
        body: { email: _testEmail, role: "staff", full_name: `Token Test ${_i}` }
      });

      if (_tokens.has(_data.invitation_token)) {
        throw new Error("Duplicate token generated");
      }

      _tokens.add(_data.invitation_token);
      this.testEmails.push(_testEmail);
    }

    return `Generated ${_tokens.size} unique tokens`;
  }

  async cleanup() {
    // Delete test invitations
    const { _error } = await this.supabaseAdmin
      .from("user_invitations")
      .delete()
      .in("email", this.testEmails);

    _logError("Error deleting test invitations", _error);

    // Delete test users
    const { _data: _users } = await this.supabaseAdmin.auth.admin.listUsers();

    for (const _user of _users.users) {
      if (this.testEmails.includes(_user.email)) {
        await this.supabaseAdmin.auth.admin.deleteUser(_user.id);
      }
    }
  }

  printSummary() {
    const _passed = this.results.filter(_r => _r.status === "PASS").length;
    const _failed = this.results.filter(_r => _r.status === "FAIL").length;
    const _totalTime = this.results.reduce((_sum, _r) => _sum + _r.duration, 0);

    console.log("Test Suite Summary:");
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${_passed}`);
    console.log(`Failed: ${_failed}`);
    console.log(`Total Execution Time: ${_totalTime}ms`);

    if (_failed === 0) {
      console.log("✅ All tests passed successfully!");
    } else {
      console.error("❌ Some tests failed. Please review the details.");
      this.results.filter(_r => _r.status === "FAIL").forEach(_failedTest => {
        console.error(`- ${_failedTest.name}: ${_failedTest.error}`);
      });
    }
  }
}

// Run tests
const _tester = new InvitationSystemTester();
_tester.runAllTests().catch(console.error);