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