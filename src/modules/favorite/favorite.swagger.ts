import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";
import { propertyResponseSchema } from "../property/property.swagger.js";

export const favoriteResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        createdAt: { type: "string" },
        property: propertyResponseSchema,
    },
};

export const favoritePropertyParamsSchemaForSwagger = {
    type: "object",
    required: ["propertyId"],
    properties: {
        propertyId: {
            type: "string",
            description: "Property ID",
        },
    },
};

export const favoriteListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: { type: "string" },
        city: { type: "string" },
        province: { type: "string" },
        page: { type: "number" },
        limit: { type: "number" },
    },
};

export const favoriteStatusResponseSchema = successResponseSchema({
    type: "object",
    properties: {
        isFavorited: { type: "boolean" },
    },
});

export const favoriteSuccessResponseSchema =
    successResponseSchema(favoriteResponseSchema);

export const favoriteListResponseSchema =
    paginatedResponseSchema(favoriteResponseSchema);

export const favoriteDeleteResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const favoriteErrorResponseSchema = errorResponseSchema;