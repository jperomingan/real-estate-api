import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const notificationTypeValues = [
    "LEAD_CREATED",
    "VIEWING_REQUESTED",
    "VIEWING_UPDATED",
    "REVENUE_CREATED",
    "PROPERTY_UPDATED",
    "ACCOUNT_APPROVED",
    "ACCOUNT_REJECTED",
    "GENERAL",
];

export const notificationResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        type: { type: "string", enum: notificationTypeValues },
        title: { type: "string" },
        message: { type: "string" },
        isRead: { type: "boolean" },
        metadata: {},
        targetUserId: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const notificationParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string", description: "Notification ID" },
    },
};

export const notificationListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        isRead: { type: "boolean" },
        type: { type: "string", enum: notificationTypeValues },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const unreadCountResponseSchema = successResponseSchema({
    type: "object",
    properties: {
        unreadCount: { type: "number" },
    },
});

export const notificationSuccessResponseSchema =
    successResponseSchema(notificationResponseSchema);

export const notificationListResponseSchema =
    paginatedResponseSchema(notificationResponseSchema);

export const notificationActionResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const notificationErrorResponseSchema = errorResponseSchema;