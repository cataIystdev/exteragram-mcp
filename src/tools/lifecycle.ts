/**
 * [C] Инструменты генерации методов жизненного цикла плагина.
 *
 * Генерирует on_plugin_load, on_plugin_unload и on_app_event.
 * on_plugin_load — ключевое место регистрации хуков, слушателей и меню.
 * Включает документирующие комментарии о назначении каждого метода.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  pyMethod,
  lines,
  ifElif,
} from "../codegen/python-builder.js";
import type { AppEvent, ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [C] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerLifecycleTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_on_plugin_load
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_on_plugin_load",
    {
      title: "Сгенерировать on_plugin_load",
      description:
        "Генерирует метод on_plugin_load для класса плагина. " +
        "Вызывается при включении плагина или запуске приложения. " +
        "ОБЯЗАТЕЛЬНОЕ место для регистрации: self.add_hook(...), " +
        "self.add_on_send_message_hook(), self.add_menu_item(...), self.hook_method(...). " +
        "Без вызова add_hook / add_on_send_message_hook хуки не активируются " +
        "даже при определении соответствующих методов.",
      inputSchema: {
        body: z
          .string()
          .optional()
          .describe(
            "Тело метода (Python-код). Если не задано — генерируется заготовка с pass."
          ),
      },
    },
    async ({ body }) => {
      const methodBody = body
        ? body
        : lines(
            "# Регистрируйте здесь хуки, слушатели, меню и фоновые задачи.",
            "# Пример: self.add_on_send_message_hook()",
            "# Пример: self.add_hook(\"messages.sendMessage\")",
            "# Пример: self.add_menu_item(MenuItemData(...))",
            "pass"
          );

      return ok(
        pyMethod("on_plugin_load", ["self"], methodBody)
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_on_plugin_unload
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_on_plugin_unload",
    {
      title: "Сгенерировать on_plugin_unload",
      description:
        "Генерирует метод on_plugin_unload для класса плагина. " +
        "Вызывается при отключении плагина или завершении приложения. " +
        "Используйте для очистки ресурсов: unhook_method, отмена подписок, " +
        "сохранение состояния. Xposed-хуки НЕ снимаются автоматически — " +
        "вызывайте self.unhook_method(hook_obj) явно.",
      inputSchema: {
        body: z
          .string()
          .optional()
          .describe(
            "Тело метода (Python-код). Если не задано — генерируется заготовка с pass."
          ),
      },
    },
    async ({ body }) => {
      const methodBody = body
        ? body
        : lines(
            "# Освободите ресурсы: снимите Xposed-хуки, отмените подписки.",
            "# Пример: self.unhook_method(self._my_hook)",
            "pass"
          );

      return ok(
        pyMethod("on_plugin_unload", ["self"], methodBody)
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_on_app_event
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_on_app_event",
    {
      title: "Сгенерировать on_app_event",
      description:
        "Генерирует метод on_app_event(event_type: AppEvent) для класса плагина. " +
        "Вызывается при изменении состояния приложения. " +
        "Доступные события: START (запуск), STOP (завершение), " +
        "PAUSE (фон), RESUME (передний план). " +
        "Требует импорт: from base_plugin import AppEvent",
      inputSchema: {
        events: z
          .array(z.enum(["START", "STOP", "PAUSE", "RESUME"]))
          .min(1)
          .describe("Список событий для обработки"),
      },
    },
    async ({ events }) => {
      const branches: Array<[string, string]> = (events as AppEvent[]).map(
        (event) => [
          `event_type == AppEvent.${event}`,
          "pass",
        ]
      );

      const methodBody = lines(
        ifElif(branches)
      );

      const code = lines(
        "# Нужен импорт: from base_plugin import AppEvent",
        pyMethod(
          "on_app_event",
          ["self", "event_type: AppEvent"],
          methodBody
        )
      );

      return ok(code);
    }
  );
}
