#!/usr/bin/env node
/**
 * Точка входа MCP-сервера exteragram-mcp.
 *
 * Создаёт McpServer с метаданными, регистрирует все инструменты
 * и подключается к stdio-транспорту для работы с Claude Code,
 * Cursor, Windsurf и другими MCP-совместимыми клиентами.
 *
 * Конфигурация через переменные окружения:
 *   ADB_PATH    — путь к adb бинарнику (по умолчанию "adb")
 *   ADB_SERIAL  — серийный номер ADB-устройства по умолчанию
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./server.js";

/** Версия сервера совпадает с версией в package.json */
const SERVER_VERSION = "1.0.0";

/**
 * Инструкции для агентов по работе с сервером.
 * Отображаются в поддерживающих MCP-клиентах.
 */
const SERVER_INSTRUCTIONS = `
MCP-сервер для разработки плагинов exteraGram.

Рабочий процесс:
1. set_plugin_context — установите текущий плагин (plugin_id, file_path)
2. generate_plugin_file — создайте базовый .py файл
3. Используйте инструменты генерации для добавления функциональности
4. adb_check_devices — проверьте подключение устройства
5. adb_deploy_plugin — задеплойте плагин
6. adb_get_logs — проверьте логи

Справочники: list_hook_strategies, list_app_events, list_menu_types,
list_settings_components, list_available_libraries, list_common_classes,
list_hook_filters, explain_pitfalls.

Шаблоны: get_plugin_template (minimal, hello_world, settings_demo, xposed_demo).
`.trim();

/**
 * Запускает MCP-сервер на stdio-транспорте.
 */
async function main(): Promise<void> {
  const server = new McpServer(
    {
      name: "@catalystdev/exteragram-mcp",
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  registerAllTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Логи только в stderr, чтобы не засорять stdio-протокол
  process.stderr.write(
    `exteragram-mcp v${SERVER_VERSION} запущен на stdio\n`
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Ошибка запуска exteragram-mcp: ${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exit(1);
});
