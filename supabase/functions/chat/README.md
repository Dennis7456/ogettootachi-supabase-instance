# Chat Edge Function

A production-grade Supabase Edge Function that provides AI-powered chat capabilities using WASM-based embeddings and text generation.

## Features

- **WASM-based AI**: Uses `@xenova/transformers` for client-side model inference
- **Embedding Model**: `all-MiniLM-L6-v2` for semantic search
- **Text Generation**: GPT-2 for response generation
- **Vector Search**: pgvector integration for document retrieval
- **Production Ready**: Comprehensive error handling, logging, and CORS support

## Architecture

```
Client Request → Edge Function → WASM Models → pgvector Search → Response Generation
```

### Components

1. **Embedding Pipeline**: Converts user queries to 384-dimensional vectors
2. **Document Search**: Uses pgvector KNN to find relevant document chunks
3. **Text Generation**: GPT-2 generates contextual responses
4. **Response Assembly**: Combines generated text with source citations

## API Endpoint

### POST `/chat`

**Request Body:**
```json
{
  "query": "What are the requirements for filing a patent application?",
  "topK": 3
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the legal documents, patent applications require...",
  "sources": [
    {
      "id": "uuid-1",
      "content": "Patent applications must include..."
    }
  ]
}
```

## Database Requirements

### Updated `match_documents` Function

The function requires an updated pgvector function:

```sql
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
```

### Documents Table Structure

```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Environment Variables

Required environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

1. **Deploy the function:**
   ```bash
   supabase functions deploy chat
   ```

2. **Run the migration:**
   ```bash
   supabase db push
   ```

3. **Test the function:**
   ```bash
   deno run --allow-net --allow-env test.ts
   ```

## Performance Considerations

- **Cold Start**: First request initializes WASM models (~10-30 seconds)
- **Memory Usage**: Models are kept in memory for subsequent requests
- **Vector Dimensions**: Embeddings are 384-dimensional (all-MiniLM-L6-v2)
- **Response Time**: Subsequent requests typically complete in 1-3 seconds

## Error Handling

The function handles various error scenarios:

- **400 Bad Request**: Invalid input parameters
- **405 Method Not Allowed**: Non-POST requests
- **500 Internal Server Error**: Model inference or database errors
- **503 Service Unavailable**: Model initialization failures

## Logging

Structured JSON logging with levels:
- `info`: General operational events
- `warn`: Non-critical issues
- `error`: Critical failures
- `debug`: Detailed debugging information

## Security

- CORS enabled for cross-origin requests
- Input validation and sanitization
- Anonymous key authentication
- No sensitive data in logs

## Limitations

- **Model Size**: WASM models have size limitations
- **Memory**: Concurrent requests share model instances
- **Cold Starts**: Initial model loading can be slow
- **Token Limits**: GPT-2 generation limited to 128 tokens

## Future Enhancements

- Model quantization for faster loading
- Streaming responses
- Conversation history
- Custom model fine-tuning
- Multi-modal support (images, documents) 