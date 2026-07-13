import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../permission/permission.middleware.js";
import {
  createLeadFollowUpSchema,
  leadFollowUpLeadParamsSchema,
  leadFollowUpParamsSchema,
  leadFollowUpQuerySchema,
  updateLeadFollowUpSchema,
} from "./lead-follow-up.schema.js";
import {
  createLeadFollowUpTask,
  deleteLeadFollowUpTask,
  getLeadFollowUpTaskById,
  listLeadFollowUpTasks,
  updateLeadFollowUpTask,
} from "./lead-follow-up.service.js";

type AuthenticatedUser = {
  id: string;
  role: string;
};

function getCurrentUser(request: { user?: unknown }) {
  return request.user as AuthenticatedUser;
}

export const leadFollowUpRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/leads/:leadId/follow-ups",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const params = leadFollowUpLeadParamsSchema.parse(request.params);
      const body = createLeadFollowUpSchema.parse(request.body);
      const task = await createLeadFollowUpTask(
        params.leadId,
        body,
        getCurrentUser(request),
      );

      return reply.code(201).send(task);
    },
  );

  app.get(
    "/follow-ups",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = leadFollowUpQuerySchema.parse(request.query);

      return listLeadFollowUpTasks(query, getCurrentUser(request));
    },
  );

  app.get(
    "/follow-ups/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadFollowUpParamsSchema.parse(request.params);

      return getLeadFollowUpTaskById(params.id, getCurrentUser(request));
    },
  );

  app.patch(
    "/follow-ups/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadFollowUpParamsSchema.parse(request.params);
      const body = updateLeadFollowUpSchema.parse(request.body);

      return updateLeadFollowUpTask(params.id, body, getCurrentUser(request));
    },
  );

  app.delete(
    "/follow-ups/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadFollowUpParamsSchema.parse(request.params);

      return deleteLeadFollowUpTask(params.id, getCurrentUser(request));
    },
  );
};
