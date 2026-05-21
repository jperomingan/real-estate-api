import { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission } from "./permission.service.js";
import { JwtUser, Permission } from "./permission.types.js";

export function requirePermission(permission: Permission) {
    return async function permissionMiddleware(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        try {
            await request.jwtVerify();

            const user = request.user as JwtUser;

            if (!hasPermission(user, permission)) {
                return reply.status(403).send({
                    message: "Forbidden. You do not have permission to access this resource.",
                });
            }
        } catch {
            return reply.status(401).send({
                message: "Unauthorized",
            });
        }
    };
}