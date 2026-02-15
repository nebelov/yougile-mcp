import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";

export async function startHttpServer(server: McpServer, port: number) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

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
      await transport.handleRequest(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: 57 }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use POST /mcp for MCP protocol." }));
    }
  });

  await server.connect(transport);

  httpServer.listen(port, () => {
    console.error(`YouGile MCP server (HTTP) running at http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
  });
}
