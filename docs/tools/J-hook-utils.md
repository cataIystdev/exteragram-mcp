# [J] Hook Utils — Рефлексия Java

## Назначение

Генерация вызовов Java-рефлексии: поиск классов, чтение/запись
приватных полей (инстанс и статические).

---

## ВАЖНО из документации

> "Reflection is a powerful but fragile technique. It can break if the underlying
> application code changes. Always include error handling via try-except blocks when
> using these functions and check for None return values."

Все генераторы автоматически оборачивают код в try-except.

---

## Инструменты

### generate_find_class

**Параметры:**
```
class_fqn   string   — полное квалифицированное имя (пример: "org.telegram.ui.ChatActivity")
var_name    string?  — имя переменной (default: "clazz")
```

**Возвращает:**
```python
try:
    chat_activity_class = find_class("org.telegram.ui.ChatActivity")
    if chat_activity_class is None:
        log("Класс не найден: org.telegram.ui.ChatActivity")
except Exception as e:
    log(f"Ошибка поиска класса: {e}")
    chat_activity_class = None
```

---

### generate_get_field

**Параметры:**
```
obj_var      string    — Python-выражение объекта/класса
field_name   string    — имя поля
is_static    boolean?  — static поле (default: false)
class_var    string?   — переменная Class (только для is_static=true)
result_var   string?   — имя переменной результата
```

**Возвращает (instance):**
```python
try:
    value = get_private_field(my_obj, "fieldName")
    if value is None:
        log("Поле не найдено или равно null")
except Exception as e:
    log(f"Ошибка чтения поля: {e}")
    value = None
```

**Возвращает (static):**
```python
try:
    value = get_static_private_field(MyClass, "STATIC_FIELD")
    if value is None:
        log("Статическое поле не найдено")
except Exception as e:
    log(f"Ошибка чтения статического поля: {e}")
    value = None
```

---

### generate_set_field

**Параметры:**
```
obj_var      string    — Python-выражение объекта/класса
field_name   string    — имя поля
value_expr   string    — Python-выражение нового значения
is_static    boolean?  — static поле (default: false)
class_var    string?   — переменная Class (только для is_static=true)
```

**Возвращает (instance):**
```python
try:
    success = set_private_field(my_obj, "fieldName", new_value)
    if not success:
        log("Не удалось установить значение поля")
except Exception as e:
    log(f"Ошибка записи поля: {e}")
```

**Возвращает (static):**
```python
try:
    success = set_static_private_field(MyClass, "STATIC_FIELD", new_value)
    if not success:
        log("Не удалось установить статическое поле")
except Exception as e:
    log(f"Ошибка записи статического поля: {e}")
```

---

## Все 5 функций (для справки агента)

```python
find_class(class_name: str) -> Class | None
get_private_field(obj: JavaObject, field_name: str) -> Any | None
set_private_field(obj: JavaObject, field_name: str, new_value: Any) -> bool
get_static_private_field(clazz: JavaClass, field_name: str) -> Any | None
set_static_private_field(clazz: JavaClass, field_name: str, new_value: Any) -> bool
```

## Нужные импорты

```python
from hook_utils import (
    find_class,
    get_private_field, set_private_field,
    get_static_private_field, set_static_private_field
)
```
