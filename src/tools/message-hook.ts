/**
 * [G] Инструменты генерации хука исходящих сообщений.
 *
 * Генерирует on_send_message_hook — перехват исходящих сообщений перед отправкой.
 * Критические pitfall из документации:
 * 1. Метод называется СТРОГО on_send_message_hook
 * 2. Без self.add_on_send_message_hook() в on_plugin_load хук не активируется
 * 3. Всегда проверять isinstance(getattr(params, "message", None), str)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  pyMethod,
  lines,
  joinBlocks,
} from "../codegen/python-builder.js";
import type { HookStrategy, ToolResult } from "../types.js";
import { registerHook } from "../state/plugin-context.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [G] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerMessageHookTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_send_message_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_send_message_hook",
    {
      title: "Сгенерировать on_send_message_hook",
      description:
        "Генерирует хук перехвата исходящих сообщений перед отправкой. " +
        "Возвращает: (1) строку self.add_on_send_message_hook() для on_plugin_load, " +
        "(2) метод on_send_message_hook(account, params) -> HookResult. " +
        "ВАЖНО: без self.add_on_send_message_hook() в on_plugin_load хук МОЛЧА не работает. " +
        "ВАЖНО: всегда проверяйте isinstance(getattr(params, 'message', None), str). " +
        "params.message — текст сообщения, может отсутствовать или быть не str. " +
        "Стратегии: DEFAULT (ничего), CANCEL (отменить), MODIFY (изменить), MODIFY_FINAL (изменить+стоп). " +
        "Требует импорт: from base_plugin import HookResult, HookStrategy",
      inputSchema: {
        priority: z
          .number()
          .int()
          .optional()
          .describe("Приоритет хука (по умолчанию 0)"),
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия HookResult для возврата по умолчанию"),
        body: z
          .string()
          .optional()
          .describe(
            "Тело хука. Если не задано — генерируется шаблон с проверкой params.message."
          ),
      },
    },
    async ({ priority, strategy, body }) => {
      const pr = priority ?? 0;
      const prArg = pr !== 0 ? `priority=${pr}` : "";

      const registration = lines(
        "# Вставить в on_plugin_load:",
        prArg
          ? `self.add_on_send_message_hook(${prArg})`
          : "self.add_on_send_message_hook()"
      );

      let methodBody: string;
      if (body) {
        methodBody = body;
      } else {
        const strat = strategy as HookStrategy;
        if (strat === "DEFAULT") {
          methodBody = lines(
            "if not isinstance(getattr(params, \"message\", None), str):",
            "    return HookResult()",
            "",
            "# Обработайте params.message здесь",
            "return HookResult()"
          );
        } else if (strat === "CANCEL") {
          methodBody = lines(
            "if not isinstance(getattr(params, \"message\", None), str):",
            "    return HookResult()",
            "",
            "# Условие для отмены:",
            "if False:",
            "    return HookResult(strategy=HookStrategy.CANCEL)",
            "return HookResult()"
          );
        } else {
          methodBody = lines(
            "if not isinstance(getattr(params, \"message\", None), str):",
            "    return HookResult()",
            "",
            "# Изменяйте params.message здесь:",
            "# params.message = params.message.replace(\"old\", \"new\")",
            "",
            `return HookResult(strategy=HookStrategy.${strat}, params=params)`
          );
        }
      }

      const method = pyMethod(
        "on_send_message_hook",
        ["self", "account: int", "params"],
        methodBody,
        [],
        "HookResult"
      );

      const importLine =
        "# Нужен импорт: from base_plugin import HookResult, HookStrategy";

      // Отмечаем хук в состоянии (если контекст установлен)
      try {
        registerHook("on_send_message");
      } catch {
        // Контекст не установлен — продолжаем без регистрации
      }

      return ok(joinBlocks(importLine, registration, method));
    }
  );

  // -------------------------------------------------------------------
  // generate_hook_result
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_hook_result",
    {
      title: "Сгенерировать HookResult",
      description:
        "Генерирует конструктор HookResult для возврата из любого метода хука. " +
        "DEFAULT: HookResult() — ничего не делать. " +
        "CANCEL: HookResult(strategy=HookStrategy.CANCEL) — отменить. " +
        "MODIFY: HookResult(strategy=HookStrategy.MODIFY, params=params) — изменить. " +
        "MODIFY_FINAL: то же + остановить цепочку хуков. " +
        "payload_type: request, response, update, updates, params — в зависимости от хука.",
      inputSchema: {
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия"),
        payload_var: z
          .string()
          .optional()
          .describe(
            "Имя переменной payload (для MODIFY/MODIFY_FINAL). По умолчанию params."
          ),
        payload_type: z
          .enum(["request", "response", "update", "updates", "params"])
          .optional()
          .describe("Тип payload. По умолчанию params."),
      },
    },
    async ({ strategy, payload_var, payload_type }) => {
      const strat = strategy as HookStrategy;

      if (strat === "DEFAULT") {
        return ok("HookResult()");
      }
      if (strat === "CANCEL") {
        return ok("HookResult(strategy=HookStrategy.CANCEL)");
      }

      const pType = payload_type ?? "params";
      const pVar = payload_var ?? pType;

      return ok(
        `HookResult(strategy=HookStrategy.${strat}, ${pType}=${pVar})`
      );
    }
  );
}
