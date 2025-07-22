import { createClient } from '@supabase/supabase-js';

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Function to create a profile for a user
async function createProfileForUser(userId, fullName, role) {
  try {
    const { data, error } = await _supabaseService
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName || 'Unknown User',
        role: role || 'user',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      debugLog('❌ Failed to create profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    debugLog('❌ Unexpected error creating profile:', error);
    return null;
  }
}

const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseMissingProfiles() {
  try {
    // Get all users from auth.users
    const { data: users, error: usersError } =
      await _supabaseService.auth.admin.listUsers();

    if (usersError) {
      debugLog('❌ Failed to list users:', usersError);
      return;
    }

    // Track missing and created profiles
    const missingProfiles = [];
    const createdProfiles = [];

    // Check each user's profile
    for (const _user of users.users) {
      // Check if profile exists
      const { data: _profile, error: profileError } = await _supabaseService
        .from('profiles')
        .select('*')
        .eq('id', _user.id)
        .single();

      if (profileError) {
        // Profile doesn't exist
        missingProfiles.push(_user);

        // Attempt to create profile
        const newProfile = await createProfileForUser(
          _user.id,
          _user.user_metadata?.full_name || _user.email?.split('@')[0],
          _user.user_metadata?.role || 'user'
        );

        if (newProfile) {
          createdProfiles.push(newProfile);
        }
      }
    }

    // Report results
    if (missingProfiles.length > 0) {
      debugLog(
        '❌ Missing profiles for users:',
        missingProfiles.map((_user) => _user.email)
      );
    }

    return {
      totalUsers: users.users.length,
      missingProfiles: missingProfiles.length,
      createdProfiles: createdProfiles.length,
    };
  } catch (error) {
    debugLog('❌ Unexpected error:', error);
  }
}

// If this script is run directly
if (import.meta.main) {
  diagnoseMissingProfiles();
}

export { diagnoseMissingProfiles };
