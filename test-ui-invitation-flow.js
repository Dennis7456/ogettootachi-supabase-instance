/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";

// Test the exact same invitation flow that the React UI uses
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

async function testUIInvitationFlow() {
  const _supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_ANON_KEY);

  // This mimics exactly what UserManagement.jsx does
  const _formData = {
    email: "test-ui-flow@example.com",
    role: "",
    full_name: "UI Test User",
  };

  try {
    // This is exactly what UserManagement.jsx calls
    const { _data, _error } = await _supabase.functions.invoke("handle-invitation", {
      body: {
        email: _formData.email,
        role: _formData.role,
        full_name: _formData.full_name || "",
      },
    });

    _logError("Invitation function error", _error);

    if (_error) {
      return;
    }

    if (!_data || !_data.success) {
      console.warn("Invitation function did not return success");
      return;
    }

    // Wait a moment for email to be processed
    await new Promise((_resolve) => setTimeout(_resolve, 2000));

    // Check Mailpit for new emails
    const _mailpitResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.messages && _mailpitData.messages.length > 0) {
      console.log("Mailpit Messages:");
      _mailpitData.messages.forEach((_msg, _index) => {
        console.log(
          `${_index + 1}. From: ${_msg.From?.Name || _msg.From?.Address || "Unknown"}`,
          `   To: ${_msg.To?.[0]?.Name || _msg.To?.[0]?.Address || "Unknown"}`
        );
      });
    } else {
      console.log("No messages found in Mailpit");
    }

    // Check if there are any recent invitations in the database
    const _supabaseAdmin = createClient(
      _config.SUPABASE_URL,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    );

    const { _data: _invitations, _error: _dbError } = await _supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("email", _formData.email)
      .order("created_at", { ascending: false })
      .limit(1);

    _logError("Database query error", _dbError);

    if (_invitations && _invitations.length > 0) {
      const _invitation = _invitations[0];
      console.log("Latest Invitation:", _invitation);
    } else {
      console.log("No invitations found for the given email");
    }
  } catch (_error) {
    console.error("Unexpected error in UI invitation flow:", _error);
  }
}

testUIInvitationFlow().catch(console.error);
