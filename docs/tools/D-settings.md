# [D] Settings UI — Настройки плагина

## Назначение

Генерация метода `create_settings()` и отдельных компонентов UI настроек,
а также вспомогательных вызовов get/set_setting.

---

## Инструменты

### generate_settings_ui

Генерирует полный метод `create_settings()`.

**Параметры:**
```
components  ComponentSpec[]  — список компонентов в порядке отображения
```

**Возвращает:**
```python
from typing import Any, List
from ui.settings import Header, Switch, Input, ...

def create_settings(self) -> List[Any]:
    return [
        Header(text="..."),
        Switch(key="...", text="...", default=False),
        ...
    ]
```

---

### generate_settings_component

Генерирует конструктор одного компонента.

**Параметры (зависят от type):**

#### Header
```
type    "Header"
text    string   — заголовок секции
```
Результат: `Header(text="Заголовок")`

#### Divider
```
type    "Divider"
text    string?  — опциональный подпись-разделитель
```
Результат: `Divider()` или `Divider(text="...")`

#### Switch
```
type         "Switch"
key          string        — ключ хранения (обязательно)
text         string        — метка (обязательно)
default      boolean       — начальное значение (обязательно)
subtext      string?       — подпись под меткой
icon         string?       — drawable name (пример: "msg_settings")
on_change    string?       — имя callback-функции, принимает new_value: bool
on_long_click string?      — имя callback-функции
link_alias   string?       — alias для deeplink копирования
```

#### Selector
```
type         "Selector"
key          string        — ключ хранения (обязательно)
text         string        — метка (обязательно)
default      integer       — начальный индекс (обязательно)
items        string[]      — список вариантов (обязательно)
icon         string?
on_change    string?       — callback, принимает new_index: int
on_long_click string?
```

#### Input
```
type         "Input"
key          string        — ключ хранения (обязательно)
text         string        — метка (обязательно)
default      string?       — начальное значение
subtext      string?
icon         string?
on_change    string?       — callback, принимает new_value: str
link_alias   string?
```

#### EditText
```
type         "EditText"
key          string        — ключ хранения (обязательно)
hint         string        — placeholder (обязательно)
default      string?       — начальное значение
multiline    boolean?
max_length   integer?
mask         string?
on_change    string?       — callback, принимает new_value: str
```

#### Text
```
type              "Text"
text              string    — метка (обязательно)
subtext           string?
icon              string?
accent            boolean?  — акцентный цвет
red               boolean?  — красный цвет
on_click          string?   — callback
create_sub_fragment string? — callback, возвращает List для вложенных настроек
link_alias        string?
```

#### Custom (три варианта)
```
type          "Custom"
variant       "uitem" | "view" | "factory"

# uitem:
item          string   — Python-выражение (пример: "UItem.asShadow('текст')")

# view:
view          string   — Python-выражение (пример: "label")

# factory:
factory       string   — имя SimpleSettingFactory переменной
factory_args  string[] — позиционные аргументы
on_click      string?  — callback
```

---

### generate_get_setting

**Параметры:**
```
key            string  — ключ
default_value  string  — Python-выражение для значения по умолчанию
var_name       string? — имя переменной для присваивания
```

**Возвращает:**
```python
value = self.get_setting("key_name", default_value)
```

---

### generate_set_setting

**Параметры:**
```
key             string   — ключ
value_expr      string   — Python-выражение значения
reload_settings boolean? — default False
```

**Возвращает:**
```python
self.set_setting("key_name", value, reload_settings=True)
```

---

### generate_export_import_settings

Генерирует вызовы `export_settings()` / `import_settings()`.

**Параметры:**
```
operation  "export" | "import"
var_name   string?  — имя переменной (для export)
data_expr  string?  — Python-выражение dict (для import)
reload     boolean? — reload_settings при import (default: True)
```

**Возвращает (export):**
```python
settings_data = self.export_settings()
# settings_data — dict со всеми ключами и значениями плагина
```

**Возвращает (import):**
```python
self.import_settings({"key": "value", "enabled": True})
# или с отключённой перезагрузкой UI:
self.import_settings(data, reload_settings=False)
```

---

### generate_simple_setting_factory

Генерирует определение `SimpleSettingFactory`.

**Параметры:**
```
factory_name      string   — имя переменной
create_fn         string   — имя функции создания View
bind_fn           string   — имя функции заполнения View
is_clickable      boolean?
is_shadow         boolean?
create_item_fn    string?
on_click_fn       string?
on_long_click_fn  string?
```

**Возвращает:**
```python
from ui.settings import SimpleSettingFactory

factory_name = SimpleSettingFactory(
    create_view=create_fn,
    bind_view=bind_fn,
    is_clickable=True,
    on_click=on_click_fn,
)
```

Callback-сигнатуры (для документирования агенту):
- `create_view(context, list_view, current_account: int, class_guid: int, resources_provider) -> View`
- `bind_view(view, item, divider: bool, adapter, list_view) -> None`
- `on_click(plugin, item, view) -> None`
- `on_long_click(plugin, item, view) -> bool`
- `create_item(plugin, setting, args) -> UItem`
- `attached_view(list_view, view, item) -> None`
