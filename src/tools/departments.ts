import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerDepartmentTools(server: McpServer) {
  server.tool(
    "yougile_list_departments",
    "List all departments in the company.",
    {
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        const data = await yougileRequest<unknown>("GET", "departments", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_department",
    "Get details of a specific department.",
    { id: z.string().describe("Department UUID") },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `departments/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_department",
    "Create a new department.",
    {
      title: z.string().min(1).describe("Department name"),
      users: z.array(z.string()).optional().describe("Array of user UUIDs to add"),
    },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "departments", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_department",
    "Update a department (title, users, or soft-delete).",
    {
      id: z.string().describe("Department UUID"),
      title: z.string().optional().describe("New name"),
      users: z.array(z.string()).optional().describe("Replace user list"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `departments/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
