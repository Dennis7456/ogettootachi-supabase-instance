#!/bin/bash

# Exit on any error
set -e

# Database name
DB_NAME="supabase_test_db"

# Detect PostgreSQL version (more compatible method)
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1-2)

# Function to install pgTAP
install_pgtap() {
    echo "Attempting to install pgTAP..."
    
    # Try Homebrew installation
    if command -v brew &> /dev/null; then
        brew install pgtap
    fi

    # Ensure pgTAP is available
    if ! pg_config --sharedir | grep -q pgtap; then
        echo "Downloading and installing pgTAP manually..."
        
        # Create temporary directory
        TEMP_DIR=$(mktemp -d)
        cd "$TEMP_DIR"
        
        # Clone and install pgTAP
        git clone https://github.com/theory/pgtap.git
        cd pgtap
        make
        sudo make install
    fi
}

# Check and install pgTAP if not found
if ! pg_config --sharedir | grep -q pgtap; then
    install_pgtap
fi

# Drop the database if it exists
dropdb --if-exists "$DB_NAME"

# Create the database
createdb "$DB_NAME"

# Connect to the database and set up extensions
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pgtap;"
psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Setup Supabase schema
psql -d "$DB_NAME" -f tests/setup_supabase_schema.sql

# Setup test environment
psql -d "$DB_NAME" -f tests/setup_test_environment.sql

# Run the tests
psql -d "$DB_NAME" -f tests/functions/user_invitation.test.sql

echo "Test database setup and tests completed successfully!" 