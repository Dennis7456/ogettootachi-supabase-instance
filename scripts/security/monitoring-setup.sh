#!/bin/bash

# Real-Time Security Monitoring Setup Script
# Enhanced version with improved error handling and logging

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Error handling function
error_exit() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    exit 1
}

# Check and install dependencies
function check_dependencies() {
    log "Checking monitoring tool dependencies..."
    
    # Install Homebrew if not exists
    which brew || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Update Homebrew
    brew update
    
    # Install or upgrade Prometheus
    brew list prometheus || brew install prometheus
    brew upgrade prometheus
    
    # Install or upgrade Grafana
    brew list grafana || brew install grafana
    brew upgrade grafana
    
    # Install additional monitoring utilities
    brew install node_exporter
}

# Configure Prometheus for security monitoring
function configure_prometheus() {
    log "Configuring Prometheus for security monitoring..."
    
    # Create Prometheus configuration directory
    mkdir -p /usr/local/etc/prometheus
    
    cat > /usr/local/etc/prometheus/prometheus.yml << PROMCONFIG
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
      - targets:
        - localhost:9093

rule_files:
  - "security_alerts.yml"

scrape_configs:
  - job_name: 'supabase'
    static_configs:
      - targets: ['localhost:54321']
  
  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']
  
  - job_name: 'authentication'
    metrics_path: '/metrics/auth'
    static_configs:
      - targets: ['localhost:54321']
  
  - job_name: 'edge_functions'
    metrics_path: '/metrics/functions'
    static_configs:
      - targets: ['localhost:54321']

PROMCONFIG

    log "✅ Prometheus configuration complete"
}

# Create security-specific alert rules
function create_security_alerts() {
    log "Creating security alert rules..."
    
    cat > /usr/local/etc/prometheus/security_alerts.yml << ALERTRULES
groups:
- name: security_alerts
  rules:
  - alert: HighLoginFailures
    expr: sum(rate(auth_login_failures_total[5m])) > 10
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: "High number of login failures detected"
      description: "More than 10 login failures in 5 minutes"

  - alert: UnauthorizedAccessAttempt
    expr: sum(rate(unauthorized_access_attempts_total[5m])) > 5
    for: 5m
    labels:
      severity: high
    annotations:
      summary: "Multiple unauthorized access attempts"
      description: "More than 5 unauthorized access attempts detected"

  - alert: SuspiciousFunctionInvocation
    expr: sum(rate(edge_function_errors_total[5m])) > 3
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Suspicious Edge Function Errors"
      description: "Multiple edge function errors detected"

ALERTRULES

    log "✅ Security alert rules created"
}

# Setup Grafana dashboards
function configure_grafana() {
    log "Configuring Grafana dashboards..."
    
    # Install Grafana security plugins
    grafana-cli plugins install grafana-security-app || true
    
    # Create a basic security dashboard JSON
    mkdir -p /usr/local/var/lib/grafana/dashboards
    
    cat > /usr/local/var/lib/grafana/dashboards/security_overview.json << DASHBOARD
{
    "annotations": {},
    "editable": true,
    "gnetId": null,
    "graphTooltip": 0,
    "id": null,
    "links": [],
    "panels": [
        {
            "title": "Security Overview",
            "type": "stat",
            "targets": [
                {
                    "expr": "sum(rate(auth_login_failures_total[5m]))",
                    "legendFormat": "Login Failures"
                }
            ]
        }
    ],
    "schemaVersion": 27,
    "style": "dark",
    "tags": ["security"],
    "templating": {},
    "time": {
        "from": "now-6h",
        "to": "now"
    },
    "timezone": "",
    "title": "Security Dashboard",
    "version": 1
}
DASHBOARD

    # Restart Grafana to apply changes
    brew services restart grafana
    
    log "✅ Grafana security monitoring configured"
}

# Notification setup for critical alerts
function setup_notifications() {
    log "Configuring alert notifications..."
    
    # Create Alertmanager configuration
    mkdir -p /usr/local/etc/alertmanager
    
    cat > /usr/local/etc/alertmanager/alertmanager.yml << NOTIFYCONFIG
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'security-team'

receivers:
- name: 'security-team'
  email_configs:
  - to: 'security@ogettootachi.com'
    from: 'alerts@ogettootachi.com'
    smarthost: 'localhost:25'
    require_tls: false

NOTIFYCONFIG

    log "✅ Alert notifications configured"
}

# Main execution function
function main() {
    echo -e "${GREEN}🛡️ Security Monitoring Setup${NC}"
    
    # Create log directory
    mkdir -p /Users/denniskiplangat/Documents/law-firm-website/security-tools/monitoring
    
    check_dependencies
    configure_prometheus
    create_security_alerts
    configure_grafana
    setup_notifications
    
    # Start/Restart services
    brew services restart prometheus
    brew services restart grafana
    brew services start node_exporter
    
    echo -e "${GREEN}🎉 Real-Time Security Monitoring Setup Complete${NC}"
}

# Run the monitoring setup
main
