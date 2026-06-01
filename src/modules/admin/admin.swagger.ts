import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const adminUserRoleValues = ["ADMIN", "BROKER", "CLIENT"];

export const adminUserStatusValues = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "ACTIVE",
    "INACTIVE",
];

export const adminUserResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        role: { type: "string", enum: adminUserRoleValues },
        status: { type: "string", enum: adminUserStatusValues },
        phone: { type: "string", nullable: true },
        avatarUrl: { type: "string", nullable: true },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const adminUserParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: {
            type: "string",
            description: "User ID",
        },
    },
};

export const adminUserListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: {
            type: "string",
            description: "Search by first name, last name, or email",
        },
        role: {
            type: "string",
            enum: adminUserRoleValues,
        },
        status: {
            type: "string",
            enum: adminUserStatusValues,
        },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const updateUserStatusBodySchema = {
    type: "object",
    required: ["status"],
    properties: {
        status: {
            type: "string",
            enum: adminUserStatusValues,
            description: "New user account status",
        },
    },
};

export const adminUserSuccessResponseSchema =
    successResponseSchema(adminUserResponseSchema);

export const adminUserListResponseSchema =
    paginatedResponseSchema(adminUserResponseSchema);

export const adminDeleteResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const adminErrorResponseSchema = errorResponseSchema;