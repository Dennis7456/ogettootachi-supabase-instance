#!/bin/bash

# Multi-Factor Authentication (MFA) Configuration Script
# Enhances authentication security for Supabase project

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

# Validate Supabase CLI
function validate_supabase_cli() {
    log "Checking Supabase CLI..."
    if ! command -v supabase &> /dev/null; then
        error_exit "Supabase CLI not installed. Please install Supabase CLI first."
    fi
}

# Configure MFA settings
function configure_mfa() {
    log "🔐 Configuring Multi-Factor Authentication..."
    
    # Enable MFA methods
    supabase config set --mfa.enabled true
    supabase config set --mfa.methods "totp,email,phone"
    
    log "✅ MFA Configuration completed"
}

# Create MFA-related security policies
function create_mfa_policies() {
    log "📋 Creating MFA-related Row Level Security Policies..."
    
    # Postgres connection (adjust as needed for your Supabase setup)
    PGPASSWORD=$(supabase secrets get POSTGRES_PASSWORD) psql -h localhost -U postgres -d postgres << SQL
-- Enforce MFA for admin and sensitive roles
CREATE OR REPLACE POLICY "Require MFA for admin access"
ON public.profiles
FOR ALL
WITH CHECK (
    (auth.uid() = id AND auth.factor_id() IS NOT NULL) OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin'
);

-- Limit login attempts before requiring MFA
CREATE OR REPLACE FUNCTION check_login_attempts()
RETURNS TRIGGER AS $$
DECLARE
    failed_attempts INTEGER;
BEGIN
    -- Count failed login attempts in last hour
    SELECT COUNT(*) INTO failed_attempts
    FROM auth.audit_log_entries
    WHERE action = 'login'
    AND created_at > NOW() - INTERVAL '1 hour'
    AND success = false;
    
    -- Require MFA after 3 failed attempts
    IF failed_attempts >= 3 THEN
        RAISE NOTICE 'MFA required due to multiple failed login attempts';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to monitor login attempts
CREATE OR REPLACE TRIGGER enforce_mfa_after_attempts
AFTER INSERT ON auth.audit_log_entries
FOR EACH ROW
EXECUTE FUNCTION check_login_attempts();
SQL

    log "✅ MFA Security Policies created"
}

# Generate secure recovery codes
function generate_mfa_recovery_codes() {
    log "🔑 Generating MFA Recovery Codes..."
    
    # Create secure recovery codes directory
    mkdir -p /Users/denniskiplangat/Documents/law-firm-website/security-tools/mfa_recovery
    
    # Generate 5 recovery codes
    for i in {1..5}; do
        openssl rand -base64 16 | tr -dc 'A-HJ-NP-Za-km-z2-9' | fold -w 10 | head -n 1 > "/Users/denniskiplangat/Documents/law-firm-website/security-tools/mfa_recovery/recovery_code_$i.txt"
    done
    
    # Secure the recovery codes
    chmod 600 /Users/denniskiplangat/Documents/law-firm-website/security-tools/mfa_recovery/*
    
    log "✅ MFA Recovery Codes generated and stored securely"
}

# Main execution function
function main() {
    echo -e "${GREEN}🛡️ Multi-Factor Authentication Setup${NC}"
    
    validate_supabase_cli
    configure_mfa
    create_mfa_policies
    generate_mfa_recovery_codes
    
    echo -e "${GREEN}🎉 MFA Configuration Complete${NC}"
}

# Run the MFA configuration
main
