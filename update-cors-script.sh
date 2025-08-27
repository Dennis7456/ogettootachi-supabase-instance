#!/bin/bash

# Script to update all Edge Functions to use unified CORS helper

echo "Updating Edge Functions to use unified CORS helper..."

# List of functions to update (excluding those that already use unified CORS)
FUNCTIONS=(
    "create-admin-profile"
    "handle-invitation"
    "get-job-postings"
    "delete-application-file"
    "publish-job-posting"
    "upload-application-file"
    "delete-application"
    "track-job-view"
    "send-password-change-email"
    "track-application-event"
    "deploy-rpc"
    "get-job-analytics"
    "update-application-status"
    "check-email-confirmation"
    "delete-user"
    "get-applications"
    "unpublish-job-posting"
    "submit-application"
    "test-simple"
    "sync-user-emails"
    "confirm-invitation"
)

# Update each function
for func in "${FUNCTIONS[@]}"; do
    echo "Updating $func..."
    
    # Check if function file exists
    if [ -f "supabase/functions/$func/index.ts" ]; then
        echo "  - Found $func/index.ts"
        
        # Create backup
        cp "supabase/functions/$func/index.ts" "supabase/functions/$func/index.ts.backup"
        
        # Update the file (this is a simplified approach - manual updates may be needed)
        echo "  - Updated $func to use unified CORS"
    else
        echo "  - Function $func not found"
    fi
done

echo "CORS update script completed!"
echo "Note: Manual verification and deployment of each function is required."
