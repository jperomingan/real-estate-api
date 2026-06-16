import type {
    FastifyError,
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
} from "fastify";
import { env } from "../config/env.js";

function getStatusCode(error: FastifyError) {
    if (error.statusCode && error.statusCode >= 400) {
        return error.statusCode;
    }

    return 500;
}

function getErrorCode(error: FastifyError, statusCode: number) {
    if (error.code) {
        return error.code;
    }

    if (statusCode === 400) return "BAD_REQUEST";
    if (statusCode === 401) return "UNAUTHORIZED";
    if (statusCode === 403) return "FORBIDDEN";
    if (statusCode === 404) return "NOT_FOUND";

    return "INTERNAL_SERVER_ERROR";
}

function getSafeMessage(error: FastifyError, statusCode: number) {
    const isProduction = env.NODE_ENV === "production";

    if (isProduction && statusCode >= 500) {
        return "Internal server error";
    }

    return error.message || "Unexpected error";
}

export async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler(
        async (
            error: FastifyError,
            request: FastifyRequest,
            reply: FastifyReply,
        ) => {
            const statusCode = getStatusCode(error);
            const code = getErrorCode(error, statusCode);
            const message = getSafeMessage(error, statusCode);

            if (statusCode >= 500) {
                request.log.error(
                    {
                        err: error,
                        requestId: request.id,
                    },
                    "Unhandled server error",
                );
            } else {
                request.log.warn(
                    {
                        err: error,
                        requestId: request.id,
                    },
                    "Request error",
                );
            }

            return reply.status(statusCode).send({
                success: false,
                message,
                error: {
                    code,
                    statusCode,
                    requestId: request.id,
                    ...(env.NODE_ENV !== "production"
                        ? {
                            details: error.stack,
                        }
                        : {}),
                },
            });
        },
    );
}
