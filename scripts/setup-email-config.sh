#!/bin/bash

# Email Configuration Setup Script for Ogetto, Otachi & Co Advocates

echo "🔧 Supabase Email Configuration Setup"
echo "====================================="
echo "Recommended: Use Mailhog for local development"
echo "Install with: brew install mailhog"
echo "Web Interface: http://localhost:8025"
echo ""

# Prompt for SMTP details with Mailhog defaults
read -p "Enter SMTP Host (default: localhost): " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-localhost}

read -p "Enter SMTP Port (default: 1025): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-1025}

read -p "Enter SMTP Username (optional for Mailhog): " SMTP_USERNAME
read -sp "Enter SMTP Password (optional for Mailhog): " SMTP_PASSWORD
echo  # New line after password input

read -p "Enter From Email Address (default: noreply@ogettootachi.com): " SMTP_FROM
SMTP_FROM=${SMTP_FROM:-noreply@ogettootachi.com}

# Set environment variables
export SMTP_HOST=$SMTP_HOST
export SMTP_PORT=$SMTP_PORT
export SMTP_USERNAME=$SMTP_USERNAME
export SMTP_PASSWORD=$SMTP_PASSWORD
export SMTP_FROM=$SMTP_FROM

# Optional: Write to .env file
echo "Writing configuration to .env file..."
cat > .env << EOL
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USERNAME=$SMTP_USERNAME
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM
EOL

echo "✅ Email configuration complete!"
echo "Note: Keep your .env file secure and do not commit it to version control."

# Optional: Verify configuration
echo -e "\n📋 Configuration Summary:"
echo "SMTP Host: $SMTP_HOST"
echo "SMTP Port: $SMTP_PORT"
echo "From Email: $SMTP_FROM"
echo ""
echo "🌐 Mailhog Web Interface: http://localhost:8025" 