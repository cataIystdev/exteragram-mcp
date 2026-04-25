# Обзор групп инструментов

Полный список всех 76 MCP-инструментов по группам.
Соответствие с планом: каждая группа описана в [../../plan/tools/](../../plan/tools/).

## [A] Контекст плагина — `src/tools/context.ts`

| Инструмент               | Описание                                      |
|--------------------------|-----------------------------------------------|
| `set_plugin_context`     | Установить текущий рабочий плагин             |
| `get_plugin_context`     | Получить текущий контекст                     |
| `clear_plugin_context`   | Очистить контекст                             |
| `validate_plugin_metadata` | Валидировать метаданные без сохранения      |

## [B] Scaffold — `src/tools/scaffold.ts`

| Инструмент               | Описание                                      |
|--------------------------|-----------------------------------------------|
| `generate_plugin_file`   | Полный .py файл плагина                       |
| `generate_metadata_block`| Блок __id__, __name__ и других метаданных     |
| `generate_import_block`  | Строки импортов для выбранных модулей         |

## [C] Lifecycle — `src/tools/lifecycle.ts`

| Инструмент                  | Описание                                   |
|-----------------------------|--------------------------------------------|
| `generate_on_plugin_load`   | Метод on_plugin_load с комментарием        |
| `generate_on_plugin_unload` | Метод on_plugin_unload                     |
| `generate_on_app_event`     | Метод on_app_event(event_type: AppEvent)   |

## [D] Settings — `src/tools/settings.ts`

| Инструмент                       | Описание                               |
|----------------------------------|----------------------------------------|
| `generate_settings_ui`           | Полный метод create_settings()         |
| `generate_settings_component`    | Один компонент UI (8 типов)            |
| `generate_get_setting`           | self.get_setting(key, default)         |
| `generate_set_setting`           | self.set_setting(key, value)           |
| `generate_export_import_settings`| export_settings / import_settings      |
| `generate_simple_setting_factory`| SimpleSettingFactory                   |

## [E] Menu — `src/tools/menu.ts`

| Инструмент           | Описание                                          |
|----------------------|---------------------------------------------------|
| `generate_menu_item` | add_menu_item(MenuItemData) + callback-шаблон     |

## [F] Request Hooks — `src/tools/request-hooks.ts`

| Инструмент                    | Описание                               |
|-------------------------------|----------------------------------------|
| `generate_pre_request_hook`   | Хук до отправки TL-запроса             |
| `generate_post_request_hook`  | Хук после получения ответа             |
| `generate_on_update_hook`     | Хук отдельного обновления              |
| `generate_on_updates_hook`    | Хук контейнера обновлений              |

## [G] Message Hook — `src/tools/message-hook.ts`

| Инструмент                    | Описание                               |
|-------------------------------|----------------------------------------|
| `generate_send_message_hook`  | on_send_message_hook + регистрация     |
| `generate_hook_result`        | Конструктор HookResult по стратегии    |

## [H] Client Utils — `src/tools/client-utils.ts`

| Инструмент                       | Описание                               |
|----------------------------------|----------------------------------------|
| `generate_send_message`          | send_text/photo/document/video/audio   |
| `generate_edit_message`          | edit_message(message_obj, ...)         |
| `generate_send_request`          | send_request(TLObject, callback)       |
| `generate_notification_listener` | NotificationCenterDelegate подкласс    |
| `generate_queue_call`            | run_on_queue(fn, QUEUE, delay)         |
| `list_controllers`               | Все get_*() контроллеры                |
| `list_queue_constants`           | Константы очередей                     |

## [I] Android Utils — `src/tools/android-utils.ts`

| Инструмент                  | Описание                                   |
|-----------------------------|--------------------------------------------|
| `generate_ui_thread_call`   | run_on_ui_thread(fn, delay)                |
| `generate_click_listener`   | OnClickListener / OnLongClickListener      |
| `generate_runnable`         | R(callable) — Java Runnable обёртка        |
| `generate_clipboard_copy`   | copy_to_clipboard(text)                    |
| `generate_log`              | log(data) или self.log(data)               |

## [J] Hook Utils — `src/tools/hook-utils.ts`

| Инструмент             | Описание                                         |
|------------------------|--------------------------------------------------|
| `generate_find_class`  | find_class(FQN) с try-except + None-проверкой    |
| `generate_get_field`   | get_private_field / get_static_private_field     |
| `generate_set_field`   | set_private_field / set_static_private_field     |

## [K] File Utils — `src/tools/file-utils.ts`

| Инструмент              | Описание                                        |
|-------------------------|-------------------------------------------------|
| `generate_read_file`    | read_file(path) + None-проверка                 |
| `generate_write_file`   | ensure_dir_exists + write_file                  |
| `generate_delete_file`  | delete_file(path) + проверка результата         |
| `generate_ensure_dir`   | ensure_dir_exists(path)                         |
| `generate_list_dir`     | list_dir(path, ...) с параметрами               |
| `list_standard_dirs`    | Все get_*_dir() с реальными путями              |

## [L] Text Formatting — `src/tools/text-formatting.ts`

| Инструмент            | Описание                                          |
|-----------------------|---------------------------------------------------|
| `generate_parse_text` | parse_text(text, parse_mode, is_caption)          |
| `list_html_tags`      | Таблица HTML-тегов и Markdown-синтаксиса          |

## [M] Class Proxy — `src/tools/class-proxy.ts`

| Инструмент                | Описание                                        |
|---------------------------|-------------------------------------------------|
| `generate_java_subclass`  | @java_subclass(Base) класс                      |
| `generate_joverride`      | @joverride / @joverload метод                   |
| `generate_jfield`         | jfield(type, default, getter, setter)           |
| `generate_jmvel_method`   | jMVELmethod / jMVELoverride                     |
| `generate_java_helper`    | J(obj).field / J(obj).JAccessAll.field          |
| `generate_new_instance`   | new_instance() / new_java_instance()            |
| `generate_from_java`      | ClassName.from_java(java_obj)                   |
| `generate_pyobj`          | PyObj.create(python_obj)                        |
| `generate_jclassbuilder`  | @jclassbuilder() метод                          |

## [N] Xposed Hooking — `src/tools/xposed-hooking.ts`

| Инструмент                    | Описание                                   |
|-------------------------------|--------------------------------------------|
| `generate_method_hook`        | Полный паттерн: find_class + hook_method   |
| `generate_hook_param_usage`   | Сниппеты работы с param                    |
| `generate_hook_filters`       | @hook_filters(...) или before_filters=     |
| `generate_hook_all_methods`   | hook_all_methods(Class, name, handler)     |
| `generate_hook_all_constructors` | hook_all_constructors(Class, handler)   |
| `generate_unhook`             | unhook_method(obj) или цикл               |

## [O] Alert Dialog — `src/tools/alert-dialog.ts`

| Инструмент              | Описание                                        |
|-------------------------|-------------------------------------------------|
| `generate_alert_dialog` | AlertDialogBuilder полный блок                  |

## [P] Bulletin — `src/tools/bulletin.ts`

| Инструмент          | Описание                                            |
|---------------------|-----------------------------------------------------|
| `generate_bulletin` | BulletinHelper.show_*(...)  — 11 типов              |

## [Q] ADB — `src/tools/adb.ts`

| Инструмент               | Описание                                       |
|--------------------------|------------------------------------------------|
| `adb_check_devices`      | adb devices -l                                 |
| `adb_deploy_plugin`      | adb push .py файл на устройство                |
| `adb_list_plugins`       | ls директории плагинов                         |
| `adb_remove_plugin`      | adb shell rm плагина                           |
| `adb_get_logs`           | logcat с фильтром по plugin_id                 |
| `adb_restart_app`        | force-stop + am start                          |
| `adb_push_file`          | Произвольный adb push                          |
| `adb_pull_file`          | Произвольный adb pull                          |
| `adb_shell`              | Произвольная adb shell команда                 |

## [R] Reference — `src/tools/reference.ts`

| Инструмент                  | Описание                                     |
|-----------------------------|----------------------------------------------|
| `list_hook_strategies`      | HookStrategy с описаниями                    |
| `list_app_events`           | AppEvent с описаниями                        |
| `list_menu_types`           | MenuItemType + context dict ключи            |
| `list_settings_components`  | Все компоненты с параметрами                 |
| `list_available_libraries`  | Pre-installed + pip инструкция               |
| `list_common_classes`       | FQN Telegram/Android классов                 |
| `get_plugin_template`       | Готовый шаблон (4 варианта)                  |
| `explain_pitfalls`          | 10 задокументированных ошибок                |
| `list_hook_filters`         | Все HookFilter с сигнатурами                 |
