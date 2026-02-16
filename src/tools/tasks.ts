import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerTaskTools(server: McpServer) {
  server.tool(
    "yougile_list_tasks",
    "List tasks with filters. Use columnId to get tasks from a specific column, or assignedTo/stickerId/title for advanced filtering. Uses /task-list read-only endpoint (supports more filters than /tasks).",
    {
      columnId: z.string().optional().describe("Filter by column UUID"),
      assignedTo: z.string().optional().describe("Filter by assigned user IDs (comma-separated)"),
      stickerId: z.string().optional().describe("Filter by sticker UUID"),
      title: z.string().optional().describe("Filter by title substring"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.columnId) qp.columnId = params.columnId;
        if (params.assignedTo) qp.assignedTo = params.assignedTo;
        if (params.stickerId) qp.stickerId = params.stickerId;
        if (params.title) qp.title = params.title;
        const data = await yougileRequest<unknown>("GET", "task-list", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_task",
    "Get full details of a task: title, description, assigned users, deadline, checklists, stickers, time tracking, etc.",
    { id: z.string().describe("Task UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `tasks/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_task",
    `Create a new task in a column. Supports: title, description, assigned users, deadline (timestamp ms), checklists, color (task-primary/gray/red/pink/yellow/green/turquoise/blue/violet), time tracking, stickers.`,
    {
      title: z.string().min(1).describe("Task title"),
      columnId: z.string().describe("Column UUID to place the task in"),
      description: z.string().optional().describe("Task description (markdown supported)"),
      assigned: z.array(z.string()).optional().describe("Array of user UUIDs to assign"),
      deadline: z.object({
        deadline: z.number().describe("Deadline timestamp in ms"),
        startDate: z.number().optional().describe("Start date timestamp in ms"),
        withTime: z.boolean().optional().describe("Include time in deadline"),
      }).optional().describe("Deadline settings"),
      checklists: z.array(z.object({
        title: z.string(),
        items: z.array(z.object({
          title: z.string(),
          isCompleted: z.boolean().default(false),
        })),
      })).optional().describe("Checklists with items"),
      color: z.string().optional().describe("Task color: task-primary|gray|red|pink|yellow|green|turquoise|blue|violet"),
      timeTracking: z.object({
        plan: z.number().optional().describe("Planned hours"),
        work: z.number().optional().describe("Worked hours"),
      }).optional().describe("Time tracking"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "tasks", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_task",
    `Update a task. Can change: title, description, columnId (move), assigned, completed, archived, deadline, checklists, color, timeTracking, stickers. To delete deadline/timer: pass { deleted: true } inside that field. To soft-delete task: set deleted=true.`,
    {
      id: z.string().describe("Task UUID"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      columnId: z.string().optional().describe("Move to column UUID"),
      assigned: z.array(z.string()).optional().describe("New assigned user UUIDs"),
      completed: z.boolean().optional().describe("Mark as completed"),
      archived: z.boolean().optional().describe("Archive task"),
      deleted: z.boolean().optional().describe("Soft-delete task"),
      deadline: z.union([
        z.object({
          deadline: z.number(),
          startDate: z.number().optional(),
          withTime: z.boolean().optional(),
        }),
        z.object({ deleted: z.literal(true) }),
      ]).optional().describe("Set or remove deadline"),
      color: z.string().optional().describe("Task color"),
      checklists: z.array(z.object({
        title: z.string(),
        items: z.array(z.object({
          title: z.string(),
          isCompleted: z.boolean().default(false),
        })),
      })).optional().describe("Replace checklists"),
      timeTracking: z.union([
        z.object({ plan: z.number().optional(), work: z.number().optional() }),
        z.object({ deleted: z.literal(true) }),
      ]).optional().describe("Set or remove time tracking"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `tasks/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_chat_subscribers",
    "Get the list of users subscribed to a task's chat notifications.",
    { taskId: z.string().describe("Task UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ taskId }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `tasks/${taskId}/chat-subscribers`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_set_chat_subscribers",
    "Set the list of users subscribed to a task's chat notifications. Replaces existing list.",
    {
      taskId: z.string().describe("Task UUID"),
      userIds: z.array(z.string()).describe("Array of user UUIDs to subscribe"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ taskId, userIds }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `tasks/${taskId}/chat-subscribers`, userIds as unknown[]);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
