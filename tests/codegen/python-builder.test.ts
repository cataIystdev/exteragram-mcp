/**
 * Тесты модуля codegen/python-builder.ts.
 * Проверяют корректность генерации Python-кода: отступы, строки,
 * методы, классы, импорты, try-except блоки.
 */

import { describe, it, expect } from "vitest";
import {
  indent,
  lines,
  blankLine,
  pyString,
  pyList,
  pyDict,
  callExpr,
  importFrom,
  tryExcept,
  pyMethod,
  pyClass,
  joinBlocks,
  ifElif,
  pyComment,
  pyMetaConst,
  pyConst,
} from "../../src/codegen/python-builder.js";

describe("indent", () => {
  it("добавляет 4 пробела к одной строке", () => {
    expect(indent("pass")).toBe("    pass");
  });

  it("добавляет 8 пробел при level=2", () => {
    expect(indent("pass", 2)).toBe("        pass");
  });

  it("добавляет отступы к каждой строке", () => {
    expect(indent("a\nb")).toBe("    a\n    b");
  });

  it("не добавляет отступы к пустым строкам", () => {
    expect(indent("a\n\nb")).toBe("    a\n\n    b");
  });
});

describe("pyString", () => {
  it("оборачивает строку в двойные кавычки", () => {
    expect(pyString("hello")).toBe('"hello"');
  });

  it("экранирует двойные кавычки внутри строки", () => {
    expect(pyString('say "hi"')).toBe('"say \\"hi\\""');
  });

  it("экранирует обратный слэш", () => {
    expect(pyString("a\\b")).toBe('"a\\\\b"');
  });
});

describe("pyList", () => {
  it("возвращает [] для пустого массива", () => {
    expect(pyList([])).toBe("[]");
  });

  it("форматирует массив строк", () => {
    expect(pyList(['"a"', '"b"'])).toBe('["a", "b"]');
  });
});

describe("pyDict", () => {
  it("возвращает {} для пустого словаря", () => {
    expect(pyDict({})).toBe("{}");
  });

  it("форматирует непустой словарь", () => {
    const result = pyDict({ key: "value" });
    expect(result).toContain('"key": value');
  });
});

describe("callExpr", () => {
  it("возвращает fn() при пустых аргументах", () => {
    expect(callExpr("fn", {})).toBe("fn()");
  });

  it("пропускает null-значения", () => {
    const result = callExpr("Switch", { key: '"k"', text: null });
    expect(result).toBe('Switch(key="k")');
    expect(result).not.toContain("text");
  });

  it("форматирует именованные аргументы", () => {
    const result = callExpr("Header", { text: '"Title"' });
    expect(result).toBe('Header(text="Title")');
  });
});

describe("importFrom", () => {
  it("генерирует from ... import ...", () => {
    expect(importFrom("base_plugin", ["BasePlugin", "HookResult"])).toBe(
      "from base_plugin import BasePlugin, HookResult"
    );
  });
});

describe("tryExcept", () => {
  it("генерирует try-except блок", () => {
    const result = tryExcept("x = 1", "e", 'log(e)');
    expect(result).toContain("try:");
    expect(result).toContain("    x = 1");
    expect(result).toContain("except Exception as e:");
    expect(result).toContain("    log(e)");
  });
});

describe("pyMethod", () => {
  it("генерирует метод без декораторов", () => {
    const result = pyMethod("on_plugin_load", ["self"], "pass");
    expect(result).toContain("def on_plugin_load(self):");
    expect(result).toContain("    pass");
  });

  it("включает декораторы с @", () => {
    const result = pyMethod("my_method", ["self"], "pass", ["joverride('foo')"]);
    expect(result).toContain("@joverride('foo')");
    expect(result).toContain("def my_method(self):");
  });

  it("включает аннотацию возврата", () => {
    const result = pyMethod("create_settings", ["self"], "return []", [], "List[Any]");
    expect(result).toContain("def create_settings(self) -> List[Any]:");
  });
});

describe("pyClass", () => {
  it("генерирует класс с базовым классом", () => {
    const result = pyClass("MyPlugin", ["BasePlugin"], "    pass");
    expect(result).toContain("class MyPlugin(BasePlugin):");
    expect(result).toContain("    pass");
  });

  it("генерирует класс без базовых классов", () => {
    // pyClass вызывает indent(body) внутри — передаём тело без отступа
    const result = pyClass("MyClass", [], "pass");
    expect(result).toBe("class MyClass:\n    pass");
  });
});

describe("joinBlocks", () => {
  it("объединяет блоки с двойным переводом строки", () => {
    const result = joinBlocks("a", "b");
    expect(result).toBe("a\n\nb");
  });

  it("пропускает пустые блоки", () => {
    const result = joinBlocks("a", "", "b");
    expect(result).toBe("a\n\nb");
  });
});

describe("ifElif", () => {
  it("генерирует if для одной ветки", () => {
    const result = ifElif([["x == 1", "pass"]]);
    expect(result).toContain("if x == 1:");
    expect(result).toContain("    pass");
  });

  it("генерирует if-elif для нескольких веток", () => {
    const result = ifElif([
      ["x == 1", "a()"],
      ["x == 2", "b()"],
    ]);
    expect(result).toContain("if x == 1:");
    expect(result).toContain("elif x == 2:");
  });
});

describe("pyMetaConst", () => {
  it("генерирует константу метаданных со строковым литералом", () => {
    expect(pyMetaConst("__id__", "my_plugin")).toBe('__id__ = "my_plugin"');
  });
});

describe("pyConst", () => {
  it("генерирует константу с Python-выражением", () => {
    expect(pyConst("__requirements__", '["lib1"]')).toBe('__requirements__ = ["lib1"]');
  });
});

describe("lines", () => {
  it("объединяет строки через \\n", () => {
    expect(lines("a", "b", "c")).toBe("a\nb\nc");
  });
});

describe("blankLine", () => {
  it("возвращает пустую строку", () => {
    expect(blankLine()).toBe("");
  });
});

describe("pyComment", () => {
  it("добавляет # prefix", () => {
    expect(pyComment("это комментарий")).toBe("# это комментарий");
  });
});
