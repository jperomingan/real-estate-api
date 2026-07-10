import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../permission/permission.middleware.js";
import {
  getLeadSourceReport,
  getLeadStatusReport,
  getPropertyStatusReport,
  getReportsSummary,
  getRevenueStatusReport,
  getViewingStatusReport,
} from "./report.service.js";
import { reportQuerySchema } from "./report.schema.js";

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
};
