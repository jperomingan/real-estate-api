import { FastifyReply, FastifyRequest } from "fastify";

export type JwtUser = {
    id: string;
    email: string;
    role: "ADMIN" | "BROKER" | "CLIENT";
    status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
};

export async function requireAdminUser(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();

        const user = request.user as JwtUser;

        if (user.role !== "ADMIN") {
            return reply.status(403).send({
                message: "Forbidden. Admin access only.",
            });
        }
    } catch {
        return reply.status(401).send({
            message: "Unauthorized",
        });
    }
}