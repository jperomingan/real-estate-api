import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { requirePermission } from "../permission/permission.middleware.js";
import {
  getLeadSourceReport,
  getLeadStatusReport,
  getPropertyStatusReport,
  getReportsSummary,
  getRevenueStatusReport,
  getViewingStatusReport,
} from "./report.service.js";
import {
  exportLeadSourcesCsv,
  exportLeadStatusesCsv,
  exportPropertyStatusesCsv,
  exportReportsSummaryCsv,
  exportRevenueStatusesCsv,
  exportViewingStatusesCsv,
} from "./report-export.service.js";
import { reportQuerySchema } from "./report.schema.js";

function sendCsv(reply: FastifyReply, filename: string, csv: string) {
  return reply
    .header("Content-Type", "text/csv; charset=utf-8")
    .header("Content-Disposition", `attachment; filename="${filename}"`)
    .send(csv);
}

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/summary",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getReportsSummary(query);
    },
  );

  app.get(
    "/leads/sources",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getLeadSourceReport(query);
    },
  );

  app.get(
    "/leads/statuses",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getLeadStatusReport(query);
    },
  );

  app.get(
    "/properties/statuses",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getPropertyStatusReport(query);
    },
  );

  app.get(
    "/viewings/statuses",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getViewingStatusReport(query);
    },
  );

  app.get(
    "/revenues/statuses",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = reportQuerySchema.parse(request.query);

      return getRevenueStatusReport(query);
    },
  );

  app.get(
    "/export/summary.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportReportsSummaryCsv(query);

      return sendCsv(reply, "reports-summary.csv", csv);
    },
  );

  app.get(
    "/export/leads-sources.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportLeadSourcesCsv(query);

      return sendCsv(reply, "reports-leads-sources.csv", csv);
    },
  );

  app.get(
    "/export/leads-statuses.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportLeadStatusesCsv(query);

      return sendCsv(reply, "reports-leads-statuses.csv", csv);
    },
  );

  app.get(
    "/export/properties-statuses.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportPropertyStatusesCsv(query);

      return sendCsv(reply, "reports-properties-statuses.csv", csv);
    },
  );

  app.get(
    "/export/viewings-statuses.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportViewingStatusesCsv(query);

      return sendCsv(reply, "reports-viewings-statuses.csv", csv);
    },
  );

  app.get(
    "/export/revenues-statuses.csv",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const query = reportQuerySchema.parse(request.query);
      const csv = await exportRevenueStatusesCsv(query);

      return sendCsv(reply, "reports-revenues-statuses.csv", csv);
    },
  );
};
