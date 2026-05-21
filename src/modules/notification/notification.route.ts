import { FastifyInstance } from "fastify";
import {
    notificationIdParamsSchema,
    notificationListQuerySchema,
} from "./notification.schema.js";
import {
    deleteNotification,
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "./notification.service.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { JwtUser } from "../permission/permission.types.js";

export async function notificationRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: requirePermission("MANAGE_NOTIFICATIONS"),
            schema: {
                tags: ["Notifications"],
                summary: "Get current user's notifications",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        isRead: { type: "boolean" },
                        type: {
                            type: "string",
                            enum: [
                                "LEAD_CREATED",
                                "VIEWING_REQUESTED",
                                "VIEWING_UPDATED",
                                "REVENUE_CREATED",
                                "PROPERTY_UPDATED",
                                "ACCOUNT_APPROVED",
                                "ACCOUNT_REJECTED",
                                "GENERAL",
                            ],
                        },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = notificationListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getNotifications(user.id, queryResult.data);

            return reply.send({
                message: "Notifications fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/unread-count",
        {
            preHandler: requirePermission("MANAGE_NOTIFICATIONS"),
            schema: {
                tags: ["Notifications"],
                summary: "Get unread notification count",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;
            const data = await getUnreadNotificationCount(user.id);

            return reply.send({
                message: "Unread notification count fetched successfully",
                data,
            });
        }
    );

    app.patch(
        "/read-all",
        {
            preHandler: requirePermission("MANAGE_NOTIFICATIONS"),
            schema: {
                tags: ["Notifications"],
                summary: "Mark all notifications as read",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request, reply) => {
            const user = request.user as JwtUser;

            await markAllNotificationsAsRead(user.id);

            return reply.send({
                message: "All notifications marked as read successfully",
            });
        }
    );

    app.patch(
        "/:id/read",
        {
            preHandler: requirePermission("MANAGE_NOTIFICATIONS"),
            schema: {
                tags: ["Notifications"],
                summary: "Mark notification as read",
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
            const paramsResult = notificationIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const notification = await markNotificationAsRead(
                    user.id,
                    paramsResult.data.id
                );

                return reply.send({
                    message: "Notification marked as read successfully",
                    data: notification,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update notification",
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePermission("MANAGE_NOTIFICATIONS"),
            schema: {
                tags: ["Notifications"],
                summary: "Delete notification",
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
            const paramsResult = notificationIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;

                await deleteNotification(user.id, paramsResult.data.id);

                return reply.send({
                    message: "Notification deleted successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete notification",
                });
            }
        }
    );
}