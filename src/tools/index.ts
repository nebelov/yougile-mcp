import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProjectTools } from "./projects.js";
import { registerBoardTools } from "./boards.js";
import { registerColumnTools } from "./columns.js";
import { registerTaskTools } from "./tasks.js";
import { registerChatTools } from "./chat.js";
import { registerUserTools } from "./users.js";
import { registerCompanyTools } from "./company.js";
import { registerDepartmentTools } from "./departments.js";
import { registerProjectRoleTools } from "./project-roles.js";
import { registerStringStickerTools } from "./string-stickers.js";
import { registerSprintStickerTools } from "./sprint-stickers.js";
import { registerWebhookTools } from "./webhooks.js";

export function registerAllTools(server: McpServer) {
  registerProjectTools(server);
  registerBoardTools(server);
  registerColumnTools(server);
  registerTaskTools(server);
  registerChatTools(server);
  registerUserTools(server);
  registerCompanyTools(server);
  registerDepartmentTools(server);
  registerProjectRoleTools(server);
  registerStringStickerTools(server);
  registerSprintStickerTools(server);
  registerWebhookTools(server);
}
