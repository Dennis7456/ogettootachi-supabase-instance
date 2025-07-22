/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import { setTimeout } from "timers/promises";

// Send fresh invitation to webmastaz2019@gmail.com
const _config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function sendRealInvitation() {
  // Clear Mailpit first
  try {
    await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" });
  } catch (_clearError) {
    console.warn("Error clearing Mailpit messages:", _clearError);
  }

  const _supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_ANON_KEY);

  const _invitationData = {
    email: "webmastaz2019@gmail.com",
    role: "admin", // Making you admin this time,
    full_name: "Dennis Kiplangat",
  };

  try {
    // Send the invitation
    const { _data, _error } = await _supabase.functions.invoke("handle-invitation", {
      body: _invitationData,
    });

    _logError("Invitation error", _error);

    if (_error) {
      return;
    }

    if (_data.success) {
      const _invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;

      console.log("Invitation URL:", _invitationUrl);

      // Wait and check for email
      await setTimeout(5000);

      // Check Mailpit
      const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
      const _mailpitData = await _mailpitResponse.json();

      if (_mailpitData.total > 0) {
        _mailpitData.messages.forEach((_msg, _index) => {
          console.log(`Email message ${_index + 1}:`, _msg);
        });
      } else {
        console.log("No emails found in Mailpit");
      }
    } else {
      console.log("Invitation was not successful");
    }
  } catch (_error) {
    console.error("Error sending invitation:", _error);
  }
}

sendRealInvitation().catch(console.error);
