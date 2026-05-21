import { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { isAppError } from "../utils/app-error.js";

export async function errorHandlerPlugin(app: FastifyInstance) {
    app.setErrorHandler((error: FastifyError | Error, request, reply) => {
        request.log.error(error);

        if (isAppError(error)) {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message,
                errors: error.errors ?? null,
            });
        }

        if (error instanceof ZodError) {
            return reply.status(400).send({
                success: false,
                message: "Validation error",
                errors: error.flatten().fieldErrors,
            });
        }

        if ("statusCode" in error && typeof error.statusCode === "number") {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message || "Request failed",
                errors: null,
            });
        }

        return reply.status(500).send({
            success: false,
            message: "Internal server error",
            errors: null,
        });
    });

    app.setNotFoundHandler((request, reply) => {
        return reply.status(404).send({
            success: false,
            message: `Route ${request.method} ${request.url} not found`,
            errors: null,
        });
    });
}