import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

export async function rateLimitPlugin(app: FastifyInstance) {
    await app.register(rateLimit, {
        global: true,
        max: 300,
        timeWindow: "1 minute",
        hook: "onRequest",
        errorResponseBuilder: (request, context) => {
            return {
                success: false,
                message: `Too many requests. Please try again in ${context.after}.`,
                errors: {
                    statusCode: 429,
                    limit: context.max,
                    remaining: 0,
                    reset: context.ttl,
                },
            };
        },
    });
}