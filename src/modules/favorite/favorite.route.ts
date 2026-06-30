import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { sendError, sendSuccess } from "../../utils/api-response.js";

import { requirePermission } from "../permission/permission.middleware.js";

import type { JwtUser } from "../permission/permission.types.js";

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
  favoriteListQuerySwaggerSchema,
  favoriteListResponseSchema,
  favoritePropertyParamsSwaggerSchema,
  favoriteStatusResponseSchema,
  favoriteSuccessResponseSchema,
} from "./favorite.swagger.js";

const favoriteNotFoundMessages = new Set([
  "Property not found.",
  "Property is not in your saved list.",
]);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function requireClientRole(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as JwtUser;

  if (user.role !== "CLIENT") {
    return sendError({
      reply,
      statusCode: 403,
      message: "Only clients can manage saved properties.",
      code: "CLIENT_ROLE_REQUIRED",
      requestId: request.id,
    });
  }
}

function sendFavoriteOperationError({
  reply,
  requestId,
  error,
  fallback,
}: {
  reply: FastifyReply;
  requestId: string;
  error: unknown;
  fallback: string;
}) {
  const message = getErrorMessage(error, fallback);

  if (favoriteNotFoundMessages.has(message)) {
    return sendError({
      reply,
      statusCode: 404,
      message,
      code: "FAVORITE_NOT_FOUND",
      requestId,
    });
  }

  return sendError({
    reply,
    statusCode: 400,
    message,
    code: "FAVORITE_OPERATION_FAILED",
    requestId,
  });
}

const favoritePreHandlers = [
  requirePermission("SAVE_PROPERTIES"),
  requireClientRole,
];

export async function favoriteRoutes(app: FastifyInstance) {
  app.post(
    "/:propertyId",
    {
      preHandler: favoritePreHandlers,

      schema: {
        tags: ["Favorites"],

        summary: "Save property",

        description:
          "Saves a published property to the authenticated client's favorites.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: favoritePropertyParamsSwaggerSchema,

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
        request.params,
      );

      if (!paramsResult.success) {
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: paramsResult.error.flatten().fieldErrors,
        });
      }

      try {
        const user = request.user as JwtUser;

        const favorite = await addPropertyToFavorites(
          user.id,
          paramsResult.data.propertyId,
        );

        return sendSuccess({
          reply,
          statusCode: 201,
          message: "Property saved successfully",
          data: favorite,
        });
      } catch (error) {
        return sendFavoriteOperationError({
          reply,
          requestId: request.id,
          error,
          fallback: "Failed to save property",
        });
      }
    },
  );

  app.get(
    "/",
    {
      preHandler: favoritePreHandlers,

      schema: {
        tags: ["Favorites"],

        summary: "List saved properties",

        description:
          "Lists only the authenticated client's published saved properties.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        querystring: favoriteListQuerySwaggerSchema,

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
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: queryResult.error.flatten().fieldErrors,
        });
      }

      const user = request.user as JwtUser;

      const data = await getUserFavorites(user.id, queryResult.data);

      return sendSuccess({
        reply,
        message: "Saved properties fetched successfully",
        data,
      });
    },
  );

  app.get(
    "/:propertyId/status",
    {
      preHandler: favoritePreHandlers,

      schema: {
        tags: ["Favorites"],

        summary: "Check saved-property status",

        description:
          "Checks whether the authenticated client has saved the property.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: favoritePropertyParamsSwaggerSchema,

        response: {
          200: favoriteStatusResponseSchema,

          400: favoriteErrorResponseSchema,

          401: favoriteErrorResponseSchema,

          403: favoriteErrorResponseSchema,

          404: favoriteErrorResponseSchema,
        },
      },
    },

    async (request, reply) => {
      const paramsResult = favoritePropertyParamsSchema.safeParse(
        request.params,
      );

      if (!paramsResult.success) {
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: paramsResult.error.flatten().fieldErrors,
        });
      }

      try {
        const user = request.user as JwtUser;

        const data = await getFavoriteStatus(
          user.id,
          paramsResult.data.propertyId,
        );

        return sendSuccess({
          reply,
          message: "Favorite status fetched successfully",
          data,
        });
      } catch (error) {
        return sendFavoriteOperationError({
          reply,
          requestId: request.id,
          error,
          fallback: "Failed to check favorite status",
        });
      }
    },
  );

  app.delete(
    "/:propertyId",
    {
      preHandler: favoritePreHandlers,

      schema: {
        tags: ["Favorites"],

        summary: "Remove saved property",

        description:
          "Removes a property from the authenticated client's favorites.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: favoritePropertyParamsSwaggerSchema,

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
        request.params,
      );

      if (!paramsResult.success) {
        return sendError({
          reply,
          statusCode: 400,
          message: "Validation error",
          code: "VALIDATION_ERROR",
          requestId: request.id,
          details: paramsResult.error.flatten().fieldErrors,
        });
      }

      try {
        const user = request.user as JwtUser;

        await removePropertyFromFavorites(
          user.id,
          paramsResult.data.propertyId,
        );

        return sendSuccess({
          reply,
          message: "Property removed from saved properties",
          data: {
            propertyId: paramsResult.data.propertyId,
          },
        });
      } catch (error) {
        return sendFavoriteOperationError({
          reply,
          requestId: request.id,
          error,
          fallback: "Failed to remove saved property",
        });
      }
    },
  );
}
