import { FastifyReply, FastifyRequest } from "fastify";
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
        return reply.status(400).send({
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
        });
    }

    try {
        const data = await registerUser(request.server, result.data);

        return reply.status(201).send({
            message: "Registration successful",
            data,
        });
    } catch (error) {
        return reply.status(400).send({
            message: error instanceof Error ? error.message : "Registration failed",
        });
    }
}

export async function loginController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = loginSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            message: "Validation error",
            errors: result.error.flatten().fieldErrors,
        });
    }

    try {
        const data = await loginUser(request.server, result.data);

        return reply.send({
            message: "Login successful",
            data,
        });
    } catch (error) {
        return reply.status(401).send({
            message: error instanceof Error ? error.message : "Login failed",
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
            return reply.status(404).send({
                message: "User not found",
            });
        }

        return reply.send({
            message: "Current user fetched successfully",
            data: user,
        });
    } catch {
        return reply.status(401).send({
            message: "Unauthorized",
        });
    }
}