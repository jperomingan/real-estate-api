import type { ReportQuery } from "./report.schema.js";
import {
  getLeadSourceReport,
  getLeadStatusReport,
  getPropertyStatusReport,
  getReportsSummary,
  getRevenueStatusReport,
  getViewingStatusReport,
} from "./report.service.js";

type CsvValue = string | number | boolean | null | undefined;

type CsvRow = Record<string, CsvValue>;

function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function buildCsv(headers: string[], rows: CsvRow[]) {
  const headerLine = headers.map(escapeCsvValue).join(",");

  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );

  return [headerLine, ...bodyLines].join("\n");
}

export async function exportReportsSummaryCsv(query: ReportQuery) {
  const summary = await getReportsSummary(query);

  return buildCsv(["metric", "value"], [
    {
      metric: "leads.total",
      value: summary.leads.total,
    },
    {
      metric: "properties.total",
      value: summary.properties.total,
    },
    {
      metric: "viewings.total",
      value: summary.viewings.total,
    },
    {
      metric: "revenues.totalAmount",
      value: summary.revenues.totalAmount,
    },
    {
      metric: "revenues.totalRecords",
      value: summary.revenues.totalRecords,
    },
  ]);
}

export async function exportLeadSourcesCsv(query: ReportQuery) {
  const rows = await getLeadSourceReport(query);

  return buildCsv(["source", "count"], rows);
}

export async function exportLeadStatusesCsv(query: ReportQuery) {
  const rows = await getLeadStatusReport(query);

  return buildCsv(["status", "count"], rows);
}

export async function exportPropertyStatusesCsv(query: ReportQuery) {
  const rows = await getPropertyStatusReport(query);

  return buildCsv(["status", "count"], rows);
}

export async function exportViewingStatusesCsv(query: ReportQuery) {
  const rows = await getViewingStatusReport(query);

  return buildCsv(["status", "count"], rows);
}

export async function exportRevenueStatusesCsv(query: ReportQuery) {
  const rows = await getRevenueStatusReport(query);

  return buildCsv(["paymentStatus", "count"], rows);
}
