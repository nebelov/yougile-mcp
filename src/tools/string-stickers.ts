import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerStringStickerTools(server: McpServer) {
  server.tool(
    "yougile_list_string_stickers",
    "List string stickers (custom labels/tags for tasks). States are embedded in each sticker object.",
    {
      projectId: z.string().optional().describe("Filter by project UUID"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.projectId) qp.projectId = params.projectId;
        const data = await yougileRequest<unknown>("GET", "string-stickers", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_string_sticker",
    "Get a string sticker by ID. States are embedded in the response.",
    { id: z.string().describe("Sticker UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `string-stickers/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_string_sticker",
    "Create a string sticker. Use 'name' field (not 'title').",
    {
      name: z.string().min(1).describe("Sticker name"),
      projectId: z.string().describe("Project UUID"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "string-stickers", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_string_sticker",
    "Update a string sticker (name or soft-delete). Use 'name' field (not 'title').",
    {
      id: z.string().describe("Sticker UUID"),
      name: z.string().optional().describe("New sticker name"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `string-stickers/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_string_sticker_state",
    "Create a state (option) for a string sticker.",
    {
      stickerId: z.string().describe("Parent sticker UUID"),
      name: z.string().min(1).describe("State name"),
      color: z.string().optional().describe("State color"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ stickerId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("POST", `string-stickers/${stickerId}/states`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_string_sticker_state",
    "Update a state of a string sticker. State IDs are 12-char hex strings.",
    {
      stickerId: z.string().describe("Parent sticker UUID"),
      stateId: z.string().describe("State ID (12-char hex)"),
      name: z.string().optional().describe("New state name"),
      color: z.string().optional().describe("New state color"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ stickerId, stateId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `string-stickers/${stickerId}/states/${stateId}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
