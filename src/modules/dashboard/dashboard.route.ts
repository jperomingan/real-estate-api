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
    brokerPerformanceResponseSchema,
    dashboardErrorResponseSchema,
    dashboardQuerySchemaForSwagger,
    dashboardSummaryResponseSchema,
    leadConversionResponseSchema,
    monthlyRevenueResponseSchema,
    propertyStatsResponseSchema,
} from "./dashboard.swagger.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { JwtUser } from "../permission/permission.types.js";
import { sendSuccess, sendError } from "../../utils/api-response.js";

export async function dashboardRoutes(app: FastifyInstance) {
    app.get(
        "/summary",
        {
            preHandler: requirePermission("VIEW_DASHBOARD"),
            schema: {
                tags: ["Dashboard"],
                summary: "Get dashboard summary",
                description:
                    "Returns high-level dashboard totals for properties, leads, revenue, commission, and receivables.",
                security: [{ bearerAuth: [] }],
                querystring: dashboardQuerySchemaForSwagger,
                response: {
                    200: dashboardSummaryResponseSchema,
                    400: dashboardErrorResponseSchema,
                    401: dashboardErrorResponseSchema,
                    403: dashboardErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

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
            const data = await getDashboardSummary(queryResult.data, user);

            return sendSuccess({
                reply,
                message: "Dashboard summary fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/monthly-revenue",
        {
            preHandler: requirePermission("VIEW_DASHBOARD"),
            schema: {
                tags: ["Dashboard"],
                summary: "Get monthly revenue",
                description:
                    "Returns revenue grouped by month, including gross sales, commission, payment received, and count.",
                security: [{ bearerAuth: [] }],
                querystring: dashboardQuerySchemaForSwagger,
                response: {
                    200: monthlyRevenueResponseSchema,
                    400: dashboardErrorResponseSchema,
                    401: dashboardErrorResponseSchema,
                    403: dashboardErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

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
            const data = await getMonthlyRevenue(queryResult.data, user);

            return sendSuccess({
                reply,
                message: "Monthly revenue fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/lead-conversion",
        {
            preHandler: requirePermission("VIEW_DASHBOARD"),
            schema: {
                tags: ["Dashboard"],
                summary: "Get lead conversion statistics",
                description:
                    "Returns lead counts and percentage breakdown by lead status.",
                security: [{ bearerAuth: [] }],
                querystring: dashboardQuerySchemaForSwagger,
                response: {
                    200: leadConversionResponseSchema,
                    400: dashboardErrorResponseSchema,
                    401: dashboardErrorResponseSchema,
                    403: dashboardErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

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
            const data = await getLeadConversion(queryResult.data, user);

            return sendSuccess({
                reply,
                message: "Lead conversion statistics fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/property-stats",
        {
            preHandler: requirePermission("VIEW_DASHBOARD"),
            schema: {
                tags: ["Dashboard"],
                summary: "Get property statistics",
                description:
                    "Returns property count grouped by status, type, and location.",
                security: [{ bearerAuth: [] }],
                response: {
                    200: propertyStatsResponseSchema,
                    401: dashboardErrorResponseSchema,
                    403: dashboardErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;
            const data = await getPropertyStats(user);

            return sendSuccess({
                reply,
                message: "Property statistics fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/broker-performance",
        {
            preHandler: requirePermission("VIEW_DASHBOARD"),
            schema: {
                tags: ["Dashboard"],
                summary: "Get broker performance",
                description:
                    "Returns broker sales performance ranked by total gross sales.",
                security: [{ bearerAuth: [] }],
                querystring: dashboardQuerySchemaForSwagger,
                response: {
                    200: brokerPerformanceResponseSchema,
                    400: dashboardErrorResponseSchema,
                    401: dashboardErrorResponseSchema,
                    403: dashboardErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = dashboardQuerySchema.safeParse(request.query);

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
            const data = await getBrokerPerformance(queryResult.data, user);

            return sendSuccess({
                reply,
                message: "Broker performance fetched successfully",
                data,
            });
        }
    );
}
