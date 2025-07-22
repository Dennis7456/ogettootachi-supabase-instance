/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const _supabaseUrl = "http://127.0.0.1:54321";
const _supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

// Test _data
const _testAppointment = {
  name: "Test User",
  email: "test-user@example.com",
  phone: "+1234567890",
  practice_area: "Corporate Law",
  preferred_date: "2025-07-10",
  preferred_time: "10:00 AM",
  message: "Test appointment message",
};

const _testContactMessage = {
  name: "Test Contact",
  email: "test-contact@example.com",
  phone: "+1234567890",
  subject: "Test Contact Subject",
  message: "This is a test contact message",
  practice_area: "Corporate Law",
};

async function testAppointmentsFunction() {
  try {
    // Test POST - Create appointment
    const _createResponse = await fetch(`${_supabaseUrl}/functions/v1/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(_testAppointment),
    });

    if (_createResponse.ok) {
      const _data = await _createResponse.json();

      console.log("⚠️  GET appointments test skipped (requires authentication)");

      return _data.appointment.id;
    } else {
      const _error = await _createResponse.json();
      _logError("Appointments function error", _error);
      return null;
    }
  } catch (_error) {
    console.error("Error in appointments function:", _error);
    return null;
  }
}

async function testContactFunction() {
  try {
    // Test POST - Create contact message
    const _createResponse = await fetch(`${_supabaseUrl}/functions/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(_testContactMessage),
    });

    if (_createResponse.ok) {
      const _data = await _createResponse.json();

      console.log("⚠️  GET contact messages test skipped (requires authentication)");

      return _data.contact_message.id;
    } else {
      const _error = await _createResponse.json();
      _logError("Contact function error", _error);
      return null;
    }
  } catch (_error) {
    console.error("Error in contact function:", _error);
    return null;
  }
}

async function testErrorCases() {
  // Test invalid appointment data
  try {
    const _invalidAppointment = { ..._testAppointment };
    delete _invalidAppointment.name;

    const _response = await fetch(`${_supabaseUrl}/functions/v1/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(_invalidAppointment),
    });

    if (_response.status === 400) {
      console.log("✅ Invalid appointment data test passed");
    } else {
      console.warn("⚠️ Unexpected response for invalid appointment data");
    }
  } catch (_error) {
    console.error("Error testing invalid appointment:", _error);
  }

  // Test invalid contact data
  try {
    const _invalidContact = { ..._testContactMessage };
    delete _invalidContact.email;

    const _response = await fetch(`${_supabaseUrl}/functions/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(_invalidContact),
    });

    if (_response.status === 400) {
      console.log("✅ Invalid contact data test passed");
    } else {
      console.warn("⚠️ Unexpected response for invalid contact data");
    }
  } catch (_error) {
    console.error("Error testing invalid contact:", _error);
  }
}

async function cleanupTestData(_appointmentId, _contactId) {
  try {
    if (_appointmentId) {
      await _supabase.from("appointments").delete().eq("id", _appointmentId);
    }
    if (_contactId) {
      await _supabase.from("contact_messages").delete().eq("id", _contactId);
    }
  } catch (_error) {
    console.warn("Cleanup failed:", _error.message);
  }
}

async function main() {
  try {
    // Check if Supabase is running
    execSync("supabase status", { stdio: "pipe" });

    // Test functions
    const _appointmentId = await testAppointmentsFunction();
    const _contactId = await testContactFunction();

    await testErrorCases();

    // Cleanup
    await cleanupTestData(_appointmentId, _contactId);
  } catch (_error) {
    console.error("❌ Testing failed:", _error.message);
    throw new Error("Process exit blocked");
  }
}

main();
