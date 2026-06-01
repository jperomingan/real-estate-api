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
import {
    notificationActionResponseSchema,
    notificationErrorResponseSchema,
    notificationListQuerySchemaForSwagger,
    notificationListResponseSchema,
    notificationParamsSchema,
    notificationSuccessResponseSchema,
    unreadCountResponseSchema,
} from "./notification.swagger.js";
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
                description:
                    "Returns notifications belonging to the authenticated user.",
                security: [{ bearerAuth: [] }],
                querystring: notificationListQuerySchemaForSwagger,
                response: {
                    200: notificationListResponseSchema,
                    400: notificationErrorResponseSchema,
                    401: notificationErrorResponseSchema,
                    403: notificationErrorResponseSchema,
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
                description:
                    "Returns the number of unread notifications for the authenticated user.",
                security: [{ bearerAuth: [] }],
                response: {
                    200: unreadCountResponseSchema,
                    401: notificationErrorResponseSchema,
                    403: notificationErrorResponseSchema,
                },
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
                description:
                    "Marks all unread notifications of the authenticated user as read.",
                security: [{ bearerAuth: [] }],
                response: {
                    200: notificationActionResponseSchema,
                    401: notificationErrorResponseSchema,
                    403: notificationErrorResponseSchema,
                },
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
                description:
                    "Marks a single notification as read.",
                security: [{ bearerAuth: [] }],
                params: notificationParamsSchema,
                response: {
                    200: notificationSuccessResponseSchema,
                    400: notificationErrorResponseSchema,
                    401: notificationErrorResponseSchema,
                    403: notificationErrorResponseSchema,
                    404: notificationErrorResponseSchema,
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
                description:
                    "Deletes a notification belonging to the authenticated user.",
                security: [{ bearerAuth: [] }],
                params: notificationParamsSchema,
                response: {
                    200: notificationActionResponseSchema,
                    400: notificationErrorResponseSchema,
                    401: notificationErrorResponseSchema,
                    403: notificationErrorResponseSchema,
                    404: notificationErrorResponseSchema,
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