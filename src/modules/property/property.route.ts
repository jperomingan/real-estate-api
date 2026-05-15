import { FastifyInstance } from "fastify";
import {
    createPropertySchema,
    propertyIdParamsSchema,
    propertyListQuerySchema,
    updatePropertySchema,
} from "./property.schema.js";
import {
    createProperty,
    deleteProperty,
    getProperties,
    getPropertyById,
    updateProperty,
} from "./property.service.js";
import {
    JwtUser,
    requirePropertyManager,
} from "./property.middleware.js";

export async function propertyRoutes(app: FastifyInstance) {
    app.post(
        "/",
        {
            preHandler: requirePropertyManager,
            schema: {
                tags: ["Properties"],
                summary: "Create property",
                security: [{ bearerAuth: [] }],
                body: {
                    type: "object",
                    required: ["title", "type", "price", "address", "city", "province"],
                    properties: {
                        title: { type: "string", description: "Property title" },
                        description: { type: "string" },
                        type: {
                            type: "string",
                            enum: [
                                "HOUSE_AND_LOT",
                                "CONDOMINIUM",
                                "LOT_ONLY",
                                "APARTMENT",
                                "TOWNHOUSE",
                                "COMMERCIAL",
                                "AGRICULTURAL",
                                "INDUSTRIAL",
                            ],
                        },
                        status: {
                            type: "string",
                            enum: ["DRAFT", "PUBLISHED", "RESERVED", "SOLD", "ARCHIVED"],
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
                        brokerId: { type: "string" },
                        imageUrls: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const bodyResult = createPropertySchema.safeParse(request.body);

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const property = await createProperty(bodyResult.data, user);

                return reply.status(201).send({
                    message: "Property created successfully",
                    data: property,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error ? error.message : "Failed to create property",
                });
            }
        }
    );

    app.get(
        "/",
        {
            schema: {
                tags: ["Properties"],
                summary: "List published properties",
                querystring: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        type: {
                            type: "string",
                            enum: [
                                "HOUSE_AND_LOT",
                                "CONDOMINIUM",
                                "LOT_ONLY",
                                "APARTMENT",
                                "TOWNHOUSE",
                                "COMMERCIAL",
                                "AGRICULTURAL",
                                "INDUSTRIAL",
                            ],
                        },
                        status: {
                            type: "string",
                            enum: ["DRAFT", "PUBLISHED", "RESERVED", "SOLD", "ARCHIVED"],
                        },
                        city: { type: "string" },
                        province: { type: "string" },
                        minPrice: { type: "number" },
                        maxPrice: { type: "number" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
                },
            },
        },
        async (request, reply) => {
            const queryResult = propertyListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const data = await getProperties(queryResult.data);

            return reply.send({
                message: "Properties fetched successfully",
                data,
            });
        }
    );

    app.get(
        "/:id",
        {
            schema: {
                tags: ["Properties"],
                summary: "Get property by ID",
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
            const paramsResult = propertyIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const property = await getPropertyById(paramsResult.data.id);

            if (!property) {
                return reply.status(404).send({
                    message: "Property not found",
                });
            }

            return reply.send({
                message: "Property fetched successfully",
                data: property,
            });
        }
    );

    app.patch(
        "/:id",
        {
            preHandler: requirePropertyManager,
            schema: {
                tags: ["Properties"],
                summary: "Update property",
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
            const paramsResult = propertyIdParamsSchema.safeParse(request.params);
            const bodyResult = updatePropertySchema.safeParse(request.body);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            if (!bodyResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: bodyResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                const property = await updateProperty(
                    paramsResult.data.id,
                    bodyResult.data,
                    user
                );

                return reply.send({
                    message: "Property updated successfully",
                    data: property,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error ? error.message : "Failed to update property",
                });
            }
        }
    );

    app.delete(
        "/:id",
        {
            preHandler: requirePropertyManager,
            schema: {
                tags: ["Properties"],
                summary: "Delete property",
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
            const paramsResult = propertyIdParamsSchema.safeParse(request.params);

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;
                await deleteProperty(paramsResult.data.id, user);

                return reply.send({
                    message: "Property deleted successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error ? error.message : "Failed to delete property",
                });
            }
        }
    );
}