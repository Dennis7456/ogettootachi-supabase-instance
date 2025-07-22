import { createClient } from "@supabase/supabase-js";

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === "true") {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
      .join(" ");
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

const supabaseUrl = "http://localhost:54321";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  try {
    // List existing buckets
    const { data: buckets, error: bucketsError } = await _supabase.storage.listBuckets();

    if (bucketsError) {
      debugLog("❌ Error listing buckets:", bucketsError.message);
      return;
    }

    debugLog(
      "Found buckets:",
      buckets.map((b) => b.name)
    );

    // Check if documents bucket exists
    const documentsBucket = buckets.find((bucket) => bucket.name === "documents");
    if (!documentsBucket) {
      const { data: _newBucket, error: createError } = await _supabase.storage.createBucket(
        "documents",
        {
          public: false,
          allowedMimeTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ],
          fileSizeLimit: 10485760, // 10MB
        }
      );

      if (createError) {
        debugLog("❌ Failed to create documents bucket:", createError.message);
        return;
      }
    }

    // Check if public bucket exists
    const publicBucket = buckets.find((bucket) => bucket.name === "public");
    if (!publicBucket) {
      const { data: _newPublicBucket, error: createPublicError } =
        await _supabase.storage.createBucket("public", {
          public: true,
        });

      if (createPublicError) {
        debugLog("❌ Failed to create public bucket:", createPublicError.message);
        return;
      }
    }

    // Check if blog-images bucket exists
    const blogImagesBucket = buckets.find((bucket) => bucket.name === "blog-images");
    if (!blogImagesBucket) {
      const { data: _newBlogBucket, error: createBlogError } = await _supabase.storage.createBucket(
        "blog-images",
        {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
          fileSizeLimit: 5242880, // 5MB
        }
      );

      if (createBlogError) {
        debugLog("❌ Failed to create blog-images bucket:", createBlogError.message);
        return;
      }
    }

    // Verify all buckets exist
    const { data: finalBuckets, error: finalError } = await _supabase.storage.listBuckets();

    if (finalError) {
      debugLog("❌ Error listing final buckets:", finalError.message);
      return;
    }

    debugLog(
      "✅ All buckets:",
      finalBuckets.map((b) => b.name)
    );

    const requiredBuckets = ["documents", "public", "blog-images"];
    const missingBuckets = requiredBuckets.filter(
      (name) => !finalBuckets.find((b) => b.name === name)
    );

    if (missingBuckets.length > 0) {
      debugLog("❌ Missing buckets:", missingBuckets);
    } else {
      debugLog("✅ All required buckets are present");
    }
  } catch (error) {
    debugLog("❌ Unexpected error:", error.message);
  }
}

setupStorageBuckets();
