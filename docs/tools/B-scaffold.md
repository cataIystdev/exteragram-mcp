# [B] Scaffold — Генерация файла плагина

## Назначение

Генерация полного `.py`-файла или отдельных блоков (метаданные, импорты).
Единственный инструмент, возвращающий полный файл целиком.

---

## Инструменты

### generate_plugin_file

Генерирует полный `.py` файл плагина, готовый к записи на диск.

**Параметры:**
```
id            string    — __id__
name          string    — __name__
description   string?   — __description__
author        string?   — __author__
version       string?   — __version__ (default: "1.0.0")
icon          string?   — __icon__ (пример: "exteraPlugins/1")
app_version   string?   — __app_version__ (пример: ">=12.5.1")
sdk_version   string?   — __sdk_version__ (пример: ">=1.4.3.6")
requirements  string[]? — __requirements__ (PEP 508)
```

**Возвращает:** полный Python-файл со структурой:
```python
from base_plugin import BasePlugin

__id__ = "my_plugin"
__name__ = "My Plugin"
__description__ = "..."
__author__ = "..."
__version__ = "1.0.0"
__icon__ = "exteraPlugins/1"
__app_version__ = ">=12.5.1"
__sdk_version__ = ">=1.4.3.6"
# __requirements__ = ["lib1", "lib2"]  — только если указаны


class MyPlugin(BasePlugin):
    def on_plugin_load(self):
        pass
```

**Важно:**
- Имя класса = CamelCase из `id` (пример: `my_plugin` → `MyPluginPlugin` или `MyPlugin`)
- Метаданные через AST: строго `__field__ = "literal"` (не переменные, не выражения)
- `__requirements__` включается в файл только если не пустой

---

### generate_metadata_block

Генерирует только блок констант метаданных.

**Параметры:** те же что у `generate_plugin_file`.

**Возвращает:**
```python
__id__ = "my_plugin"
__name__ = "My Plugin"
...
```

---

### generate_import_block

Генерирует блок импортов для указанных модулей SDK.

**Параметры:**
```
modules  string[]  — список нужных модулей
```

**Поддерживаемые значения и соответствующие импорты:**

| module              | import statement                                              |
|---------------------|---------------------------------------------------------------|
| `base_plugin`       | `from base_plugin import BasePlugin`                          |
| `hook_result`       | `from base_plugin import HookResult, HookStrategy`           |
| `menu`              | `from base_plugin import MenuItemData, MenuItemType`          |
| `app_event`         | `from base_plugin import AppEvent`                            |
| `xposed`            | `from base_plugin import MethodHook, MethodReplacement, BaseHook, HookFilter, hook_filters` |
| `settings`          | `from ui.settings import Header, Divider, Switch, Selector, Input, Text, EditText, Custom` |
| `alert`             | `from ui.alert import AlertDialogBuilder`                     |
| `bulletin`          | `from ui.bulletin import BulletinHelper`                      |
| `android_utils`     | `from android_utils import R, OnClickListener, OnLongClickListener, run_on_ui_thread, log, copy_to_clipboard` |
| `client_utils`      | `from client_utils import ...` (перечисление нужных функций)  |
| `file_utils`        | `from file_utils import ...`                                  |
| `hook_utils`        | `from hook_utils import find_class, get_private_field, set_private_field, get_static_private_field, set_static_private_field` |
| `text_formatting`   | `from extera_utils.text_formatting import parse_text`         |
| `class_proxy`       | `from extera_utils.class_proxy import java_subclass, joverride, joverload, jmethod, jfield, jMVELmethod, jMVELoverride, jconstructor, jpreconstructor, jgetmethod, jsetmethod, jclassbuilder, Base` |
| `java_helper`       | `from extera_utils.class_proxy import J, PyObj`               |

**Возвращает:** готовые строки импортов без дублирования.
