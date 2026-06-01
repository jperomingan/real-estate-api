import { FastifyInstance } from "fastify";
import {
    createViewingSchema,
    rescheduleViewingSchema,
    updateViewingStatusSchema,
    viewingIdParamsSchema,
    viewingListQuerySchema,
} from "./viewing.schema.js";
import {
    createViewingAppointment,
    deleteViewingAppointment,
    getViewingAppointmentById,
    getViewingAppointments,
    rescheduleViewingAppointment,
    updateViewingStatus,
} from "./viewing.service.js";
import {
    createViewingBodySchema,
    rescheduleViewingBodySchema,
    updateViewingStatusBodySchema,
    viewingDeleteResponseSchema,
    viewingErrorResponseSchema,
    viewingListQuerySchemaForSwagger,
    viewingListResponseSchema,
    viewingParamsSchema,
    viewingSuccessResponseSchema,
} from "./viewing.swagger.js";
import { JwtUser } from "../permission/permission.types.js";
import { requirePermission } from "../permission/permission.middleware.js";

export async function viewingRoutes(app: FastifyInstance) {
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
                tags: ["Viewings"],
                summary: "Request property viewing",
                description:
                    "Creates a viewing appointment request for a published property.",
                body: createViewingBodySchema,
                response: {
                    201: viewingSuccessResponseSchema,
                    400: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const bodyResult = createViewingSchema.safeParse(request.body);

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

                const viewing = await createViewingAppointment(bodyResult.data, user);

                return reply.status(201).send({
                    message: "Viewing appointment requested successfully",
                    data: viewing,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to request viewing appointment",
                });
            }
        }
    );

    app.get(
        "/",
        {
            preHandler: requirePermission("MANAGE_VIEWINGS"),
            schema: {
                tags: ["Viewings"],
                summary: "List viewing appointments",
                description:
                    "Returns viewing appointments for admins or approved brokers. Brokers only see their own appointments.",
                security: [{ bearerAuth: [] }],
                querystring: viewingListQuerySchemaForSwagger,
                response: {
                    200: viewingListResponseSchema,
                    400: viewingErrorResponseSchema,
                    401: viewingErrorResponseSchema,
                    403: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = viewingListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getViewingAppointments(queryResult.data, user);

            return reply.send({
                message: "Viewing appointments fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_VIEWINGS"),
            schema: {
                tags: ["Viewings"],
                summary: "Get viewing appointment by ID",
                description:
                    "Returns one viewing appointment. Brokers can only view their own appointments.",
                security: [{ bearerAuth: [] }],
                params: viewingParamsSchema,
                response: {
                    200: viewingSuccessResponseSchema,
                    400: viewingErrorResponseSchema,
                    401: viewingErrorResponseSchema,
                    403: viewingErrorResponseSchema,
                    404: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = viewingIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const viewing = await getViewingAppointmentById(
                    paramsResult.data.id,
                    user
                );

                if (!viewing) {
                    return reply.status(404).send({
                        message: "Viewing appointment not found",
                    });
                }

                return reply.send({
                    message: "Viewing appointment fetched successfully",
                    data: viewing,
                });
            } catch (error) {
                return reply.status(403).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch viewing appointment",
                });
            }
        }
    );

    app.patch(
        "/:id/status",
        {
            preHandler: requirePermission("MANAGE_VIEWINGS"),
            schema: {
                tags: ["Viewings"],
                summary: "Update viewing status",
                description:
                    "Updates viewing status to confirmed, completed, cancelled, declined, or other allowed statuses.",
                security: [{ bearerAuth: [] }],
                params: viewingParamsSchema,
                body: updateViewingStatusBodySchema,
                response: {
                    200: viewingSuccessResponseSchema,
                    400: viewingErrorResponseSchema,
                    401: viewingErrorResponseSchema,
                    403: viewingErrorResponseSchema,
                    404: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = viewingIdParamsSchema.safeParse(request.params);
            const bodyResult = updateViewingStatusSchema.safeParse(request.body);

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
                const viewing = await updateViewingStatus(
                    paramsResult.data.id,
                    bodyResult.data,
                    user
                );

                return reply.send({
                    message: "Viewing status updated successfully",
                    data: viewing,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update viewing status",
                });
            }
        }
    );

    app.patch(
        "/:id/reschedule",
        {
            preHandler: requirePermission("MANAGE_VIEWINGS"),
            schema: {
                tags: ["Viewings"],
                summary: "Reschedule viewing appointment",
                description:
                    "Sets a new confirmed viewing date and marks the appointment as RESCHEDULED.",
                security: [{ bearerAuth: [] }],
                params: viewingParamsSchema,
                body: rescheduleViewingBodySchema,
                response: {
                    200: viewingSuccessResponseSchema,
                    400: viewingErrorResponseSchema,
                    401: viewingErrorResponseSchema,
                    403: viewingErrorResponseSchema,
                    404: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = viewingIdParamsSchema.safeParse(request.params);
            const bodyResult = rescheduleViewingSchema.safeParse(request.body);

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
                const viewing = await rescheduleViewingAppointment(
                    paramsResult.data.id,
                    bodyResult.data,
                    user
                );

                return reply.send({
                    message: "Viewing appointment rescheduled successfully",
                    data: viewing,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to reschedule viewing appointment",
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_VIEWINGS"),
            schema: {
                tags: ["Viewings"],
                summary: "Delete viewing appointment",
                description:
                    "Deletes a viewing appointment. Admins can delete any appointment. Brokers can delete only their own appointments.",
                security: [{ bearerAuth: [] }],
                params: viewingParamsSchema,
                response: {
                    200: viewingDeleteResponseSchema,
                    400: viewingErrorResponseSchema,
                    401: viewingErrorResponseSchema,
                    403: viewingErrorResponseSchema,
                    404: viewingErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = viewingIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                await deleteViewingAppointment(paramsResult.data.id, user);

                return reply.send({
                    message: "Viewing appointment deleted successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete viewing appointment",
                });
            }
        }
    );
}