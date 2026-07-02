const notificationMetadataSchema = {
  anyOf: [
    {
      type: "object",
      additionalProperties: true,
    },
    {
      type: "array",
      items: {},
    },
    {
      type: "string",
    },
    {
      type: "number",
    },
    {
      type: "boolean",
    },
    {
      type: "null",
    },
  ],
};

const notificationItemSchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    targetUserId: {
      type: "string",
    },

    type: {
      type: "string",
      examples: [
        "VIEWING_REQUESTED",
        "VIEWING_UPDATED",
        "LEAD_CREATED",
        "REVENUE_UPDATED",
      ],
    },

    title: {
      type: "string",
    },

    message: {
      type: "string",
    },

    metadata: notificationMetadataSchema,

    isRead: {
      type: "boolean",
    },

    createdAt: {
      type: "string",
      format: "date-time",
    },

    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },

  required: [
    "id",
    "targetUserId",
    "type",
    "title",
    "message",
    "isRead",
    "createdAt",
    "updatedAt",
  ],
};

export const notificationListQuerySchemaForSwagger = {
  type: "object",

  properties: {
    search: {
      type: "string",
    },

    type: {
      type: "string",
    },

    isRead: {
      type: "boolean",
    },

    page: {
      type: "integer",
      minimum: 1,
      default: 1,
    },

    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      default: 20,
    },
  },
};

export const notificationParamsSchema = {
  type: "object",

  required: ["id"],

  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
};

export const notificationSuccessResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: notificationItemSchema,
  },

  required: ["message", "data"],
};

export const notificationListResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: {
      type: "object",

      properties: {
        items: {
          type: "array",
          items: notificationItemSchema,
        },

        pagination: {
          type: "object",

          properties: {
            page: {
              type: "integer",
            },

            limit: {
              type: "integer",
            },

            total: {
              type: "integer",
            },

            totalPages: {
              type: "integer",
            },
          },

          required: ["page", "limit", "total", "totalPages"],
        },
      },

      required: ["items", "pagination"],
    },
  },

  required: ["message", "data"],
};

export const unreadNotificationCountResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: {
      type: "object",

      properties: {
        count: {
          type: "integer",
        },
      },

      required: ["count"],
    },
  },

  required: ["message", "data"],
};

export const notificationReadAllResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: {
      type: "object",

      properties: {
        updatedCount: {
          type: "integer",
        },
      },

      required: ["updatedCount"],
    },
  },

  required: ["message", "data"],
};

export const notificationDeleteResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: {
      type: "object",

      properties: {
        id: {
          type: "string",
        },
      },

      required: ["id"],
    },
  },

  required: ["message", "data"],
};

export const notificationErrorResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    errors: {
      type: "object",
      additionalProperties: true,
    },

    error: {
      type: "object",
      additionalProperties: true,
    },
  },

  required: ["message"],
};
