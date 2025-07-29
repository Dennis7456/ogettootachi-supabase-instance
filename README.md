# Ogetto Otachi - Supabase Backend

This is the backend service for the Ogetto Otachi law firm website, built with Node.js and Supabase.

## Features

- RESTful API endpoints
- Test-driven development (TDD) approach
- Environment-based configuration
- Database migrations
- Logging and error handling

## Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account and project

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ogettootachi-supabase-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment | No | `development` |
| `PORT` | Port to run the server on | No | `3001` |
| `SUPABASE_URL` | Your Supabase project URL | Yes | - |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes | - |
| `CORS_ORIGIN` | Allowed CORS origins | No | `*` |

## Project Structure

```
├── src/
│   ├── api/              # API routes
│   ├── config/           # Configuration files
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── index.js          # Application entry point
├── tests/                # Test files
├── migrations/           # Database migrations
├── scripts/              # Utility scripts
├── .env.example          # Example environment variables
└── package.json          # Project dependencies and scripts
```

## Development Workflow

1. **Writing Tests**
   - Create a test file in the `tests/` directory
   - Follow the naming convention: `*.test.js`

2. **Running Tests**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm test -- --watch
   
   # Run tests with coverage
   npm test -- --coverage
   ```

3. **Database Migrations**
   - Create migration files in the `migrations/` directory
   - Run migrations: `npm run migrate`

4. **API Documentation**
   - Document your API endpoints using JSDoc
   - Update the README with new endpoints

## Deployment

1. **Production Environment**
   - Set `NODE_ENV=production`
   - Configure production database credentials
   - Run `npm ci --only=production`
   - Start the server: `npm start`

2. **Supabase Deployment**
   - Push schema changes: `supabase db push`
   - Deploy Edge Functions: `supabase functions deploy`

## Best Practices

- Write tests for all new features
- Keep environment variables secure (never commit .env)
- Follow the single responsibility principle
- Use meaningful commit messages
- Document your code

## License

MIT
