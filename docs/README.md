# Документация @catalystdev/exteragram-mcp

MCP-сервер для разработки плагинов exteraGram — Telegram-клиента на Android.
Предоставляет AI-агентам полный набор инструментов: генерация Python-кода,
справочники SDK, управление состоянием плагина, деплой через ADB.

## Структура документации

```
docs/
├── README.md              — этот файл, обзор и навигация
├── tools/                 — описание каждой группы инструментов
│   ├── A-context.md       — управление контекстом плагина
│   ├── B-scaffold.md      — генерация файла плагина
│   ├── C-lifecycle.md     — методы жизненного цикла
│   ├── D-settings.md      — UI настроек
│   ├── E-menu.md          — пункты меню
│   ├── F-request-hooks.md — хуки запросов и обновлений
│   ├── G-message-hook.md  — хук исходящих сообщений
│   ├── H-client-utils.md  — клиентские утилиты
│   ├── I-android-utils.md — Android-утилиты
│   ├── J-hook-utils.md    — Java-рефлексия
│   ├── K-file-utils.md    — файловые операции
│   ├── L-text.md          — форматирование текста
│   ├── M-class-proxy.md   — Class Proxy DSL
│   ├── N-xposed.md        — Xposed-хуки
│   ├── O-alert-dialog.md  — модальные диалоги
│   ├── P-bulletin.md      — bulletin-уведомления
│   ├── Q-adb.md           — ADB-деплой
│   └── R-reference.md     — справочники SDK
├── api/
│   └── architecture.md    — архитектура и API сервера
└── deployment/
    └── client-config.md   — конфигурация клиентов
```

## Связь с планом

Директория [../plan/](../plan/) содержит исходный план реализации.
Каждый файл в `docs/tools/` соответствует файлу `plan/tools/` с аналогичным именем
и дополнен фактической реализацией (имена функций, сигнатуры, примеры вызовов).

## Быстрый старт

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "@catalystdev/exteragram-mcp"],
      "env": { "ADB_PATH": "adb" }
    }
  }
}
```

## Рабочий процесс агента

```
set_plugin_context          — 1. Установить плагин
generate_plugin_file        — 2. Создать .py файл
generate_on_plugin_load     — 3. Добавить lifecycle
generate_settings_ui        — 4. Настройки (если нужны)
generate_send_message_hook  — 5. Хуки (если нужны)
adb_check_devices           — 6. Проверить устройство
adb_deploy_plugin           — 7. Задеплоить
adb_get_logs               — 8. Проверить логи
```
