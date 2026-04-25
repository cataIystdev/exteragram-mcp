# exteragram-mcp

MCP-сервер для разработки плагинов exteraGram.

Предоставляет AI-агентам (Claude Code, Cursor, Windsurf и другим MCP-совместимым инструментам)
полный набор инструментов: генерация Python-кода, справочники SDK, управление контекстом плагина,
деплой через ADB.

**Автор:** CatalystDev  
**Лицензия:** MIT

---

## Установка

```bash
npx exteragram-mcp
```

Или глобально:

```bash
npm install -g exteragram-mcp
```

## Конфигурация

### Claude Code

`~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "exteragram-mcp"],
      "env": {
        "ADB_PATH": "adb"
      }
    }
  }
}
```

### Cursor / Windsurf

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "exteragram-mcp"]
    }
  }
}
```

## Переменные окружения

| Переменная   | Описание                       | По умолчанию |
|--------------|--------------------------------|--------------|
| `ADB_PATH`   | Путь к adb                     | `adb`        |
| `ADB_SERIAL` | Серийный номер устройства      | не задан     |

## Требования

- Node.js >= 20
- ADB (Android Debug Bridge) для деплоя плагинов
- Устройство с установленным exteraGram >= 12.5.1

## Инструменты (76 штук в 18 группах)

| Группа              | Инструменты                                                |
|---------------------|------------------------------------------------------------|
| Контекст [A]        | set/get/clear_plugin_context, validate_plugin_metadata     |
| Scaffold [B]        | generate_plugin_file, metadata_block, import_block         |
| Lifecycle [C]       | on_plugin_load, on_plugin_unload, on_app_event             |
| Настройки [D]       | settings_ui, компоненты, get/set_setting, export/import    |
| Меню [E]            | generate_menu_item                                         |
| Хуки запросов [F]   | pre/post_request_hook, on_update_hook, on_updates_hook     |
| Хук сообщений [G]   | generate_send_message_hook, generate_hook_result           |
| Client Utils [H]    | send_message, edit_message, send_request, queues           |
| Android Utils [I]   | ui_thread, listeners, runnable, clipboard, log             |
| Hook Utils [J]      | find_class, get/set_private_field                          |
| File Utils [K]      | read/write/delete file, list_dir, standard_dirs            |
| Text [L]            | generate_parse_text, list_html_tags                        |
| Class Proxy [M]     | java_subclass, joverride, jfield, J(), PyObj               |
| Xposed [N]          | method_hook, hook_filters, hook_all, unhook                |
| Alert Dialog [O]    | generate_alert_dialog                                      |
| Bulletin [P]        | generate_bulletin (11 типов)                               |
| ADB [Q]             | deploy, logs, shell, push/pull, restart                    |
| Справочники [R]     | hook_strategies, pitfalls, templates, common_classes       |

## Рабочий процесс

```
set_plugin_context          # 1. Установить контекст
generate_plugin_file        # 2. Создать .py файл
generate_on_plugin_load     # 3. Добавить lifecycle
generate_send_message_hook  # 4. Добавить хуки
adb_check_devices           # 5. Проверить устройство
adb_deploy_plugin           # 6. Задеплоить плагин
adb_get_logs               # 7. Проверить логи
```

## Документация SDK

- [Документация плагинов exteraGram](https://plugins.exteragram.app/docs)
- [Шаблоны: get_plugin_template (minimal, hello_world, settings_demo, xposed_demo)]
- [Справочник: explain_pitfalls — 10 задокументированных ошибок]
