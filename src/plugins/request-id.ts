import type { FastifyInstance } from "fastify";

export async function requestIdPlugin(app: FastifyInstance) {
    app.addHook("onSend", async (request, reply, payload) => {
        const requestIdHeader = request.headers["x-request-id"];

        const requestId =
            typeof requestIdHeader === "string" ? requestIdHeader : request.id;

        reply.header("x-request-id", requestId);

        return payload;
    });
}