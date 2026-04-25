# [C] Lifecycle — Методы жизненного цикла

## Назначение

Генерация методов жизненного цикла BasePlugin:
`on_plugin_load`, `on_plugin_unload`, `on_app_event`.

---

## Инструменты

### generate_on_plugin_load

Генерирует метод `on_plugin_load`.

**Параметры:**
```
body  string?  — тело метода (если не задано — только pass + комментарий)
```

**Возвращает:**
```python
def on_plugin_load(self):
    # Вызывается при включении плагина или запуске приложения.
    # Регистрируйте здесь хуки, слушатели и фоновые задачи.
    pass
```

**Примечание:** Документация указывает, что именно здесь должны быть вызовы
`self.add_hook(...)`, `self.add_on_send_message_hook()`,
`self.add_menu_item(...)` и `self.hook_method(...)`.

**`self.log()`** — BasePlugin предоставляет собственный метод логирования:
```python
self.log("Plugin loaded")  # из BasePlugin, не нужен импорт android_utils
```
Это удобный алиас, доступный через `self` внутри класса плагина.
`log()` из `android_utils` — отдельная функция, используется вне класса.

---

### generate_on_plugin_unload

Генерирует метод `on_plugin_unload`.

**Параметры:**
```
body  string?  — тело метода (если не задано — только pass)
```

**Возвращает:**
```python
def on_plugin_unload(self):
    # Вызывается при отключении плагина или завершении приложения.
    # Освободите ресурсы, отмените подписки.
    pass
```

---

### generate_on_app_event

Генерирует метод `on_app_event` с обработкой указанных событий.

**Параметры:**
```
events  ("START" | "STOP" | "PAUSE" | "RESUME")[]  — события для обработки
```

**Возвращает** (пример для events=["START", "PAUSE"]):
```python
def on_app_event(self, event_type: AppEvent):
    if event_type == AppEvent.START:
        pass
    elif event_type == AppEvent.PAUSE:
        pass
```

**Нужный импорт:** `from base_plugin import AppEvent`
