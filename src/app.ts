import Fastify from "fastify";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { adminRoutes } from "./modules/admin/admin.route.js";
import { propertyRoutes } from "./modules/property/property.route.js";
import { leadRoutes } from "./modules/lead/lead.route.js";
import { revenueRoutes } from "./modules/revenue/revenue.route.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.route.js";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { propertyImageRoutes } from "./modules/property/property-image.route.js";
import { favoriteRoutes } from "./modules/favorite/favorite.route.js";
import { viewingRoutes } from "./modules/viewing/viewing.route.js";
import { notificationRoutes } from "./modules/notification/notification.route.js";
import { auditRoutes } from "./modules/audit/audit.route.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { requestLoggerPlugin } from "./plugins/request-logger.js";
import rateLimit from "@fastify/rate-limit";
import { securityHeadersPlugin } from "./plugins/security-headers.js";
import { corsPlugin } from "./plugins/cors.js";
import { healthRoutes } from "./modules/health/health.route.js";
import crypto from "node:crypto";
import { requestIdPlugin } from "./plugins/request-id.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? {
            target: "pino-pretty",
            options: {
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
          : undefined,
    },
    genReqId: (request) => {
      const existingRequestId = request.headers["x-request-id"];

      if (typeof existingRequestId === "string") {
        return existingRequestId;
      }

      return crypto.randomUUID();
    },
  });

  await requestIdPlugin(app);
  await errorHandlerPlugin(app);
  await app.register(requestLoggerPlugin);
  await app.register(securityHeadersPlugin);

  if (env.NODE_ENV !== "test") {
    await app.register(rateLimit, {
      global: true,
      max: 300,
      timeWindow: "1 minute",
      hook: "onRequest",
      errorResponseBuilder: (
        _request: unknown,
        context: {
          after: string;
          max: number;
          ttl: number;
        },
      ) => {
        return {
          success: false,
          message: `Too many requests. Please try again in ${context.after}.`,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            statusCode: 429,
            limit: context.max,
            remaining: 0,
            reset: context.ttl,
          },
        };
      },
    });
  }

  await app.register(corsPlugin);

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Real Estate Management System API",
        description:
          "Backend API for real estate property management, lead tracking, viewing appointments, revenue tracking, notifications, audit logs, and dashboard analytics.",
        version: "1.0.0",
      },
      servers: [
        {
          url: env.APP_URL,
          description: "API server",
        },
      ],
      tags: [
        {
          name: "Health",
          description: "Server health check endpoints",
        },
        {
          name: "Auth",
          description: "Authentication and current user APIs",
        },
        {
          name: "Admin",
          description: "Admin user management APIs",
        },
        {
          name: "Properties",
          description: "Property listing and management APIs",
        },
        {
          name: "Property Images",
          description: "Property image upload and delete APIs",
        },
        {
          name: "Leads",
          description: "Lead and inquiry management APIs",
        },
        {
          name: "Viewings",
          description: "Property viewing appointment APIs",
        },
        {
          name: "Revenue",
          description: "Sales, commission, and payment tracking APIs",
        },
        {
          name: "Dashboard",
          description: "Dashboard analytics and summary APIs",
        },
        {
          name: "Favorites",
          description: "Saved properties APIs",
        },
        {
          name: "Notifications",
          description: "User notification APIs",
        },
        {
          name: "Audit Logs",
          description: "System audit trail APIs",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(healthRoutes);

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  await app.register(authRoutes, {
    prefix: "/api/auth",
  });

  await app.register(adminRoutes, {
    prefix: "/api/admin",
  });

  await app.register(propertyRoutes, {
    prefix: "/api/properties",
  });

  await app.register(favoriteRoutes, {
    prefix: "/api/favorites",
  });

  await app.register(propertyImageRoutes, {
    prefix: "/api/properties",
  });

  await app.register(leadRoutes, {
    prefix: "/api/leads",
  });

  await app.register(viewingRoutes, {
    prefix: "/api/viewings",
  });

  await app.register(notificationRoutes, {
    prefix: "/api/notifications",
  });

  await app.register(auditRoutes, {
    prefix: "/api/audit-logs",
  });

  await app.register(revenueRoutes, {
    prefix: "/api/revenues",
  });

  await app.register(dashboardRoutes, {
    prefix: "/api/dashboard",
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  return app;
}
