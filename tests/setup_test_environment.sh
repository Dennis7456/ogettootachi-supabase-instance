#!/bin/bash

# Exit on any error
set -e

# Detect PostgreSQL version
PG_VERSION=$(psql --version | awk '{print $3}' | cut -d. -f1-2)

# Function to install pgTAP
install_pgtap() {
    echo "Installing pgTAP..."
    
    # Uninstall existing pgTAP if needed
    brew uninstall pgtap || true
    
    # Ensure PostgreSQL is linked
    brew link postgresql@14
    
    # Install pgTAP
    brew install pgtap
}

# Verify and install pgTAP
verify_pgtap() {
    # Check if pgTAP is installed
    if ! pg_config --sharedir | grep -q pgtap; then
        install_pgtap
    fi
}

# Prepare test database
prepare_test_db() {
    local DB_NAME="supabase_test_db"
    
    # Drop existing database
    dropdb --if-exists "$DB_NAME"
    
    # Create new database
    createdb "$DB_NAME"
    
    # Connect and set up extensions
    psql -d "$DB_NAME" <<EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgtap;
EOF
}

# Main execution
main() {
    verify_pgtap
    prepare_test_db
    
    echo "Test environment setup completed successfully!"
}

# Run the main function
main 