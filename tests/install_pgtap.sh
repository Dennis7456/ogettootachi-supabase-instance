#!/bin/bash

# Exit on any error
set -e

# Find PostgreSQL configuration
find_pg_config() {
    # Try multiple locations
    local pg_config_paths=(
        "/opt/homebrew/bin/pg_config"
        "/usr/local/bin/pg_config"
        "/opt/homebrew/opt/postgresql@14/bin/pg_config"
        "/opt/homebrew/opt/libpq/bin/pg_config"
    )

    for path in "${pg_config_paths[@]}"; do
        if [ -x "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    echo "Error: pg_config not found" >&2
    return 1
}

# Detect PostgreSQL version and paths
PG_CONFIG=$(find_pg_config)
PG_VERSION=$("$PG_CONFIG" --version | awk '{print $2}' | cut -d. -f1-2)
PG_SHARE_DIR=$("$PG_CONFIG" --sharedir)
PGXS_DIR=$("$PG_CONFIG" --pkglibdir)/pgxs

# Function to install PostgreSQL development files
install_pg_dev() {
    echo "Installing PostgreSQL development files..."
    brew install postgresql@14
    brew link postgresql@14
}

# Function to install pgTAP
install_pgtap() {
    echo "Installing pgTAP for PostgreSQL $PG_VERSION..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Clone pgTAP repository
    git clone https://github.com/theory/pgtap.git
    cd pgtap
    
    # Build and install with explicit pg_config
    make PG_CONFIG="$PG_CONFIG"
    sudo make install PG_CONFIG="$PG_CONFIG"
    
    # Find and copy SQL files more robustly
    SQL_FILES=(
        "sql/pgtap--1.3.4.sql"
        "sql/pgtap-core--1.3.4.sql"
        "sql/pgtap-schema--1.3.4.sql"
    )

    for sql_file in "${SQL_FILES[@]}"; do
        if [ -f "$sql_file" ]; then
            sudo cp "$sql_file" "$PG_SHARE_DIR/extension/"
        else
            echo "Warning: SQL file $sql_file not found"
        fi
    done

    # Ensure control file is copied
    if [ -f pgtap.control ]; then
        sudo cp pgtap.control "$PG_SHARE_DIR/extension/"
    else
        echo "Error: pgtap.control not found"
        return 1
    fi
}

# Verify pgTAP installation
verify_pgtap() {
    # Check if pgTAP control file exists
    if [ ! -f "$PG_SHARE_DIR/extension/pgtap.control" ]; then
        install_pgtap
    fi

    # Verify Perl TAP parser
    if ! perl -e 'use TAP::Parser::SourceHandler::pgTAP' 2>/dev/null; then
        echo "Installing Perl TAP parser..."
        sudo cpan TAP::Parser::SourceHandler::pgTAP
    fi
}

# Main execution
main() {
    # Ensure PostgreSQL development files are installed
    if [ ! -d "$PGXS_DIR" ]; then
        install_pg_dev
    fi

    verify_pgtap
    echo "pgTAP installation complete for PostgreSQL $PG_VERSION"
}

# Run the main function
main 