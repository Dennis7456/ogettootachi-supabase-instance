/* eslint-disable no-console, no-undef, no-unused-vars */
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

class MasterTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  // Utility function for logging errors
  _logError(prefix, error) {
    if (error) {
      console.error(`❌ ${prefix}:`, error.message);
    }
  }

  async runAllTests() {
    const _testSuites = [
      {
        name: 'Infrastructure Health Check',
        command: 'node health-check.js',
        description: 'Quick health check of all system components',
        critical: true,
      },
      {
        name: 'Comprehensive Test Suite',
        command: 'node comprehensive-tests.js',
        description: 'Full system test - 12 different test scenarios',
        critical: true,
      },
      {
        name: 'Real Invitation Test',
        command: 'node quick-test-invitation.js test-master-runner@example.com admin "Master Test"',
        description: 'Tests actual invitation creation and email delivery',
        critical: true,
      },
      {
        name: 'System Performance Check',
        command:
          'time node quick-test-invitation.js perf-test@example.com staff "Performance Test"',
        description: 'Measures system performance under normal load',
        critical: false,
      },
      {
        name: 'Configuration Validation',
        command: 'grep -n "smtp_port.*1025" config/auth.toml',
        description: 'Validates critical SMTP configuration',
        critical: true,
      },
    ];

    for (const _testSuite of _testSuites) {
      await this.runTestSuite(_testSuite);
    }

    await this.generateSummaryReport();
  }

  async runTestSuite(_testSuite) {
    const _startTime = Date.now();
    try {
      const { stdout, stderr } = await execAsync(_testSuite.command, {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });
      const _duration = Date.now() - _startTime;
      const _success = this.analyzeTestOutput(stdout, stderr, _testSuite);

      this.results.push({
        name: _testSuite.name,
        status: _success ? 'PASS' : 'FAIL',
        duration: _duration,
        critical: _testSuite.critical,
        output: stdout,
        error: stderr,
      });

      if (!_success) {
        if (stderr) {
          console.error('Error details:', stderr);
        }
      }
    } catch (_error) {
      const _duration = Date.now() - _startTime;
      this.results.push({
        name: _testSuite.name,
        status: 'ERROR',
        duration: _duration,
        critical: _testSuite.critical,
        error: _error.message,
      });
      console.error(`❌ ${_testSuite.name} encountered an error:`, _error.message);
    }
  }

  analyzeTestOutput(stdout, stderr, _testSuite) {
    // Analyze different types of test outputs
    if (_testSuite.name.includes('Health Check')) {
      return stdout.includes('HEALTHY') && !stderr;
    }
    if (_testSuite.name.includes('Comprehensive')) {
      return (
        stdout.includes('ALL TESTS PASSED') ||
        (stdout.includes('Success Rate: ') && !stdout.includes('0.0%'))
      );
    }
    if (_testSuite.name.includes('Invitation Test')) {
      return stdout.includes('SUCCESS!') || stdout.includes('EMAIL FOUND IN MAILPIT!');
    }
    if (_testSuite.name.includes('Configuration')) {
      return stdout.includes('smtp_port = 1025') || stdout.includes('smtp_port=1025');
    }
    // Default: success if no errors
    return !stderr || stderr.trim() === '';
  }

  async generateSummaryReport() {
    const _totalTime = Date.now() - this.startTime;
    const _passed = this.results.filter((r) => r.status === 'PASS').length;
    const _failed = this.results.filter((r) => r.status === 'FAIL').length;
    const _errors = this.results.filter((r) => r.status === 'ERROR').length;
    const _criticalFailed = this.results.filter((r) => r.critical && r.status !== 'PASS').length;

    console.log(`📈 Success Rate: ${((_passed / this.results.length) * 100).toFixed(1)}%`);

    // Detailed results
    this.results.forEach((_result, _index) => {
      const _icon = _result.status === 'PASS' ? '✅' : _result.status === 'FAIL' ? '❌' : '💥';
      const _critical = _result.critical ? '🚨 CRITICAL' : '';

      console.log(`${_index + 1}. ${_icon} ${_result.name} (${_result.duration}ms) ${_critical}`);

      if (_result.status !== 'PASS' && _result.error) {
        console.error(`   Error details: ${_result.error}`);
      }
    });

    // System health assessment
    if (_criticalFailed === 0 && _passed >= this.results.length * 0.8) {
      console.log('✨ SYSTEM FULLY HEALTHY');
    } else if (_criticalFailed === 0) {
      console.warn('⚠️  SYSTEM MOSTLY HEALTHY - Critical tests passed but some issues found.');
    } else {
      console.error('❌ SYSTEM UNHEALTHY - Critical tests failed');
    }

    // Recommendations
    if (_criticalFailed > 0) {
      console.warn('1. 🔧 Immediate investigation required');
      console.warn('2. 🚫 Deployment blocked');
    } else if (_failed > 0) {
      console.warn('1. 🔍 Review non-critical test failures');
      console.warn('2. 🛠️ Consider minor system adjustments');
    } else {
      console.log('3. 💾 Consider creating backup: ./backup-invitation-system.sh');
    }

    // Exit with appropriate code
    if (_criticalFailed > 0) {
      throw new Error('Critical tests failed. Deployment blocked.');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const _runner = new MasterTestRunner();
  _runner.runAllTests().catch((_error) => {
    console.error('💥 Master test runner failed:', _error.message);
    throw new Error('Process exit blocked');
  });
}

export default MasterTestRunner;
