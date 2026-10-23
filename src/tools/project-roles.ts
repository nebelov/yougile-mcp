import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

const yes = z.boolean();
const taskPermissions = z.object({
  show: yes, delete: yes, editTitle: yes, editDescription: yes, complete: yes, close: yes,
  assignUsers: z.enum(["no", "yes", "add-self", "set-self", "change-from-self"]),
  connect: yes,
  editSubtasks: z.enum(["no", "yes", "complete"]),
  editStickers: yes, editPins: yes,
  move: z.enum(["no", "project", "yes", "board"]),
  sendMessages: yes, sendFiles: yes,
  editWhoToNotify: z.enum(["no", "yes", "self"]),
});
const columnPermissions = z.object({
  editTitle: yes, delete: yes,
  move: z.enum(["no", "project", "yes"]),
  addTask: yes,
  allTasks: taskPermissions, withMeTasks: taskPermissions, myTasks: taskPermissions, createdByMeTasks: taskPermissions,
});
const boardPermissions = z.object({
  editTitle: yes, delete: yes, move: yes, showStickers: yes, editStickers: yes, addColumn: yes,
  columns: columnPermissions, settings: yes,
});
const projectPermissions = z.object({
  editTitle: yes,
  delete: yes,
  addBoard: yes,
  boards: boardPermissions,
  children: z.record(z.discriminatedUnion("type", [
    z.object({ type: z.literal("board"), permissions: boardPermissions }),
    z.object({ type: z.literal("column"), permissions: columnPermissions }),
    z.object({ type: z.literal("task"), permissions: taskPermissions }),
  ])).optional().describe("Per-object overrides: { objectId: { type, permissions } }"),
}).describe("Project permissions (ProjectPermissionsDto of YouGile API v2)");

export function registerProjectRoleTools(server: McpServer) {
  server.tool(
    "yougile_list_project_roles",
    "List roles for a project.",
    {
      projectId: z.string().describe("Project UUID"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ projectId, roleId }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `projects/${projectId}/roles/${roleId}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_project_role",
    "Create a new role in a project. Assign users to a role via yougile_update_project (users: { userId: roleId }).",
    {
      projectId: z.string().describe("Project UUID"),
      name: z.string().min(1).describe("Role name"),
      description: z.string().optional().describe("Role description"),
      permissions: projectPermissions,
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ projectId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("POST", `projects/${projectId}/roles`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_project_role",
    "Update a project role (name, description, permissions).",
    {
      projectId: z.string().describe("Project UUID"),
      roleId: z.string().describe("Role UUID"),
      name: z.string().optional().describe("New role name"),
      description: z.string().optional().describe("New role description"),
      permissions: projectPermissions.optional(),
      users: z.array(z.string()).optional().describe("Not supported: assign roles via yougile_update_project (users: { userId: roleId })"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ projectId, roleId, users, ...body }) => {
      try {
        if (users !== undefined) return err(new Error("Roles have no users field in YouGile API v2; assign via yougile_update_project with users: { userId: roleId }"));
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
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ projectId, roleId }) => {
      try {
        const data = await yougileRequest<unknown>("DELETE", `projects/${projectId}/roles/${roleId}`);
        return ok(JSON.stringify(data ?? "Deleted", null, 2));
      } catch (e) { return err(e); }
    }
  );
}
