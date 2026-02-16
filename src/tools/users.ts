import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerUserTools(server: McpServer) {
  server.tool(
    "yougile_list_users",
    "List all users (employees) in the company. Can filter by email or projectId.",
    {
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      email: z.string().optional().describe("Filter by email"),
      projectId: z.string().optional().describe("Filter by project UUID"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.email) qp.email = params.email;
        if (params.projectId) qp.projectId = params.projectId;
        const data = await yougileRequest<unknown>("GET", "users", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_user",
    "Get details of a specific user by ID.",
    { id: z.string().describe("User UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `users/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_invite_user",
    "Invite a user to the company by email.",
    {
      email: z.string().email().describe("User email to invite"),
      isAdmin: z.boolean().default(false).describe("Grant admin rights"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "users", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_user",
    "Update a user. Only supports changing admin status.",
    {
      id: z.string().describe("User UUID"),
      isAdmin: z.boolean().describe("Grant or revoke admin rights"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `users/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_delete_user",
    "Remove a user from the company.",
    { id: z.string().describe("User UUID") },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("DELETE", `users/${id}`);
        return ok(JSON.stringify(data ?? "Deleted", null, 2));
      } catch (e) { return err(e); }
    }
  );
}
