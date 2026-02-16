import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

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
      event: z.string().describe("Event type to listen for"),
      projectId: z.string().optional().describe("Scope to a specific project UUID"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "webhooks", params as Record<string, unknown>);
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
