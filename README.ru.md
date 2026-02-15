# @nebelov/yougile-mcp

MCP-сервер для [YouGile](https://yougile.com) — управление проектами через AI. **57 инструментов**, 100% покрытие YouGile API v2.

Работает с **Claude**, **ChatGPT**, **Gemini CLI**, **VS Code**, **Cursor** и любым MCP-совместимым клиентом.

<p align="center">
  <img src="https://raw.githubusercontent.com/nebelov/yougile-mcp/main/assets/demo.gif" alt="AI автономно создаёт структуру проекта в YouGile через MCP" width="640">
  <br>
  <em>AI-агент создаёт проект, доски, колонки и задачи с описаниями — всё через MCP</em>
</p>

## Быстрый старт

### Автонастройка (рекомендуется)

```bash
npx @nebelov/yougile-mcp --setup
```

Авторизуется в YouGile, получает API-ключ и прописывает конфиг для вашего AI-инструмента.

### Ручная настройка

1. Получите API-ключ в YouGile (Настройки > API или `POST /auth/keys`)
2. Добавьте в конфиг AI-инструмента:

**Claude Code** (`~/.claude.json`):
```json
{
  "mcpServers": {
    "yougile": {
      "command": "npx",
      "args": ["-y", "@nebelov/yougile-mcp"],
      "env": { "YOUGILE_API_KEY": "ваш-ключ" }
    }
  }
}
```

**Claude Desktop**, **Gemini CLI**, **VS Code** — аналогично (см. [English README](README.md)).

## HTTP-режим (для ChatGPT)

```bash
YOUGILE_API_KEY=ваш-ключ npx @nebelov/yougile-mcp --http --port 3000
```

В ChatGPT: Settings > Apps > Create > вставить `http://localhost:3000/mcp`

## Инструменты (57)

| Модуль | Кол-во | Описание |
|--------|--------|----------|
| projects | 4 | список, получить, создать, обновить |
| boards | 4 | доски: список, получить, создать, обновить |
| columns | 4 | колонки: список, получить, создать, обновить |
| tasks | 6 | задачи + подписчики чата |
| chat | 8 | сообщения + групповые чаты |
| users | 5 | пользователи: список, получить, пригласить, обновить, удалить |
| company | 2 | компания: получить, обновить |
| departments | 4 | отделы: список, получить, создать, обновить |
| project-roles | 5 | роли проекта: CRUD + удаление |
| string-stickers | 6 | стикеры (строковые): CRUD + состояния |
| sprint-stickers | 6 | стикеры (спринт): CRUD + состояния |
| webhooks | 3 | вебхуки: список, создать, обновить |

## Навык (Skill)

В пакете есть `skill/SKILL.md` — лучшие практики работы с YouGile через AI. Скопируйте в навыки Claude Code для лучшего управления задачами.

## Паттерны API

- **Удаление**: `PUT {deleted: true}` для всех сущностей. `DELETE` только для ролей проекта.
- **Стикеры**: поле `name` (не `title`).
- **assigned в задачах**: массив UUID `["uuid1"]`, не объект.
- **Сообщения**: редактирование текста невозможно, только `{deleted: true}`.

## Лицензия

MIT
