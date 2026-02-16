import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAllTools } from "./tools/index.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";

export async function startHttpServer(server: McpServer, port: number) {
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
      // SDK requires a fresh transport per stateless request
      const reqServer = new McpServer({ name: "yougile-mcp", version: "1.0.0" });
      registerAllTools(reqServer);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await reqServer.connect(transport);
      try {
        await transport.handleRequest(req, res);
      } finally {
        await transport.close();
        await reqServer.close();
      }
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: 57 }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use POST /mcp for MCP protocol." }));
    }
  });

  httpServer.listen(port, () => {
    console.error(`YouGile MCP server (HTTP) running at http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
}
