import { FastifyReply, FastifyRequest } from "fastify";

export type JwtUser = {
    id: string;
    email: string;
    role: "ADMIN" | "BROKER" | "CLIENT";
    status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
};

export async function requireAuthenticatedUser(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();
    } catch {
        return reply.status(401).send({
            message: "Unauthorized",
        });
    }
}