# [M] Class Proxy DSL — Создание Java-подклассов из Python

## Назначение

Генерация Python-классов, которые создают реальные Java-подклассы через DexMaker.
Позволяет передавать Python-объекты в любое Android/Telegram API,
ожидающее конкретный Java-тип.

---

## Инструменты

### generate_java_subclass

Генерирует полный класс с `@java_subclass` декоратором.

**Параметры:**
```
class_name      string    — имя Python-класса
java_base       string    — FQN базового Java-класса
interfaces      string[]? — FQN интерфейсов для реализации
fields          FieldSpec[]?
methods         MethodSpec[]?
```

**Возвращает:**
```python
from extera_utils.class_proxy import java_subclass, joverride, jfield, jgetmethod, jsetmethod, Base

@java_subclass(SomeJavaClass, SomeInterface)
class MyClass(Base):
    my_field = jfield("boolean", default=False, methods=[jgetmethod("isActive"), jsetmethod("setActive")])

    @joverride("someMethod")
    def some_method(self):
        # self.java или self.this — сырой Java-инстанс
        return super().some_method()
```

---

### generate_joverride

Генерирует метод с `@joverride` или `@joverload`.

**Параметры:**
```
java_method_name  string    — имя Java-метода
python_name       string    — имя Python-метода
arg_types         string[]? — типы аргументов (нужны при перегрузках)
use_joverload     boolean?  — использовать @joverload вместо @joverride
body              string?   — тело метода
```

**Возвращает (без arg_types):**
```python
@joverride("equals")
def equals_(self, obj):
    return obj == self
```

**Возвращает (с arg_types — перегрузка):**
```python
@joverload("add", ["java.lang.Object"])
def add_item(self, value):
    return super().add_item(value)
```

---

### generate_jmethod

Генерирует новый Java-метод через `@jmethod`.

**Параметры:**
```
method_name   string    — имя нового метода
return_type   string    — Java тип возврата
arg_types     dict[]?   — [{name, type}] аргументы
body          string?
```

**Возвращает:**
```python
@jmethod(return_type="java.lang.String", arguments=[("value", "int")])
def format_value(self, value):
    return f"Value: {value}"
```

---

### generate_jmvel_method

Генерирует метод через MVEL (для hot-path оптимизации).

**Параметры:**
```
method_name   string    — имя метода
return_type   string    — Java тип возврата
arguments     dict[]?   — [{name, type}] аргументы
code          string    — MVEL код
is_override   boolean?  — использовать jMVELoverride вместо jMVELmethod
```

**Возвращает:**
```python
debug_label = jMVELmethod(
    return_type="java.lang.String",
    arguments=[("value", "int")],
    code="return 'Value: ' + value;",
)
```

MVEL контекстные переменные:
`java`, `python`, `py`, `self`, `args`, `argc`, `arg0`, `arg1`, ..., `SUPER_methodName(...)`

---

### generate_jfield

**Параметры:**
```
field_name   string    — имя поля
java_type    string    — Java-тип (пример: "boolean", "int", "java.lang.String")
default      string?   — Python-выражение значения по умолчанию
getter       string?   — имя getter-метода
setter       string?   — имя setter-метода
```

**Возвращает:**
```python
shadow = jfield("boolean", default=False, methods=[jgetmethod("isShadow"), jsetmethod("setShadow")])
```

---

### generate_java_helper

Генерирует доступ к Java-объекту через `J()` (JavaHelper).

**Параметры:**
```
obj_var        string    — Python-выражение Java-объекта
member_name    string    — имя поля или метода
access_all     boolean?  — JAccessAll режим (default: false)
ignore_result  boolean?  — JIgnoreResult режим (default: false)
use_getter_setter boolean? — JUseGetterAndSetter режим (default: true)
```

**Возвращает (чтение поля):**
```python
value = J(obj).field_name
```

**Возвращает (запись поля, JAccessAll):**
```python
J(obj).JAccessAll.field_name = new_value
```

**Возвращает (вызов метода, игнорируя результат):**
```python
J(obj).JIgnoreResult.method_name(arg1, arg2)
```

---

### generate_jclassbuilder

Генерирует хук модификации DexMaker через `@jclassbuilder()`.
Используется для продвинутых сценариев изменения построителя класса перед финализацией.

**Параметры:**
```
method_name  string  — имя метода в классе
body         string? — тело метода
```

**Возвращает:**
```python
@jclassbuilder()
def configure_builder(self, builder):
    # builder — DexMaker builder перед финализацией
    # Модифицируйте builder здесь
    pass
```

---

### generate_new_instance

**Параметры:**
```
class_var     string    — имя Python-класса (subclass)
init_args     string[]? — аргументы конструктора
as_java       boolean?  — использовать new_java_instance() вместо new_instance()
var_name      string?
```

**Возвращает:**
```python
# Python peer (с .java для сырого Java-объекта):
instance = MyClass.new_instance(arg1, arg2)
java_obj = instance.java

# Сырой Java-объект:
java_instance = MyClass.new_java_instance(arg1, arg2)
```

---

### generate_from_java

**Параметры:**
```
class_var   string  — имя Python-класса
java_var    string  — Python-выражение Java-объекта
var_name    string?
```

**Возвращает:**
```python
python_peer = MyClass.from_java(java_object)
```

---

### generate_pyobj

**Параметры:**
```
python_expr  string  — Python-выражение объекта для оборачивания
var_name     string?
```

**Возвращает:**
```python
wrapped = PyObj.create(my_python_dict)
# Теперь wrapped можно передавать в Java APIs
```

---

## Порядок инициализации (для справки агента)

1. `@jpreconstructor(...)` если сигнатура совпадает
2. Java parent constructor
3. Python `__init__(...)`
4. Совпадающий `@jconstructor(...)`
5. `on_post_init(...)`

---

## Ограничения

- Base class не может быть `final`
- Method indexing только по имени — перегрузки требуют `@joverload` с явными типами
- Для сложных перегрузок — использовать прямую Java-рефлексию

---

## Нужные импорты

```python
from extera_utils.class_proxy import (
    java_subclass, Base,
    joverride, joverload, jmethod,
    jMVELmethod, jMVELoverride,
    jconstructor, jpreconstructor,
    jfield, jgetmethod, jsetmethod,
    jclassbuilder,
    J, PyObj
)
```
