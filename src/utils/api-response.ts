import type { FastifyReply } from "fastify";

type SuccessResponseInput<T> = {
    reply: FastifyReply;
    statusCode?: number;
    message: string;
    data?: T;
    meta?: Record<string, unknown>;
};

type ErrorResponseInput = {
    reply: FastifyReply;
    statusCode?: number;
    message: string;
    code?: string;
    details?: unknown;
    requestId?: string;
};

export function sendSuccess<T>({
    reply,
    statusCode = 200,
    message,
    data,
    meta,
}: SuccessResponseInput<T>) {
    return reply.status(statusCode).send({
        success: true,
        message,
        data: data ?? null,
        ...(meta ? { meta } : {}),
    });
}

export function sendError({
    reply,
    statusCode = 500,
    message,
    code = "INTERNAL_SERVER_ERROR",
    details,
    requestId,
}: ErrorResponseInput) {
    return reply.status(statusCode).send({
        success: false,
        message,
        error: {
            code,
            statusCode,
            ...(requestId ? { requestId } : {}),
            ...(details ? { details } : {}),
        },
    });
}

export function buildPaginationMeta({
    page,
    limit,
    total,
}: {
    page: number;
    limit: number;
    total: number;
}) {
    const totalPages = Math.ceil(total / limit);

    return {
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}