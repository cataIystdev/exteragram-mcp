/**
 * [L] Инструменты генерации текстового форматирования.
 *
 * Генерирует вызовы parse_text для конвертации HTML/Markdown
 * в plain text с TLRPC.MessageEntity объектами.
 * Включает справочник поддерживаемых тегов.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { joinBlocks } from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/** Таблица поддерживаемых HTML-тегов */
const HTML_TAGS = [
  { tag: "<b>, <strong>", format: "Жирный" },
  { tag: "<i>, <em>", format: "Курсив" },
  { tag: "<u>", format: "Подчёркнутый" },
  { tag: '<s>, <del>, <strike>', format: "Зачёркнутый" },
  { tag: '<a href="...">', format: "Текстовая ссылка" },
  { tag: "<code>", format: "Инлайн-код" },
  { tag: '<pre language="...">', format: "Блок кода (язык опционален)" },
  { tag: "<spoiler>, <tg-spoiler>", format: "Спойлер" },
  { tag: "<blockquote>", format: "Цитата" },
  { tag: "<blockquote expandable>", format: "Раскрываемая цитата" },
  { tag: "<blockquote collapsed>", format: "Свёрнутая цитата" },
  { tag: '<emoji id="...">', format: "Кастомный эмодзи" },
];

/** Таблица поддерживаемого Markdown-синтаксиса */
const MARKDOWN_SYNTAX = [
  { syntax: "*bold*", format: "Жирный" },
  { syntax: "_italic_", format: "Курсив" },
  { syntax: "__underline__", format: "Подчёркнутый" },
  { syntax: "~strikethrough~", format: "Зачёркнутый" },
  { syntax: "`code`", format: "Инлайн-код" },
  { syntax: "```code block```", format: "Блок кода" },
  { syntax: "```python ... ```", format: "Блок кода с языком" },
  { syntax: "||spoiler||", format: "Спойлер" },
  { syntax: "[text](url)", format: "Ссылка" },
  { syntax: "![alt](tg://emoji?id=X)", format: "Кастомный эмодзи" },
  { syntax: "> Quote", format: "Цитата" },
  { syntax: "**> Quote", format: "Раскрываемая цитата" },
];

/**
 * Регистрирует все инструменты группы [L] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerTextFormattingTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_parse_text
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_parse_text",
    {
      title: "Сгенерировать парсинг текста",
      description:
        "Генерирует parse_text(text, parse_mode, is_caption) для конвертации " +
        "HTML или Markdown в plain text + список TLRPC.MessageEntity. " +
        "Результат: dict с ключами 'message' (или 'caption' если is_caption=True) и 'entities'. " +
        "Используется для ручной работы с entities; send_text/send_photo " +
        "принимают parse_mode напрямую и не требуют явного вызова parse_text. " +
        "Требует импорт: from extera_utils.text_formatting import parse_text",
      inputSchema: {
        text_expr: z
          .string()
          .describe("Python-выражение входного текста"),
        parse_mode: z
          .enum(["HTML", "Markdown"])
          .describe("Режим парсинга"),
        is_caption: z
          .boolean()
          .optional()
          .describe(
            "Вернуть ключ 'caption' вместо 'message' (для медиа-сообщений)"
          ),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'parsed')"),
      },
    },
    async ({ text_expr, parse_mode, is_caption, var_name }) => {
      const varName = var_name ?? "parsed";
      const importLine =
        "# Нужен импорт: from extera_utils.text_formatting import parse_text";

      const args: string[] = [`${text_expr}`, `parse_mode="${parse_mode}"`];
      if (is_caption) args.push("is_caption=True");

      const resultKey = is_caption ? "caption" : "message";

      const code = [
        `${varName} = parse_text(${args.join(", ")})`,
        `# ${varName}["${resultKey}"] — plain text без тегов`,
        `# ${varName}["entities"] — список TLRPC.MessageEntity`,
      ].join("\n");

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // list_html_tags
  // -------------------------------------------------------------------
  server.registerTool(
    "list_html_tags",
    {
      title: "Справочник HTML-тегов и Markdown",
      description:
        "Возвращает таблицу всех поддерживаемых HTML-тегов и Markdown-синтаксиса " +
        "для форматирования текста в Telegram через parse_text / parse_mode.",
      inputSchema: {},
    },
    async () => {
      const htmlTable = HTML_TAGS.map(
        ({ tag, format }) => `  ${tag.padEnd(36)} -> ${format}`
      ).join("\n");

      const mdTable = MARKDOWN_SYNTAX.map(
        ({ syntax, format }) => `  ${syntax.padEnd(28)} -> ${format}`
      ).join("\n");

      const tlEntityTypes =
        "TLEntityType enum (from extera_utils.text_formatting import TLEntityType):\n" +
        "  CODE, PRE, STRIKETHROUGH, TEXT_LINK, BOLD, ITALIC, UNDERLINE, SPOILER, CUSTOM_EMOJI, BLOCKQUOTE";

      return ok(
        `HTML теги (parse_mode="HTML"):\n\n${htmlTable}\n\n` +
          `Markdown синтаксис (parse_mode="Markdown"):\n\n${mdTable}\n\n` +
          tlEntityTypes
      );
    }
  );
}
