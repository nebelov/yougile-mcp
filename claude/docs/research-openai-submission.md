# Исследование: Публикация MCP Server/App в ChatGPT App Directory (OpenAI)

> **Дата исследования:** 2026-02-16
> **Статус:** Актуальная информация (App Store открыт с 17 декабря 2025)

---

## 1. URL для подачи заявки

**Основной портал подачи:**
```
https://platform.openai.com/apps-manage
```

**Дополнительные ресурсы:**
- Apps SDK документация: https://developers.openai.com/apps-sdk
- Submission Guidelines: https://developers.openai.com/apps-sdk/app-submission-guidelines
- App Directory (для пользователей): https://chatgpt.com/apps

**Источники:**
- [Developers can now submit apps to ChatGPT](https://openai.com/index/developers-can-now-submit-apps-to-chatgpt/)
- [Submitting apps to the ChatGPT app directory](https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory)

---

## 2. Требования для подачи (Обязательные поля)

### 2.1 Предварительные требования

| Требование | Описание |
|------------|----------|
| **Верификация организации** | Обязательно! Пройти верификацию на https://platform.openai.com/settings/organization/general |
| **Роль Owner** | Только Owner организации может подавать apps на review |
| **Публичный MCP сервер** | Сервер должен быть доступен по HTTPS (НЕ localhost) |
| **CSP (Content Security Policy)** | Обязательно определить разрешённые домены для fetch запросов |
| **EU Data Residency** | Проекты с EU data residency НЕ могут подавать apps. Используйте global data residency |

### 2.2 Информация для формы подачи

**MCP Server Details:**
- MCP Server URL (публичный HTTPS endpoint, например `/mcp` или `/sse/`)
- OAuth metadata (если используется OAuth аутентификация)

**App Metadata:**
- **App Name** - уникальное, понятное имя (НЕ generic single-word dictionary terms)
- **Description** - что делает app и когда его использовать
- **Screenshots** - должны соответствовать required dimensions и реальному функционалу

**Tool Annotations (КРИТИЧНО для approval):**
| Annotation | Описание | Когда использовать |
|------------|----------|-------------------|
| `readOnlyHint` | Только чтение данных | `true` если tool ТОЛЬКО читает/ищет, НЕ меняет ничего |
| `destructiveHint` | Деструктивные действия | `true` если tool может удалять, перезаписывать, отправлять сообщения |
| `openWorldHint` | Внешние действия | `true` если tool пишет в публичные системы (соцсети, email, etc.) |

**Test Cases:**
- Примеры промптов для тестирования
- Ожидаемые результаты для каждого промпта
- Тесты должны проходить на ChatGPT web И mobile

**Test Credentials (если OAuth):**
- Login и password для demo-аккаунта с sample data
- БЕЗ MFA/2FA (иначе reject!)
- Credentials должны работать вне VPN/corporate networks

**Privacy Policy:**
- URL опубликованной privacy policy
- Должна содержать: категории собираемых данных, цели использования, получатели, контроли для пользователей

**Support Contact:**
- Email или URL для customer support

**Country Availability:**
- Выбор стран для распространения

**Release Notes:**
- Описание изменений (для updates)

**Источники:**
- [Submit your app](https://developers.openai.com/apps-sdk/deploy/submission/)
- [App submission guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines/)

---

## 3. Критерии review (Что проверяет OpenAI)

### 3.1 App Fundamentals

| Критерий | Требование |
|----------|------------|
| **Purpose** | Чёткое назначение, функционал которого нет в ChatGPT нативно |
| **Originality** | Только собственный IP или с разрешением владельца |
| **Quality** | Стабильность, быстрый отклик, низкая latency |
| **No Crashes** | App не должен падать, зависать или показывать inconsistent behavior |
| **Complete App** | Trials и demos НЕ принимаются |

### 3.2 Tool Quality (КЛЮЧЕВОЕ для approval)

**Tool Names:**
- Human-readable, action-oriented (verb-based: `get_order_status`)
- Уникальные внутри app
- БЕЗ promotional language (`pick_me`, `best`, `official`)

**Tool Descriptions:**
- Точно описывают что делает tool
- НЕ рекомендуют себя выше других apps
- НЕ требуют overly-broad triggering

**Annotations:**
- `readOnlyHint` - ОБЯЗАТЕЛЬНО для всех tools
- `destructiveHint` - ОБЯЗАТЕЛЬНО для всех tools
- `openWorldHint` - ОБЯЗАТЕЛЬНО для всех tools
- Justification для каждой annotation

**Inputs:**
- Минимально необходимые поля
- НЕ запрашивать full conversation history
- НЕ запрашивать precise location (GPS coordinates)

### 3.3 Privacy & Data

**Data Collection:**
- Минимизация сбора данных
- Минимизация возвращаемых данных
- НЕ собирать: PCI DSS данные, PHI, government IDs, credentials

**Restricted Data:**
- Session IDs, trace IDs, request IDs - НЕ возвращать в responses
- Internal account IDs, logs - НЕ возвращать
- Auth secrets (tokens, keys, passwords) - ЗАПРЕЩЕНО

### 3.4 Safety

- Соответствие [OpenAI Usage Policies](https://openai.com/policies/usage-policies/)
- Suitable for ages 13+
- НЕ targeting children under 13
- НЕ scraping third-party сайтов без авторизации
- НЕ bypassing API restrictions/rate limits

### 3.5 Commerce (ОГРАНИЧЕНИЯ)

**Разрешено:**
- Продажа ТОЛЬКО физических товаров
- External checkout (redirect на ваш домен)

**ЗАПРЕЩЕНО:**
- Digital products/services
- Subscriptions
- Digital content, tokens, credits
- Freemium upsells
- In-app purchases
- Advertising

**Источники:**
- [App submission guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines/)

---

## 4. Верификация домена

### 4.1 Organization Verification

Верификация через Persona flow:
1. Перейти на https://platform.openai.com/settings/organization/general
2. Нажать "Verify Organization"
3. Предоставить government-issued ID (паспорт, водительское удостоверение)
4. ID не должен быть использован для другой организации в последние 90 дней

**Типы верификации:**
- **Individual verification** - для solo developers
- **Business verification** - для компаний

**Время:** ~30 минут после completion для обновления статуса.

**Известные проблемы (декабрь 2025):**
- Safari может не работать - используйте Chrome
- Business verification может показывать "Start" даже после completion
- Workaround: попробовать individual verification

### 4.2 MCP Server Verification

При подаче app, OpenAI проверяет:
- Публичная доступность MCP server по HTTPS
- Правильность OAuth credentials (если используются)
- Отсутствие MFA на test credentials
- CSP настройки

**ВАЖНО:** Нет отдельного endpoint `/.well-known/openai-apps-challenge` для app submission (это было для Actions/GPTs). Для MCP apps - просто публичный `/mcp` или `/sse/` endpoint.

**Источники:**
- [API Organization Verification](https://help.openai.com/en/articles/10910291-api-organization-verification)

---

## 5. Сроки review

| Этап | Время |
|------|-------|
| **Submission confirmation** | Мгновенно (email с Case ID) |
| **Review process** | "Timelines may vary" (beta) |
| **First approved apps rollout** | Начало 2026 |
| **Updates review** | Аналогично новым submissions |

**Статус программы:** BETA - процессы ещё оптимизируются.

**Отслеживание:** Dashboard на https://platform.openai.com/apps-manage

---

## 6. Причины отказа и как избежать

### 6.1 Распространённые причины rejection

| Причина | Как исправить |
|---------|--------------|
| **Unable to connect to MCP server** | Проверить URL и credentials вне корпоративной сети, убрать MFA |
| **Test cases did not produce correct results** | Перепроверить все test cases на web И mobile, убедиться в соответствии expected results |
| **User data not disclosed in privacy policy** | Аудит всех возвращаемых полей, обновить privacy policy |
| **readOnlyHint mismatch** | Tool который create/update/delete НЕ может быть readOnly:true |
| **destructiveHint mismatch** | Любое необратимое действие = destructiveHint:true |
| **openWorldHint mismatch** | Любое действие в публичные системы = openWorldHint:true |

### 6.2 Чек-лист перед submission

- [ ] Organization verified
- [ ] MCP server публично доступен по HTTPS
- [ ] CSP определён для всех fetch доменов
- [ ] Все tools имеют readOnlyHint, destructiveHint, openWorldHint
- [ ] Tool descriptions точно описывают поведение
- [ ] Test credentials работают БЕЗ MFA
- [ ] Privacy policy опубликована и актуальна
- [ ] Все test cases проходят на web И mobile
- [ ] Response не содержит session IDs, telemetry, internal identifiers
- [ ] App не продаёт digital goods/subscriptions
- [ ] App не показывает рекламу

### 6.3 После rejection

1. Получите email с причинами отказа
2. Исправьте указанные проблемы
3. Resubmit через Dashboard
4. Для appeal - ответьте на email с rationale и новой информацией

**Источники:**
- [Submitting apps - Common rejection reasons](https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory)

---

## 7. Developer Mode vs Published Apps

### 7.1 Сравнение

| Аспект | Developer Mode | Published App |
|--------|---------------|---------------|
| **Доступность** | Только для вашего аккаунта/workspace | Все пользователи ChatGPT |
| **Review** | Не требуется | Обязательный review OpenAI |
| **MCP Actions** | Read + Write | Read + Write (после approval) |
| **Обновления** | Мгновенные | Требуют re-submission |
| **Тестирование** | Да | Нет (production) |
| **Планы ChatGPT** | Pro, Plus, Business, Enterprise, Edu | Все планы (после rollout) |

### 7.2 Как использовать Developer Mode

1. Включить: Settings -> Apps -> Advanced Settings -> Developer mode
2. Создать connector: Settings -> Apps -> Create
3. Указать MCP URL, auth settings
4. Тестировать в чатах через Developer Mode tool

### 7.3 Путь к публикации

```
Development (local)
    -> Developer Mode (HTTPS + ngrok/Cloudflare)
    -> Testing (все test cases pass)
    -> Submission (platform.openai.com/apps-manage)
    -> Review (OpenAI)
    -> Approval
    -> Publish (кнопка в Dashboard)
    -> App Directory
```

**Источники:**
- [Developer mode, and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta)
- [ChatGPT Developer mode](https://platform.openai.com/docs/guides/developer-mode)

---

## 8. Советы от разработчиков (Community insights)

### Из OpenAI Community Forum:

1. **Safari не работает** - submission form может ломаться. Используйте Chrome.

2. **Business verification delays** - может занять >24 часов. Альтернатива: individual verification.

3. **"Connector is not safe" error** - некоторые домены (например, Azure production) могут быть заблокированы safety filter. Staging домены работают.

4. **Scan Tools failing** - если OAuth flow показывает `linkId: null`, попробуйте создать новый project.

5. **Test cases UI** - dropdown меню для additional test cases может не работать в Safari.

6. **Digital goods restriction** - текущие featured apps (Spotify, Figma, Canva) имеют особые соглашения. Для новых apps digital commerce запрещён.

### Лучшие практики:

- Используйте [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) для локальной отладки
- Тестируйте на mobile early (iOS/Android ChatGPT apps)
- Записывайте screenshots/recordings для review
- Делайте tool descriptions action-oriented с "Use this when..." guidance
- Включайте parameter descriptions и enums для clarity

**Источники:**
- [Community: ChatGPT App Store is open for submissions](https://community.openai.com/t/chatgpt-app-store-is-open-for-submissions/1369611)
- [Community: MCP connector rejected](https://community.openai.com/t/mcp-connector-rejected-with-detail-connector-is-not-safe/1359557)

---

## 9. Технические требования для MCP Server

### 9.1 Protocol

- **Supported:** SSE (Server-Sent Events), Streaming HTTP
- **NOT Supported:** Local MCP servers, stdio transport

### 9.2 Authentication

| Type | Описание |
|------|----------|
| **No Auth** | Публичный доступ |
| **OAuth** | Dynamic Client Registration или static credentials |
| **Mixed** | Initialize/list_tools = no auth, tools = OAuth |

### 9.3 Required Tools (НЕ обязательны для apps)

`search` и `fetch` tools больше НЕ обязательны для apps (были для connectors).

### 9.4 Tool Annotations (MCP spec)

```json
{
  "name": "create_task",
  "description": "Creates a new task in the project. Use this when the user wants to add a task.",
  "inputSchema": { ... },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": false,
    "openWorldHint": false
  }
}
```

**Источники:**
- [Building MCP servers for ChatGPT](https://platform.openai.com/docs/mcp)
- [Connect from ChatGPT](https://developers.openai.com/apps-sdk/deploy/connect-chatgpt/)

---

## 10. Пост-approval процесс

### После approval:

1. Нажать **Publish** в Dashboard
2. App появится в App Directory
3. Пользователи смогут найти app:
   - По прямой ссылке
   - По поиску по имени
4. Apps с high utility могут получить enhanced distribution (рекомендации, placement)

### Обновления:

- Tool names, signatures, descriptions ЗАБЛОКИРОВАНЫ после publish
- Для изменений: resubmit -> review -> publish update
- Update заменяет предыдущую версию

### Removal:

- Можно удалить через Dashboard (... menu -> Delete)
- OpenAI может удалить за policy violations
- Appeal через https://openai.com/transparency-and-content-moderation/

---

## 11. Полезные ссылки

| Ресурс | URL |
|--------|-----|
| Submission Portal | https://platform.openai.com/apps-manage |
| Apps SDK Docs | https://developers.openai.com/apps-sdk |
| Submission Guidelines | https://developers.openai.com/apps-sdk/app-submission-guidelines/ |
| Organization Verification | https://platform.openai.com/settings/organization/general |
| Developer Mode Guide | https://platform.openai.com/docs/guides/developer-mode |
| MCP Building Guide | https://platform.openai.com/docs/mcp |
| App Directory | https://chatgpt.com/apps |
| Help: Submitting Apps | https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory |
| OpenAI Usage Policies | https://openai.com/policies/usage-policies/ |
| MCP Inspector | https://modelcontextprotocol.io/docs/tools/inspector |
| Community Forum | https://community.openai.com/c/chatgpt-apps-sdk/42 |

---

## 12. Статистика исследования

| Метрика | Значение |
|---------|----------|
| WebSearch запросов | 12 |
| Firecrawl scrapes | 12 |
| Официальных источников | 10+ |
| Community источников | 3 |
| Актуальность информации | Февраль 2026 |

---

## Вывод для YouGile MCP Server

Для успешной публикации YouGile MCP Server в ChatGPT App Directory необходимо:

1. **Пройти Organization Verification** (individual или business)
2. **Развернуть MCP server публично** (HTTPS, без localhost)
3. **Добавить все tool annotations** (readOnlyHint, destructiveHint, openWorldHint)
4. **Подготовить Privacy Policy** с описанием данных YouGile
5. **Создать test credentials** без MFA для demo-аккаунта YouGile
6. **Написать test cases** с expected results
7. **Тестировать на web И mobile** ChatGPT
8. **Submit через platform.openai.com/apps-manage**

**ВАЖНО:** YouGile API токен аутентификация может потребовать реализации OAuth flow для соответствия требованиям OpenAI, либо использование "No Auth" с user-provided credentials в conversation.
