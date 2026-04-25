/**
 * [E] Инструменты генерации пунктов контекстного меню.
 *
 * Генерирует вызовы self.add_menu_item(MenuItemData(...)) для вставки
 * в метод on_plugin_load. Включает шаблон callback-функции с документацией
 * по доступным ключам context dict.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  lines,
  pyMethod,
  pyString,
  joinBlocks,
} from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [E] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerMenuTools(server: McpServer): void {
  server.registerTool(
    "generate_menu_item",
    {
      title: "Сгенерировать пункт меню",
      description:
        "Генерирует вызов self.add_menu_item(MenuItemData(...)) для вставки в on_plugin_load, " +
        "а также шаблон callback-метода. " +
        "Типы меню: MESSAGE_CONTEXT_MENU (долгое нажатие на сообщение), " +
        "DRAWER_MENU (боковое меню), CHAT_ACTION_MENU (действия в чате), " +
        "PROFILE_ACTION_MENU (профиль/канал). " +
        "Требует импорт: from base_plugin import MenuItemData, MenuItemType. " +
        "Context dict ключи: account, context, fragment, dialog_id, user, userId, " +
        "userFull, chat, chatId, chatFull, encryptedChat, message, groupedMessages, botInfo.",
      inputSchema: {
        menu_type: z
          .enum([
            "MESSAGE_CONTEXT_MENU",
            "DRAWER_MENU",
            "CHAT_ACTION_MENU",
            "PROFILE_ACTION_MENU",
          ])
          .describe("Тип меню"),
        text: z.string().describe("Отображаемый текст пункта меню"),
        callback: z
          .string()
          .describe("Имя callback-метода класса плагина"),
        item_id: z
          .string()
          .optional()
          .describe("Необязательный идентификатор пункта"),
        icon: z
          .string()
          .optional()
          .describe("Drawable name иконки, например msg_edit"),
        subtext: z.string().optional().describe("Подпись под текстом"),
        condition: z
          .string()
          .optional()
          .describe(
            "Python-выражение (bool): когда показывать пункт. Получает context dict."
          ),
        priority: z
          .number()
          .int()
          .optional()
          .describe("Приоритет сортировки пунктов"),
      },
    },
    async ({ menu_type, text, callback, item_id, icon, subtext, condition, priority }) => {
      // Строим аргументы MenuItemData
      const args: string[] = [
        `menu_type=MenuItemType.${menu_type}`,
        `text=${pyString(text)}`,
        `on_click=self.${callback}`,
      ];

      if (item_id) args.push(`item_id=${pyString(item_id)}`);
      if (icon) args.push(`icon=${pyString(icon)}`);
      if (subtext) args.push(`subtext=${pyString(subtext)}`);
      if (condition) args.push(`condition=${condition}`);
      if (priority !== undefined) args.push(`priority=${priority}`);

      const addCallArgs = args.join(",\n    ");
      const addCall = lines(
        "# Вставить в on_plugin_load:",
        `self.add_menu_item(MenuItemData(\n    ${addCallArgs},\n))`
      );

      // Шаблон callback-метода с документацией ключей context
      const callbackComment = lines(
        `# Ключи context dict: account, context, fragment, dialog_id,`,
        `# user, userId, userFull, chat, chatId, chatFull,`,
        `# encryptedChat, message, groupedMessages, botInfo`
      );

      let callbackBody: string;
      if (menu_type === "MESSAGE_CONTEXT_MENU") {
        callbackBody = lines(
          callbackComment,
          "message = context.get(\"message\")",
          "user = context.get(\"user\")",
          "dialog_id = context.get(\"dialog_id\")",
          "account = context.get(\"account\")",
          "pass"
        );
      } else {
        callbackBody = lines(
          callbackComment,
          "account = context.get(\"account\")",
          "dialog_id = context.get(\"dialog_id\")",
          "pass"
        );
      }

      const callbackMethod = pyMethod(
        callback,
        ["self", "context: dict"],
        callbackBody
      );

      const importLine =
        "# Нужен импорт: from base_plugin import MenuItemData, MenuItemType";

      return ok(joinBlocks(importLine, addCall, callbackMethod));
    }
  );
}
