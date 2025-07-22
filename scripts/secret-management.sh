#!/bin/bash

# Secret Management Script

# Function to check for potential secret leaks
check_secrets() {
    echo "🕵️ Scanning for potential secret leaks..."
    
    # Use ripgrep to find potential secrets
    rg -g '!*test*' -g '!*backup*' -e 'key=' -e 'secret=' -e 'token=' -e 'password=' \
       --no-filename --no-line-number
}

# Function to rotate Supabase keys
rotate_supabase_keys() {
    echo "🔄 Rotating Supabase Keys..."
    
    # Prompt for new keys
    read -p "Enter new Supabase Anon Key: " ANON_KEY
    read -p "Enter new Supabase Service Role Key: " SERVICE_ROLE_KEY
    
    # Set new secrets (replace with your actual Supabase CLI command)
    supabase secrets set SUPABASE_ANON_KEY="$ANON_KEY"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
    
    echo "✅ Supabase keys rotated successfully"
}

# Function to setup .env file
setup_env() {
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "🆕 Creating .env file..."
        cat > .env << EOL
# Supabase Credentials
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI API
OPENAI_API_KEY=

# Email Service
RESEND_API_KEY=

# Frontend Configuration
FRONTEND_URL=

# Environment Mode
NODE_ENV=development
EOL
        echo "✅ .env template created. Please fill in your secrets."
    else
        echo "⚠️ .env file already exists. Skipping creation."
    fi
}

# Main menu
main_menu() {
    echo "🔐 Secret Management Tool"
    echo "1. Check for Secret Leaks"
    echo "2. Rotate Supabase Keys"
    echo "3. Setup .env File"
    echo "4. Exit"
    
    read -p "Choose an option (1-4): " choice
    
    case $choice in
        1) check_secrets ;;
        2) rotate_supabase_keys ;;
        3) setup_env ;;
        4) exit 0 ;;
        *) echo "Invalid option" ;;
    esac
}

# Run the main menu
main_menu 