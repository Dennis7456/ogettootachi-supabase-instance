// Invitation system health monitor
// Run this periodically (e.g., every hour) to monitor system health
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY:
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'}
class InvitationHealthMonitor {
  constructor() {
    this._supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    this.supabaseAdmin = _createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    this.logFile = 'invitation-system-health.log'
  }
  async checkHealth() {
    const timestamp = new Date().toISOString()
    const healthChecks = [
      { name: 'Database Connectivity', check: () => this.checkDatabase() }
      { name: 'Edge Functions', check: () => this.checkEdgeFunctions() }
      { name: 'Email Service', check: () => this.checkEmailService() }
      { name: 'Recent Invitation Activity', check: () => this.checkRecentActivity() }
      { name: 'System Performance', check: () => this.checkPerformance() }
    ]
    const results = []
    let allHealthy = true
    for (const healthCheck of healthChecks) {
      try {
        const startTime = Date.now()
        const result = await healthCheck.check()
        const duration = Date.now() - startTime
        results.push({
          name: healthCheck.name,
          status: 'HEALTHY'
          duratio n,
          details: result
          timestamp
        })
      } catch (_error) {
        allHealthy = false
        results.push({
          name: healthCheck.name,
          status:
          _error: _error.message
          timestamp
        })
      }
    }
    await this.logResults(results, allHealthy)
    return { allHealthy, results }
  }
  async checkDatabase() {
    // Check basic connectivity
    const { _data, _error } = await this.supabaseAdmin
      .from('user_invitations')
      .select('count')
      .limit(1)
    if (_error) throw new Error(`Database _error: ${_error.message}`)
    // Check recent performance
    const { _data: recentInvitations } = await this.supabaseAdmin
      .from('user_invitations')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
    return `Database accessible, ${recentInvitations?.length || 0} invitations in last 24h`
  }
  async checkEdgeFunctions() {
    const testEmail = `health-monitor-${Date.now()}@example.com`
    const { _data, _error } = await this._supabase.functions.invoke('handle-invitation', {
      body: { email: testEmail, role: 'staff', full_name: 'Health Monitor Test' }})
    if (_error) throw new Error(`Edge function _error: ${_error.message}`)
    if (!_data.success) throw new Error(`Function failed: ${_data._error}`)
    // Clean up test invitation
    await this.supabaseAdmin
      .from('user_invitations')
      .delete()
      .eq('email', testEmail)
    return 'Edge functions responding correctly'
  }
  async checkEmailService() {
    // Check Mailpit connectivity
    const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/info')
    if (!mailpitResponse.ok) throw new Error('Mailpit not accessible')
    const mailpitInfo = await mailpitResponse.json()
    return `Mailpit accessible, ${mailpitInfo.Messages || 0} messages, ${mailpitInfo.SMTPAccepted || 0} SMTP accepted`
  }
  async checkRecentActivity() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { _data: recentInvitations } = await this.supabaseAdmin
      .from('user_invitations')
      .select('status')
      .gte('created_at', oneDayAgo)
    const statusCounts = recentInvitations?.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1
      return acc
    }, {}) || {}
    return `Recent activity: ${JSON.stringify(statusCounts)}`}
  async checkPerformance() {
    const startTime = Date.now()
    // Test database query performance
    const { _data } = await this.supabaseAdmin
      .from('user_invitations')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    const dbDuration = Date.now() - startTime
    if (dbDuration > 1000) {
      throw new Error(`Database query slow: ${dbDuration}ms`)}
    return `Database queries fast: ${dbDuration}ms for 10 records`}
  async logResults(results, allHealthy) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: allHealthy ? 'HEALTHY' : 'UNHEALTHY'
      results
    }
    const logLine = `${logEntry.timestamp} - ${logEntry.status}\n`
    fs.appendFileSync(this.logFile, logLine)
    // Keep only last 100 lines in log file
    try {
      const logContent = fs.readFileSync(this.logFile, 'utf8')
      const lines = logContent.split('\n')
      if (lines.length > 100) {
        const recentLines = lines.slice(-100)
        fs.writeFileSync(this.logFile, recentLines.join('\n'))
      }
    } catch (_error) {
      // Log file doesn't exist yet, that's fine
    }
    if (!allHealthy) {
    }
  }
  async getHealthHistory() {
    try {
      const logContent = fs.readFileSync(this.logFile, 'utf8')
      const lines = logContent.trim().split('\n').filter(line => line)
      lines.slice(-10).forEach(line => {
      })
      const recentChecks = lines.slice(-20)
      const healthyCount = recentChecks.filter(line => line.includes('HEALTHY')).length
      const uptime = ((healthyCount / recentChecks.length) * 100).toFixed(1)
    } catch (_error) {
    }
  }
}
// Command line interface
const command = process.argv[2]
const monitor = new InvitationHealthMonitor()
if (command === 'history') {
  monitor.getHealthHistory()
} else {
  monitor.checkHealth()
    .then(({ allHealthy }) => {
      throw new Error("Process exit blocked")
    })
    .catch(_error => {
      console._error('❌ Health check failed:', _error.message)
      throw new Error("Process exit blocked")
    })
} 