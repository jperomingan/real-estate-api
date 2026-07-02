import type { FastifyInstance, FastifyReply } from "fastify";

import { sendError, sendSuccess } from "../../utils/api-response.js";

import { requirePermission } from "../permission/permission.middleware.js";

import type { JwtUser } from "../permission/permission.types.js";

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
  notificationDeleteResponseSchema,
  notificationErrorResponseSchema,
  notificationListQuerySchemaForSwagger,
  notificationListResponseSchema,
  notificationParamsSchema,
  notificationReadAllResponseSchema,
  notificationSuccessResponseSchema,
  unreadNotificationCountResponseSchema,
} from "./notification.swagger.js";

const forbiddenNotificationMessages = new Set([
  "You can only access your own notifications.",
]);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function sendNotificationOperationError({
  reply,
  requestId,
  error,
  fallback,
}: {
  reply: FastifyReply;
  requestId: string;
  error: unknown;
  fallback: string;
}) {
  const message = getErrorMessage(error, fallback);

  if (forbiddenNotificationMessages.has(message)) {
    return sendError({
      reply,
      statusCode: 403,
      message,
      code: "FORBIDDEN",
      requestId,
    });
  }

  return sendError({
    reply,
    statusCode: 400,
    message,
    code: "NOTIFICATION_OPERATION_FAILED",
    requestId,
  });
}

export async function notificationRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: requirePermission("MANAGE_NOTIFICATIONS"),

      schema: {
        tags: ["Notifications"],
        summary: "List my notifications",
        description: "Returns notifications for the authenticated user only.",

        security: [
          {
            bearerAuth: [],
          },
        ],

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

      const data = await getNotifications(queryResult.data, user);

      return sendSuccess({
        reply,
        message: "Notifications fetched successfully",
        data,
      });
    },
  );

  app.get(
    "/unread-count",
    {
      preHandler: requirePermission("MANAGE_NOTIFICATIONS"),

      schema: {
        tags: ["Notifications"],
        summary: "Get unread notification count",
        description:
          "Returns unread notification count for the authenticated user.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        response: {
          200: unreadNotificationCountResponseSchema,
          401: notificationErrorResponseSchema,
          403: notificationErrorResponseSchema,
        },
      },
    },

    async (request, reply) => {
      const user = request.user as JwtUser;

      const data = await getUnreadNotificationCount(user);

      return sendSuccess({
        reply,
        message: "Unread notification count fetched successfully",
        data,
      });
    },
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

        security: [
          {
            bearerAuth: [],
          },
        ],

        response: {
          200: notificationReadAllResponseSchema,
          401: notificationErrorResponseSchema,
          403: notificationErrorResponseSchema,
        },
      },
    },

    async (request, reply) => {
      const user = request.user as JwtUser;

      const data = await markAllNotificationsAsRead(user);

      return sendSuccess({
        reply,
        message: "All notifications marked as read successfully",
        data,
      });
    },
  );

  app.patch(
    "/:id/read",
    {
      preHandler: requirePermission("MANAGE_NOTIFICATIONS"),

      schema: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        description:
          "Marks one notification as read if it belongs to the authenticated user.",

        security: [
          {
            bearerAuth: [],
          },
        ],

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
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: paramsResult.error.flatten().fieldErrors,
        });
      }

      try {
        const user = request.user as JwtUser;

        const notification = await markNotificationAsRead(
          paramsResult.data.id,
          user,
        );

        if (!notification) {
          return sendError({
            reply,
            statusCode: 404,
            message: "Notification not found",
            code: "NOTIFICATION_NOT_FOUND",
            requestId: request.id,
          });
        }

        return sendSuccess({
          reply,
          message: "Notification marked as read successfully",
          data: notification,
        });
      } catch (error) {
        return sendNotificationOperationError({
          reply,
          requestId: request.id,
          error,
          fallback: "Failed to mark notification as read",
        });
      }
    },
  );

  app.delete(
    "/:id",
    {
      preHandler: requirePermission("MANAGE_NOTIFICATIONS"),

      schema: {
        tags: ["Notifications"],
        summary: "Delete notification",
        description:
          "Deletes one notification if it belongs to the authenticated user.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: notificationParamsSchema,

        response: {
          200: notificationDeleteResponseSchema,
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
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: paramsResult.error.flatten().fieldErrors,
        });
      }

      try {
        const user = request.user as JwtUser;

        const deletedNotification = await deleteNotification(
          paramsResult.data.id,
          user,
        );

        if (!deletedNotification) {
          return sendError({
            reply,
            statusCode: 404,
            message: "Notification not found",
            code: "NOTIFICATION_NOT_FOUND",
            requestId: request.id,
          });
        }

        return sendSuccess({
          reply,
          message: "Notification deleted successfully",
          data: deletedNotification,
        });
      } catch (error) {
        return sendNotificationOperationError({
          reply,
          requestId: request.id,
          error,
          fallback: "Failed to delete notification",
        });
      }
    },
  );
}
