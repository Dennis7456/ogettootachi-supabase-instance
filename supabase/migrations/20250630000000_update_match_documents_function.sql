-- Update match_documents function to match the new chat function signature
-- This function is used by the WASM-based chat edge function

-- Drop the existing function
DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), FLOAT, INT);

-- Create the updated function with the new signature
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content
  FROM documents
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents(VECTOR(1536), INT) TO anon;
GRANT EXECUTE ON FUNCTION match_documents(VECTOR(1536), INT) TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents(VECTOR(1536), INT) TO service_role; 