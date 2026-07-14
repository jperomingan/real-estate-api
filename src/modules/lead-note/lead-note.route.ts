import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../permission/permission.middleware.js";
import {
  createLeadNoteSchema,
  leadNoteLeadParamsSchema,
  leadNoteParamsSchema,
  leadNoteQuerySchema,
  updateLeadNoteSchema,
} from "./lead-note.schema.js";
import {
  createLeadNote,
  deleteLeadNote,
  getLeadNoteById,
  listLeadNotes,
  updateLeadNote,
} from "./lead-note.service.js";

type AuthenticatedUser = {
  id: string;
  role: string;
};

function getCurrentUser(request: { user?: unknown }) {
  return request.user as AuthenticatedUser;
}

export const leadNoteRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/leads/:leadId/notes",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request, reply) => {
      const params = leadNoteLeadParamsSchema.parse(request.params);
      const body = createLeadNoteSchema.parse(request.body);

      const note = await createLeadNote(
        params.leadId,
        body,
        getCurrentUser(request),
      );

      return reply.code(201).send(note);
    },
  );

  app.get(
    "/lead-notes",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const query = leadNoteQuerySchema.parse(request.query);

      return listLeadNotes(query, getCurrentUser(request));
    },
  );

  app.get(
    "/lead-notes/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadNoteParamsSchema.parse(request.params);

      return getLeadNoteById(params.id, getCurrentUser(request));
    },
  );

  app.patch(
    "/lead-notes/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadNoteParamsSchema.parse(request.params);
      const body = updateLeadNoteSchema.parse(request.body);

      return updateLeadNote(params.id, body, getCurrentUser(request));
    },
  );

  app.delete(
    "/lead-notes/:id",
    {
      preHandler: [requirePermission("VIEW_DASHBOARD")],
    },
    async (request) => {
      const params = leadNoteParamsSchema.parse(request.params);

      return deleteLeadNote(params.id, getCurrentUser(request));
    },
  );
};
