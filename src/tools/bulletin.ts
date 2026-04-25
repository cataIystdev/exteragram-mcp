/**
 * [P] Инструменты генерации bulletin-уведомлений.
 *
 * Генерирует вызовы BulletinHelper — небольших уведомлений в нижней части экрана.
 * Все методы BulletinHelper автоматически выполняются на UI-потоке.
 * Поддерживает 11 типов: info, error, success, simple, two_line,
 * with_button, undo, copied, link_copied, file_gallery, file_downloads.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { pyString, joinBlocks } from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [P] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerBulletinTools(server: McpServer): void {
  server.registerTool(
    "generate_bulletin",
    {
      title: "Сгенерировать Bulletin",
      description:
        "Генерирует вызов BulletinHelper для показа уведомления в нижней части экрана. " +
        "Все методы автоматически выполняются на UI-потоке. " +
        "Типы: info/error/success (стандартные), simple (с иконкой), " +
        "two_line (двухстрочный), with_button (с кнопкой действия), " +
        "undo (с возможностью отмены), copied (скопировано), " +
        "link_copied (ссылка скопирована), file_gallery (сохранено в галерею), " +
        "file_downloads (сохранено в загрузки). " +
        "Длительности: SHORT=1500ms, LONG=2750ms, PROLONG=5000ms (по умолчанию). " +
        "icon_res_id: из R_tg (from org.telegram.messenger import R as R_tg). " +
        "Требует импорт: from ui.bulletin import BulletinHelper",
      inputSchema: {
        type: z
          .enum([
            "info",
            "error",
            "success",
            "simple",
            "two_line",
            "with_button",
            "undo",
            "copied",
            "link_copied",
            "file_gallery",
            "file_downloads",
          ])
          .describe("Тип bulletin"),
        message: z
          .string()
          .optional()
          .describe("Текст (для info/error/success/simple/with_button/copied)"),
        title: z
          .string()
          .optional()
          .describe("Заголовок (для two_line)"),
        subtitle: z
          .string()
          .optional()
          .describe("Подзаголовок (для two_line и undo)"),
        icon_res_id: z
          .string()
          .optional()
          .describe(
            "Python-выражение int icon_res_id (для simple/two_line/with_button). " +
              "Пример: R_tg.raw.timer"
          ),
        button_text: z
          .string()
          .optional()
          .describe("Текст кнопки (для with_button)"),
        on_click: z
          .string()
          .optional()
          .describe("Callback нажатия кнопки (для with_button)"),
        on_undo: z
          .string()
          .optional()
          .describe("Callback отмены (для undo, обязателен)"),
        on_action: z
          .string()
          .optional()
          .describe("Callback подтверждения (для undo, опционален)"),
        is_private_link: z
          .boolean()
          .optional()
          .describe("Приватная ссылка (для link_copied)"),
        is_video: z
          .boolean()
          .optional()
          .describe("Видео вместо фото (для file_gallery)"),
        amount: z
          .number()
          .int()
          .optional()
          .describe("Количество файлов (для file_gallery/file_downloads)"),
        file_type: z
          .string()
          .optional()
          .describe("Тип файла enum (для file_downloads, например UNKNOWN)"),
        duration: z
          .enum(["SHORT", "LONG", "PROLONG"])
          .optional()
          .describe("Длительность (по умолчанию PROLONG)"),
        fragment: z
          .string()
          .optional()
          .describe("Python-выражение фрагмента (по умолчанию опускается)"),
      },
    },
    async ({
      type,
      message,
      title,
      subtitle,
      icon_res_id,
      button_text,
      on_click,
      on_undo,
      on_action,
      is_private_link,
      is_video,
      amount,
      file_type,
      duration,
      fragment,
    }) => {
      const importLine = "# Нужен импорт: from ui.bulletin import BulletinHelper";
      const durationExpr = duration
        ? `BulletinHelper.DURATION_${duration}`
        : null;

      let call: string;

      const fragArg = fragment ? `, fragment=${fragment}` : "";

      switch (type) {
        case "info":
          call = `BulletinHelper.show_info(${pyString(message ?? "")}${fragArg})`;
          break;

        case "error":
          call = `BulletinHelper.show_error(${pyString(message ?? "")}${fragArg})`;
          break;

        case "success":
          call = `BulletinHelper.show_success(${pyString(message ?? "")}${fragArg})`;
          break;

        case "simple": {
          const args: string[] = [
            pyString(message ?? ""),
            icon_res_id ?? "0",
          ];
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_simple(${args.join(", ")})`;
          break;
        }

        case "two_line": {
          const args: string[] = [
            pyString(title ?? ""),
            pyString(subtitle ?? ""),
            icon_res_id ?? "0",
          ];
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_two_line(${args.join(", ")})`;
          break;
        }

        case "with_button": {
          const args: string[] = [
            pyString(message ?? ""),
            icon_res_id ?? "0",
            pyString(button_text ?? ""),
            on_click ?? "None",
          ];
          if (fragment) args.push(`fragment=${fragment}`);
          if (durationExpr) args.push(`duration=${durationExpr}`);
          call = `BulletinHelper.show_with_button(${args.join(", ")})`;
          break;
        }

        case "undo": {
          const argsObj: string[] = [
            pyString(message ?? ""),
            `on_undo=${on_undo ?? "lambda: None"}`,
          ];
          if (on_action) argsObj.push(`on_action=${on_action}`);
          if (subtitle) argsObj.push(`subtitle=${pyString(subtitle)}`);
          if (fragment) argsObj.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_undo(${argsObj.join(", ")})`;
          break;
        }

        case "copied": {
          const args: string[] = [];
          if (message) args.push(pyString(message));
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_copied_to_clipboard(${args.join(", ")})`;
          break;
        }

        case "link_copied": {
          const args: string[] = [];
          if (is_private_link) args.push("is_private_link_info=True");
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_link_copied(${args.join(", ")})`;
          break;
        }

        case "file_gallery": {
          const args: string[] = [];
          if (is_video) args.push("is_video=True");
          if (amount !== undefined && amount !== 1) args.push(`amount=${amount}`);
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_file_saved_to_gallery(${args.join(", ")})`;
          break;
        }

        case "file_downloads": {
          const args: string[] = [];
          if (file_type) args.push(`file_type_enum_name=${pyString(file_type)}`);
          if (amount !== undefined && amount !== 1) args.push(`amount=${amount}`);
          if (fragment) args.push(`fragment=${fragment}`);
          call = `BulletinHelper.show_file_saved_to_downloads(${args.join(", ")})`;
          break;
        }

        default:
          call = `BulletinHelper.show_info(${pyString(message ?? "")})`;
      }

      return ok(joinBlocks(importLine, call));
    }
  );
}
