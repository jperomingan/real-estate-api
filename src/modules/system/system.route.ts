import type { FastifyInstance } from "fastify";
import { apiMetadata } from "../../config/api-metadata.js";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../utils/api-response.js";

const apiInfoResponseSchema = {
  type: "object",
  required: ["success", "message", "data"],
  properties: {
    success: {
      type: "boolean",
    },
    message: {
      type: "string",
    },
    data: {
      type: "object",
      required: [
        "name",
        "version",
        "description",
        "developer",
        "documentation",
        "openApiSpecification",
        "repository",
      ],
      properties: {
        name: {
          type: "string",
        },
        version: {
          type: "string",
        },
        description: {
          type: "string",
        },
        developer: {
          type: "object",
          required: ["name", "role", "email", "profile"],
          properties: {
            name: {
              type: "string",
            },
            role: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            profile: {
              type: "string",
              format: "uri",
            },
          },
        },
        documentation: {
          type: "string",
          format: "uri",
        },
        openApiSpecification: {
          type: "string",
          format: "uri",
        },
        repository: {
          type: "string",
          format: "uri",
        },
      },
    },
  },
} as const;

export async function systemRoutes(app: FastifyInstance) {
  app.get(
    "/api/info",
    {
      schema: {
        tags: ["System"],
        summary: "Get API and developer information",
        description:
          "Returns the API version, backend developer details, Swagger documentation URL, OpenAPI specification URL, and source-code repository.",
        response: {
          200: apiInfoResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      return sendSuccess({
        reply,
        message: "API information fetched successfully",
        data: {
          name: apiMetadata.title,
          version: apiMetadata.version,
          description: apiMetadata.shortDescription,
          developer: apiMetadata.developer,
          documentation: `${env.APP_URL}/docs`,
          openApiSpecification: `${env.APP_URL}/docs/json`,
          repository: apiMetadata.repository,
        },
      });
    },
  );
}
