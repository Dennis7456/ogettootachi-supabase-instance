#!/bin/bash

# Pre-commit hook to test invitation system
# Install: cp pre-commit-test.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Running invitation system tests before commit..."

# Change to the correct directory
cd ogettootachi-supabase-instance

# Check if Supabase is running
if ! curl -s http://127.0.0.1:54321/health > /dev/null; then
    echo "❌ Supabase is not running. Start it with: supabase start"
    exit 1
fi

# Run health check
echo "🏥 Running health check..."
if ! node monitor-invitation-system.js > /dev/null 2>&1; then
    echo "❌ Health check failed. Fix issues before committing."
    echo "💡 Run: node monitor-invitation-system.js"
    exit 1
fi

# Run quick invitation test
echo "📧 Testing invitation creation..."
if ! node quick-test-invitation.js test-precommit@example.com staff "Pre-commit Test" > /dev/null 2>&1; then
    echo "❌ Invitation test failed. Fix issues before committing."
    echo "💡 Run: node quick-test-invitation.js test@example.com staff \"Test\""
    exit 1
fi

# Check critical configuration
echo "🔧 Checking critical configuration..."
SMTP_PORT=$(grep "smtp_port" config/auth.toml | grep -o '[0-9]*')
if [ "$SMTP_PORT" != "1025" ]; then
    echo "❌ CRITICAL: SMTP port is $SMTP_PORT, must be 1025"
    echo "💡 Fix in config/auth.toml: smtp_port = 1025"
    exit 1
fi

echo "✅ All tests passed! Commit approved."
exit 0 