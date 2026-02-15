---
name: yougile
description: Best practices for managing YouGile tasks through MCP. Use when working with YouGile tasks — creating, updating, moving, searching.
---

# YouGile MCP — Task Management Best Practices

## When to use

- Creating / updating / moving tasks in YouGile
- Task inventory and audits
- Searching tasks by assignee, sticker, or title
- Managing boards, columns, stickers, departments

## YOUR CONFIG

Customize these for your project:

```
PROJECT_ID: <your-project-uuid>
BOARD_IDS:
  - name: "Development"
    id: <board-uuid>
    columns:
      - Backlog: <column-uuid>
      - In Progress: <column-uuid>
      - Done: <column-uuid>

TASK_COLORS:
  - blue: Features
  - red: Bugs
  - yellow: Infrastructure
  - green: Marketing
  - violet: Product/UX
```

## Rules

### 1. Always attach results when closing a task

```
NOT JUST: completed=true, columnId=Done
BUT:      completed=true, columnId=Done, description=<links to results>
```

Add to description:
- Links to result files (docs, code, configs)
- Brief summary of what was done
- Completion date

### 2. Check for duplicates before creating

Before `yougile_create_task` ALWAYS:
1. `yougile_list_tasks(columnId=backlog)` — check backlog
2. `yougile_list_tasks(title=keyword)` — search by keyword
3. If similar task exists — update it, don't create a new one

### 3. Verify task isn't already done

Before creating, check:
- "Done" columns on relevant boards
- Project docs and results files
- Existing implementations in code

### 4. WIP limit

Keep "In Progress" column lean. Don't overload.

### 5. Task description format

```html
<p>Brief description (1-2 sentences).</p>

<p><b>MATERIALS:</b></p>
<ul>
<li><b>Name:</b> /path/to/file.md</li>
</ul>
```

Always include links to relevant research/docs.

## API Patterns (important!)

### Deletion
- **Soft delete** via `PUT {deleted: true}` — works for ALL entities
- **Hard DELETE** — ONLY works for project roles (`DELETE /projects/{id}/roles/{roleId}`)
- Everything else returns 404 on DELETE method

### Task assigned field
- `assigned` is a **UUID array**: `["uuid1", "uuid2"]`
- NOT an object! Don't pass `{uuid: true}`

### Chat messages
- Endpoint: `/chats/{chatId}/messages` where chatId = taskId OR groupChatId
- PUT messages supports ONLY `{deleted: true}` — **cannot edit message text**
- Sticker fields use `name` (NOT `title`)

### Pagination
- Standard: `{paging: {count, limit, offset, next}, content: [...]}`
- Exception: `/webhooks` returns a raw array (no paging wrapper)

### ID formats
- Entities (projects, boards, tasks, users): UUID v4
- Sticker states: 12-char hex string
- Chat messages: timestamp (long integer)

### Task colors
Available values for `color` parameter:
`task-primary`, `gray`, `red`, `pink`, `yellow`, `green`, `turquoise`, `blue`, `violet`

### Creating group chats
Requires ALL fields:
```json
{
  "title": "Chat name",
  "users": {"userId": {"notified": true}},
  "userRoleMap": {"userId": "admin"},
  "roleConfigMap": {"admin": {"notified": true}}
}
```

### File uploads
YouGile API v2 does NOT support file uploads. No `/files` endpoint exists.

## Available tools (57)

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
