import type {
    FastifyInstance,
    FastifyReply,
} from "fastify";

import {
    sendError,
    sendSuccess,
} from "../../utils/api-response.js";

import {
    requireAnyPermission,
    requirePermission,
} from "../permission/permission.middleware.js";

import type {
    JwtUser,
} from "../permission/permission.types.js";

import {
    createViewingSchema,
    rescheduleViewingSchema,
    updateViewingStatusSchema,
    viewingIdParamsSchema,
    viewingListQuerySchema,
} from "./viewing.schema.js";

import {
    createViewingAppointment,
    deleteViewingAppointment,
    getViewingAppointmentById,
    getViewingAppointments,
    rescheduleViewingAppointment,
    updateViewingStatus,
} from "./viewing.service.js";

import {
    createViewingBodySchema,
    rescheduleViewingBodySchema,
    updateViewingStatusBodySchema,
    viewingDeleteResponseSchema,
    viewingErrorResponseSchema,
    viewingListQuerySchemaForSwagger,
    viewingListResponseSchema,
    viewingParamsSchema,
    viewingSuccessResponseSchema,
} from "./viewing.swagger.js";

const forbiddenViewingMessages = new Set([
    "You can only view your own appointments.",
    "You can only update your own appointments.",
    "You can only reschedule your own appointments.",
    "You can only delete your own appointments.",
    "Clients are not allowed to update viewing appointment statuses.",
    "Clients are not allowed to reschedule viewing appointments directly.",
    "Clients are not allowed to delete viewing appointments.",
]);

const viewingNotFoundMessages = new Set([
    "Viewing appointment not found.",
    "Viewing appointment not found",
]);

function getErrorMessage(
    error: unknown,
    fallback: string,
): string {
    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

function sendViewingOperationError({
    reply,
    requestId,
    error,
    fallback,
}: {
    reply: FastifyReply;
    requestId: string;
    error: unknown;
    fallback: string;
}) {
    const message =
        getErrorMessage(
            error,
            fallback,
        );

    if (
        forbiddenViewingMessages.has(
            message,
        )
    ) {
        return sendError({
            reply,
            statusCode: 403,
            message,
            code: "FORBIDDEN",
            requestId,
        });
    }

    if (
        viewingNotFoundMessages.has(
            message,
        )
    ) {
        return sendError({
            reply,
            statusCode: 404,
            message,
            code: "VIEWING_NOT_FOUND",
            requestId,
        });
    }

    return sendError({
        reply,
        statusCode: 400,
        message,
        code: "VIEWING_OPERATION_FAILED",
        requestId,
    });
}

export async function viewingRoutes(
    app: FastifyInstance,
) {
    app.post(
        "/",
        {
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: "1 hour",
                },
            },

            schema: {
                tags: ["Viewings"],

                summary:
                    "Request property viewing",

                description:
                    "Creates a viewing appointment request for a published property.",

                body:
                    createViewingBodySchema,

                response: {
                    201:
                        viewingSuccessResponseSchema,

                    400:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const bodyResult =
                createViewingSchema.safeParse(
                    request.body,
                );

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        bodyResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            try {
                let user:
                    | JwtUser
                    | undefined;

                try {
                    await request.jwtVerify();

                    user =
                        request.user as JwtUser;
                } catch {
                    user = undefined;
                }

                const viewing =
                    await createViewingAppointment(
                        bodyResult.data,
                        user,
                    );

                return sendSuccess({
                    reply,
                    statusCode: 201,
                    message:
                        "Viewing request created successfully",
                    data: viewing,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        getErrorMessage(
                            error,
                            "Failed to request viewing appointment",
                        ),
                    code:
                        "VIEWING_REQUEST_FAILED",
                    requestId:
                        request.id,
                });
            }
        },
    );

    app.get(
        "/",
        {
            preHandler:
                requireAnyPermission([
                    "MANAGE_VIEWINGS",
                    "VIEW_OWN_VIEWINGS",
                ]),

            schema: {
                tags: ["Viewings"],

                summary:
                    "List viewing appointments",

                description:
                    "Admins see all viewing appointments, brokers see appointments assigned to them, and clients see only their own appointments.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                querystring:
                    viewingListQuerySchemaForSwagger,

                response: {
                    200:
                        viewingListResponseSchema,

                    400:
                        viewingErrorResponseSchema,

                    401:
                        viewingErrorResponseSchema,

                    403:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const queryResult =
                viewingListQuerySchema.safeParse(
                    request.query,
                );

            if (!queryResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        queryResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            const user =
                request.user as JwtUser;

            const data =
                await getViewingAppointments(
                    queryResult.data,
                    user,
                );

            return sendSuccess({
                reply,
                message:
                    "Viewings fetched successfully",
                data,
            });
        },
    );

    app.get(
        "/:id",
        {
            preHandler:
                requireAnyPermission([
                    "MANAGE_VIEWINGS",
                    "VIEW_OWN_VIEWINGS",
                ]),

            schema: {
                tags: ["Viewings"],

                summary:
                    "Get viewing appointment by ID",

                description:
                    "Admins may view any appointment. Brokers and clients may view only appointments assigned to them.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                params:
                    viewingParamsSchema,

                response: {
                    200:
                        viewingSuccessResponseSchema,

                    400:
                        viewingErrorResponseSchema,

                    401:
                        viewingErrorResponseSchema,

                    403:
                        viewingErrorResponseSchema,

                    404:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const paramsResult =
                viewingIdParamsSchema.safeParse(
                    request.params,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        paramsResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            try {
                const user =
                    request.user as JwtUser;

                const viewing =
                    await getViewingAppointmentById(
                        paramsResult.data.id,
                        user,
                    );

                if (!viewing) {
                    return sendError({
                        reply,
                        statusCode: 404,
                        message:
                            "Viewing appointment not found",
                        code:
                            "VIEWING_NOT_FOUND",
                        requestId:
                            request.id,
                    });
                }

                return sendSuccess({
                    reply,
                    message:
                        "Viewing fetched successfully",
                    data: viewing,
                });
            } catch (error) {
                return sendViewingOperationError({
                    reply,
                    requestId:
                        request.id,
                    error,
                    fallback:
                        "Failed to fetch viewing appointment",
                });
            }
        },
    );

    app.patch(
        "/:id/status",
        {
            preHandler:
                requirePermission(
                    "MANAGE_VIEWINGS",
                ),

            schema: {
                tags: ["Viewings"],

                summary:
                    "Update viewing status",

                description:
                    "Updates a viewing appointment status. Only administrators and assigned brokers may perform this operation.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                params:
                    viewingParamsSchema,

                body:
                    updateViewingStatusBodySchema,

                response: {
                    200:
                        viewingSuccessResponseSchema,

                    400:
                        viewingErrorResponseSchema,

                    401:
                        viewingErrorResponseSchema,

                    403:
                        viewingErrorResponseSchema,

                    404:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const paramsResult =
                viewingIdParamsSchema.safeParse(
                    request.params,
                );

            const bodyResult =
                updateViewingStatusSchema.safeParse(
                    request.body,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        paramsResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        bodyResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            try {
                const user =
                    request.user as JwtUser;

                const viewing =
                    await updateViewingStatus(
                        paramsResult.data.id,
                        bodyResult.data,
                        user,
                    );

                return sendSuccess({
                    reply,
                    message:
                        "Viewing status updated successfully",
                    data: viewing,
                });
            } catch (error) {
                return sendViewingOperationError({
                    reply,
                    requestId:
                        request.id,
                    error,
                    fallback:
                        "Failed to update viewing status",
                });
            }
        },
    );

    app.patch(
        "/:id/reschedule",
        {
            preHandler:
                requirePermission(
                    "MANAGE_VIEWINGS",
                ),

            schema: {
                tags: ["Viewings"],

                summary:
                    "Reschedule viewing appointment",

                description:
                    "Reschedules a viewing appointment. Only administrators and assigned brokers may perform this operation.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                params:
                    viewingParamsSchema,

                body:
                    rescheduleViewingBodySchema,

                response: {
                    200:
                        viewingSuccessResponseSchema,

                    400:
                        viewingErrorResponseSchema,

                    401:
                        viewingErrorResponseSchema,

                    403:
                        viewingErrorResponseSchema,

                    404:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const paramsResult =
                viewingIdParamsSchema.safeParse(
                    request.params,
                );

            const bodyResult =
                rescheduleViewingSchema.safeParse(
                    request.body,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        paramsResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        bodyResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            try {
                const user =
                    request.user as JwtUser;

                const viewing =
                    await rescheduleViewingAppointment(
                        paramsResult.data.id,
                        bodyResult.data,
                        user,
                    );

                return sendSuccess({
                    reply,
                    message:
                        "Viewing rescheduled successfully",
                    data: viewing,
                });
            } catch (error) {
                return sendViewingOperationError({
                    reply,
                    requestId:
                        request.id,
                    error,
                    fallback:
                        "Failed to reschedule viewing appointment",
                });
            }
        },
    );

    app.delete(
        "/:id",
        {
            preHandler:
                requirePermission(
                    "MANAGE_VIEWINGS",
                ),

            schema: {
                tags: ["Viewings"],

                summary:
                    "Delete viewing appointment",

                description:
                    "Deletes a viewing appointment. Clients cannot delete appointments.",

                security: [
                    {
                        bearerAuth: [],
                    },
                ],

                params:
                    viewingParamsSchema,

                response: {
                    200:
                        viewingDeleteResponseSchema,

                    400:
                        viewingErrorResponseSchema,

                    401:
                        viewingErrorResponseSchema,

                    403:
                        viewingErrorResponseSchema,

                    404:
                        viewingErrorResponseSchema,
                },
            },
        },

        async (request, reply) => {
            const paramsResult =
                viewingIdParamsSchema.safeParse(
                    request.params,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        "Validation error",
                    code:
                        "VALIDATION_ERROR",
                    requestId:
                        request.id,
                    details:
                        paramsResult.error
                            .flatten()
                            .fieldErrors,
                });
            }

            try {
                const user =
                    request.user as JwtUser;

                await deleteViewingAppointment(
                    paramsResult.data.id,
                    user,
                );

                return reply.send({
                    message:
                        "Viewing appointment deleted successfully",
                });
            } catch (error) {
                return sendViewingOperationError({
                    reply,
                    requestId:
                        request.id,
                    error,
                    fallback:
                        "Failed to delete viewing appointment",
                });
            }
        },
    );
}