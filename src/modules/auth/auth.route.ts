import { FastifyInstance } from "fastify";
import { errorResponseSchema, successResponseSchema } from "../../utils/swagger-schemas.js";
import {
    loginController,
    meController,
    registerController,
} from "./auth.controller.js";
import { sendError } from "../../utils/api-response.js";

const userResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
        status: { type: "string" },
        phone: { type: "string", nullable: true },
        avatarUrl: { type: "string", nullable: true },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

const authDataResponseSchema = {
    type: "object",
    properties: {
        user: userResponseSchema,
        token: { type: "string" },
    },
};

export async function authRoutes(app: FastifyInstance) {
    app.post(
        "/register",
        {
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 hour",
                },
            },
            schema: {
                tags: ["Auth"],
                summary: "Register a broker or client account",
                description:
                    "Creates a new user account. Public registration only allows BROKER or CLIENT role. Admin accounts should be created through seed or admin tools.",
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
                            description: "Optional phone number. Example: 09123456789",
                        },
                        role: {
                            type: "string",
                            enum: ["BROKER", "CLIENT"],
                            description: "Allowed values: BROKER or CLIENT",
                        },
                    },
                },
                response: {
                    201: successResponseSchema(authDataResponseSchema),
                    400: errorResponseSchema,
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
                description:
                    "Authenticates a user using email and password, then returns the user profile and JWT token.",
                body: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            description: "User email address. Example: admin@example.com",
                        },
                        password: {
                            type: "string",
                            description: "User password. Example: AdminPassword123",
                        },
                    },
                },
                response: {
                    200: successResponseSchema(authDataResponseSchema),
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    429: errorResponseSchema,
                },
            },
        },
        loginController
    );

    app.get(
        "/me",
        {
            preHandler: async (
                request,
                reply,
            ) => {
                try {
                    await request.jwtVerify();
                } catch {
                    return sendError({
                        reply,
                        statusCode: 401,
                        message: "Unauthorized",
                        code: "UNAUTHORIZED",
                        requestId: request.id,
                    });
                }
            },
            schema: {
                tags: ["Auth"],
                summary: "Get current logged-in user",
                description:
                    "Returns the current authenticated user profile using the JWT bearer token.",
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
                response: {
                    200: successResponseSchema(userResponseSchema),
                    401: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        meController,
    );
}