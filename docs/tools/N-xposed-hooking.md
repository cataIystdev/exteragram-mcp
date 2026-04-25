# [N] Xposed Hooking — Перехват Java-методов

## Назначение

Генерация Xposed-style хуков для перехвата и замены произвольных Java-методов
и конструкторов в приложении. Работает через `de.robv.android.xposed.XC_MethodHook`.

---

## Инструменты

### generate_method_hook

Генерирует полный паттерн в 3 шага (find_class → getDeclaredMethod → hook_method).

**Параметры:**
```
style             "MethodHook" | "MethodReplacement" | "functional"
class_fqn         string    — FQN класса (пример: "org.telegram.ui.ChatActivity")
method_name       string    — имя метода
arg_types         string[]? — Java-типы аргументов (FQN или примитивы)
has_before        boolean?  — добавить before_hooked_method (только для MethodHook, default: true)
has_after         boolean?  — добавить after_hooked_method (только для MethodHook, default: false)
priority          integer?  — приоритет (default: 10)
is_constructor    boolean?  — хукать конструктор (getDeclaredConstructor)
before_filters    FilterSpec[]?
after_filters     FilterSpec[]?
```

**Возвращает (style="MethodHook"):**

Код для `on_plugin_load`:
```python
try:
    chat_class = find_class("org.telegram.ui.ChatActivity")
    if chat_class is not None:
        method = chat_class.getDeclaredMethod("someMethod")
        self.hook_method(method, MySomeMethodHook(), priority=10)
except Exception as e:
    log(f"Ошибка регистрации хука: {e}")
```

Класс хука:
```python
class MySomeMethodHook(MethodHook):
    @hook_filters(HookFilter.RESULT_NOT_NULL)  # если фильтры заданы
    def before_hooked_method(self, param):
        # param.thisObject — экземпляр (None для статических методов)
        # param.args — массив аргументов (изменяем напрямую)
        # param.method — перехваченный Method
        # param.setResult(value) — установить результат и пропустить оригинал
        pass

    def after_hooked_method(self, param):
        # param.getResult() — результат выполнения оригинала
        pass
```

**Возвращает (style="MethodReplacement"):**
```python
class MySomeMethodReplacement(MethodReplacement):
    def replace_hooked_method(self, param):
        # Полная замена оригинального метода
        # param.thisObject, param.args — доступны
        return None  # возвращаемое значение
```

**Возвращает (style="functional"):**
```python
self.hook_method(
    method,
    before=lambda param: None,
    after=lambda param: None,
    priority=10,
)
```

---

### generate_hook_param_usage

Генерирует сниппеты работы с `param` объектом.

**Параметры:**
```
operations  ("get_args" | "set_args" | "set_result" | "get_result" | "get_this" | "skip_original" | "get_method")[]
```

**Возвращает сниппеты по операциям:**

```python
# get_args:
first_arg = param.args[0]
second_arg = param.args[1]

# set_args:
param.args[0] = new_value

# get_result (в after_hooked_method):
result = param.getResult()

# set_result:
param.setResult(new_value)

# get_this:
instance = param.thisObject  # None для static методов

# skip_original (вызвать setResult в before → пропустит оригинал):
param.setResult(None)  # или нужное значение

# get_method:
method = param.method
```

---

### generate_hook_filters

Генерирует фильтры хука.

**Параметры:**
```
filters      FilterSpec[]   — список фильтров
as_decorator boolean?       — @hook_filters(...) (default: true)
param_name   "before" | "after"  — для functional хука
```

**FilterSpec:**
```typescript
{ type: "RESULT_IS_NULL" }
{ type: "RESULT_IS_TRUE" }
{ type: "RESULT_IS_FALSE" }
{ type: "RESULT_NOT_NULL" }
{ type: "ResultIsInstanceOf", class_var: "MyClass" }
{ type: "ResultEqual", value: "some_value" }
{ type: "ResultNotEqual", value: "some_value" }
{ type: "ArgumentIsNull", index: 0 }
{ type: "ArgumentNotNull", index: 0 }
{ type: "ArgumentIsFalse", index: 0 }
{ type: "ArgumentIsTrue", index: 0 }
{ type: "ArgumentIsInstanceOf", index: 0, class_var: "MyClass" }
{ type: "ArgumentEqual", index: 0, value: "expr" }
{ type: "ArgumentNotEqual", index: 0, value: "expr" }
{ type: "Condition", mvel_expr: "args[0] != null", obj: "optionalObj" }
{ type: "Or", filters: [...nested FilterSpec] }
```

**Возвращает (декоратор):**
```python
@hook_filters(
    HookFilter.RESULT_NOT_NULL,
    HookFilter.ArgumentIsInstanceOf(0, MessageObject),
)
def before_hooked_method(self, param):
    pass
```

**Возвращает (параметры functional хука):**
```python
before_filters=[HookFilter.RESULT_NOT_NULL],
after_filters=[HookFilter.ArgumentEqual(0, "value")],
```

---

### generate_hook_all_methods

**Параметры:**
```
class_fqn       string  — FQN класса
method_name     string  — имя метода (все перегрузки)
handler_class   string  — имя класса хука
priority        integer? — default: 10
var_name        string?  — имя переменной для unhook объектов
```

**Возвращает:**
```python
try:
    target_class = find_class("org.telegram.ui.ChatActivity")
    if target_class is not None:
        self._hooks = self.hook_all_methods(target_class, "someMethod", MySomeMethodHook())
except Exception as e:
    log(f"Ошибка hook_all_methods: {e}")
```

---

### generate_hook_all_constructors

**Параметры:**
```
class_fqn      string  — FQN класса
handler_class  string  — имя класса хука
var_name       string?
```

**Возвращает:**
```python
try:
    target_class = find_class("org.telegram.messenger.MessageObject")
    if target_class is not None:
        self._ctor_hooks = self.hook_all_constructors(target_class, MyCtorHook())
except Exception as e:
    log(f"Ошибка hook_all_constructors: {e}")
```

---

### generate_unhook

**Параметры:**
```
unhook_var  string  — Python-выражение unhook объекта (или список)
```

**Возвращает:**
```python
self.unhook_method(self._hook)
# или для списка:
for hook in self._hooks:
    self.unhook_method(hook)
```

---

## ВАЖНО из документации

> "Do not call `getClass()` on the `Class` object" — используйте результат `find_class()` напрямую.

Все инструменты генерируют код с этим учётом.

---

## Нужные импорты

```python
from base_plugin import MethodHook, MethodReplacement, BaseHook, HookFilter, hook_filters
from hook_utils import find_class
```
