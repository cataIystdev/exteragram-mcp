/**
 * [J] Инструменты генерации Java-рефлексии.
 *
 * Генерирует вызовы find_class, get/set_private_field, get/set_static_private_field.
 * ВАЖНО из документации: рефлексия хрупка — всегда оборачивать в try-except
 * и проверять None. Может сломаться при обновлении приложения.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lines, tryExcept, joinBlocks } from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [J] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerHookUtilsTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_find_class
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_find_class",
    {
      title: "Сгенерировать поиск Java-класса",
      description:
        "Генерирует find_class(class_name) с try-except и проверкой None. " +
        "ВАЖНО: рефлексия хрупка и может сломаться при обновлении приложения. " +
        "ВАЖНО: НЕ вызывать getClass() на результате — использовать напрямую. " +
        "Пример: find_class('org.telegram.ui.ChatActivity'). " +
        "Требует импорт: from hook_utils import find_class",
      inputSchema: {
        class_fqn: z
          .string()
          .describe(
            "Полное квалифицированное имя Java-класса, например org.telegram.ui.ChatActivity"
          ),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'target_class')"),
      },
    },
    async ({ class_fqn, var_name }) => {
      const varName = var_name ?? "target_class";
      const importLine =
        "# Нужен импорт: from hook_utils import find_class";

      const body = lines(
        `${varName} = find_class("${class_fqn}")`,
        `if ${varName} is None:`,
        `    log(f"Класс не найден: ${class_fqn}")`,
      );

      const handler = `log(f"Ошибка поиска класса ${class_fqn}: {e}")\n${varName} = None`;

      const code = tryExcept(body, "e", handler);

      return ok(joinBlocks(importLine, "# from android_utils import log", code));
    }
  );

  // -------------------------------------------------------------------
  // generate_get_field
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_get_field",
    {
      title: "Сгенерировать чтение Java-поля",
      description:
        "Генерирует get_private_field(obj, field_name) или " +
        "get_static_private_field(clazz, field_name) с try-except. " +
        "Работает с private, protected и public полями через рефлексию. " +
        "Возвращает None при ошибке или если поле не найдено. " +
        "Требует импорт: from hook_utils import get_private_field (или get_static_private_field)",
      inputSchema: {
        obj_var: z
          .string()
          .describe("Python-выражение объекта (инстанс) или класса (для static)"),
        field_name: z
          .string()
          .describe("Имя поля Java"),
        is_static: z
          .boolean()
          .optional()
          .describe("Статическое поле (по умолчанию false)"),
        result_var: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'field_value')"),
      },
    },
    async ({ obj_var, field_name, is_static, result_var }) => {
      const varName = result_var ?? "field_value";
      const fnName = is_static
        ? "get_static_private_field"
        : "get_private_field";

      const importLine = `# Нужен импорт: from hook_utils import ${fnName}`;

      const body = lines(
        `${varName} = ${fnName}(${obj_var}, "${field_name}")`,
        `if ${varName} is None:`,
        `    log(f"Поле '${field_name}' не найдено или равно null")`,
      );

      const handler = `log(f"Ошибка чтения поля '${field_name}': {e}")\n${varName} = None`;
      const code = tryExcept(body, "e", handler);

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_set_field
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_set_field",
    {
      title: "Сгенерировать запись Java-поля",
      description:
        "Генерирует set_private_field(obj, field_name, value) или " +
        "set_static_private_field(clazz, field_name, value) с try-except. " +
        "Возвращает True при успехе, False при неудаче. " +
        "Требует импорт: from hook_utils import set_private_field (или set_static_private_field)",
      inputSchema: {
        obj_var: z
          .string()
          .describe("Python-выражение объекта или класса"),
        field_name: z.string().describe("Имя поля Java"),
        value_expr: z
          .string()
          .describe("Python-выражение нового значения"),
        is_static: z
          .boolean()
          .optional()
          .describe("Статическое поле (по умолчанию false)"),
      },
    },
    async ({ obj_var, field_name, value_expr, is_static }) => {
      const fnName = is_static
        ? "set_static_private_field"
        : "set_private_field";

      const importLine = `# Нужен импорт: from hook_utils import ${fnName}`;

      const body = lines(
        `success = ${fnName}(${obj_var}, "${field_name}", ${value_expr})`,
        "if not success:",
        `    log(f"Не удалось установить поле '${field_name}'")`,
      );

      const handler = `log(f"Ошибка записи поля '${field_name}': {e}")`;
      const code = tryExcept(body, "e", handler);

      return ok(joinBlocks(importLine, code));
    }
  );
}
