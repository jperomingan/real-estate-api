import { prisma } from "../../lib/prisma.js";
import { CreateRevenueInput } from "./revenue.schema.js";
import { JwtUser } from "./revenue.middleware.js";

const revenueSelect = {
    id: true,
    grossSaleAmount: true,
    commissionRate: true,
    commissionAmount: true,
    paymentReceived: true,
    paymentStatus: true,
    commissionStatus: true,
    saleDate: true,
    notes: true,
    propertyId: true,
    property: {
        select: {
            id: true,
            title: true,
            price: true,
            city: true,
            province: true,
            status: true,
        },
    },
    leadId: true,
    lead: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
        },
    },
    brokerId: true,
    broker: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        },
    },
    createdAt: true,
    updatedAt: true,
};

function calculateCommission(grossSaleAmount: number, commissionRate: number) {
    return grossSaleAmount * (commissionRate / 100);
}

export async function createRevenue(input: CreateRevenueInput, user: JwtUser) {
    const property = await prisma.property.findUnique({
        where: {
            id: input.propertyId,
        },
    });

    if (!property) {
        throw new Error("Property not found.");
    }

    let brokerId = input.brokerId ?? property.brokerId;

    if (user.role === "BROKER") {
        brokerId = user.id;

        if (property.brokerId !== user.id) {
            throw new Error(
                "Brokers can only create revenue records for their own properties."
            );
        }
    }

    const broker = await prisma.user.findUnique({
        where: {
            id: brokerId,
        },
    });

    if (!broker) {
        throw new Error("Broker not found.");
    }

    if (broker.role !== "BROKER" && broker.role !== "ADMIN") {
        throw new Error("Revenue must be assigned to a broker or admin.");
    }

    if (input.leadId) {
        const lead = await prisma.lead.findUnique({
            where: {
                id: input.leadId,
            },
        });

        if (!lead) {
            throw new Error("Lead not found.");
        }

        if (lead.propertyId && lead.propertyId !== input.propertyId) {
            throw new Error("Lead does not belong to the selected property.");
        }

        if (lead.brokerId !== brokerId) {
            throw new Error("Lead does not belong to the selected broker.");
        }

        if (lead.status !== "CLOSED_WON") {
            throw new Error("Only CLOSED_WON leads can be converted to revenue.");
        }
    }

    const commissionAmount = calculateCommission(
        input.grossSaleAmount,
        input.commissionRate
    );

    return prisma.revenue.create({
        data: {
            propertyId: input.propertyId,
            leadId: input.leadId,
            brokerId,
            grossSaleAmount: input.grossSaleAmount,
            commissionRate: input.commissionRate,
            commissionAmount,
            paymentReceived: input.paymentReceived,
            paymentStatus: input.paymentStatus,
            commissionStatus: input.commissionStatus,
            saleDate: input.saleDate,
            notes: input.notes,
        },
        select: revenueSelect,
    });
}

export async function getRevenues(
    query: {
        search?: string;
        propertyId?: string;
        brokerId?: string;
        paymentStatus?: string;
        commissionStatus?: string;
        dateFrom?: Date;
        dateTo?: Date;
        page: number;
        limit: number;
    },
    user: JwtUser
) {
    const where: any = {
        ...(query.propertyId ? { propertyId: query.propertyId } : {}),
        ...(query.brokerId ? { brokerId: query.brokerId } : {}),
        ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
        ...(query.commissionStatus
            ? { commissionStatus: query.commissionStatus }
            : {}),
        ...(query.dateFrom || query.dateTo
            ? {
                saleDate: {
                    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                    ...(query.dateTo ? { lte: query.dateTo } : {}),
                },
            }
            : {}),
        ...(query.search
            ? {
                OR: [
                    {
                        property: {
                            title: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                    },
                    {
                        broker: {
                            email: {
                                contains: query.search,
                                mode: "insensitive",
                            },
                        },
                    },
                ],
            }
            : {}),
    };

    if (user.role === "BROKER") {
        where.brokerId = user.id;
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await prisma.$transaction([
        prisma.revenue.findMany({
            where,
            select: revenueSelect,
            orderBy: {
                saleDate: "desc",
            },
            skip,
            take: query.limit,
        }),
        prisma.revenue.count({
            where,
        }),
    ]);

    return {
        items,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

export async function getRevenueById(id: string, user: JwtUser) {
    const revenue = await prisma.revenue.findUnique({
        where: {
            id,
        },
        select: revenueSelect,
    });

    if (!revenue) {
        return null;
    }

    if (user.role === "BROKER" && revenue.brokerId !== user.id) {
        throw new Error("You can only view your own revenue records.");
    }

    return revenue;
}

export async function updateRevenuePaymentStatus(
    id: string,
    input: {
        paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED" | "REFUNDED";
        paymentReceived?: number;
    },
    user: JwtUser
) {
    const existingRevenue = await prisma.revenue.findUnique({
        where: {
            id,
        },
    });

    if (!existingRevenue) {
        throw new Error("Revenue record not found.");
    }

    if (user.role === "BROKER" && existingRevenue.brokerId !== user.id) {
        throw new Error("You can only update your own revenue records.");
    }

    return prisma.revenue.update({
        where: {
            id,
        },
        data: {
            paymentStatus: input.paymentStatus,
            paymentReceived: input.paymentReceived,
        },
        select: revenueSelect,
    });
}

export async function updateRevenueCommissionStatus(
    id: string,
    commissionStatus: "PENDING" | "PARTIAL" | "RELEASED" | "CANCELLED",
    user: JwtUser
) {
    const existingRevenue = await prisma.revenue.findUnique({
        where: {
            id,
        },
    });

    if (!existingRevenue) {
        throw new Error("Revenue record not found.");
    }

    if (user.role === "BROKER" && existingRevenue.brokerId !== user.id) {
        throw new Error("You can only update your own revenue records.");
    }

    return prisma.revenue.update({
        where: {
            id,
        },
        data: {
            commissionStatus,
        },
        select: revenueSelect,
    });
}

export async function getRevenueSummary(user: JwtUser) {
    const where: any = {};

    if (user.role === "BROKER") {
        where.brokerId = user.id;
    }

    const revenues = await prisma.revenue.findMany({
        where,
        select: {
            grossSaleAmount: true,
            commissionAmount: true,
            paymentReceived: true,
            paymentStatus: true,
            commissionStatus: true,
        },
    });

    const totalGrossSales = revenues.reduce(
        (sum, item) => sum + Number(item.grossSaleAmount),
        0
    );

    const totalCommission = revenues.reduce(
        (sum, item) => sum + Number(item.commissionAmount),
        0
    );

    const totalPaymentReceived = revenues.reduce(
        (sum, item) => sum + Number(item.paymentReceived),
        0
    );

    const totalReceivable = totalGrossSales - totalPaymentReceived;

    return {
        totalRecords: revenues.length,
        totalGrossSales,
        totalCommission,
        totalPaymentReceived,
        totalReceivable,
        unpaidCount: revenues.filter((item) => item.paymentStatus === "UNPAID")
            .length,
        partiallyPaidCount: revenues.filter((item) => item.paymentStatus === "PARTIAL")
            .length,
        paidCount: revenues.filter((item) => item.paymentStatus === "PAID").length,
        pendingCommissionCount: revenues.filter(
            (item) => item.commissionStatus === "PENDING"
        ).length,
        releasedCommissionCount: revenues.filter(
            (item) => item.commissionStatus === "RELEASED"
        ).length,
    };
}

export async function deleteRevenue(id: string, user: JwtUser) {
    const existingRevenue = await prisma.revenue.findUnique({
        where: {
            id,
        },
    });

    if (!existingRevenue) {
        throw new Error("Revenue record not found.");
    }

    if (user.role === "BROKER" && existingRevenue.brokerId !== user.id) {
        throw new Error("You can only delete your own revenue records.");
    }

    await prisma.revenue.delete({
        where: {
            id,
        },
    });
}