import { FastifyReply, FastifyRequest } from "fastify";

export type JwtUser = {
    id: string;
    email: string;
    role: "ADMIN" | "BROKER" | "CLIENT";
    status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE";
};

export async function requireLeadManager(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify();

        const user = request.user as JwtUser;

        if (user.role === "ADMIN") {
            return;
        }

        if (user.role === "BROKER" && user.status === "APPROVED") {
            return;
        }

        return reply.status(403).send({
            message: "Forbidden. Only admins and approved brokers can manage leads.",
        });
    } catch {
        return reply.status(401).send({
            message: "Unauthorized",
        });
    }
}