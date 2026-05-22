import { FastifyInstance } from "fastify";
import {
    loginController,
    meController,
    registerController,
} from "./auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
    app.post(
        "/register",
        {
            preHandler: app.rateLimit({
                max: 10,
                timeWindow: "1 hour",
            }),
            schema: {
                tags: ["Auth"],
                summary: "Register a broker or client account",
                body: {
                    type: "object",
                    required: ["firstName", "lastName", "email", "password"],
                    properties: {
                        firstName: {
                            type: "string",
                            description: "User first name. Example: Juan",
                        },
                        lastName: {
                            type: "string",
                            description: "User last name. Example: Dela Cruz",
                        },
                        email: {
                            type: "string",
                            description: "User email address. Example: broker@example.com",
                        },
                        password: {
                            type: "string",
                            description: "Minimum 8 characters. Example: Password123",
                        },
                        phone: {
                            type: "string",
                            description: "User phone number. Example: 09123456789",
                        },
                        role: {
                            type: "string",
                            enum: ["BROKER", "CLIENT"],
                            description: "User role. Allowed values: BROKER or CLIENT",
                        },
                    },
                },
            },
        },
        registerController
    );

    app.post(
        "/login",
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute",
                },
            },
            schema: {
                tags: ["Auth"],
                summary: "Login user",
                body: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            description: "User email address. Example: broker@example.com",
                        },
                        password: {
                            type: "string",
                            description: "User password. Example: Password123",
                        },
                    },
                },
            },
        },
        loginController
    );

    app.get(
        "/me",
        {
            schema: {
                tags: ["Auth"],
                summary: "Get current logged-in user",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
            },
        },
        meController
    );
}