#!/bin/bash

# Email Configuration Setup Script for Ogetto, Otachi & Co Advocates

echo "🔧 Supabase Email Configuration Setup"
echo "====================================="

# Prompt for SMTP details
read -p "Enter SMTP Host (default: smtp.gmail.com): " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "Enter SMTP Port (default: 587): " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "Enter SMTP Username: " SMTP_USERNAME
read -sp "Enter SMTP Password: " SMTP_PASSWORD
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