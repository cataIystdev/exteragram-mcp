/**
 * [F] Инструменты генерации хуков запросов и обновлений.
 *
 * Генерирует pre_request_hook, post_request_hook, on_update_hook, on_updates_hook.
 * Каждый инструмент возвращает ДВА блока кода:
 * 1. Регистрационный вызов для on_plugin_load
 * 2. Тело метода хука
 *
 * КРИТИЧНО: без вызова self.add_hook(name) в on_plugin_load хук не сработает,
 * даже если метод определён в классе плагина.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  pyMethod,
  lines,
  joinBlocks,
  pyString,
} from "../codegen/python-builder.js";
import type { HookStrategy, ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/** Строит базовое тело HookResult по стратегии и типу payload */
function buildHookResult(
  strategy: HookStrategy,
  payloadType: string,
  payloadVar: string
): string {
  if (strategy === "DEFAULT") {
    return "return HookResult()";
  }
  if (strategy === "CANCEL") {
    return `return HookResult(strategy=HookStrategy.CANCEL)`;
  }
  return `return HookResult(strategy=HookStrategy.${strategy}, ${payloadType}=${payloadVar})`;
}

/** Строит регистрационный вызов add_hook */
function buildAddHook(
  hookName: string,
  matchSubstring: boolean,
  priority: number
): string {
  const args: string[] = [pyString(hookName)];
  if (matchSubstring) args.push("match_substring=True");
  if (priority !== 0) args.push(`priority=${priority}`);
  return `self.add_hook(${args.join(", ")})`;
}

/**
 * Регистрирует все инструменты группы [F] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerRequestHookTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_pre_request_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_pre_request_hook",
    {
      title: "Сгенерировать pre_request_hook",
      description:
        "Генерирует хук перехвата Telegram-запроса ДО отправки на сервер. " +
        "Возвращает: (1) строку регистрации для on_plugin_load, " +
        "(2) метод pre_request_hook(request_name, account, request) -> HookResult. " +
        "ВАЖНО: вставить self.add_hook(...) в on_plugin_load — иначе хук не сработает. " +
        "match_substring=True позволяет матчить подстроку в имени запроса. " +
        "Требует импорт: from base_plugin import HookResult, HookStrategy",
      inputSchema: {
        hook_name: z
          .string()
          .describe(
            "Имя запроса для фильтрации, например messages.sendMessage"
          ),
        match_substring: z
          .boolean()
          .optional()
          .describe("Матчить как подстроку (по умолчанию false)"),
        priority: z
          .number()
          .int()
          .optional()
          .describe("Приоритет хука (по умолчанию 0)"),
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия HookResult"),
        body: z
          .string()
          .optional()
          .describe("Тело хука. Если не задано — генерируется шаблон."),
      },
    },
    async ({ hook_name, match_substring, priority, strategy, body }) => {
      const ms = match_substring ?? false;
      const pr = priority ?? 0;

      const registration = lines(
        "# Вставить в on_plugin_load:",
        buildAddHook(hook_name, ms, pr)
      );

      let methodBody: string;
      if (body) {
        methodBody = body;
      } else {
        methodBody = lines(
          `if request_name == ${pyString(hook_name)}:`,
          `    # Обработайте request здесь`,
          `    ${buildHookResult(strategy as HookStrategy, "request", "request")}`,
          "return HookResult()"
        );
      }

      const method = pyMethod(
        "pre_request_hook",
        ["self", "request_name: str", "account: int", "request"],
        methodBody,
        [],
        "HookResult"
      );

      const importLine =
        "# Нужен импорт: from base_plugin import HookResult, HookStrategy";

      return ok(joinBlocks(importLine, registration, method));
    }
  );

  // -------------------------------------------------------------------
  // generate_post_request_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_post_request_hook",
    {
      title: "Сгенерировать post_request_hook",
      description:
        "Генерирует хук обработки ответа Telegram-запроса ПОСЛЕ получения ответа. " +
        "Параметры: request_name, account, response (TLObject или None), error (TLObject или None). " +
        "Возвращает: (1) строку регистрации для on_plugin_load, (2) метод хука. " +
        "ВАЖНО: вставить self.add_hook(...) в on_plugin_load. " +
        "Требует импорт: from base_plugin import HookResult, HookStrategy",
      inputSchema: {
        hook_name: z.string().describe("Имя запроса для фильтрации"),
        match_substring: z.boolean().optional(),
        priority: z.number().int().optional(),
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия HookResult"),
        body: z.string().optional().describe("Тело хука (опционально)"),
      },
    },
    async ({ hook_name, match_substring, priority, strategy, body }) => {
      const ms = match_substring ?? false;
      const pr = priority ?? 0;

      const registration = lines(
        "# Вставить в on_plugin_load:",
        buildAddHook(hook_name, ms, pr)
      );

      let methodBody: string;
      if (body) {
        methodBody = body;
      } else {
        methodBody = lines(
          `if request_name == ${pyString(hook_name)}:`,
          "    if error is not None:",
          "        return HookResult()",
          "    # Обработайте response здесь",
          `    ${buildHookResult(strategy as HookStrategy, "response", "response")}`,
          "return HookResult()"
        );
      }

      const method = pyMethod(
        "post_request_hook",
        ["self", "request_name: str", "account: int", "response", "error"],
        methodBody,
        [],
        "HookResult"
      );

      const importLine =
        "# Нужен импорт: from base_plugin import HookResult, HookStrategy";

      return ok(joinBlocks(importLine, registration, method));
    }
  );

  // -------------------------------------------------------------------
  // generate_on_update_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_on_update_hook",
    {
      title: "Сгенерировать on_update_hook",
      description:
        "Генерирует хук перехвата отдельного Telegram-обновления. " +
        "Параметры: update_name, account, update. " +
        "Возвращает: (1) строку регистрации для on_plugin_load, (2) метод хука. " +
        "Пример update_name: updateNewMessage, updateEditMessage. " +
        "ВАЖНО: вставить self.add_hook(...) в on_plugin_load. " +
        "Требует импорт: from base_plugin import HookResult, HookStrategy",
      inputSchema: {
        hook_name: z
          .string()
          .describe("Имя обновления, например updateNewMessage"),
        match_substring: z.boolean().optional(),
        priority: z.number().int().optional(),
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия HookResult"),
        body: z.string().optional(),
      },
    },
    async ({ hook_name, match_substring, priority, strategy, body }) => {
      const ms = match_substring ?? false;
      const pr = priority ?? 0;

      const registration = lines(
        "# Вставить в on_plugin_load:",
        buildAddHook(hook_name, ms, pr)
      );

      let methodBody: string;
      if (body) {
        methodBody = body;
      } else {
        methodBody = lines(
          `if update_name == ${pyString(hook_name)}:`,
          "    # Обработайте update здесь",
          `    ${buildHookResult(strategy as HookStrategy, "update", "update")}`,
          "return HookResult()"
        );
      }

      const method = pyMethod(
        "on_update_hook",
        ["self", "update_name: str", "account: int", "update"],
        methodBody,
        [],
        "HookResult"
      );

      const importLine =
        "# Нужен импорт: from base_plugin import HookResult, HookStrategy";

      return ok(joinBlocks(importLine, registration, method));
    }
  );

  // -------------------------------------------------------------------
  // generate_on_updates_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_on_updates_hook",
    {
      title: "Сгенерировать on_updates_hook",
      description:
        "Генерирует хук перехвата контейнера Telegram-обновлений (Updates). " +
        "Параметры: container_name, account, updates. " +
        "Возвращает: (1) строку регистрации для on_plugin_load, (2) метод хука. " +
        "ВАЖНО: вставить self.add_hook(...) в on_plugin_load. " +
        "Требует импорт: from base_plugin import HookResult, HookStrategy",
      inputSchema: {
        hook_name: z
          .string()
          .describe("Имя контейнера обновлений, например Updates"),
        match_substring: z.boolean().optional(),
        priority: z.number().int().optional(),
        strategy: z
          .enum(["DEFAULT", "CANCEL", "MODIFY", "MODIFY_FINAL"])
          .describe("Стратегия HookResult"),
        body: z.string().optional(),
      },
    },
    async ({ hook_name, match_substring, priority, strategy, body }) => {
      const ms = match_substring ?? false;
      const pr = priority ?? 0;

      const registration = lines(
        "# Вставить в on_plugin_load:",
        buildAddHook(hook_name, ms, pr)
      );

      let methodBody: string;
      if (body) {
        methodBody = body;
      } else {
        methodBody = lines(
          `if container_name == ${pyString(hook_name)}:`,
          "    # Обработайте updates здесь",
          `    ${buildHookResult(strategy as HookStrategy, "updates", "updates")}`,
          "return HookResult()"
        );
      }

      const method = pyMethod(
        "on_updates_hook",
        ["self", "container_name: str", "account: int", "updates"],
        methodBody,
        [],
        "HookResult"
      );

      const importLine =
        "# Нужен импорт: from base_plugin import HookResult, HookStrategy";

      return ok(joinBlocks(importLine, registration, method));
    }
  );
}
