#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";

const args = process.argv.slice(2);
const isHttp = args.includes("--http");
const isSetup = args.includes("--setup");

if (isSetup) {
  const { runSetup } = await import("./setup.js");
  await runSetup();
  process.exit(0);
}

if (!process.env.YOUGILE_API_KEY) {
  console.error("ERROR: YOUGILE_API_KEY environment variable is required.");
  console.error("");
  console.error("Quick start:");
  console.error("  1. Run: npx @nebelov/yougile-mcp --setup");
  console.error("  2. Or set manually: export YOUGILE_API_KEY=your-key");
  console.error("");
  console.error("Get API key: POST https://yougile.com/api-v2/auth/keys");
  process.exit(1);
}

const server = new McpServer({
  name: "yougile-mcp",
  version: "1.0.0",
});

registerAllTools(server);

if (isHttp) {
  const portArg = args[args.indexOf("--port") + 1];
  const port = portArg ? parseInt(portArg, 10) : 3000;
  const { startHttpServer } = await import("./http.js");
  await startHttpServer(server, port);
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
