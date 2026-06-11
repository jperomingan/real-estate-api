import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export async function healthRoutes(app: FastifyInstance) {
    app.get("/health", async () => {
        return {
            success: true,
            message: "Backend API is running",
            data: {
                status: "ok",
                service: "real-estate-api",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            },
        };
    });

    app.get("/ready", async (_request, reply) => {
        try {
            await prisma.$queryRaw`SELECT 1`;

            return {
                success: true,
                message: "Backend API is ready",
                data: {
                    status: "ready",
                    database: "connected",
                    service: "real-estate-api",
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return reply.status(503).send({
                success: false,
                message: "Backend API is not ready",
                data: {
                    status: "not_ready",
                    database: "disconnected",
                    service: "real-estate-api",
                    timestamp: new Date().toISOString(),
                },
            });
        }
    });
}