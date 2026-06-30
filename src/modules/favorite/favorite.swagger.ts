const decimalSchema = {
  anyOf: [
    {
      type: "number",
    },
    {
      type: "string",
    },
  ],
};

const propertyImageSchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    url: {
      type: "string",
    },

    altText: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    sortOrder: {
      type: "integer",
    },
  },

  required: ["id", "url", "sortOrder"],
};

const brokerSchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    firstName: {
      type: "string",
    },

    lastName: {
      type: "string",
    },

    email: {
      type: "string",
    },

    phone: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
  },

  required: ["id", "firstName", "lastName", "email"],
};

const propertySchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    title: {
      type: "string",
    },

    description: {
      type: "string",
    },

    type: {
      type: "string",
    },

    status: {
      type: "string",
    },

    price: decimalSchema,

    lotAreaSqm: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    floorAreaSqm: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    bedrooms: {
      anyOf: [
        {
          type: "integer",
        },
        {
          type: "null",
        },
      ],
    },

    bathrooms: {
      anyOf: [
        {
          type: "integer",
        },
        {
          type: "null",
        },
      ],
    },

    address: {
      type: "string",
    },

    barangay: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    city: {
      type: "string",
    },

    province: {
      type: "string",
    },

    zipCode: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    latitude: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    longitude: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    brokerId: {
      type: "string",
    },

    broker: brokerSchema,

    images: {
      type: "array",
      items: propertyImageSchema,
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
    "title",
    "description",
    "type",
    "status",
    "price",
    "address",
    "city",
    "province",
    "brokerId",
    "broker",
    "images",
    "createdAt",
    "updatedAt",
  ],
};

const favoriteItemSchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    userId: {
      type: "string",
    },

    propertyId: {
      type: "string",
    },

    property: propertySchema,

    createdAt: {
      type: "string",
      format: "date-time",
    },
  },

  required: ["id", "userId", "propertyId", "property", "createdAt"],
};

export const favoritePropertyParamsSwaggerSchema = {
  type: "object",

  required: ["propertyId"],

  properties: {
    propertyId: {
      type: "string",
      format: "uuid",
    },
  },
};

export const favoriteListQuerySwaggerSchema = {
  type: "object",

  properties: {
    search: {
      type: "string",
    },

    city: {
      type: "string",
    },

    province: {
      type: "string",
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

export const favoriteSuccessResponseSchema = {
  type: "object",

  properties: {
    success: {
      type: "boolean",
    },

    message: {
      type: "string",
    },

    data: favoriteItemSchema,
  },

  required: ["message", "data"],
};

export const favoriteListResponseSchema = {
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
          items: favoriteItemSchema,
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

export const favoriteStatusResponseSchema = {
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
        propertyId: {
          type: "string",
        },

        isFavorited: {
          type: "boolean",
        },
      },

      required: ["propertyId", "isFavorited"],
    },
  },

  required: ["message", "data"],
};

export const favoriteDeleteResponseSchema = {
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
        propertyId: {
          type: "string",
        },
      },

      required: ["propertyId"],
    },
  },

  required: ["message", "data"],
};

export const favoriteErrorResponseSchema = {
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
