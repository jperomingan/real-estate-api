import { FastifyInstance } from "fastify";
import { auditIdParamsSchema, auditListQuerySchema } from "./audit.schema.js";
import { getAuditLogById, getAuditLogs } from "./audit.service.js";
import { requirePermission } from "../permission/permission.middleware.js";

export async function auditRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: requirePermission("VIEW_AUDIT_LOGS"),
            schema: {
                tags: ["Audit Logs"],
                summary: "List audit logs",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        action: {
                            type: "string",
                            enum: [
                                "CREATE",
                                "UPDATE",
                                "DELETE",
                                "APPROVE",
                                "REJECT",
                                "LOGIN",
                                "LOGOUT",
                                "STATUS_CHANGE",
                            ],
                        },
                        resourceType: { type: "string" },
                        resourceId: { type: "string" },
                        actorUserId: { type: "string" },
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
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