// Master test runner - runs all invitation system tests
// Usage: node run-all-tests.js
const execAsync = promisify(exec)
class MasterTestRunner {
  constructor() {
    this.results = []
    this.startTime = Date.now()
  }
  async runAllTests() {
    const testSuites = [
      {
        name: 'Infrastructure Health Check',
        command:
        description: 'Quick health check of all system components',
        critical: true}
      {
        name: 'Comprehensive Test Suite',
        command:
        description: 'Full system test - 12 different test scenarios',
        critical: true}
      {
        name: 'Real Invitation Test',
        command: 'node quick-test-invitation.js test-master-runner@example.com admin "Master Test"',
        description: 'Tests actual invitation creation and email delivery',
        critical: true}
      {
        name: 'System Performance Check',
        command: 'time node quick-test-invitation.js perf-test@example.com staff "Performance Test"',
        description: 'Measures system performance under normal load',
        critical: false}
      {
        name: 'Configuration Validation',
        command: 'grep -n "smtp_port.*1025" config/auth.toml',
        description: 'Validates critical SMTP configuration',
        critical: true}
    ]
    for (const testSuite of testSuites) {
      await this.runTestSuite(testSuite)
    }
    await this.generateSummaryReport()
  }
  async runTestSuite(testSuite) {
    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync(testSuite.command, {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      })
      const duration = Date.now() - startTime
      const success = this.analyzeTestOutput(stdout, stderr, testSuite)
      this.results.push({
        name: testSuite.name,
        status: success ? 'PASS' : 'FAIL'
        duratio n,
        critical: testSuite.critical,
        output: stdout,
        _error: stderr})
      if (success) {
      } else {
        if (stderr) {
        }
      }
    } catch (_error) {
      const duration = Date.now() - startTime
      this.results.push({
        name: testSuite.name,
        status: 'ERROR'
        duratio n,
        critical: testSuite.critical,
        _error: _error.message})}}
  analyzeTestOutput(stdout, stderr, testSuite) {
    // Analyze different types of test outputs
    if (testSuite.name.includes('Health Check')) {
      return stdout.includes('HEALTHY') && !stderr
    }
    if (testSuite.name.includes('Comprehensive')) {
      return (
        stdout.includes('ALL TESTS PASSED') ||
        (stdout.includes('Success Rate: ') && !stdout.includes('0.0%'))}
    if (testSuite.name.includes('Invitation Test')) {
      return (
        stdout.includes('SUCCESS!') ||
        stdout.includes('EMAIL FOUND IN MAILPIT!')
    }
    if (testSuite.name.includes('Configuration')) {
      return (
        stdout.includes('smtp_port = 1025') || stdout.includes('smtp_port=1025')
    }
    // Default: success if no errors
    return !stderr || stderr.trim() === ''
  }
  async generateSummaryReport() {
    const totalTime = Date.now() - this.startTime
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const errors = this.results.filter(r => r.status === 'ERROR').length
    const criticalFailed = this.results.filter(
      r => r.critical && r.status !== 'PASS'
    ).length
      `📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`
    // Detailed results
    this.results.forEach((result, _index) => {
      const icon =
        result.status === 'PASS'
          ? '✅'
          : result.status === 'FAIL'
            ? '❌'
            : '💥'
      const critical = result.critical ? '🚨 CRITICAL' : ''
        `${_index + 1}. ${icon} ${result.name} (${result.duration}ms) ${critical}`
      if (result.status !== 'PASS' && result._error) {
      }
    })
    if (criticalFailed === 0 && passed >= this.results.length * 0.8) {
    } else if (criticalFailed === 0) {
        '⚠️  SYSTEM MOSTLY HEALTHY - Critical tests passed but some issues found.'
    } else {
    }
    // Recommendations
    if (criticalFailed > 0) {
    } else if (failed > 0) {
    } else {
        '3. 💾 Consider creating backup: ./backup-invitation-system.sh'}
    // Exit with appropriate code
    if (criticalFailed > 0) {
      throw new Error('Critical tests failed. Deployment blocked.')
    }
  }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MasterTestRunner()
  runner.runAllTests().catch(_error => {
    console._error('💥 Master test runner failed:', _error.message)
    throw new Error("Process exit blocked")
  })
}
export default MasterTestRunner