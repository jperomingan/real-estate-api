import { FastifyInstance } from "fastify";
import {
    favoriteListQuerySchema,
    favoritePropertyParamsSchema,
} from "./favorite.schema.js";
import {
    addPropertyToFavorites,
    getFavoriteStatus,
    getUserFavorites,
    removePropertyFromFavorites,
} from "./favorite.service.js";
import {
    favoriteDeleteResponseSchema,
    favoriteErrorResponseSchema,
    favoriteListQuerySchemaForSwagger,
    favoriteListResponseSchema,
    favoritePropertyParamsSchemaForSwagger,
    favoriteStatusResponseSchema,
    favoriteSuccessResponseSchema,
} from "./favorite.swagger.js";
import { requirePermission } from "../permission/permission.middleware.js";
import { JwtUser } from "../permission/permission.types.js";

export async function favoriteRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: requirePermission("SAVE_PROPERTIES"),
            schema: {
                tags: ["Favorites"],
                summary: "Get current user's saved properties",
                description:
                    "Returns the authenticated user's saved published properties.",
                security: [{ bearerAuth: [] }],
                querystring: favoriteListQuerySchemaForSwagger,
                response: {
                    200: favoriteListResponseSchema,
                    400: favoriteErrorResponseSchema,
                    401: favoriteErrorResponseSchema,
                    403: favoriteErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const queryResult = favoriteListQuerySchema.safeParse(request.query);

            if (!queryResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: queryResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getUserFavorites(user.id, queryResult.data);

            return reply.send({
                message: "Saved properties fetched successfully",
                data,
            });
        }
    );

    app.post(
        "/:propertyId",
        {
            preHandler: requirePermission("SAVE_PROPERTIES"),
            schema: {
                tags: ["Favorites"],
                summary: "Save property to favorites",
                description:
                    "Saves a published property to the current user's favorite list.",
                security: [{ bearerAuth: [] }],
                params: favoritePropertyParamsSchemaForSwagger,
                response: {
                    201: favoriteSuccessResponseSchema,
                    400: favoriteErrorResponseSchema,
                    401: favoriteErrorResponseSchema,
                    403: favoriteErrorResponseSchema,
                    404: favoriteErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = favoritePropertyParamsSchema.safeParse(
                request.params
            );

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;

                const favorite = await addPropertyToFavorites(
                    user.id,
                    paramsResult.data.propertyId
                );

                return reply.status(201).send({
                    message: "Property saved successfully",
                    data: favorite,
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to save property",
                });
            }
        }
    );

    app.delete(
        "/:propertyId",
        {
            preHandler: requirePermission("SAVE_PROPERTIES"),
            schema: {
                tags: ["Favorites"],
                summary: "Remove property from favorites",
                description:
                    "Removes a property from the current user's saved properties.",
                security: [{ bearerAuth: [] }],
                params: favoritePropertyParamsSchemaForSwagger,
                response: {
                    200: favoriteDeleteResponseSchema,
                    400: favoriteErrorResponseSchema,
                    401: favoriteErrorResponseSchema,
                    403: favoriteErrorResponseSchema,
                    404: favoriteErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = favoritePropertyParamsSchema.safeParse(
                request.params
            );

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            try {
                const user = request.user as JwtUser;

                await removePropertyFromFavorites(user.id, paramsResult.data.propertyId);

                return reply.send({
                    message: "Property removed from saved list successfully",
                });
            } catch (error) {
                return reply.status(400).send({
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to remove property",
                });
            }
        }
    );

    app.get(
        "/:propertyId/status",
        {
            preHandler: requirePermission("SAVE_PROPERTIES"),
            schema: {
                tags: ["Favorites"],
                summary: "Check favorite status",
                description:
                    "Checks whether the current authenticated user already saved the property.",
                security: [{ bearerAuth: [] }],
                params: favoritePropertyParamsSchemaForSwagger,
                response: {
                    200: favoriteStatusResponseSchema,
                    400: favoriteErrorResponseSchema,
                    401: favoriteErrorResponseSchema,
                    403: favoriteErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const paramsResult = favoritePropertyParamsSchema.safeParse(
                request.params
            );

            if (!paramsResult.success) {
                return reply.status(400).send({
                    message: "Validation error",
                    errors: paramsResult.error.flatten().fieldErrors,
                });
            }

            const user = request.user as JwtUser;
            const data = await getFavoriteStatus(user.id, paramsResult.data.propertyId);

            return reply.send({
                message: "Favorite status fetched successfully",
                data,
            });
        }
    );
}