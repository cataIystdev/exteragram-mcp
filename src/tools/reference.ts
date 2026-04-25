/**
 * [R] Инструменты документации и справочников SDK.
 *
 * Предоставляет справочники по всем перечислениям, константам, компонентам,
 * классам и паттернам SDK exteraGram. Не генерирует код — возвращает
 * структурированную документацию для агентов.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listTemplates, getTemplate } from "../codegen/templates.js";
import type { TemplateName } from "../codegen/templates.js";
import type { ToolResult } from "../types.js";

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Регистрирует все инструменты группы [R] на MCP-сервере.
 *
 * @param server - экземпляр McpServer
 */
export function registerReferenceTools(server: McpServer): void {
  // -------------------------------------------------------------------
  // list_hook_strategies
  // -------------------------------------------------------------------
  server.registerTool(
    "list_hook_strategies",
    {
      title: "Справка: HookStrategy",
      description:
        "Возвращает таблицу всех значений HookStrategy с описаниями. " +
        "Используется в HookResult для управления поведением хуков запросов, " +
        "обновлений и исходящих сообщений.",
      inputSchema: {},
    },
    async () => {
      return ok(
        `HookStrategy — стратегии обработки хуков\n` +
          `Импорт: from base_plugin import HookStrategy\n\n` +
          `  DEFAULT      — Ничего не делать, передать управление следующему хуку\n` +
          `  CANCEL       — Отменить операцию полностью\n` +
          `  MODIFY       — Применить изменения, позволить другим хукам обработать\n` +
          `  MODIFY_FINAL — Применить изменения, остановить дальнейшую обработку\n\n` +
          `Использование:\n` +
          `  HookResult()                                          # DEFAULT\n` +
          `  HookResult(strategy=HookStrategy.CANCEL)\n` +
          `  HookResult(strategy=HookStrategy.MODIFY, params=params)\n` +
          `  HookResult(strategy=HookStrategy.MODIFY_FINAL, request=request)`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_app_events
  // -------------------------------------------------------------------
  server.registerTool(
    "list_app_events",
    {
      title: "Справка: AppEvent",
      description:
        "Возвращает таблицу всех значений AppEvent с описаниями. " +
        "Используется в on_app_event(event_type: AppEvent).",
      inputSchema: {},
    },
    async () => {
      return ok(
        `AppEvent — события жизненного цикла приложения\n` +
          `Импорт: from base_plugin import AppEvent\n\n` +
          `  START   — Приложение запускается\n` +
          `  STOP    — Приложение завершается\n` +
          `  PAUSE   — Приложение уходит в фон\n` +
          `  RESUME  — Приложение возвращается на передний план\n\n` +
          `Использование:\n` +
          `  def on_app_event(self, event_type: AppEvent):\n` +
          `      if event_type == AppEvent.START:\n` +
          `          pass`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_menu_types
  // -------------------------------------------------------------------
  server.registerTool(
    "list_menu_types",
    {
      title: "Справка: MenuItemType",
      description:
        "Возвращает все типы меню с описаниями и ключами context dict. " +
        "Используется в MenuItemData(menu_type=MenuItemType.XXX).",
      inputSchema: {},
    },
    async () => {
      return ok(
        `MenuItemType — типы контекстных меню\n` +
          `Импорт: from base_plugin import MenuItemData, MenuItemType\n\n` +
          `  MESSAGE_CONTEXT_MENU  — Долгое нажатие на сообщение\n` +
          `  DRAWER_MENU           — Боковое меню (гамбургер)\n` +
          `  CHAT_ACTION_MENU      — Меню действий в чате\n` +
          `  PROFILE_ACTION_MENU   — Меню действий в профиле/канале\n\n` +
          `Context dict ключи в on_click(context: dict):\n` +
          `  account, context, fragment, dialog_id,\n` +
          `  user, userId, userFull,\n` +
          `  chat, chatId, chatFull,\n` +
          `  encryptedChat, message, groupedMessages, botInfo\n\n` +
          `Необязательные поля MenuItemData: item_id, icon, subtext, condition, priority`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_settings_components
  // -------------------------------------------------------------------
  server.registerTool(
    "list_settings_components",
    {
      title: "Справка: компоненты настроек",
      description:
        "Возвращает таблицу всех компонентов UI настроек с обязательными " +
        "и опциональными параметрами. Используется в create_settings().",
      inputSchema: {},
    },
    async () => {
      return ok(
        `Компоненты UI настроек — from ui.settings import ...\n\n` +
          `Header(text)                               — Заголовок секции\n` +
          `Divider(text?)                             — Разделитель с опциональной подписью\n` +
          `Switch(key, text, default: bool,           — Переключатель\n` +
          `       subtext?, icon?, on_change?, link_alias?)\n` +
          `Selector(key, text, default: int,          — Выпадающий список\n` +
          `         items: List[str], icon?, on_change?)\n` +
          `Input(key, text, default?: str,            — Однострочный ввод\n` +
          `      subtext?, icon?, on_change?, link_alias?)\n` +
          `EditText(key, hint: str, default?: str,    — Многострочный ввод\n` +
          `         multiline?, max_length?, mask?, on_change?)\n` +
          `Text(text, subtext?, icon?,                — Кликабельный текст\n` +
          `     accent?, red?, on_click?,\n` +
          `     create_sub_fragment?, link_alias?)\n` +
          `Custom(item?, view?, factory?,             — Кастомная строка\n` +
          `       factory_args?, on_click?)\n\n` +
          `Методы: self.get_setting(key, default), self.set_setting(key, value)\n` +
          `        self.export_settings(), self.import_settings(dict)`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_available_libraries
  // -------------------------------------------------------------------
  server.registerTool(
    "list_available_libraries",
    {
      title: "Справка: доступные библиотеки",
      description:
        "Возвращает список pre-installed Python-библиотек и инструкцию " +
        "по добавлению зависимостей через __requirements__.",
      inputSchema: {},
    },
    async () => {
      return ok(
        `Python 3.11 — pre-installed библиотеки (не нужны в __requirements__):\n\n` +
          `  beautifulsoup4  — парсинг HTML/XML (web scraping)\n` +
          `  debugpy         — удалённый отладчик Microsoft (порт 5678)\n` +
          `  lxml            — XML/HTML toolkit\n` +
          `  packaging       — утилиты управления пакетами Python\n` +
          `  pillow          — обработка изображений (PIL fork)\n` +
          `  requests        — HTTP-запросы\n` +
          `  PyYAML          — YAML парсер\n\n` +
          `Добавление через pip (__requirements__ в метаданных плагина):\n` +
          `  __requirements__ = ["mpmath", "tinydb>=4.0"]\n\n` +
          `Ограничения __requirements__:\n` +
          `  - Только pure-Python wheels (universal: -none-any.whl)\n` +
          `  - Бинарные расширения ЗАПРЕЩЕНЫ:\n` +
          `    numpy, pandas, scipy, cryptography, opencv — НЕ поддерживаются\n` +
          `  - Все плагины разделяют одно окружение (возможны конфликты версий)\n` +
          `  - Требует интернет при первой установке плагина пользователем`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_common_classes
  // -------------------------------------------------------------------
  server.registerTool(
    "list_common_classes",
    {
      title: "Справка: общие классы Telegram/Android",
      description:
        "Возвращает FQN-пути наиболее используемых Java-классов Telegram и Android. " +
        "Используются в find_class(), Xposed-хуках и рефлексии.",
      inputSchema: {
        filter: z
          .string()
          .optional()
          .describe("Фильтр по имени класса (подстрока, без учёта регистра)"),
      },
    },
    async ({ filter }) => {
      const classes = [
        {
          name: "LaunchActivity",
          fqn: "org.telegram.ui.LaunchActivity",
          desc: "Инициализация приложения, обработка deep links",
        },
        {
          name: "ProfileActivity",
          fqn: "org.telegram.ui.ProfileActivity",
          desc: "Профиль пользователя и канала",
        },
        {
          name: "ChatActivity",
          fqn: "org.telegram.ui.ChatActivity",
          desc: "Интерфейс чата",
        },
        {
          name: "ChatMessageCell",
          fqn: "org.telegram.ui.Cells.ChatMessageCell",
          desc: "Рендеринг отдельного сообщения",
        },
        {
          name: "MessageObject",
          fqn: "org.telegram.messenger.MessageObject",
          desc: "Обёртка над TLRPC.Message",
        },
        {
          name: "AndroidUtilities",
          fqn: "org.telegram.messenger.AndroidUtilities",
          desc: "Набор Android-утилит (dp(), runOnUIThread()...)",
        },
        {
          name: "MessagesController",
          fqn: "org.telegram.messenger.MessagesController",
          desc: "Управление состоянием и Telegram-запросами",
        },
        {
          name: "MessagesStorage",
          fqn: "org.telegram.messenger.MessagesStorage",
          desc: "Локальная БД; поле .database для SQLite-запросов",
        },
        {
          name: "SendMessagesHelper",
          fqn: "org.telegram.messenger.SendMessagesHelper",
          desc: "Отправка всех типов сообщений и файлов",
        },
        {
          name: "BulletinFactory",
          fqn: "org.telegram.ui.Components.BulletinFactory",
          desc: "Создание bulletin-уведомлений",
        },
        {
          name: "AlertDialog",
          fqn: "org.telegram.ui.ActionBar.AlertDialog",
          desc: "Модальные диалоги поверх фрагмента",
        },
        {
          name: "TLRPC",
          fqn: "org.telegram.tgnet / org.telegram.tgnet.tl",
          desc: "TL-объекты запросов и ответов Telegram",
        },
      ];

      const filtered = filter
        ? classes.filter(
            (c) =>
              c.name.toLowerCase().includes(filter.toLowerCase()) ||
              c.fqn.toLowerCase().includes(filter.toLowerCase())
          )
        : classes;

      if (filtered.length === 0) {
        return ok(`Нет классов, соответствующих фильтру "${filter}"`);
      }

      const table = filtered
        .map(({ name, fqn, desc }) => `  ${name}\n    FQN: ${fqn}\n    ${desc}`)
        .join("\n\n");

      return ok(
        `Общие Java-классы Telegram/Android:\n\n${table}\n\n` +
          `Исходники: https://github.com/DrKLO/Telegram\n` +
          `TL Schema: https://corefork.telegram.org/schema`
      );
    }
  );

  // -------------------------------------------------------------------
  // get_plugin_template
  // -------------------------------------------------------------------
  server.registerTool(
    "get_plugin_template",
    {
      title: "Получить шаблон плагина",
      description:
        "Возвращает готовый Python-код шаблона плагина. " +
        "Шаблоны: minimal (минимальная структура), hello_world (из официальной доки, " +
        "перехват .hello команды), settings_demo (все компоненты настроек), " +
        "xposed_demo (паттерн Xposed-хука).",
      inputSchema: {
        template: z
          .enum(["minimal", "hello_world", "settings_demo", "xposed_demo"])
          .describe("Ключ шаблона"),
      },
    },
    async ({ template }) => {
      const templates = listTemplates();
      const entry = templates.find((t) => t.name === template);

      if (!entry) {
        return ok(
          `Доступные шаблоны:\n${templates.map((t) => `  ${t.name}: ${t.title}`).join("\n")}`
        );
      }

      const code = getTemplate(template as TemplateName);
      return ok(`Шаблон: ${entry.title}\n${entry.description}\n\n---\n\n${code}`);
    }
  );

  // -------------------------------------------------------------------
  // explain_pitfalls
  // -------------------------------------------------------------------
  server.registerTool(
    "explain_pitfalls",
    {
      title: "Справка: типичные ошибки",
      description:
        "Возвращает список задокументированных ошибок (pitfalls) при разработке плагинов. " +
        "Все пункты взяты из официальной документации exteraGram SDK.",
      inputSchema: {},
    },
    async () => {
      return ok(
        `Типичные ошибки при разработке плагинов exteraGram:\n\n` +
          `1. ХУК НЕ РЕГИСТРИРУЕТСЯ\n` +
          `   Определить on_send_message_hook недостаточно.\n` +
          `   Вызвать self.add_on_send_message_hook() в on_plugin_load обязательно.\n` +
          `   Аналогично: self.add_hook("messages.sendMessage") для request-хуков.\n\n` +
          `2. ДИНАМИЧЕСКИЕ МЕТАДАННЫЕ\n` +
          `   __id__, __name__ и другие __xxx__ парсятся через AST.\n` +
          `   __id__ = some_var или __id__ = get_id() — ОШИБКА.\n` +
          `   Только строковые литералы: __id__ = "my_plugin"\n\n` +
          `3. НЕБЕЗОПАСНЫЙ ДОСТУП К params.message\n` +
          `   params.message может отсутствовать или быть не строкой.\n` +
          `   Всегда: if not isinstance(getattr(params, "message", None), str): return HookResult()\n\n` +
          `4. UI-ОПЕРАЦИИ ВНЕ UI-ПОТОКА\n` +
          `   Хуки выполняются НЕ на UI-потоке.\n` +
          `   Для изменений View: run_on_ui_thread(lambda: my_view.setText("text"))\n\n` +
          `5. getClass() НА CLASS ОБЪЕКТЕ (Xposed)\n` +
          `   НЕ вызывать getClass() на результате find_class().\n` +
          `   Использовать результат find_class() напрямую.\n\n` +
          `6. write_file БЕЗ ДИРЕКТОРИИ\n` +
          `   write_file() не создаёт родительские директории.\n` +
          `   Вызвать ensure_dir_exists(os.path.dirname(path)) перед write_file.\n\n` +
          `7. РЕФЛЕКСИЯ ЛОМАЕТСЯ ПРИ ОБНОВЛЕНИИ\n` +
          `   find_class, get_private_field — хрупки при обновлении приложения.\n` +
          `   Всегда оборачивать в try-except и проверять None.\n\n` +
          `8. ИМЯ ФАЙЛА НЕ СОВПАДАЕТ С __id__\n` +
          `   Файл ДОЛЖЕН называться <__id__>.py.\n` +
          `   Если __id__ = "my_plugin", файл = my_plugin.py.\n\n` +
          `9. БИНАРНЫЕ БИБЛИОТЕКИ В __requirements__\n` +
          `   numpy, pandas, cryptography, opencv — ЗАПРЕЩЕНЫ.\n` +
          `   Только pure-Python wheels (-none-any.whl).\n\n` +
          `10. БЛОКИРУЮЩИЕ ОПЕРАЦИИ НА UI-ПОТОКЕ\n` +
          `    Сеть и тяжёлые вычисления — через run_on_queue(..., PLUGINS_QUEUE).\n` +
          `    Результаты передавать обратно через run_on_ui_thread(...).`
      );
    }
  );

  // -------------------------------------------------------------------
  // list_hook_filters
  // -------------------------------------------------------------------
  server.registerTool(
    "list_hook_filters",
    {
      title: "Справка: HookFilter",
      description:
        "Возвращает все доступные HookFilter с сигнатурами и описаниями. " +
        "Используются в @hook_filters() или before_filters=/after_filters= параметрах. " +
        "Требует импорт: from base_plugin import HookFilter, hook_filters",
      inputSchema: {},
    },
    async () => {
      return ok(
        `HookFilter — фильтры Xposed-хуков\n` +
          `Импорт: from base_plugin import HookFilter, hook_filters\n\n` +
          `Фильтры по результату (для after_hooked_method):\n` +
          `  HookFilter.RESULT_IS_NULL            — результат == null\n` +
          `  HookFilter.RESULT_IS_TRUE            — результат == true\n` +
          `  HookFilter.RESULT_IS_FALSE           — результат == false\n` +
          `  HookFilter.RESULT_NOT_NULL           — результат != null\n` +
          `  HookFilter.ResultIsInstanceOf(clazz) — результат instanceof clazz\n` +
          `  HookFilter.ResultEqual(value)        — результат == value\n` +
          `  HookFilter.ResultNotEqual(value)     — результат != value\n\n` +
          `Фильтры по аргументам:\n` +
          `  HookFilter.ArgumentIsNull(index)           — args[index] == null\n` +
          `  HookFilter.ArgumentNotNull(index)          — args[index] != null\n` +
          `  HookFilter.ArgumentIsFalse(index)          — args[index] == false\n` +
          `  HookFilter.ArgumentIsTrue(index)           — args[index] == true\n` +
          `  HookFilter.ArgumentIsInstanceOf(index, c)  — args[index] instanceof c\n` +
          `  HookFilter.ArgumentEqual(index, value)     — args[index] == value\n` +
          `  HookFilter.ArgumentNotEqual(index, value)  — args[index] != value\n\n` +
          `Составные фильтры:\n` +
          `  HookFilter.Condition(mvel_expr, obj?)   — MVEL-выражение истинно\n` +
          `  HookFilter.Or(*filters)                 — хотя бы один фильтр истинен\n\n` +
          `Использование (декоратор):\n` +
          `  @hook_filters(HookFilter.RESULT_NOT_NULL, HookFilter.ArgumentIsInstanceOf(0, MyClass))\n` +
          `  def before_hooked_method(self, param): ...\n\n` +
          `Использование (functional хук):\n` +
          `  self.hook_method(method, before=fn, before_filters=[HookFilter.RESULT_NOT_NULL])`
      );
    }
  );
}
