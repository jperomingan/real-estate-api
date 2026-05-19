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
import { JwtUser, requireRevenueManager } from "./revenue.middleware.js";

export async function revenueRoutes(app: FastifyInstance) {
    app.post(
        "/",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Create revenue record from a closed sale",
                security: [{ bearerAuth: [] }],
                body: {
                    type: "object",
                    required: ["propertyId", "grossSaleAmount", "commissionRate"],
                    properties: {
                        propertyId: { type: "string" },
                        leadId: { type: "string" },
                        brokerId: { type: "string" },
                        grossSaleAmount: { type: "number" },
                        commissionRate: { type: "number" },
                        paymentReceived: { type: "number" },
                        paymentStatus: {
                            type: "string",
                            enum: ["UNPAID", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"],
                        },
                        commissionStatus: {
                            type: "string",
                            enum: ["PENDING", "PARTIAL", "RELEASED", "CANCELLED"],
                        },
                        saleDate: { type: "string" },
                        notes: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const bodyResult = createRevenueSchema.safeParse(request.body);

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await createRevenue(bodyResult.data, user);

                return reply.status(201).send({
                    message: "Revenue record created successfully",
                    data: revenue,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to create revenue record",
                });
            }
        }
    );

    app.get(
        "/summary",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue summary",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;
            const data = await getRevenueSummary(user);

            return reply.send({
                message: "Revenue summary fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "List revenue records",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        propertyId: { type: "string" },
                        brokerId: { type: "string" },
                        paymentStatus: {
                            type: "string",
                            enum: ["UNPAID", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"],
                        },
                        commissionStatus: {
                            type: "string",
                            enum: ["PENDING", "PARTIAL", "RELEASED", "CANCELLED"],
                        },
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = revenueListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getRevenues(queryResult.data, user);

            return reply.send({
                message: "Revenue records fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Get revenue record by ID",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await getRevenueById(paramsResult.data.id, user);

                if (!revenue) {
                    return reply.status(404).send({
                        message: "Revenue record not found",
                    });
                }

                return reply.send({
                    message: "Revenue record fetched successfully",
                    data: revenue,
                });
            } catch (error) {
                return reply.status(403).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch revenue record",
                });
            }
        }
    );

    app.patch(
        "/:id/payment-status",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Update payment status",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "string" },
                    },
                },
                body: {
                    type: "object",
                    required: ["paymentStatus"],
                    properties: {
                        paymentStatus: {
                            type: "string",
                            enum: ["UNPAID", "PARTIAL", "PAID", "CANCELLED", "REFUNDED"],
                        },
                        paymentReceived: { type: "number" },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);
            const bodyResult = updatePaymentStatusSchema.safeParse(request.body);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await updateRevenuePaymentStatus(
                    paramsResult.data.id,
                    bodyResult.data,
                    user
                );

                return reply.send({
                    message: "Revenue payment status updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update payment status",
                });
            }
        }
    );

    app.patch(
        "/:id/commission-status",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Update commission status",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "string" },
                    },
                },
                body: {
                    type: "object",
                    required: ["commissionStatus"],
                    properties: {
                        commissionStatus: {
                            type: "string",
                            enum: ["PENDING", "PARTIAL", "RELEASED", "CANCELLED"],
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);
            const bodyResult = updateCommissionStatusSchema.safeParse(request.body);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const revenue = await updateRevenueCommissionStatus(
                    paramsResult.data.id,
                    bodyResult.data.commissionStatus,
                    user
                );

                return reply.send({
                    message: "Revenue commission status updated successfully",
                    data: revenue,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update commission status",
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Revenue"],
                summary: "Delete revenue record",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["id"],
                    properties: {
                        id: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = revenueIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                await deleteRevenue(paramsResult.data.id, user);

                return reply.send({
                    message: "Revenue record deleted successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete revenue record",
                });
            }
        }
    );
}