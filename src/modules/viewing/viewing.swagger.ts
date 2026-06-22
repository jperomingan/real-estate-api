import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const viewingStatusValues = [
    "REQUESTED",
    "CONFIRMED",
    "RESCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "DECLINED",
];

export const viewingPropertyResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        title: { type: "string" },
        price: { type: "string" },
        address: { type: "string" },
        barangay: { type: "string", nullable: true },
        city: { type: "string" },
        province: { type: "string" },
        status: { type: "string" },
    },
};

export const viewingBrokerResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", nullable: true },
    },
};

export const viewingResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string", nullable: true },
        email: { type: "string", nullable: true },
        phone: { type: "string" },
        message: { type: "string", nullable: true },
        preferredDate: { type: "string" },
        confirmedDate: { type: "string", nullable: true },
        status: { type: "string", enum: viewingStatusValues },
        notes: { type: "string", nullable: true },
        propertyId: { type: "string" },
        property: viewingPropertyResponseSchema,
        brokerId: { type: "string" },
        broker: viewingBrokerResponseSchema,
        clientId: { type: "string", nullable: true },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const createViewingBodySchema = {
    type: "object",
    required: ["propertyId", "firstName", "phone", "preferredDate"],
    properties: {
        propertyId: { type: "string" },
        firstName: { type: "string", description: "Example: Maria" },
        lastName: { type: "string", description: "Example: Santos" },
        email: { type: "string", description: "Example: maria@example.com" },
        phone: { type: "string", description: "Example: 09123456789" },
        message: { type: "string" },
        preferredDate: {
            type: "string",
            description: "Preferred viewing date in ISO format",
        },
    },
};

export const viewingParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string", description: "Viewing appointment ID" },
    },
};

export const viewingListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: { type: "string" },
        status: { type: "string", enum: viewingStatusValues },
        propertyId: { type: "string" },
        brokerId: { type: "string" },
        dateFrom: { type: "string" },
        dateTo: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const updateViewingStatusBodySchema = {
    type: "object",
    required: ["status"],
    properties: {
        status: { type: "string", enum: viewingStatusValues },
        notes: { type: "string" },
    },
};

export const rescheduleViewingBodySchema = {
    type: "object",
    required: ["confirmedDate"],
    properties: {
        confirmedDate: { type: "string" },
        notes: { type: "string" },
    },
};

export const viewingSuccessResponseSchema =
    successResponseSchema(viewingResponseSchema);

export const viewingListResponseSchema =
    paginatedResponseSchema(viewingResponseSchema);

export const viewingDeleteResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const viewingErrorResponseSchema = errorResponseSchema;