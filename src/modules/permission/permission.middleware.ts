import { FastifyReply, FastifyRequest } from "fastify";
import { sendError } from "../../utils/api-response.js";
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
                return sendError({
                    reply,
                    statusCode: 403,
                    message:
                        "Forbidden. You do not have permission to access this resource.",
                    code: "FORBIDDEN",
                    requestId: request.id,
                });
            }
        } catch {
            return sendError({
                reply,
                statusCode: 401,
                message: "Unauthorized",
                code: "UNAUTHORIZED",
                requestId: request.id,
            });
        }
    };
}
