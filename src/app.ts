import Fastify from "fastify";
import cors from "@fastify/cors";
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

export async function buildApp() {
    const app = Fastify({
        logger: true,
    });

    await app.register(cors, {
        origin: true,
        credentials: true,
    });

    await app.register(jwt, {
        secret: env.JWT_SECRET,
    });

    await app.register(swagger, {
        openapi: {
            info: {
                title: "Real Estate Management System API",
                description: "Backend API for Real Estate Management System with Lead and Revenue Tracking",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:4000",
                    description: "Local development server",
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

    await app.register(swaggerUi, {
        routePrefix: "/docs",
    });

    app.get("/health", {
        schema: {
            tags: ["Health"],
            summary: "Check if backend server is running",
            response: {
                200: {
                    type: "object",
                    properties: {
                        status: { type: "string" },
                        service: { type: "string" },
                        timestamp: { type: "string" },
                    },
                },
            },
        },
        handler: async () => {
            return {
                status: "ok",
                service: "real-estate-api",
                timestamp: new Date().toISOString(),
            };
        },
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

    await app.register(propertyImageRoutes, {
        prefix: "/api/properties",
    });

    await app.register(leadRoutes, {
        prefix: "/api/leads",
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