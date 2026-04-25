# [H] Client Utils — Отправка сообщений, запросы, контроллеры

## Назначение

Генерация вызовов клиентских утилит: отправка/редактирование сообщений,
TL-запросы, очереди, подписки на уведомления, доступ к контроллерам.

---

## Инструменты

### generate_send_message

**Параметры:**
```
type         "text" | "photo" | "document" | "video" | "audio"
peer_id      string  — Python-выражение peer_id
content      string  — для text: текст; для остальных: путь к файлу
caption      string? — для медиа (photo/document/video/audio)
parse_mode   "HTML" | "Markdown" | null
reply_to     string? — Python-выражение replyToMsg объекта
high_quality boolean? — только для photo (default: false)
```

**Возвращает** (примеры):
```python
# text
send_text(peer_id, "Привет!", parse_mode="HTML")

# photo
send_photo(peer_id, "/path/to/photo.jpg", caption="<b>Фото</b>", high_quality=True, parse_mode="HTML")

# document
send_document(peer_id, "/path/to/file.pdf", caption="Документ")

# video
send_video(peer_id, "/path/to/video.mp4", caption="Видео")

# audio
send_audio(peer_id, "/path/to/audio.mp3", caption="Аудио")
```

---

### generate_send_message_low_level

Генерирует `send_message(params_dict, parse_mode)` для низкоуровневого использования.

**Параметры:**
```
params_keys   string[]  — ключи словаря params
parse_mode    "HTML" | "Markdown" | null
```

**Возвращает:**
```python
send_message({
    "peer": peer_id,
    "message": "text",
    # ...
}, parse_mode="HTML")
```

---

### generate_edit_message

**Параметры:**
```
message_var   string   — переменная MessageObject
text          string?  — новый текст (Python-выражение)
file_path     string?  — новый файл (Python-выражение)
with_spoiler  boolean? — default False
parse_mode    "HTML" | "Markdown" | null
```

**Возвращает:**
```python
edit_message(message_obj, text="Новый текст", parse_mode="HTML")
# или
edit_message(message_obj, file_path="/path/to/new.jpg", with_spoiler=True)
```

---

### generate_send_request

Генерирует отправку произвольного TL-запроса.

**Параметры:**
```
request_var    string  — Python-выражение TLObject
callback_name  string  — имя callback-функции
```

**Возвращает:**
```python
def my_callback(response, error):
    if error is not None:
        log(f"Ошибка: {error}")
        return
    # Обработайте response здесь

request_id = send_request(my_request, my_callback)
```

---

### generate_notification_listener

Генерирует класс-наследник `NotificationCenterDelegate`.

**Параметры:**
```
class_name          string    — имя Python-класса
notification_ids    string[]  — идентификаторы уведомлений для подписки
register_in_load    boolean?  — добавить регистрацию в on_plugin_load
```

**Возвращает:**
```python
class MyListener(NotificationCenterDelegate):
    def didReceivedNotification(self, id: int, account: int, args):
        if id == NotificationCenter.someNotification:
            # Обработайте уведомление здесь
            pass
```

И код регистрации для `on_plugin_load`:
```python
self.my_listener = MyListener()
get_notification_center().addObserver(self.my_listener, NotificationCenter.someNotification)
```

---

### generate_queue_call

**Параметры:**
```
callable_name  string   — Python-выражение callable
queue          string   — имя константы очереди
delay_ms       integer? — задержка в мс (default: 0)
```

**Возвращает:**
```python
run_on_queue(my_function, PLUGINS_QUEUE, delay_ms=500)
```

---

### list_controllers

Возвращает полный справочник всех getter-функций контроллеров:

| Функция                       | Возвращает                        |
|-------------------------------|-----------------------------------|
| `get_last_fragment()`         | Текущий фрагмент UI               |
| `get_account_instance()`      | Экземпляр аккаунта                |
| `get_messages_controller()`   | MessagesController                |
| `get_contacts_controller()`   | ContactsController                |
| `get_media_data_controller()` | MediaDataController               |
| `get_connections_manager()`   | ConnectionsManager                |
| `get_location_controller()`   | LocationController                |
| `get_notifications_controller()` | NotificationsController        |
| `get_messages_storage()`      | MessagesStorage (+ SQLite access) |
| `get_send_messages_helper()`  | SendMessagesHelper                |
| `get_file_loader()`           | FileLoader                        |
| `get_secret_chat_helper()`    | SecretChatHelper                  |
| `get_download_controller()`   | DownloadController                |
| `get_notifications_settings()` | NotificationsSettings            |
| `get_notification_center()`   | NotificationCenter                |
| `get_media_controller()`      | MediaController                   |
| `get_user_config()`           | UserConfig                        |

---

## Нужные импорты

```python
from client_utils import (
    run_on_queue, get_queue_by_name,
    send_request, send_text, send_photo, send_document, send_video, send_audio,
    send_message, edit_message,
    NotificationCenterDelegate,
    get_last_fragment, get_account_instance, get_messages_controller,
    get_contacts_controller, get_media_data_controller, get_connections_manager,
    get_location_controller, get_notifications_controller, get_messages_storage,
    get_send_messages_helper, get_file_loader, get_secret_chat_helper,
    get_download_controller, get_notifications_settings, get_notification_center,
    get_media_controller, get_user_config,
    STAGE_QUEUE, GLOBAL_QUEUE, CACHE_CLEAR_QUEUE, SEARCH_QUEUE,
    PHONE_BOOK_QUEUE, THEME_QUEUE, EXTERNAL_NETWORK_QUEUE, PLUGINS_QUEUE
)
```
