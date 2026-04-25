/**
 * Центральный модуль TypeScript-типов для MCP-сервера exteragram-mcp.
 *
 * Содержит все общие интерфейсы, перечисления и вспомогательные типы,
 * используемые инструментами генерации Python-кода, управлением состоянием
 * и ADB-деплоем.
 */

// ---------------------------------------------------------------------------
// Контекст плагина
// ---------------------------------------------------------------------------

/**
 * Метаданные плагина exteraGram, соответствующие константам __xxx__ в .py файле.
 * Все поля парсятся через AST — допустимы только строковые литералы.
 */
export interface PluginMetadata {
  /** Уникальный идентификатор: 2-32 символа, /^[a-z][a-z0-9_-]{1,31}$/ */
  id: string;
  /** Отображаемое имя плагина */
  name: string;
  /** Краткое описание */
  description?: string;
  /** Имя автора */
  author?: string;
  /** Версия в формате semver (по умолчанию "1.0.0") */
  version?: string;
  /** Drawable resource path, например "exteraPlugins/1" */
  icon?: string;
  /** Минимальная версия приложения, например ">=12.5.1" */
  app_version?: string;
  /** Минимальная версия SDK, например ">=1.4.3.6" */
  sdk_version?: string;
  /** Зависимости PEP 508 для __requirements__ */
  requirements?: string[];
}

/**
 * Полный контекст текущего рабочего плагина.
 * Хранится в памяти сервера на протяжении MCP-сессии.
 */
export interface PluginContext {
  /** Уникальный идентификатор плагина */
  plugin_id: string;
  /** Отображаемое имя */
  plugin_name: string;
  /** Локальный путь к .py файлу */
  file_path: string;
  /** Серийный номер ADB-устройства (опционально) */
  device_serial?: string;
  /** Имена зарегистрированных хуков через self.add_hook / add_on_send_message_hook */
  registered_hooks: Set<string>;
  /** Метаданные плагина */
  metadata: PluginMetadata;
}

// ---------------------------------------------------------------------------
// Перечисления SDK
// ---------------------------------------------------------------------------

/** Стратегии обработки результата хука */
export type HookStrategy = "DEFAULT" | "CANCEL" | "MODIFY" | "MODIFY_FINAL";

/** События жизненного цикла приложения */
export type AppEvent = "START" | "STOP" | "PAUSE" | "RESUME";

/** Типы контекстных меню плагина */
export type MenuType =
  | "MESSAGE_CONTEXT_MENU"
  | "DRAWER_MENU"
  | "CHAT_ACTION_MENU"
  | "PROFILE_ACTION_MENU";

/** Типы хуков запросов и обновлений */
export type HookType =
  | "pre_request"
  | "post_request"
  | "on_update"
  | "on_updates"
  | "on_send_message";

/** Режим парсинга текста для форматирования */
export type ParseMode = "HTML" | "Markdown";

/** Типы компонентов UI настроек плагина */
export type SettingsComponentType =
  | "Header"
  | "Divider"
  | "Switch"
  | "Selector"
  | "Input"
  | "EditText"
  | "Text"
  | "Custom";

/** Типы диалогов AlertDialogBuilder */
export type AlertType = "message" | "loading" | "spinner";

/** Типы bulletin-уведомлений BulletinHelper */
export type BulletinType =
  | "info"
  | "error"
  | "success"
  | "simple"
  | "two_line"
  | "with_button"
  | "undo"
  | "copied"
  | "link_copied"
  | "file_gallery"
  | "file_downloads";

/** Стили Xposed хуков */
export type HookStyle = "MethodHook" | "MethodReplacement" | "functional";

/** Константы длительности bulletin */
export type BulletinDuration = "SHORT" | "LONG" | "PROLONG";

// ---------------------------------------------------------------------------
// Спецификации для генераторов кода
// ---------------------------------------------------------------------------

/** Спецификация компонента настроек для generate_settings_ui */
export interface SettingsComponentSpec {
  type: SettingsComponentType;
  key?: string;
  text?: string;
  default?: string | boolean | number;
  subtext?: string;
  icon?: string;
  items?: string[];
  hint?: string;
  on_change?: string;
  on_long_click?: string;
  on_click?: string;
  link_alias?: string;
  accent?: boolean;
  red?: boolean;
  multiline?: boolean;
  max_length?: number;
  mask?: string;
  create_sub_fragment?: string;
  /** Для Custom: "uitem" | "view" | "factory" */
  variant?: "uitem" | "view" | "factory";
  item?: string;
  view?: string;
  factory?: string;
  factory_args?: string[];
}

/** Спецификация HookFilter для Xposed хуков */
export interface HookFilterSpec {
  type:
    | "RESULT_IS_NULL"
    | "RESULT_IS_TRUE"
    | "RESULT_IS_FALSE"
    | "RESULT_NOT_NULL"
    | "ResultIsInstanceOf"
    | "ResultEqual"
    | "ResultNotEqual"
    | "ArgumentIsNull"
    | "ArgumentNotNull"
    | "ArgumentIsFalse"
    | "ArgumentIsTrue"
    | "ArgumentIsInstanceOf"
    | "ArgumentEqual"
    | "ArgumentNotEqual"
    | "Condition"
    | "Or";
  /** Для ResultIsInstanceOf / ArgumentIsInstanceOf */
  class_var?: string;
  /** Для ResultEqual / ResultNotEqual / ArgumentEqual / ArgumentNotEqual */
  value?: string;
  /** Для аргументных фильтров */
  index?: number;
  /** Для Condition: MVEL-выражение */
  mvel_expr?: string;
  /** Для Condition: объект контекста */
  obj?: string;
  /** Для Or: вложенные фильтры */
  filters?: HookFilterSpec[];
}

/** Спецификация кнопки диалога AlertDialog */
export interface AlertButtonSpec {
  text: string;
  callback: string;
}

/** Спецификация поля Java-класса для Class Proxy */
export interface JavaFieldSpec {
  name: string;
  java_type: string;
  default?: string;
  getter?: string;
  setter?: string;
}

/** Спецификация метода Java-класса для Class Proxy */
export interface JavaMethodSpec {
  java_method_name: string;
  python_name: string;
  arg_types?: string[];
  return_type?: string;
  body?: string;
}

// ---------------------------------------------------------------------------
// Результаты инструментов
// ---------------------------------------------------------------------------

/**
 * Стандартный ответ инструмента MCP.
 * Совместим с CallToolResult SDK (@modelcontextprotocol/sdk).
 * Index signature [x: string]: unknown обязателен для совместимости с SDK.
 */
export interface ToolResult {
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// Конфигурация ADB
// ---------------------------------------------------------------------------

/** Конфигурация ADB-соединения */
export interface AdbConfig {
  /** Путь к бинарнику adb (по умолчанию из PATH) */
  adbPath: string;
  /** Серийный номер устройства по умолчанию */
  defaultSerial?: string;
  /** Таймаут команд в миллисекундах */
  timeoutMs: number;
}

/** Путь к директории плагинов на устройстве */
export const DEVICE_PLUGINS_DIR =
  "/data/user/0/com.exteragram.messenger/files/plugins";

/** Package name приложения */
export const APP_PACKAGE = "com.exteragram.messenger";

/** Порт dev-сервера на устройстве */
export const DEV_SERVER_PORT = 42690;
