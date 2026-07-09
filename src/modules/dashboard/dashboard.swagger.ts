const nullableStringSchema = {
  anyOf: [
    {
      type: "string",
    },
    {
      type: "null",
    },
  ],
};

const statusCountSchema = {
  type: "object",

  properties: {
    status: {
      type: "string",
    },

    count: {
      type: "integer",
    },
  },

  required: ["status", "count"],
};

export const dashboardSummaryQuerySchemaForSwagger = {
  type: "object",

  properties: {
    dateFrom: {
      type: "string",
      format: "date-time",
    },

    dateTo: {
      type: "string",
      format: "date-time",
    },

    recentLimit: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      default: 5,
    },
  },
};

export const dashboardSummaryResponseSchema = {
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
        role: {
          type: "string",
        },

        scope: {
          type: "string",
          enum: ["GLOBAL", "BROKER"],
        },

        filters: {
          type: "object",

          properties: {
            dateFrom: nullableStringSchema,

            dateTo: nullableStringSchema,

            recentLimit: {
              type: "integer",
            },
          },

          required: ["dateFrom", "dateTo", "recentLimit"],
        },

        properties: {
          type: "object",

          properties: {
            total: {
              type: "integer",
            },

            byStatus: {
              type: "array",
              items: statusCountSchema,
            },
          },

          required: ["total", "byStatus"],
        },

        leads: {
          type: "object",

          properties: {
            total: {
              type: "integer",
            },

            byStatus: {
              type: "array",
              items: statusCountSchema,
            },
          },

          required: ["total", "byStatus"],
        },

        viewings: {
          type: "object",

          properties: {
            total: {
              type: "integer",
            },

            byStatus: {
              type: "array",
              items: statusCountSchema,
            },
          },

          required: ["total", "byStatus"],
        },

        revenue: {
          type: "object",

          properties: {
            totalRecords: {
              type: "integer",
            },

            totalGrossSales: {
              type: "number",
            },

            totalCommission: {
              type: "number",
            },

            totalPaymentReceived: {
              type: "number",
            },

            totalReceivable: {
              type: "number",
            },

            byPaymentStatus: {
              type: "array",
              items: statusCountSchema,
            },

            byCommissionStatus: {
              type: "array",
              items: statusCountSchema,
            },
          },

          required: [
            "totalRecords",
            "totalGrossSales",
            "totalCommission",
            "totalPaymentReceived",
            "totalReceivable",
            "byPaymentStatus",
            "byCommissionStatus",
          ],
        },

        recent: {
          type: "object",

          properties: {
            properties: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },

            leads: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },

            viewings: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },

            revenues: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
          },

          required: ["properties", "leads", "viewings", "revenues"],
        },
      },

      required: [
        "role",
        "scope",
        "filters",
        "properties",
        "leads",
        "viewings",
        "revenue",
        "recent",
      ],
    },
  },

  required: ["message", "data"],
};

export const dashboardErrorResponseSchema = {
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
