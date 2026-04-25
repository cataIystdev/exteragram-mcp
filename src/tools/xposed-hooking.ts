/**
 * [N] Инструменты генерации Xposed-хуков.
 *
 * Генерирует полный паттерн Xposed-хука в три шага:
 * 1. find_class(FQN) с try-except
 * 2. getDeclaredMethod / getDeclaredConstructor
 * 3. self.hook_method(method, handler, priority=10)
 *
 * Стили хуков: MethodHook, MethodReplacement, functional.
 * ВАЖНО: НЕ вызывать getClass() на результате find_class() — использовать напрямую.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  lines,
  pyMethod,
  joinBlocks,
  pyString,
  tryExcept,
} from "../codegen/python-builder.js";
import type { HookFilterSpec, HookStyle, ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Строит строку HookFilter по спецификации.
 *
 * @param spec - спецификация фильтра
 * @returns Python-выражение HookFilter
 */
function buildFilter(spec: HookFilterSpec): string {
  switch (spec.type) {
    case "RESULT_IS_NULL":
    case "RESULT_IS_TRUE":
    case "RESULT_IS_FALSE":
    case "RESULT_NOT_NULL":
      return `HookFilter.${spec.type}`;
    case "ResultIsInstanceOf":
      return `HookFilter.ResultIsInstanceOf(${spec.class_var ?? "MyClass"})`;
    case "ResultEqual":
      return `HookFilter.ResultEqual(${spec.value ?? "None"})`;
    case "ResultNotEqual":
      return `HookFilter.ResultNotEqual(${spec.value ?? "None"})`;
    case "ArgumentIsNull":
      return `HookFilter.ArgumentIsNull(${spec.index ?? 0})`;
    case "ArgumentNotNull":
      return `HookFilter.ArgumentNotNull(${spec.index ?? 0})`;
    case "ArgumentIsFalse":
      return `HookFilter.ArgumentIsFalse(${spec.index ?? 0})`;
    case "ArgumentIsTrue":
      return `HookFilter.ArgumentIsTrue(${spec.index ?? 0})`;
    case "ArgumentIsInstanceOf":
      return `HookFilter.ArgumentIsInstanceOf(${spec.index ?? 0}, ${spec.class_var ?? "MyClass"})`;
    case "ArgumentEqual":
      return `HookFilter.ArgumentEqual(${spec.index ?? 0}, ${spec.value ?? "None"})`;
    case "ArgumentNotEqual":
      return `HookFilter.ArgumentNotEqual(${spec.index ?? 0}, ${spec.value ?? "None"})`;
    case "Condition":
      if (spec.obj) {
        return `HookFilter.Condition(${pyString(spec.mvel_expr ?? "")}, object=${spec.obj})`;
      }
      return `HookFilter.Condition(${pyString(spec.mvel_expr ?? "")})`;
    case "Or": {
      const nested = (spec.filters ?? []).map(buildFilter).join(", ");
      return `HookFilter.Or(${nested})`;
    }
    default:
      return `HookFilter.RESULT_NOT_NULL`;
  }
}

/**
 * Регистрирует все инструменты группы [N] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerXposedHookingTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_method_hook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_method_hook",
    {
      title: "Сгенерировать Xposed-хук метода",
      description:
        "Генерирует полный паттерн Xposed-хука в 3 шага: " +
        "(1) find_class + getDeclaredMethod/getDeclaredConstructor, " +
        "(2) класс-обработчик MethodHook/MethodReplacement или functional-хук, " +
        "(3) self.hook_method(method, handler, priority=10) в on_plugin_load. " +
        "ВАЖНО: не вызывать getClass() на результате find_class(). " +
        "MethodHook: before_hooked_method(param) и/или after_hooked_method(param). " +
        "MethodReplacement: replace_hooked_method(param) — полная замена. " +
        "functional: before= и/или after= лямбды. " +
        "param.setResult(v) в before — пропускает оригинальный метод. " +
        "Требует импорт: from base_plugin import MethodHook (или MethodReplacement, BaseHook), HookFilter, hook_filters; from hook_utils import find_class",
      inputSchema: {
        style: z
          .enum(["MethodHook", "MethodReplacement", "functional"])
          .describe("Стиль хука"),
        class_fqn: z
          .string()
          .describe("FQN целевого класса, например org.telegram.ui.ChatActivity"),
        method_name: z
          .string()
          .describe("Имя метода Java"),
        arg_types: z
          .array(z.string())
          .optional()
          .describe("Типы аргументов Java (FQN или примитивы). Нужны при перегрузках."),
        has_before: z
          .boolean()
          .optional()
          .describe("Добавить before_hooked_method (для MethodHook, по умолчанию true)"),
        has_after: z
          .boolean()
          .optional()
          .describe("Добавить after_hooked_method (для MethodHook, по умолчанию false)"),
        priority: z
          .number()
          .int()
          .optional()
          .describe("Приоритет хука (по умолчанию 10)"),
        is_constructor: z
          .boolean()
          .optional()
          .describe("Хукать конструктор (getDeclaredConstructor)"),
        handler_var: z
          .string()
          .optional()
          .describe("Имя переменной unhook-объекта (по умолчанию _hook)"),
      },
    },
    async ({
      style,
      class_fqn,
      method_name,
      arg_types,
      has_before,
      has_after,
      priority,
      is_constructor,
      handler_var,
    }) => {
      const hookStyle = style as HookStyle;
      const pr = priority ?? 10;
      const hookVar = handler_var ?? "_hook";
      const classVar = "target_class";

      // Имя класса хука из имени метода
      const handlerClassName =
        method_name.charAt(0).toUpperCase() +
        method_name.slice(1) +
        (hookStyle === "MethodReplacement" ? "Replacement" : "Hook");

      // Шаг 1: find_class + getDeclaredMethod
      const getMethodArgs: string[] = [pyString(method_name)];
      if (arg_types && arg_types.length > 0) {
        getMethodArgs.push(...arg_types.map((t) => `find_class(${pyString(t)})`));
      }

      const methodFn = is_constructor
        ? `getDeclaredConstructor`
        : `getDeclaredMethod`;

      const step1Body = lines(
        `${classVar} = find_class(${pyString(class_fqn)})`,
        `if ${classVar} is None:`,
        `    log(f"Класс не найден: ${class_fqn}")`,
        `    return`,
        `method = ${classVar}.${methodFn}(${getMethodArgs.join(", ")})`
      );

      let hookCall: string;
      if (hookStyle === "functional") {
        hookCall = `self.${hookVar} = self.hook_method(method, before=self._before_${method_name}, priority=${pr})`;
      } else {
        hookCall = `self.${hookVar} = self.hook_method(method, ${handlerClassName}(), priority=${pr})`;
      }

      const step1Full = lines(step1Body, hookCall);
      const step1 = tryExcept(step1Full, "e", `log(f"Ошибка регистрации хука ${method_name}: {e}")`);

      const registrationComment = "# Вставить в on_plugin_load:";

      let handlerCode: string;

      if (hookStyle === "MethodHook") {
        const showBefore = has_before !== false;
        const showAfter = has_after === true;

        const methods: string[] = [];

        if (showBefore) {
          const beforeBody = lines(
            "# param.thisObject — инстанс (None для static)",
            "# param.args — массив аргументов (изменяем напрямую)",
            "# param.setResult(v) в before — пропустит оригинальный метод",
            "pass"
          );
          methods.push(pyMethod("before_hooked_method", ["self", "param"], beforeBody));
        }

        if (showAfter) {
          const afterBody = lines(
            "# param.getResult() — результат оригинального метода",
            "pass"
          );
          methods.push(pyMethod("after_hooked_method", ["self", "param"], afterBody));
        }

        handlerCode = lines(
          `class ${handlerClassName}(MethodHook):`,
          methods.map((m) => "    " + m.split("\n").join("\n    ")).join("\n\n    ")
        );
      } else if (hookStyle === "MethodReplacement") {
        const replBody = lines(
          "# Полная замена оригинального метода",
          "# param.thisObject, param.args — доступны",
          "return None"
        );
        const replMethod = pyMethod(
          "replace_hooked_method",
          ["self", "param"],
          replBody
        );
        handlerCode = lines(
          `class ${handlerClassName}(MethodReplacement):`,
          "    " + replMethod.split("\n").join("\n    ")
        );
      } else {
        // functional
        const funcBody = lines(
          `# before: param.args изменяются ДО оригинала`,
          `def _before_${method_name}(self, param):`,
          `    pass`
        );
        handlerCode = funcBody;
      }

      const importLine =
        hookStyle === "MethodReplacement"
          ? "# Нужен импорт: from base_plugin import MethodReplacement\n# Нужен импорт: from hook_utils import find_class\n# Нужен импорт: from android_utils import log"
          : "# Нужен импорт: from base_plugin import MethodHook\n# Нужен импорт: from hook_utils import find_class\n# Нужен импорт: from android_utils import log";

      const unloadComment = lines(
        `# В on_plugin_unload для снятия хука:`,
        `# if self.${hookVar} is not None:`,
        `#     self.unhook_method(self.${hookVar})`
      );

      return ok(
        joinBlocks(
          importLine,
          handlerCode,
          registrationComment,
          step1,
          unloadComment
        )
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_hook_param_usage
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_hook_param_usage",
    {
      title: "Сгенерировать операции с param",
      description:
        "Генерирует сниппеты для работы с XC_MethodHook.MethodHookParam. " +
        "Операции: get_args (param.args[i]), set_args (param.args[i] = v), " +
        "get_result (param.getResult()), set_result (param.setResult(v)), " +
        "get_this (param.thisObject), skip_original (setResult в before), " +
        "get_method (param.method).",
      inputSchema: {
        operations: z
          .array(
            z.enum([
              "get_args",
              "set_args",
              "get_result",
              "set_result",
              "get_this",
              "skip_original",
              "get_method",
            ])
          )
          .describe("Список нужных операций"),
      },
    },
    async ({ operations }) => {
      const snippets: Record<string, string> = {
        get_args: lines(
          "# Чтение аргументов:",
          "first_arg = param.args[0]",
          "second_arg = param.args[1]"
        ),
        set_args: lines(
          "# Изменение аргументов:",
          "param.args[0] = new_value"
        ),
        get_result: lines(
          "# Получить результат (используется в after_hooked_method):",
          "result = param.getResult()"
        ),
        set_result: lines(
          "# Установить результат (используется в before_hooked_method):",
          "param.setResult(new_value)"
        ),
        get_this: lines(
          "# Получить инстанс объекта (None для static методов):",
          "instance = param.thisObject"
        ),
        skip_original: lines(
          "# Вызов в before_hooked_method — пропустить оригинальный метод:",
          "param.setResult(None)  # или нужное значение"
        ),
        get_method: lines(
          "# Получить перехваченный метод/конструктор:",
          "method = param.method"
        ),
      };

      const result = operations
        .map((op) => snippets[op] ?? `# Неизвестная операция: ${op}`)
        .join("\n\n");

      return ok(result);
    }
  );

  // -------------------------------------------------------------------
  // generate_hook_filters
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_hook_filters",
    {
      title: "Сгенерировать фильтры хука",
      description:
        "Генерирует @hook_filters(...) декоратор или before_filters=/after_filters= параметры. " +
        "Фильтры: RESULT_IS_NULL/TRUE/FALSE/NOT_NULL, ResultIsInstanceOf(clazz), " +
        "ResultEqual/NotEqual(value), ArgumentIsNull/NotNull/True/False(index), " +
        "ArgumentIsInstanceOf(index, clazz), ArgumentEqual/NotEqual(index, value), " +
        "Condition(mvel_expr), Or(*filters). " +
        "Требует импорт: from base_plugin import HookFilter, hook_filters",
      inputSchema: {
        filters: z
          .array(
            z.object({
              type: z.string().describe("Тип фильтра"),
              class_var: z.string().optional(),
              value: z.string().optional(),
              index: z.number().int().optional(),
              mvel_expr: z.string().optional(),
              obj: z.string().optional(),
              filters: z.array(z.any()).optional(),
            })
          )
          .describe("Список спецификаций фильтров"),
        as_decorator: z
          .boolean()
          .optional()
          .describe(
            "Генерировать @hook_filters(...) декоратор (по умолчанию true)"
          ),
        param_name: z
          .enum(["before", "after"])
          .optional()
          .describe("Для functional хука: имя параметра"),
      },
    },
    async ({ filters, as_decorator, param_name }) => {
      const importLine =
        "# Нужен импорт: from base_plugin import HookFilter, hook_filters";

      const filterExprs = filters.map((f) =>
        buildFilter(f as HookFilterSpec)
      );

      if (as_decorator !== false) {
        const decorator = `@hook_filters(\n    ${filterExprs.join(",\n    ")},\n)`;
        return ok(joinBlocks(importLine, decorator));
      }

      const paramKey = param_name ?? "before";
      const code = `${paramKey}_filters=[${filterExprs.join(", ")}]`;
      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_hook_all_methods
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_hook_all_methods",
    {
      title: "Сгенерировать хук всех перегрузок метода",
      description:
        "Генерирует self.hook_all_methods(Class, method_name, handler) — " +
        "перехватывает все перегрузки указанного метода. " +
        "Возвращает список unhook-объектов. " +
        "Требует импорт: from hook_utils import find_class",
      inputSchema: {
        class_fqn: z.string().describe("FQN целевого класса"),
        method_name: z.string().describe("Имя метода"),
        handler_class: z
          .string()
          .describe("Имя класса хука (MethodHook или MethodReplacement)"),
        priority: z.number().int().optional().describe("Приоритет (по умолчанию 10)"),
        var_name: z.string().optional().describe("Имя переменной списка unhook"),
      },
    },
    async ({ class_fqn, method_name, handler_class, priority, var_name }) => {
      const pr = priority ?? 10;
      const varName = var_name ?? "_hooks";

      const body = lines(
        `target_class = find_class(${pyString(class_fqn)})`,
        "if target_class is None:",
        `    log(f"Класс не найден: ${class_fqn}")`,
        "    return",
        `self.${varName} = self.hook_all_methods(target_class, ${pyString(method_name)}, ${handler_class}(), priority=${pr})`
      );

      const code = tryExcept(
        body,
        "e",
        `log(f"Ошибка hook_all_methods ${method_name}: {e}")`
      );

      const importLine =
        "# Нужен импорт: from hook_utils import find_class\n# Нужен импорт: from android_utils import log";

      return ok(joinBlocks(importLine, "# Вставить в on_plugin_load:", code));
    }
  );

  // -------------------------------------------------------------------
  // generate_hook_all_constructors
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_hook_all_constructors",
    {
      title: "Сгенерировать хук всех конструкторов",
      description:
        "Генерирует self.hook_all_constructors(Class, handler) — " +
        "перехватывает все конструкторы класса. " +
        "Возвращает список unhook-объектов. " +
        "Требует импорт: from hook_utils import find_class",
      inputSchema: {
        class_fqn: z.string().describe("FQN целевого класса"),
        handler_class: z.string().describe("Имя класса хука"),
        var_name: z.string().optional().describe("Имя переменной списка unhook"),
      },
    },
    async ({ class_fqn, handler_class, var_name }) => {
      const varName = var_name ?? "_ctor_hooks";

      const body = lines(
        `target_class = find_class(${pyString(class_fqn)})`,
        "if target_class is None:",
        `    log(f"Класс не найден: ${class_fqn}")`,
        "    return",
        `self.${varName} = self.hook_all_constructors(target_class, ${handler_class}())`
      );

      const code = tryExcept(
        body,
        "e",
        `log(f"Ошибка hook_all_constructors: {e}")`
      );

      const importLine =
        "# Нужен импорт: from hook_utils import find_class\n# Нужен импорт: from android_utils import log";

      return ok(joinBlocks(importLine, "# Вставить в on_plugin_load:", code));
    }
  );

  // -------------------------------------------------------------------
  // generate_unhook
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_unhook",
    {
      title: "Сгенерировать снятие хука",
      description:
        "Генерирует self.unhook_method(unhook_obj) или цикл снятия для списка хуков. " +
        "Вызывать в on_plugin_unload для корректной очистки. " +
        "Xposed-хуки НЕ снимаются автоматически при отключении плагина.",
      inputSchema: {
        unhook_var: z
          .string()
          .describe("Имя переменной или выражение unhook-объекта (одиночного или списка)"),
        is_list: z
          .boolean()
          .optional()
          .describe("Переменная содержит список unhook-объектов (по умолчанию false)"),
      },
    },
    async ({ unhook_var, is_list }) => {
      if (is_list) {
        return ok(
          lines(
            `if hasattr(self, "${unhook_var}") and self.${unhook_var}:`,
            `    for hook in self.${unhook_var}:`,
            `        self.unhook_method(hook)`
          )
        );
      }

      return ok(
        lines(
          `if hasattr(self, "${unhook_var}") and self.${unhook_var} is not None:`,
          `    self.unhook_method(self.${unhook_var})`,
          `    self.${unhook_var} = None`
        )
      );
    }
  );
}
