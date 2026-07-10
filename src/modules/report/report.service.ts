import { prisma } from "../../lib/prisma.js";
import type { ReportQuery } from "./report.schema.js";

type CountRow = {
  count: bigint | number;
};

type GroupRow = {
  key: string | null;
  count: bigint | number;
};

type RevenueRow = {
  total: string | number | null;
  count: bigint | number;
};

function toNumber(value: bigint | number | string | null | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function buildBrokerDateFilter(query: ReportQuery, alias: string) {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (query.brokerId) {
    values.push(query.brokerId);
    filters.push(`${alias}."brokerId" = $${values.length}`);
  }

  if (query.dateFrom) {
    values.push(new Date(query.dateFrom));
    filters.push(`${alias}."createdAt" >= $${values.length}`);
  }

  if (query.dateTo) {
    values.push(new Date(query.dateTo));
    filters.push(`${alias}."createdAt" <= $${values.length}`);
  }

  return {
    sql: filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "",
    values,
  };
}

export async function getReportsSummary(query: ReportQuery) {
  const leadFilter = buildBrokerDateFilter(query, "l");
  const propertyFilter = buildBrokerDateFilter(query, "p");
  const viewingFilter = buildBrokerDateFilter(query, "v");
  const revenueFilter = buildBrokerDateFilter(query, "r");

  const [leadCountRows, propertyCountRows, viewingCountRows, revenueRows] =
    await Promise.all([
      prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*)::bigint AS count FROM "leads" l ${leadFilter.sql}`,
        ...leadFilter.values,
      ),
      prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*)::bigint AS count FROM "properties" p ${propertyFilter.sql}`,
        ...propertyFilter.values,
      ),
      prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*)::bigint AS count FROM "viewings" v ${viewingFilter.sql}`,
        ...viewingFilter.values,
      ),
      prisma.$queryRawUnsafe<RevenueRow[]>(
        `
        SELECT
          COALESCE(SUM(r."amount"), 0) AS total,
          COUNT(*)::bigint AS count
        FROM "revenues" r
        ${revenueFilter.sql}
        `,
        ...revenueFilter.values,
      ),
    ]);

  return {
    leads: {
      total: toNumber(leadCountRows[0]?.count),
    },
    properties: {
      total: toNumber(propertyCountRows[0]?.count),
    },
    viewings: {
      total: toNumber(viewingCountRows[0]?.count),
    },
    revenues: {
      totalAmount: toNumber(revenueRows[0]?.total),
      totalRecords: toNumber(revenueRows[0]?.count),
    },
  };
}

export async function getLeadSourceReport(query: ReportQuery) {
  const filter = buildBrokerDateFilter(query, "l");

  const rows = await prisma.$queryRawUnsafe<GroupRow[]>(
    `
    SELECT
      l."source"::text AS key,
      COUNT(*)::bigint AS count
    FROM "leads" l
    ${filter.sql}
    GROUP BY l."source"
    ORDER BY count DESC
    `,
    ...filter.values,
  );

  return rows.map((row) => ({
    source: row.key,
    count: toNumber(row.count),
  }));
}

export async function getLeadStatusReport(query: ReportQuery) {
  const filter = buildBrokerDateFilter(query, "l");

  const rows = await prisma.$queryRawUnsafe<GroupRow[]>(
    `
    SELECT
      l."status"::text AS key,
      COUNT(*)::bigint AS count
    FROM "leads" l
    ${filter.sql}
    GROUP BY l."status"
    ORDER BY count DESC
    `,
    ...filter.values,
  );

  return rows.map((row) => ({
    status: row.key,
    count: toNumber(row.count),
  }));
}

export async function getPropertyStatusReport(query: ReportQuery) {
  const filter = buildBrokerDateFilter(query, "p");

  const rows = await prisma.$queryRawUnsafe<GroupRow[]>(
    `
    SELECT
      p."status"::text AS key,
      COUNT(*)::bigint AS count
    FROM "properties" p
    ${filter.sql}
    GROUP BY p."status"
    ORDER BY count DESC
    `,
    ...filter.values,
  );

  return rows.map((row) => ({
    status: row.key,
    count: toNumber(row.count),
  }));
}

export async function getViewingStatusReport(query: ReportQuery) {
  const filter = buildBrokerDateFilter(query, "v");

  const rows = await prisma.$queryRawUnsafe<GroupRow[]>(
    `
    SELECT
      v."status"::text AS key,
      COUNT(*)::bigint AS count
    FROM "viewings" v
    ${filter.sql}
    GROUP BY v."status"
    ORDER BY count DESC
    `,
    ...filter.values,
  );

  return rows.map((row) => ({
    status: row.key,
    count: toNumber(row.count),
  }));
}

export async function getRevenueStatusReport(query: ReportQuery) {
  const filter = buildBrokerDateFilter(query, "r");

  const rows = await prisma.$queryRawUnsafe<GroupRow[]>(
    `
    SELECT
      r."paymentStatus"::text AS key,
      COUNT(*)::bigint AS count
    FROM "revenues" r
    ${filter.sql}
    GROUP BY r."paymentStatus"
    ORDER BY count DESC
    `,
    ...filter.values,
  );

  return rows.map((row) => ({
    paymentStatus: row.key,
    count: toNumber(row.count),
  }));
}
