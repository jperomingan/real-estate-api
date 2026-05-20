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
    JwtUser,
    requireAuthenticatedUser,
} from "./favorite.middleware.js";

export async function favoriteRoutes(app: FastifyInstance) {
    app.get(
        "/",
        {
            preHandler: requireAuthenticatedUser,
            schema: {
                tags: ["Favorites"],
                summary: "Get current user's saved properties",
                security: [{ bearerAuth: [] }],
                querystring: {
                    type: "object",
                    properties: {
                        search: { type: "string" },
                        city: { type: "string" },
                        province: { type: "string" },
                        page: { type: "number" },
                        limit: { type: "number" },
                    },
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
            preHandler: requireAuthenticatedUser,
            schema: {
                tags: ["Favorites"],
                summary: "Save property to favorites",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["propertyId"],
                    properties: {
                        propertyId: { type: "string" },
                    },
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
            preHandler: requireAuthenticatedUser,
            schema: {
                tags: ["Favorites"],
                summary: "Remove property from favorites",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["propertyId"],
                    properties: {
                        propertyId: { type: "string" },
                    },
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
            preHandler: requireAuthenticatedUser,
            schema: {
                tags: ["Favorites"],
                summary: "Check if property is saved by current user",
                security: [{ bearerAuth: [] }],
                params: {
                    type: "object",
                    required: ["propertyId"],
                    properties: {
                        propertyId: { type: "string" },
                    },
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