# Real Estate Management System API

![Backend CI](https://github.com/jperomingan/real-estate-api/actions/workflows/backend-ci.yml/badge.svg)

Backend API for the Real Estate Management System with property management, lead tracking, viewing appointments, revenue tracking, favorites, notifications, audit logs, dashboard analytics, authentication, role-based access control, Swagger API documentation, and automated tests.

## Features

* User authentication with JWT
* Admin, broker, and client roles
* Role-based permission middleware
* Property listing and management
* Property image upload and delete support
* Lead and inquiry tracking
* Viewing appointment management
* Revenue, payment, and commission tracking
* Favorite properties
* User notifications
* Audit logs
* Dashboard analytics
* Swagger API documentation
* Vitest automated testing
* Test database support
* Coverage reporting
* GitHub Actions CI

## Tech Stack

* Node.js
* TypeScript
* Fastify
* Prisma ORM
* PostgreSQL
* Zod
* JWT
* Vitest
* Swagger / OpenAPI
* GitHub Actions

## Backend Commands

```bash
npm install
npx prisma generate
npm run build
npm run test
npm run test:coverage
```

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://jenn@localhost:5432/real_estate_db?schema=public"
JWT_SECRET="replace_this_with_a_long_secure_secret_minimum_32_characters"
PORT=4000
NODE_ENV="development"
APP_URL="http://localhost:4000"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:4000"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run Prisma migration or database push

For development migration:

```bash
npx prisma migrate dev
```

For pushing schema without migration:

```bash
npx prisma db push
```

### 5. Start development server

```bash
npm run dev
```

The API will run at:

```txt
http://localhost:4000
```

Swagger documentation:

```txt
http://localhost:4000/docs
```

## Test Database Setup

Create a `.env.test` file in the project root.

```env
DATABASE_URL="postgresql://jenn@localhost:5432/real_estate_test_db?schema=public"
JWT_SECRET="test_secret_must_be_at_least_32_characters_long"
PORT=4001
NODE_ENV="test"
APP_URL="http://localhost:4001"
ALLOWED_ORIGINS="http://localhost:4001"
```

Create the test database:

```bash
psql -d postgres
```

Inside `psql`:

```sql
CREATE DATABASE real_estate_test_db;
\q
```

Push Prisma schema to the test database:

```bash
npm run test:db:push
```

Reset the test database:

```bash
npm run test:db:reset
```

## Testing

Run all tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run test coverage:

```bash
npm run test:coverage
```

Open coverage report:

```bash
open coverage/index.html
```

## API Documentation

Swagger documentation is available at:

```txt
http://localhost:4000/docs
```

Main API groups:

* Health
* Auth
* Admin
* Properties
* Property Images
* Leads
* Viewings
* Revenue
* Dashboard
* Favorites
* Notifications
* Audit Logs

## Main API Modules

### Auth

* Register user
* Login user
* Get current user

### Admin

* List users
* Get user by ID
* Approve broker account
* Reject broker account
* Update user status
* Delete user

### Properties

* Create property
* List properties
* Get property by ID
* Update property
* Delete property
* Upload property image
* Delete property image

### Leads

* Create lead or inquiry
* List leads
* Get lead by ID
* Update lead status
* Delete lead

### Viewings

* Request property viewing
* List viewing appointments
* Get viewing appointment by ID
* Update viewing status
* Reschedule viewing
* Delete viewing appointment

### Revenue

* Create revenue record
* List revenue records
* Get revenue by ID
* Get revenue summary
* Update payment status
* Update commission status
* Delete revenue record

### Dashboard

* Dashboard summary
* Monthly revenue
* Lead conversion statistics
* Property statistics
* Broker performance

### Favorites

* Save property to favorites
* List current user's favorites
* Check favorite status
* Remove property from favorites

### Notifications

* List notifications
* Get unread count
* Mark notification as read
* Mark all notifications as read
* Delete notification

### Audit Logs

* List audit logs
* Get audit log by ID

## Build

```bash
npm run build
```

## Production Start

```bash
npm run start
```

## GitHub Actions CI

This project uses GitHub Actions to automatically run:

* dependency installation
* Prisma client generation
* database schema push
* TypeScript build
* automated tests
* coverage report

Workflow file:

```txt
.github/workflows/backend-ci.yml
```

Coverage report artifact is uploaded after CI runs.

## Important Security Notes

Do not commit the following files or values:

* `.env`
* `.env.test`
* database URLs
* JWT secrets
* email passwords
* payment keys
* admin passwords
* private server keys

Use `.env.example` for safe sample environment variables only.

## Project Status

Current backend test coverage:

```txt
70 tests passing
Overall line coverage: 70%+
```

Current tested modules include:

* Health
* Auth
* Admin
* Audit Logs
* Properties
* Leads
* Viewings
* Revenue
* Dashboard
* Favorites
* Notifications

## Environment Files

Use the example files as templates:

```txt
.env.example
.env.test.example
.env.docker.example
.env.production.example