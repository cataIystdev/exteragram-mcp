/**
 * [A] Инструменты управления контекстом плагина.
 *
 * Предоставляет MCP-инструменты для установки, получения, очистки и валидации
 * контекста текущего рабочего плагина. Контекст хранится в памяти сервера
 * и используется всеми остальными инструментами для определения plugin_id,
 * file_path, device_serial и зарегистрированных хуков.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  setPluginContext,
  getPluginContext,
  clearPluginContext,
  validateMetadata,
  serializeContext,
} from "../state/plugin-context.js";
import type { ToolResult } from "../types.js";

/**
 * Формирует успешный ответ инструмента.
 *
 * @param text - текст ответа
 * @returns объект ToolResult с content
 */
function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Формирует ответ инструмента с ошибкой.
 *
 * @param text - описание ошибки
 * @returns объект ToolResult с isError=true
 */
function err(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

/**
 * Регистрирует все инструменты группы [A] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerContextTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // set_plugin_context
  // -------------------------------------------------------------------
  server.registerTool(
    "set_plugin_context",
    {
      title: "Установить контекст плагина",
      description:
        "Устанавливает текущий рабочий плагин. Сохраняет plugin_id, имя, путь к файлу " +
        "и опциональный серийный номер ADB-устройства в памяти сервера. " +
        "Этот контекст используется всеми инструментами деплоя и генерации. " +
        "Вызывать в начале работы с каждым плагином.",
      inputSchema: {
        plugin_id: z
          .string()
          .describe(
            "Уникальный ID плагина: 2-32 символа, начинается с a-z, только [a-z0-9_-]"
          ),
        plugin_name: z.string().describe("Отображаемое имя плагина"),
        file_path: z
          .string()
          .describe("Локальный путь к .py файлу плагина"),
        device_serial: z
          .string()
          .optional()
          .describe(
            "Серийный номер ADB-устройства (если подключено несколько устройств)"
          ),
      },
    },
    async ({ plugin_id, plugin_name, file_path, device_serial }) => {
      const result = setPluginContext(
        plugin_id,
        plugin_name,
        file_path,
        device_serial
      );

      if (!result.valid) {
        const errorList = result.errors
          .map((e) => `  - ${e.field}: ${e.message}`)
          .join("\n");
        return err(
          `Ошибки валидации plugin_id/plugin_name:\n${errorList}`
        );
      }

      return ok(
        `Контекст плагина установлен:\n` +
          `  plugin_id:    ${plugin_id}\n` +
          `  plugin_name:  ${plugin_name}\n` +
          `  file_path:    ${file_path}\n` +
          `  device_serial: ${device_serial ?? "(не задан)"}`
      );
    }
  );

  // -------------------------------------------------------------------
  // get_plugin_context
  // -------------------------------------------------------------------
  server.registerTool(
    "get_plugin_context",
    {
      title: "Получить контекст плагина",
      description:
        "Возвращает текущий сохранённый контекст плагина: plugin_id, имя, путь к файлу, " +
        "серийный номер устройства, список зарегистрированных хуков и метаданные. " +
        "Используйте для проверки текущего состояния сервера.",
      inputSchema: {},
    },
    async () => {
      return ok(serializeContext());
    }
  );

  // -------------------------------------------------------------------
  // clear_plugin_context
  // -------------------------------------------------------------------
  server.registerTool(
    "clear_plugin_context",
    {
      title: "Очистить контекст плагина",
      description:
        "Удаляет текущий контекст плагина из памяти сервера. " +
        "После очистки инструменты, требующие контекст, потребуют повторного вызова " +
        "set_plugin_context. Используйте при переходе к другому плагину.",
      inputSchema: {},
    },
    async () => {
      const ctx = getPluginContext();
      if (!ctx) {
        return ok("Контекст уже пуст — ничего не очищено.");
      }
      const id = ctx.plugin_id;
      clearPluginContext();
      return ok(`Контекст плагина "${id}" успешно очищен.`);
    }
  );

  // -------------------------------------------------------------------
  // validate_plugin_metadata
  // -------------------------------------------------------------------
  server.registerTool(
    "validate_plugin_metadata",
    {
      title: "Валидировать метаданные плагина",
      description:
        "Проверяет корректность метаданных плагина без сохранения в контекст. " +
        "Полезен перед генерацией файла плагина. " +
        "Проверяет: формат __id__ (2-32 символа, /^[a-z][a-z0-9_-]{1,31}$/), " +
        "формат __version__ (semver), __app_version__ и __sdk_version__ (>=X.Y.Z), " +
        "наличие непустых строк в __requirements__.",
      inputSchema: {
        id: z
          .string()
          .describe("__id__ плагина для валидации"),
        name: z
          .string()
          .optional()
          .describe("__name__ плагина"),
        description: z
          .string()
          .optional()
          .describe("__description__ плагина"),
        author: z.string().optional().describe("__author__"),
        version: z
          .string()
          .optional()
          .describe("__version__ в формате semver, например 1.0.0"),
        icon: z.string().optional().describe("__icon__, например exteraPlugins/1"),
        app_version: z
          .string()
          .optional()
          .describe("__app_version__, например >=12.5.1"),
        sdk_version: z
          .string()
          .optional()
          .describe("__sdk_version__, например >=1.4.3.6"),
        requirements: z
          .array(z.string())
          .optional()
          .describe("__requirements__: массив PEP 508 строк"),
      },
    },
    async ({ id, name, description, author, version, icon, app_version, sdk_version, requirements }) => {
      const result = validateMetadata({
        id,
        name,
        description,
        author,
        version,
        icon,
        app_version,
        sdk_version,
        requirements,
      });

      if (result.valid) {
        return ok("Метаданные корректны. Все проверки пройдены.");
      }

      const errorList = result.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      return err(`Ошибки валидации метаданных:\n${errorList}`);
    }
  );
}
