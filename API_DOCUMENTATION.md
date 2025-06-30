# Ogetto Otachi Law Firm - Edge Functions API Documentation

## Overview

This document provides comprehensive documentation for the Supabase Edge Functions used by the Ogetto Otachi Law Firm website. All functions are deployed on Supabase and provide secure, scalable backend services.

## Base URL

```
https://your-project-ref.supabase.co/functions/v1/
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

All endpoints are rate-limited to 100 requests per minute per client. Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit window resets
- `Retry-After`: Seconds to wait when rate limit is exceeded

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "statusCode": 400
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Appointments API

### Create Appointment

**POST** `/appointments`

Creates a new appointment request.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "practice_area": "Corporate Law",
  "preferred_date": "2025-02-15",
  "preferred_time": "10:00 AM",
  "message": "I need consultation on business registration"
}
```

#### Required Fields
- `name` (string): Client's full name
- `email` (string): Valid email address
- `practice_area` (string): Legal practice area
- `preferred_date` (string): Date in YYYY-MM-DD format
- `preferred_time` (string): Time in HH:MM or HH:MM AM/PM format

#### Optional Fields
- `phone` (string): Phone number
- `message` (string): Additional message

#### Response
```json
{
  "success": true,
  "message": "Appointment submitted successfully. We will contact you to confirm.",
  "appointment": {
    "id": "uuid",
    "client_name": "John Doe",
    "client_email": "john.doe@example.com",
    "client_phone": "+1234567890",
    "practice_area": "Corporate Law",
    "preferred_date": "2025-02-15",
    "preferred_time": "10:00:00",
    "message": "I need consultation on business registration",
    "status": "pending",
    "created_at": "2025-01-27T10:30:00.000Z"
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### Validation Rules
- Email must be in valid format
- Date cannot be in the past
- Time must be in valid format (HH:MM or HH:MM AM/PM)

### Get Appointments (Admin/Staff Only)

**GET** `/appointments`

Retrieves appointments with optional filtering and pagination.

#### Query Parameters
- `status` (optional): Filter by status (`pending`, `confirmed`, `completed`, `cancelled`)
- `limit` (optional): Number of records to return (1-100, default: 50)
- `offset` (optional): Number of records to skip (default: 0)

#### Example Request
```
GET /appointments?status=pending&limit=20&offset=0
```

#### Response
```json
{
  "success": true,
  "appointments": [
    {
      "id": "uuid",
      "client_name": "John Doe",
      "client_email": "john.doe@example.com",
      "client_phone": "+1234567890",
      "practice_area": "Corporate Law",
      "preferred_date": "2025-02-15",
      "preferred_time": "10:00:00",
      "message": "I need consultation on business registration",
      "status": "pending",
      "notes": null,
      "assigned_to": null,
      "created_by": null,
      "created_at": "2025-01-27T10:30:00.000Z",
      "updated_at": "2025-01-27T10:30:00.000Z"
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Update Appointment (Admin/Staff Only)

**PUT** `/appointments/{id}`

Updates an existing appointment.

#### Request Body
```json
{
  "status": "confirmed",
  "notes": "Client confirmed appointment"
}
```

#### Response
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "appointment": {
    "id": "uuid",
    "status": "confirmed",
    "notes": "Client confirmed appointment",
    "updated_at": "2025-01-27T11:00:00.000Z"
  },
  "timestamp": "2025-01-27T11:00:00.000Z"
}
```

### Delete Appointment (Admin Only)

**DELETE** `/appointments/{id}`

Deletes an appointment.

#### Response
```json
{
  "success": true,
  "message": "Appointment deleted successfully",
  "timestamp": "2025-01-27T11:00:00.000Z"
}
```

---

## Contact Messages API

### Submit Contact Message

**POST** `/contact`

Submits a contact form message.

#### Request Body
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "subject": "Legal Consultation Request",
  "message": "I need legal advice on employment matters",
  "practice_area": "Employment Law"
}
```

#### Required Fields
- `name` (string): Contact person's name
- `email` (string): Valid email address
- `subject` (string): Message subject
- `message` (string): Message content

#### Optional Fields
- `phone` (string): Phone number
- `practice_area` (string): Relevant practice area

#### Response
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you shortly.",
  "contact_message": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "subject": "Legal Consultation Request",
    "message": "I need legal advice on employment matters",
    "practice_area": "Employment Law",
    "status": "new",
    "priority": "normal",
    "created_at": "2025-01-27T10:30:00.000Z"
  }
}
```

### Get Contact Messages (Admin/Staff Only)

**GET** `/contact`

Retrieves contact messages with optional filtering and pagination.

#### Query Parameters
- `status` (optional): Filter by status (`new`, `read`, `in_progress`, `resolved`, `archived`)
- `priority` (optional): Filter by priority (`low`, `normal`, `high`, `urgent`)
- `limit` (optional): Number of records to return (1-100, default: 50)
- `offset` (optional): Number of records to skip (default: 0)

#### Response
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "phone": "+1234567890",
      "subject": "Legal Consultation Request",
      "message": "I need legal advice on employment matters",
      "practice_area": "Employment Law",
      "status": "new",
      "priority": "normal",
      "created_at": "2025-01-27T10:30:00.000Z",
      "updated_at": "2025-01-27T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

## AI Chatbot API

### Send Message

**POST** `/chatbot`

Sends a message to the AI chatbot and receives a response.

#### Request Body
```json
{
  "message": "What are your services for corporate law?",
  "session_id": "user-session-123"
}
```

#### Required Fields
- `message` (string): User's message
- `session_id` (string): Session identifier for conversation tracking

#### Response
```json
{
  "response": "Our corporate law services include business registration, mergers and acquisitions, contract drafting, and compliance consulting. We help businesses navigate legal requirements and protect their interests.",
  "documents": [
    {
      "id": "uuid",
      "title": "Corporate Law Services",
      "content": "Comprehensive corporate legal services...",
      "similarity": 0.85
    }
  ],
  "tokens_used": 150
}
```

#### Features
- **Context-Aware Responses**: Uses legal document embeddings for relevant answers
- **Conversation Tracking**: Stores conversation history with session IDs
- **Token Usage Monitoring**: Tracks OpenAI API token consumption
- **Document References**: Returns relevant legal documents used for responses

---

## Document Processing API

### Process Document (Admin Only)

**POST** `/process-document`

Processes and stores legal documents with AI-generated embeddings.

#### Request Body
```json
{
  "title": "Employment Law Guidelines",
  "content": "Comprehensive guidelines for employment law compliance...",
  "category": "employment",
  "file_path": "/uploads/employment-guidelines.pdf"
}
```

#### Required Fields
- `title` (string): Document title
- `content` (string): Document content

#### Optional Fields
- `category` (string): Document category (default: "general")
- `file_path` (string): Original file path

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Employment Law Guidelines",
    "content": "Comprehensive guidelines for employment law compliance...",
    "category": "employment",
    "file_path": "/uploads/employment-guidelines.pdf",
    "embedding": [0.1, 0.2, 0.3, ...],
    "created_at": "2025-01-27T10:30:00.000Z"
  }
}
```

#### Features
- **AI Embeddings**: Generates vector embeddings using OpenAI
- **Semantic Search**: Enables similarity-based document retrieval
- **Category Organization**: Supports document categorization
- **Content Processing**: Handles large document content

---

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Missing required fields: name, email, practice_area, preferred_date, preferred_time",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "statusCode": 400
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "statusCode": 401
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "error": "Insufficient permissions - admin or staff access required",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "statusCode": 403
}
```

#### Rate Limit Error (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

#### Method Not Allowed (405)
```json
{
  "success": false,
  "error": "Method not allowed",
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

---

## Usage Examples

### JavaScript/TypeScript

```javascript
// Create appointment
const createAppointment = async (appointmentData) => {
  const response = await fetch('/functions/v1/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  
  return await response.json();
};

// Get appointments (with authentication)
const getAppointments = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/functions/v1/appointments?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// Send chatbot message
const sendChatbotMessage = async (token, message, sessionId) => {
  const response = await fetch('/functions/v1/chatbot', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      session_id: sessionId
    })
  });
  
  return await response.json();
};
```

### cURL Examples

```bash
# Create appointment
curl -X POST https://your-project.supabase.co/functions/v1/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "practice_area": "Corporate Law",
    "preferred_date": "2025-02-15",
    "preferred_time": "10:00 AM"
  }'

# Get appointments (authenticated)
curl -X GET "https://your-project.supabase.co/functions/v1/appointments?status=pending&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Send chatbot message
curl -X POST https://your-project.supabase.co/functions/v1/chatbot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your corporate law services?",
    "session_id": "user-123"
  }'
```

---

## Monitoring and Logging

All functions include structured logging with the following information:

- **Request tracking**: Method, path, client ID
- **Performance metrics**: Response time, status codes
- **User context**: User ID, role, authentication status
- **Error details**: Stack traces, error types
- **Business metrics**: Appointment counts, message types

### Log Format
```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "level": "info",
  "message": "Appointment created successfully",
  "service": "appointments-edge-function",
  "environment": "production",
  "method": "POST",
  "path": "/appointments",
  "userId": "user-uuid",
  "userRole": "admin",
  "clientId": "client-identifier",
  "duration": 150,
  "statusCode": 200,
  "metadata": {
    "appointmentId": "appointment-uuid",
    "practiceArea": "Corporate Law"
  }
}
```

---

## Security Considerations

1. **Authentication**: All sensitive endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (admin, staff, user)
3. **Rate Limiting**: Prevents abuse and ensures fair usage
4. **Input Validation**: Comprehensive validation of all inputs
5. **Error Handling**: Secure error messages without sensitive information
6. **CORS**: Proper CORS headers for web client access

---

## Deployment

### Local Development
```bash
# Start Supabase locally
supabase start

# Deploy functions
supabase functions deploy appointments
supabase functions deploy contact
supabase functions deploy chatbot
supabase functions deploy process-document
```

### Production Deployment
```bash
# Deploy to production
supabase functions deploy --project-ref your-project-ref
```

### Environment Variables
Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `ENVIRONMENT`: Environment name (development/production)

---

## Support

For technical support or questions about the API:

1. Check the logs for detailed error information
2. Verify authentication and authorization
3. Ensure proper request format and validation
4. Contact the development team with specific error details

---

*Last updated: January 27, 2025* 