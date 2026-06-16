import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { sendSuccess, sendError } from "../../utils/api-response.js";

export async function healthRoutes(app: FastifyInstance) {
    app.get("/health", async (_request, reply) => {
        return sendSuccess({
            reply,
            message: "Backend API is running",
            data: {
                status: "ok",
                service: "real-estate-api",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            },
        });
    });

    app.get("/ready", async (request, reply) => {
        try {
            await prisma.$queryRaw`SELECT 1`;

            return sendSuccess({
                reply,
                message: "Backend API is ready",
                data: {
                    status: "ready",
                    database: "connected",
                    service: "real-estate-api",
                    timestamp: new Date().toISOString(),
                },
            });
        } catch {
            return sendError({
                reply,
                statusCode: 503,
                message: "Backend API is not ready",
                code: "SERVICE_UNAVAILABLE",
                requestId: request.id,
                details: {
                    status: "not_ready",
                    database: "disconnected",
                    service: "real-estate-api",
                    timestamp: new Date().toISOString(),
                },
            });
        }
    });
}