/**
 * [D] Инструменты генерации UI настроек плагина.
 *
 * Генерирует метод create_settings(), отдельные компоненты UI,
 * вызовы get_setting / set_setting / export_settings / import_settings,
 * а также определения SimpleSettingFactory.
 *
 * Компоненты: Header, Divider, Switch, Selector, Input, EditText, Text, Custom.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  lines,
  pyMethod,
  pyString,
  pyList,
  callExpr,
  joinBlocks,
} from "../codegen/python-builder.js";
import type { SettingsComponentSpec, ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Форматирует одиночный компонент настроек по спецификации.
 * Возвращает Python-выражение (конструктор компонента).
 *
 * @param spec - спецификация компонента
 * @returns Python-код конструктора
 */
function buildComponent(spec: SettingsComponentSpec): string {
  switch (spec.type) {
    case "Header":
      return callExpr("Header", {
        text: spec.text ? pyString(spec.text) : null,
      });

    case "Divider":
      return callExpr("Divider", {
        text: spec.text ? pyString(spec.text) : null,
      });

    case "Switch":
      return callExpr("Switch", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
        default:
          spec.default !== undefined
            ? spec.default === true || spec.default === "True"
              ? "True"
              : "False"
            : null,
        subtext: spec.subtext ? pyString(spec.subtext) : null,
        icon: spec.icon ? pyString(spec.icon) : null,
        on_change: spec.on_change ?? null,
        on_long_click: spec.on_long_click ?? null,
        link_alias: spec.link_alias ? pyString(spec.link_alias) : null,
      });

    case "Selector":
      return callExpr("Selector", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
        default: spec.default !== undefined ? String(spec.default) : null,
        items: spec.items
          ? pyList(spec.items.map((i) => pyString(i)))
          : null,
        icon: spec.icon ? pyString(spec.icon) : null,
        on_change: spec.on_change ?? null,
        on_long_click: spec.on_long_click ?? null,
      });

    case "Input":
      return callExpr("Input", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
        default:
          spec.default !== undefined ? pyString(String(spec.default)) : null,
        subtext: spec.subtext ? pyString(spec.subtext) : null,
        icon: spec.icon ? pyString(spec.icon) : null,
        on_change: spec.on_change ?? null,
        link_alias: spec.link_alias ? pyString(spec.link_alias) : null,
      });

    case "EditText":
      return callExpr("EditText", {
        key: spec.key ? pyString(spec.key) : null,
        hint: spec.hint ? pyString(spec.hint) : null,
        default:
          spec.default !== undefined ? pyString(String(spec.default)) : null,
        multiline: spec.multiline !== undefined ? (spec.multiline ? "True" : "False") : null,
        max_length: spec.max_length !== undefined ? String(spec.max_length) : null,
        mask: spec.mask ? pyString(spec.mask) : null,
        on_change: spec.on_change ?? null,
      });

    case "Text":
      return callExpr("Text", {
        text: spec.text ? pyString(spec.text) : null,
        subtext: spec.subtext ? pyString(spec.subtext) : null,
        icon: spec.icon ? pyString(spec.icon) : null,
        accent: spec.accent !== undefined ? (spec.accent ? "True" : "False") : null,
        red: spec.red !== undefined ? (spec.red ? "True" : "False") : null,
        on_click: spec.on_click ?? null,
        create_sub_fragment: spec.create_sub_fragment ?? null,
        link_alias: spec.link_alias ? pyString(spec.link_alias) : null,
      });

    case "Custom": {
      if (spec.variant === "uitem") {
        return callExpr("Custom", { item: spec.item ?? null });
      } else if (spec.variant === "view") {
        return callExpr("Custom", { view: spec.view ?? null });
      } else if (spec.variant === "factory") {
        const factArgs = spec.factory_args?.length
          ? pyList(spec.factory_args.map((a) => pyString(a)))
          : null;
        return callExpr("Custom", {
          factory: spec.factory ?? null,
          factory_args: factArgs,
          on_click: spec.on_click ?? null,
        });
      }
      return "Custom()";
    }

    default:
      return `# Неизвестный тип компонента: ${spec.type}`;
  }
}

/**
 * Регистрирует все инструменты группы [D] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerSettingsTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_settings_ui
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_settings_ui",
    {
      title: "Сгенерировать UI настроек",
      description:
        "Генерирует метод create_settings() возвращающий список компонентов UI. " +
        "Компоненты задаются как массив объектов с полем type. " +
        "Требует импорт нужных компонентов: from ui.settings import Header, Switch, ..." +
        "Компоненты: Header, Divider, Switch, Selector, Input, EditText, Text, Custom.",
      inputSchema: {
        components: z
          .array(
            z.object({
              type: z.enum([
                "Header",
                "Divider",
                "Switch",
                "Selector",
                "Input",
                "EditText",
                "Text",
                "Custom",
              ]),
              key: z.string().optional(),
              text: z.string().optional(),
              default: z.union([z.string(), z.boolean(), z.number()]).optional(),
              subtext: z.string().optional(),
              icon: z.string().optional(),
              items: z.array(z.string()).optional(),
              hint: z.string().optional(),
              on_change: z.string().optional(),
              on_long_click: z.string().optional(),
              on_click: z.string().optional(),
              link_alias: z.string().optional(),
              accent: z.boolean().optional(),
              red: z.boolean().optional(),
              multiline: z.boolean().optional(),
              max_length: z.number().int().optional(),
              mask: z.string().optional(),
              create_sub_fragment: z.string().optional(),
              variant: z.enum(["uitem", "view", "factory"]).optional(),
              item: z.string().optional(),
              view: z.string().optional(),
              factory: z.string().optional(),
              factory_args: z.array(z.string()).optional(),
            })
          )
          .describe("Список компонентов в порядке отображения"),
      },
    },
    async ({ components }) => {
      const importTypes = [
        ...new Set(components.map((c) => c.type as string)),
      ].join(", ");
      const importLine = `from ui.settings import ${importTypes}`;

      const componentLines = components
        .map((c) => buildComponent(c as SettingsComponentSpec))
        .map((line) => `    ${line},`)
        .join("\n");

      const body = lines(
        "return [",
        componentLines,
        "]"
      );

      const method = pyMethod(
        "create_settings",
        ["self"],
        body,
        [],
        "List[Any]"
      );

      const result = joinBlocks(
        "from typing import Any, List",
        importLine,
        method
      );

      return ok(result);
    }
  );

  // -------------------------------------------------------------------
  // generate_settings_component
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_settings_component",
    {
      title: "Сгенерировать компонент настроек",
      description:
        "Генерирует конструктор одного компонента UI настроек. " +
        "Switch: key(обяз), text(обяз), default(bool, обяз). " +
        "Selector: key(обяз), text(обяз), default(int, обяз), items(обяз). " +
        "Input: key(обяз), text(обяз). " +
        "EditText: key(обяз), hint(обяз). " +
        "Text: text(обяз). " +
        "Header/Divider: text(опц). " +
        "Custom: variant(uitem/view/factory) + соответствующие поля.",
      inputSchema: {
        type: z
          .enum([
            "Header",
            "Divider",
            "Switch",
            "Selector",
            "Input",
            "EditText",
            "Text",
            "Custom",
          ])
          .describe("Тип компонента"),
        key: z.string().optional().describe("Ключ хранения (для Switch, Selector, Input, EditText)"),
        text: z.string().optional().describe("Отображаемый текст"),
        default: z.union([z.string(), z.boolean(), z.number()]).optional().describe("Начальное значение"),
        subtext: z.string().optional().describe("Подпись под меткой"),
        icon: z.string().optional().describe("Drawable name иконки"),
        items: z.array(z.string()).optional().describe("Варианты для Selector"),
        hint: z.string().optional().describe("Placeholder для EditText (обязателен)"),
        on_change: z.string().optional().describe("Имя callback при изменении"),
        on_long_click: z.string().optional().describe("Имя callback на долгое нажатие"),
        on_click: z.string().optional().describe("Имя callback на нажатие (Text, Custom)"),
        link_alias: z.string().optional().describe("Alias для deeplink копирования"),
        accent: z.boolean().optional().describe("Акцентный цвет для Text"),
        red: z.boolean().optional().describe("Красный цвет для Text"),
        multiline: z.boolean().optional().describe("Многострочный EditText"),
        max_length: z.number().int().optional().describe("Максимальная длина для EditText"),
        mask: z.string().optional().describe("Маска ввода для EditText"),
        create_sub_fragment: z.string().optional().describe("Callback для вложенных настроек (Text)"),
        variant: z.enum(["uitem", "view", "factory"]).optional().describe("Вариант Custom"),
        item: z.string().optional().describe("Python-выражение UItem для Custom(variant=uitem)"),
        view: z.string().optional().describe("Python-выражение View для Custom(variant=view)"),
        factory: z.string().optional().describe("Имя SimpleSettingFactory для Custom(variant=factory)"),
        factory_args: z.array(z.string()).optional().describe("Аргументы factory"),
      },
    },
    async (spec) => {
      return ok(buildComponent(spec as SettingsComponentSpec));
    }
  );

  // -------------------------------------------------------------------
  // generate_get_setting
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_get_setting",
    {
      title: "Сгенерировать get_setting",
      description:
        "Генерирует вызов self.get_setting(key, default) для чтения значения настройки. " +
        "Возвращает сохранённое значение или default если ключ не найден.",
      inputSchema: {
        key: z.string().describe("Ключ настройки"),
        default_value: z
          .string()
          .describe("Python-выражение значения по умолчанию"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной для присваивания (по умолчанию 'value')"),
      },
    },
    async ({ key, default_value, var_name }) => {
      const variable = var_name ?? "value";
      return ok(
        `${variable} = self.get_setting(${pyString(key)}, ${default_value})`
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_set_setting
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_set_setting",
    {
      title: "Сгенерировать set_setting",
      description:
        "Генерирует вызов self.set_setting(key, value, reload_settings) для сохранения настройки. " +
        "reload_settings=True обновляет UI настроек немедленно.",
      inputSchema: {
        key: z.string().describe("Ключ настройки"),
        value_expr: z
          .string()
          .describe("Python-выражение нового значения"),
        reload_settings: z
          .boolean()
          .optional()
          .describe("Перезагрузить UI настроек после сохранения (по умолчанию False)"),
      },
    },
    async ({ key, value_expr, reload_settings }) => {
      if (reload_settings) {
        return ok(
          `self.set_setting(${pyString(key)}, ${value_expr}, reload_settings=True)`
        );
      }
      return ok(`self.set_setting(${pyString(key)}, ${value_expr})`);
    }
  );

  // -------------------------------------------------------------------
  // generate_export_import_settings
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_export_import_settings",
    {
      title: "Сгенерировать export/import настроек",
      description:
        "Генерирует вызов export_settings() или import_settings(). " +
        "export_settings() возвращает dict всех настроек. " +
        "import_settings(dict) восстанавливает настройки из словаря. " +
        "Полезно для резервного копирования конфигурации плагина.",
      inputSchema: {
        operation: z
          .enum(["export", "import"])
          .describe("Операция: export или import"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата для export (по умолчанию 'settings_data')"),
        data_expr: z
          .string()
          .optional()
          .describe("Python-выражение dict для import"),
        reload: z
          .boolean()
          .optional()
          .describe(
            "reload_settings при import (по умолчанию True)"
          ),
      },
    },
    async ({ operation, var_name, data_expr, reload }) => {
      if (operation === "export") {
        const varName = var_name ?? "settings_data";
        return ok(
          lines(
            `${varName} = self.export_settings()`,
            `# ${varName} — dict со всеми ключами и значениями плагина`
          )
        );
      } else {
        const data = data_expr ?? "{}";
        if (reload === false) {
          return ok(`self.import_settings(${data}, reload_settings=False)`);
        }
        return ok(`self.import_settings(${data})`);
      }
    }
  );

  // -------------------------------------------------------------------
  // generate_simple_setting_factory
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_simple_setting_factory",
    {
      title: "Сгенерировать SimpleSettingFactory",
      description:
        "Генерирует определение SimpleSettingFactory для кастомных строк в настройках. " +
        "SimpleSettingFactory автоматически управляет recycling и binding View. " +
        "create_fn сигнатура: (context, list_view, current_account, class_guid, resources_provider) -> View. " +
        "bind_fn сигнатура: (view, item, divider, adapter, list_view) -> None. " +
        "on_click сигнатура: (plugin, item, view) -> None. " +
        "on_long_click сигнатура: (plugin, item, view) -> bool. " +
        "Требует импорт: from ui.settings import SimpleSettingFactory",
      inputSchema: {
        factory_name: z
          .string()
          .describe("Имя переменной фабрики"),
        create_fn: z
          .string()
          .describe("Имя функции создания View"),
        bind_fn: z
          .string()
          .describe("Имя функции заполнения View данными"),
        is_clickable: z
          .boolean()
          .optional()
          .describe("Кликабельная строка (по умолчанию False)"),
        is_shadow: z
          .boolean()
          .optional()
          .describe("Строка-тень (по умолчанию False)"),
        create_item_fn: z
          .string()
          .optional()
          .describe("Имя функции создания UItem (опционально)"),
        on_click_fn: z
          .string()
          .optional()
          .describe("Имя callback на клик"),
        on_long_click_fn: z
          .string()
          .optional()
          .describe("Имя callback на долгое нажатие"),
      },
    },
    async ({
      factory_name,
      create_fn,
      bind_fn,
      is_clickable,
      is_shadow,
      create_item_fn,
      on_click_fn,
      on_long_click_fn,
    }) => {
      const args: string[] = [
        `    create_view=${create_fn}`,
        `    bind_view=${bind_fn}`,
      ];

      if (is_clickable !== undefined) {
        args.push(`    is_clickable=${is_clickable ? "True" : "False"}`);
      }
      if (is_shadow !== undefined) {
        args.push(`    is_shadow=${is_shadow ? "True" : "False"}`);
      }
      if (create_item_fn) {
        args.push(`    create_item=${create_item_fn}`);
      }
      if (on_click_fn) {
        args.push(`    on_click=${on_click_fn}`);
      }
      if (on_long_click_fn) {
        args.push(`    on_long_click=${on_long_click_fn}`);
      }

      const code = lines(
        "# Нужен импорт: from ui.settings import SimpleSettingFactory",
        `${factory_name} = SimpleSettingFactory(`,
        args.join(",\n"),
        ")"
      );

      return ok(code);
    }
  );
}
