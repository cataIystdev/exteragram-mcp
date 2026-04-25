/**
 * [I] Инструменты генерации Android-утилит.
 *
 * Генерирует обёртки над Android-специфичными API:
 * выполнение на UI-потоке, слушатели событий View, Runnable,
 * копирование в буфер обмена, логирование.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lines, pyMethod, joinBlocks } from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [I] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerAndroidUtilsTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_ui_thread_call
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_ui_thread_call",
    {
      title: "Сгенерировать выполнение на UI-потоке",
      description:
        "Генерирует run_on_ui_thread(func, delay) для выполнения кода на главном потоке Android. " +
        "ОБЯЗАТЕЛЬНО для любых изменений View/UI компонентов из хуков. " +
        "Хуки выполняются НЕ на UI-потоке — прямой вызов UI-методов вызовет краш. " +
        "delay — задержка в миллисекундах (необязательно). " +
        "Требует импорт: from android_utils import run_on_ui_thread",
      inputSchema: {
        callable_expr: z
          .string()
          .describe("Python-выражение callable или лямбда"),
        delay_ms: z
          .number()
          .int()
          .optional()
          .describe("Задержка в миллисекундах (по умолчанию 0)"),
      },
    },
    async ({ callable_expr, delay_ms }) => {
      const importLine =
        "# Нужен импорт: from android_utils import run_on_ui_thread";
      let call: string;

      if (delay_ms && delay_ms > 0) {
        call = `run_on_ui_thread(${callable_expr}, delay=${delay_ms})`;
      } else {
        call = `run_on_ui_thread(${callable_expr})`;
      }

      return ok(joinBlocks(importLine, call));
    }
  );

  // -------------------------------------------------------------------
  // generate_click_listener
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_click_listener",
    {
      title: "Сгенерировать слушатель кликов",
      description:
        "Генерирует OnClickListener или OnLongClickListener для Android View. " +
        "OnClickListener: callback(view) — view является нажатым элементом. " +
        "OnLongClickListener: callback(view) — должен вернуть bool " +
        "(True = событие поглощено, False = продолжить обработку). " +
        "Требует импорт: from android_utils import OnClickListener (или OnLongClickListener)",
      inputSchema: {
        type: z
          .enum(["click", "long_click"])
          .describe("Тип слушателя"),
        handler_name: z
          .string()
          .describe("Имя callback-функции"),
        target_var: z
          .string()
          .optional()
          .describe("Переменная View для setOnClickListener (опционально)"),
      },
    },
    async ({ type, handler_name, target_var }) => {
      if (type === "click") {
        const handlerBody = lines(
          "# view — нажатый View",
          "pass"
        );
        const handlerFn = pyMethod(
          handler_name,
          ["view"],
          handlerBody
        );

        const listenerExpr = `OnClickListener(${handler_name})`;
        const setCall = target_var
          ? `${target_var}.setOnClickListener(${listenerExpr})`
          : listenerExpr;

        const importLine =
          "# Нужен импорт: from android_utils import OnClickListener";

        return ok(joinBlocks(importLine, handlerFn, setCall));
      } else {
        const handlerBody = lines(
          "# view — нажатый View",
          "# Вернуть True = событие поглощено, False = продолжить обработку",
          "return True"
        );
        const handlerFn = pyMethod(
          handler_name,
          ["view"],
          handlerBody
        );

        const listenerExpr = `OnLongClickListener(${handler_name})`;
        const setCall = target_var
          ? `${target_var}.setOnLongClickListener(${listenerExpr})`
          : listenerExpr;

        const importLine =
          "# Нужен импорт: from android_utils import OnLongClickListener";

        return ok(joinBlocks(importLine, handlerFn, setCall));
      }
    }
  );

  // -------------------------------------------------------------------
  // generate_runnable
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_runnable",
    {
      title: "Сгенерировать Runnable",
      description:
        "Генерирует R(callable) — обёртку Python-функции в Java Runnable. " +
        "Используется для передачи в Android API, ожидающие Runnable: " +
        "view.post(runnable), handler.postDelayed(runnable, delay) и т.д. " +
        "Требует импорт: from android_utils import R",
      inputSchema: {
        callable_expr: z
          .string()
          .describe("Python-выражение callable"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной Runnable (по умолчанию 'runnable')"),
        post_to: z
          .string()
          .optional()
          .describe(
            "Python-выражение View для .post(runnable) (опционально)"
          ),
      },
    },
    async ({ callable_expr, var_name, post_to }) => {
      const varName = var_name ?? "runnable";
      const importLine = "# Нужен импорт: from android_utils import R";
      const runnableLine = `${varName} = R(${callable_expr})`;

      if (post_to) {
        return ok(
          joinBlocks(importLine, lines(runnableLine, `${post_to}.post(${varName})`))
        );
      }

      return ok(joinBlocks(importLine, runnableLine));
    }
  );

  // -------------------------------------------------------------------
  // generate_clipboard_copy
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_clipboard_copy",
    {
      title: "Сгенерировать копирование в буфер",
      description:
        "Генерирует copy_to_clipboard(text) — копирует строку в буфер обмена Android. " +
        "Автоматически показывает bulletin 'Скопировано' после копирования. " +
        "Требует импорт: from android_utils import copy_to_clipboard",
      inputSchema: {
        text_expr: z
          .string()
          .describe("Python-выражение строки для копирования"),
      },
    },
    async ({ text_expr }) => {
      const importLine =
        "# Нужен импорт: from android_utils import copy_to_clipboard";
      return ok(joinBlocks(importLine, `copy_to_clipboard(${text_expr})`));
    }
  );

  // -------------------------------------------------------------------
  // generate_log
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_log",
    {
      title: "Сгенерировать логирование",
      description:
        "Генерирует log(data) для отладки. " +
        "Простые типы (str, int, float, bool, None) выводятся как текст. " +
        "Сложные объекты (Java/Android) передаются в Java object inspector. " +
        "Также доступен self.log() из BasePlugin (без импорта android_utils). " +
        "Требует импорт: from android_utils import log",
      inputSchema: {
        data_expr: z
          .string()
          .describe("Python-выражение данных для логирования"),
        use_self: z
          .boolean()
          .optional()
          .describe(
            "Использовать self.log() вместо log() (не требует импорта, только внутри класса)"
          ),
      },
    },
    async ({ data_expr, use_self }) => {
      if (use_self) {
        return ok(`self.log(${data_expr})`);
      }
      const importLine = "# Нужен импорт: from android_utils import log";
      return ok(joinBlocks(importLine, `log(${data_expr})`));
    }
  );
}
