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
    createPropertyBodySchema,
    propertyErrorResponseSchema,
    propertyListQuerySchemaForSwagger,
    propertyListResponseSchema,
    propertyParamsSchema,
    propertySuccessResponseSchema,
    updatePropertyBodySchema,
} from "./property.swagger.js";
import { createAuditLog } from "../audit/audit.service.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { JwtUser } from "../permission/permission.types.js";
import { successResponseSchema } from "../../utils/swagger-schemas.js";

export async function propertyRoutes(app: FastifyInstance) {
    app.post(
        "/",
        {
            preHandler: requirePermission("MANAGE_PROPERTIES"),
            schema: {
                tags: ["Properties"],
                summary: "Create property",
                description:
                    "Creates a new property listing. Only admins and approved brokers can create properties.",
                security: [{ bearerAuth: [] }],
                body: createPropertyBodySchema,
                response: {
                    201: propertySuccessResponseSchema,
                    400: propertyErrorResponseSchema,
                    401: propertyErrorResponseSchema,
                    403: propertyErrorResponseSchema,
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

                await createAuditLog({
                    action: "CREATE",
                    resourceType: "Property",
                    resourceId: property.id,
                    description: `Property created: ${property.title}`,
                    actorUserId: user.id,
                    newValues: {
                        title: property.title,
                        type: property.type,
                        status: property.status,
                        price: property.price.toString(),
                    },
                    ipAddress: request.ip,
                    userAgent: request.headers["user-agent"],
                });

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
                summary: "List properties",
                description:
                    "Returns published properties by default. Supports search, filters, sorting, and pagination.",
                querystring: propertyListQuerySchemaForSwagger,
                response: {
                    200: propertyListResponseSchema,
                    400: propertyErrorResponseSchema,
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
                description: "Returns full details of a single property.",
                params: propertyParamsSchema,
                response: {
                    200: propertySuccessResponseSchema,
                    400: propertyErrorResponseSchema,
                    404: propertyErrorResponseSchema,
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
            preHandler: requirePermission("MANAGE_PROPERTIES"),
            schema: {
                tags: ["Properties"],
                summary: "Update property",
                description:
                    "Updates an existing property. Admins can update any property. Brokers can update their own properties only.",
                security: [{ bearerAuth: [] }],
                params: propertyParamsSchema,
                body: updatePropertyBodySchema,
                response: {
                    200: propertySuccessResponseSchema,
                    400: propertyErrorResponseSchema,
                    401: propertyErrorResponseSchema,
                    403: propertyErrorResponseSchema,
                    404: propertyErrorResponseSchema,
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
            preHandler: requirePermission("MANAGE_PROPERTIES"),
            schema: {
                tags: ["Properties"],
                summary: "Delete property",
                description:
                    "Deletes a property. Admins can delete any property. Brokers can delete their own properties only.",
                security: [{ bearerAuth: [] }],
                params: propertyParamsSchema,
                response: {
                    200: successResponseSchema({
                        type: "object",
                        properties: {},
                    }),
                    400: propertyErrorResponseSchema,
                    401: propertyErrorResponseSchema,
                    403: propertyErrorResponseSchema,
                    404: propertyErrorResponseSchema,
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