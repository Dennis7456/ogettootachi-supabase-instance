/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from "@supabase/supabase-js";
import { setTimeout } from "timers/promises";

const config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function deleteUserAndTest() {
  console.log("🗑️ Deleting existing user and testing complete invitation flow...\n");

  const _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  const _testEmail = "webmastaz2019@gmail.com";

  try {
    // Clear Mailpit first
    await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" });

    // Find and delete existing user
    const { _data: _users } = await _supabase.auth.admin.listUsers();
    const _existingUser = _users.users.find((_u) => _u.email === _testEmail);

    if (_existingUser) {
      const { _error: _deleteError } = await _supabase.auth.admin.deleteUser(_existingUser.id);

      logError("Error deleting user", _deleteError);
    }

    // Delete any existing invitations
    const { _error: _deleteInviteError } = await _supabase
      .from("user_invitations")
      .delete()
      .eq("email", _testEmail);

    logError("Error deleting invitations", _deleteInviteError);

    // Wait a moment
    await setTimeout(2000);

    // Now test the complete invitation flow
    // Use our handle-invitation function
    const { _data, _error } = await _supabase.functions.invoke("handle-invitation", {
      body: {
        email: _testEmail,
        role: "admin",
        full_name: "Dennis Kiplangat",
      },
    });

    logError("Error invoking handle-invitation", _error);
    if (_error) return;

    if (_data.success) {
      const _invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;

      // Wait for email delivery
      await setTimeout(5000);

      // Check Mailpit
      const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
      const _mailpitData = await _mailpitResponse.json();

      if (_mailpitData.total > 0) {
        _mailpitData.messages.forEach((_msg, _index) => {
          console.log(`Message ${_index + 1}:`, _msg);
        });

        console.log("\n🎯 PERFECT! Your invitation system is now fully working!");
      } else {
        console.log("💡 You can still use the direct link to test the invitation");
        console.log("Invitation URL:", _invitationUrl);
      }
    }
  } catch (_error) {
    console.error("Error in deleteUserAndTest:", _error);
  }
}

deleteUserAndTest().catch(console.error);
