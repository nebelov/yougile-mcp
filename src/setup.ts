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

async function getCompanies(email: string, password: string): Promise<Array<{ id: string; name: string }>> {
  const res = await axios.post(`${API}/auth/companies`, { login: email, password });
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.content) return res.data.content;
  if (res.data?.id) return [res.data];
  return [];
}

async function getApiKey(email: string, password: string, companyId: string): Promise<string> {
  const res = await axios.post(`${API}/auth/keys`, { login: email, password, companyId });
  if (typeof res.data === "string") return res.data;
  if (Array.isArray(res.data)) return res.data[0];
  if (res.data?.key) return res.data.key;
  throw new Error("Unexpected response: " + JSON.stringify(res.data));
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
    const companies = await getCompanies(email, password);
    if (!companies.length) throw new Error("No companies found for this account.");
    const company = companies[0];
    console.error(`  Company: ${company.name}`);
    apiKey = await getApiKey(email, password, company.id);
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
