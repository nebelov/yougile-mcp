import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

const webhookFilters = z.array(z.discriminatedUnion("name", [
  z.object({ name: z.literal("location"), value: z.union([z.string(), z.array(z.string())]).describe("Project/board/column UUID or list of UUIDs") }),
  z.object({ name: z.literal("title"), value: z.string().describe("Regexp for the object title") }),
  z.object({ name: z.literal("chat_message"), value: z.string().describe("Regexp for the chat message text") }),
]));

export function registerWebhookTools(server: McpServer) {
  server.tool(
    "yougile_list_webhooks",
    "List all webhooks. Note: returns a raw array (no paging wrapper).",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async () => {
      try {
        const data = await yougileRequest<unknown>("GET", "webhooks");
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_webhook",
    "Create a webhook to receive events at a URL.",
    {
      url: z.string().url().describe("Webhook callback URL (HTTPS recommended)"),
      event: z.string().describe("Event, format <object>-<event>, e.g. task-created, task-moved, chat_message-created, or .* for all"),
      filters: webhookFilters.optional().describe("Optional filters, e.g. [{ name: 'location', value: ['<projectOrBoardUUID>'] }]; empty list if omitted"),
      projectId: z.string().optional().describe("Deprecated: converted to a location filter for this project"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async ({ filters, projectId, ...params }) => {
      try {
        const all = [...(filters ?? [])];
        if (projectId) all.push({ name: "location", value: [projectId] });
        const data = await yougileRequest<unknown>("POST", "webhooks", { ...params, filters: all } as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_webhook",
    "Update a webhook (url, event, disabled, or soft-delete).",
    {
      id: z.string().describe("Webhook UUID"),
      url: z.string().url().optional().describe("New callback URL"),
      event: z.string().optional().describe("New event type"),
      filters: webhookFilters.optional().describe("Replace filters"),
      disabled: z.boolean().optional().describe("Disable/enable webhook"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `webhooks/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
