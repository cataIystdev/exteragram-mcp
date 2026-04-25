/**
 * Модуль генерации Python-кода для плагинов exteraGram.
 *
 * Предоставляет набор чистых функций для построения корректного Python-кода:
 * отступы (4 пробела, PEP 8), методы, классы, импорты, try-except блоки.
 * Все инструменты генерации обязаны использовать только эти функции —
 * прямая конкатенация строк в инструментах запрещена.
 */

/** Один уровень отступа в Python (4 пробела, PEP 8) */
const INDENT = "    ";

/**
 * Добавляет заданное количество уровней отступа к каждой строке кода.
 *
 * @param code - исходный код (может содержать переводы строк)
 * @param level - количество уровней отступа (по умолчанию 1)
 * @returns код с добавленными отступами
 */
export function indent(code: string, level: number = 1): string {
  const prefix = INDENT.repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : `${prefix}${line}`))
    .join("\n");
}

/**
 * Объединяет несколько фрагментов кода через перевод строки.
 *
 * @param parts - фрагменты кода для объединения
 * @returns объединённый код
 */
export function lines(...parts: string[]): string {
  return parts.join("\n");
}

/**
 * Возвращает пустую строку для вставки вертикального отступа между блоками.
 */
export function blankLine(): string {
  return "";
}

/**
 * Экранирует строку для безопасной вставки в Python-строковый литерал.
 * Использует двойные кавычки; внутренние двойные кавычки экранируются.
 *
 * @param value - исходная строка
 * @returns Python-строковый литерал (с кавычками)
 */
export function pyString(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Форматирует массив строк как Python-список.
 *
 * @param items - элементы списка (Python-выражения)
 * @returns Python-список, например ["a", "b", "c"]
 */
export function pyList(items: string[]): string {
  if (items.length === 0) return "[]";
  return `[${items.join(", ")}]`;
}

/**
 * Форматирует словарь пар ключ-значение как Python-dict.
 *
 * @param pairs - объект с парами ключ: значение (Python-выражения)
 * @returns многострочный Python-словарь
 */
export function pyDict(pairs: Record<string, string>): string {
  const entries = Object.entries(pairs);
  if (entries.length === 0) return "{}";
  const body = entries.map(([k, v]) => `    ${pyString(k)}: ${v}`).join(",\n");
  return `{\n${body},\n}`;
}

/**
 * Форматирует вызов функции или конструктора с именованными аргументами.
 * Аргументы со значением null пропускаются автоматически.
 *
 * @param fn - имя функции/конструктора
 * @param args - словарь имя_параметра: значение (null = пропустить)
 * @returns строка вызова функции
 */
export function callExpr(
  fn: string,
  args: Record<string, string | null>
): string {
  const parts = Object.entries(args)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k}=${v}`);
  if (parts.length === 0) return `${fn}()`;
  return `${fn}(${parts.join(", ")})`;
}

/**
 * Формирует строку импорта из модуля.
 *
 * @param module - имя модуля
 * @param names - список имён для импорта
 * @returns строка `from module import name1, name2`
 */
export function importFrom(module: string, names: string[]): string {
  return `from ${module} import ${names.join(", ")}`;
}

/**
 * Оборачивает блок кода в конструкцию try-except.
 *
 * @param body - тело блока try
 * @param excVar - имя переменной исключения (например "e")
 * @param handler - тело блока except
 * @returns код с try-except
 */
export function tryExcept(
  body: string,
  excVar: string,
  handler: string
): string {
  return lines(
    "try:",
    indent(body),
    `except Exception as ${excVar}:`,
    indent(handler)
  );
}

/**
 * Формирует Python-метод класса.
 *
 * @param name - имя метода
 * @param params - список параметров (обычно начинается с "self")
 * @param body - тело метода
 * @param decorators - список строк декораторов (без @, добавляется автоматически)
 * @param returnType - аннотация возвращаемого типа (опционально)
 * @returns полный метод с отступами тела
 */
export function pyMethod(
  name: string,
  params: string[],
  body: string,
  decorators: string[] = [],
  returnType?: string
): string {
  const decoratorLines = decorators.map((d) => `@${d}`);
  const signature = returnType
    ? `def ${name}(${params.join(", ")}) -> ${returnType}:`
    : `def ${name}(${params.join(", ")}):`;
  return lines(...decoratorLines, signature, indent(body));
}

/**
 * Формирует Python-класс.
 *
 * @param name - имя класса
 * @param bases - базовые классы
 * @param body - тело класса
 * @returns полный класс
 */
export function pyClass(name: string, bases: string[], body: string): string {
  const baseList = bases.length > 0 ? `(${bases.join(", ")})` : "";
  return lines(`class ${name}${baseList}:`, indent(body));
}

/**
 * Объединяет блоки кода с двойным переводом строки между ними
 * (стандарт PEP 8 для разделения функций и классов верхнего уровня).
 *
 * @param blocks - блоки кода
 * @returns объединённый код
 */
export function joinBlocks(...blocks: string[]): string {
  return blocks.filter((b) => b.trim() !== "").join("\n\n");
}

/**
 * Формирует блок if-elif по списку условий.
 *
 * @param branches - массив пар [условие, тело]
 * @returns Python if-elif цепочка
 */
export function ifElif(branches: Array<[string, string]>): string {
  return branches
    .map(([cond, body], idx) => {
      const keyword = idx === 0 ? "if" : "elif";
      return lines(`${keyword} ${cond}:`, indent(body));
    })
    .join("\n");
}

/**
 * Формирует однострочный комментарий Python.
 *
 * @param text - текст комментария
 * @returns строка с # prefix
 */
export function pyComment(text: string): string {
  return `# ${text}`;
}

/**
 * Формирует Python-константу (метаданные плагина).
 * Использует строковый литерал для совместимости с AST-парсингом SDK.
 *
 * @param name - имя константы (например "__id__")
 * @param value - значение (будет обёрнуто в кавычки)
 * @returns строка присваивания
 */
export function pyMetaConst(name: string, value: string): string {
  return `${name} = ${pyString(value)}`;
}

/**
 * Формирует Python-константу с произвольным Python-выражением (не строкой).
 *
 * @param name - имя константы
 * @param expr - Python-выражение
 * @returns строка присваивания
 */
export function pyConst(name: string, expr: string): string {
  return `${name} = ${expr}`;
}
