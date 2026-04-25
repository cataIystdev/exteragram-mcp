# [R] Reference — Справочники и шаблоны

## Назначение

Инструменты для получения справочной информации по SDK,
готовых шаблонов плагинов и списка типичных ошибок.
Не генерируют код — возвращают документацию.

---

## Инструменты

### list_hook_strategies

Возвращает таблицу всех значений HookStrategy с описаниями.

| Стратегия      | Когда применять                                               |
|----------------|---------------------------------------------------------------|
| `DEFAULT`      | Ничего не делать, передать управление следующему хуку         |
| `CANCEL`       | Полностью отменить операцию                                   |
| `MODIFY`       | Вернуть изменённый объект, позволить другим хукам обработать  |
| `MODIFY_FINAL` | Вернуть изменённый объект, остановить всю дальнейшую обработку|

---

### list_app_events

| Событие  | Когда возникает                        |
|----------|----------------------------------------|
| `START`  | Приложение запускается                 |
| `STOP`   | Приложение завершается                 |
| `PAUSE`  | Приложение уходит в фон                |
| `RESUME` | Приложение возвращается на передний план|

---

### list_menu_types

| Тип                    | Где появляется                                    |
|------------------------|---------------------------------------------------|
| `MESSAGE_CONTEXT_MENU` | Долгое нажатие на сообщение                       |
| `DRAWER_MENU`          | Боковое меню (гамбургер)                          |
| `CHAT_ACTION_MENU`     | Меню действий в чате (скрепка и т.п.)             |
| `PROFILE_ACTION_MENU`  | Меню действий на странице профиля/канала          |

Context dict ключи: `account, context, fragment, dialog_id, user, userId, userFull,
chat, chatId, chatFull, encryptedChat, message, groupedMessages, botInfo`

---

### list_queue_constants

| Константа               | Строковое значение    | Назначение                         |
|-------------------------|-----------------------|------------------------------------|
| `STAGE_QUEUE`           | `"stageQueue"`        | Основная очередь стадий            |
| `GLOBAL_QUEUE`          | `"globalQueue"`       | Глобальная очередь                 |
| `CACHE_CLEAR_QUEUE`     | `"cacheClearQueue"`   | Очистка кеша                       |
| `SEARCH_QUEUE`          | `"searchQueue"`       | Поисковые операции                 |
| `PHONE_BOOK_QUEUE`      | `"phoneBookQueue"`    | Контакты телефонной книги          |
| `THEME_QUEUE`           | `"themeQueue"`        | Операции с темами                  |
| `EXTERNAL_NETWORK_QUEUE`| `"externalNetworkQueue"` | Внешние сетевые запросы         |
| `PLUGINS_QUEUE`         | `"pluginsQueue"`      | **Рекомендуется для плагинов**     |

---

### list_settings_components

Полная таблица компонентов с обязательными и опциональными параметрами.
(См. [D-settings.md](D-settings.md) для деталей каждого)

| Компонент | Обязательные параметры    | Ключевые опциональные                     |
|-----------|--------------------------|-------------------------------------------|
| Header    | `text`                   | —                                         |
| Divider   | —                        | `text`                                    |
| Switch    | `key, text, default`     | `subtext, icon, on_change, link_alias`    |
| Selector  | `key, text, default, items` | `icon, on_change`                      |
| Input     | `key, text`              | `default, subtext, icon, on_change, link_alias` |
| EditText  | `key, hint`              | `default, multiline, max_length, mask, on_change` |
| Text      | `text`                   | `subtext, icon, accent, red, on_click, create_sub_fragment, link_alias` |
| Custom    | —                        | `item, view, factory, factory_args, on_click` |

---

### list_available_libraries

Pre-installed (не нужно в `__requirements__`):
- `beautifulsoup4` — парсинг HTML/XML
- `debugpy` — удалённый отладчик (Microsoft)
- `lxml` — XML/HTML toolkit
- `packaging` — утилиты управления пакетами
- `pillow` — работа с изображениями
- `requests` — HTTP-запросы
- `PyYAML` — YAML парсер

Pip-установка через `__requirements__`:
```python
__requirements__ = ["mpmath", "tinydb"]
```
- Только pure-Python wheels (universal: `-none-any.whl`)
- Бинарные расширения (numpy, pandas, cryptography, opencv) — **не поддерживаются**
- Установка при инсталляции плагина пользователем
- Все плагины разделяют одно окружение (возможны конфликты версий)

---

### list_common_classes

| Класс             | FQN                                          | Назначение                               |
|-------------------|----------------------------------------------|------------------------------------------|
| LaunchActivity    | `org.telegram.ui.LaunchActivity`             | Инициализация приложения, deep links     |
| ProfileActivity   | `org.telegram.ui.ProfileActivity`            | Профиль пользователя/канала              |
| ChatActivity      | `org.telegram.ui.ChatActivity`               | Интерфейс чата                           |
| ChatMessageCell   | `org.telegram.ui.Cells.ChatMessageCell`      | Рендеринг сообщений                      |
| MessageObject     | `org.telegram.messenger.MessageObject`       | Обёртка над TLRPC.Message                |
| AndroidUtilities  | `org.telegram.messenger.AndroidUtilities`    | Набор утилит Android                     |
| MessagesController| `org.telegram.messenger.MessagesController`  | Управление состоянием, Telegram запросы  |
| MessagesStorage   | `org.telegram.messenger.MessagesStorage`     | Локальная БД + поле `database` для SQLite|
| SendMessagesHelper| `org.telegram.messenger.SendMessagesHelper`  | Отправка всех типов сообщений            |
| BulletinFactory   | `org.telegram.ui.Components.BulletinFactory` | Фабрика bulletin-уведомлений             |
| AlertDialog       | `org.telegram.ui.ActionBar.AlertDialog`      | Модальные диалоги                        |
| TLRPC             | `org.telegram.tgnet` / `org.telegram.tgnet.tl` | TL-объекты запросов и ответов          |

Исходный код: https://github.com/DrKLO/Telegram
TL Schema: https://corefork.telegram.org/schema

---

### get_plugin_template

Возвращает готовый вербатимный пример плагина из документации.

**Параметры:**
```
template  "minimal" | "hello_world"
```

Полные коды — см. [codegen/plugin-templates.md](../codegen/plugin-templates.md).

---

### explain_pitfalls

Возвращает список типичных ошибок из документации:

1. **Хук не регистрируется**: определить `on_send_message_hook` — недостаточно.
   Нужно вызвать `self.add_on_send_message_hook()` в `on_plugin_load`.
   Аналогично для `add_hook(name)` для request/update хуков.

2. **Динамические метаданные**: `__id__`, `__name__` и другие `__xxx__` поля
   парсятся через AST. Нельзя писать `__id__ = get_id()` или `__id__ = ID_VAR`.
   Только строковые литералы.

3. **Проверка params.message**: перед работой с `params.message` всегда проверять
   `isinstance(getattr(params, "message", None), str)` — поле может отсутствовать.

4. **UI на UI-потоке**: любые изменения View/UI компонентов — только через
   `run_on_ui_thread(...)`. Хук-коллбэки могут выполняться не на UI-потоке.

5. **getClass() в Xposed**: не вызывать `getClass()` на объекте Class.
   Использовать результат `find_class()` напрямую.

6. **write_file без директории**: `write_file()` не создаёт родительские директории.
   Всегда вызывать `ensure_dir_exists(...)` перед `write_file(...)`.

7. **Рефлексия хрупка**: `find_class`, `get_private_field` и т.д. могут сломаться
   при обновлении приложения. Всегда оборачивать в try-except.

8. **Имя файла == ID**: файл плагина должен называться `<plugin_id>.py`.
   Несоответствие — плагин не загрузится.

9. **Binary extensions**: нельзя использовать numpy, pandas, cryptography и другие
   библиотеки с C-расширениями через `__requirements__`.

10. **Блокирующие операции на UI**: сетевые запросы, тяжёлые вычисления —
    только через `run_on_queue(..., PLUGINS_QUEUE)`, не на UI-потоке.
