import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerColumnTools(server: McpServer) {
  server.tool(
    "yougile_list_columns",
    "List columns. Filter by boardId to see columns for a specific board.",
    {
      boardId: z.string().optional().describe("Filter by board UUID"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      title: z.string().optional().describe("Filter by title"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.boardId) qp.boardId = params.boardId;
        if (params.title) qp.title = params.title;
        const data = await yougileRequest<unknown>("GET", "columns", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_column",
    "Get details of a specific column by ID.",
    { id: z.string().describe("Column UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `columns/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_column",
    "Create a new column inside a board. Color is 1-16.",
    {
      title: z.string().min(1).describe("Column title"),
      boardId: z.string().describe("Parent board UUID"),
      color: z.number().int().min(1).max(16).optional().describe("Column color (1-16)"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "columns", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_column",
    "Update a column (title, color, move to another board, or soft-delete).",
    {
      id: z.string().describe("Column UUID"),
      title: z.string().optional().describe("New title"),
      boardId: z.string().optional().describe("Move to another board"),
      color: z.number().int().min(1).max(16).optional().describe("New color (1-16)"),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `columns/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
