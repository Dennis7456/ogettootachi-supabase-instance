/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from "@supabase/supabase-js";
import { setTimeout } from "timers/promises";

// Test sending invitation to webmastaz2019@gmail.com specifically
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

async function testYourSpecificEmail() {
  const _supabase = createClient(_config.SUPABASE_URL, _config.SUPABASE_ANON_KEY);

  // Your exact email and _data
  const _formData = {
    email: "webmastaz2019@gmail.com",
    role: "",
    full_name: "Web Developer",
  };

  // Check Mailpit BEFORE sending
  const _beforeResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
  const _beforeData = await _beforeResponse.json();

  try {
    // Send the invitation exactly like your UI does
    const { _data, _error } = await _supabase.functions.invoke("handle-invitation", {
      body: {
        email: _formData.email,
        role: _formData.role,
        full_name: _formData.full_name,
      },
    });

    _logError("Invitation invoke error", _error);
    if (_error) return;

    // Wait a bit for email processing
    await setTimeout(3000);

    // Check Mailpit AFTER sending
    const _afterResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const _afterData = await _afterResponse.json();

    if (_afterData.total > _beforeData.total) {
      const _newMessages = _afterData.messages.slice(0, _afterData.total - _beforeData.total);

      _newMessages.forEach((_msg, _index) => {
        console.log(`New message ${_index + 1}:`, _msg);
      });
    }

    // Also check the database
    const _supabaseAdmin = createClient(
      _config.SUPABASE_URL,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    );

    const { _data: _invitations } = await _supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("email", _formData.email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (_invitations && _invitations.length > 0) {
      const _inv = _invitations[0];
      console.log("Latest invitation:", _inv);
    }
  } catch (_error) {
    console.error("Error testing specific email:", _error);
  }
}

testYourSpecificEmail().catch(console.error);
