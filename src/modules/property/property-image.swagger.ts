import {
    errorResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const propertyImageResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        url: { type: "string" },
        altText: { type: "string", nullable: true },
        sortOrder: { type: "number" },
        propertyId: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const uploadPropertyImageParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: {
            type: "string",
            description: "Property ID",
        },
    },
};

export const deletePropertyImageParamsSchemaForSwagger = {
    type: "object",
    required: ["propertyId", "imageId"],
    properties: {
        propertyId: {
            type: "string",
            description: "Property ID",
        },
        imageId: {
            type: "string",
            description: "Property image ID",
        },
    },
};

export const uploadPropertyImageBodySchema = {
    type: "object",
    required: ["file"],
    properties: {
        file: {
            type: "string",
            format: "binary",
            description: "Image file. Allowed: JPG, JPEG, PNG, WEBP.",
        },
    },
};

export const propertyImageSuccessResponseSchema =
    successResponseSchema(propertyImageResponseSchema);

export const propertyImageDeleteResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const propertyImageErrorResponseSchema = errorResponseSchema;