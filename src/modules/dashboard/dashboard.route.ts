import type { FastifyInstance } from "fastify";

import { sendError, sendSuccess } from "../../utils/api-response.js";

import { requirePermission } from "../permission/permission.middleware.js";

import type { JwtUser } from "../permission/permission.types.js";

import { dashboardSummaryQuerySchema } from "./dashboard.schema.js";

import { getDashboardSummary } from "./dashboard.service.js";

import {
  dashboardErrorResponseSchema,
  dashboardSummaryQuerySchemaForSwagger,
  dashboardSummaryResponseSchema,
} from "./dashboard.swagger.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/summary",
    {
      preHandler: requirePermission("VIEW_DASHBOARD"),

      schema: {
        tags: ["Dashboard"],

        summary: "Get dashboard summary",

        description:
          "Returns dashboard counts, grouped status totals, revenue totals, and recent records. Admins see global data. Brokers see only records assigned to them.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        querystring: dashboardSummaryQuerySchemaForSwagger,

        response: {
          200: dashboardSummaryResponseSchema,

          400: dashboardErrorResponseSchema,

          401: dashboardErrorResponseSchema,

          403: dashboardErrorResponseSchema,
        },
      },
    },

    async (request, reply) => {
      const queryResult = dashboardSummaryQuerySchema.safeParse(request.query);

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

      const data = await getDashboardSummary(user, queryResult.data);

      return sendSuccess({
        reply,
        message: "Dashboard summary fetched successfully",
        data,
      });
    },
  );
}
