# [P] Bulletin — Всплывающие уведомления

## Назначение

Генерация вызовов BulletinHelper — небольшие уведомления в стиле Telegram
в нижней части экрана. Все методы автоматически выполняются на UI thread.

---

## Инструменты

### generate_bulletin

**Параметры:**
```
type            "info" | "error" | "success" | "simple" | "two_line" |
                "with_button" | "undo" | "copied" | "link_copied" |
                "file_gallery" | "file_downloads"
message         string?   — для info/error/success/simple/with_button/copied
title           string?   — для two_line
subtitle        string?   — для two_line и undo
icon_res_id     string?   — Python-выражение int (для simple/two_line/with_button)
button_text     string?   — для with_button
on_click        string?   — callback для with_button
on_undo         string?   — callback для undo (обязательный)
on_action       string?   — callback для undo (опциональный)
is_private_link boolean?  — для link_copied
is_video        boolean?  — для file_gallery
amount          integer?  — для file_gallery/file_downloads
file_type       string?   — enum name для file_downloads
duration        "SHORT" | "LONG" | "PROLONG"? — default: PROLONG
fragment        string?   — Python-выражение фрагмента (опционально)
```

**Возвращает (примеры по типу):**

```python
# info / error / success
BulletinHelper.show_info("Готово!", fragment)
BulletinHelper.show_error("Произошла ошибка")
BulletinHelper.show_success("Сохранено")

# simple (с кастомной иконкой)
BulletinHelper.show_simple("Обработка...", R_tg.raw.timer, fragment)

# two_line
BulletinHelper.show_two_line("Заголовок", "Подзаголовок", R_tg.raw.ic_info, fragment)

# with_button
BulletinHelper.show_with_button(
    "Выполнено",
    R_tg.raw.ic_check,
    "Отменить",
    lambda: handle_cancel(),
    fragment,
    duration=BulletinHelper.DURATION_LONG,
)

# undo
BulletinHelper.show_undo(
    "Сообщение удалено",
    on_undo=lambda: restore_message(),
    on_action=lambda: confirm_delete(),
    subtitle="Нажмите для отмены",
    fragment=fragment,
)

# copied
BulletinHelper.show_copied_to_clipboard("Ссылка скопирована", fragment)

# link_copied
BulletinHelper.show_link_copied(is_private_link_info=False, fragment=fragment)

# file_gallery
BulletinHelper.show_file_saved_to_gallery(is_video=False, amount=1, fragment=fragment)

# file_downloads
BulletinHelper.show_file_saved_to_downloads(file_type_enum_name="UNKNOWN", amount=1, fragment=fragment)
```

---

## Все сигнатуры BulletinHelper

```python
show_info(message: str, fragment: Optional[BaseFragment] = None)
show_error(message: str, fragment: Optional[BaseFragment] = None)
show_success(message: str, fragment: Optional[BaseFragment] = None)
show_simple(text: str, icon_res_id: int, fragment: Optional[BaseFragment] = None)
show_two_line(title: str, subtitle: str, icon_res_id: int, fragment: Optional[BaseFragment] = None)
show_with_button(text: str, icon_res_id: int, button_text: str, on_click: Optional[Callable[[], None]], fragment: Optional[BaseFragment] = None, duration: int = BulletinHelper.DURATION_PROLONG)
show_undo(text: str, on_undo: Callable[[], None], on_action: Optional[Callable[[], None]] = None, subtitle: Optional[str] = None, fragment: Optional[BaseFragment] = None)
show_copied_to_clipboard(message: Optional[str] = None, fragment: Optional[BaseFragment] = None)
show_link_copied(is_private_link_info: bool = False, fragment: Optional[BaseFragment] = None)
show_file_saved_to_gallery(is_video: bool = False, amount: int = 1, fragment: Optional[BaseFragment] = None)
show_file_saved_to_downloads(file_type_enum_name: str = "UNKNOWN", amount: int = 1, fragment: Optional[BaseFragment] = None)
```

## Константы длительности

| Константа                        | Значение  |
|----------------------------------|-----------|
| `BulletinHelper.DURATION_SHORT`  | 1500 мс   |
| `BulletinHelper.DURATION_LONG`   | 2750 мс   |
| `BulletinHelper.DURATION_PROLONG`| 5000 мс   |

---

## Нужные импорты

```python
from ui.bulletin import BulletinHelper
from org.telegram.messenger import R as R_tg  # для icon_res_id
```
