# Backend Production Deployment Guide

This guide covers production deployment for the Real Estate Management System API using Node.js, Docker, PostgreSQL, and Prisma.

## Production Requirements

The deployment environment must provide:

- Node.js 22 or Docker
- PostgreSQL
- HTTPS
- Persistent storage for uploaded files
- Secure environment-variable management
- A reverse proxy or managed application platform
- Database backup and recovery procedures

## Required Environment Variables

```env
NODE_ENV=production
PORT=4000

APP_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

JWT_SECRET=replace_with_a_random_secret_at_least_32_characters

SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=replace_with_a_secure_admin_password
SEED_ADMIN_FIRST_NAME=System
SEED_ADMIN_LAST_NAME=Admin
```

Generate `JWT_SECRET` with:

```bash
openssl rand -base64 48
```

Do not reuse development or test secrets in production.

## Pre-Deployment Checks

Run locally before deployment:

```bash
npm ci
npm run prisma:generate
npm run build
npm run test
npm run test:coverage
```

Verify:

```bash
git status
```

The working tree should not contain uncommitted production changes.

## Database Migrations

### Development

Create and test migrations locally:

```bash
npm run db:migrate:dev
```

Commit the generated files under:

```text
prisma/migrations
```

### Production

Apply committed migrations:

```bash
npm run db:migrate:deploy
```

Do not run `prisma migrate dev` against a production database.

## Production Admin Seeding

After migrations are complete, seed the first admin account:

```bash
npm run db:seed
```

The seed should be safe to run repeatedly and must not create duplicate administrator accounts.

After confirming login access, remove production seed credentials from the environment when they are no longer needed.

## Deployment Without Docker

Install production dependencies:

```bash
npm ci
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Build:

```bash
npm run build
```

Apply migrations:

```bash
npm run db:migrate:deploy
```

Seed when required:

```bash
npm run db:seed
```

Start:

```bash
npm run start
```

The process manager or platform must restart the application if it exits.

## Docker Deployment

### 1. Create environment file

```bash
cp .env.docker.example .env.docker
```

Update every placeholder and generate a new JWT secret.

### 2. Build and start services

```bash
docker compose --env-file .env.docker up --build -d
```

### 3. Verify containers

```bash
docker compose --env-file .env.docker ps -a
```

Both `postgres` and `api` should show a running or healthy state.

### 4. Apply migrations

```bash
docker compose --env-file .env.docker exec api npx prisma migrate deploy
```

### 5. Seed administrator

```bash
docker compose --env-file .env.docker exec api npm run db:seed
```

### 6. Verify endpoints

```bash
curl -i http://localhost:4000/health
curl -i http://localhost:4000/ready
curl -I http://localhost:4000/docs
```

Expected:

```text
/health  HTTP 200
/ready   HTTP 200
/docs    HTTP 200 or redirect
```

### 7. Review logs

```bash
docker compose --env-file .env.docker logs api --tail=150
docker compose --env-file .env.docker logs postgres --tail=100
```

## Health Checks

### Liveness

```text
GET /health
```

Confirms that the API process is running.

### Readiness

```text
GET /ready
```

Confirms that the API and database are ready to serve requests.

The load balancer should send production traffic only when `/ready` returns HTTP 200.

## Uploaded File Persistence

Property images are written under:

```text
uploads/properties
```

The production environment must provide persistent storage.

Possible approaches:

- Mounted persistent disk
- Docker volume
- Amazon S3-compatible storage
- Cloudflare R2
- Managed object-storage provider

Do not rely on a container filesystem for permanent user uploads.

## HTTPS and Reverse Proxy

Production traffic must use HTTPS.

The reverse proxy should:

- Redirect HTTP to HTTPS
- Forward the original host
- Forward client IP information
- Allow upload request sizes required by the application
- Apply reasonable connection and request timeouts
- Forward requests to API port 4000

Do not expose PostgreSQL publicly unless explicitly required and protected.

## CORS Configuration

Use an explicit frontend allowlist:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Do not use `*` together with credentialed requests.

## Swagger Documentation

Swagger is available at:

```text
/docs
```

For private production APIs, consider protecting or disabling public Swagger access through the reverse proxy.

## Security Checklist

Before production release, verify:

- `NODE_ENV=production`
- Strong unique `JWT_SECRET`
- Production database credentials are not committed
- `ALLOWED_ORIGINS` contains only trusted domains
- HTTPS is enabled
- Rate limiting is enabled
- Helmet security headers are enabled
- Server stack traces are hidden
- Admin seed password is changed
- Database backups are enabled
- Uploaded files use persistent storage
- Logs do not expose passwords or tokens
- PostgreSQL is not unnecessarily public
- `.env` files are ignored by Git

## Backup Checklist

Back up:

- PostgreSQL database
- Uploaded property images
- Environment configuration in a secure secret store
- Migration files
- Deployment configuration

Test database restoration before relying on backups.

## Production Update Procedure

1. Create a database backup.
2. Pull the approved release.
3. Install dependencies or build the new image.
4. Generate the Prisma client.
5. Apply migrations.
6. Restart the API.
7. Check `/health`.
8. Check `/ready`.
9. Review application logs.
10. Perform a login and core API smoke test.

Docker example:

```bash
docker compose --env-file .env.docker pull
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker exec api npx prisma migrate deploy
curl -i http://localhost:4000/health
curl -i http://localhost:4000/ready
```

## Rollback

Application rollback:

1. Restore the previous application image or release.
2. Restart the service.
3. Verify health and readiness.
4. Review logs.

Database rollback requires special care. Prisma production migrations should generally be corrected with a new forward migration rather than manually deleting migration history.

Restore a verified database backup when destructive recovery is required.

## Troubleshooting

### API container is not running

```bash
docker compose --env-file .env.docker ps -a
docker compose --env-file .env.docker logs api --tail=150
```

### Database container is unhealthy

```bash
docker compose --env-file .env.docker logs postgres --tail=150
```

### API cannot connect to PostgreSQL

Inside Docker, the database host must be the Compose service name:

```text
postgres
```

Example:

```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/real_estate_db?schema=public
```

Do not use `localhost` from inside the API container.

### Prisma seed cannot find `tsx`

Confirm `tsx` is in production dependencies and rebuild the Docker image:

```bash
npm install tsx --save-prod
docker compose --env-file .env.docker up --build -d
```

### No seed command configured

Confirm `prisma.config.ts` contains:

```ts
migrations: {
    seed: "tsx prisma/seed.ts",
}
```

### Port already in use

Change the host port:

```env
PORT=4001
```

Then recreate the containers.

### Reset local Docker database

Development only:

```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up --build -d
```

This permanently deletes the Docker database volume.
