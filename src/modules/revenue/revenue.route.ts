import { FastifyInstance } from "fastify";
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
import { requirePermission } from "../permission/permission.middleware.js";
import { JwtUser } from "../permission/permission.types.js";
import { sendSuccess, sendError } from "../../utils/api-response.js";

export async function revenueRoutes(app: FastifyInstance) {
    app.post(
        "/",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Create revenue record",
                description:
                    "Creates a revenue record from a closed sale. If leadId is provided, the lead must be CLOSED_WON.",
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
            const bodyResult = createRevenueSchema.safeParse(request.body);

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await createRevenue(bodyResult.data, user);

                return sendSuccess({
                    reply,
                    statusCode: 201,
                    message: "Revenue record created successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to create revenue record",
                    code: "REVENUE_OPERATION_FAILED",
                    requestId: request.id,
                });
            }
        }
    );

    app.get(
        "/summary",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue summary",
                description:
                    "Returns summarized gross sales, commission, payment received, receivables, and status counts.",
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
                message: "Revenue summary fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "List revenue records",
                description:
                    "Returns revenue records with filters by property, broker, payment status, commission status, and sale date.",
                security: [{ bearerAuth: [] }],
                querystring: revenueListQuerySchemaForSwagger,
                response: {
                    200: revenueListResponseSchema,
                    400: revenueErrorResponseSchema,
                    401: revenueErrorResponseSchema,
                    403: revenueErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = revenueListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getRevenues(queryResult.data, user);

            return sendSuccess({
                reply,
                message: "Revenue records fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue record by ID",
                description:
                    "Returns a single revenue record. Brokers can only view their own revenue records.",
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
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await getRevenueById(paramsResult.data.id, user);

                if (!revenue) {
                    return sendError({
                        reply,
                        statusCode: 404,
                        message: "Revenue record not found",
                        code: "REVENUE_NOT_FOUND",
                        requestId: request.id,
                    });
                }

                return sendSuccess({
                    reply,
                    message: "Revenue record fetched successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 403,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch revenue record",
                    code: "REVENUE_ACCESS_DENIED",
                    requestId: request.id,
                });
            }
        }
    );

    app.patch(
        "/:id/payment-status",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Update payment status",
                description:
                    "Updates payment status and optionally updates the payment received amount.",
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
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);
            const bodyResult = updatePaymentStatusSchema.safeParse(request.body);

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await updateRevenuePaymentStatus(
                    paramsResult.data.id,
                    bodyResult.data,
                    user
                );

                return sendSuccess({
                    reply,
                    message: "Revenue payment status updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update payment status",
                    code: "REVENUE_OPERATION_FAILED",
                    requestId: request.id,
                });
            }
        }
    );

    app.patch(
        "/:id/commission-status",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Update commission status",
                description:
                    "Updates the commission release status for a revenue record.",
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
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);
            const bodyResult = updateCommissionStatusSchema.safeParse(request.body);

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await updateRevenueCommissionStatus(
                    paramsResult.data.id,
                    bodyResult.data.commissionStatus,
                    user
                );

                return sendSuccess({
                    reply,
                    message: "Revenue commission status updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update commission status",
                    code: "REVENUE_OPERATION_FAILED",
                    requestId: request.id,
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_REVENUES"),
            schema: {
                tags: ["Revenue"],
                summary: "Delete revenue record",
                description:
                    "Deletes a revenue record. Admins can delete any record. Brokers can delete only their own records.",
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
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message: "Validation error",
                    code: "VALIDATION_ERROR",
                    requestId: request.id,
                    details: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                await deleteRevenue(paramsResult.data.id, user);

                return sendSuccess({
                    reply,
                    message: "Revenue record deleted successfully",
                });
            } catch (error) {
                return sendError({
                    reply,
                    statusCode: 400,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete revenue record",
                    code: "REVENUE_OPERATION_FAILED",
                    requestId: request.id,
                });
            }
        }
    );
}
