const decimalSchema = {
    anyOf: [
        { type: "number" },
        { type: "string" },
    ],
};

const nullableStringSchema = {
    anyOf: [
        { type: "string" },
        { type: "null" },
    ],
};

const brokerSummarySchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: nullableStringSchema,
    },
    required: [
        "id",
        "firstName",
        "lastName",
        "email",
    ],
};

const revenueItemSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        propertyId: { type: "string" },
        property: {
            type: "object",
            properties: {
                id: { type: "string" },
                title: { type: "string" },
                status: { type: "string" },
                price: decimalSchema,
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
            },
            required: [
                "id",
                "title",
                "status",
                "price",
                "address",
                "city",
                "province",
            ],
        },
        leadId: nullableStringSchema,
        lead: {
            anyOf: [
                {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: nullableStringSchema,
                        phone: { type: "string" },
                        status: { type: "string" },
                    },
                    required: [
                        "id",
                        "firstName",
                        "lastName",
                        "phone",
                        "status",
                    ],
                },
                { type: "null" },
            ],
        },
        brokerId: { type: "string" },
        broker: brokerSummarySchema,
        grossSaleAmount: decimalSchema,
        commissionRate: decimalSchema,
        commissionAmount: decimalSchema,
        paymentReceived: decimalSchema,
        paymentStatus: {
            type: "string",
            enum: [
                "UNPAID",
                "PARTIAL",
                "PAID",
            ],
        },
        commissionStatus: {
            type: "string",
            enum: [
                "PENDING",
                "RELEASED",
            ],
        },
        saleDate: {
            type: "string",
            format: "date-time",
        },
        notes: nullableStringSchema,
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
        "propertyId",
        "property",
        "brokerId",
        "broker",
        "grossSaleAmount",
        "commissionRate",
        "commissionAmount",
        "paymentReceived",
        "paymentStatus",
        "commissionStatus",
        "saleDate",
        "createdAt",
        "updatedAt",
    ],
};

export const createRevenueBodySchema = {
    type: "object",
    required: [
        "propertyId",
        "grossSaleAmount",
        "commissionRate",
        "saleDate",
    ],
    properties: {
        propertyId: {
            type: "string",
            format: "uuid",
        },
        leadId: {
            type: "string",
            format: "uuid",
        },
        grossSaleAmount: {
            type: "number",
            exclusiveMinimum: 0,
        },
        commissionRate: {
            type: "number",
            minimum: 0,
            maximum: 100,
        },
        paymentReceived: {
            type: "number",
            minimum: 0,
            default: 0,
        },
        commissionStatus: {
            type: "string",
            enum: [
                "PENDING",
                "RELEASED",
            ],
            default: "PENDING",
        },
        saleDate: {
            type: "string",
            format: "date-time",
        },
        notes: {
            type: "string",
            maxLength: 2000,
        },
    },
};

export const revenueListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: { type: "string" },
        propertyId: {
            type: "string",
            format: "uuid",
        },
        brokerId: {
            type: "string",
            format: "uuid",
        },
        paymentStatus: {
            type: "string",
            enum: [
                "UNPAID",
                "PARTIAL",
                "PAID",
            ],
        },
        commissionStatus: {
            type: "string",
            enum: [
                "PENDING",
                "RELEASED",
            ],
        },
        dateFrom: {
            type: "string",
            format: "date-time",
        },
        dateTo: {
            type: "string",
            format: "date-time",
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

export const revenueParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: {
            type: "string",
            format: "uuid",
        },
    },
};

export const updatePaymentStatusBodySchema = {
    type: "object",
    required: ["paymentReceived"],
    properties: {
        paymentReceived: {
            type: "number",
            minimum: 0,
        },
        paymentStatus: {
            type: "string",
            enum: [
                "UNPAID",
                "PARTIAL",
                "PAID",
            ],
        },
    },
};

export const updateCommissionStatusBodySchema = {
    type: "object",
    required: ["commissionStatus"],
    properties: {
        commissionStatus: {
            type: "string",
            enum: [
                "PENDING",
                "RELEASED",
            ],
        },
    },
};

export const revenueSuccessResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: revenueItemSchema,
    },
    required: ["message", "data"],
};

export const revenueListResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: revenueItemSchema,
                },
                pagination: {
                    type: "object",
                    properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                    },
                    required: [
                        "page",
                        "limit",
                        "total",
                        "totalPages",
                    ],
                },
            },
            required: ["items", "pagination"],
        },
    },
    required: ["message", "data"],
};

export const revenueSummaryResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
            type: "object",
            properties: {
                totalRecords: { type: "integer" },
                totalGrossSales: { type: "number" },
                totalCommission: { type: "number" },
                totalPaymentReceived: { type: "number" },
                totalReceivable: { type: "number" },
                unpaidCount: { type: "integer" },
                partiallyPaidCount: { type: "integer" },
                paidCount: { type: "integer" },
                pendingCommissionCount: {
                    type: "integer",
                },
                releasedCommissionCount: {
                    type: "integer",
                },
            },
            required: [
                "totalRecords",
                "totalGrossSales",
                "totalCommission",
                "totalPaymentReceived",
                "totalReceivable",
                "unpaidCount",
                "partiallyPaidCount",
                "paidCount",
                "pendingCommissionCount",
                "releasedCommissionCount",
            ],
        },
    },
    required: ["message", "data"],
};

export const revenueDeleteResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
            type: "object",
            properties: {
                id: { type: "string" },
            },
            required: ["id"],
        },
    },
    required: ["message", "data"],
};

export const revenueErrorResponseSchema = {
    type: "object",
    properties: {
        success: { type: "boolean" },
        message: { type: "string" },
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
