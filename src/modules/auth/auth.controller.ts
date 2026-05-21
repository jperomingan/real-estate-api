import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { getCurrentUser, loginUser, registerUser } from "./auth.service.js";

type JwtUser = {
    id: string;
    email: string;
    role: "ADMIN" | "BROKER" | "CLIENT";
    status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
};

export async function registerController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = registerSchema.safeParse(request.body);

    if (!result.success) {
        return sendError({
            reply,
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
            statusCode: 400,
        });
    }

    try {
        const data = await registerUser(request.server, result.data);

        return sendSuccess({
            reply,
            message: "Registration successful",
            data,
            statusCode: 201,
        });
    } catch (error) {
        return sendError({
            reply,
            message: error instanceof Error ? error.message : "Registration failed",
            statusCode: 400,
        });
    }
}

export async function loginController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
        return sendError({
            reply,
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
            statusCode: 400,
        });
    }

    try {
        const data = await loginUser(request.server, result.data);

        return sendSuccess({
            reply,
            message: "Login successful",
            data,
        });
    } catch (error) {
        return sendError({
            reply,
            message: error instanceof Error ? error.message : "Login failed",
            statusCode: 401,
        });
    }
}

export async function meController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();

        const jwtUser = request.user as JwtUser;

        const user = await getCurrentUser(jwtUser.id);

        if (!user) {
            return sendError({
                reply,
                message: "User not found",
                statusCode: 404,
            });
        }

        return sendSuccess({
            reply,
            message: "Current user fetched successfully",
            data: user,
        });
    } catch {
        return sendError({
            reply,
            message: "Unauthorized",
            statusCode: 401,
        });
    }
}