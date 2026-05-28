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
import {
    createLeadBodySchema,
    leadDeleteResponseSchema,
    leadErrorResponseSchema,
    leadListQuerySchemaForSwagger,
    leadListResponseSchema,
    leadParamsSchema,
    leadSuccessResponseSchema,
    updateLeadStatusBodySchema,
} from "./lead.swagger.js";
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
                description:
                    "Creates a lead from a property inquiry. Public users can submit leads. If propertyId is provided, the lead is assigned to the property's broker.",
                body: createLeadBodySchema,
                response: {
                    201: leadSuccessResponseSchema,
                    400: leadErrorResponseSchema,
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
                description:
                    "Returns leads for admins or approved brokers. Brokers only see their own assigned leads.",
                security: [{ bearerAuth: [] }],
                querystring: leadListQuerySchemaForSwagger,
                response: {
                    200: leadListResponseSchema,
                    400: leadErrorResponseSchema,
                    401: leadErrorResponseSchema,
                    403: leadErrorResponseSchema,
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
                description:
                    "Returns one lead record. Brokers can only view their own assigned leads.",
                security: [{ bearerAuth: [] }],
                params: leadParamsSchema,
                response: {
                    200: leadSuccessResponseSchema,
                    400: leadErrorResponseSchema,
                    401: leadErrorResponseSchema,
                    403: leadErrorResponseSchema,
                    404: leadErrorResponseSchema,
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
                description:
                    "Updates the status of a lead. Useful for tracking lead progress from NEW to CLOSED_WON or CLOSED_LOST.",
                security: [{ bearerAuth: [] }],
                params: leadParamsSchema,
                body: updateLeadStatusBodySchema,
                response: {
                    200: leadSuccessResponseSchema,
                    400: leadErrorResponseSchema,
                    401: leadErrorResponseSchema,
                    403: leadErrorResponseSchema,
                    404: leadErrorResponseSchema,
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
                description:
                    "Deletes a lead record. Admins can delete any lead. Brokers can delete only their own leads.",
                security: [{ bearerAuth: [] }],
                params: leadParamsSchema,
                response: {
                    200: leadDeleteResponseSchema,
                    400: leadErrorResponseSchema,
                    401: leadErrorResponseSchema,
                    403: leadErrorResponseSchema,
                    404: leadErrorResponseSchema,
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