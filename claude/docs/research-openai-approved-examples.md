# Research: OpenAI ChatGPT Apps Directory - Approved Connectors & Submission Guidelines

**Date:** 2026-02-16
**Research scope:** ChatGPT App Directory, MCP connectors, submission requirements, OAuth flows, approved examples

---

## Executive Summary

OpenAI launched the ChatGPT App Store on **December 18, 2025**, enabling developers to submit MCP-based apps for publication in the ChatGPT Apps Directory. The ecosystem now includes 50+ approved connectors from major vendors (Atlassian, Monday.com, Linear, Adobe, Stripe, etc.). Key requirements include OAuth 2.1 with PKCE, clear privacy policies, and compliance with strict app submission guidelines.

---

## 1. Approved Project Management Connectors

### 1.1 Currently Available Connectors (as of Feb 2026)

| Connector | Description | MCP URL | Status |
|-----------|-------------|---------|--------|
| **Atlassian Rovo** | Summarize and search Jira/Confluence, create/update issues | `https://mcp.atlassian.com/v1/sse` | Approved |
| **Monday.com** | Manage projects, gain insights, automate workflows | `https://mcp.monday.com/mcp` | Approved |
| **Linear** | Find and reference issues and projects | `https://api.linear.app` | Approved |
| **HubSpot** | Analyze CRM data and surface insights | `https://mcp.hubspot.com/openai` | Approved |
| **Notion** | Search and reference Notion pages | `https://mcp.notion.com/mcp` | Approved |
| **GitHub** | Access repositories, issues, pull requests | Native | Approved |
| **Asana** | Plan, create, update work from chat | Native Sync | Approved |

### 1.2 Example Connector Descriptions (Patterns That Get Approved)

**Atlassian Rovo:**
> "Summarize and search Jira and Confluence content, create and update issues or pages, and bulk process tasks"

**Monday.com:**
> "Manage projects, gain insights, and automate workflows within monday.com"

**Linear:**
> "Find and reference issues and projects"

**Key patterns in approved descriptions:**
1. **Action-oriented** - Start with verbs (Search, Create, Manage, Find)
2. **Specific functionality** - List exact capabilities
3. **Platform reference** - Mention the target platform name
4. **Brevity** - Under 100 characters preferred
5. **No marketing speak** - No "best", "official", "amazing"

---

## 2. App Submission Guidelines (Official OpenAI)

### 2.1 Submission Requirements

| Requirement | Details |
|-------------|---------|
| **App name** | Max 100 characters, avoid generic single-word terms |
| **Description** | Clear, accurate, action-oriented |
| **Icon** | 512x512 PNG |
| **Screenshots** | 3-5 examples, accurate representation |
| **Privacy Policy URL** | Required, must be publicly accessible |
| **Support email** | Required for user contact |
| **Company/Developer info** | Verified organization required |
| **MCP URL** | Publicly accessible HTTPS endpoint |
| **OAuth metadata** | If using OAuth |
| **Country availability** | Settings for regional restrictions |

### 2.2 Technical Requirements

```
MCP Server Requirements:
- Hosted on publicly accessible domain
- Not using local/testing endpoints
- CSP defined to allow exact fetch domains
- For EU data residency: NOT SUPPORTED currently
```

### 2.3 Tool Annotations (Critical for Approval)

```javascript
// Example tool annotations
{
  name: "create_task",
  title: "Create Task",
  description: "Create a new task in the specified project. Use this when the user wants to add a new work item.",
  annotations: {
    readOnlyHint: false,      // Required for write operations
    destructiveHint: false,   // true if deletes/overwrites data
    openWorldHint: true       // true if publishes externally
  }
}
```

**Annotation rules:**
- `readOnlyHint: true` - Only for tools that retrieve data without modifications
- `destructiveHint: true` - Required for delete/overwrite operations
- `openWorldHint: true` - Required for external publish/send operations

### 2.4 Tool Name & Description Best Practices

**Tool names:**
```
GOOD:
- get_task_status
- create_project
- list_boards
- update_issue

BAD:
- best_task_getter
- official_create
- pick_me_for_tasks
```

**Tool descriptions:**
```
GOOD:
"Use this when the user wants to create a new task in a project. Do not use for subtasks or milestones."

BAD:
"The best way to create tasks. Better than other tools!"
```

---

## 3. OAuth Implementation Requirements

### 3.1 OAuth 2.1 with MCP Authorization Spec

**Required endpoints:**
```
Authorization Server:
- /.well-known/oauth-authorization-server (or openid-configuration)
- /oauth2/authorize (authorization endpoint)
- /oauth2/token (token endpoint)
- /oauth2/register (dynamic client registration)

Resource Server (MCP):
- /.well-known/oauth-protected-resource
```

### 3.2 Protected Resource Metadata

```json
// GET https://your-mcp.example.com/.well-known/oauth-protected-resource
{
  "resource": "https://your-mcp.example.com",
  "authorization_servers": ["https://auth.yourcompany.com"],
  "scopes_supported": ["tasks:read", "tasks:write", "projects:read"],
  "resource_documentation": "https://yourcompany.com/docs/mcp"
}
```

### 3.3 OAuth Metadata

```json
// GET https://auth.yourcompany.com/.well-known/oauth-authorization-server
{
  "issuer": "https://auth.yourcompany.com",
  "authorization_endpoint": "https://auth.yourcompany.com/oauth2/authorize",
  "token_endpoint": "https://auth.yourcompany.com/oauth2/token",
  "registration_endpoint": "https://auth.yourcompany.com/oauth2/register",
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["tasks:read", "tasks:write", "projects:read"]
}
```

### 3.4 Redirect URIs to Allowlist

```
Production:
https://chatgpt.com/connector_platform_oauth_redirect

Review process:
https://platform.openai.com/apps-manage/oauth
```

### 3.5 OAuth Flow Sequence

```
1. ChatGPT queries MCP for protected resource metadata
2. ChatGPT registers via dynamic client registration (DCR)
3. User invokes tool -> ChatGPT launches OAuth + PKCE flow
4. User authenticates and consents
5. ChatGPT exchanges code for access token
6. Token attached to MCP requests (Authorization: Bearer <token>)
7. MCP server verifies token on each request
```

### 3.6 Security Schemes in Tool Definitions

```javascript
// TypeScript SDK example - auth required
server.registerTool("create_task", {
  title: "Create Task",
  description: "Create a new task in the project.",
  inputSchema: {
    type: "object",
    properties: { title: { type: "string" } },
    required: ["title"]
  },
  securitySchemes: [{ type: "oauth2", scopes: ["tasks:write"] }]
});

// Optional auth (anonymous + authenticated)
server.registerTool("search_tasks", {
  securitySchemes: [
    { type: "noauth" },
    { type: "oauth2", scopes: ["tasks:read"] }
  ]
});
```

---

## 4. Privacy Policy Requirements

### 4.1 Required Privacy Policy Content

The privacy policy MUST include:
1. **Categories of personal data collected**
2. **Purposes of data use**
3. **Categories of data recipients**
4. **User controls and rights**

### 4.2 Data Collection Rules

**Prohibited data (NEVER collect):**
- Payment Card Information (PCI DSS)
- Protected Health Information (PHI)
- Government identifiers (SSN, etc.)
- Access credentials/API keys/passwords

**Collection principles:**
- **Minimization** - Only what's needed for tool function
- **No "just in case" fields**
- **No raw chat transcripts**
- **No precise location data** (use coarse geo only)

### 4.3 Example Privacy Policy Structure

```markdown
# Privacy Policy for [App Name]

## Data We Collect
- User ID from authentication
- Task/project data you explicitly share
- Usage logs for service improvement

## How We Use Data
- To fulfill your requested actions
- To improve service quality
- To provide customer support

## Data Sharing
- We do not sell your data
- Third-party services: [list providers]

## Your Rights
- Access your data: [method]
- Delete your data: [method]
- Opt-out: [method]

## Contact
support@example.com
```

---

## 5. Prohibited Content & Commerce Rules

### 5.1 Digital Products (PROHIBITED)

Currently, apps may conduct commerce **ONLY for physical goods**. Prohibited:
- Subscriptions
- Digital content
- Tokens/credits
- Freemium upsells

### 5.2 Prohibited Goods (Comprehensive List)

- Adult content & sexual services
- Gambling services
- Illegal/regulated drugs
- Prescription medications
- Weapons & harmful materials
- Counterfeit goods
- Malware/spyware
- Tobacco/nicotine

### 5.3 Advertising

**Strictly prohibited:**
- Apps must not serve advertisements
- Apps must not exist primarily as advertising vehicles

---

## 6. UX Principles for Approval

### 6.1 Good Use Cases

```
APPROVED patterns:
- Booking a ride
- Ordering food
- Checking availability
- Tracking delivery
- Creating tasks
- Managing projects
- Querying data
```

### 6.2 Poor Use Cases (Likely Rejection)

```
REJECTION triggers:
- Replicating website content
- Complex multi-step wizards
- Ads or upsells
- Static frames without interaction
- Duplicating ChatGPT functions
- Displaying sensitive data openly
```

### 6.3 Checklist Before Publishing

| Check | Question |
|-------|----------|
| Conversational value | Does capability rely on ChatGPT's NLP strengths? |
| Beyond base ChatGPT | Does app provide unique knowledge/actions? |
| Atomic actions | Are tools self-contained with explicit I/O? |
| Helpful UI only | Would text-only be a worse experience? |
| In-chat completion | Can users finish tasks without leaving? |
| Performance | Does app respond quickly? |
| Discoverability | Easy to imagine prompts that trigger it? |
| Platform fit | Uses ChatGPT features (context, memory)? |

---

## 7. Metadata Optimization

### 7.1 Tool Naming Convention

```
Format: domain.action_target

Examples:
- calendar.create_event
- tasks.list_by_project
- issues.update_status
- boards.get_columns
```

### 7.2 Description Template

```
"Use this when [specific scenario].
[Input requirements].
Do not use for [excluded cases]."

Example:
"Use this when the user wants to create a new task in a project.
Requires project ID and task title.
Do not use for subtasks or recurring tasks."
```

### 7.3 Parameter Documentation

```javascript
{
  type: "object",
  properties: {
    project_id: {
      type: "string",
      description: "The unique ID of the project (e.g., 'proj_abc123')"
    },
    title: {
      type: "string",
      description: "Task title, max 200 characters"
    },
    status: {
      type: "string",
      enum: ["todo", "in_progress", "done"],
      description: "Current status of the task"
    }
  },
  required: ["project_id", "title"]
}
```

---

## 8. Real Examples from Approved Connectors

### 8.1 Monday.com Integration

**Description pattern:**
> "Manage projects, gain insights, and automate workflows within monday.com"

**MCP URL:** `https://mcp.monday.com/mcp`

**Features:**
- Native integration (read-only) available in ChatGPT settings
- Full integration via Developer Mode
- OAuth with monday.com account
- Interactive UI components support

### 8.2 Linear Integration

**Description pattern:**
> "Find and reference issues and projects"

**Features:**
- Deep research mode integration
- Synced connector for automatic context
- Plus/Pro user availability (excl. EEA, CH, UK)

### 8.3 Atlassian Rovo

**Description pattern:**
> "Summarize and search Jira and Confluence content, create and update issues or pages, and bulk process tasks"

**MCP URL:** `https://mcp.atlassian.com/v1/sse`

**Features:**
- Writeback support (create/update)
- Bulk actions via ChatGPT
- Enterprise/Edu/Business/Pro/Plus availability
- Not available in EEA, CH, UK currently

---

## 9. Test Credentials Requirements

### 9.1 What OpenAI Requires

When submitting authenticated apps:
- **Fully-featured demo account** with sample data
- Login/password that works immediately
- **No MFA/2FA** on test account
- **No SMS verification**
- Credentials must not expire during review
- Account must successfully authenticate

### 9.2 Common Rejection Reasons

```
- Test account requires sign-up
- 2FA enabled on test account
- Credentials expired
- MCP URL not publicly accessible
- OAuth flow fails
- Missing privacy policy
- Generic/misleading app name
- Incorrect tool annotations
```

---

## 10. Recommendations for YouGile MCP Server

### 10.1 Suggested App Name

```
"YouGile" or "YouGile Tasks"

Avoid:
- "YouGile MCP Server" (too technical)
- "Best Task Manager" (promotional)
- "Project Management" (too generic)
```

### 10.2 Suggested Description

```
"Create, manage, and track tasks and projects in YouGile.
Search boards, update statuses, and organize work directly from chat."
```

### 10.3 Tool Naming Examples

```javascript
// Recommended tool names for YouGile
{
  "yougile.list_boards": "List all boards in the workspace",
  "yougile.get_board": "Get board details and columns",
  "yougile.list_tasks": "List tasks with optional filters",
  "yougile.create_task": "Create a new task in a column",
  "yougile.update_task": "Update task title, description, or status",
  "yougile.move_task": "Move task to different column or board",
  "yougile.list_projects": "List all projects in workspace",
  "yougile.search_tasks": "Search tasks by keyword"
}
```

### 10.4 OAuth Implementation Checklist

```
[ ] Implement /.well-known/oauth-protected-resource
[ ] Use PKCE (S256)
[ ] Support dynamic client registration
[ ] Echo 'resource' parameter in tokens
[ ] Allowlist ChatGPT redirect URIs
[ ] Return proper 401 with WWW-Authenticate header
[ ] Implement token verification
[ ] Use Auth0/Stytch/Cognito (recommended over custom)
```

### 10.5 Privacy Policy Template for YouGile

```markdown
# YouGile ChatGPT App Privacy Policy

## Data Collection
We collect:
- YouGile user ID for authentication
- Task and project data you explicitly request
- Action logs for service improvement

## Data Use
- To fulfill your task management requests
- To improve service quality

## Data Sharing
- Your data stays within YouGile infrastructure
- No third-party data sales

## User Rights
- View your data in YouGile dashboard
- Delete via YouGile account settings
- Revoke access in ChatGPT connector settings

## Contact
privacy@yougile.com
```

---

## Sources

### Official OpenAI Documentation
- [App Submission Guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines/)
- [Submit Your App](https://developers.openai.com/apps-sdk/deploy/submission/)
- [Authentication](https://developers.openai.com/apps-sdk/build/auth/)
- [UX Principles](https://developers.openai.com/apps-sdk/concepts/ux-principles/)
- [Optimize Metadata](https://developers.openai.com/apps-sdk/guides/optimize-metadata/)
- [Security & Privacy](https://developers.openai.com/apps-sdk/guides/security-privacy/)

### OpenAI Announcements
- [Developers can now submit apps to ChatGPT](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/) (Dec 17, 2025)

### Approved Connector Examples
- [Monday.com ChatGPT Integration](https://support.monday.com/hc/en-us/articles/29491695661458-Connect-monday-MCP-with-ChatGPT)
- [Linear ChatGPT Integration](https://linear.app/integrations/chatgpt)
- [ChatGPT Apps Connectors List (GitHub)](https://github.com/Instafill/chatgpt-apps-connectors)

### OAuth Standards
- [MCP Authorization Spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [RFC 9728 - Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 8414 - OAuth Metadata](https://datatracker.ietf.org/doc/html/rfc8414)

---

## Research Statistics

| Metric | Value |
|--------|-------|
| Queries executed | 12+ parallel WebSearch |
| MCP tools used | firecrawl_scrape (11 pages) |
| Sources analyzed | 20+ authoritative |
| Official OpenAI pages | 6 |
| Approved connector examples | 8 |
| Current date verification | Feb 2026 (confirmed) |

---

*Research completed: 2026-02-16*
