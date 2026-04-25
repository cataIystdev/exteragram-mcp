/**
 * Вербатимные шаблоны плагинов для инструмента get_plugin_template.
 *
 * Содержит точные примеры из официальной документации exteraGram SDK,
 * а также дополнительные шаблоны для демонстрации различных возможностей SDK.
 */

/** Ключи доступных шаблонов плагинов */
export type TemplateName =
  | "minimal"
  | "hello_world"
  | "settings_demo"
  | "xposed_demo";

/** Описание шаблона */
interface TemplateEntry {
  /** Человекочитаемое название */
  title: string;
  /** Краткое описание шаблона */
  description: string;
  /** Python-код шаблона */
  code: string;
}

/**
 * Реестр всех доступных шаблонов плагинов.
 * Шаблоны "minimal" и "hello_world" взяты дословно из официальной документации.
 */
export const PLUGIN_TEMPLATES: Record<TemplateName, TemplateEntry> = {
  minimal: {
    title: "Минимальный плагин",
    description:
      "Минимальная структура плагина с обязательными метаданными и пустым классом. " +
      "Взят из официальной документации exteraGram SDK.",
    code: `from base_plugin import BasePlugin

__id__ = "hello_world"
__name__ = "Hello World"
__description__ = "My first exteraGram plugin"
__author__ = "Your Name"
__version__ = "1.0.0"
__icon__ = "exteraPlugins/1"
__app_version__ = ">=12.5.1"
__sdk_version__ = ">=1.4.3.6"


class HelloWorldPlugin(BasePlugin):
    pass
`,
  },

  hello_world: {
    title: "Hello World (перехват .hello команды)",
    description:
      "Полный рабочий пример из официальной документации exteraGram SDK. " +
      "Перехватывает команду .hello <name> и заменяет текст сообщения. " +
      "Демонстрирует: on_plugin_load, create_settings, on_send_message_hook.",
    code: `from typing import Any, List

from base_plugin import BasePlugin, HookResult, HookStrategy
from ui.settings import Header, Input, Text

__id__ = "hello_world"
__name__ = "Hello World"
__description__ = "Rewrites .hello commands into a friendly message"
__author__ = "Your Name"
__version__ = "1.0.0"
__icon__ = "exteraPlugins/1"
__app_version__ = ">=12.5.1"
__sdk_version__ = ">=1.4.3.6"


DEFAULT_TEMPLATE = "Hello, {name}!"


class HelloWorldPlugin(BasePlugin):
    def on_plugin_load(self):
        self.add_on_send_message_hook()
        self.log("Hello World plugin loaded")

    def create_settings(self) -> List[Any]:
        return [
            Header(text="Hello World"),
            Input(
                key="template",
                text="Greeting template",
                default=DEFAULT_TEMPLATE,
                subtext="Use {name} where the entered name should appear.",
                icon="msg_edit",
            ),
            Text(
                text="Example",
                subtext=".hello Alice -> Hello, Alice!",
                icon="msg_info",
            ),
        ]

    def on_send_message_hook(self, account: int, params: Any) -> HookResult:
        if not isinstance(getattr(params, "message", None), str):
            return HookResult()

        raw_text = params.message.strip()
        if not raw_text.startswith(".hello"):
            return HookResult()

        parts = raw_text.split(" ", 1)
        name = parts[1].strip() if len(parts) > 1 else ""

        if not name:
            params.message = "Usage: .hello <name>"
            return HookResult(strategy=HookStrategy.MODIFY, params=params)

        template = self.get_setting("template", DEFAULT_TEMPLATE)

        try:
            params.message = template.format(name=name)
        except Exception:
            params.message = (
                "Template must contain valid Python format placeholders, "
                "for example {name}."
            )

        return HookResult(strategy=HookStrategy.MODIFY, params=params)
`,
  },

  settings_demo: {
    title: "Демонстрация настроек",
    description:
      "Показывает все типы компонентов UI настроек: Header, Divider, Switch, " +
      "Selector, Input, EditText, Text. Полезен как справочник для create_settings().",
    code: `from typing import Any, List

from base_plugin import BasePlugin
from ui.settings import Header, Divider, Switch, Selector, Input, EditText, Text

__id__ = "settings_demo"
__name__ = "Settings Demo"
__description__ = "Демонстрация всех компонентов настроек"
__author__ = "CatalystDev"
__version__ = "1.0.0"
__icon__ = "exteraPlugins/1"
__app_version__ = ">=12.5.1"
__sdk_version__ = ">=1.4.3.6"


class SettingsDemoPlugin(BasePlugin):
    def on_plugin_load(self):
        pass

    def create_settings(self) -> List[Any]:
        return [
            Header(text="Основные настройки"),
            Switch(
                key="enabled",
                text="Включить",
                default=True,
                subtext="Включает функциональность плагина",
                icon="msg_settings",
            ),
            Selector(
                key="mode",
                text="Режим работы",
                default=0,
                items=["Авто", "Ручной", "Выключен"],
                icon="msg_customize",
            ),
            Divider(),
            Header(text="Текст"),
            Input(
                key="prefix",
                text="Префикс",
                default="",
                subtext="Добавляется в начало сообщения",
                icon="msg_edit",
            ),
            EditText(
                key="template",
                hint="Введите шаблон...",
                default="",
                multiline=True,
                max_length=500,
            ),
            Divider(text="Дополнительно"),
            Text(
                text="О плагине",
                subtext="Версия 1.0.0",
                icon="msg_info",
            ),
        ]
`,
  },

  xposed_demo: {
    title: "Демонстрация Xposed хука",
    description:
      "Показывает паттерн Xposed-хука: find_class, getDeclaredMethod, hook_method, " +
      "MethodHook с before/after, правильный unhook в on_plugin_unload.",
    code: `from base_plugin import BasePlugin, MethodHook, HookFilter, hook_filters
from hook_utils import find_class
from android_utils import log

__id__ = "xposed_demo"
__name__ = "Xposed Demo"
__description__ = "Демонстрация Xposed хука"
__author__ = "CatalystDev"
__version__ = "1.0.0"
__icon__ = "exteraPlugins/1"
__app_version__ = ">=12.5.1"
__sdk_version__ = ">=1.4.3.6"


class MyMethodHook(MethodHook):
    def before_hooked_method(self, param):
        log(f"before: thisObject={param.thisObject}")

    def after_hooked_method(self, param):
        log(f"after: result={param.getResult()}")


class XposedDemoPlugin(BasePlugin):
    _hook = None

    def on_plugin_load(self):
        try:
            target_class = find_class("org.telegram.ui.ChatActivity")
            if target_class is None:
                log("XposedDemo: класс не найден")
                return
            method = target_class.getDeclaredMethod("onBackPressed")
            self._hook = self.hook_method(method, MyMethodHook(), priority=10)
            log("XposedDemo: хук зарегистрирован")
        except Exception as e:
            log(f"XposedDemo: ошибка регистрации хука: {e}")

    def on_plugin_unload(self):
        if self._hook is not None:
            self.unhook_method(self._hook)
            self._hook = None
`,
  },
};

/**
 * Возвращает Python-код шаблона плагина по его ключу.
 *
 * @param name - ключ шаблона
 * @returns Python-код шаблона
 * @throws Error если шаблон не найден
 */
export function getTemplate(name: TemplateName): string {
  const entry = PLUGIN_TEMPLATES[name];
  if (!entry) {
    throw new Error(`Шаблон "${name}" не найден`);
  }
  return entry.code;
}

/**
 * Возвращает список всех доступных шаблонов с описаниями.
 *
 * @returns массив объектов {name, title, description}
 */
export function listTemplates(): Array<{
  name: TemplateName;
  title: string;
  description: string;
}> {
  return (Object.entries(PLUGIN_TEMPLATES) as Array<[TemplateName, TemplateEntry]>).map(
    ([name, entry]) => ({
      name,
      title: entry.title,
      description: entry.description,
    })
  );
}
