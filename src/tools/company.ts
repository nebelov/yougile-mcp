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
    "Update company settings (name, subdomain, etc.).",
    {
      name: z.string().optional().describe("Company name"),
      subdomain: z.string().optional().describe("Company subdomain"),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    async (params) => {
      try {
        const data = await yougileRequest<unknown>("PUT", "companies", params as Record<string, unknown>);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) { return err(e); }
    }
  );
}
