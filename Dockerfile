FROM node:22-alpine AS builder

WORKDIR /app

ARG DATABASE_URL="postgresql://postgres:postgres@postgres:5432/real_estate_db?schema=public"
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
COPY prisma.config.ts ./

RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000

CMD ["npm", "run", "start"]