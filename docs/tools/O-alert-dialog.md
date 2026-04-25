# [O] Alert Dialog — Модальные диалоги

## Назначение

Генерация AlertDialogBuilder — модальных диалогов в стиле Telegram
поверх текущего фрагмента.

---

## Инструменты

### generate_alert_dialog

**Параметры:**
```
dialog_type     "message" | "loading" | "spinner"
title           string?
message         string?
positive_btn    { text: string, callback: string }?
negative_btn    { text: string, callback: string }?
neutral_btn     { text: string, callback: string }?
cancelable      boolean?   — default: true
dim_enabled     boolean?
blurred_bg      boolean?
make_positive_red  boolean?
make_negative_red  boolean?
set_view        string?    — Python-выражение View
items           { items_expr: string, callback: string, icons_expr: string? }?
top_image       { res_id: string, bg_color: string }?
top_animation   { res_id: string, size: string, auto_repeat: boolean, bg_color: string }?
on_dismiss      string?    — callback
on_cancel       string?    — callback
```

**Константы диалога:**
```
"message"  → ALERT_TYPE_MESSAGE (default)
"loading"  → ALERT_TYPE_LOADING (горизонтальный прогресс-бар)
"spinner"  → ALERT_TYPE_SPINNER (indeterminate spinner)
```

**Возвращает (пример полного диалога):**
```python
from ui.alert import AlertDialogBuilder
from client_utils import get_last_fragment

activity = get_last_fragment().getParentActivity()
builder = AlertDialogBuilder(activity, AlertDialogBuilder.ALERT_TYPE_MESSAGE)
builder.set_title("Заголовок")
builder.set_message("Текст сообщения")
builder.set_positive_button("OK", lambda builder, which: handle_ok())
builder.set_negative_button("Отмена", None)
builder.set_cancelable(True)
builder.show()
```

**Для loading-диалога с обновлением прогресса:**
```python
builder = AlertDialogBuilder(activity, AlertDialogBuilder.ALERT_TYPE_LOADING)
builder.set_title("Загрузка...")
builder.show()
# Позже:
builder.set_progress(75)  # 0-100
builder.dismiss()
```

**Для диалога со списком:**
```python
builder.set_items(["Пункт 1", "Пункт 2"], lambda which: handle_item(which), None)
```

---

## Все методы AlertDialogBuilder

### Инициализация и жизненный цикл
```python
AlertDialogBuilder(context, progress_style=ALERT_TYPE_MESSAGE, resources_provider=None)
create() -> AlertDialogBuilder
show() -> AlertDialogBuilder
dismiss()
get_dialog() -> Optional[AlertDialog]
```

### Контент
```python
set_title(title: str)
set_message(message: str)
set_message_text_view_clickable(clickable: bool)
set_view(view: View, height: int = -2)
set_items(items: List[str], listener: Optional[Callable] = None, icons: Optional[List[int]] = None)
```

### Кнопки
```python
set_positive_button(text: str, listener: Optional[Callable] = None)
set_negative_button(text: str, listener: Optional[Callable] = None)
set_neutral_button(text: str, listener: Optional[Callable] = None)
make_button_red(button_type: int)   # BUTTON_POSITIVE или BUTTON_NEGATIVE
get_button(button_type: int) -> Optional[View]
```

### Слушатели
```python
set_on_back_button_listener(listener: Optional[Callable] = None)
set_on_dismiss_listener(listener: Optional[Callable] = None)
set_on_cancel_listener(listener: Optional[Callable] = None)
```

### Внешний вид
```python
set_top_image(res_id: int, background_color: int)
set_top_drawable(drawable: Drawable, background_color: int)
set_top_animation(res_id: int, size: int, auto_repeat: bool, background_color: int, layer_colors: Optional[Dict[str, int]] = None)
set_dim_enabled(enabled: bool)
set_dialog_button_color_key(theme_key: int)
set_blurred_background(blur: bool, blur_behind_if_possible: bool = True)
set_cancelable(cancelable: bool)
set_canceled_on_touch_outside(cancel: bool)
set_progress(progress: int)  # для ALERT_TYPE_LOADING, 0-100
```

---

## Нужные импорты

```python
from ui.alert import AlertDialogBuilder
from client_utils import get_last_fragment
```
