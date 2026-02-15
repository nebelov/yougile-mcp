import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerProjectTools(server: McpServer) {
  server.tool(
    "yougile_list_projects",
    "List all projects in the YouGile company. Returns project names, IDs, and user roles.",
    {
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      title: z.string().optional().describe("Filter by title substring"),
    },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.title) qp.title = params.title;
        const data = await yougileRequest<{ content: unknown[]; paging: unknown }>("GET", "projects", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_project",
    "Get details of a specific project by ID.",
    { id: z.string().describe("Project UUID") },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `projects/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_project",
    "Create a new project. Optionally assign users with roles (admin/worker/observer).",
    {
      title: z.string().min(1).describe("Project title"),
      users: z.record(z.string()).optional().describe("Map of userId -> role (admin|worker|observer)"),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { title: params.title };
        if (params.users) body.users = params.users;
        const data = await yougileRequest<unknown>("POST", "projects", body);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_project",
    "Update a project (title, users, or soft-delete). Use '-' as role value to remove a user.",
    {
      id: z.string().describe("Project UUID"),
      title: z.string().optional().describe("New title"),
      users: z.record(z.string()).optional().describe("userId -> role map. '-' removes user."),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `projects/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
