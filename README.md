# Ogetto Otachi Law Firm - Backend Application

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Edge Functions](#edge-functions)
- [Authentication & Authorization](#authentication--authorization)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring & Logging](#monitoring--logging)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏢 Overview

The Ogetto Otachi Law Firm backend is a comprehensive Supabase-based backend-as-a-service (BaaS) solution that provides a robust foundation for the law firm's digital operations. Built on PostgreSQL with real-time capabilities, the backend handles authentication, data management, file storage, and business logic through Edge Functions.

### Key Highlights
- **Supabase BaaS**: PostgreSQL database with real-time subscriptions
- **Edge Functions**: Serverless functions for business logic
- **Row Level Security (RLS)**: Granular data access control
- **Real-time Features**: Live updates and notifications
- **File Storage**: Secure document and image management
- **Email Integration**: Automated email notifications
- **Analytics**: Comprehensive tracking and reporting

## 🏗 Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   External      │
│   (React)       │◄──►│   Backend       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - Web App       │    │ - PostgreSQL    │    │ - Email Service │
│ - Mobile App    │    │ - Auth          │    │ - Storage       │
│ - Admin Panel   │    │ - Storage       │    │ - Analytics     │
└─────────────────┘    │ - Edge Functions│    └─────────────────┘
                       └─────────────────┘
```

### Database Architecture
- **PostgreSQL**: Primary database with advanced features
- **Row Level Security (RLS)**: Column and row-based access control
- **Real-time Subscriptions**: Live data updates
- **Foreign Key Relationships**: Referential integrity
- **Indexing Strategy**: Optimized query performance

### Edge Functions Architecture
- **Deno Runtime**: TypeScript-based serverless functions
- **Modular Design**: Separated by business domain
- **Shared Utilities**: Common functionality across functions
- **Error Handling**: Comprehensive error management
- **CORS Support**: Cross-origin resource sharing

## 🛠 Technology Stack

### Core Platform
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL 15**: Primary database
- **Deno**: Edge function runtime
- **TypeScript**: Type-safe development

### Database & Storage
- **PostgreSQL**: Relational database
- **Supabase Storage**: File storage service
- **Row Level Security**: Data access control
- **Real-time Subscriptions**: Live data updates

### Authentication & Security
- **Supabase Auth**: JWT-based authentication
- **Row Level Security**: Database-level security
- **CORS**: Cross-origin resource sharing
- **JWT Tokens**: Secure session management

### Development Tools
- **Supabase CLI**: Command-line interface
- **Node.js**: Development environment
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

### External Integrations
- **Email Services**: Automated notifications
- **File Upload**: Document management
- **Analytics**: Usage tracking
- **Monitoring**: Performance monitoring

## 🗄 Database Schema

### Core Tables

#### Users & Authentication
```sql
-- Profiles table (extends Supabase auth.users)
profiles (
  id uuid references auth.users,
  email text,
  full_name text,
  role text check (role in ('admin', 'staff', 'client')),
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)

-- User invitations
user_invitations (
  id uuid primary key,
  email text not null,
  invitation_token text unique,
  status text default 'pending',
  invited_by uuid references profiles(id),
  expires_at timestamp with time zone,
  created_at timestamp with time zone
)
```

#### Content Management
```sql
-- Practice areas
practice_areas (
  id uuid primary key,
  title text not null,
  description text,
  content text,
  image_url text,
  is_public boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)

-- Blog posts
blog_posts (
  id uuid primary key,
  title text not null,
  content text,
  excerpt text,
  featured_image text,
  is_published boolean default false,
  published_at timestamp with time zone,
  author_id uuid references profiles(id),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)

-- Team members
team_members (
  id uuid primary key,
  name text not null,
  position text,
  bio text,
  image_url text,
  professional_image text,
  is_active boolean default true,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
```

#### Business Operations
```sql
-- Appointments
appointments (
  id uuid primary key,
  client_name text not null,
  client_email text not null,
  client_phone text,
  appointment_date timestamp with time zone,
  appointment_type text,
  status text default 'pending',
  notes text,
  assigned_to uuid references profiles(id),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)

-- Job postings
job_postings (
  id uuid primary key,
  title text not null,
  description text,
  requirements text,
  location text,
  type text,
  status text default 'draft',
  is_public boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)

-- Job applications
job_applications (
  id uuid primary key,
  job_id uuid references job_postings(id),
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  resume_url text,
  cover_letter text,
  status text default 'pending',
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
```

#### Communication & Analytics
```sql
-- Contact messages
contact_messages (
  id uuid primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'unread',
  created_at timestamp with time zone
)

-- Notifications
notifications (
  id uuid primary key,
  user_id uuid references profiles(id),
  title text not null,
  message text not null,
  type text,
  is_read boolean default false,
  created_at timestamp with time zone
)

-- Analytics
analytics_pageviews (
  id uuid primary key,
  page_url text not null,
  user_agent text,
  ip_address inet,
  referrer text,
  created_at timestamp with time zone
)

analytics_time_on_page (
  id uuid primary key,
  page_url text not null,
  time_spent_seconds integer,
  session_id text,
  created_at timestamp with time zone
)
```

## 🔌 API Endpoints

### Authentication Endpoints
```typescript
// Supabase Auth (built-in)
POST /auth/v1/signup
POST /auth/v1/signin
POST /auth/v1/signout
POST /auth/v1/refresh
GET  /auth/v1/user
```

### Data Endpoints
```typescript
// REST API (auto-generated by Supabase)
GET    /rest/v1/profiles
POST   /rest/v1/profiles
PUT    /rest/v1/profiles
DELETE /rest/v1/profiles

GET    /rest/v1/practice_areas
POST   /rest/v1/practice_areas
PUT    /rest/v1/practice_areas
DELETE /rest/v1/practice_areas

// ... similar endpoints for all tables
```

### Custom RPC Functions
```sql
-- User management
get_pending_invitations()
accept_user_invitation(invitation_token text)
create_admin_profile(user_id uuid, profile_data jsonb)

-- Job management
get_job_postings(status_filter text default null)
create_job_posting(job_data jsonb)
update_job_posting(job_id uuid, job_data jsonb)
delete_job_posting(job_id uuid)
publish_job_posting(job_id uuid)
unpublish_job_posting(job_id uuid)

-- Application management
get_applications(job_id uuid default null)
submit_application(application_data jsonb)
update_application_status(application_id uuid, status text)
delete_application(application_id uuid)

-- Analytics
get_careers_analytics()
get_user_messages(user_id uuid)
```

## ⚡ Edge Functions

### Authentication & User Management
```typescript
// handle-invitation
POST /functions/v1/handle-invitation
- Sends invitation emails to new staff members
- Generates secure invitation tokens
- Manages invitation lifecycle

// confirm-invitation
POST /functions/v1/confirm-invitation
- Validates invitation tokens
- Creates user accounts
- Sets up initial profiles

// setup-password
POST /functions/v1/setup-password
- Handles password setup for invited users
- Validates password requirements
- Activates user accounts
```

### Email & Communication
```typescript
// send-email
POST /functions/v1/send-email
- Generic email sending function
- Supports multiple email providers
- Template-based email generation

// send-event-notification
POST /functions/v1/send-event-notification
- Sends notifications for system events
- Supports multiple notification channels
- Real-time delivery

// send-application-email
POST /functions/v1/send-application-email
- Sends confirmation emails for job applications
- Includes application details
- Professional formatting
```

### Job & Career Management
```typescript
// create-job-posting
POST /functions/v1/create-job-posting
- Creates new job postings
- Validates job data
- Sets up analytics tracking

// submit-application
POST /functions/v1/submit-application
- Processes job applications
- Handles file uploads
- Sends confirmation emails

// update-application-status
POST /functions/v1/update-application-status
- Updates application status
- Sends status notifications
- Tracks status changes
```

### File Management
```typescript
// upload-application-file
POST /functions/v1/upload-application-file
- Handles file uploads for applications
- Validates file types and sizes
- Stores files securely

// delete-application-file
POST /functions/v1/delete-application-file
- Removes application files
- Updates application records
- Cleans up storage
```

### Analytics & Tracking
```typescript
// track-job-view
POST /functions/v1/track-job-view
- Tracks job posting views
- Records analytics data
- Updates view counts

// track-application-event
POST /functions/v1/track-application-event
- Tracks application events
- Records user interactions
- Updates analytics
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. **User Registration**: Email/password or magic link
2. **Email Verification**: Required for new accounts
3. **Password Setup**: For invited users
4. **Session Management**: JWT-based sessions
5. **Token Refresh**: Automatic token renewal

### Role-Based Access Control
```sql
-- Role definitions
- admin: Full system access
- staff: Limited administrative access
- client: Public access only

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Security Features
- **Row Level Security**: Database-level access control
- **JWT Tokens**: Secure session management
- **Password Policies**: Strong password requirements
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin security

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI
- PostgreSQL (for local development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ogettootachi-supabase-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Supabase Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Initialize project
   supabase init
   ```

4. **Environment Configuration**
   ```bash
   # Create environment file
   cp .env.example .env.local
   ```

   Configure environment variables:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_url
   ```

5. **Start local development**
   ```bash
   # Start Supabase locally
   supabase start

   # Run migrations
   supabase db reset

   # Start Edge Functions
   supabase functions serve
   ```

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run start            # Start production server

# Database
npm run migrate          # Run database migrations
supabase db reset        # Reset local database
supabase db push         # Push schema to remote

# Functions
supabase functions serve # Serve Edge Functions locally
supabase functions deploy # Deploy Edge Functions

# Testing
npm run test             # Run tests
npm run test:ci          # Run tests in CI mode

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code
```

### Development Workflow

1. **Database Changes**
   ```bash
   # Create new migration
   supabase migration new migration_name

   # Apply migrations locally
   supabase db reset

   # Push to remote
   supabase db push
   ```

2. **Edge Function Development**
   ```bash
   # Create new function
   supabase functions new function_name

   # Test locally
   supabase functions serve

   # Deploy
   supabase functions deploy function_name
   ```

3. **Testing**
   ```bash
   # Run unit tests
   npm run test

   # Run specific test
   npm run test -- --testNamePattern="test name"
   ```

## 🚀 Deployment

### Supabase Deployment

1. **Link to remote project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Deploy database schema**
   ```bash
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy
   ```

4. **Deploy storage policies**
   ```bash
   supabase storage deploy
   ```

### Environment Management

- **Development**: Local Supabase instance
- **Staging**: Supabase staging project
- **Production**: Supabase production project

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Deploy to Supabase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase db push
      - run: supabase functions deploy
```

## 🔒 Security

### Database Security
- **Row Level Security**: Column and row-based access control
- **Encrypted Connections**: SSL/TLS encryption
- **Connection Pooling**: Efficient connection management
- **Backup Encryption**: Encrypted database backups

### API Security
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Request throttling
- **Input Validation**: Comprehensive validation
- **SQL Injection Prevention**: Parameterized queries

### Storage Security
- **Bucket Policies**: Granular access control
- **File Validation**: Type and size restrictions
- **Encrypted Storage**: At-rest encryption
- **Access Logging**: Comprehensive audit trails

## 📊 Monitoring & Logging

### Logging Strategy
```typescript
// Edge Function logging
console.log('[Function] Operation started', { data });
console.error('[Function] Error occurred', { error });
console.warn('[Function] Warning message', { warning });
```

### Monitoring Tools
- **Supabase Dashboard**: Built-in monitoring
- **Database Metrics**: Query performance
- **Function Logs**: Edge function execution
- **Error Tracking**: Sentry integration

### Performance Monitoring
- **Query Performance**: Slow query detection
- **Function Execution**: Response time tracking
- **Storage Usage**: File storage metrics
- **API Usage**: Request volume tracking

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data
```

### Testing Strategy

#### Unit Tests
```javascript
// Example test
describe('User Management', () => {
  test('should create user invitation', async () => {
    const result = await createInvitation({
      email: 'test@example.com',
      role: 'staff'
    });
    expect(result.success).toBe(true);
  });
});
```

#### Integration Tests
```javascript
// Database integration tests
describe('Database Operations', () => {
  test('should insert and retrieve profile', async () => {
    const profile = await insertProfile(testData);
    const retrieved = await getProfile(profile.id);
    expect(retrieved).toEqual(profile);
  });
});
```

#### E2E Tests
```javascript
// API endpoint tests
describe('API Endpoints', () => {
  test('should handle invitation flow', async () => {
    const response = await request(app)
      .post('/functions/v1/handle-invitation')
      .send(invitationData);
    expect(response.status).toBe(200);
  });
});
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
supabase status

# Reset local instance
supabase stop
supabase start
```

#### Edge Function Issues
```bash
# Check function logs
supabase functions logs function-name

# Redeploy function
supabase functions deploy function-name
```

#### Migration Issues
```bash
# Reset database
supabase db reset

# Check migration status
supabase migration list
```

### Debug Tools
- **Supabase Dashboard**: Web-based management
- **Database Inspector**: Query debugging
- **Function Logs**: Execution monitoring
- **Network Tab**: API call inspection

### Support Resources
- **Supabase Documentation**: Official docs
- **Community Forum**: User community
- **GitHub Issues**: Bug reports
- **Discord**: Real-time support

## 📄 License

This project is proprietary software for Ogetto Otachi Law Firm.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Document new functions
- Update migration files
- Follow security guidelines

---

**Built with ❤️ for Ogetto Otachi Law Firm**
