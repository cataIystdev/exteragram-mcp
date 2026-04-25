/**
 * Центральный модуль регистрации инструментов MCP-сервера.
 *
 * Импортирует и регистрирует все 18 групп инструментов (A-R).
 * Каждая группа инструментов изолирована в отдельном файле src/tools/.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerContextTools } from "./tools/context.js";
import { registerScaffoldTools } from "./tools/scaffold.js";
import { registerLifecycleTools } from "./tools/lifecycle.js";
import { registerSettingsTools } from "./tools/settings.js";
import { registerMenuTools } from "./tools/menu.js";
import { registerRequestHookTools } from "./tools/request-hooks.js";
import { registerMessageHookTools } from "./tools/message-hook.js";
import { registerClientUtilsTools } from "./tools/client-utils.js";
import { registerAndroidUtilsTools } from "./tools/android-utils.js";
import { registerHookUtilsTools } from "./tools/hook-utils.js";
import { registerFileUtilsTools } from "./tools/file-utils.js";
import { registerTextFormattingTools } from "./tools/text-formatting.js";
import { registerClassProxyTools } from "./tools/class-proxy.js";
import { registerXposedHookingTools } from "./tools/xposed-hooking.js";
import { registerAlertDialogTools } from "./tools/alert-dialog.js";
import { registerBulletinTools } from "./tools/bulletin.js";
import { registerAdbTools } from "./tools/adb.js";
import { registerReferenceTools } from "./tools/reference.js";

/**
 * Регистрирует все инструменты всех групп на MCP-сервере.
 *
 * Порядок регистрации: A (контекст) -> B (scaffold) -> C (lifecycle) ->
 * D (settings) -> E (menu) -> F (request hooks) -> G (message hook) ->
 * H (client utils) -> I (android utils) -> J (hook utils) ->
 * K (file utils) -> L (text formatting) -> M (class proxy) ->
 * N (xposed hooking) -> O (alert dialog) -> P (bulletin) ->
 * Q (adb) -> R (reference).
 *
 * @param server - экземпляр McpServer
 */
export function registerAllTools(server: McpServer): void {
  registerContextTools(server);       // [A] Управление контекстом плагина
  registerScaffoldTools(server);      // [B] Генерация файла плагина
  registerLifecycleTools(server);     // [C] Методы жизненного цикла
  registerSettingsTools(server);      // [D] UI настроек
  registerMenuTools(server);          // [E] Пункты меню
  registerRequestHookTools(server);   // [F] Хуки запросов и обновлений
  registerMessageHookTools(server);   // [G] Хук исходящих сообщений
  registerClientUtilsTools(server);   // [H] Клиентские утилиты
  registerAndroidUtilsTools(server);  // [I] Android-утилиты
  registerHookUtilsTools(server);     // [J] Java-рефлексия
  registerFileUtilsTools(server);     // [K] Файловые операции
  registerTextFormattingTools(server);// [L] Форматирование текста
  registerClassProxyTools(server);    // [M] Class Proxy DSL
  registerXposedHookingTools(server); // [N] Xposed-хуки
  registerAlertDialogTools(server);   // [O] Модальные диалоги
  registerBulletinTools(server);      // [P] Bulletin-уведомления
  registerAdbTools(server);           // [Q] ADB-деплой
  registerReferenceTools(server);     // [R] Справочники SDK
}
