import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.route.js";

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

    app.get("/health", async () => {
        return {
            status: "ok",
            service: "real-estate-api",
            timestamp: new Date().toISOString(),
        };
    });

    await app.register(authRoutes, {
        prefix: "/api/auth",
    });

    return app;
}