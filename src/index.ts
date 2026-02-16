#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import axios from "axios";

const API = process.env.YOUGILE_API_HOST_URL || "https://yougile.com/api-v2";
const args = process.argv.slice(2);
const isHttp = args.includes("--http");
const isSetup = args.includes("--setup");

if (isSetup) {
  const { runSetup } = await import("./setup.js");
  await runSetup();
  process.exit(0);
}

if (args.includes("--oauth")) {
  const { startOAuthServer } = await import("./oauth-server.js");
  await startOAuthServer();
  // Don't continue to stdio/http modes
  await new Promise(() => {}); // Keep process alive
}

// Auth: API key OR login+password (auto-gets key)
if (!process.env.YOUGILE_API_KEY) {
  const login = process.env.YOUGILE_LOGIN;
  const password = process.env.YOUGILE_PASSWORD;
  if (login && password) {
    try {
      console.error("Authenticating...");
      // Step 1: get companies
      const compRes = await axios.post(`${API}/auth/companies`, { login, password });
      const companies = Array.isArray(compRes.data) ? compRes.data : compRes.data?.content || [];
      if (!companies.length) throw new Error("No companies found for this account");
      const companyId = companies[0].id;
      console.error(`Company: ${companies[0].name}`);
      // Step 2: get/create API key
      const keyRes = await axios.post(`${API}/auth/keys`, { login, password, companyId });
      const key = typeof keyRes.data === "string" ? keyRes.data :
        Array.isArray(keyRes.data) ? keyRes.data[0] : keyRes.data?.key || keyRes.data;
      if (!key || typeof key !== "string") throw new Error("No API key returned");
      process.env.YOUGILE_API_KEY = key;
      console.error("OK!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const detail = (e as { response?: { data?: unknown } })?.response?.data;
      console.error(`Auth failed: ${msg}${detail ? " — " + JSON.stringify(detail) : ""}`);
      process.exit(1);
    }
  } else {
    console.error("ERROR: Set YOUGILE_API_KEY or YOUGILE_LOGIN + YOUGILE_PASSWORD");
    console.error("");
    console.error("  Option 1: YOUGILE_LOGIN=email YOUGILE_PASSWORD=pass npx @nebelov/yougile-mcp");
    console.error("  Option 2: YOUGILE_API_KEY=key npx @nebelov/yougile-mcp");
    console.error("  Option 3: npx @nebelov/yougile-mcp --setup");
    process.exit(1);
  }
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
