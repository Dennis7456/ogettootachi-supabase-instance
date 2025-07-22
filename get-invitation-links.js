/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from "@supabase/supabase-js";

const config = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
};

async function getInvitationLinks() {
  const _supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: invitations } = await _supabase
      .from("user_invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (invitations && invitations.length > 0) {
      console.log("Invitation Links:");
      invitations.forEach((invitation, index) => {
        const invitationUrl = `http://localhost:5173/invite/${invitation.id}`;
        const timeAgo = new Date(invitation.created_at).toLocaleString();

        console.log(`${index + 1}. ${invitationUrl} (Created: ${timeAgo})`);
      });

      const latestUrl = `http://localhost:5173/invite/${invitations[0].id}`;
      console.log("\nLatest Invitation Link:", latestUrl);
    } else {
      console.log("No invitations found.");
    }
  } catch (_error) {
    console.error("Error fetching invitation links:", _error);
  }
}

getInvitationLinks().catch(console.error);
