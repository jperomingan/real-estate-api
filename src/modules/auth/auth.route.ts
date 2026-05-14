import { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance) {
    app.get("/test", async () => {
        return {
            message: "Auth route is working",
        };
    });
}