import { FastifyInstance } from "fastify";
import { auditIdParamsSchema, auditListQuerySchema } from "./audit.schema.js";
import { getAuditLogById, getAuditLogs } from "./audit.service.js";
import { requirePermission } from "../permission/permission.middleware.js";
import {
    auditErrorResponseSchema,
    auditListQuerySchemaForSwagger,
    auditListResponseSchema,
    auditParamsSchema,
    auditSuccessResponseSchema,
} from "./audit.swagger.js";

export async function auditRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: requirePermission("VIEW_AUDIT_LOGS"),
            schema: {
                tags: ["Audit Logs"],
                summary: "List audit logs",
                description:
                    "Returns system audit logs. Admin access only.",
                security: [{ bearerAuth: [] }],
                querystring: auditListQuerySchemaForSwagger,
                response: {
                    200: auditListResponseSchema,
                    400: auditErrorResponseSchema,
                    401: auditErrorResponseSchema,
                    403: auditErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = auditListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const data = await getAuditLogs(queryResult.data);

            return reply.send({
                message: "Audit logs fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            preHandler: requirePermission("VIEW_AUDIT_LOGS"),
            schema: {
                tags: ["Audit Logs"],
                summary: "Get audit log by ID",
                description:
                    "Returns one audit log entry by ID. Admin access only.",
                security: [{ bearerAuth: [] }],
                params: auditParamsSchema,
                response: {
                    200: auditSuccessResponseSchema,
                    400: auditErrorResponseSchema,
                    401: auditErrorResponseSchema,
                    403: auditErrorResponseSchema,
                    404: auditErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = auditIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const auditLog = await getAuditLogById(paramsResult.data.id);

            if (!auditLog) {
                return reply.status(404).send({
                    message: "Audit log not found",
                });
            }

            return reply.send({
                message: "Audit log fetched successfully",
                data: auditLog,
            });
        }
    );
}