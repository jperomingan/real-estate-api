# Backend Production Deployment Guide

This guide explains how to deploy the Real Estate Management System API using Docker, PostgreSQL, Prisma, and environment variables.

## Recommended Platforms

Recommended options:

1. Render
2. Railway
3. VPS with Docker Compose

Render supports Docker-based web services and environment variables for deployed services. Railway also provides environment variables during build and runtime, and PostgreSQL services expose `DATABASE_URL` for connected services.

## Required Production Environment Variables

Set these variables in your deployment platform:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
JWT_SECRET=replace_with_a_secure_32_plus_character_secret
PORT=4000
APP_URL=https://your-backend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

## Database Migration Commands

For local development:

```bash
npm run db:migrate:dev

For production or staging

npm run db:migrate:deploy

For Docker production-style migration

npm run docker:db:migrate

For local Docker schema sync only
npm run docker:db:push


---

## 3. Update `DEPLOYMENT.md`

Add this section under **Database Migration Commands**:

```md
## Production Admin Seeding

After production migrations are applied, seed the first admin user.

Set these environment variables in the production platform:

```env
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=replace_with_secure_admin_password
SEED_ADMIN_FIRST_NAME=System
SEED_ADMIN_LAST_NAME=Admin