import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

export async function rateLimitPlugin(app: FastifyInstance) {
    await app.register(rateLimit, {
        global: false,
        hook: "preHandler",
        errorResponseBuilder: (_request, context) => {
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