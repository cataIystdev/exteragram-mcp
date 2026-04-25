/**
 * Модуль управления состоянием текущего рабочего плагина.
 *
 * Хранит PluginContext в памяти MCP-сервера на протяжении всей сессии.
 * Предоставляет CRUD-операции, валидацию метаданных и отслеживание
 * зарегистрированных хуков.
 *
 * Ограничение: состояние хранится только в памяти — при перезапуске сервера
 * контекст сбрасывается.
 */

import type { PluginContext, PluginMetadata } from "../types.js";

// ---------------------------------------------------------------------------
// Хранилище контекста
// ---------------------------------------------------------------------------

/**
 * Единственный активный контекст плагина.
 * null означает что контекст ещё не установлен.
 */
let currentContext: PluginContext | null = null;

// ---------------------------------------------------------------------------
// Валидация
// ---------------------------------------------------------------------------

/** Регулярное выражение для валидации plugin_id */
const PLUGIN_ID_REGEX = /^[a-z][a-z0-9_-]{1,31}$/;

/** Регулярное выражение для версии с оператором (например ">=12.5.1") */
const VERSION_WITH_OP_REGEX = /^(>=|>|==|<=|<)\d+\.\d+(\.\d+)*$/;

/** Регулярное выражение для semver */
const SEMVER_REGEX = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/;

/**
 * Ошибка валидации метаданных плагина.
 * Содержит поле `field` для идентификации некорректного поля.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Результат валидации метаданных плагина.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Валидирует метаданные плагина.
 *
 * Проверяет:
 * - __id__: regex /^[a-z][a-z0-9_-]{1,31}$/
 * - __version__: semver формат если задан
 * - __app_version__ / __sdk_version__: оператор + версия (>=12.5.1)
 * - __requirements__: каждая строка непустая (PEP 508 синтаксис не проверяется)
 *
 * @param metadata - метаданные для проверки
 * @returns результат валидации с массивом ошибок
 */
export function validateMetadata(metadata: Partial<PluginMetadata>): ValidationResult {
  const errors: ValidationError[] = [];

  // Проверка __id__
  if (!metadata.id) {
    errors.push({ field: "__id__", message: "Поле __id__ обязательно" });
  } else if (!PLUGIN_ID_REGEX.test(metadata.id)) {
    errors.push({
      field: "__id__",
      message:
        `__id__ должен содержать 2-32 символа, начинаться с латинской буквы, ` +
        `содержать только [a-z0-9_-]. Получено: "${metadata.id}"`,
    });
  }

  // Проверка __name__
  if (!metadata.name) {
    errors.push({ field: "__name__", message: "Поле __name__ обязательно" });
  }

  // Проверка __version__ (опционально)
  if (metadata.version !== undefined && metadata.version !== "") {
    if (!SEMVER_REGEX.test(metadata.version)) {
      errors.push({
        field: "__version__",
        message: `__version__ должен быть в формате semver. Получено: "${metadata.version}"`,
      });
    }
  }

  // Проверка __app_version__ (опционально)
  if (metadata.app_version !== undefined && metadata.app_version !== "") {
    if (!VERSION_WITH_OP_REGEX.test(metadata.app_version)) {
      errors.push({
        field: "__app_version__",
        message:
          `__app_version__ должен быть в формате ">=X.Y.Z". Получено: "${metadata.app_version}"`,
      });
    }
  }

  // Проверка __sdk_version__ (опционально)
  if (metadata.sdk_version !== undefined && metadata.sdk_version !== "") {
    if (!VERSION_WITH_OP_REGEX.test(metadata.sdk_version)) {
      errors.push({
        field: "__sdk_version__",
        message:
          `__sdk_version__ должен быть в формате ">=X.Y.Z". Получено: "${metadata.sdk_version}"`,
      });
    }
  }

  // Проверка __requirements__ (опционально)
  if (metadata.requirements) {
    metadata.requirements.forEach((req, idx) => {
      if (!req || req.trim() === "") {
        errors.push({
          field: `__requirements__[${idx}]`,
          message: `Элемент __requirements__[${idx}] не может быть пустой строкой`,
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// CRUD операции
// ---------------------------------------------------------------------------

/**
 * Устанавливает текущий контекст плагина.
 *
 * @param pluginId - уникальный ID плагина
 * @param pluginName - отображаемое имя
 * @param filePath - локальный путь к .py файлу
 * @param deviceSerial - серийный номер ADB-устройства (опционально)
 * @returns результат валидации; при ошибках контекст не сохраняется
 */
export function setPluginContext(
  pluginId: string,
  pluginName: string,
  filePath: string,
  deviceSerial?: string
): ValidationResult {
  const validation = validateMetadata({ id: pluginId, name: pluginName });
  if (!validation.valid) {
    return validation;
  }

  currentContext = {
    plugin_id: pluginId,
    plugin_name: pluginName,
    file_path: filePath,
    device_serial: deviceSerial,
    registered_hooks: new Set<string>(),
    metadata: {
      id: pluginId,
      name: pluginName,
    },
  };

  return { valid: true, errors: [] };
}

/**
 * Возвращает текущий контекст плагина.
 *
 * @returns текущий контекст или null если не установлен
 */
export function getPluginContext(): PluginContext | null {
  return currentContext;
}

/**
 * Очищает текущий контекст плагина.
 */
export function clearPluginContext(): void {
  currentContext = null;
}

/**
 * Обновляет метаданные в текущем контексте.
 * Контекст должен быть установлен до вызова.
 *
 * @param metadata - частичные метаданные для обновления
 * @throws Error если контекст не установлен
 */
export function updateContextMetadata(metadata: Partial<PluginMetadata>): void {
  if (!currentContext) {
    throw new Error("Контекст плагина не установлен. Вызовите set_plugin_context сначала.");
  }
  currentContext.metadata = { ...currentContext.metadata, ...metadata };
}

/**
 * Регистрирует хук в наборе зарегистрированных хуков контекста.
 * Используется инструментами генерации хуков для отслеживания состояния.
 *
 * @param hookName - имя хука (например "on_send_message" или "messages.sendMessage")
 * @throws Error если контекст не установлен
 */
export function registerHook(hookName: string): void {
  if (!currentContext) {
    throw new Error("Контекст плагина не установлен. Вызовите set_plugin_context сначала.");
  }
  currentContext.registered_hooks.add(hookName);
}

/**
 * Проверяет, зарегистрирован ли данный хук в контексте.
 *
 * @param hookName - имя хука
 * @returns true если хук зарегистрирован
 */
export function isHookRegistered(hookName: string): boolean {
  if (!currentContext) return false;
  return currentContext.registered_hooks.has(hookName);
}

/**
 * Сериализует текущий контекст в человекочитаемый JSON для вывода агенту.
 *
 * @returns строка JSON или сообщение об отсутствии контекста
 */
export function serializeContext(): string {
  if (!currentContext) {
    return "Контекст плагина не установлен. Используйте инструмент set_plugin_context.";
  }

  const serializable = {
    plugin_id: currentContext.plugin_id,
    plugin_name: currentContext.plugin_name,
    file_path: currentContext.file_path,
    device_serial: currentContext.device_serial ?? null,
    registered_hooks: Array.from(currentContext.registered_hooks),
    metadata: currentContext.metadata,
  };

  return JSON.stringify(serializable, null, 2);
}
