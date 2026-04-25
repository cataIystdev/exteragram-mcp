# [G] Message Hook — Перехват исходящих сообщений

## Назначение

Генерация хука `on_send_message_hook` — перехват исходящих сообщений
перед отправкой с возможностью модификации или отмены.

---

## КРИТИЧЕСКИ ВАЖНО

Два задокументированных pitfall:

1. Метод хука должен называться `on_send_message_hook` (точно так)
2. Без вызова `self.add_on_send_message_hook()` в `on_plugin_load` хук не сработает

---

## Инструменты

### generate_send_message_hook

**Параметры:**
```
priority   integer?  — приоритет (default: 0)
strategy   "DEFAULT" | "CANCEL" | "MODIFY" | "MODIFY_FINAL"
body       string?   — тело метода (если не задано — шаблон)
```

**Возвращает** два блока:

Для вставки в `on_plugin_load`:
```python
self.add_on_send_message_hook(priority=0)
```

Метод хука:
```python
def on_send_message_hook(self, account: int, params) -> HookResult:
    # params.message — текст сообщения (str или None)
    # params.peer    — получатель
    # params.replyToMsg — объект цитируемого сообщения (или None)

    if not isinstance(getattr(params, "message", None), str):
        return HookResult()

    # Пример: модификация текста
    params.message = params.message.replace("old", "new")
    return HookResult(strategy=HookStrategy.MODIFY, params=params)
```

---

### generate_hook_result

Генерирует только конструктор `HookResult`.

**Параметры:**
```
strategy      "DEFAULT" | "CANCEL" | "MODIFY" | "MODIFY_FINAL"
payload_var   string?  — имя переменной payload (request/response/update/updates/params)
payload_type  "request" | "response" | "update" | "updates" | "params"
```

**Возвращает** (примеры):
```python
HookResult()
HookResult(strategy=HookStrategy.CANCEL)
HookResult(strategy=HookStrategy.MODIFY, params=params)
HookResult(strategy=HookStrategy.MODIFY_FINAL, request=request)
```

---

## Стратегии

| Стратегия      | Поведение                                              |
|----------------|--------------------------------------------------------|
| `DEFAULT`      | Ничего не делать, передать управление дальше           |
| `CANCEL`       | Отменить отправку сообщения                            |
| `MODIFY`       | Использовать изменённый params, продолжить обработку   |
| `MODIFY_FINAL` | Использовать изменённый params, остановить обработку   |

## Нужные импорты

```python
from base_plugin import HookResult, HookStrategy
```
