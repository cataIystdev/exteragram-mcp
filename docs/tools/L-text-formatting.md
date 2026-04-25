# [L] Text Formatting — Форматирование текста

## Назначение

Генерация вызовов `parse_text` для конвертации HTML/Markdown в plain text
с Telegram entity-объектами.

---

## Инструменты

### generate_parse_text

**Параметры:**
```
text_expr   string            — Python-выражение входного текста
parse_mode  "HTML" | "Markdown"
is_caption  boolean?          — вернуть ключ "caption" вместо "message" (default: false)
var_name    string?           — имя переменной результата
```

**Возвращает:**
```python
result = parse_text("<b>Привет</b>, мир!", parse_mode="HTML", is_caption=False)
# result["message"] — plain text без тегов
# result["entities"] — список TLRPC.MessageEntity
```

Для `is_caption=True`:
```python
result = parse_text(caption_text, parse_mode="HTML", is_caption=True)
# result["caption"] — plain text
# result["entities"] — список TLRPC.MessageEntity
```

---

### list_html_tags

Возвращает таблицу поддерживаемых HTML тегов и Markdown синтаксиса.

**HTML теги:**

| Тег                                         | Форматирование    |
|---------------------------------------------|-------------------|
| `<b>`, `<strong>`                           | Жирный            |
| `<i>`, `<em>`                               | Курсив            |
| `<u>`                                       | Подчёркнутый      |
| `<s>`, `<del>`, `<strike>`                  | Зачёркнутый       |
| `<a href="...">`                            | Текстовая ссылка  |
| `<code>`                                    | Инлайн-код        |
| `<pre language="...">`                      | Блок кода (язык опционален) |
| `<spoiler>`, `<tg-spoiler>`                 | Спойлер           |
| `<blockquote>`                              | Цитата            |
| `<blockquote expandable>`                   | Раскрываемая цитата |
| `<blockquote collapsed>`                    | Свёрнутая цитата  |
| `<emoji id="...">`                          | Кастомный эмодзи  |

**Markdown синтаксис:**

| Синтаксис                 | Форматирование             |
|---------------------------|----------------------------|
| `*bold*`                  | Жирный                     |
| `_italic_`                | Курсив                     |
| `__underline__`           | Подчёркнутый               |
| `~strikethrough~`         | Зачёркнутый                |
| `` `code` ``              | Инлайн-код                 |
| ` ```code block``` `      | Блок кода                  |
| ` ```python ... ``` `     | Блок кода с языком         |
| `\|\|spoiler\|\|`         | Спойлер                    |
| `[text](url)`             | Ссылка                     |
| `![alt](tg://emoji?id=X)` | Кастомный эмодзи           |
| `> Quote`                 | Цитата                     |
| `**> Quote`               | Раскрываемая цитата        |

---

## Вспомогательные классы

### TLEntityType (enum)
`CODE`, `PRE`, `STRIKETHROUGH`, `TEXT_LINK`, `BOLD`, `ITALIC`,
`UNDERLINE`, `SPOILER`, `CUSTOM_EMOJI`, `BLOCKQUOTE`

### RawEntity (fields)
`offset`, `length`, `url?`, `language?`, `document_id?`, `collapsed?`

---

## Интеграция с client_utils

`send_text`, `send_photo` и другие функции принимают `parse_mode` напрямую —
`parse_text` нужен только при ручной работе с entities.

---

## Нужные импорты

```python
from extera_utils.text_formatting import parse_text
```
