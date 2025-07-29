# Appointment Booking System

This document provides an overview of the appointment booking system implementation for the law firm website.

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Components](#frontend-components)
3. [Backend Implementation](#backend-implementation)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)

## System Overview

The appointment booking system allows clients to schedule consultations with the law firm. The system includes:

- A public-facing appointment form for clients
- Admin dashboard for managing appointments
- Backend API for appointment CRUD operations
- Supabase database for storing appointment data
- Comprehensive test suite

## Frontend Components

### Public Appointment Form (`AppointmentScheduling.jsx`)

- Collects client information (name, email, phone)
- Allows selection of practice area
- Date and time selection for the appointment
- Form validation and submission handling
- Success/error feedback to the user

### Admin Dashboard Appointment Management

- View all appointments with filtering options
- Update appointment status (pending, confirmed, cancelled, completed)
- View appointment details
- Delete appointments

## Backend Implementation

The backend follows a layered architecture:

### Model Layer (`appointment.model.js`)

- Direct database interactions using Supabase client
- CRUD operations for appointments
- Query methods for filtering appointments

### Service Layer (`appointment.service.js`)

- Business logic for appointments
- Data validation
- Error handling
- Status management

### Controller Layer (`appointment.controller.js`)

- API endpoint handlers
- Request/response formatting
- Error handling for HTTP responses

### Routes (`appointment.routes.js`)

- API route definitions
- Authentication middleware for protected routes

## Database Schema

The `appointments` table includes:

- `id`: UUID primary key
- `client_name`: Client's full name
- `client_email`: Client's email address
- `client_phone`: Client's phone number (optional)
- `practice_area`: Selected practice area
- `preferred_date`: Requested appointment date
- `preferred_time`: Requested appointment time
- `message`: Additional notes from client
- `status`: Appointment status (pending, confirmed, cancelled, completed)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `created_by`: Reference to user who created the appointment (optional)

## API Endpoints

| Method | Endpoint                    | Description                      | Authentication |
|--------|----------------------------|----------------------------------|----------------|
| POST   | `/api/appointments`         | Create a new appointment         | Public         |
| GET    | `/api/appointments`         | Get all appointments with filters | Required       |
| GET    | `/api/appointments/:id`     | Get appointment by ID            | Required       |
| PUT    | `/api/appointments/:id`     | Update appointment details       | Required       |
| PUT    | `/api/appointments/:id/status` | Update appointment status     | Required       |
| DELETE | `/api/appointments/:id`     | Delete an appointment            | Required       |

## Testing

### Frontend Tests

1. **E2E Tests**
   - Navigation to appointment form
   - Form display and validation
   - Submission success and error handling

2. **Unit Tests**
   - Component rendering
   - Form validation
   - API interaction
   - State management

### Backend Tests

1. **Unit Tests**
   - Model methods
   - Service layer validation and business logic
   - Controller request/response handling

2. **Integration Tests**
   - API endpoint functionality
   - Database interactions

## Getting Started

1. **Setup Database**
   - Run the migration script in `migrations/create_appointments_table.sql`

2. **Run Backend Tests**
   ```
   cd ogettootachi-supabase-backend
   npm test
   ```

3. **Run Frontend Tests**
   ```
   cd ogetto-otachi-frontend
   npm test
   ```

4. **Run E2E Tests**
   ```
   cd ogetto-otachi-frontend
   npm run test:e2e
   ``` 