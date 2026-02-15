import { createInterface } from "node:readline";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import axios from "axios";

const API = "https://yougile.com/api-v2";

function rl() {
  return createInterface({ input: process.stdin, output: process.stderr });
}

async function ask(prompt: string, hide = false): Promise<string> {
  return new Promise((resolve) => {
    const r = rl();
    if (hide) process.stderr.write(prompt);
    r.question(hide ? "" : prompt, (answer) => {
      r.close();
      resolve(answer.trim());
    });
  });
}

async function getApiKey(email: string, password: string): Promise<string[]> {
  // Step 1: Get auth token (login)
  const loginRes = await axios.post(`${API}/auth/keys`, { login: email, password });
  if (typeof loginRes.data === "string") return [loginRes.data];
  if (Array.isArray(loginRes.data)) return loginRes.data;
  if (loginRes.data?.key) return [loginRes.data.key];
  throw new Error("Unexpected response from auth/keys: " + JSON.stringify(loginRes.data));
}

async function getCompanies(token: string): Promise<Array<{ id: string; name: string }>> {
  const res = await axios.get(`${API}/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Response can be a single company object or list
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.content) return res.data.content;
  if (res.data?.id) return [res.data];
  return [{ id: "unknown", name: "Your Company" }];
}

type ConfigTarget = "claude-code" | "claude-desktop" | "gemini" | "vscode" | "print";

function getConfigPath(target: ConfigTarget): string | null {
  const home = homedir();
  switch (target) {
    case "claude-code":
      return join(home, ".claude.json");
    case "claude-desktop": {
      const darwin = join(home, "Library/Application Support/Claude/claude_desktop_config.json");
      const win = join(home, "AppData/Roaming/Claude/claude_desktop_config.json");
      if (existsSync(darwin)) return darwin;
      if (existsSync(win)) return win;
      return darwin; // default to macOS path
    }
    case "gemini":
      return join(home, ".gemini/settings.json");
    case "vscode":
      return join(".vscode", "mcp.json");
    case "print":
      return null;
  }
}

function addMcpConfig(filePath: string, apiKey: string) {
  let config: Record<string, unknown> = {};
  if (existsSync(filePath)) {
    try {
      config = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      // If file is corrupt, start fresh
    }
  }

  const mcpServers = (config.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers.yougile = {
    command: "npx",
    args: ["-y", "@nebelov/yougile-mcp"],
    env: { YOUGILE_API_KEY: apiKey },
  };
  config.mcpServers = mcpServers;

  writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n");
}

export async function runSetup() {
  console.error("");
  console.error("  YouGile MCP — Setup");
  console.error("  ───────────────────");
  console.error("");

  const email = await ask("  Email: ");
  const password = await ask("  Password: ", true);
  console.error("");

  let apiKey: string;
  try {
    console.error("  Authenticating...");
    const keys = await getApiKey(email, password);
    apiKey = keys[0];
    console.error("  API key obtained!");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("401") || msg.includes("403")) {
      console.error("  Error: Invalid email or password.");
    } else {
      console.error(`  Error: ${msg}`);
    }
    process.exit(1);
  }

  try {
    const companies = await getCompanies(apiKey);
    if (companies.length > 0) {
      console.error(`  Company: ${companies[0].name}`);
    }
  } catch {
    // Non-critical
  }

  console.error("");
  console.error("  Where to add config?");
  console.error("    1. Claude Code (~/.claude.json)");
  console.error("    2. Claude Desktop");
  console.error("    3. Gemini CLI (~/.gemini/settings.json)");
  console.error("    4. VS Code (.vscode/mcp.json)");
  console.error("    5. Print config (I'll add manually)");
  console.error("");

  const choice = await ask("  Select [1]: ");
  const targets: ConfigTarget[] = ["claude-code", "claude-desktop", "gemini", "vscode", "print"];
  const target = targets[parseInt(choice || "1", 10) - 1] || "claude-code";

  if (target === "print") {
    console.error("");
    console.error("  Add this to your MCP config:");
    console.error("");
    const config = {
      yougile: {
        command: "npx",
        args: ["-y", "@nebelov/yougile-mcp"],
        env: { YOUGILE_API_KEY: apiKey },
      },
    };
    // Output to stdout so it can be piped
    process.stdout.write(JSON.stringify(config, null, 2) + "\n");
  } else {
    const filePath = getConfigPath(target);
    if (filePath) {
      addMcpConfig(filePath, apiKey);
      console.error(`  Config updated: ${filePath}`);
    }
  }

  console.error("");
  console.error("  Done! Restart your AI tool to use YouGile.");
  console.error("");
}
