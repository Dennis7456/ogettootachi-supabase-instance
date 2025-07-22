/* eslint-disable no-console, no-undef */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const _supabaseUrl = process.env.SUPABASE_URL || "http://localhost:54321";
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function testEdgeFunction() {
  try {
    // Step 1: Create a test document in the database
    const { _data: _docData, _error: _docError } = await _supabase
      .from("documents")
      .insert({
        title: "Edge Function Test Document",
        content: "This is a test document for edge function testing",
        category: "test",
        file_path: "edge-function-test.txt",
        file_type: "text/plain",
      })
      .select()
      .single();

    _logError("Document creation failed", _docError);

    if (!_docData) {
      console.error("❌ No document data returned");
      return;
    }

    // Step 2: Test Edge Function with the document
    const { _data: _functionData, _error: _functionError } = await _supabase.functions.invoke(
      "process-document",
      {
        body: { record: _docData },
      }
    );

    _logError("Edge Function failed", _functionError);

    if (_functionError) {
      // Check if it's a deployment issue
      if (_functionError.message.includes("not found") || _functionError.message.includes("404")) {
        console.warn("⚠️ Edge Function might not be deployed");
      }
      return;
    }

    // Step 4: Test with different content
    const _longContent = `
      This is a longer test document for Edge Function debugging. 
      It contains multiple paragraphs and should test the content length limits.
      The Edge Function should process this content and generate embeddings.
      This document is specifically designed to test the document processing pipeline.
      It includes various types of text content to ensure proper processing.
    `.trim();

    const { _data: _longDocData, _error: _longDocError } = await _supabase
      .from("documents")
      .insert({
        title: "Long Test Document",
        content: _longContent,
        category: "test",
        file_path: "long-test-document.txt",
        file_type: "text/plain",
      })
      .select()
      .single();

    _logError("Long document creation failed", _longDocError);

    if (_longDocData) {
      const { _data: _longFunctionData, _error: _longFunctionError } =
        await _supabase.functions.invoke("process-document", {
          body: { record: _longDocData },
        });

      _logError("Long document Edge Function failed", _longFunctionError);

      if (!_longFunctionError) {
        console.log("✅ Long document Edge Function succeeded:", _longFunctionData);
      }
    }

    // Cleanup
    try {
      await _supabase.from("documents").delete().eq("id", _docData.id);

      if (_longDocData) {
        await _supabase.from("documents").delete().eq("id", _longDocData.id);
      }
    } catch (_cleanupError) {
      console.warn("Cleanup failed:", _cleanupError.message);
    }
  } catch (_error) {
    console.error("❌ Test failed:", _error.message);
    console.error("Error details:", _error);
  }
}

// Run the test
testEdgeFunction();
