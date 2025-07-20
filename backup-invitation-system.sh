#!/bin/bash

# Backup script for invitation system critical files

BACKUP_DIR="invitation-system-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup in: $BACKUP_DIR"

mkdir -p "$BACKUP_DIR"

# Backup critical configuration files
echo "🔧 Backing up configuration files..."
cp config/auth.toml "$BACKUP_DIR/"
cp config.toml "$BACKUP_DIR/"

# Backup Edge Functions
echo "⚡ Backing up Edge Functions..."
mkdir -p "$BACKUP_DIR/functions"
cp -r supabase/functions/handle-invitation "$BACKUP_DIR/functions/"
cp -r supabase/functions/send-invitation-email "$BACKUP_DIR/functions/"

# Backup test scripts
echo "🧪 Backing up test scripts..."
cp test-invitation-system-complete.js "$BACKUP_DIR/"
cp monitor-invitation-system.js "$BACKUP_DIR/"
cp quick-test-invitation.js "$BACKUP_DIR/"

# Backup database schema (if available)
echo "🗄️ Backing up database schema..."
if command -v supabase &> /dev/null; then
    supabase db dump --schema public > "$BACKUP_DIR/schema.sql" 2>/dev/null || echo "⚠️ Could not backup schema"
fi

# Create restore instructions
cat > "$BACKUP_DIR/RESTORE_INSTRUCTIONS.md" << EOF
# Invitation System Restore Instructions

## To restore from this backup:

### 1. Configuration Files:
\`\`\`bash
cp auth.toml ../config/
cp config.toml ../
\`\`\`

### 2. Edge Functions:
\`\`\`bash
cp -r functions/handle-invitation ../supabase/functions/
cp -r functions/send-invitation-email ../supabase/functions/
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email
\`\`\`

### 3. Test Scripts:
\`\`\`bash
cp *.js ../
\`\`\`

### 4. Verify Restore:
\`\`\`bash
cd ..
node test-invitation-system-complete.js
\`\`\`

**Created:** $(date)
**From:** $(pwd)
EOF

echo "✅ Backup completed: $BACKUP_DIR"
echo "📝 Total files backed up: $(find "$BACKUP_DIR" -type f | wc -l)"
echo "💾 Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "💡 To restore, follow instructions in: $BACKUP_DIR/RESTORE_INSTRUCTIONS.md" 