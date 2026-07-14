import Fastify from "fastify";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { adminRoutes } from "./modules/admin/admin.route.js";
import { propertyRoutes } from "./modules/property/property.route.js";
import { leadRoutes } from "./modules/lead/lead.route.js";
import { leadNoteRoutes } from "./modules/lead-note/lead-note.route.js";
import { revenueRoutes } from "./modules/revenue/revenue.route.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.route.js";
import { reportRoutes } from "./modules/report/report.route.js";
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
import { systemRoutes } from "./modules/system/system.route.js";
import { apiMetadata } from "./config/api-metadata.js";
import crypto from "node:crypto";
import { requestIdPlugin } from "./plugins/request-id.js";
import { leadFollowUpRoutes } from "./modules/lead-follow-up/lead-follow-up.route.js";

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
        title: apiMetadata.title,
        version: apiMetadata.version,
        description: apiMetadata.swaggerDescription,
        contact: apiMetadata.contact,
      },
      externalDocs: apiMetadata.externalDocs,
      servers: [
        {
          url: env.APP_URL,
          description: "API server",
        },
      ],
      tags: [
        {
          name: "System",
          description:
            "API ownership, authorship, developer, and system information",
        },
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
          name: "Reports",
          description: "Reports and analytics APIs",
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

  await app.register(systemRoutes);

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

  await app.register(leadFollowUpRoutes, {
    prefix: "/api",
  });

  await app.register(leadNoteRoutes, {
    prefix: "/api",
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

  await app.register(reportRoutes, { prefix: "/api/reports" });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",

    uiConfig: {
      docExpansion: "none",
      deepLinking: false,
      filter: true,
      defaultModelsExpandDepth: -1,
      defaultModelExpandDepth: 0,
      displayRequestDuration: false,
      syntaxHighlight: false,
      tryItOutEnabled: false,
    },

    staticCSP: true,
    transformStaticCSP: (header) => header,

    theme: {
      css: [
        {
          filename: "swagger-mobile.css",
          content: `
            @media (max-width: 768px) {
              .swagger-ui .wrapper {
                padding: 0 12px;
              }
  
              .swagger-ui .info {
                margin: 20px 0;
              }
  
              .swagger-ui .info .title {
                font-size: 26px;
                line-height: 1.25;
              }
  
              .swagger-ui .scheme-container {
                padding: 15px 0;
              }
  
              .swagger-ui .opblock .opblock-summary {
                padding: 8px;
              }
            }
          `,
        },
      ],
    },
  });

  return app;
}
