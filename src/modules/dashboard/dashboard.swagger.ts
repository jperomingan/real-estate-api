import { errorResponseSchema, successResponseSchema } from "../../utils/swagger-schemas.js";

export const dashboardQuerySchemaForSwagger = {
    type: "object",
    properties: {
        dateFrom: {
            type: "string",
            description: "Start date filter. Example: 2026-01-01",
        },
        dateTo: {
            type: "string",
            description: "End date filter. Example: 2026-12-31",
        },
    },
};

export const dashboardSummaryResponseSchema = successResponseSchema({
    type: "object",
    properties: {
        totalProperties: { type: "number" },
        publishedProperties: { type: "number" },
        totalLeads: { type: "number" },
        newLeads: { type: "number" },
        closedWonLeads: { type: "number" },
        leadConversionRate: { type: "number" },
        totalRevenueRecords: { type: "number" },
        totalGrossSales: { type: "number" },
        totalCommission: { type: "number" },
        totalPaymentReceived: { type: "number" },
        totalReceivable: { type: "number" },
        paidRevenueCount: { type: "number" },
        unpaidRevenueCount: { type: "number" },
        releasedCommissionCount: { type: "number" },
        pendingCommissionCount: { type: "number" },
    },
});

export const monthlyRevenueResponseSchema = successResponseSchema({
    type: "array",
    items: {
        type: "object",
        properties: {
            month: { type: "string", description: "Month in YYYY-MM format" },
            totalGrossSales: { type: "number" },
            totalCommission: { type: "number" },
            totalPaymentReceived: { type: "number" },
            count: { type: "number" },
        },
    },
});

export const leadConversionResponseSchema = successResponseSchema({
    type: "array",
    items: {
        type: "object",
        properties: {
            status: { type: "string" },
            count: { type: "number" },
            percentage: { type: "number" },
        },
    },
});

export const propertyStatsResponseSchema = successResponseSchema({
    type: "object",
    properties: {
        total: { type: "number" },
        byStatus: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    status: { type: "string" },
                    count: { type: "number" },
                },
            },
        },
        byType: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    count: { type: "number" },
                },
            },
        },
        byLocation: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    location: { type: "string" },
                    count: { type: "number" },
                },
            },
        },
    },
});

export const brokerPerformanceResponseSchema = successResponseSchema({
    type: "array",
    items: {
        type: "object",
        properties: {
            brokerId: { type: "string" },
            brokerName: { type: "string" },
            brokerEmail: { type: "string" },
            totalGrossSales: { type: "number" },
            totalCommission: { type: "number" },
            closedSalesCount: { type: "number" },
        },
    },
});

export const dashboardErrorResponseSchema = errorResponseSchema;