/**
 * [B] Инструменты генерации файла плагина.
 *
 * Генерирует полный .py файл плагина, блок метаданных и блок импортов.
 * generate_plugin_file — единственный инструмент, возвращающий полный файл целиком.
 * Все метаданные генерируются как строковые литералы (AST-совместимость SDK).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  joinBlocks,
  lines,
  pyMetaConst,
  pyConst,
  pyList,
  pyString,
  importFrom,
} from "../codegen/python-builder.js";
import type { ToolResult } from "../types.js";

/** Карта модулей на строки импорта */
const MODULE_IMPORTS: Record<string, string[]> = {
  base_plugin: [
    "from base_plugin import BasePlugin",
  ],
  hook_result: [
    "from base_plugin import HookResult, HookStrategy",
  ],
  menu: [
    "from base_plugin import MenuItemData, MenuItemType",
  ],
  app_event: [
    "from base_plugin import AppEvent",
  ],
  xposed: [
    "from base_plugin import MethodHook, MethodReplacement, BaseHook, HookFilter, hook_filters",
  ],
  settings: [
    "from ui.settings import Header, Divider, Switch, Selector, Input, Text, EditText, Custom",
  ],
  simple_setting_factory: [
    "from ui.settings import SimpleSettingFactory",
  ],
  uitem: [
    "from ui.settings import UItem",
  ],
  alert: [
    "from ui.alert import AlertDialogBuilder",
  ],
  bulletin: [
    "from ui.bulletin import BulletinHelper",
  ],
  android_utils: [
    "from android_utils import R, OnClickListener, OnLongClickListener",
    "from android_utils import run_on_ui_thread, log, copy_to_clipboard",
  ],
  client_utils: [
    "from client_utils import (",
    "    run_on_queue, get_queue_by_name,",
    "    STAGE_QUEUE, GLOBAL_QUEUE, CACHE_CLEAR_QUEUE, SEARCH_QUEUE,",
    "    PHONE_BOOK_QUEUE, THEME_QUEUE, EXTERNAL_NETWORK_QUEUE, PLUGINS_QUEUE,",
    "    send_request, send_text, send_photo, send_document, send_video, send_audio,",
    "    send_message, edit_message, NotificationCenterDelegate,",
    "    get_last_fragment, get_account_instance, get_messages_controller,",
    "    get_contacts_controller, get_media_data_controller, get_connections_manager,",
    "    get_location_controller, get_notifications_controller, get_messages_storage,",
    "    get_send_messages_helper, get_file_loader, get_secret_chat_helper,",
    "    get_download_controller, get_notifications_settings, get_notification_center,",
    "    get_media_controller, get_user_config,",
    ")",
  ],
  hook_utils: [
    "from hook_utils import (",
    "    find_class,",
    "    get_private_field, set_private_field,",
    "    get_static_private_field, set_static_private_field,",
    ")",
  ],
  file_utils: [
    "from file_utils import (",
    "    get_plugins_dir, get_cache_dir, get_files_dir,",
    "    get_images_dir, get_videos_dir, get_audios_dir, get_documents_dir,",
    "    ensure_dir_exists, list_dir,",
    "    write_file, read_file, delete_file,",
    ")",
  ],
  text_formatting: [
    "from extera_utils.text_formatting import parse_text",
  ],
  class_proxy: [
    "from extera_utils.class_proxy import (",
    "    java_subclass, Base,",
    "    joverride, joverload, jmethod,",
    "    jMVELmethod, jMVELoverride,",
    "    jconstructor, jpreconstructor, jclassbuilder,",
    "    jfield, jgetmethod, jsetmethod,",
    "    J, PyObj,",
    ")",
  ],
  android_view: [
    "from android.view import View",
  ],
  r_tg: [
    "from org.telegram.messenger import R as R_tg",
  ],
};

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Преобразует plugin_id в имя класса в PascalCase.
 * Пример: "my_plugin" -> "MyPlugin"
 *
 * @param id - plugin_id
 * @returns имя класса
 */
function idToClassName(id: string): string {
  return id
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") + "Plugin";
}

/**
 * Генерирует блок метаданных плагина как строковые литералы.
 * Формат строго соответствует AST-парсингу SDK exteraGram.
 */
function buildMetadataBlock(params: {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version?: string;
  icon?: string;
  app_version?: string;
  sdk_version?: string;
  requirements?: string[];
}): string {
  const parts: string[] = [];

  parts.push(pyMetaConst("__id__", params.id));
  parts.push(pyMetaConst("__name__", params.name));

  if (params.description) {
    parts.push(pyMetaConst("__description__", params.description));
  }
  if (params.author) {
    parts.push(pyMetaConst("__author__", params.author));
  }

  parts.push(pyMetaConst("__version__", params.version ?? "1.0.0"));

  if (params.icon) {
    parts.push(pyMetaConst("__icon__", params.icon));
  }
  if (params.app_version) {
    parts.push(pyMetaConst("__app_version__", params.app_version));
  }
  if (params.sdk_version) {
    parts.push(pyMetaConst("__sdk_version__", params.sdk_version));
  }

  if (params.requirements && params.requirements.length > 0) {
    const reqList = pyList(params.requirements.map((r) => pyString(r)));
    parts.push(pyConst("__requirements__", reqList));
  }

  return parts.join("\n");
}

/**
 * Регистрирует все инструменты группы [B] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerScaffoldTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_plugin_file
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_plugin_file",
    {
      title: "Сгенерировать файл плагина",
      description:
        "Генерирует полный .py файл плагина, готовый к записи на диск. " +
        "Создаёт блок метаданных (__id__, __name__ и другие __xxx__ константы), " +
        "импорт BasePlugin и минимальный класс с on_plugin_load. " +
        "Имя файла должно совпадать с plugin_id (например my_plugin.py). " +
        "ВАЖНО: метаданные генерируются как строковые литералы (AST-парсинг SDK).",
      inputSchema: {
        id: z
          .string()
          .describe(
            "__id__: 2-32 символа, начинается с a-z, только [a-z0-9_-]"
          ),
        name: z.string().describe("__name__: отображаемое имя"),
        description: z
          .string()
          .optional()
          .describe("__description__: краткое описание"),
        author: z.string().optional().describe("__author__: имя автора"),
        version: z
          .string()
          .optional()
          .describe("__version__: semver (по умолчанию 1.0.0)"),
        icon: z
          .string()
          .optional()
          .describe("__icon__: drawable resource, например exteraPlugins/1"),
        app_version: z
          .string()
          .optional()
          .describe("__app_version__: например >=12.5.1"),
        sdk_version: z
          .string()
          .optional()
          .describe("__sdk_version__: например >=1.4.3.6"),
        requirements: z
          .array(z.string())
          .optional()
          .describe(
            "__requirements__: список PEP 508 строк (только pure-Python wheels)"
          ),
      },
    },
    async (params) => {
      const className = idToClassName(params.id);
      const metadataBlock = buildMetadataBlock(params);

      const code = joinBlocks(
        importFrom("base_plugin", ["BasePlugin"]),
        metadataBlock,
        lines(
          `class ${className}(BasePlugin):`,
          "    def on_plugin_load(self):",
          "        pass"
        )
      );

      return ok(code);
    }
  );

  // -------------------------------------------------------------------
  // generate_metadata_block
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_metadata_block",
    {
      title: "Сгенерировать блок метаданных",
      description:
        "Генерирует только блок констант метаданных плагина (__id__, __name__ и т.д.). " +
        "Возвращает фрагмент для вставки в начало существующего .py файла. " +
        "Все поля генерируются как строковые литералы для AST-совместимости.",
      inputSchema: {
        id: z.string().describe("__id__ плагина"),
        name: z.string().describe("__name__ плагина"),
        description: z.string().optional(),
        author: z.string().optional(),
        version: z.string().optional().describe("По умолчанию 1.0.0"),
        icon: z.string().optional(),
        app_version: z.string().optional().describe("Например >=12.5.1"),
        sdk_version: z.string().optional().describe("Например >=1.4.3.6"),
        requirements: z.array(z.string()).optional(),
      },
    },
    async (params) => {
      return ok(buildMetadataBlock(params));
    }
  );

  // -------------------------------------------------------------------
  // generate_import_block
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_import_block",
    {
      title: "Сгенерировать блок импортов",
      description:
        "Генерирует строки импортов для указанных модулей SDK exteraGram. " +
        "Доступные модули: base_plugin, hook_result, menu, app_event, xposed, " +
        "settings, simple_setting_factory, uitem, alert, bulletin, android_utils, " +
        "client_utils, hook_utils, file_utils, text_formatting, class_proxy, " +
        "android_view, r_tg.",
      inputSchema: {
        modules: z
          .array(
            z.enum([
              "base_plugin",
              "hook_result",
              "menu",
              "app_event",
              "xposed",
              "settings",
              "simple_setting_factory",
              "uitem",
              "alert",
              "bulletin",
              "android_utils",
              "client_utils",
              "hook_utils",
              "file_utils",
              "text_formatting",
              "class_proxy",
              "android_view",
              "r_tg",
            ])
          )
          .describe("Список нужных модулей"),
      },
    },
    async ({ modules }) => {
      const importLines: string[] = [];
      const seen = new Set<string>();

      for (const mod of modules) {
        const modLines = MODULE_IMPORTS[mod];
        if (!modLines) continue;
        for (const line of modLines) {
          if (!seen.has(line)) {
            importLines.push(line);
            seen.add(line);
          }
        }
      }

      if (importLines.length === 0) {
        return ok("# Нет импортов для указанных модулей");
      }

      return ok(importLines.join("\n"));
    }
  );
}
