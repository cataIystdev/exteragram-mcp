# [K] File Utils — Работа с файлами

## Назначение

Генерация операций с файлами и директориями:
чтение, запись, удаление, перечисление, стандартные директории.

---

## Инструменты

### generate_read_file

**Параметры:**
```
path_expr   string   — Python-выражение пути к файлу
var_name    string?  — имя переменной результата (default: "content")
```

**Возвращает:**
```python
content = read_file("/path/to/file.txt")
if content is None:
    log("Файл не найден или ошибка чтения")
```

---

### generate_write_file

**Параметры:**
```
path_expr     string  — Python-выражение пути к файлу
content_expr  string  — Python-выражение содержимого (str)
ensure_dir    boolean? — добавить ensure_dir_exists (default: true)
```

**Возвращает:**
```python
ensure_dir_exists(os.path.dirname("/path/to/file.txt"))
write_file("/path/to/file.txt", content)
```

**Примечание:** `write_file` не создаёт родительские директории автоматически.
Инструмент всегда добавляет `ensure_dir_exists` по умолчанию.

---

### generate_delete_file

**Параметры:**
```
path_expr  string  — Python-выражение пути к файлу
check_result boolean? — добавить проверку возвращаемого значения (default: true)
```

**Возвращает:**
```python
success = delete_file("/path/to/file.txt")
if not success:
    log("Не удалось удалить файл (не существует или ошибка)")
```

---

### generate_ensure_dir

**Параметры:**
```
path_expr  string  — Python-выражение пути к директории
```

**Возвращает:**
```python
ensure_dir_exists("/path/to/directory")
```

---

### generate_list_dir

**Параметры:**
```
path_expr      string    — Python-выражение пути к директории
recursive      boolean?  — включить поддиректории (default: false)
include_files  boolean?  — включить файлы (default: true)
include_dirs   boolean?  — включить директории (default: false)
extensions     string[]? — фильтр по расширениям (пример: [".json", ".txt"])
var_name       string?   — имя переменной результата
```

**Возвращает:**
```python
files = list_dir(
    get_plugins_dir(),
    recursive=False,
    include_files=True,
    include_dirs=False,
    extensions=[".py"],
)
```

---

### list_standard_dirs

Возвращает справочник всех стандартных getter-функций с реальными путями:

| Функция              | Реальный путь на устройстве                                              |
|----------------------|--------------------------------------------------------------------------|
| `get_plugins_dir()`  | `/data/user/0/com.exteragram.messenger/files/plugins/`                   |
| `get_cache_dir()`    | `/data/user/0/com.exteragram.messenger/cache/`                           |
| `get_files_dir()`    | `/data/user/0/com.exteragram.messenger/files/`                           |
| `get_images_dir()`   | `/data/user/0/com.exteragram.messenger/files/images/`                    |
| `get_videos_dir()`   | `/data/user/0/com.exteragram.messenger/files/video/`                     |
| `get_audios_dir()`   | `/data/user/0/com.exteragram.messenger/files/music/`                     |
| `get_documents_dir()`| `/data/user/0/com.exteragram.messenger/files/documents/`                 |

---

## Нужные импорты

```python
from file_utils import (
    get_plugins_dir, get_cache_dir, get_files_dir,
    get_images_dir, get_videos_dir, get_audios_dir, get_documents_dir,
    ensure_dir_exists, list_dir,
    write_file, read_file, delete_file
)
import os  # для os.path.dirname при ensure_dir_exists
```
