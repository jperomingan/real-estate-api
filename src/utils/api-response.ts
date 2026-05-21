import { FastifyReply } from "fastify";

type SuccessResponseInput<T> = {
    reply: FastifyReply;
    message: string;
    data?: T;
    statusCode?: number;
};

type ErrorResponseInput = {
    reply: FastifyReply;
    message: string;
    errors?: unknown;
    statusCode?: number;
};

export function sendSuccess<T>({
    reply,
    message,
    data,
    statusCode = 200,
}: SuccessResponseInput<T>) {
    return reply.status(statusCode).send({
        success: true,
        message,
        data,
    });
}

export function sendError({
    reply,
    message,
    errors,
    statusCode = 400,
}: ErrorResponseInput) {
    return reply.status(statusCode).send({
        success: false,
        message,
        errors,
    });
}