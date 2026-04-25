/**
 * [O] Инструменты генерации модальных диалогов.
 *
 * Генерирует AlertDialogBuilder — модальные диалоги в стиле Telegram
 * поверх текущего фрагмента. Поддерживает все типы диалогов,
 * кнопки, слушатели, прогресс и кастомные View.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pyString, joinBlocks } from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [O] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerAlertDialogTools(server: McpServer): void {
  server.registerTool(
    "generate_alert_dialog",
    {
      title: "Сгенерировать AlertDialog",
      description:
        "Генерирует блок AlertDialogBuilder — модального диалога поверх текущего фрагмента. " +
        "Типы: message (стандартный), loading (горизонтальный прогресс-бар), " +
        "spinner (indeterminate spinner). " +
        "Константы кнопок: AlertDialogBuilder.BUTTON_POSITIVE, BUTTON_NEGATIVE. " +
        "make_positive_red/make_negative_red окрашивает кнопку в красный. " +
        "set_progress(0-100) только для loading-диалогов. " +
        "Callback кнопки получает (builder, which). " +
        "Требует импорт: from ui.alert import AlertDialogBuilder; from client_utils import get_last_fragment",
      inputSchema: {
        dialog_type: z
          .enum(["message", "loading", "spinner"])
          .describe("Тип диалога"),
        title: z.string().optional().describe("Заголовок"),
        message: z.string().optional().describe("Текст сообщения"),
        positive_btn: z
          .object({
            text: z.string(),
            callback: z.string().describe("Имя callback-функции или 'None'"),
          })
          .optional()
          .describe("Позитивная кнопка"),
        negative_btn: z
          .object({
            text: z.string(),
            callback: z.string().describe("Имя callback-функции или 'None'"),
          })
          .optional()
          .describe("Негативная кнопка"),
        neutral_btn: z
          .object({
            text: z.string(),
            callback: z.string().describe("Имя callback-функции или 'None'"),
          })
          .optional()
          .describe("Нейтральная кнопка"),
        cancelable: z
          .boolean()
          .optional()
          .describe("Закрывать по кнопке назад (по умолчанию true)"),
        dim_enabled: z
          .boolean()
          .optional()
          .describe("Затемнение фона"),
        blurred_bg: z
          .boolean()
          .optional()
          .describe("Размытый фон"),
        make_positive_red: z
          .boolean()
          .optional()
          .describe("Красная позитивная кнопка"),
        make_negative_red: z
          .boolean()
          .optional()
          .describe("Красная негативная кнопка"),
        set_view: z
          .string()
          .optional()
          .describe("Python-выражение View для вставки в диалог"),
        on_dismiss: z
          .string()
          .optional()
          .describe("Имя callback при закрытии"),
        on_cancel: z
          .string()
          .optional()
          .describe("Имя callback при отмене"),
        with_progress_update: z
          .boolean()
          .optional()
          .describe("Добавить пример set_progress(75) для loading-диалогов"),
      },
    },
    async ({
      dialog_type,
      title,
      message,
      positive_btn,
      negative_btn,
      neutral_btn,
      cancelable,
      dim_enabled,
      blurred_bg,
      make_positive_red,
      make_negative_red,
      set_view,
      on_dismiss,
      on_cancel,
      with_progress_update,
    }) => {
      const importLine =
        "# Нужен импорт: from ui.alert import AlertDialogBuilder\n" +
        "# Нужен импорт: from client_utils import get_last_fragment";

      const typeConst =
        dialog_type === "message"
          ? "AlertDialogBuilder.ALERT_TYPE_MESSAGE"
          : dialog_type === "loading"
          ? "AlertDialogBuilder.ALERT_TYPE_LOADING"
          : "AlertDialogBuilder.ALERT_TYPE_SPINNER";

      const builderLines: string[] = [
        "activity = get_last_fragment().getParentActivity()",
        `builder = AlertDialogBuilder(activity, ${typeConst})`,
      ];

      if (title) {
        builderLines.push(`builder.set_title(${pyString(title)})`);
      }
      if (message) {
        builderLines.push(`builder.set_message(${pyString(message)})`);
      }
      if (set_view) {
        builderLines.push(`builder.set_view(${set_view})`);
      }

      if (positive_btn) {
        const cb = positive_btn.callback === "None" ? "None" : positive_btn.callback;
        builderLines.push(
          `builder.set_positive_button(${pyString(positive_btn.text)}, ${cb})`
        );
      }
      if (negative_btn) {
        const cb = negative_btn.callback === "None" ? "None" : negative_btn.callback;
        builderLines.push(
          `builder.set_negative_button(${pyString(negative_btn.text)}, ${cb})`
        );
      }
      if (neutral_btn) {
        const cb = neutral_btn.callback === "None" ? "None" : neutral_btn.callback;
        builderLines.push(
          `builder.set_neutral_button(${pyString(neutral_btn.text)}, ${cb})`
        );
      }

      if (make_positive_red) {
        builderLines.push(
          "builder.make_button_red(AlertDialogBuilder.BUTTON_POSITIVE)"
        );
      }
      if (make_negative_red) {
        builderLines.push(
          "builder.make_button_red(AlertDialogBuilder.BUTTON_NEGATIVE)"
        );
      }
      if (cancelable === false) {
        builderLines.push("builder.set_cancelable(False)");
      }
      if (dim_enabled === false) {
        builderLines.push("builder.set_dim_enabled(False)");
      }
      if (blurred_bg) {
        builderLines.push("builder.set_blurred_background(True)");
      }
      if (on_dismiss) {
        builderLines.push(`builder.set_on_dismiss_listener(${on_dismiss})`);
      }
      if (on_cancel) {
        builderLines.push(`builder.set_on_cancel_listener(${on_cancel})`);
      }

      builderLines.push("builder.show()");

      if (with_progress_update && dialog_type === "loading") {
        builderLines.push(
          "",
          "# Позже для обновления прогресса (0-100):",
          "# builder.set_progress(75)",
          "# builder.dismiss()"
        );
      }

      const code = builderLines.join("\n");
      return ok(joinBlocks(importLine, code));
    }
  );
}
