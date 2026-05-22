import { FastifyInstance } from "fastify";
import {
    createLeadSchema,
    leadIdParamsSchema,
    leadListQuerySchema,
    updateLeadStatusSchema,
} from "./lead.schema.js";
import {
    createLead,
    deleteLead,
    getLeadById,
    getLeads,
    updateLeadStatus,
} from "./lead.service.js";
import { JwtUser } from "../permission/permission.types.js";
import { requirePermission } from "../permission/permission.middleware.js";

export async function leadRoutes(app: FastifyInstance) {
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
                tags: ["Leads"],
                summary: "Create lead or property inquiry",
                body: {
                    type: "object",
                    required: ["firstName", "phone"],
                    properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        message: { type: "string" },
                        source: {
                            type: "string",
                            enum: [
                                "WEBSITE",
                                "FACEBOOK",
                                "REFERRAL",
                                "WALK_IN",
                                "PHONE_CALL",
                                "EMAIL",
                                "OTHER",
                            ],
                        },
                        budget: { type: "number" },
                        preferredDate: { type: "string" },
                        propertyId: { type: "string" },
                        brokerId: { type: "string" },
                    },
                },
            },
        },
        async (request, reply) => {
            const bodyResult = createLeadSchema.safeParse(request.body);

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                let user: JwtUser | undefined;

                try {
                    await request.jwtVerify();
                    user = request.user as JwtUser;
                } catch {
                    user = undefined;
                }

                const lead = await createLead(bodyResult.data, user);

                return reply.status(201).send({
                    message: "Lead created successfully",
                    data: lead,
                });
            } catch (error) {
                return reply.status(400).send({
                    message: error instanceof Error ? error.message : "Failed to create lead",
                });
            }
        }
    );

    app.get(
        "/",
        {
            preHandler: requirePermission("MANAGE_LEADS"),
            schema: {
                tags: ["Leads"],
                summary: "List leads",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        status: {
                            type: "string",
                            enum: [
                                "NEW",
                                "CONTACTED",
                                "QUALIFIED",
                                "VIEWING_SCHEDULED",
                                "NEGOTIATION",
                                "CLOSED_WON",
                                "CLOSED_LOST",
                                "ARCHIVED",
                            ],
                        },
                        source: {
                            type: "string",
                            enum: [
                                "WEBSITE",
                                "FACEBOOK",
                                "REFERRAL",
                                "WALK_IN",
                                "PHONE_CALL",
                                "EMAIL",
                                "OTHER",
                            ],
                        },
                        propertyId: { type: "string" },
                        brokerId: { type: "string" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = leadListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getLeads(queryResult.data, user);

            return reply.send({
                message: "Leads fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_LEADS"),
            schema: {
                tags: ["Leads"],
                summary: "Get lead by ID",
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
            const paramsResult = leadIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const lead = await getLeadById(paramsResult.data.id, user);

                if (!lead) {
                    return reply.status(404).send({
                        message: "Lead not found",
                    });
                }

                return reply.send({
                    message: "Lead fetched successfully",
                    data: lead,
                });
            } catch (error) {
                return reply.status(403).send({
                    message: error instanceof Error ? error.message : "Failed to fetch lead",
                });
            }
        }
    );

    app.patch(
        "/:id/status",
        {
            preHandler: requirePermission("MANAGE_LEADS"),
            schema: {
                tags: ["Leads"],
                summary: "Update lead status",
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
                    required: ["status"],
                    properties: {
                        status: {
                            type: "string",
                            enum: [
                                "NEW",
                                "CONTACTED",
                                "QUALIFIED",
                                "VIEWING_SCHEDULED",
                                "NEGOTIATION",
                                "CLOSED_WON",
                                "CLOSED_LOST",
                                "ARCHIVED",
                            ],
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const paramsResult = leadIdParamsSchema.safeParse(request.params);
            const bodyResult = updateLeadStatusSchema.safeParse(request.body);

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
                const lead = await updateLeadStatus(
                    paramsResult.data.id,
                    bodyResult.data.status,
                    user
                );

                return reply.send({
                    message: "Lead status updated successfully",
                    data: lead,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error ? error.message : "Failed to update lead status",
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_LEADS"),
            schema: {
                tags: ["Leads"],
                summary: "Delete lead",
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
            const paramsResult = leadIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                await deleteLead(paramsResult.data.id, user);

                return reply.send({
                    message: "Lead deleted successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message: error instanceof Error ? error.message : "Failed to delete lead",
                });
            }
        }
    );
}