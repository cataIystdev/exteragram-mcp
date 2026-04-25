# Архитектура MCP-сервера

## Технологический стек

| Компонент         | Выбор                              |
|-------------------|------------------------------------|
| Язык              | TypeScript (Node.js >= 20)         |
| MCP SDK           | @modelcontextprotocol/sdk ^1.12.0  |
| Транспорт         | stdio (основной)                   |
| Валидация схемы   | zod ^3.24.0                        |
| Тестирование      | vitest ^3.0.0                      |

## Модульная структура

```
src/
├── index.ts           — точка входа, stdio-транспорт
├── server.ts          — registerAllTools(): регистрация всех 18 групп
├── types.ts           — PluginContext, ToolResult, все enum-типы
├── codegen/
│   ├── python-builder.ts  — чистые функции генерации Python-кода
│   └── templates.ts       — вербатимные шаблоны плагинов
├── state/
│   └── plugin-context.ts  — CRUD контекста, валидация метаданных
└── tools/             — 18 файлов групп A-R
```

## Состояние (PluginContext)

Сервер хранит единственный `PluginContext` в памяти:

```typescript
interface PluginContext {
  plugin_id: string;         // /^[a-z][a-z0-9_-]{1,31}$/
  plugin_name: string;
  file_path: string;         // локальный путь к .py
  device_serial?: string;    // ADB серийный номер
  registered_hooks: Set<string>;
  metadata: PluginMetadata;
}
```

`registered_hooks` — отслеживает какие `add_hook` / `add_on_send_message_hook`
уже должны быть вызваны в `on_plugin_load`. Используется для предупреждений агенту.

## Принцип работы инструментов

Каждый инструмент регистрируется через `server.registerTool(name, config, handler)`.
Схема входных параметров задаётся через zod-объект.
Обработчик возвращает `{ content: [{ type: "text", text: "..." }], isError?: boolean }`.

Инструменты генерации **возвращают Python-код строками** — агент вставляет их
в файл через стандартные средства IDE (Edit/Write). Сервер файлы сам не пишет.

Исключение: ADB-инструменты выполняют реальные shell-команды через `execSync`.

## ADB-конфигурация

| Переменная   | Описание                     | По умолчанию |
|--------------|------------------------------|--------------|
| `ADB_PATH`   | Путь к adb бинарнику         | `adb` (PATH) |
| `ADB_SERIAL` | Серийный номер устройства    | не задан     |

Приоритет серийного номера: параметр инструмента > контекст > `ADB_SERIAL` env.

## Codegen: python-builder.ts

Единственный модуль, генерирующий Python-код. Все инструменты используют его функции.

| Функция              | Назначение                               |
|----------------------|------------------------------------------|
| `indent(code, n)`    | Добавить n уровней отступа (4 пробела)   |
| `pyString(val)`      | Строковый литерал с экранированием       |
| `pyList(items)`      | Python-список                            |
| `callExpr(fn, args)` | Вызов функции (null-аргументы пропускаются) |
| `importFrom(m, ns)`  | `from m import n1, n2`                   |
| `tryExcept(b, e, h)` | try-except блок                          |
| `pyMethod(...)`      | Метод класса с декораторами              |
| `joinBlocks(...)`    | Блоки через двойной перевод строки       |

## Тестирование

101 unit-тест в `tests/`. Запуск: `npm test`. Покрытие: `npm run test:coverage`.

Тесты проверяют:
- Корректность всех функций `python-builder.ts`
- CRUD и валидацию `plugin-context.ts`
- Генерацию компонентов настроек
- Паттерны хуков и ADB-команды
- Шаблоны плагинов (`templates.ts`)
