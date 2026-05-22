import { FastifyInstance } from "fastify";

type JwtUser = {
    id: string;
    email: string;
    role: "ADMIN" | "BROKER" | "CLIENT";
    status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
};

export async function requestLoggerPlugin(app: FastifyInstance) {
    app.addHook("onRequest", async (request) => {
        request.startTime = Date.now();
    });

    app.addHook("onResponse", async (request, reply) => {
        const responseTime = Date.now() - (request.startTime ?? Date.now());

        let user: JwtUser | undefined;

        try {
            user = request.user as JwtUser;
        } catch {
            user = undefined;
        }

        request.log.info({
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTimeMs: responseTime,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            userId: user?.id,
            userRole: user?.role,
        }, "API request completed");
    });
}