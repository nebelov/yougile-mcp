# @nebelov/yougile-mcp

[![npm version](https://img.shields.io/npm/v/@nebelov/yougile-mcp.svg)](https://www.npmjs.com/package/@nebelov/yougile-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

MCP server for [YouGile](https://yougile.com) project management. **57 tools** covering 100% of YouGile API v2.

Works with **Claude**, **ChatGPT**, **Gemini CLI**, **VS Code**, **Cursor**, and any MCP-compatible client.

[README on Russian / README на русском](docs/README.ru.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/nebelov/yougile-mcp/main/assets/demo.gif" alt="AI autonomously creates a full project structure in YouGile via MCP" width="640">
  <br>
  <em>AI agent creates project, boards, columns, and tasks with rich descriptions — all via MCP</em>
</p>

## Quick Start

### Auto-setup (recommended)

```bash
npx @nebelov/yougile-mcp --setup
```

Logs you into YouGile, gets an API key, and writes the config for your AI tool.

### Manual setup

1. Get an API key from YouGile (Settings > API or `POST /auth/keys`)
2. Add to your AI tool config:

**Claude Code** (`~/.claude.json`):
```json
{
  "mcpServers": {
    "yougile": {
      "command": "npx",
      "args": ["-y", "@nebelov/yougile-mcp"],
      "env": { "YOUGILE_API_KEY": "your-key" }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "yougile": {
      "command": "npx",
      "args": ["-y", "@nebelov/yougile-mcp"],
      "env": { "YOUGILE_API_KEY": "your-key" }
    }
  }
}
```

**Gemini CLI** (`~/.gemini/settings.json`):
```json
{
  "mcpServers": {
    "yougile": {
      "command": "npx",
      "args": ["-y", "@nebelov/yougile-mcp"],
      "env": { "YOUGILE_API_KEY": "your-key" }
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):
```json
{
  "mcpServers": {
    "yougile": {
      "command": "npx",
      "args": ["-y", "@nebelov/yougile-mcp"],
      "env": { "YOUGILE_API_KEY": "your-key" }
    }
  }
}
```

## HTTP Mode (for ChatGPT)

```bash
YOUGILE_API_KEY=your-key npx @nebelov/yougile-mcp --http --port 3000
```

Then in ChatGPT: Settings > Apps > Create > enter `http://localhost:3000/mcp`

For remote access, use a tunnel:
```bash
ngrok http 3000
# Copy the https URL to ChatGPT
```

## Available Tools (57)

| Module | Tools | Description |
|--------|-------|-------------|
| projects | 4 | list, get, create, update |
| boards | 4 | list, get, create, update |
| columns | 4 | list, get, create, update |
| tasks | 6 | list, get, create, update, get/set chat-subscribers |
| chat | 8 | messages (list, send, get, delete) + group chats (list, get, create, update) |
| users | 5 | list, get, invite, update, delete |
| company | 2 | get, update |
| departments | 4 | list, get, create, update |
| project-roles | 5 | list, get, create, update, delete |
| string-stickers | 6 | CRUD + create/update state |
| sprint-stickers | 6 | CRUD + create/update state |
| webhooks | 3 | list, create, update |

## Bundled Skill

The package includes `skill/SKILL.md` — a best-practices guide for working with YouGile through AI. Copy it to your project or Claude Code skills directory for better task management.

## API Patterns

- **Soft delete**: `PUT {deleted: true}` works for all entities. `DELETE` method only works for project roles.
- **Pagination**: `{paging: {count, limit, offset, next}, content: [...]}`. Exception: `/webhooks` returns raw array.
- **Sticker fields**: Use `name` (not `title`) for stickers and states.
- **Task assigned**: Array of UUIDs `["uuid1", "uuid2"]`, not an object.
- **Chat messages**: `PUT` only supports `{deleted: true}` — editing text is not possible.
- **State IDs**: 12-char hex strings (not UUID).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUGILE_API_KEY` | Yes | YouGile API key |
| `YOUGILE_API_HOST_URL` | No | Custom API URL (default: `https://yougile.com/api-v2`) |

## Development

```bash
git clone https://github.com/nebelov/yougile-mcp
cd yougile-mcp
npm install
npm run dev
```

## License

MIT
