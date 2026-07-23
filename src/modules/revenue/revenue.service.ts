import type {
  Prisma,
} from "../../generated/prisma/client.js";

import {
  prisma,
} from "../../lib/prisma.js";

import {
  buildPagination,
  getPaginationOffset,
} from "../../utils/pagination.js";

import {
  createAuditLog,
} from "../audit/audit.service.js";

import type {
  JwtUser,
} from "../permission/permission.types.js";

import type {
  CreateRevenueInput,
  RevenueCommissionStatus,
  RevenueListQuery,
  RevenuePaymentStatus,
  UpdatePaymentStatusInput,
} from "./revenue.schema.js";

type RevenueFindManyArgs =
  Prisma.Args<
    typeof prisma.revenue,
    "findMany"
  >;

type RevenueWhereInput =
  NonNullable<
    RevenueFindManyArgs["where"]
  >;

type RevenueSelect =
  NonNullable<
    RevenueFindManyArgs["select"]
  >;

const revenueSelect = {
  id: true,
  propertyId: true,
  property: {
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      address: true,
      city: true,
      province: true,
    },
  },
  leadId: true,
  lead: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
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
  grossSaleAmount: true,
  commissionRate: true,
  commissionAmount: true,
  paymentReceived: true,
  paymentStatus: true,
  commissionStatus: true,
  saleDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies RevenueSelect;

type RevenueOwnershipRecord = {
  brokerId: string;
};

function toNumber(
  value: unknown,
): number {
  return Number(
    value ?? 0,
  );
}

function roundMoney(
  value: number,
): number {
  return Math.round(
    (value + Number.EPSILON) *
    100,
  ) / 100;
}

function derivePaymentStatus(
  grossSaleAmount: number,
  paymentReceived: number,
): RevenuePaymentStatus {
  if (paymentReceived <= 0) {
    return "UNPAID";
  }

  if (
    paymentReceived >=
    grossSaleAmount
  ) {
    return "PAID";
  }

  return "PARTIAL";
}

function assertValidPayment(
  grossSaleAmount: number,
  paymentReceived: number,
) {
  if (paymentReceived < 0) {
    throw new Error(
      "Payment received must not be negative.",
    );
  }

  if (
    paymentReceived >
    grossSaleAmount
  ) {
    throw new Error(
      "Payment received must not exceed the gross sale amount.",
    );
  }
}

function assertCanManageRevenue(
  revenue:
    RevenueOwnershipRecord,
  user:
    JwtUser,
  action:
    | "view"
    | "update"
    | "delete",
) {
  if (
    user.role === "BROKER" &&
    revenue.brokerId !== user.id
  ) {
    if (action === "view") {
      throw new Error(
        "You can only view your own revenue records.",
      );
    }

    if (action === "delete") {
      throw new Error(
        "You can only delete your own revenue records.",
      );
    }

    throw new Error(
      "You can only update your own revenue records.",
    );
  }
}

async function writeRevenueAuditLog({
  action,
  revenueId,
  description,
  actorUserId,
  oldValues,
  newValues,
}: {
  action:
  | "CREATE"
  | "UPDATE"
  | "DELETE";
  revenueId: string;
  description: string;
  actorUserId: string;
  oldValues?:
  Prisma.InputJsonValue;
  newValues?:
  Prisma.InputJsonValue;
}) {
  await createAuditLog({
    action,
    resourceType:
      "REVENUE",
    resourceId:
      revenueId,
    description,
    actorUserId,
    oldValues,
    newValues,
  });
}

export async function createRevenue(
  input:
    CreateRevenueInput,
  user:
    JwtUser,
) {
  const property =
    await prisma.property.findUnique({
      where: {
        id:
          input.propertyId,
      },
      select: {
        id: true,
        title: true,
        brokerId: true,
      },
    });

  if (!property) {
    throw new Error(
      "Property not found.",
    );
  }

  if (
    user.role === "BROKER" &&
    property.brokerId !== user.id
  ) {
    throw new Error(
      "Brokers can only create revenue records for their own properties.",
    );
  }

  if (
    input.saleDate.getTime() >
    Date.now()
  ) {
    throw new Error(
      "Sale date must not be in the future.",
    );
  }

  assertValidPayment(
    input.grossSaleAmount,
    input.paymentReceived,
  );

  if (input.leadId) {
    const lead =
      await prisma.lead.findUnique({
        where: {
          id:
            input.leadId,
        },
        select: {
          id: true,
          status: true,
          propertyId: true,
          brokerId: true,
        },
      });

    if (!lead) {
      throw new Error(
        "Lead not found.",
      );
    }

    if (
      lead.status !==
      "CLOSED_WON"
    ) {
      throw new Error(
        "Revenue can only be created from a CLOSED_WON lead.",
      );
    }

    if (
      lead.propertyId &&
      lead.propertyId !==
      property.id
    ) {
      throw new Error(
        "The selected lead does not belong to the selected property.",
      );
    }

    if (
      lead.brokerId !==
      property.brokerId
    ) {
      throw new Error(
        "The selected lead and property must belong to the same broker.",
      );
    }

    const existingLeadRevenue =
      await prisma.revenue.findFirst({
        where: {
          leadId:
            lead.id,
        },
        select: {
          id: true,
        },
      });

    if (
      existingLeadRevenue
    ) {
      throw new Error(
        "A revenue record already exists for this lead.",
      );
    }
  }

  const commissionAmount =
    roundMoney(
      input.grossSaleAmount *
      (
        input.commissionRate /
        100
      ),
    );

  const paymentStatus =
    derivePaymentStatus(
      input.grossSaleAmount,
      input.paymentReceived,
    );

  const revenue =
    await prisma.revenue.create({
      data: {
        propertyId:
          property.id,
        brokerId:
          property.brokerId,
        leadId:
          input.leadId,
        grossSaleAmount:
          input.grossSaleAmount,
        commissionRate:
          input.commissionRate,
        commissionAmount,
        paymentReceived:
          input.paymentReceived,
        paymentStatus,
        commissionStatus:
          input.commissionStatus,
        saleDate:
          input.saleDate,
        notes:
          input.notes,
      },
      select:
        revenueSelect,
    });

  await writeRevenueAuditLog({
    action:
      "CREATE",
    revenueId:
      revenue.id,
    description:
      `Created revenue record for ${property.title}.`,
    actorUserId:
      user.id,
    newValues: {
      propertyId:
        revenue.propertyId,
      brokerId:
        revenue.brokerId,
      ...(revenue.leadId
        ? { leadId: revenue.leadId }
        : {}),
      grossSaleAmount:
        toNumber(
          revenue.grossSaleAmount,
        ),
      commissionRate:
        toNumber(
          revenue.commissionRate,
        ),
      commissionAmount:
        toNumber(
          revenue.commissionAmount,
        ),
      paymentReceived:
        toNumber(
          revenue.paymentReceived,
        ),
      paymentStatus:
        revenue.paymentStatus,
      commissionStatus:
        revenue.commissionStatus,
      saleDate:
        revenue.saleDate.toISOString(),
    },
  });

  return revenue;
}

export async function getRevenues(
  query:
    RevenueListQuery,
  user:
    JwtUser,
) {
  const where:
    RevenueWhereInput = {
    ...(query.propertyId
      ? {
        propertyId:
          query.propertyId,
      }
      : {}),
    ...(query.brokerId
      ? {
        brokerId:
          query.brokerId,
      }
      : {}),
    ...(query.paymentStatus
      ? {
        paymentStatus:
          query.paymentStatus,
      }
      : {}),
    ...(query.commissionStatus
      ? {
        commissionStatus:
          query.commissionStatus,
      }
      : {}),
    ...(query.dateFrom ||
      query.dateTo
      ? {
        saleDate: {
          ...(query.dateFrom
            ? {
              gte:
                query.dateFrom,
            }
            : {}),
          ...(query.dateTo
            ? {
              lte:
                query.dateTo,
            }
            : {}),
        },
      }
      : {}),
    ...(query.search
      ? {
        OR: [
          {
            property: {
              title: {
                contains:
                  query.search,
                mode:
                  "insensitive" as const,
              },
            },
          },
          {
            broker: {
              firstName: {
                contains:
                  query.search,
                mode:
                  "insensitive" as const,
              },
            },
          },
          {
            broker: {
              lastName: {
                contains:
                  query.search,
                mode:
                  "insensitive" as const,
              },
            },
          },
          {
            notes: {
              contains:
                query.search,
              mode:
                "insensitive" as const,
            },
          },
        ],
      }
      : {}),
  };

  if (
    user.role === "BROKER"
  ) {
    where.brokerId =
      user.id;
  }

  const skip =
    getPaginationOffset(
      query.page,
      query.limit,
    );

  const [items, total] =
    await Promise.all([
      prisma.revenue.findMany({
        where,
        select:
          revenueSelect,
        orderBy: {
          saleDate:
            "desc",
        },
        skip,
        take:
          query.limit,
      }),
      prisma.revenue.count({
        where,
      }),
    ]);

  return {
    items,
    pagination:
      buildPagination({
        page:
          query.page,
        limit:
          query.limit,
        total,
      }),
  };
}

export async function getRevenueById(
  id:
    string,
  user:
    JwtUser,
) {
  const revenue =
    await prisma.revenue.findUnique({
      where: {
        id,
      },
      select:
        revenueSelect,
    });

  if (!revenue) {
    return null;
  }

  assertCanManageRevenue(
    revenue,
    user,
    "view",
  );

  return revenue;
}

export async function updateRevenuePaymentStatus(
  id:
    string,
  input:
    UpdatePaymentStatusInput,
  user:
    JwtUser,
) {
  const existingRevenue =
    await prisma.revenue.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        brokerId: true,
        grossSaleAmount: true,
        paymentReceived: true,
        paymentStatus: true,
      },
    });

  if (!existingRevenue) {
    throw new Error(
      "Revenue record not found.",
    );
  }

  assertCanManageRevenue(
    existingRevenue,
    user,
    "update",
  );

  const grossSaleAmount =
    toNumber(
      existingRevenue.grossSaleAmount,
    );

  assertValidPayment(
    grossSaleAmount,
    input.paymentReceived,
  );

  const paymentStatus =
    derivePaymentStatus(
      grossSaleAmount,
      input.paymentReceived,
    );

  if (
    input.paymentStatus &&
    input.paymentStatus !==
    paymentStatus
  ) {
    throw new Error(
      `Payment status must be ${paymentStatus} for the supplied payment amount.`,
    );
  }

  const revenue =
    await prisma.revenue.update({
      where: {
        id,
      },
      data: {
        paymentReceived:
          input.paymentReceived,
        paymentStatus,
      },
      select:
        revenueSelect,
    });

  await writeRevenueAuditLog({
    action:
      "UPDATE",
    revenueId:
      revenue.id,
    description:
      "Updated revenue payment.",
    actorUserId:
      user.id,
    oldValues: {
      paymentReceived:
        toNumber(
          existingRevenue.paymentReceived,
        ),
      paymentStatus:
        existingRevenue.paymentStatus,
    },
    newValues: {
      paymentReceived:
        toNumber(
          revenue.paymentReceived,
        ),
      paymentStatus:
        revenue.paymentStatus,
    },
  });

  return revenue;
}

export async function updateRevenueCommissionStatus(
  id:
    string,
  commissionStatus:
    RevenueCommissionStatus,
  user:
    JwtUser,
) {
  const existingRevenue =
    await prisma.revenue.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        brokerId: true,
        commissionStatus: true,
      },
    });

  if (!existingRevenue) {
    throw new Error(
      "Revenue record not found.",
    );
  }

  assertCanManageRevenue(
    existingRevenue,
    user,
    "update",
  );

  const revenue =
    await prisma.revenue.update({
      where: {
        id,
      },
      data: {
        commissionStatus,
      },
      select:
        revenueSelect,
    });

  await writeRevenueAuditLog({
    action:
      "UPDATE",
    revenueId:
      revenue.id,
    description:
      "Updated revenue commission status.",
    actorUserId:
      user.id,
    oldValues: {
      commissionStatus:
        existingRevenue.commissionStatus,
    },
    newValues: {
      commissionStatus:
        revenue.commissionStatus,
    },
  });

  return revenue;
}

export async function getRevenueSummary(
  user:
    JwtUser,
) {
  const where:
    RevenueWhereInput = {};

  if (
    user.role === "BROKER"
  ) {
    where.brokerId =
      user.id;
  }

  const revenues =
    await prisma.revenue.findMany({
      where,
      select: {
        grossSaleAmount: true,
        commissionAmount: true,
        paymentReceived: true,
        paymentStatus: true,
        commissionStatus: true,
      },
    });

  const totalGrossSales =
    revenues.reduce(
      (
        sum,
        revenue,
      ) =>
        sum +
        toNumber(
          revenue.grossSaleAmount,
        ),
      0,
    );

  const totalCommission =
    revenues.reduce(
      (
        sum,
        revenue,
      ) =>
        sum +
        toNumber(
          revenue.commissionAmount,
        ),
      0,
    );

  const totalPaymentReceived =
    revenues.reduce(
      (
        sum,
        revenue,
      ) =>
        sum +
        toNumber(
          revenue.paymentReceived,
        ),
      0,
    );

  return {
    totalRecords:
      revenues.length,
    totalGrossSales:
      roundMoney(
        totalGrossSales,
      ),
    totalCommission:
      roundMoney(
        totalCommission,
      ),
    totalPaymentReceived:
      roundMoney(
        totalPaymentReceived,
      ),
    totalReceivable:
      roundMoney(
        totalGrossSales -
        totalPaymentReceived,
      ),
    unpaidCount:
      revenues.filter(
        (revenue) =>
          revenue.paymentStatus ===
          "UNPAID",
      ).length,
    partiallyPaidCount:
      revenues.filter(
        (revenue) =>
          revenue.paymentStatus ===
          "PARTIAL",
      ).length,
    paidCount:
      revenues.filter(
        (revenue) =>
          revenue.paymentStatus ===
          "PAID",
      ).length,
    pendingCommissionCount:
      revenues.filter(
        (revenue) =>
          revenue.commissionStatus ===
          "PENDING",
      ).length,
    releasedCommissionCount:
      revenues.filter(
        (revenue) =>
          revenue.commissionStatus ===
          "RELEASED",
      ).length,
  };
}

export async function deleteRevenue(
  id:
    string,
  user:
    JwtUser,
) {
  const existingRevenue =
    await prisma.revenue.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        brokerId: true,
        propertyId: true,
        leadId: true,
        grossSaleAmount: true,
        commissionAmount: true,
        paymentReceived: true,
        paymentStatus: true,
        commissionStatus: true,
      },
    });

  if (!existingRevenue) {
    throw new Error(
      "Revenue record not found.",
    );
  }

  assertCanManageRevenue(
    existingRevenue,
    user,
    "delete",
  );

  await prisma.revenue.delete({
    where: {
      id,
    },
  });

  await writeRevenueAuditLog({
    action:
      "DELETE",
    revenueId:
      existingRevenue.id,
    description:
      "Deleted revenue record.",
    actorUserId:
      user.id,
    oldValues: {
      propertyId:
        existingRevenue.propertyId,
      ...(existingRevenue.leadId
        ? { leadId: existingRevenue.leadId }
        : {}),
      grossSaleAmount:
        toNumber(
          existingRevenue.grossSaleAmount,
        ),
      commissionAmount:
        toNumber(
          existingRevenue.commissionAmount,
        ),
      paymentReceived:
        toNumber(
          existingRevenue.paymentReceived,
        ),
      paymentStatus:
        existingRevenue.paymentStatus,
      commissionStatus:
        existingRevenue.commissionStatus,
    },
  });
}
