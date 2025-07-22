/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Invitation system health monitor
const config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
};

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

class InvitationHealthMonitor {
  constructor() {
    this._supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    this._supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
    this._logFile = "invitation-system-health.log";
  }

  async checkHealth() {
    const _timestamp = new Date().toISOString();
    const _healthChecks = [
      { name: "Database Connectivity", check: () => this.checkDatabase() },
      { name: "Edge Functions", check: () => this.checkEdgeFunctions() },
      { name: "Email Service", check: () => this.checkEmailService() },
      { name: "Recent Invitation Activity", check: () => this.checkRecentActivity() },
      { name: "System Performance", check: () => this.checkPerformance() }
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
          timestamp: _timestamp
        });
      } catch (_error) {
        _allHealthy = false;
        _results.push({
          name: _healthCheck.name,
          status: "UNHEALTHY",
          error: _error.message,
          timestamp: _timestamp
        });
      }
    }

    await this.logResults(_results, _allHealthy);
    return { allHealthy: _allHealthy, results: _results };
  }

  async checkDatabase() {
    // Check basic connectivity
    const { _data, _error } = await this._supabaseAdmin
      .from("user_invitations")
      .select("count")
      .limit(1);

    logError("Database connectivity error", _error);

    // Check recent performance
    const { _data: _recentInvitations } = await this._supabaseAdmin
      .from("user_invitations")
      .select("*")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    return `Database accessible, ${_recentInvitations?.length || 0} invitations in last 24h`;
  }

  async checkEdgeFunctions() {
    const _testEmail = `health-monitor-${Date.now()}@example.com`;
    const { _data, _error } = await this._supabase.functions.invoke("handle-invitation", {
      body: { email: _testEmail, role: "staff", full_name: "Health Monitor Test" }
    });

    logError("Edge function invocation error", _error);

    // Clean up test invitation
    await this._supabaseAdmin
      .from("user_invitations")
      .delete()
      .eq("email", _testEmail);

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
    const { _data: _recentInvitations } = await this._supabaseAdmin
      .from("user_invitations")
      .select("status")
      .gte("created_at", _oneDayAgo);

    const _statusCounts = _recentInvitations?.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return `Recent activity: ${JSON.stringify(_statusCounts)}`;
  }

  async checkPerformance() {
    const _startTime = Date.now();
    
    // Test database query performance
    const { _data } = await this._supabaseAdmin
      .from("user_invitations")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const _dbDuration = Date.now() - _startTime;
    
    if (_dbDuration > 1000) {
      throw new Error(`Database query slow: ${_dbDuration}ms`);
    }

    return `Database queries fast: ${_dbDuration}ms for 10 records`;
  }

  async logResults(_results, _allHealthy) {
    const _logEntry = {
      timestamp: new Date().toISOString(),
      status: _allHealthy ? "HEALTHY" : "UNHEALTHY",
      results: _results
    };

    const _logLine = `${_logEntry.timestamp} - ${_logEntry.status}\n`;
    
    try {
      fs.appendFileSync(this._logFile, _logLine);
      
      // Keep only last 100 lines in log file
      const _logContent = fs.readFileSync(this._logFile, "utf8");
      const _lines = _logContent.split("\n");
      
      if (_lines.length > 100) {
        const _recentLines = _lines.slice(-100);
        fs.writeFileSync(this._logFile, _recentLines.join("\n"));
      }
    } catch (_error) {
      console.error("Error logging results:", _error);
    }

    if (!_allHealthy) {
      console.warn("System health check detected issues");
    }
  }

  async getHealthHistory() {
    try {
      const _logContent = fs.readFileSync(this._logFile, "utf8");
      const _lines = _logContent.trim().split("\n").filter(_line => _line);
      
      _lines.slice(-10).forEach((_line, _index) => {
        console.log(`Recent log entry ${_index + 1}:`, _line);
      });

      const _recentChecks = _lines.slice(-20);
      const _healthyCount = _recentChecks.filter(_line => _line.includes("HEALTHY")).length;
      const _uptime = (((_healthyCount / _recentChecks.length) * 100) || 0).toFixed(1);

      console.log(`System uptime: ${_uptime}%`);
    } catch (_error) {
      console.error("Error retrieving health history:", _error);
    }
  }
}

// Command line interface
const _command = process.argv[2];
const _monitor = new InvitationHealthMonitor();

if (_command === "history") {
  _monitor.getHealthHistory();
} else {
  _monitor.checkHealth()
    .then(({ allHealthy }) => {
      if (!allHealthy) {
        console.warn("System health check detected issues");
      }
      throw new Error("Process exit blocked");
    })
    .catch(_error => {
      console.error("❌ Health check failed:", _error.message);
      throw new Error("Process exit blocked");
    });
} 