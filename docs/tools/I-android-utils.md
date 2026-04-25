# [I] Android Utils — Утилиты Android UI

## Назначение

Генерация обёрток над Android-специфичными API:
UI-поток, слушатели событий, Runnable, буфер обмена, логирование.

---

## Инструменты

### generate_ui_thread_call

**Параметры:**
```
callable_expr  string   — Python-выражение callable
delay_ms       integer? — задержка в мс (default: 0)
```

**Возвращает:**
```python
run_on_ui_thread(my_function)
# или с задержкой
run_on_ui_thread(my_function, delay=500)
```

---

### generate_click_listener

**Параметры:**
```
type          "click" | "long_click"
handler_name  string  — имя callback-функции
inline        boolean? — lambda вместо функции (default: false)
```

**Возвращает (click, handler):**
```python
def handle_click(view):
    # view — clicked View
    pass

button.setOnClickListener(OnClickListener(handle_click))
```

**Возвращает (long_click, handler):**
```python
def handle_long_click(view):
    # view — clicked View
    # Вернуть True = событие поглощено, False = продолжить обработку
    return True

button.setOnLongClickListener(OnLongClickListener(handle_long_click))
```

---

### generate_runnable

**Параметры:**
```
callable_expr  string  — Python-выражение callable
var_name       string? — имя переменной (default: "runnable")
```

**Возвращает:**
```python
runnable = R(my_task)
some_view.post(runnable)
```

---

### generate_clipboard_copy

**Параметры:**
```
text_expr  string  — Python-выражение строки для копирования
```

**Возвращает:**
```python
copy_to_clipboard(text)
# Автоматически показывает bulletin "Скопировано"
```

---

### generate_log

**Параметры:**
```
data_expr  string  — Python-выражение данных для логирования
```

**Возвращает:**
```python
log(some_object)
# Простые типы (str, int, float, bool, None) — выводятся как текст
# Сложные объекты — передаются Java object inspector
```

---

## Нужные импорты

```python
from android_utils import R, OnClickListener, OnLongClickListener
from android_utils import run_on_ui_thread, log, copy_to_clipboard
from android.view import View
```
