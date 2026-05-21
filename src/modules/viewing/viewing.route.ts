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
import { JwtUser } from "../permission/permission.types.js";
import { requirePermission } from "../permission/permission.middleware.js";

export async function viewingRoutes(app: FastifyInstance) {
    app.post(
        "/",
        {
            schema: {
                tags: ["Viewings"],
                summary: "Request a property viewing appointment",
                body: {
                    type: "object",
                    required: ["propertyId", "firstName", "phone", "preferredDate"],
                    properties: {
                        propertyId: { type: "string" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        message: { type: "string" },
                        preferredDate: { type: "string" },
                    },
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
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        status: {
                            type: "string",
                            enum: [
                                "REQUESTED",
                                "CONFIRMED",
                                "RESCHEDULED",
                                "COMPLETED",
                                "CANCELLED",
                                "DECLINED",
                            ],
                        },
                        propertyId: { type: "string" },
                        brokerId: { type: "string" },
                        dateFrom: { type: "string" },
                        dateTo: { type: "string" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
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
                                "REQUESTED",
                                "CONFIRMED",
                                "RESCHEDULED",
                                "COMPLETED",
                                "CANCELLED",
                                "DECLINED",
                            ],
                        },
                        notes: { type: "string" },
                    },
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
                    required: ["confirmedDate"],
                    properties: {
                        confirmedDate: { type: "string" },
                        notes: { type: "string" },
                    },
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