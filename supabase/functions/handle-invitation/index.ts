import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Extensive logging for environment variables and configuration
console.log("🌍 Environment Variables:");
console.log(
  "SUPABASE_SERVICE_ROLE_KEY (env):",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);
console.log("SUPABASE_URL (env):", Deno.env.get("SUPABASE_URL"));
console.log("FRONTEND_URL (env):", Deno.env.get("FRONTEND_URL"));

// Hardcoded configuration with fallback to environment variables
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

// Extensive logging for hardcoded configuration
console.log("🔐 Hardcoded Configuration:");
console.log(
  "SUPABASE_SERVICE_ROLE_KEY (hardcoded):",
  SUPABASE_SERVICE_ROLE_KEY,
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY Length:",
  SUPABASE_SERVICE_ROLE_KEY.length,
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY First 10 Chars:",
  SUPABASE_SERVICE_ROLE_KEY.slice(0, 10),
);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Explicit token validation function with extensive logging
function validateServiceRoleToken(providedToken: string): boolean {
  console.log("🔐 Token Validation Details:");
  console.log("Provided Token:", providedToken);
  console.log("Provided Token Length:", providedToken.length);
  console.log("Provided Token First 10 Chars:", providedToken.slice(0, 10));

  console.log("Expected Token:", SUPABASE_SERVICE_ROLE_KEY);
  console.log("Expected Token Length:", SUPABASE_SERVICE_ROLE_KEY.length);
  console.log(
    "Expected Token First 10 Chars:",
    SUPABASE_SERVICE_ROLE_KEY.slice(0, 10),
  );

  // Trim whitespace and compare exact tokens
  const trimmedProvided = providedToken.trim();
  const trimmedExpected = SUPABASE_SERVICE_ROLE_KEY.trim();

  console.log("Trimmed Provided Token:", trimmedProvided);
  console.log("Trimmed Expected Token:", trimmedExpected);

  const isValid = trimmedProvided === trimmedExpected;
  console.log("Token Validation Result:", isValid);

  return isValid;
}

serve(async (req) => {
  console.log("🔍 Invitation Function Called");
  console.log("Request Method:", req.method);
  console.log("Request Headers:", Object.fromEntries(req.headers));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("🌐 CORS Preflight Request");
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate service role authentication
  const authHeader = req.headers.get("Authorization");
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ Missing or Invalid Authorization Header");
    return new Response(
      JSON.stringify({
        error: "Unauthorized: Missing or invalid token",
        details: {
          authHeader: authHeader,
          expectedPrefix: "Bearer ",
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Extract service role key
  const providedToken = authHeader.split(" ")[1];

  // Validate service role key
  if (!validateServiceRoleToken(providedToken)) {
    console.error("❌ Token Validation Failed");
    return new Response(
      JSON.stringify({
        error: "Unauthorized: Invalid service role key",
        details: {
          providedTokenLength: providedToken.length,
          expectedTokenLength: SUPABASE_SERVICE_ROLE_KEY.length,
        },
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Parse invitation payload
    const { email, role, department, custom_message, full_name } =
      await req.json();

    console.log("📧 Invitation Details:", {
      email,
      role,
      department,
      hasCustomMessage: !!custom_message,
      fullName: full_name,
    });

    // Validate required fields
    if (!email || !role) {
      console.error("❌ Missing Required Fields");
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Construct invitation link
    const invitationLink = `${FRONTEND_URL}/invitation?token=${invitationToken}`;

    // Prepare email body
    const emailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invitation to Ogetto, Otachi & Co Advocates</title>
</head>
<body>
    <h1>You've Been Invited</h1>
    <p>You have been invited to join Ogetto, Otachi & Co Advocates</p>
    
    <h2>Invitation Details:</h2>
    <ul>
        <li><strong>Role:</strong> ${role}</li>
        ${department ? `<li><strong>Department:</strong> ${department}</li>` : ""}
    </ul>

    ${
      custom_message
        ? `
    <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
        <h3>Personal Message:</h3>
        <p>${custom_message}</p>
    </div>
    `
        : ""
    }

    <p>To accept your invitation, click the link below:</p>
    <a href="${invitationLink}">Accept Invitation</a>

    <p>Invitation Code: <strong>${invitationToken.slice(0, 6)}</strong></p>
</body>
</html>
    `;

    // Send email (mock for local development)
    console.log("📧 Sending invitation email:", {
      to: email,
      subject: "Invitation to Ogetto, Otachi & Co Advocates",
      invitationLink,
    });

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent",
        invitationToken,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Invitation Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process invitation",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
