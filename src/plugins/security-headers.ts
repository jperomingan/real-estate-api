import helmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export async function securityHeadersPlugin(app: FastifyInstance) {
    await app.register(helmet, {
        global: true,

        contentSecurityPolicy:
            env.NODE_ENV === "production"
                ? {
                    directives: {
                        defaultSrc: ["'self'"],
                        baseUri: ["'self'"],
                        fontSrc: ["'self'", "https:", "data:"],
                        formAction: ["'self'"],
                        frameAncestors: ["'self'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        objectSrc: ["'none'"],
                        scriptSrc: ["'self'"],
                        scriptSrcAttr: ["'none'"],
                        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
                        upgradeInsecureRequests: [],
                    },
                }
                : false,

        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    });
}