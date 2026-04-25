/**
 * [H] Инструменты генерации клиентских утилит.
 *
 * Генерирует вызовы отправки и редактирования сообщений, TL-запросов,
 * подписок на уведомления, работы с очередями и доступа к контроллерам.
 * Все функции импортируются из модуля client_utils SDK exteraGram.
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

/** Полный список контроллеров с описаниями */
const CONTROLLERS = [
  { fn: "get_last_fragment()", desc: "Текущий фрагмент UI" },
  { fn: "get_account_instance()", desc: "Экземпляр аккаунта" },
  { fn: "get_messages_controller()", desc: "MessagesController — управление состоянием" },
  { fn: "get_contacts_controller()", desc: "ContactsController" },
  { fn: "get_media_data_controller()", desc: "MediaDataController" },
  { fn: "get_connections_manager()", desc: "ConnectionsManager" },
  { fn: "get_location_controller()", desc: "LocationController" },
  { fn: "get_notifications_controller()", desc: "NotificationsController" },
  {
    fn: "get_messages_storage()",
    desc: "MessagesStorage — поле .database для кастомных SQLite-запросов",
  },
  { fn: "get_send_messages_helper()", desc: "SendMessagesHelper — отправка всех типов" },
  { fn: "get_file_loader()", desc: "FileLoader" },
  { fn: "get_secret_chat_helper()", desc: "SecretChatHelper" },
  { fn: "get_download_controller()", desc: "DownloadController" },
  { fn: "get_notifications_settings()", desc: "NotificationsSettings" },
  { fn: "get_notification_center()", desc: "NotificationCenter — подписки" },
  { fn: "get_media_controller()", desc: "MediaController" },
  { fn: "get_user_config()", desc: "UserConfig" },
];

/** Полный список констант очередей */
const QUEUE_CONSTANTS = [
  { name: "STAGE_QUEUE", value: "stageQueue" },
  { name: "GLOBAL_QUEUE", value: "globalQueue" },
  { name: "CACHE_CLEAR_QUEUE", value: "cacheClearQueue" },
  { name: "SEARCH_QUEUE", value: "searchQueue" },
  { name: "PHONE_BOOK_QUEUE", value: "phoneBookQueue" },
  { name: "THEME_QUEUE", value: "themeQueue" },
  { name: "EXTERNAL_NETWORK_QUEUE", value: "externalNetworkQueue" },
  {
    name: "PLUGINS_QUEUE",
    value: "pluginsQueue",
    note: "Рекомендуется для кода плагинов",
  },
];

/**
 * Регистрирует все инструменты группы [H] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerClientUtilsTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // generate_send_message
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_send_message",
    {
      title: "Сгенерировать отправку сообщения",
      description:
        "Генерирует вызов send_text, send_photo, send_document, send_video или send_audio. " +
        "peer_id — идентификатор получателя (Python-выражение). " +
        "content — текст (для type=text) или путь к файлу (для media). " +
        "parse_mode: HTML или Markdown для форматирования текста. " +
        "high_quality: только для photo. " +
        "reply_to: объект MessageObject для цитирования. " +
        "Требует импорт из client_utils.",
      inputSchema: {
        type: z
          .enum(["text", "photo", "document", "video", "audio"])
          .describe("Тип сообщения"),
        peer_id: z.string().describe("Python-выражение peer_id получателя"),
        content: z
          .string()
          .describe(
            "Для text: текст сообщения. Для media: Python-выражение пути к файлу."
          ),
        caption: z
          .string()
          .optional()
          .describe("Подпись медиа (для photo/document/video/audio)"),
        parse_mode: z
          .enum(["HTML", "Markdown"])
          .optional()
          .describe("Режим парсинга текста"),
        reply_to: z
          .string()
          .optional()
          .describe("Python-выражение MessageObject для цитирования"),
        high_quality: z
          .boolean()
          .optional()
          .describe("Высокое качество фото (только для type=photo)"),
      },
    },
    async ({ type, peer_id, content, caption, parse_mode, reply_to, high_quality }) => {
      let call: string;
      const importFn = `send_${type}`;

      if (type === "text") {
        const args: string[] = [peer_id, pyString(content)];
        if (reply_to) args.push(`replyToMsg=${reply_to}`);
        if (parse_mode) args.push(`parse_mode=${pyString(parse_mode)}`);
        call = `send_text(${args.join(", ")})`;
      } else if (type === "photo") {
        const args: string[] = [peer_id, content];
        if (caption) args.push(`caption=${pyString(caption)}`);
        if (high_quality) args.push("high_quality=True");
        if (parse_mode) args.push(`parse_mode=${pyString(parse_mode)}`);
        call = `send_photo(${args.join(", ")})`;
      } else if (type === "document") {
        const args: string[] = [peer_id, content];
        if (caption) args.push(`caption=${pyString(caption)}`);
        call = `send_document(${args.join(", ")})`;
      } else if (type === "video") {
        const args: string[] = [peer_id, content];
        if (caption) args.push(`caption=${pyString(caption)}`);
        call = `send_video(${args.join(", ")})`;
      } else {
        const args: string[] = [peer_id, content];
        if (caption) args.push(`caption=${pyString(caption)}`);
        call = `send_audio(${args.join(", ")})`;
      }

      const importLine = `# Нужен импорт: from client_utils import ${importFn}`;
      return ok(joinBlocks(importLine, call));
    }
  );

  // -------------------------------------------------------------------
  // generate_edit_message
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_edit_message",
    {
      title: "Сгенерировать редактирование сообщения",
      description:
        "Генерирует вызов edit_message(message_obj, ...) для изменения существующего сообщения. " +
        "message_var — Python-переменная объекта MessageObject. " +
        "Можно изменить текст, файл или добавить спойлер. " +
        "Требует импорт: from client_utils import edit_message",
      inputSchema: {
        message_var: z
          .string()
          .describe("Имя переменной MessageObject"),
        text: z
          .string()
          .optional()
          .describe("Python-выражение нового текста"),
        file_path: z
          .string()
          .optional()
          .describe("Python-выражение нового пути к файлу"),
        with_spoiler: z
          .boolean()
          .optional()
          .describe("Скрыть медиа за спойлером"),
        parse_mode: z
          .enum(["HTML", "Markdown"])
          .optional()
          .describe("Режим парсинга нового текста"),
      },
    },
    async ({ message_var, text, file_path, with_spoiler, parse_mode }) => {
      const args: string[] = [message_var];
      if (text) args.push(`text=${text}`);
      if (file_path) args.push(`file_path=${file_path}`);
      if (with_spoiler) args.push("with_spoiler=True");
      if (parse_mode) args.push(`parse_mode=${pyString(parse_mode)}`);

      const call = `edit_message(${args.join(", ")})`;
      const importLine =
        "# Нужен импорт: from client_utils import edit_message";

      return ok(joinBlocks(importLine, call));
    }
  );

  // -------------------------------------------------------------------
  // generate_send_request
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_send_request",
    {
      title: "Сгенерировать отправку TL-запроса",
      description:
        "Генерирует вызов send_request(request, callback) для произвольного Telegram TL-запроса. " +
        "request_var — Python-выражение TLObject запроса. " +
        "callback_name — имя callback-функции (response, error). " +
        "Возвращает request_id (int). " +
        "Callback вызывается асинхронно: response=None при ошибке, error=None при успехе. " +
        "Требует импорт: from client_utils import send_request",
      inputSchema: {
        request_var: z
          .string()
          .describe("Python-выражение TLObject запроса"),
        callback_name: z
          .string()
          .describe("Имя callback-функции"),
        var_name: z
          .string()
          .optional()
          .describe("Имя переменной для request_id"),
      },
    },
    async ({ request_var, callback_name, var_name }) => {
      const resultVar = var_name ?? "request_id";

      const callbackBody = lines(
        "if error is not None:",
        "    log(f\"Ошибка запроса: {error}\")",
        "    return",
        "# Обработайте response здесь"
      );

      const callback = pyMethod(
        callback_name,
        ["response", "error"],
        callbackBody
      );

      const call = `${resultVar} = send_request(${request_var}, ${callback_name})`;
      const importLine =
        "# Нужен импорт: from client_utils import send_request\n" +
        "# Нужен импорт: from android_utils import log";

      return ok(joinBlocks(importLine, callback, call));
    }
  );

  // -------------------------------------------------------------------
  // generate_notification_listener
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_notification_listener",
    {
      title: "Сгенерировать слушатель уведомлений",
      description:
        "Генерирует класс-наследник NotificationCenterDelegate для подписки на " +
        "внутренние уведомления Telegram. " +
        "didReceivedNotification(id, account, args) вызывается при поступлении уведомлений. " +
        "register_in_load=true добавляет код регистрации для вставки в on_plugin_load. " +
        "Требует импорт: from client_utils import NotificationCenterDelegate, get_notification_center",
      inputSchema: {
        class_name: z
          .string()
          .describe("Имя Python-класса слушателя"),
        notification_ids: z
          .array(z.string())
          .describe(
            "Список идентификаторов уведомлений, например [\"NotificationCenter.didReceiveNewMessages\"]"
          ),
        register_in_load: z
          .boolean()
          .optional()
          .describe("Добавить код регистрации (для вставки в on_plugin_load)"),
      },
    },
    async ({ class_name, notification_ids, register_in_load }) => {
      const importLine =
        "# Нужен импорт: from client_utils import NotificationCenterDelegate, get_notification_center";

      const branches = notification_ids.map<[string, string]>((id) => [
        `id == ${id}`,
        "pass",
      ]);

      const methodBody =
        branches.length > 0
          ? lines(
              branches
                .map(([cond, body], idx) => {
                  const kw = idx === 0 ? "if" : "elif";
                  return `${kw} ${cond}:\n    ${body}`;
                })
                .join("\n")
            )
          : "pass";

      const listenerClass = lines(
        `class ${class_name}(NotificationCenterDelegate):`,
        "    def didReceivedNotification(self, id: int, account: int, args):",
        "        " + methodBody.replace(/\n/g, "\n        ")
      );

      if (!register_in_load) {
        return ok(joinBlocks(importLine, listenerClass));
      }

      const instanceVar = class_name.charAt(0).toLowerCase() + class_name.slice(1);
      const registrationLines: string[] = [
        "# Вставить в on_plugin_load:",
        `self.${instanceVar} = ${class_name}()`,
        ...notification_ids.map(
          (id) =>
            `get_notification_center().addObserver(self.${instanceVar}, ${id})`
        ),
      ];

      return ok(
        joinBlocks(importLine, listenerClass, registrationLines.join("\n"))
      );
    }
  );

  // -------------------------------------------------------------------
  // generate_queue_call
  // -------------------------------------------------------------------
  server.registerTool(
    "generate_queue_call",
    {
      title: "Сгенерировать вызов через очередь",
      description:
        "Генерирует run_on_queue(callable, queue_name, delay_ms) для выполнения кода " +
        "вне UI-потока. Рекомендуется PLUGINS_QUEUE для кода плагинов. " +
        "Используйте для сетевых запросов и тяжёлых вычислений. " +
        "Константы очередей: STAGE_QUEUE, GLOBAL_QUEUE, CACHE_CLEAR_QUEUE, " +
        "SEARCH_QUEUE, PHONE_BOOK_QUEUE, THEME_QUEUE, EXTERNAL_NETWORK_QUEUE, PLUGINS_QUEUE. " +
        "Требует импорт: from client_utils import run_on_queue, PLUGINS_QUEUE",
      inputSchema: {
        callable_expr: z
          .string()
          .describe("Python-выражение callable для выполнения"),
        queue: z
          .enum([
            "STAGE_QUEUE",
            "GLOBAL_QUEUE",
            "CACHE_CLEAR_QUEUE",
            "SEARCH_QUEUE",
            "PHONE_BOOK_QUEUE",
            "THEME_QUEUE",
            "EXTERNAL_NETWORK_QUEUE",
            "PLUGINS_QUEUE",
          ])
          .describe("Константа очереди"),
        delay_ms: z
          .number()
          .int()
          .optional()
          .describe("Задержка в миллисекундах (по умолчанию 0)"),
      },
    },
    async ({ callable_expr, queue, delay_ms }) => {
      const args: string[] = [callable_expr, queue];
      if (delay_ms && delay_ms > 0) args.push(`delay_ms=${delay_ms}`);

      const call = `run_on_queue(${args.join(", ")})`;
      const importLine = `# Нужен импорт: from client_utils import run_on_queue, ${queue}`;

      return ok(joinBlocks(importLine, call));
    }
  );

  // -------------------------------------------------------------------
  // list_controllers
  // -------------------------------------------------------------------
  server.registerTool(
    "list_controllers",
    {
      title: "Список контроллеров",
      description:
        "Возвращает полный список getter-функций для доступа к контроллерам Telegram. " +
        "Все функции импортируются из client_utils. " +
        "MessagesStorage предоставляет поле .database для прямых SQLite-запросов.",
      inputSchema: {},
    },
    async () => {
      const table = CONTROLLERS.map(
        ({ fn, desc }) => `  ${fn.padEnd(38)} — ${desc}`
      ).join("\n");

      const importLine =
        "Импорт: from client_utils import get_messages_controller, get_last_fragment, ...";

      return ok(
        `Доступные контроллеры (импорт из client_utils):\n\n${table}\n\n${importLine}`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_queue_constants
  // -------------------------------------------------------------------
  server.registerTool(
    "list_queue_constants",
    {
      title: "Список констант очередей",
      description:
        "Возвращает все константы очередей для run_on_queue с описаниями. " +
        "PLUGINS_QUEUE рекомендуется для кода плагинов.",
      inputSchema: {},
    },
    async () => {
      const table = QUEUE_CONSTANTS.map(
        ({ name, value, note }) =>
          `  ${name.padEnd(26)} = "${value}"${note ? `  (${note})` : ""}`
      ).join("\n");

      return ok(
        `Константы очередей (импорт из client_utils):\n\n${table}`
      );
    }
  );
}
