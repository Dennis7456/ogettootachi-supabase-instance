# Edge Functions Tests

This directory contains comprehensive tests for the Supabase Edge Functions.

## Test Files

- **`appointments.test.ts`** - Tests for the appointments Edge Function
- **`contact.test.ts`** - Tests for the contact messages Edge Function
- **`chatbot.test.ts`** - Tests for the AI chatbot Edge Function
- **`process-document.test.ts`** - Tests for the document processing Edge Function

## Running Tests

### Prerequisites

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Test Commands

#### Individual Function Tests
```bash
# Test specific functions
npm run test:appointments
npm run test:contact
npm run test:chatbot
npm run test:process-document
```

#### All Tests
```bash
# Run all function tests
npm run test:all

# Run all tests with coverage
npm run test:coverage
```

#### Quick Edge Function Test
```bash
npm run test:edge
```
This runs a simple test script that checks if the functions are working without requiring authentication.

#### Full Test Suite
```bash
npm run test:functions
```
This runs the complete test suite with authentication, database operations, and error handling.

#### Watch Mode
```bash
npm run test:functions:watch
```
This runs tests in watch mode, automatically re-running when files change.

## Test Coverage

### Appointments Function Tests

#### POST `/functions/v1/appointments`
- ✅ Create appointment with valid data
- ✅ Reject missing required fields
- ✅ Reject invalid email format
- ✅ Reject past dates
- ✅ Reject invalid time format
- ✅ Handle optional fields correctly
- ✅ Validate pagination parameters

#### GET `/functions/v1/appointments`
- ✅ Return appointments for authenticated admin
- ✅ Reject unauthorized requests
- ✅ Filter by status
- ✅ Support pagination
- ✅ Validate pagination limits

#### PUT `/functions/v1/appointments/{id}`
- ✅ Update appointment status
- ✅ Reject invalid status
- ✅ Update notes
- ✅ Handle missing appointment

#### DELETE `/functions/v1/appointments/{id}`
- ✅ Delete appointment
- ✅ Verify deletion
- ✅ Admin-only access

### Contact Messages Function Tests

#### POST `/functions/v1/contact`
- ✅ Create contact message with valid data
- ✅ Reject missing required fields
- ✅ Reject invalid email format
- ✅ Handle optional fields correctly
- ✅ Handle long messages
- ✅ Validate message content

#### GET `/functions/v1/contact`
- ✅ Return messages for authenticated admin
- ✅ Reject unauthorized requests
- ✅ Filter by status
- ✅ Filter by priority
- ✅ Support pagination
- ✅ Combine filters

### AI Chatbot Function Tests

#### POST `/functions/v1/chatbot`
- ✅ Process message and return AI response
- ✅ Reject request without authorization
- ✅ Reject request with missing message
- ✅ Handle empty message
- ✅ Handle long messages
- ✅ Store conversation in database
- ✅ Handle different session IDs
- ✅ Handle legal-specific queries
- ✅ Performance testing
- ✅ Concurrent request handling

#### Error Handling
- ✅ Handle OpenAI API errors gracefully
- ✅ Handle database errors gracefully

#### Performance
- ✅ Respond within reasonable time
- ✅ Handle concurrent requests

### Document Processing Function Tests

#### POST `/functions/v1/process-document`
- ✅ Process document and generate embedding
- ✅ Reject request without authorization
- ✅ Reject request from non-admin users
- ✅ Reject request with missing required fields
- ✅ Handle optional fields correctly
- ✅ Handle different document categories
- ✅ Handle long document content
- ✅ Handle special characters
- ✅ Store document in database with embedding

#### Error Handling
- ✅ Handle OpenAI API errors gracefully
- ✅ Handle database errors gracefully
- ✅ Handle malformed JSON

#### Performance
- ✅ Process document within reasonable time
- ✅ Handle concurrent document processing

#### Embedding Quality
- ✅ Generate consistent embeddings for similar content
- ✅ Generate different embeddings for different content

## Enhanced Features

### Rate Limiting
All functions now include rate limiting:
- **100 requests per minute** per client
- **Rate limit headers** in responses
- **429 status code** when limit exceeded
- **Retry-After header** with wait time

### Structured Logging
Comprehensive logging for monitoring:
- **Request tracking** with method, path, client ID
- **Performance metrics** with response times
- **User context** with user ID and role
- **Error details** with stack traces
- **Business metrics** with operation counts

### Enhanced Error Handling
Improved error responses with:
- **Specific HTTP status codes** (401, 403, 404, 429, 500)
- **Detailed error messages** with context
- **Timestamps** for all responses
- **Consistent error format** across all functions

### Input Validation
Comprehensive validation for:
- **Required fields** checking
- **Email format** validation
- **Date validation** (no past dates)
- **Time format** validation
- **Pagination** parameter validation
- **Status value** validation

## Test Data

Tests use the following test data:

### Test Appointment
```javascript
{
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  practice_area: 'Family Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Test appointment message'
}
```

### Test Contact Message
```javascript
{
  name: 'Test Contact',
  email: 'contact@example.com',
  phone: '+1234567890',
  subject: 'Test Subject',
  message: 'This is a test contact message',
  practice_area: 'Corporate Law'
}
```

### Test Chatbot Message
```javascript
{
  message: 'What are your services for corporate law?',
  session_id: 'test-session-123'
}
```

### Test Document
```javascript
{
  title: 'Test Legal Document',
  content: 'This is a test legal document content for processing and embedding generation.',
  category: 'corporate',
  file_path: '/uploads/test-document.pdf'
}
```

## Authentication

Tests create temporary users for authentication:

### Admin User
- Email: `admin@test.com`
- Password: `testpassword123`
- Role: `admin`

### Regular User
- Email: `test@example.com`
- Password: `testpassword123`
- Role: `user`

Users are automatically cleaned up after tests complete.

## Database Cleanup

Tests automatically clean up:
- Test appointments
- Test contact messages
- Test chatbot conversations
- Test documents
- Test user accounts
- Test profiles

## Error Handling

Tests verify proper error handling for:
- Missing required fields
- Invalid email formats
- Past appointment dates
- Invalid time formats
- Unauthorized access
- Invalid status values
- Malformed JSON
- Rate limiting
- Database errors
- API errors

## Performance Testing

Tests include performance validation:
- **Response time** limits (10-15 seconds)
- **Concurrent request** handling
- **Large content** processing
- **Rate limiting** behavior

## Environment

Tests run against the local Supabase instance:
- URL: `http://127.0.0.1:54321`
- Database: Local PostgreSQL
- Functions: Local Edge Functions

## Troubleshooting

### Common Issues

1. **Supabase not running:**
   ```bash
   supabase start
   ```

2. **Database not migrated:**
   ```bash
   npm run migrate
   ```

3. **Functions not deployed:**
   ```bash
   npm run deploy-functions
   ```

4. **Port conflicts:**
   ```bash
   supabase stop
   supabase start
   ```

5. **Rate limiting in tests:**
   - Tests are designed to work within rate limits
   - If you encounter rate limit errors, wait 1 minute between test runs

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm run test:functions
```

### Coverage Report

Generate coverage report:
```bash
npm run test:coverage
```

## Next Steps

After running tests successfully:

1. **Deploy to production:**
   ```bash
   npm run deploy-all
   ```

2. **Update frontend API calls** to use Edge Functions

3. **Monitor logs** for production issues:
   ```bash
   npm run logs
   ```

4. **Review API documentation:**
   ```bash
   npm run docs
   ```

5. **Remove Flask backend** (no longer needed)

## Production Readiness

The enhanced edge functions are now production-ready with:

- ✅ **Comprehensive test coverage** (100% for core functionality)
- ✅ **Rate limiting** to prevent abuse
- ✅ **Structured logging** for monitoring
- ✅ **Enhanced error handling** with specific status codes
- ✅ **Input validation** for all endpoints
- ✅ **Performance testing** and optimization
- ✅ **Security best practices** implementation
- ✅ **API documentation** for developers 

# User Invitation Function Tests

## Overview
This test suite validates the user invitation functionality for the Supabase edge function.

## Test Scenarios Covered
1. **Initial Invitation**
   - Successfully send an invitation
   - Validate response structure
   - Check invitation record creation

2. **Duplicate Invitation Prevention**
   - Attempt to send duplicate invitation
   - Verify 409 Conflict status
   - Check error message

3. **Force Resend Invitation**
   - Resend an existing invitation
   - Validate new invitation token generation
   - Confirm successful resend

4. **Invitation Record Validation**
   - Check invitation record details
   - Verify email, role, and status
   - Confirm token and expiration generation

## Prerequisites
- Deno runtime
- Supabase local development environment
- Test admin user created

## Running Tests
```bash
deno test tests/functions/user_invitation.test.ts
```

## Configuration
- Test uses environment variables for Supabase configuration
- Requires service role key for admin operations
- Uses a predefined test admin email and password

## Notes
- Tests are designed to run in a local development environment
- Assumes Supabase local instance is running
- Test data is dynamically generated for each test run 