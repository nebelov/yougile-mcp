import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerChatTools(server: McpServer) {
  server.tool(
    "yougile_list_messages",
    "Get messages from a chat. For task chats, chatId = taskId. Also works for group chats.",
    {
      chatId: z.string().describe("Chat UUID (for task chats, this equals the task UUID)"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      text: z.string().optional().describe("Search by text content"),
      fromUserId: z.string().optional().describe("Filter by author user UUID"),
      since: z.number().optional().describe("Messages after this timestamp (ms)"),
    },
    async ({ chatId, ...params }) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.text) qp.text = params.text;
        if (params.fromUserId) qp.fromUserId = params.fromUserId;
        if (params.since) qp.since = params.since;
        const data = await yougileRequest<unknown>("GET", `chats/${chatId}/messages`, undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_send_message",
    "Send a message to a chat. For task chats, chatId = taskId. Also works for group chats.",
    {
      chatId: z.string().describe("Chat UUID (for task chats = task UUID)"),
      text: z.string().min(1).describe("Message text"),
    },
    async ({ chatId, text }) => {
      try {
        const data = await yougileRequest<unknown>("POST", `chats/${chatId}/messages`, { text });
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_message",
    "Get a specific message by ID from a chat.",
    {
      chatId: z.string().describe("Chat UUID"),
      messageId: z.string().describe("Message ID (timestamp long integer)"),
    },
    async ({ chatId, messageId }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `chats/${chatId}/messages/${messageId}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_delete_message",
    "Soft-delete a message. Note: editing message text is NOT supported by the API.",
    {
      chatId: z.string().describe("Chat UUID"),
      messageId: z.string().describe("Message ID (timestamp long integer)"),
    },
    async ({ chatId, messageId }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `chats/${chatId}/messages/${messageId}`, { deleted: true });
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_list_group_chats",
    "List all group chats in the company.",
    {
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      title: z.string().optional().describe("Filter by title"),
    },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.title) qp.title = params.title;
        const data = await yougileRequest<unknown>("GET", "group-chats", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_group_chat",
    "Get details of a specific group chat.",
    { id: z.string().describe("Group chat UUID") },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `group-chats/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_group_chat",
    "Create a group chat. Requires users map, userRoleMap, and roleConfigMap. Example: users={'userId': {notified: true}}, userRoleMap={'userId': 'admin'}, roleConfigMap={'admin': {notified: true}}.",
    {
      title: z.string().min(1).describe("Chat title"),
      users: z.record(z.object({ notified: z.boolean().default(true) })).describe("Map of userId -> {notified: bool}"),
      userRoleMap: z.record(z.enum(["admin", "user"])).describe("Map of userId -> role ('admin' or 'user')"),
      roleConfigMap: z.record(z.object({ notified: z.boolean().default(true) })).describe("Map of role -> config. E.g. {admin: {notified: true}}"),
    },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "group-chats", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_group_chat",
    "Update a group chat (title, users, or soft-delete).",
    {
      id: z.string().describe("Group chat UUID"),
      title: z.string().optional().describe("New title"),
      users: z.record(z.object({ notified: z.boolean().default(true) })).optional().describe("Replace users map"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `group-chats/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
