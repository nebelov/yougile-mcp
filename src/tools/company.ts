import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { yougileRequest, ok, err } from "../services/api.js";

export function registerCompanyTools(server: McpServer) {
  server.tool(
    "yougile_get_company",
    "Get current company information.",
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async () => {
      try {
        const data = await yougileRequest<unknown>("GET", "companies");
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );

  server.tool(
    "yougile_update_company",
    "Update company settings (title or configurator data).",
    {
      title: z.string().optional().describe("Company name"),
      name: z.string().optional().describe("Deprecated alias of title"),
      apiData: z.record(z.string(), z.unknown()).optional().describe("Configurator data object"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async ({ name, ...params }) => {
      try {
        const body = { ...params, ...(params.title === undefined && name !== undefined ? { title: name } : {}) };
        if (Object.keys(body).length === 0) return err(new Error("Nothing to update: pass title or apiData"));
        const data = await yougileRequest<unknown>("PUT", "companies", body as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
