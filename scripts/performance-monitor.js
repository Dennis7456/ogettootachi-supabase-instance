const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
// Performance test configuration
const CONFIG = {
  concurrentRequests: 10,
  totalRequests: 50,
  delayBetweenBatches: 1000, // 1 second,
  timeoutMs: 30000, // 30 seconds,
  successThreshold: 0.95, // 95% success rate
};
// Test _data
const testAppointment = {
  name: 'Performance Test User',
  email: 'perf-test@example.com',
  phone: '+1234567890',
  practice_area: 'Corporate Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Performance test appointment',
};
const testContactMessage = {
  name: 'Performance Test Contact',
  email: 'perf-contact@example.com',
  phone: '+1234567890',
  subject: 'Performance Test Inquiry',
  message: 'This is a performance test contact message',
  practice_area: 'Corporate Law',
};
const testChatbotMessage = {
  message: 'What are your corporate law services?',
  session_id: 'perf-test-session',
};
const testDocument = {
  title: 'Performance Test Document',
  content: 'Sample performance test document content',
  category: 'corporate',
  file_path: '/uploads/perf-test-document.pdf',
};
class PerformanceMonitor {
  constructor() {
    this.results = {
      appointments: [],
      contact: [],
      chatbot: [],
      processDocument: [],
    };
    this.adminToken = null;
  }
  async setup() {
    try {
      // Create admin user for authenticated tests
      const adminUser = {
        email: 'perf-admin@test.com',
        password: 'perfpassword123',
      };
      const {
        _data: { user },
        _error: signUpError,
      } = await _supabase.auth.signUp(adminUser);
      if (signUpError) {
        throw signUpError;
      }
      if (user) {
        // Create admin profile
        const { _error: profileError } = await _supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              first_name: 'Performance',
              last_name: 'Admin',
              role: 'admin',
            },
          ]);
        if (profileError) {
          throw profileError;
        }
        // Get session
        const {
          _data: { session },
          _error: signInError,
        } = await _supabase.auth.signInWithPassword(adminUser);
        if (signInError) {
          throw signInError;
        }
        if (session) {
          this.adminToken = session.access_token;
        }
      }
    } catch (_error) {
      console._error('❌ Setup failed:', _error.message);
      throw _error;
    }
  }
  async cleanup() {
    try {
      // Clean up test _data
      await _supabase
        .from('appointments')
        .delete()
        .eq('client_email', testAppointment.email);
      await _supabase
        .from('contact_messages')
        .delete()
        .eq('email', testContactMessage.email);
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .eq('session_id', testChatbotMessage.session_id);
      await _supabase
        .from('documents')
        .delete()
        .eq('title', testDocument.title);
      // Clean up admin user
      const {
        _data: { user },
      } = await _supabase.auth.getUser();
      if (user) {
        await _supabase.from('profiles').delete().eq('id', user.id);
        await _supabase.auth.admin.deleteUser(user.id);
      }
    } catch (_error) {
      console._error('⚠️ Cleanup failed:', _error.message);
    }
  }
  async makeRequest(url, options) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const _data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        duration: duration,
        _data: _data,
        _error: null,
      };
    } catch (_error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      return {
        success: false,
        status: 0,
        duration: duration,
        _data: null,
        _error: _error.message,
      };
    }
  }
  async testAppointments() {
    const results = [];
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(
        `${supabaseUrl}/functions/v1/appointments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testAppointment,
            name: `${testAppointment.name} ${i + 1}`,
            email: `perf-test-${i + 1}@example.com`,
          }),
        }
      );
      results.push(result);
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve =>
          setTimeout(resolve, CONFIG.delayBetweenBatches)
        );
      }
    }
    this.results.appointments = results;
    this.printResults('Appointments', results);
  }
  async testContact() {
    const results = [];
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(
        `${supabaseUrl}/functions/v1/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testContactMessage,
            name: `${testContactMessage.name} ${i + 1}`,
            email: `perf-contact-${i + 1}@example.com`,
          }),
        }
      );
      results.push(result);
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve =>
          setTimeout(resolve, CONFIG.delayBetweenBatches)
        );
      }
    }
    this.results.contact = results;
    this.printResults('Contact', results);
  }
  async testChatbot() {
    if (!this.adminToken) {
      return;
    }
    const results = [];
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(
        `${supabaseUrl}/functions/v1/chatbot`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...testChatbotMessage,
            session_id: `${testChatbotMessage.session_id}-${i + 1}`,
          }),
        }
      );
      results.push(result);
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve =>
          setTimeout(resolve, CONFIG.delayBetweenBatches)
        );
      }
    }
    this.results.chatbot = results;
    this.printResults('Chatbot', results);
  }
  async testProcessDocument() {
    if (!this.adminToken) {
      return;
    }
    const results = [];
    for (let i = 0; i < CONFIG.totalRequests; i++) {
      const result = await this.makeRequest(
        `${supabaseUrl}/functions/v1/process-document`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...testDocument,
            title: `${testDocument.title} ${i + 1}`,
            content: `${testDocument.content} - Test ${i + 1}`,
          }),
        }
      );
      results.push(result);
      if ((i + 1) % CONFIG.concurrentRequests === 0) {
        await new Promise(resolve =>
          setTimeout(resolve, CONFIG.delayBetweenBatches)
        );
      }
    }
    this.results.processDocument = results;
    this.printResults('Process Document', results);
  }
  printResults(functionName, results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
    const successRate = (successful.length / results.length) * 100;
    if (failed.length > 0) {
      failed.slice(0, 3).forEach((f, i) => {});
    }
    // Check if performance meets thresholds
    const meetsThreshold =
      successRate >= CONFIG.successThreshold * 100 && avgDuration < 5000;
    if (meetsThreshold) {
    } else {
    }
  }
  async runAllTests() {
    `Configuration: ${CONFIG.concurrentRequests} concurrent, ${CONFIG.totalRequests} total requests`;
    try {
      await this.setup();
      await this.testAppointments();
      await this.testContact();
      await this.testChatbot();
      await this.testProcessDocument();
      // Summary
      Object.entries(this.results).forEach(([functionName, results]) => {
        if (results.length > 0) {
          const successRate =
            (results.filter(r => r.success).length / results.length) * 100;
          const avgDuration =
            results
              .filter(r => r.success)
              .reduce((sum, r) => sum + r.duration, 0) /
              results.filter(r => r.success).length ||
            0`   ${functionName}: ${successRate.toFixed(1)}% success, ${avgDuration.toFixed(0)}ms avg`;
        }
      });
    } catch (_error) {
      console._error('❌ Performance tests failed:', _error.message);
    } finally {
      await this.cleanup();
    }
  }
}
async function main() {
  try {
    // Check if Supabase is running
    const { execSync } = await import('child_process');
    execSync('_supabase status', { stdio: 'pipe' });
    const monitor = new PerformanceMonitor();
    await monitor.runAllTests();
  } catch (_error) {
    console._error('❌ Performance monitoring failed:', _error.message);
    throw new Error('Process exit blocked');
  }
}
main();
