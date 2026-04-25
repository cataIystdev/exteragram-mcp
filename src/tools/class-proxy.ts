/**
 * [M] Инструменты генерации Class Proxy DSL.
 *
 * Генерирует Python-классы, создающие реальные Java-подклассы через DexMaker.
 * Позволяет передавать Python-объекты в любое Android/Telegram API,
 * ожидающее конкретный Java-тип.
 *
 * Компоненты: java_subclass, joverride, joverload, jmethod, jMVELmethod,
 * jfield, jgetmethod, jsetmethod, jconstructor, jpreconstructor,
 * jclassbuilder, J (JavaHelper), PyObj, new_instance, from_java.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  lines,
  pyMethod,
  joinBlocks,
  pyString,
} from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [M] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerClassProxyTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_java_subclass
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_java_subclass",
    {
      title: "Сгенерировать Java-подкласс",
      description:
        "Генерирует Python-класс с @java_subclass декоратором, создающий реальный Java-подкласс. " +
        "java_base — FQN базового Java-класса (не может быть final). " +
        "interfaces — список FQN интерфейсов для реализации. " +
        "Внутри методов: self.java или self.this — сырой Java-инстанс. " +
        "new_instance() возвращает Python-peer (с .java для Java-объекта). " +
        "new_java_instance() возвращает сырой Java-объект. " +
        "from_java(obj) восстанавливает Python-peer из существующего Java-объекта. " +
        "Требует импорт: from extera_utils.class_proxy import java_subclass, Base, ...",
      inputSchema: {
        class_name: z
          .string()
          .describe("Имя Python-класса"),
        java_base: z
          .string()
          .describe("FQN базового Java-класса"),
        interfaces: z
          .array(z.string())
          .optional()
          .describe("FQN интерфейсов для реализации"),
        with_post_init: z
          .boolean()
          .optional()
          .describe("Добавить on_post_init метод"),
      },
    },
    async ({ class_name, java_base, interfaces, with_post_init }) => {
      const importLine =
        "# Нужен импорт: from extera_utils.class_proxy import java_subclass, Base, joverride, jfield";

      const ifaceList = interfaces ? `, ${interfaces.join(", ")}` : "";
      const decorator = `@java_subclass(${java_base}${ifaceList})`;

      const bodyLines: string[] = [
        "    # Пример поля:",
        "    # count = jfield(\"int\", default=0)",
        "",
        "    def on_plugin_load(self):",
        "        pass",
      ];

      if (with_post_init) {
        bodyLines.push(
          "",
          "    def on_post_init(self):",
          "        # Вызывается после завершения инициализации",
          "        pass"
        );
      }

      const classBody = bodyLines.join("\n");
      const classCode = `${decorator}\nclass ${class_name}(Base):\n${classBody}`;

      const usageComment = lines(
        `# Создание экземпляра (Python peer):`,
        `# instance = ${class_name}.new_instance()`,
        `# java_obj = instance.java`,
        "",
        `# Создание сырого Java-объекта:`,
        `# java_instance = ${class_name}.new_java_instance()`,
        "",
        `# Восстановление из существующего Java-объекта:`,
        `# python_peer = ${class_name}.from_java(existing_java_obj)`
      );

      return ok(joinBlocks(importLine, classCode, usageComment));
    }
  );

  // -------------------------------------------------------------------
  // generate_joverride
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_joverride",
    {
      title: "Сгенерировать переопределение Java-метода",
      description:
        "Генерирует метод с @joverride или @joverload для переопределения Java-метода. " +
        "Используйте @joverload с arg_types для перегруженных методов (overloads). " +
        "super().method_name() вызывает родительскую реализацию. " +
        "self.java — сырой Java-инстанс внутри метода. " +
        "Требует импорт: from extera_utils.class_proxy import joverride (или joverload)",
      inputSchema: {
        java_method_name: z
          .string()
          .describe("Имя Java-метода для переопределения"),
        python_name: z
          .string()
          .describe("Имя Python-метода (может отличаться от Java)"),
        arg_types: z
          .array(z.string())
          .optional()
          .describe(
            "Типы аргументов Java (FQN или примитивы). Обязательны для перегрузок."
          ),
        body: z
          .string()
          .optional()
          .describe("Тело метода (по умолчанию — вызов super)"),
        return_type: z
          .string()
          .optional()
          .describe("Java-тип возврата (для документации)"),
      },
    },
    async ({ java_method_name, python_name, arg_types, body, return_type }) => {
      let decorator: string;
      if (arg_types && arg_types.length > 0) {
        const typeList = `[${arg_types.map((t) => pyString(t)).join(", ")}]`;
        decorator = `joverload(${pyString(java_method_name)}, ${typeList})`;
      } else {
        decorator = `joverride(${pyString(java_method_name)})`;
      }

      const methodBody = body ?? `return super().${python_name}()`;

      const params = ["self"];
      if (arg_types && arg_types.length > 0) {
        arg_types.forEach((_, i) => params.push(`arg${i}`));
      }

      const method = pyMethod(
        python_name,
        params,
        methodBody,
        [decorator],
        return_type
      );

      const importType = arg_types && arg_types.length > 0
        ? "joverload"
        : "joverride";
      const importLine = `# Нужен импорт: from extera_utils.class_proxy import ${importType}`;

      return ok(joinBlocks(importLine, method));
    }
  );

  // -------------------------------------------------------------------
  // generate_jfield
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_jfield",
    {
      title: "Сгенерировать Java-поле",
      description:
        "Генерирует jfield(...) — декларацию Java-поля с опциональными getter/setter. " +
        "java_type: примитив ('int', 'boolean', 'long') или FQN ('java.lang.String'). " +
        "getter/setter: имена методов для jgetmethod/jsetmethod. " +
        "Чистые getter/setter (без Python-логики) быстрее на hot-path. " +
        "Требует импорт: from extera_utils.class_proxy import jfield, jgetmethod, jsetmethod",
      inputSchema: {
        field_name: z.string().describe("Имя поля в Python-классе"),
        java_type: z
          .string()
          .describe("Java-тип: int, boolean, long, java.lang.String и т.д."),
        default: z
          .string()
          .optional()
          .describe("Python-выражение значения по умолчанию"),
        getter: z
          .string()
          .optional()
          .describe("Имя getter-метода Java, например isShadow"),
        setter: z
          .string()
          .optional()
          .describe("Имя setter-метода Java, например setShadow"),
      },
    },
    async ({ field_name, java_type, default: defaultVal, getter, setter }) => {
      const args: string[] = [pyString(java_type)];
      if (defaultVal !== undefined) args.push(`default=${defaultVal}`);

      const methods: string[] = [];
      if (getter) methods.push(`jgetmethod(${pyString(getter)})`);
      if (setter) methods.push(`jsetmethod(${pyString(setter)})`);
      if (methods.length > 0) args.push(`methods=[${methods.join(", ")}]`);

      const code = `${field_name} = jfield(${args.join(", ")})`;

      const imports = ["jfield"];
      if (getter) imports.push("jgetmethod");
      if (setter) imports.push("jsetmethod");
      const importLine = `# Нужен импорт: from extera_utils.class_proxy import ${imports.join(", ")}`;

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_jmvel_method
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_jmvel_method",
    {
      title: "Сгенерировать MVEL-метод",
      description:
        "Генерирует jMVELmethod или jMVELoverride — Java-метод с MVEL-кодом вместо Python. " +
        "Оптимален для hot-path методов: избегает overhead Python. " +
        "MVEL переменные: java (инстанс), python/py/self (Python-peer), " +
        "args (Object[]), argc, arg0/arg1/..., SUPER_methodName(...). " +
        "Требует импорт: from extera_utils.class_proxy import jMVELmethod (или jMVELoverride)",
      inputSchema: {
        method_name: z.string().describe("Имя переменной метода в классе"),
        return_type: z
          .string()
          .describe("Java-тип возврата, например java.lang.String"),
        arguments: z
          .array(
            z.object({
              name: z.string(),
              type: z.string(),
            })
          )
          .optional()
          .describe("Аргументы метода [{name, type}]"),
        code: z.string().describe("MVEL-код метода"),
        is_override: z
          .boolean()
          .optional()
          .describe("Использовать jMVELoverride вместо jMVELmethod"),
        java_method_name: z
          .string()
          .optional()
          .describe("Java-имя для jMVELoverride"),
      },
    },
    async ({ method_name, return_type, arguments: args, code, is_override, java_method_name }) => {
      const fnName = is_override ? "jMVELoverride" : "jMVELmethod";
      const importLine = `# Нужен импорт: from extera_utils.class_proxy import ${fnName}`;

      const callArgs: string[] = [`return_type=${pyString(return_type)}`];

      if (args && args.length > 0) {
        const argList = args
          .map(({ name, type }) => `(${pyString(name)}, ${pyString(type)})`)
          .join(", ");
        callArgs.push(`arguments=[${argList}]`);
      }

      if (is_override && java_method_name) {
        callArgs.push(`name=${pyString(java_method_name)}`);
      }

      callArgs.push(`code=${pyString(code)}`);

      const declaration = `${method_name} = ${fnName}(\n    ${callArgs.join(",\n    ")},\n)`;

      return ok(joinBlocks(importLine, declaration));
    }
  );

  // -------------------------------------------------------------------
  // generate_java_helper
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_java_helper",
    {
      title: "Сгенерировать JavaHelper J()",
      description:
        "Генерирует доступ к Java-объекту через J() (JavaHelper). " +
        "Режимы: JAccessAll (доступ к private членам), JNotAccessAll (только public), " +
        "JUseGetterAndSetter (предпочитает JavaBean getter/setter, по умолчанию), " +
        "JIgnoreResult (для цепочки вызовов без возврата). " +
        "Режимы возвращают новый immutable wrapper, не мутируют оригинал. " +
        "Требует импорт: from extera_utils.class_proxy import J",
      inputSchema: {
        obj_var: z
          .string()
          .describe("Python-выражение Java-объекта"),
        member_name: z
          .string()
          .describe("Имя поля или метода"),
        access_all: z
          .boolean()
          .optional()
          .describe("JAccessAll: доступ к private/protected (по умолчанию false)"),
        ignore_result: z
          .boolean()
          .optional()
          .describe("JIgnoreResult: для цепочки вызовов (по умолчанию false)"),
        is_write: z
          .boolean()
          .optional()
          .describe("Генерировать запись поля (по умолчанию false — чтение)"),
        value_expr: z
          .string()
          .optional()
          .describe("Значение для записи (если is_write=true)"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (для чтения)"),
      },
    },
    async ({ obj_var, member_name, access_all, ignore_result, is_write, value_expr, var_name }) => {
      const importLine = "# Нужен импорт: from extera_utils.class_proxy import J";

      let accessor = `J(${obj_var})`;
      if (access_all) accessor += ".JAccessAll";
      if (ignore_result) accessor += ".JIgnoreResult";

      let code: string;
      if (is_write && value_expr !== undefined) {
        code = `${accessor}.${member_name} = ${value_expr}`;
      } else {
        const resultVar = var_name ?? "result";
        code = `${resultVar} = ${accessor}.${member_name}`;
      }

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_new_instance
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_new_instance",
    {
      title: "Сгенерировать создание Java-инстанса",
      description:
        "Генерирует new_instance() или new_java_instance() для создания объекта Java-подкласса. " +
        "new_instance() — возвращает Python-peer (с .java для сырого Java-объекта). " +
        "new_java_instance() — возвращает сырой Java-объект напрямую. " +
        "from_java(obj) — восстанавливает Python-peer из существующего Java-объекта.",
      inputSchema: {
        class_var: z
          .string()
          .describe("Имя Python-класса (java_subclass)"),
        init_args: z
          .array(z.string())
          .optional()
          .describe("Аргументы конструктора (Python-выражения)"),
        as_java: z
          .boolean()
          .optional()
          .describe("Использовать new_java_instance() (по умолчанию false)"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата"),
      },
    },
    async ({ class_var, init_args, as_java, var_name }) => {
      const varName = var_name ?? "instance";
      const args = init_args ? init_args.join(", ") : "";
      const method = as_java ? "new_java_instance" : "new_instance";

      const code = lines(
        `${varName} = ${class_var}.${method}(${args})`,
        as_java ? "" : `# java_obj = ${varName}.java  — сырой Java-объект`
      );

      return ok(code.trimEnd());
    }
  );

  // -------------------------------------------------------------------
  // generate_from_java
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_from_java",
    {
      title: "Сгенерировать from_java",
      description:
        "Генерирует ClassProxy.from_java(java_obj) — восстанавливает Python-peer " +
        "из уже существующего Java-объекта. " +
        "Используется для работы с Java-объектами, полученными из Android/Telegram API.",
      inputSchema: {
        class_var: z
          .string()
          .describe("Имя Python-класса (java_subclass)"),
        java_var: z
          .string()
          .describe("Python-выражение Java-объекта"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной Python-peer (по умолчанию 'python_peer')"),
      },
    },
    async ({ class_var, java_var, var_name }) => {
      const varName = var_name ?? "python_peer";
      return ok(`${varName} = ${class_var}.from_java(${java_var})`);
    }
  );

  // -------------------------------------------------------------------
  // generate_pyobj
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_pyobj",
    {
      title: "Сгенерировать PyObj",
      description:
        "Генерирует PyObj.create(python_object) — оборачивает Python-объект " +
        "для передачи через Java API. " +
        "Используется для переноса произвольных Python-данных через Java-вызовы. " +
        "Требует импорт: from extera_utils.class_proxy import PyObj",
      inputSchema: {
        python_expr: z
          .string()
          .describe("Python-выражение объекта для оборачивания"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'wrapped')"),
      },
    },
    async ({ python_expr, var_name }) => {
      const varName = var_name ?? "wrapped";
      const importLine =
        "# Нужен импорт: from extera_utils.class_proxy import PyObj";
      return ok(
        joinBlocks(importLine, `${varName} = PyObj.create(${python_expr})`)
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_jclassbuilder
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_jclassbuilder",
    {
      title: "Сгенерировать jclassbuilder",
      description:
        "Генерирует метод с @jclassbuilder() для модификации DexMaker-builder " +
        "перед финализацией класса. Продвинутое использование. " +
        "Требует импорт: from extera_utils.class_proxy import jclassbuilder",
      inputSchema: {
        method_name: z
          .string()
          .optional()
          .describe("Имя метода (по умолчанию 'configure_builder')"),
        body: z
          .string()
          .optional()
          .describe("Тело метода"),
      },
    },
    async ({ method_name, body }) => {
      const name = method_name ?? "configure_builder";
      const methodBody = body ?? lines(
        "# builder — DexMaker builder перед финализацией",
        "# Модифицируйте builder здесь",
        "pass"
      );
      const importLine =
        "# Нужен импорт: from extera_utils.class_proxy import jclassbuilder";
      const method = pyMethod(name, ["self", "builder"], methodBody, ["jclassbuilder()"]);
      return ok(joinBlocks(importLine, method));
    }
  );
}
