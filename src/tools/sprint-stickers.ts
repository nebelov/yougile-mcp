import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerSprintStickerTools(server: McpServer) {
  server.tool(
    "yougile_list_sprint_stickers",
    "List sprint stickers (sprint/iteration labels for tasks). States are embedded in each sticker object.",
    {
      boardId: z.string().optional().describe("Only stickers enabled on this board"),
      name: z.string().optional().describe("Filter by sticker name"),
      includeDeleted: z.boolean().optional().describe("Include deleted stickers"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.boardId) qp.boardId = params.boardId;
        if (params.name) qp.name = params.name;
        if (params.includeDeleted !== undefined) qp.includeDeleted = params.includeDeleted;
        const data = await yougileRequest<unknown>("GET", "sprint-stickers", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_sprint_sticker",
    "Get a sprint sticker by ID. States are embedded in the response.",
    { id: z.string().describe("Sticker UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `sprint-stickers/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_sprint_sticker",
    "Create a sprint sticker (company-wide). Use 'name' field (not 'title'). Optionally pass initial sprint states.",
    {
      name: z.string().min(1).describe("Sticker name"),
      states: z.array(z.object({
        name: z.string().min(1).describe("Sprint name"),
        begin: z.number().optional().describe("Sprint start, Unix time in seconds"),
        end: z.number().optional().describe("Sprint end, Unix time in seconds"),
        deleted: z.boolean().optional(),
      })).optional().describe("Initial sprint states"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "sprint-stickers", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_sprint_sticker",
    "Update a sprint sticker (name or soft-delete). Use 'name' field (not 'title').",
    {
      id: z.string().describe("Sticker UUID"),
      name: z.string().optional().describe("New sticker name"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `sprint-stickers/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_sprint_sticker_state",
    "Create a state (option) for a sprint sticker.",
    {
      stickerId: z.string().describe("Parent sticker UUID"),
      name: z.string().min(1).describe("Sprint name"),
      begin: z.number().optional().describe("Sprint start, Unix time in seconds"),
      end: z.number().optional().describe("Sprint end, Unix time in seconds"),
      color: z.string().optional().describe("Not supported for sprint states; kept only to reject old calls explicitly"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ stickerId, color, ...body }) => {
      try {
        if (color !== undefined) return err(new Error("Sprint sticker states have no color in YouGile API v2; use begin/end"));
        const data = await yougileRequest<unknown>("POST", `sprint-stickers/${stickerId}/states`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_sprint_sticker_state",
    "Update a state of a sprint sticker. State IDs are 12-char hex strings.",
    {
      stickerId: z.string().describe("Parent sticker UUID"),
      stateId: z.string().describe("State ID (12-char hex)"),
      name: z.string().optional().describe("New sprint name"),
      begin: z.number().optional().describe("Sprint start, Unix time in seconds"),
      end: z.number().optional().describe("Sprint end, Unix time in seconds"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
      color: z.string().optional().describe("Not supported for sprint states; kept only to reject old calls explicitly"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ stickerId, stateId, color, ...body }) => {
      try {
        if (color !== undefined) return err(new Error("Sprint sticker states have no color in YouGile API v2; use begin/end"));
        const data = await yougileRequest<unknown>("PUT", `sprint-stickers/${stickerId}/states/${stateId}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
