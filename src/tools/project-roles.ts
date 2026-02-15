import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerProjectRoleTools(server: McpServer) {
  server.tool(
    "yougile_list_project_roles",
    "List roles for a project.",
    {
      projectId: z.string().describe("Project UUID"),
    },
    async ({ projectId }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `projects/${projectId}/roles`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_project_role",
    "Get a specific role in a project.",
    {
      projectId: z.string().describe("Project UUID"),
      roleId: z.string().describe("Role UUID"),
    },
    async ({ projectId, roleId }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `projects/${projectId}/roles/${roleId}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_project_role",
    "Create a new role in a project.",
    {
      projectId: z.string().describe("Project UUID"),
      name: z.string().min(1).describe("Role name"),
      users: z.array(z.string()).optional().describe("User UUIDs to assign this role"),
    },
    async ({ projectId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("POST", `projects/${projectId}/roles`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_project_role",
    "Update a project role (name, users).",
    {
      projectId: z.string().describe("Project UUID"),
      roleId: z.string().describe("Role UUID"),
      name: z.string().optional().describe("New role name"),
      users: z.array(z.string()).optional().describe("Replace user list"),
    },
    async ({ projectId, roleId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `projects/${projectId}/roles/${roleId}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_delete_project_role",
    "Delete a project role (hard delete, not soft-delete).",
    {
      projectId: z.string().describe("Project UUID"),
      roleId: z.string().describe("Role UUID"),
    },
    async ({ projectId, roleId }) => {
      try {
        const data = await yougileRequest<unknown>("DELETE", `projects/${projectId}/roles/${roleId}`);
        return ok(JSON.stringify(data ?? "Deleted", null, 2));
      } catch (e) { return err(e); }
    }
  );
}
