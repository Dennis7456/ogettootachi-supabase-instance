-- Create a function to handle document processing trigger
CREATE OR REPLACE FUNCTION handle_document_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if embedding is null
  IF NEW.embedding IS NULL THEN
    -- Log the event for debugging
    RAISE LOG 'Document processing triggered for ID: %, Content: %', NEW.id, LEFT(NEW.content, 100);
    
    -- Store the event in a queue table for processing
    INSERT INTO document_processing_queue (document_id, content, created_at)
    VALUES (NEW.id, NEW.content, NOW())
    ON CONFLICT (document_id) DO UPDATE SET
      content = EXCLUDED.content,
      created_at = NOW(),
      processed = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a queue table to track documents that need processing
CREATE TABLE IF NOT EXISTS document_processing_queue (
  document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_process_document ON documents;
CREATE TRIGGER trigger_process_document
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_document_processing();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_document_processing() TO service_role;
GRANT EXECUTE ON FUNCTION handle_document_processing() TO authenticated;
GRANT ALL ON document_processing_queue TO service_role;
GRANT ALL ON document_processing_queue TO authenticated; 