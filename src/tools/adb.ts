/**
 * [Q] Инструменты ADB-деплоя и управления устройством.
 *
 * Предоставляет полный набор ADB-операций: проверка устройств,
 * деплой плагинов, просмотр логов, управление приложением,
 * произвольные push/pull и shell-команды.
 *
 * Путь плагинов на устройстве:
 * /data/user/0/com.exteragram.messenger/files/plugins/<plugin_id>.py
 *
 * Все команды выполняются через child_process.execSync с таймаутом.
 * Полный доступ к adb shell — без ограничений.
 */

import { execSync } from "child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPluginContext } from "../state/plugin-context.js";
import { DEVICE_PLUGINS_DIR, APP_PACKAGE } from "../types.js";
import type { AdbConfig, ToolResult } from "../types.js";

/** Путь к adb бинарнику из переменной окружения или PATH */
const ADB_PATH = process.env["ADB_PATH"] ?? "adb";

/** Серийный номер устройства из переменной окружения */
const ADB_SERIAL = process.env["ADB_SERIAL"];

/** Конфигурация ADB по умолчанию */
const DEFAULT_ADB_CONFIG: AdbConfig = {
  adbPath: ADB_PATH,
  defaultSerial: ADB_SERIAL,
  timeoutMs: 15000,
};

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function err(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

/**
 * Строит ADB-команду с опциональным серийным номером.
 *
 * @param subcommand - подкоманда adb (например "devices" или "push ...")
 * @param serial - серийный номер устройства (опционально)
 * @returns полная команда adb
 */
function buildAdbCommand(subcommand: string, serial?: string): string {
  const serialFlag = serial ? ` -s ${serial}` : "";
  return `${ADB_PATH}${serialFlag} ${subcommand}`;
}

/**
 * Выполняет ADB-команду и возвращает stdout.
 * При ошибке возвращает сообщение об ошибке.
 *
 * @param command - полная adb-команда
 * @param timeoutMs - таймаут в миллисекундах
 * @returns результат: { success, output }
 */
function runAdb(
  command: string,
  timeoutMs: number = DEFAULT_ADB_CONFIG.timeoutMs
): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      timeout: timeoutMs,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true, output: output.trim() };
  } catch (error: unknown) {
    if (error instanceof Error) {
      const execError = error as NodeJS.ErrnoException & {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
      };
      const stderr =
        typeof execError.stderr === "string"
          ? execError.stderr
          : execError.stderr?.toString() ?? "";
      const stdout =
        typeof execError.stdout === "string"
          ? execError.stdout
          : execError.stdout?.toString() ?? "";
      const combined = [stdout, stderr].filter(Boolean).join("\n");
      return { success: false, output: combined || execError.message };
    }
    return { success: false, output: String(error) };
  }
}

/**
 * Определяет серийный номер устройства: параметр > контекст > env.
 *
 * @param paramSerial - серийный номер из параметра инструмента
 * @returns серийный номер или undefined
 */
function resolveSerial(paramSerial?: string): string | undefined {
  if (paramSerial) return paramSerial;
  const ctx = getPluginContext();
  if (ctx?.device_serial) return ctx.device_serial;
  return ADB_SERIAL;
}

/**
 * Регистрирует все инструменты группы [Q] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerAdbTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // adb_check_devices
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_check_devices",
    {
      title: "ADB: Проверить подключённые устройства",
      description:
        "Выполняет 'adb devices' и возвращает список подключённых Android-устройств. " +
        "Использует ADB_PATH из env (по умолчанию 'adb' из PATH).",
      inputSchema: {},
    },
    async () => {
      const cmd = buildAdbCommand("devices -l");
      const result = runAdb(cmd);

      if (!result.success) {
        return err(`Ошибка выполнения adb devices: ${result.output}`);
      }

      return ok(`Подключённые устройства:\n\n${result.output}`);
    }
  );

  // -------------------------------------------------------------------
  // adb_deploy_plugin
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_deploy_plugin",
    {
      title: "ADB: Задеплоить плагин",
      description:
        "Копирует .py файл плагина на устройство через adb push. " +
        "Целевой путь: /data/user/0/com.exteragram.messenger/files/plugins/<plugin_id>.py. " +
        "file_path и plugin_id берутся из контекста если не заданы явно. " +
        "ВАЖНО: имя файла должно совпадать с __id__ плагина.",
      inputSchema: {
        file_path: z
          .string()
          .optional()
          .describe(
            "Локальный путь к .py файлу (берётся из контекста если не задан)"
          ),
        plugin_id: z
          .string()
          .optional()
          .describe("ID плагина (берётся из контекста если не задан)"),
        device_serial: z
          .string()
          .optional()
          .describe("Серийный номер устройства"),
      },
    },
    async ({ file_path, plugin_id, device_serial }) => {
      const ctx = getPluginContext();

      const localPath = file_path ?? ctx?.file_path;
      const pid = plugin_id ?? ctx?.plugin_id;

      if (!localPath) {
        return err(
          "Не задан file_path. Укажите явно или установите контекст через set_plugin_context."
        );
      }
      if (!pid) {
        return err(
          "Не задан plugin_id. Укажите явно или установите контекст через set_plugin_context."
        );
      }

      const remotePath = `${DEVICE_PLUGINS_DIR}/${pid}.py`;
      const serial = resolveSerial(device_serial);
      const cmd = buildAdbCommand(`push "${localPath}" "${remotePath}"`, serial);

      const result = runAdb(cmd, 30000);

      if (!result.success) {
        return err(
          `Ошибка деплоя плагина "${pid}":\n${result.output}\n\nКоманда: ${cmd}`
        );
      }

      return ok(
        `Плагин "${pid}" успешно задеплоен.\n` +
          `Локальный файл: ${localPath}\n` +
          `Путь на устройстве: ${remotePath}\n\n` +
          `Вывод adb:\n${result.output}`
      );
    }
  );

  // -------------------------------------------------------------------
  // adb_list_plugins
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_list_plugins",
    {
      title: "ADB: Список плагинов на устройстве",
      description:
        "Выводит список .py файлов в директории плагинов на устройстве. " +
        `Путь: ${DEVICE_PLUGINS_DIR}/`,
      inputSchema: {
        device_serial: z.string().optional(),
      },
    },
    async ({ device_serial }) => {
      const serial = resolveSerial(device_serial);
      const cmd = buildAdbCommand(
        `shell ls -la "${DEVICE_PLUGINS_DIR}/"`,
        serial
      );
      const result = runAdb(cmd);

      if (!result.success) {
        return err(`Ошибка получения списка плагинов:\n${result.output}`);
      }

      return ok(`Плагины на устройстве (${DEVICE_PLUGINS_DIR}/):\n\n${result.output}`);
    }
  );

  // -------------------------------------------------------------------
  // adb_remove_plugin
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_remove_plugin",
    {
      title: "ADB: Удалить плагин с устройства",
      description:
        "Удаляет .py файл плагина с устройства через adb shell rm.",
      inputSchema: {
        plugin_id: z
          .string()
          .describe("ID плагина для удаления"),
        device_serial: z.string().optional(),
      },
    },
    async ({ plugin_id, device_serial }) => {
      const serial = resolveSerial(device_serial);
      const remotePath = `${DEVICE_PLUGINS_DIR}/${plugin_id}.py`;
      const cmd = buildAdbCommand(`shell rm "${remotePath}"`, serial);
      const result = runAdb(cmd);

      if (!result.success) {
        return err(`Ошибка удаления плагина "${plugin_id}":\n${result.output}`);
      }

      return ok(
        `Плагин "${plugin_id}" удалён с устройства.\nУдалён файл: ${remotePath}`
      );
    }
  );

  // -------------------------------------------------------------------
  // adb_get_logs
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_get_logs",
    {
      title: "ADB: Получить логи",
      description:
        "Читает logcat с устройства, опционально фильтруя по plugin_id. " +
        "plugin_id берётся из контекста если не задан. " +
        "clear=true очищает буфер логов перед чтением.",
      inputSchema: {
        plugin_id: z
          .string()
          .optional()
          .describe(
            "Фильтровать логи по plugin_id (берётся из контекста если не задан)"
          ),
        lines: z
          .number()
          .int()
          .optional()
          .describe("Количество последних строк (по умолчанию 100)"),
        device_serial: z.string().optional(),
        clear: z
          .boolean()
          .optional()
          .describe("Очистить буфер логов перед чтением"),
        no_filter: z
          .boolean()
          .optional()
          .describe("Не фильтровать по plugin_id, вернуть весь logcat"),
      },
    },
    async ({ plugin_id, lines: lineCount, device_serial, clear, no_filter }) => {
      const serial = resolveSerial(device_serial);
      const ctx = getPluginContext();
      const pid = plugin_id ?? ctx?.plugin_id;
      const count = lineCount ?? 100;

      if (clear) {
        const clearCmd = buildAdbCommand("logcat -c", serial);
        runAdb(clearCmd, 5000);
      }

      const logCmd = buildAdbCommand(`logcat -d -t ${count}`, serial);
      const result = runAdb(logCmd, 20000);

      if (!result.success) {
        return err(`Ошибка получения логов:\n${result.output}`);
      }

      let output = result.output;

      if (!no_filter && pid) {
        const logLines = output.split("\n");
        const filtered = logLines.filter(
          (line) => line.toLowerCase().includes(pid.toLowerCase())
        );
        output =
          filtered.length > 0
            ? filtered.join("\n")
            : `Строк с "${pid}" не найдено в последних ${count} строках лога.\n\nПоследние строки:\n${logLines.slice(-20).join("\n")}`;
      }

      return ok(output);
    }
  );

  // -------------------------------------------------------------------
  // adb_restart_app
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_restart_app",
    {
      title: "ADB: Перезапустить exteraGram",
      description:
        `Перезапускает приложение ${APP_PACKAGE}: force-stop + am start. ` +
        "Используйте после деплоя плагина для применения изменений.",
      inputSchema: {
        device_serial: z.string().optional(),
      },
    },
    async ({ device_serial }) => {
      const serial = resolveSerial(device_serial);

      const stopCmd = buildAdbCommand(
        `shell am force-stop ${APP_PACKAGE}`,
        serial
      );
      const startCmd = buildAdbCommand(
        `shell am start ${APP_PACKAGE}/.ui.LaunchActivity`,
        serial
      );

      const stopResult = runAdb(stopCmd, 10000);
      if (!stopResult.success) {
        return err(`Ошибка force-stop:\n${stopResult.output}`);
      }

      const startResult = runAdb(startCmd, 10000);
      if (!startResult.success) {
        return err(`Ошибка запуска приложения:\n${startResult.output}`);
      }

      return ok(
        `Приложение ${APP_PACKAGE} перезапущено.\n` +
          `force-stop: ${stopResult.output || "OK"}\n` +
          `am start: ${startResult.output || "OK"}`
      );
    }
  );

  // -------------------------------------------------------------------
  // adb_push_file
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_push_file",
    {
      title: "ADB: Отправить файл на устройство",
      description:
        "Выполняет adb push <local_path> <remote_path>. " +
        "Для произвольных файлов (не плагинов). " +
        "Для деплоя плагина используйте adb_deploy_plugin.",
      inputSchema: {
        local_path: z.string().describe("Локальный путь к файлу"),
        remote_path: z.string().describe("Путь на устройстве"),
        device_serial: z.string().optional(),
      },
    },
    async ({ local_path, remote_path, device_serial }) => {
      const serial = resolveSerial(device_serial);
      const cmd = buildAdbCommand(
        `push "${local_path}" "${remote_path}"`,
        serial
      );
      const result = runAdb(cmd, 60000);

      if (!result.success) {
        return err(`Ошибка adb push:\n${result.output}\nКоманда: ${cmd}`);
      }

      return ok(
        `Файл отправлен успешно.\nЛокально: ${local_path}\nУстройство: ${remote_path}\n\n${result.output}`
      );
    }
  );

  // -------------------------------------------------------------------
  // adb_pull_file
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_pull_file",
    {
      title: "ADB: Получить файл с устройства",
      description:
        "Выполняет adb pull <remote_path> <local_path>. " +
        "Позволяет получить файлы с устройства, например логи или данные плагина.",
      inputSchema: {
        remote_path: z.string().describe("Путь на устройстве"),
        local_path: z.string().describe("Локальный путь сохранения"),
        device_serial: z.string().optional(),
      },
    },
    async ({ remote_path, local_path, device_serial }) => {
      const serial = resolveSerial(device_serial);
      const cmd = buildAdbCommand(
        `pull "${remote_path}" "${local_path}"`,
        serial
      );
      const result = runAdb(cmd, 60000);

      if (!result.success) {
        return err(`Ошибка adb pull:\n${result.output}`);
      }

      return ok(
        `Файл получен успешно.\nУстройство: ${remote_path}\nЛокально: ${local_path}\n\n${result.output}`
      );
    }
  );

  // -------------------------------------------------------------------
  // adb_shell
  // -------------------------------------------------------------------
  server.registerTool(
    "adb_shell",
    {
      title: "ADB: Выполнить shell-команду",
      description:
        "Выполняет произвольную команду через adb shell. Полный доступ без ограничений. " +
        "Возвращает stdout, stderr и exit code. " +
        "Примеры: 'ls /data/user/0/com.exteragram.messenger/files/', " +
        "'cat /proc/cpuinfo', 'ps | grep exteragram'.",
      inputSchema: {
        command: z.string().describe("Shell-команда для выполнения"),
        device_serial: z.string().optional(),
        timeout_ms: z
          .number()
          .int()
          .optional()
          .describe("Таймаут в миллисекундах (по умолчанию 15000)"),
      },
    },
    async ({ command, device_serial, timeout_ms }) => {
      const serial = resolveSerial(device_serial);
      const timeout = timeout_ms ?? 15000;
      const cmd = buildAdbCommand(`shell ${command}`, serial);
      const result = runAdb(cmd, timeout);

      const status = result.success ? "Успешно" : "Ошибка";

      return result.success
        ? ok(`[${status}] Команда: ${cmd}\n\n${result.output}`)
        : err(`[${status}] Команда: ${cmd}\n\n${result.output}`);
    }
  );
}
