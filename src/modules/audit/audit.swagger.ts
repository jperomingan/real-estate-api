import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const auditActionValues = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "APPROVE",
    "REJECT",
    "LOGIN",
    "LOGOUT",
    "STATUS_CHANGE",
];

export const auditActorResponseSchema = {
    type: "object",
    nullable: true,
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
    },
};

export const auditLogResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        action: { type: "string", enum: auditActionValues },
        resourceType: { type: "string" },
        resourceId: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
        oldValues: {},
        newValues: {},
        metadata: {},
        actorUserId: { type: "string", nullable: true },
        actorUser: auditActorResponseSchema,
        ipAddress: { type: "string", nullable: true },
        userAgent: { type: "string", nullable: true },
        createdAt: { type: "string" },
    },
};

export const auditParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string", description: "Audit log ID" },
    },
};

export const auditListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        action: { type: "string", enum: auditActionValues },
        resourceType: { type: "string" },
        resourceId: { type: "string" },
        actorUserId: { type: "string" },
        dateFrom: { type: "string" },
        dateTo: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const auditSuccessResponseSchema =
    successResponseSchema(auditLogResponseSchema);

export const auditListResponseSchema =
    paginatedResponseSchema(auditLogResponseSchema);

export const auditErrorResponseSchema = errorResponseSchema;