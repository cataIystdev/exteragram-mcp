# [E] Menu — Пункты контекстного меню

## Назначение

Генерация вызовов `self.add_menu_item(MenuItemData(...))` для вставки в `on_plugin_load`.

---

## Инструменты

### generate_menu_item

**Параметры:**
```
menu_type   "MESSAGE_CONTEXT_MENU" | "DRAWER_MENU" | "CHAT_ACTION_MENU" | "PROFILE_ACTION_MENU"
text        string   — отображаемый текст пункта меню
callback    string   — имя callback-функции
item_id     string?  — необязательный идентификатор пункта
icon        string?  — drawable name (пример: "msg_edit")
subtext     string?  — подпись под текстом
condition   string?  — Python-выражение (bool), когда показывать пункт
priority    integer? — приоритет сортировки
```

**Возвращает** вызов для вставки в `on_plugin_load`:
```python
self.add_menu_item(MenuItemData(
    menu_type=MenuItemType.MESSAGE_CONTEXT_MENU,
    text="Мой пункт",
    on_click=self.my_callback,
    icon="msg_edit",
    subtext="Подпись",
))
```

И шаблон callback-метода:
```python
def my_callback(self, context: dict):
    message = context.get("message")
    user = context.get("user")
    dialog_id = context.get("dialog_id")
    account = context.get("account")
    # ...
```

---

## Типы меню

| Тип                    | Где появляется                              |
|------------------------|---------------------------------------------|
| `MESSAGE_CONTEXT_MENU` | Контекстное меню при долгом нажатии на сообщение |
| `DRAWER_MENU`          | Боковое меню (drawer)                       |
| `CHAT_ACTION_MENU`     | Меню действий в чате                        |
| `PROFILE_ACTION_MENU`  | Меню действий в профиле                     |

## Ключи context dict в callback

`account`, `context`, `fragment`, `dialog_id`,
`user`, `userId`, `userFull`,
`chat`, `chatId`, `chatFull`,
`encryptedChat`, `message`, `groupedMessages`, `botInfo`

## Нужные импорты

```python
from base_plugin import MenuItemData, MenuItemType
```
