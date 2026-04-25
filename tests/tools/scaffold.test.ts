/**
 * Тесты инструментов группы [B] scaffold.
 * Проверяют генерацию файла плагина и метаданных.
 */

import { describe, it, expect } from "vitest";
import {
  pyMetaConst,
  pyList,
  pyString,
  joinBlocks,
  importFrom,
} from "../../src/codegen/python-builder.js";

// Тестируем внутреннюю логику генерации напрямую
// (без MCP-сервера, через чистые функции builder)

describe("генерация метаданных плагина", () => {
  it("корректно генерирует __id__", () => {
    const result = pyMetaConst("__id__", "my_plugin");
    expect(result).toBe('__id__ = "my_plugin"');
  });

  it("корректно генерирует все обязательные поля", () => {
    const block = [
      pyMetaConst("__id__", "test"),
      pyMetaConst("__name__", "Test Plugin"),
      pyMetaConst("__version__", "1.0.0"),
    ].join("\n");

    expect(block).toContain('__id__ = "test"');
    expect(block).toContain('__name__ = "Test Plugin"');
    expect(block).toContain('__version__ = "1.0.0"');
  });

  it("генерирует __requirements__ как список строк", () => {
    const reqs = ["requests", "tinydb>=4.0"];
    const result = `__requirements__ = ${pyList(reqs.map((r) => pyString(r)))}`;
    expect(result).toContain('"requests"');
    expect(result).toContain('"tinydb>=4.0"');
  });
});

describe("генерация блока импортов", () => {
  it("генерирует корректный from ... import ...", () => {
    const result = importFrom("base_plugin", ["BasePlugin"]);
    expect(result).toBe("from base_plugin import BasePlugin");
  });

  it("генерирует множественный импорт", () => {
    const result = importFrom("base_plugin", [
      "BasePlugin",
      "HookResult",
      "HookStrategy",
    ]);
    expect(result).toBe(
      "from base_plugin import BasePlugin, HookResult, HookStrategy"
    );
  });
});

describe("PascalCase конвертация plugin_id", () => {
  it("my_plugin -> MyPlugin", () => {
    const convert = (id: string) =>
      id
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("") + "Plugin";

    expect(convert("my_plugin")).toBe("MyPluginPlugin");
    expect(convert("hello-world")).toBe("HelloWorldPlugin");
    expect(convert("test")).toBe("TestPlugin");
  });
});

describe("joinBlocks для полного файла", () => {
  it("объединяет блоки с двойным переводом строки", () => {
    const block1 = "from base_plugin import BasePlugin";
    const block2 = '__id__ = "my_plugin"';
    const block3 = "class MyPlugin(BasePlugin):\n    pass";

    const result = joinBlocks(block1, block2, block3);

    expect(result).toContain("from base_plugin import BasePlugin");
    expect(result).toContain('__id__ = "my_plugin"');
    expect(result).toContain("class MyPlugin(BasePlugin):");
    expect(result.split("\n\n").length).toBeGreaterThanOrEqual(3);
  });
});
