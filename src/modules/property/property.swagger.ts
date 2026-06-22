import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const propertyTypeValues = [
    "HOUSE_AND_LOT",
    "CONDOMINIUM",
    "LOT_ONLY",
    "APARTMENT",
    "TOWNHOUSE",
    "COMMERCIAL",
    "AGRICULTURAL",
    "INDUSTRIAL",
];

export const propertyStatusValues = [
    "DRAFT",
    "PUBLISHED",
    "RESERVED",
    "SOLD",
    "ARCHIVED",
];

export const propertyImageResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        url: { type: "string" },
        altText: { type: "string", nullable: true },
        sortOrder: { type: "number" },
    },
};

export const propertyBrokerResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", nullable: true },
    },
};

export const propertyResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string", nullable: true },
        type: { type: "string", enum: propertyTypeValues },
        status: { type: "string", enum: propertyStatusValues },
        price: { type: "string" },
        lotAreaSqm: { type: "string", nullable: true },
        floorAreaSqm: { type: "string", nullable: true },
        bedrooms: { type: "number", nullable: true },
        bathrooms: { type: "number", nullable: true },
        address: { type: "string" },
        barangay: { type: "string", nullable: true },
        city: { type: "string" },
        province: { type: "string" },
        zipCode: { type: "string", nullable: true },
        latitude: { type: "string", nullable: true },
        longitude: { type: "string", nullable: true },
        brokerId: { type: "string" },
        broker: propertyBrokerResponseSchema,
        images: {
            type: "array",
            items: propertyImageResponseSchema,
        },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const createPropertyBodySchema = {
    type: "object",
    required: ["title", "type", "price", "address", "city", "province"],
    properties: {
        title: {
            type: "string",
            description: "Property title. Example: Affordable House and Lot in Cebu",
        },
        description: {
            type: "string",
            description: "Optional property description",
        },
        type: {
            type: "string",
            enum: propertyTypeValues,
        },
        status: {
            type: "string",
            enum: propertyStatusValues,
            description: "Defaults to DRAFT if not provided",
        },
        price: { type: "number" },
        lotAreaSqm: { type: "number" },
        floorAreaSqm: { type: "number" },
        bedrooms: { type: "number" },
        bathrooms: { type: "number" },
        address: { type: "string" },
        barangay: { type: "string" },
        city: { type: "string" },
        province: { type: "string" },
        zipCode: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
        brokerId: {
            type: "string",
            description: "Optional. Admin can assign property to a broker.",
        },
        imageUrls: {
            type: "array",
            items: {
                type: "string",
            },
        },
    },
};

export const updatePropertyBodySchema = {
    type: "object",
    properties: createPropertyBodySchema.properties,
};

export const propertyParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: {
            type: "string",
            description: "Property ID",
        },
    },
};

export const propertyListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: { type: "string" },
        type: {
            type: "string",
            enum: propertyTypeValues,
        },
        status: {
            type: "string",
            enum: propertyStatusValues,
        },
        city: { type: "string" },
        province: { type: "string" },
        barangay: { type: "string" },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
        minLotAreaSqm: { type: "number" },
        maxLotAreaSqm: { type: "number" },
        minFloorAreaSqm: { type: "number" },
        maxFloorAreaSqm: { type: "number" },
        bedrooms: { type: "number" },
        bathrooms: { type: "number" },
        sortBy: {
            type: "string",
            enum: ["createdAt", "price", "title", "city"],
        },
        sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
        },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const propertyListResponseSchema =
    paginatedResponseSchema(propertyResponseSchema);

export const propertySuccessResponseSchema =
    successResponseSchema(propertyResponseSchema);

export const propertyErrorResponseSchema = errorResponseSchema;