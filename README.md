# Real Estate Management System API

![Backend CI](https://github.com/jperomingan/real-estate-api/actions/workflows/backend-ci.yml/badge.svg)

Production-ready backend API for a Real Estate Management System with property management, lead tracking, viewing appointments, revenue tracking, favorites, notifications, audit logs, dashboard analytics, authentication, and role-based access control.

## Features

- JWT authentication
- Admin, broker, and client roles
- Permission-based authorization
- User approval and account management
- Property listing and management
- Property image upload and deletion
- Lead and inquiry tracking
- Viewing appointment management
- Revenue, payment, and commission tracking
- Favorite properties
- User notifications
- Audit logs
- Dashboard analytics
- Standard API success and error responses
- Request ID tracking
- Structured request logging
- CORS protection
- Helmet security headers
- Global rate limiting
- Swagger/OpenAPI documentation
- Prisma migrations and database seeding
- Vitest automated tests and coverage
- Docker and Docker Compose support
- GitHub Actions CI

## Technology Stack

- Node.js 22
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- JWT
- Vitest
- Swagger/OpenAPI
- Docker
- GitHub Actions

## Requirements

For local development:

- Node.js 22 or later
- npm
- PostgreSQL
- Git

For Docker development:

- Docker Desktop
- Docker Compose

## Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/jperomingan/real-estate-api.git
cd real-estate-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the local environment file

```bash
cp .env.example .env
```

Generate a secure JWT secret:

```bash
openssl rand -base64 48
```

Paste the generated value into `.env`.

Example:

```env
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/real_estate_db?schema=public

JWT_SECRET=replace_with_a_random_secret_at_least_32_characters

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_with_a_secure_admin_password
SEED_ADMIN_FIRST_NAME=System
SEED_ADMIN_LAST_NAME=Admin
```

Never commit `.env` or real credentials.

## Database Setup

### Generate the Prisma client

```bash
npm run prisma:generate
```

### Create a development migration

```bash
npm run db:migrate:dev
```

### Apply existing migrations

```bash
npm run db:migrate:deploy
```

### Push the schema without creating a migration

Use this only for temporary development databases:

```bash
npm run db:push
```

### Seed the database

```bash
npm run db:seed
```

The seed command uses these environment variables:

```env
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_ADMIN_FIRST_NAME
SEED_ADMIN_LAST_NAME
```

## Development Server

Start the development server:

```bash
npm run dev
```

API URL:

```text
http://localhost:4000
```

Swagger documentation:

```text
http://localhost:4000/docs
```

Health endpoint:

```text
http://localhost:4000/health
```

Readiness endpoint:

```text
http://localhost:4000/ready
```

## Build and Production Start

Build the TypeScript project:

```bash
npm run build
```

Start the compiled application:

```bash
npm run start
```

## Testing

### Prepare the test database

Create `.env.test` with a separate PostgreSQL database:

```env
NODE_ENV=test
PORT=4001
APP_URL=http://localhost:4001
ALLOWED_ORIGINS=http://localhost:4001

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/real_estate_test_db?schema=public
JWT_SECRET=test_secret_that_is_at_least_32_characters_long
```

Push the schema:

```bash
npm run test:db:push
```

Reset the test database:

```bash
npm run test:db:reset
```

### Run tests

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

Open the local coverage report on macOS:

```bash
open coverage/index.html
```

## Docker Setup

### 1. Create Docker environment file

```bash
cp .env.docker.example .env.docker
```

Generate a unique JWT secret and update `.env.docker`:

```bash
openssl rand -base64 48
```

### 2. Build and start containers

```bash
docker compose --env-file .env.docker up --build -d
```

### 3. Check container status

```bash
docker compose --env-file .env.docker ps -a
```

### 4. Apply Prisma migrations

```bash
docker compose --env-file .env.docker exec api npx prisma migrate deploy
```

### 5. Seed the Docker database

```bash
docker compose --env-file .env.docker exec api npm run db:seed
```

### 6. Test the Docker API

```bash
curl -i http://localhost:4000/health
curl -i http://localhost:4000/ready
curl -I http://localhost:4000/docs
```

### 7. View logs

```bash
docker compose --env-file .env.docker logs -f api
```

### 8. Stop containers

```bash
docker compose --env-file .env.docker down
```

To remove the local Docker database volume:

```bash
docker compose --env-file .env.docker down -v
```

Warning: `-v` permanently deletes the Docker database volume.

## API Modules

### Authentication

- Register user
- Login
- Get current authenticated user

### Administration

- List users
- Get user by ID
- Approve broker
- Reject broker
- Update account status
- Delete user

### Properties

- Create property
- List and filter properties
- Get property by ID
- Update property
- Delete property
- Upload property image
- Delete property image

### Leads

- Create lead
- List leads
- Get lead by ID
- Update lead status
- Delete lead

### Viewings

- Request viewing appointment
- List viewings
- Get viewing by ID
- Update viewing status
- Reschedule viewing
- Delete viewing

### Revenue

- Create revenue record
- List revenue records
- Get revenue by ID
- Get revenue summary
- Update payment status
- Update commission status
- Delete revenue record

### Dashboard

- Dashboard summary
- Monthly revenue
- Lead conversion
- Property statistics
- Broker performance

### Favorites

- Save property
- List saved properties
- Check favorite status
- Remove saved property

### Notifications

- List notifications
- Get unread count
- Mark one notification as read
- Mark all notifications as read
- Delete notification

### Audit Logs

- List audit logs
- Get audit log by ID

## Standard API Responses

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "requestId": "request-id"
  }
}
```

## Security

The API includes:

- JWT authentication
- Role and permission checks
- CORS origin allowlist
- Helmet security headers
- Content Security Policy in production
- Global request rate limiting
- Production-safe server errors
- Request IDs
- Structured logging
- Environment variable validation

Never commit:

- `.env`
- `.env.docker`
- `.env.production`
- `.env.test`
- database credentials
- JWT secrets
- admin passwords
- API keys
- private keys

## Uploaded Files

Property images are stored under:

```text
uploads/properties
```

Docker Compose mounts the local `uploads` directory into the API container:

```text
./uploads:/app/uploads
```

Production deployments must use persistent storage or an object-storage provider. Container-only storage is not permanent.

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:coverage
npm run prisma:generate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:push
npm run db:seed
npm run docker:up
npm run docker:down
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the production deployment guide.
