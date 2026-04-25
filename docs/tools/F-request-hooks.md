# [F] Request Hooks — Перехват запросов и обновлений

## Назначение

Генерация хуков для перехвата Telegram-запросов и обновлений:
- `pre_request_hook` — до отправки запроса
- `post_request_hook` — после получения ответа
- `on_update_hook` — для отдельных обновлений
- `on_updates_hook` — для контейнеров обновлений

---

## КРИТИЧЕСКИ ВАЖНО

Реализация метода хука **недостаточна** — обязательна регистрация через
`self.add_hook(name, match_substring=False, priority=0)` в `on_plugin_load`.

Сервер отслеживает это в `registered_hooks` и предупреждает агента если
хук определён без регистрации.

---

## Инструменты

### generate_pre_request_hook

Генерирует `pre_request_hook` + регистрацию.

**Параметры:**
```
hook_name        string   — имя запроса для фильтрации (пример: "messages.sendMessage")
match_substring  boolean? — если true, name матчится как подстрока (default: false)
priority         integer? — приоритет (default: 0)
strategy         "DEFAULT" | "CANCEL" | "MODIFY" | "MODIFY_FINAL"
body             string?  — тело метода (если не задано — шаблон с pass)
```

**Возвращает** два блока:

Для вставки в `on_plugin_load`:
```python
self.add_hook("messages.sendMessage", match_substring=False, priority=0)
```

Метод хука:
```python
def pre_request_hook(self, request_name: str, account: int, request) -> HookResult:
    if request_name == "messages.sendMessage":
        # Модифицируйте request здесь
        return HookResult(strategy=HookStrategy.MODIFY, request=request)
    return HookResult()
```

---

### generate_post_request_hook

Генерирует `post_request_hook` + регистрацию.

**Параметры:**
```
hook_name        string
match_substring  boolean?
priority         integer?
body             string?
```

**Возвращает:**

Регистрация в `on_plugin_load`:
```python
self.add_hook("messages.sendMessage")
```

Метод:
```python
def post_request_hook(self, request_name: str, account: int, response, error) -> HookResult:
    if request_name == "messages.sendMessage":
        if error is not None:
            return HookResult()
        # Обработайте response здесь
        return HookResult(strategy=HookStrategy.MODIFY, response=response)
    return HookResult()
```

---

### generate_on_update_hook

Генерирует `on_update_hook` + регистрацию.

**Параметры:**
```
hook_name        string   — имя обновления (пример: "updateNewMessage")
match_substring  boolean?
priority         integer?
body             string?
```

**Возвращает:**

Регистрация в `on_plugin_load`:
```python
self.add_hook("updateNewMessage")
```

Метод:
```python
def on_update_hook(self, update_name: str, account: int, update) -> HookResult:
    if update_name == "updateNewMessage":
        # Обработайте update здесь
        return HookResult()
    return HookResult()
```

---

### generate_on_updates_hook

Генерирует `on_updates_hook` + регистрацию.

**Параметры:**
```
hook_name        string   — имя контейнера обновлений
match_substring  boolean?
priority         integer?
body             string?
```

**Возвращает:**

Регистрация в `on_plugin_load`:
```python
self.add_hook("Updates")
```

Метод:
```python
def on_updates_hook(self, container_name: str, account: int, updates) -> HookResult:
    if container_name == "Updates":
        return HookResult()
    return HookResult()
```

---

## HookResult и HookStrategy

| HookResult конструктор                              | Смысл                                      |
|-----------------------------------------------------|--------------------------------------------|
| `HookResult()`                                      | DEFAULT — ничего не делать                 |
| `HookResult(strategy=HookStrategy.CANCEL)`          | Отменить операцию                          |
| `HookResult(strategy=HookStrategy.MODIFY, request=r)` | Модифицировать и продолжить             |
| `HookResult(strategy=HookStrategy.MODIFY_FINAL, request=r)` | Модифицировать и остановить дальнейшую обработку |

Аналогично для `response=`, `update=`, `updates=`, `params=`.

## Нужные импорты

```python
from base_plugin import HookResult, HookStrategy
```
