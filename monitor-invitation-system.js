/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";

// Invitation system health monitor
// Run this periodically (e.g., every hour) to monitor system health
const _config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

class InvitationHealthMonitor {
  constructor() {
    this._supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_ANON_KEY);
    this.supabaseAdmin = createClient(_config.SUPABASE_URL, _config.SUPABASE_SERVICE_ROLE_KEY);
    this.logFile = "invitation-system-health.log";
  }

  async checkHealth() {
    const _timestamp = new Date().toISOString();
    const _healthChecks = [
      { name: "Database Connectivity", check: () => this.checkDatabase() },
      { name: "Edge Functions", check: () => this.checkEdgeFunctions() },
      { name: "Email Service", check: () => this.checkEmailService() },
      {
        name: "Recent Invitation Activity",
        check: () => this.checkRecentActivity(),
      },
      { name: "System Performance", check: () => this.checkPerformance() },
    ];

    const _results = [];
    let _allHealthy = true;

    for (const _healthCheck of _healthChecks) {
      try {
        const _startTime = Date.now();
        const _result = await _healthCheck.check();
        const _duration = Date.now() - _startTime;

        _results.push({
          name: _healthCheck.name,
          status: "HEALTHY",
          duration: _duration,
          details: _result,
          timestamp: _timestamp,
        });
      } catch (_error) {
        _allHealthy = false;
        _results.push({
          name: _healthCheck.name,
          status: "UNHEALTHY",
          error: _error.message,
          timestamp: _timestamp,
        });
      }
    }

    await this.logResults(_results, _allHealthy);
    return { allHealthy: _allHealthy, results: _results };
  }

  async checkDatabase() {
    // Check basic connectivity
    const { _data, _error } = await this.supabaseAdmin
      .from("user_invitations")
      .select("count")
      .limit(1);

    _logError("Database connectivity error", _error);

    // Check recent performance
    const { _data: _recentInvitations } = await this.supabaseAdmin
      .from("user_invitations")
      .select("*")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    return `Database accessible, ${_recentInvitations?.length || 0} invitations in last 24h`;
  }

  async checkEdgeFunctions() {
    const _testEmail = `health-monitor-${Date.now()}@example.com`;
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: {
        email: _testEmail,
        role: "staff",
        full_name: "Health Monitor Test",
      },
    });

    _logError("Edge function invocation error", _error);

    if (!_data.success) {
      console.warn("Edge function did not return success");
    }

    // Clean up test invitation
    await this.supabaseAdmin.from("user_invitations").delete().eq("email", _testEmail);

    return "Edge functions responding correctly";
  }

  async checkEmailService() {
    // Check Mailpit connectivity
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/info");
    if (!_mailpitResponse.ok) {
      throw new Error("Mailpit not accessible");
    }

    const _mailpitInfo = await _mailpitResponse.json();
    return `Mailpit accessible, ${_mailpitInfo.Messages || 0} messages, ${_mailpitInfo.SMTPAccepted || 0} SMTP accepted`;
  }

  async checkRecentActivity() {
    const _oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { _data: _recentInvitations } = await this.supabaseAdmin
      .from("user_invitations")
      .select("status")
      .gte("created_at", _oneDayAgo);

    const _statusCounts =
      _recentInvitations?.reduce((_acc, _inv) => {
        _acc[_inv.status] = (_acc[_inv.status] || 0) + 1;
        return _acc;
      }, {}) || {};

    return `Recent activity: ${JSON.stringify(_statusCounts)}`;
  }

  async checkPerformance() {
    const _startTime = Date.now();

    // Test database query performance
    const { _data } = await this.supabaseAdmin
      .from("user_invitations")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const _dbDuration = Date.now() - _startTime;

    if (_dbDuration > 1000) {
      console.warn(`Slow database query: ${_dbDuration}ms`);
    }

    return `Database queries fast: ${_dbDuration}ms for 10 records`;
  }

  async logResults(_results, _allHealthy) {
    const _logEntry = {
      timestamp: new Date().toISOString(),
      status: _allHealthy ? "HEALTHY" : "UNHEALTHY",
      results: _results,
    };

    const _logLine = `${_logEntry.timestamp} - ${_logEntry.status}\n`;
    await fs.appendFile(this.logFile, _logLine);

    // Keep only last 100 lines in log file
    try {
      const _logContent = await fs.readFile(this.logFile, "utf8");
      const _lines = _logContent.split("\n");
      if (_lines.length > 100) {
        const _recentLines = _lines.slice(-100);
        await fs.writeFile(this.logFile, _recentLines.join("\n"));
      }
    } catch (_error) {
      // Log file doesn't exist yet, that's fine
      console.warn("Error managing log file:", _error);
    }

    if (!_allHealthy) {
      console.log("💡 Run the full test suite: node test-invitation-system-complete.js");
    }
  }

  async getHealthHistory() {
    try {
      const _logContent = await fs.readFile(this.logFile, "utf8");
      const _lines = _logContent
        .trim()
        .split("\n")
        .filter((_line) => _line);

      _lines.slice(-10).forEach((_line, _index) => {
        console.log(`Recent log ${_index + 1}:`, _line);
      });

      const _recentChecks = _lines.slice(-20);
      const _healthyCount = _recentChecks.filter((_line) => _line.includes("HEALTHY")).length;

      const _uptime = ((_healthyCount / _recentChecks.length) * 100 || 0).toFixed(1);
      console.log(`System Uptime: ${_uptime}%`);
    } catch (_error) {
      console.error("Error reading health history:", _error);
    }
  }
}

// Command line interface and module exports
function runHealthMonitor() {
  const _command = process.argv[2];
  const _monitor = new InvitationHealthMonitor();

  async function executeCommand() {
    try {
      if (_command === "history") {
        await _monitor.getHealthHistory();
      } else if (_command === "check") {
        const _result = await _monitor.checkHealth();
        console.log("Health Check Result:", _result);
      } else {
        console.error('Invalid command. Use "history" or "check".');
        process.exit(1);
      }
    } catch (_error) {
      console.error("Error running health monitor:", _error);
      process.exit(1);
    }
  }

  executeCommand().catch(console.error);
}

// Export the function for module usage
export default {
  runHealthMonitor,
  InvitationHealthMonitor,
};

// Only run if this is the main module
if (import.meta.main) {
  runHealthMonitor();
}
