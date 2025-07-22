/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import { setTimeout } from "timers/promises";

const _config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};

async function testFreshEmail() {
  // Clear Mailpit first
  try {
    await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" });
  } catch (_clearError) {
    console.warn("Error clearing Mailpit messages:", _clearError);
  }

  const _supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_SERVICE_ROLE_KEY);

  const _freshEmail = `test-${Date.now()}@freshtest.com`;

  try {
    // Test invitation method with fresh email
    const { _data: _inviteData, _error: _inviteError } =
      await _supabase.auth.admin.inviteUserByEmail(_freshEmail, {
        _data: {
          role: "staff",
          full_name: "Fresh Test User",
        },
        redirectTo: "http://localhost:5173/password-setup",
      });

    if (_inviteError) {
      console.error("Invitation error:", _inviteError);
      return;
    }

    // Wait for email
    await setTimeout(5000);

    // Check Mailpit
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total > 0) {
      _mailpitData.messages.forEach((_msg, _index) => {
        console.log(`Email message ${_index + 1}:`, _msg);
      });

      console.log("\n🎯 SUCCESS! Supabase Auth is now sending emails to Mailpit!");
    } else {
      // Check Mailpit stats to see what happened
      const _mailpitInfo = await fetch("http://127.0.0.1:54324/api/v1/info");
      const _infoData = await _mailpitInfo.json();

      if (_infoData.SMTPAccepted > 0) {
        console.log(
          "\n🔍 Emails were accepted by SMTP but not stored - this might be a Mailpit issue"
        );
      } else {
        console.log(
          "\n🔍 No SMTP connections were made - Supabase Auth is not using our SMTP config"
        );
      }
    }
  } catch (_error) {
    console.error("Error in fresh email test:", _error);
  }
}

testFreshEmail().catch(console.error);
