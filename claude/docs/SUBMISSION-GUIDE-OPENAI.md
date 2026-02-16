# Пошаговый план подачи YouGile MCP в ChatGPT App Directory

**Дата:** 2026-02-16
**Статус:** Готово к выполнению

---

## ОБЗОР: Что нужно сделать

### Я сделаю (код):
1. Добавить tool annotations ко всем 57 tools
2. Добавить OpenAI redirect URIs в OAuth
3. Подготовить verification endpoint (токен вставим когда получим)
4. Опубликовать v1.0.5 на npm + GitHub + GitLab

### Тебе нужно (руками):
1. Пройти Organization Verification на OpenAI
2. Создать тестовый аккаунт YouGile (без 2FA)
3. Подготовить иконку 512x512 PNG
4. Заполнить форму на platform.openai.com/apps-manage (тексты ниже)
5. Вставить verification token (появится в форме)

---

## ШАГ 1: Organization Verification (ТЕБЕ, 5-30 мин)

1. Открой https://platform.openai.com/settings/organization/general
2. Нажми "Verify Organization"
3. Пройди Individual Verification (паспорт или водительское)
4. **Используй Chrome** (Safari глючит!)
5. Подожди ~30 минут после отправки

**Важно:** Ты сказал что у тебя Level 5 и верификация пройдена — тогда этот шаг скорее всего уже выполнен. Проверь на той странице.

---

## ШАГ 2: Тестовый аккаунт YouGile (ТЕБЕ, 5 мин)

OpenAI reviewers будут тестировать app. Им нужен аккаунт YouGile:

1. Создай аккаунт на YouGile (или используй существующий)
2. **ОТКЛЮЧИ 2FA/MFA** на этом аккаунте (иначе reject!)
3. Наполни тестовыми данными:
   - 2-3 проекта
   - 5-10 досок
   - 20-30 задач (разных статусов, с описаниями)
   - Пару пользователей
4. Получи API ключ для этого аккаунта

**Мне потом дай:** email, пароль, API ключ.

---

## ШАГ 3: Иконка (ТЕБЕ, 10 мин)

Нужна иконка 512x512 PNG. По идее у YouGile уже есть логотип — можно его использовать.

Нужны 2 варианта:
- **Light mode** (для светлого фона)
- **Dark mode** (для тёмного фона)

---

## ШАГ 4: Я добавляю tool annotations + security fixes (Я, ~1 час)

Добавлю ко всем 57 tools аннотации:

### Маппинг аннотаций для всех tools:

| Tool | readOnly | destructive | openWorld |
|------|----------|-------------|-----------|
| **Projects** | | | |
| yougile_list_projects | true | false | false |
| yougile_get_project | true | false | false |
| yougile_create_project | false | false | false |
| yougile_update_project | false | false | false |
| **Boards** | | | |
| yougile_list_boards | true | false | false |
| yougile_get_board | true | false | false |
| yougile_create_board | false | false | false |
| yougile_update_board | false | false | false |
| **Columns** | | | |
| yougile_list_columns | true | false | false |
| yougile_get_column | true | false | false |
| yougile_create_column | false | false | false |
| yougile_update_column | false | false | false |
| **Tasks** | | | |
| yougile_list_tasks | true | false | false |
| yougile_get_task | true | false | false |
| yougile_create_task | false | false | false |
| yougile_update_task | false | true* | false |
| yougile_get_chat_subscribers | true | false | false |
| yougile_set_chat_subscribers | false | false | false |
| **Chat** | | | |
| yougile_list_chat_messages | true | false | false |
| yougile_send_chat_message | false | false | true** |
| yougile_get_chat_message | true | false | false |
| yougile_delete_chat_message | false | true | false |
| yougile_list_group_chats | true | false | false |
| yougile_get_group_chat | true | false | false |
| yougile_create_group_chat | false | false | false |
| yougile_update_group_chat | false | false | false |
| **Users** | | | |
| yougile_list_users | true | false | false |
| yougile_get_user | true | false | false |
| yougile_invite_user | false | false | true*** |
| yougile_update_user | false | false | false |
| yougile_delete_user | false | true | false |
| **Company** | | | |
| yougile_get_company | true | false | false |
| yougile_update_company | false | false | false |
| **Departments** | | | |
| yougile_list_departments | true | false | false |
| yougile_get_department | true | false | false |
| yougile_create_department | false | false | false |
| yougile_update_department | false | false | false |
| **Project Roles** | | | |
| yougile_list_project_roles | true | false | false |
| yougile_get_project_role | true | false | false |
| yougile_create_project_role | false | false | false |
| yougile_update_project_role | false | false | false |
| yougile_delete_project_role | false | true | false |
| **String Stickers** | | | |
| yougile_list_string_stickers | true | false | false |
| yougile_get_string_sticker | true | false | false |
| yougile_create_string_sticker | false | false | false |
| yougile_update_string_sticker | false | false | false |
| yougile_create_string_sticker_state | false | false | false |
| yougile_update_string_sticker_state | false | false | false |
| **Sprint Stickers** | | | |
| yougile_list_sprint_stickers | true | false | false |
| yougile_get_sprint_sticker | true | false | false |
| yougile_create_sprint_sticker | false | false | false |
| yougile_update_sprint_sticker | false | false | false |
| yougile_create_sprint_sticker_state | false | false | false |
| yougile_update_sprint_sticker_state | false | false | false |
| **Webhooks** | | | |
| yougile_list_webhooks | true | false | false |
| yougile_create_webhook | false | false | false |
| yougile_update_webhook | false | false | false |

**Примечания:**
- *update_task = destructive потому что может soft-delete (deleted: true)
- **send_chat_message = openWorld потому что отправляет сообщение другим людям
- ***invite_user = openWorld потому что отправляет email-приглашение

---

## ШАГ 5: Заполнение формы (ТЕБЕ + мои тексты)

### Зайди на: https://platform.openai.com/apps-manage

### Готовые тексты для формы:

**App Name:**
```
YouGile
```

**Short Description:**
```
Create, manage, and track tasks and projects in YouGile directly from chat.
```

**Long Description:**
```
YouGile MCP server provides full access to YouGile project management platform.

Capabilities:
- Projects: create, list, update projects
- Boards & Columns: organize work with boards and columns
- Tasks: create, update, assign, track tasks with deadlines, checklists, and time tracking
- Chat: send messages, manage group chats
- Users: invite, manage team members
- Stickers & Sprints: label and sprint management
- Webhooks: set up event notifications

57 tools covering 100% of YouGile API v2.
```

**Category:**
```
Productivity / Project Management
```

**MCP Server URL:**
```
https://you-mcp.com/mcp
```

**Privacy Policy URL:**
```
https://you-mcp.com/privacy
```

**Terms of Service URL:**
```
https://you-mcp.com/terms
```

**Support Email:**
```
gircychatnj@gmail.com
```

**Country Availability:**
```
All countries (или выбери конкретные)
```

---

## ШАГ 6: Tool Justifications (в форме)

Для каждого tool нужно ответить на 3 вопроса. Шаблоны:

### Read-only tools (list_*, get_*):
```
Read Only? Yes — This tool only retrieves data from YouGile, no modifications.
Destructive? No — No data is deleted or overwritten.
Open World? No — No external systems are contacted.
```

### Create tools (create_*):
```
Read Only? No — This tool creates new entities in YouGile.
Destructive? No — Creates new data, does not delete or overwrite existing.
Open World? No — Data stays within YouGile workspace.
```

### Update tools (update_*):
```
Read Only? No — This tool modifies existing entities in YouGile.
Destructive? No — Updates existing data without deleting.
Open World? No — Changes stay within YouGile workspace.
```

### Delete tools (delete_*, update_task с deleted:true):
```
Read Only? No — This tool can delete data.
Destructive? Yes — Data is soft-deleted (can be recovered via YouGile admin).
Open World? No — Deletion is internal to YouGile workspace.
```

### Chat send:
```
Read Only? No — Sends a message.
Destructive? No — Creates new message, does not delete.
Open World? Yes — Message is visible to other YouGile workspace members.
```

### Invite user:
```
Read Only? No — Sends an invitation.
Destructive? No — Creates new invitation.
Open World? Yes — Sends an email invitation to the specified address.
```

---

## ШАГ 7: Test Cases (в форме)

### Positive Test Cases (минимум 5):

**Test 1:**
```
Prompt: "List all my YouGile projects"
Expected: Returns a list of projects with names and IDs
```

**Test 2:**
```
Prompt: "Create a new task called 'Fix login bug' in the first column of my board"
Expected: Creates a task and returns its ID and details
```

**Test 3:**
```
Prompt: "Show me all tasks assigned to me"
Expected: Returns tasks filtered by the authenticated user
```

**Test 4:**
```
Prompt: "Update the task 'Fix login bug' — mark it as completed"
Expected: Updates the task's completed field to true
```

**Test 5:**
```
Prompt: "Send a message 'Meeting at 3pm' in the task chat"
Expected: Sends a chat message in the task's discussion
```

**Test 6:**
```
Prompt: "Create a new board called 'Sprint 5' in my project"
Expected: Creates a board and returns its details
```

### Negative Test Cases (минимум 3):

**Negative 1:**
```
Prompt: "Delete my entire YouGile account"
Expected: Tool does not support account deletion. Should explain limitations.
```

**Negative 2:**
```
Prompt: "Show me tasks from a project I don't have access to"
Expected: Returns an access denied error from YouGile API
```

**Negative 3:**
```
Prompt: "Create 1000 tasks at once"
Expected: Tool creates tasks one at a time, not in bulk. Should suggest sequential creation.
```

---

## ШАГ 8: Verification Token (ТЕБЕ, 2 мин)

Когда заполнишь форму и нажмёшь Submit:
1. OpenAI покажет **verification token** (строка символов)
2. Скинь мне этот token
3. Я моментально вставлю его на сервер (env var `OPENAI_VERIFICATION_TOKEN`)
4. Endpoint `/.well-known/openai-apps-challenge` уже настроен и ждёт
5. OpenAI автоматически проверит endpoint

---

## ШАГ 9: Release Notes (в форме)

```
Initial release of YouGile MCP server for ChatGPT.
57 tools providing full YouGile API v2 coverage:
- Project, board, column, and task management
- Team chat and group chat messaging
- User management and invitations
- Sprint and sticker management
- Webhook configuration
OAuth 2.1 with PKCE for secure authentication.
```

---

## ИТОГО — Чек-лист перед подачей

### Тебе:
- [ ] Organization Verification пройдена
- [ ] Тестовый YouGile аккаунт создан (без 2FA, с данными)
- [ ] Иконка 512x512 PNG (light + dark) готова
- [ ] Test credentials записаны (email, пароль, API key)

### Мне:
- [ ] Tool annotations добавлены ко всем 57 tools
- [ ] OpenAI redirect URIs добавлены
- [ ] v1.0.5 опубликована (npm + GitHub + GitLab)
- [ ] Сервер обновлён

### В форме OpenAI:
- [ ] App Name: YouGile
- [ ] Description заполнена
- [ ] MCP URL: https://you-mcp.com/mcp
- [ ] Privacy Policy: https://you-mcp.com/privacy
- [ ] Terms: https://you-mcp.com/terms
- [ ] Tool justifications заполнены
- [ ] 6 positive test cases
- [ ] 3 negative test cases
- [ ] Test credentials предоставлены
- [ ] Release notes заполнены
- [ ] Verification token установлен на сервере

---

## Сроки review

Программа в BETA. Конкретных сроков нет, но:
- Confirmation email приходит сразу
- Review занимает от дней до недель
- Первые approved apps появились в начале 2026

## Ограничения (знать заранее)

1. **Нельзя продавать digital goods** через app (subscriptions, credits)
2. **Нельзя рекламировать** в app
3. **Tool names заблокированы** после publish (изменить = re-submit)
4. **EEA/CH/UK** — некоторые approved apps недоступны (может касаться нас)
