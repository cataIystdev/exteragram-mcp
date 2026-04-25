/**
 * [K] Инструменты генерации файловых операций.
 *
 * Генерирует вызовы read_file, write_file, delete_file,
 * ensure_dir_exists, list_dir и стандартных директорий Telegram.
 * ВАЖНО: write_file не создаёт родительские директории —
 * всегда вызывать ensure_dir_exists перед write_file.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lines, joinBlocks, pyString, pyList } from "../codegen/python-builder.js";
import { DEVICE_PLUGINS_DIR } from "../types.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/** Стандартные директории SDK с реальными путями на устройстве */
const STANDARD_DIRS = [
  {
    fn: "get_plugins_dir()",
    path: `${DEVICE_PLUGINS_DIR}/`,
    desc: "Директория плагинов",
  },
  {
    fn: "get_cache_dir()",
    path: "/data/user/0/com.exteragram.messenger/cache/",
    desc: "Кеш приложения",
  },
  {
    fn: "get_files_dir()",
    path: "/data/user/0/com.exteragram.messenger/files/",
    desc: "Файловая директория приложения",
  },
  {
    fn: "get_images_dir()",
    path: "/data/user/0/com.exteragram.messenger/files/images/",
    desc: "Изображения",
  },
  {
    fn: "get_videos_dir()",
    path: "/data/user/0/com.exteragram.messenger/files/video/",
    desc: "Видео",
  },
  {
    fn: "get_audios_dir()",
    path: "/data/user/0/com.exteragram.messenger/files/music/",
    desc: "Аудио",
  },
  {
    fn: "get_documents_dir()",
    path: "/data/user/0/com.exteragram.messenger/files/documents/",
    desc: "Документы",
  },
];

/**
 * Регистрирует все инструменты группы [K] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerFileUtilsTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_read_file
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_read_file",
    {
      title: "Сгенерировать чтение файла",
      description:
        "Генерирует read_file(path) с проверкой None. " +
        "Возвращает содержимое файла как строку или None при ошибке/отсутствии. " +
        "Требует импорт: from file_utils import read_file",
      inputSchema: {
        path_expr: z
          .string()
          .describe("Python-выражение пути к файлу"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'content')"),
      },
    },
    async ({ path_expr, var_name }) => {
      const varName = var_name ?? "content";
      const importLine = "# Нужен импорт: from file_utils import read_file";

      const code = lines(
        `${varName} = read_file(${path_expr})`,
        `if ${varName} is None:`,
        `    log(f"Файл не найден или ошибка чтения: {${path_expr}}")`,
      );

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_write_file
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_write_file",
    {
      title: "Сгенерировать запись файла",
      description:
        "Генерирует ensure_dir_exists + write_file(path, content). " +
        "ВАЖНО: write_file не создаёт родительские директории автоматически. " +
        "ensure_dir_exists вызывается автоматически (можно отключить). " +
        "Требует импорт: from file_utils import write_file, ensure_dir_exists",
      inputSchema: {
        path_expr: z
          .string()
          .describe("Python-выражение пути к файлу"),
        content_expr: z
          .string()
          .describe("Python-выражение строки содержимого"),
        ensure_dir: z
          .boolean()
          .optional()
          .describe(
            "Вызывать ensure_dir_exists перед записью (по умолчанию true)"
          ),
      },
    },
    async ({ path_expr, content_expr, ensure_dir }) => {
      const addEnsureDir = ensure_dir !== false;
      const importLine =
        addEnsureDir
          ? "# Нужен импорт: from file_utils import write_file, ensure_dir_exists\nimport os"
          : "# Нужен импорт: from file_utils import write_file";

      let code: string;
      if (addEnsureDir) {
        code = lines(
          `ensure_dir_exists(os.path.dirname(${path_expr}))`,
          `write_file(${path_expr}, ${content_expr})`
        );
      } else {
        code = `write_file(${path_expr}, ${content_expr})`;
      }

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_delete_file
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_delete_file",
    {
      title: "Сгенерировать удаление файла",
      description:
        "Генерирует delete_file(path) с проверкой результата. " +
        "Возвращает True при успехе, False если файл не существует или ошибка. " +
        "Требует импорт: from file_utils import delete_file",
      inputSchema: {
        path_expr: z
          .string()
          .describe("Python-выражение пути к файлу"),
        check_result: z
          .boolean()
          .optional()
          .describe("Добавить проверку возвращаемого значения (по умолчанию true)"),
      },
    },
    async ({ path_expr, check_result }) => {
      const importLine = "# Нужен импорт: from file_utils import delete_file";

      let code: string;
      if (check_result !== false) {
        code = lines(
          `success = delete_file(${path_expr})`,
          "if not success:",
          `    log(f"Не удалось удалить файл: {${path_expr}}")`
        );
      } else {
        code = `delete_file(${path_expr})`;
      }

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // generate_ensure_dir
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_ensure_dir",
    {
      title: "Сгенерировать создание директории",
      description:
        "Генерирует ensure_dir_exists(path) — создаёт директорию и всех родителей при необходимости. " +
        "Требует импорт: from file_utils import ensure_dir_exists",
      inputSchema: {
        path_expr: z
          .string()
          .describe("Python-выражение пути к директории"),
      },
    },
    async ({ path_expr }) => {
      const importLine =
        "# Нужен импорт: from file_utils import ensure_dir_exists";
      return ok(joinBlocks(importLine, `ensure_dir_exists(${path_expr})`));
    }
  );

  // -------------------------------------------------------------------
  // generate_list_dir
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_list_dir",
    {
      title: "Сгенерировать перечисление директории",
      description:
        "Генерирует list_dir(path, recursive, include_files, include_dirs, extensions). " +
        "extensions — список расширений для фильтрации, например [\".py\", \".json\"]. " +
        "Требует импорт: from file_utils import list_dir",
      inputSchema: {
        path_expr: z
          .string()
          .describe("Python-выражение пути к директории"),
        recursive: z
          .boolean()
          .optional()
          .describe("Включить поддиректории (по умолчанию false)"),
        include_files: z
          .boolean()
          .optional()
          .describe("Включить файлы (по умолчанию true)"),
        include_dirs: z
          .boolean()
          .optional()
          .describe("Включить директории (по умолчанию false)"),
        extensions: z
          .array(z.string())
          .optional()
          .describe(
            "Фильтр по расширениям, например [\".py\", \".json\"]"
          ),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной результата (по умолчанию 'files')"),
      },
    },
    async ({
      path_expr,
      recursive,
      include_files,
      include_dirs,
      extensions,
      var_name,
    }) => {
      const varName = var_name ?? "files";
      const importLine = "# Нужен импорт: from file_utils import list_dir";

      const args: string[] = [path_expr];
      if (recursive) args.push("recursive=True");
      if (include_files === false) args.push("include_files=False");
      if (include_dirs) args.push("include_dirs=True");
      if (extensions && extensions.length > 0) {
        args.push(
          `extensions=${pyList(extensions.map((e) => pyString(e)))}`
        );
      }

      const code = `${varName} = list_dir(${args.join(", ")})`;

      return ok(joinBlocks(importLine, code));
    }
  );

  // -------------------------------------------------------------------
  // list_standard_dirs
  // -------------------------------------------------------------------
  server.registerTool(
    "list_standard_dirs",
    {
      title: "Список стандартных директорий",
      description:
        "Возвращает все стандартные getter-функции SDK с реальными путями на устройстве. " +
        "Требует импорт: from file_utils import get_plugins_dir, get_cache_dir, ...",
      inputSchema: {},
    },
    async () => {
      const table = STANDARD_DIRS.map(
        ({ fn, path, desc }) =>
          `  ${fn.padEnd(22)} -> ${path}\n  ${" ".repeat(22)}   (${desc})`
      ).join("\n\n");

      const importLine =
        "Импорт: from file_utils import get_plugins_dir, get_cache_dir, get_files_dir, " +
        "get_images_dir, get_videos_dir, get_audios_dir, get_documents_dir";

      return ok(`Стандартные директории SDK:\n\n${table}\n\n${importLine}`);
    }
  );
}
