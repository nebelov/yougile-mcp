import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

const boardStickers = z.object({
  timer: z.boolean().optional(),
  deadline: z.boolean().optional(),
  stopwatch: z.boolean().optional(),
  timeTracking: z.boolean().optional(),
  assignee: z.boolean().optional(),
  repeat: z.boolean().optional(),
  custom: z.record(z.string(), z.boolean()).optional().describe("Custom stickers: { stickerUUID: true } to show, false to hide"),
}).describe("Stickers enabled on the board");

export function registerBoardTools(server: McpServer) {
  server.tool(
    "yougile_list_boards",
    "List boards. Filter by projectId to see boards for a specific project.",
    {
      projectId: z.string().optional().describe("Filter by project UUID"),
      limit: z.number().int().min(1).max(1000).default(50).describe("Max results"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      title: z.string().optional().describe("Filter by title"),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const qp: Record<string, string | number | boolean> = { limit: params.limit, offset: params.offset };
        if (params.projectId) qp.projectId = params.projectId;
        if (params.title) qp.title = params.title;
        const data = await yougileRequest<unknown>("GET", "boards", undefined, qp);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_get_board",
    "Get details of a specific board by ID.",
    { id: z.string().describe("Board UUID") },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ id }) => {
      try {
        const data = await yougileRequest<unknown>("GET", `boards/${id}`);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_create_board",
    "Create a new board inside a project.",
    {
      title: z.string().min(1).describe("Board title"),
      projectId: z.string().describe("Parent project UUID"),
      stickers: boardStickers.optional(),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("POST", "boards", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_board",
    "Update a board (title, stickers, move to another project, or soft-delete).",
    {
      id: z.string().describe("Board UUID"),
      title: z.string().optional().describe("New title"),
      projectId: z.string().optional().describe("Move board to this project UUID"),
      stickers: boardStickers.optional(),
      deleted: z.boolean().optional().describe("true to soft-delete"),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    async ({ id, ...body }) => {
      try {
        const data = await yougileRequest<unknown>("PUT", `boards/${id}`, body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
