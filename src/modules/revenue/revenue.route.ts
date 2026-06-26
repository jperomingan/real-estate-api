import type {
    FastifyInstance,
    FastifyReply,
} from "fastify";

import {
    sendError,
    sendSuccess,
} from "../../utils/api-response.js";
import {
    requirePermission,
} from "../permission/permission.middleware.js";
import type {
    JwtUser,
} from "../permission/permission.types.js";
import {
    createRevenueSchema,
    revenueIdParamsSchema,
    revenueListQuerySchema,
    updateCommissionStatusSchema,
    updatePaymentStatusSchema,
} from "./revenue.schema.js";
import {
    createRevenue,
    deleteRevenue,
    getRevenueById,
    getRevenues,
    getRevenueSummary,
    updateRevenueCommissionStatus,
    updateRevenuePaymentStatus,
} from "./revenue.service.js";
import {
    createRevenueBodySchema,
    revenueDeleteResponseSchema,
    revenueErrorResponseSchema,
    revenueListQuerySchemaForSwagger,
    revenueListResponseSchema,
    revenueParamsSchema,
    revenueSuccessResponseSchema,
    revenueSummaryResponseSchema,
    updateCommissionStatusBodySchema,
    updatePaymentStatusBodySchema,
} from "./revenue.swagger.js";

const forbiddenRevenueMessages = new Set([
    "Brokers can only create revenue records for their own properties.",
    "You can only view your own revenue records.",
    "You can only update your own revenue records.",
    "You can only delete your own revenue records.",
]);

const revenueNotFoundMessages = new Set([
    "Revenue record not found.",
    "Revenue record not found",
]);

function getErrorMessage(
    error: unknown,
    fallback: string,
): string {
    return error instanceof Error
        ? error.message
        : fallback;
}

function sendRevenueOperationError({
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
    const message = getErrorMessage(
        error,
        fallback,
    );

    if (forbiddenRevenueMessages.has(message)) {
        return sendError({
            reply,
            statusCode: 403,
            message,
            code: "FORBIDDEN",
            requestId,
        });
    }

    if (revenueNotFoundMessages.has(message)) {
        return sendError({
            reply,
            statusCode: 404,
            message,
            code: "REVENUE_NOT_FOUND",
            requestId,
        });
    }

    return sendError({
        reply,
        statusCode: 400,
        message,
        code: "REVENUE_OPERATION_FAILED",
        requestId,
    });
}

export async function revenueRoutes(
    app: FastifyInstance,
) {
    app.post(
        "/",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Create revenue record",
                description:
                    "Creates a revenue record and automatically calculates commission amount and payment status.",
                security: [{ bearerAuth: [] }],
                body: createRevenueBodySchema,
                response: {
                    201: revenueSuccessResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const bodyResult =
                createRevenueSchema.safeParse(
                    request.body,
                );

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        bodyResult.error.flatten()
                            .fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await createRevenue(
                    bodyResult.data,
                    user,
                );

                return sendSuccess({
                    reply,
                    statusCode: 201,
                    message:
                        "Revenue record created successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendRevenueOperationError({
                    reply,
                    requestId: request.id,
                    error,
                    fallback:
                        "Failed to create revenue record",
                });
            }
        },
    );

    app.get(
        "/summary",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue summary",
                description:
                    "Returns sales, commission, collection, receivable, payment-status, and commission-status totals.",
                security: [{ bearerAuth: [] }],
                response: {
                    200: revenueSummaryResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;
            const data = await getRevenueSummary(user);

            return sendSuccess({
                reply,
                message:
                    "Revenue summary fetched successfully",
                data,
            });
        },
    );

    app.get(
        "/",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "List revenue records",
                description:
                    "Admins see all records. Brokers see only records assigned to them.",
                security: [{ bearerAuth: [] }],
                querystring:
                    revenueListQuerySchemaForSwagger,
                response: {
                    200: revenueListResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult =
                revenueListQuerySchema.safeParse(
                    request.query,
                );

            if (!queryResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        queryResult.error.flatten()
                            .fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getRevenues(
                queryResult.data,
                user,
            );

            return sendSuccess({
                reply,
                message:
                    "Revenue records fetched successfully",
                data,
            });
        },
    );

    app.get(
        "/:id",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue record by ID",
                description:
                    "Returns one revenue record. Brokers may open only their own records.",
                security: [{ bearerAuth: [] }],
                params: revenueParamsSchema,
                response: {
                    200: revenueSuccessResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                    404: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult =
                revenueIdParamsSchema.safeParse(
                    request.params,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        paramsResult.error.flatten()
                            .fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await getRevenueById(
                    paramsResult.data.id,
                    user,
                );

                if (!revenue) {
                    return sendError({
                        reply,
                        statusCode: 404,
                        message:
                            "Revenue record not found",
                        code: "REVENUE_NOT_FOUND",
                        requestId: request.id,
                    });
                }

                return sendSuccess({
                    reply,
                    message:
                        "Revenue record fetched successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendRevenueOperationError({
                    reply,
                    requestId: request.id,
                    error,
                    fallback:
                        "Failed to fetch revenue record",
                });
            }
        },
    );

    app.patch(
        "/:id/payment-status",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Update revenue payment",
                description:
                    "Updates payment received and automatically derives UNPAID, PARTIAL, or PAID.",
                security: [{ bearerAuth: [] }],
                params: revenueParamsSchema,
                body: updatePaymentStatusBodySchema,
                response: {
                    200: revenueSuccessResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                    404: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult =
                revenueIdParamsSchema.safeParse(
                    request.params,
                );
            const bodyResult =
                updatePaymentStatusSchema.safeParse(
                    request.body,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        paramsResult.error.flatten()
                            .fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        bodyResult.error.flatten()
                            .fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue =
                    await updateRevenuePaymentStatus(
                        paramsResult.data.id,
                        bodyResult.data,
                        user,
                    );

                return sendSuccess({
                    reply,
                    message:
                        "Revenue payment updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendRevenueOperationError({
                    reply,
                    requestId: request.id,
                    error,
                    fallback:
                        "Failed to update revenue payment",
                });
            }
        },
    );

    app.patch(
        "/:id/commission-status",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Update commission status",
                description:
                    "Updates commission release status.",
                security: [{ bearerAuth: [] }],
                params: revenueParamsSchema,
                body: updateCommissionStatusBodySchema,
                response: {
                    200: revenueSuccessResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                    404: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult =
                revenueIdParamsSchema.safeParse(
                    request.params,
                );
            const bodyResult =
                updateCommissionStatusSchema.safeParse(
                    request.body,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        paramsResult.error.flatten()
                            .fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        bodyResult.error.flatten()
                            .fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue =
                    await updateRevenueCommissionStatus(
                        paramsResult.data.id,
                        bodyResult.data.commissionStatus,
                        user,
                    );

                return sendSuccess({
                    reply,
                    message:
                        "Revenue commission status updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendRevenueOperationError({
                    reply,
                    requestId: request.id,
                    error,
                    fallback:
                        "Failed to update commission status",
                });
            }
        },
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePermission(
                "MANAGE_REVENUES",
            ),
            schema: {
                tags: ["Revenue"],
                summary: "Delete revenue record",
                description:
                    "Admins may delete any record. Brokers may delete only their own.",
                security: [{ bearerAuth: [] }],
                params: revenueParamsSchema,
                response: {
                    200: revenueDeleteResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                    404: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult =
                revenueIdParamsSchema.safeParse(
                    request.params,
                );

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details:
                        paramsResult.error.flatten()
                            .fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;

                await deleteRevenue(
                    paramsResult.data.id,
                    user,
                );

                return sendSuccess({
                    reply,
                    message:
                        "Revenue record deleted successfully",
                    data: {
                        id: paramsResult.data.id,
                    },
                });
            } catch (error) {
                return sendRevenueOperationError({
                    reply,
                    requestId: request.id,
                    error,
                    fallback:
                        "Failed to delete revenue record",
                });
            }
        },
    );
}
