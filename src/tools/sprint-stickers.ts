import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerSprintStickerTools(server: McpServer) {
  server.tool(
    "yougile_list_sprint_stickers",
    "List sprint stickers (sprint/iteration labels for tasks). States are embedded in each sticker object.",
    {
      projectId: z.string().optional().describe("Filter by project UUID"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.projectId) qp.projectId = params.projectId;
        const data = await yougileRequest<unknown>("GET", "sprint-stickers", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_sprint_sticker",
    "Get a sprint sticker by ID. States are embedded in the response.",
    { id: z.string().describe("Sticker UUID") },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `sprint-stickers/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_sprint_sticker",
    "Create a sprint sticker. Use 'name' field (not 'title').",
    {
      name: z.string().min(1).describe("Sticker name"),
      projectId: z.string().describe("Project UUID"),
    },
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
      name: z.string().min(1).describe("State name"),
      color: z.string().optional().describe("State color"),
    },
    async ({ stickerId, ...body }) => {
      try {
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
      name: z.string().optional().describe("New state name"),
      color: z.string().optional().describe("New state color"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    async ({ stickerId, stateId, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `sprint-stickers/${stickerId}/states/${stateId}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
