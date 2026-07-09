import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import type { JwtUser } from "../permission/permission.types.js";

import type { DashboardSummaryQuery } from "./dashboard.schema.js";

type PropertyFindManyArgs = Prisma.Args<typeof prisma.property, "findMany">;

type PropertyWhereInput = NonNullable<PropertyFindManyArgs["where"]>;

type LeadFindManyArgs = Prisma.Args<typeof prisma.lead, "findMany">;

type LeadWhereInput = NonNullable<LeadFindManyArgs["where"]>;

type ViewingFindManyArgs = Prisma.Args<
  typeof prisma.viewingAppointment,
  "findMany"
>;

type ViewingWhereInput = NonNullable<ViewingFindManyArgs["where"]>;

type RevenueFindManyArgs = Prisma.Args<typeof prisma.revenue, "findMany">;

type RevenueWhereInput = NonNullable<RevenueFindManyArgs["where"]>;

type DateFilter = {
  gte?: Date;
  lte?: Date;
};

type CountByStatusItem = {
  status: string;
  count: number;
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildDateFilter(
  dateFrom?: Date,
  dateTo?: Date,
): DateFilter | undefined {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  return {
    ...(dateFrom
      ? {
        gte: dateFrom,
      }
      : {}),

    ...(dateTo
      ? {
        lte: dateTo,
      }
      : {}),
  };
}

function normalizeStatusCounts<
  T extends {
    status: unknown;
    _count: {
      _all: number;
    };
  },
>(rows: T[]): CountByStatusItem[] {
  return rows.map((row) => ({
    status: String(row.status),

    count: row._count._all,
  }));
}

export async function getDashboardSummary(
  user: JwtUser,
  query: DashboardSummaryQuery,
) {
  const dateFilter = buildDateFilter(query.dateFrom, query.dateTo);

  const propertyWhere: PropertyWhereInput = {
    ...(user.role === "BROKER"
      ? {
        brokerId: user.id,
      }
      : {}),

    ...(dateFilter
      ? {
        createdAt: dateFilter,
      }
      : {}),
  };

  const leadWhere: LeadWhereInput = {
    ...(user.role === "BROKER"
      ? {
        brokerId: user.id,
      }
      : {}),

    ...(dateFilter
      ? {
        createdAt: dateFilter,
      }
      : {}),
  };

  const viewingWhere: ViewingWhereInput = {
    ...(user.role === "BROKER"
      ? {
        brokerId: user.id,
      }
      : {}),

    ...(dateFilter
      ? {
        preferredDate: dateFilter,
      }
      : {}),
  };

  const revenueWhere: RevenueWhereInput = {
    ...(user.role === "BROKER"
      ? {
        brokerId: user.id,
      }
      : {}),

    ...(dateFilter
      ? {
        saleDate: dateFilter,
      }
      : {}),
  };

  const [
    propertyTotal,
    propertyStatusRows,
    leadTotal,
    leadStatusRows,
    viewingTotal,
    viewingStatusRows,
    revenueTotal,
    revenuePaymentStatusRows,
    revenueCommissionStatusRows,
    revenueAggregate,
    recentProperties,
    recentLeads,
    recentViewings,
    recentRevenues,
  ] = await Promise.all([
    prisma.property.count({
      where: propertyWhere,
    }),

    prisma.property.groupBy({
      by: ["status"],

      where: propertyWhere,

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

    prisma.lead.count({
      where: leadWhere,
    }),

    prisma.lead.groupBy({
      by: ["status"],

      where: leadWhere,

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

    prisma.viewingAppointment.count({
      where: viewingWhere,
    }),

    prisma.viewingAppointment.groupBy({
      by: ["status"],

      where: viewingWhere,

      _count: {
        _all: true,
      },

      orderBy: {
        status: "asc",
      },
    }),

    prisma.revenue.count({
      where: revenueWhere,
    }),

    prisma.revenue.groupBy({
      by: ["paymentStatus"],

      where: revenueWhere,

      _count: {
        _all: true,
      },

      orderBy: {
        paymentStatus: "asc",
      },
    }),

    prisma.revenue.groupBy({
      by: ["commissionStatus"],

      where: revenueWhere,

      _count: {
        _all: true,
      },

      orderBy: {
        commissionStatus: "asc",
      },
    }),

    prisma.revenue.aggregate({
      where: revenueWhere,

      _sum: {
        grossSaleAmount: true,
        commissionAmount: true,
        paymentReceived: true,
      },
    }),

    prisma.property.findMany({
      where: propertyWhere,

      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        price: true,
        city: true,
        province: true,
        createdAt: true,

        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: query.recentLimit,
    }),

    prisma.lead.findMany({
      where: leadWhere,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        budget: true,
        createdAt: true,

        property: {
          select: {
            id: true,
            title: true,
          },
        },

        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: query.recentLimit,
    }),

    prisma.viewingAppointment.findMany({
      where: viewingWhere,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        preferredDate: true,
        confirmedDate: true,
        createdAt: true,

        property: {
          select: {
            id: true,
            title: true,
          },
        },

        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        clientId: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: query.recentLimit,
    }),

    prisma.revenue.findMany({
      where: revenueWhere,

      select: {
        id: true,
        grossSaleAmount: true,
        commissionRate: true,
        commissionAmount: true,
        paymentReceived: true,
        paymentStatus: true,
        commissionStatus: true,
        saleDate: true,
        createdAt: true,

        property: {
          select: {
            id: true,
            title: true,
          },
        },

        broker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        saleDate: "desc",
      },

      take: query.recentLimit,
    }),
  ]);

  const totalGrossSales = roundMoney(
    toNumber(revenueAggregate._sum.grossSaleAmount),
  );

  const totalCommission = roundMoney(
    toNumber(revenueAggregate._sum.commissionAmount),
  );

  const totalPaymentReceived = roundMoney(
    toNumber(revenueAggregate._sum.paymentReceived),
  );

  return {
    role: user.role,

    scope: user.role === "BROKER" ? "BROKER" : "GLOBAL",

    filters: {
      dateFrom: query.dateFrom ? query.dateFrom.toISOString() : null,

      dateTo: query.dateTo ? query.dateTo.toISOString() : null,

      recentLimit: query.recentLimit,
    },

    properties: {
      total: propertyTotal,

      byStatus: normalizeStatusCounts(propertyStatusRows),
    },

    leads: {
      total: leadTotal,

      byStatus: normalizeStatusCounts(leadStatusRows),
    },

    viewings: {
      total: viewingTotal,

      byStatus: normalizeStatusCounts(viewingStatusRows),
    },

    revenue: {
      totalRecords: revenueTotal,

      totalGrossSales,

      totalCommission,

      totalPaymentReceived,

      totalReceivable: roundMoney(totalGrossSales - totalPaymentReceived),

      byPaymentStatus: revenuePaymentStatusRows.map((row) => ({
        status: String(row.paymentStatus),

        count: row._count._all,
      })),

      byCommissionStatus: revenueCommissionStatusRows.map((row) => ({
        status: String(row.commissionStatus),

        count: row._count._all,
      })),
    },

    recent: {
      properties: recentProperties,

      leads: recentLeads,

      viewings: recentViewings,

      revenues: recentRevenues,
    },
  };
}
