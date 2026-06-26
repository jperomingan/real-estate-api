import type {
    FastifyReply,
    FastifyRequest,
} from "fastify";

import {
    sendError,
} from "../../utils/api-response.js";

import {
    hasPermission,
} from "./permission.service.js";

import type {
    JwtUser,
    Permission,
} from "./permission.types.js";

function sendUnauthorized(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    return sendError({
        reply,
        statusCode: 401,
        message: "Unauthorized",
        code: "UNAUTHORIZED",
        requestId: request.id,
    });
}

function sendForbidden(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    return sendError({
        reply,
        statusCode: 403,
        message:
            "Forbidden. You do not have permission to access this resource.",
        code: "FORBIDDEN",
        requestId: request.id,
    });
}

export function requireAnyPermission(
    permissions: readonly Permission[],
) {
    return async function permissionMiddleware(
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        try {
            await request.jwtVerify();
        } catch {
            return sendUnauthorized(
                request,
                reply,
            );
        }

        const user =
            request.user as JwtUser;

        const isAllowed = permissions.some(
            (permission) =>
                hasPermission(
                    user,
                    permission,
                ),
        );

        if (!isAllowed) {
            return sendForbidden(
                request,
                reply,
            );
        }
    };
}

export function requirePermission(
    permission: Permission,
) {
    return requireAnyPermission([
        permission,
    ]);
}