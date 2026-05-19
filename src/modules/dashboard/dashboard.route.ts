import { FastifyInstance } from "fastify";
import { dashboardQuerySchema } from "./dashboard.schema.js";
import {
    getBrokerPerformance,
    getDashboardSummary,
    getLeadConversion,
    getMonthlyRevenue,
    getPropertyStats,
} from "./dashboard.service.js";
import {
    JwtUser,
    requireRevenueManager,
} from "../revenue/revenue.middleware.js";

export async function dashboardRoutes(app: FastifyInstance) {
    app.get(
        "/summary",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Dashboard"],
                summary: "Get dashboard summary",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getDashboardSummary(queryResult.data, user);

            return reply.send({
                message: "Dashboard summary fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/monthly-revenue",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Dashboard"],
                summary: "Get monthly revenue",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getMonthlyRevenue(queryResult.data, user);

            return reply.send({
                message: "Monthly revenue fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/lead-conversion",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Dashboard"],
                summary: "Get lead conversion statistics",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getLeadConversion(queryResult.data, user);

            return reply.send({
                message: "Lead conversion statistics fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/property-stats",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Dashboard"],
                summary: "Get property statistics",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;
            const data = await getPropertyStats(user);

            return reply.send({
                message: "Property statistics fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/broker-performance",
        {
            preHandler: requireRevenueManager,
            schema: {
                tags: ["Dashboard"],
                summary: "Get broker performance",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getBrokerPerformance(queryResult.data, user);

            return reply.send({
                message: "Broker performance fetched successfully",
                data,
            });
        }
    );
}