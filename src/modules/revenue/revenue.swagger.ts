import {
    errorResponseSchema,
    paginatedResponseSchema,
    successResponseSchema,
} from "../../utils/swagger-schemas.js";

export const paymentStatusValues = [
    "UNPAID",
    "PARTIAL",
    "PAID",
    "CANCELLED",
    "REFUNDED",
];

export const commissionStatusValues = [
    "PENDING",
    "PARTIAL",
    "RELEASED",
    "CANCELLED",
];

export const revenuePropertyResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        title: { type: "string" },
        price: { type: "string" },
        city: { type: "string" },
        province: { type: "string" },
        status: { type: "string" },
    },
};

export const revenueLeadResponseSchema = {
    type: "object",
    nullable: true,
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string", nullable: true },
        phone: { type: "string" },
        email: { type: "string", nullable: true },
        status: { type: "string" },
    },
};

export const revenueBrokerResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string", nullable: true },
    },
};

export const revenueResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        grossSaleAmount: { type: "string" },
        commissionRate: { type: "string" },
        commissionAmount: { type: "string" },
        paymentReceived: { type: "string" },
        paymentStatus: { type: "string", enum: paymentStatusValues },
        commissionStatus: { type: "string", enum: commissionStatusValues },
        saleDate: { type: "string" },
        notes: { type: "string", nullable: true },
        propertyId: { type: "string" },
        property: revenuePropertyResponseSchema,
        leadId: { type: "string", nullable: true },
        lead: revenueLeadResponseSchema,
        brokerId: { type: "string" },
        broker: revenueBrokerResponseSchema,
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
    },
};

export const createRevenueBodySchema = {
    type: "object",
    required: ["propertyId", "grossSaleAmount", "commissionRate"],
    properties: {
        propertyId: {
            type: "string",
            description: "Required property ID",
        },
        leadId: {
            type: "string",
            description:
                "Optional. If provided, the lead must exist and must be CLOSED_WON.",
        },
        brokerId: {
            type: "string",
            description:
                "Optional for admin use. If not provided, broker is taken from the property.",
        },
        grossSaleAmount: {
            type: "number",
            description: "Total sale amount. Example: 3500000",
        },
        commissionRate: {
            type: "number",
            description: "Commission rate percentage. Example: 5",
        },
        paymentReceived: {
            type: "number",
            description: "Amount already received. Example: 500000",
        },
        paymentStatus: {
            type: "string",
            enum: paymentStatusValues,
        },
        commissionStatus: {
            type: "string",
            enum: commissionStatusValues,
        },
        saleDate: {
            type: "string",
            description: "Optional sale date in ISO format",
        },
        notes: {
            type: "string",
            description: "Optional notes",
        },
    },
};

export const revenueParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: {
            type: "string",
            description: "Revenue record ID",
        },
    },
};

export const revenueListQuerySchemaForSwagger = {
    type: "object",
    properties: {
        search: {
            type: "string",
            description: "Search by property title or broker email",
        },
        propertyId: {
            type: "string",
        },
        brokerId: {
            type: "string",
        },
        paymentStatus: {
            type: "string",
            enum: paymentStatusValues,
        },
        commissionStatus: {
            type: "string",
            enum: commissionStatusValues,
        },
        dateFrom: {
            type: "string",
            description: "Start sale date filter. Example: 2026-01-01",
        },
        dateTo: {
            type: "string",
            description: "End sale date filter. Example: 2026-12-31",
        },
        page: {
            type: "number",
        },
        limit: {
            type: "number",
        },
    },
};

export const updatePaymentStatusBodySchema = {
    type: "object",
    required: ["paymentStatus"],
    properties: {
        paymentStatus: {
            type: "string",
            enum: paymentStatusValues,
        },
        paymentReceived: {
            type: "number",
            description: "Optional updated payment received amount",
        },
    },
};

export const updateCommissionStatusBodySchema = {
    type: "object",
    required: ["commissionStatus"],
    properties: {
        commissionStatus: {
            type: "string",
            enum: commissionStatusValues,
        },
    },
};

export const revenueSummaryResponseSchema = successResponseSchema({
    type: "object",
    properties: {
        totalRecords: { type: "number" },
        totalGrossSales: { type: "number" },
        totalCommission: { type: "number" },
        totalPaymentReceived: { type: "number" },
        totalReceivable: { type: "number" },
        unpaidCount: { type: "number" },
        partiallyPaidCount: { type: "number" },
        paidCount: { type: "number" },
        pendingCommissionCount: { type: "number" },
        releasedCommissionCount: { type: "number" },
    },
});

export const revenueSuccessResponseSchema =
    successResponseSchema(revenueResponseSchema);

export const revenueListResponseSchema =
    paginatedResponseSchema(revenueResponseSchema);

export const revenueDeleteResponseSchema = successResponseSchema({
    type: "object",
    properties: {},
});

export const revenueErrorResponseSchema = errorResponseSchema;