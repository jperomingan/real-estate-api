import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { JwtUser } from "../permission/permission.types.js";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function buildDateFilter(query: { dateFrom?: Date; dateTo?: Date }) {
  if (!query.dateFrom && !query.dateTo) {
    return undefined;
  }

  return {
    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
    ...(query.dateTo ? { lte: query.dateTo } : {}),
  };
}

export async function getDashboardSummary(
  query: { dateFrom?: Date; dateTo?: Date },
  user: JwtUser,
) {
  const revenueWhere = {
    ...(buildDateFilter(query) ? { saleDate: buildDateFilter(query) } : {}),
  } as Prisma.RevenueWhereInput;

  const propertyWhere = {} as Prisma.PropertyWhereInput;
  const leadWhere = {
    ...(buildDateFilter(query) ? { createdAt: buildDateFilter(query) } : {}),
  } as Prisma.LeadWhereInput;

  if (user.role === "BROKER") {
    revenueWhere.brokerId = user.id;
    propertyWhere.brokerId = user.id;
    leadWhere.brokerId = user.id;
  }

  const [
    totalProperties,
    publishedProperties,
    totalLeads,
    newLeads,
    closedWonLeads,
    revenues,
  ] = await Promise.all([
    prisma.property.count({
      where: propertyWhere,
    }),
    prisma.property.count({
      where: {
        ...propertyWhere,
        status: "PUBLISHED",
      },
    }),
    prisma.lead.count({
      where: leadWhere,
    }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        status: "NEW",
      },
    }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        status: "CLOSED_WON",
      },
    }),
    prisma.revenue.findMany({
      where: revenueWhere,
      select: {
        grossSaleAmount: true,
        commissionAmount: true,
        paymentReceived: true,
        paymentStatus: true,
        commissionStatus: true,
      },
    }),
  ]);

  const totalGrossSales = revenues.reduce(
    (sum, item) => sum + toNumber(item.grossSaleAmount),
    0,
  );

  const totalCommission = revenues.reduce(
    (sum, item) => sum + toNumber(item.commissionAmount),
    0,
  );

  const totalPaymentReceived = revenues.reduce(
    (sum, item) => sum + toNumber(item.paymentReceived),
    0,
  );

  return {
    totalProperties,
    publishedProperties,
    totalLeads,
    newLeads,
    closedWonLeads,
    leadConversionRate:
      totalLeads > 0
        ? Number(((closedWonLeads / totalLeads) * 100).toFixed(2))
        : 0,
    totalRevenueRecords: revenues.length,
    totalGrossSales,
    totalCommission,
    totalPaymentReceived,
    totalReceivable: totalGrossSales - totalPaymentReceived,
    paidRevenueCount: revenues.filter((item) => item.paymentStatus === "PAID")
      .length,
    unpaidRevenueCount: revenues.filter(
      (item) => item.paymentStatus === "UNPAID",
    ).length,
    releasedCommissionCount: revenues.filter(
      (item) => item.commissionStatus === "RELEASED",
    ).length,
    pendingCommissionCount: revenues.filter(
      (item) => item.commissionStatus === "PENDING",
    ).length,
  };
}

export async function getMonthlyRevenue(
  query: { dateFrom?: Date; dateTo?: Date },
  user: JwtUser,
) {
  const where = {
    ...(buildDateFilter(query) ? { saleDate: buildDateFilter(query) } : {}),
  } as Prisma.RevenueWhereInput;

  if (user.role === "BROKER") {
    where.brokerId = user.id;
  }

  const revenues = await prisma.revenue.findMany({
    where,
    select: {
      saleDate: true,
      grossSaleAmount: true,
      commissionAmount: true,
      paymentReceived: true,
    },
    orderBy: {
      saleDate: "asc",
    },
  });

  const monthlyMap = new Map<
    string,
    {
      month: string;
      totalGrossSales: number;
      totalCommission: number;
      totalPaymentReceived: number;
      count: number;
    }
  >();

  for (const item of revenues) {
    const month = item.saleDate.toISOString().slice(0, 7);

    const existing = monthlyMap.get(month) ?? {
      month,
      totalGrossSales: 0,
      totalCommission: 0,
      totalPaymentReceived: 0,
      count: 0,
    };

    existing.totalGrossSales += toNumber(item.grossSaleAmount);
    existing.totalCommission += toNumber(item.commissionAmount);
    existing.totalPaymentReceived += toNumber(item.paymentReceived);
    existing.count += 1;

    monthlyMap.set(month, existing);
  }

  return Array.from(monthlyMap.values());
}

export async function getLeadConversion(
  query: { dateFrom?: Date; dateTo?: Date },
  user: JwtUser,
) {
  const where = {
    ...(buildDateFilter(query) ? { createdAt: buildDateFilter(query) } : {}),
  } as Prisma.LeadWhereInput;

  if (user.role === "BROKER") {
    where.brokerId = user.id;
  }

  const leads = await prisma.lead.findMany({
    where,
    select: {
      status: true,
    },
  });

  const total = leads.length;

  const statuses = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING_SCHEDULED",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
    "ARCHIVED",
  ];

  return statuses.map((status) => {
    const count = leads.filter((lead) => lead.status === status).length;

    return {
      status,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    };
  });
}

export async function getPropertyStats(user: JwtUser) {
  const where = {} as Prisma.PropertyWhereInput;

  if (user.role === "BROKER") {
    where.brokerId = user.id;
  }

  const properties = await prisma.property.findMany({
    where,
    select: {
      type: true,
      status: true,
      city: true,
      province: true,
    },
  });

  const byStatus = new Map<string, number>();
  const byType = new Map<string, number>();
  const byLocation = new Map<string, number>();

  for (const property of properties) {
    byStatus.set(property.status, (byStatus.get(property.status) ?? 0) + 1);
    byType.set(property.type, (byType.get(property.type) ?? 0) + 1);

    const location = `${property.city}, ${property.province}`;
    byLocation.set(location, (byLocation.get(location) ?? 0) + 1);
  }

  return {
    total: properties.length,
    byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    byType: Array.from(byType.entries()).map(([type, count]) => ({
      type,
      count,
    })),
    byLocation: Array.from(byLocation.entries()).map(([location, count]) => ({
      location,
      count,
    })),
  };
}

export async function getBrokerPerformance(
  query: { dateFrom?: Date; dateTo?: Date },
  user: JwtUser,
) {
  const where = {
    ...(buildDateFilter(query) ? { saleDate: buildDateFilter(query) } : {}),
  } as Prisma.RevenueWhereInput;

  if (user.role === "BROKER") {
    where.brokerId = user.id;
  }

  const revenues = await prisma.revenue.findMany({
    where,
    select: {
      brokerId: true,
      grossSaleAmount: true,
      commissionAmount: true,
      broker: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const performanceMap = new Map<
    string,
    {
      brokerId: string;
      brokerName: string;
      brokerEmail: string;
      totalGrossSales: number;
      totalCommission: number;
      closedSalesCount: number;
    }
  >();

  for (const item of revenues) {
    const existing = performanceMap.get(item.brokerId) ?? {
      brokerId: item.brokerId,
      brokerName: `${item.broker.firstName} ${item.broker.lastName}`,
      brokerEmail: item.broker.email,
      totalGrossSales: 0,
      totalCommission: 0,
      closedSalesCount: 0,
    };

    existing.totalGrossSales += toNumber(item.grossSaleAmount);
    existing.totalCommission += toNumber(item.commissionAmount);
    existing.closedSalesCount += 1;

    performanceMap.set(item.brokerId, existing);
  }

  return Array.from(performanceMap.values()).sort(
    (a, b) => b.totalGrossSales - a.totalGrossSales,
  );
}
