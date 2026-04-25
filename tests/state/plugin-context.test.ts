/**
 * Тесты модуля state/plugin-context.ts.
 * Проверяют CRUD-операции, валидацию метаданных и отслеживание хуков.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  setPluginContext,
  getPluginContext,
  clearPluginContext,
  validateMetadata,
  registerHook,
  isHookRegistered,
  serializeContext,
  updateContextMetadata,
} from "../../src/state/plugin-context.js";

describe("validateMetadata", () => {
  it("принимает корректные обязательные поля", () => {
    const result = validateMetadata({ id: "my_plugin", name: "My Plugin" });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("отклоняет отсутствующий __id__", () => {
    const result = validateMetadata({ name: "Test" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "__id__")).toBe(true);
  });

  it("отклоняет отсутствующий __name__", () => {
    const result = validateMetadata({ id: "test" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "__name__")).toBe(true);
  });

  it("отклоняет __id__ начинающийся с цифры", () => {
    const result = validateMetadata({ id: "1plugin", name: "Test" });
    expect(result.valid).toBe(false);
  });

  it("отклоняет __id__ с кириллицей", () => {
    const result = validateMetadata({ id: "мой_плагин", name: "Test" });
    expect(result.valid).toBe(false);
  });

  it("отклоняет __id__ длиннее 32 символов", () => {
    const id = "a" + "x".repeat(32);
    const result = validateMetadata({ id, name: "Test" });
    expect(result.valid).toBe(false);
  });

  it("принимает __id__ длиной 2 символа", () => {
    const result = validateMetadata({ id: "ab", name: "Test" });
    expect(result.valid).toBe(true);
  });

  it("принимает __id__ с дефисами и подчёркиваниями", () => {
    const result = validateMetadata({ id: "my-plugin_v2", name: "Test" });
    expect(result.valid).toBe(true);
  });

  it("отклоняет некорректный __version__", () => {
    const result = validateMetadata({ id: "test", name: "T", version: "not-semver" });
    expect(result.valid).toBe(false);
  });

  it("принимает корректный __version__", () => {
    const result = validateMetadata({ id: "test", name: "T", version: "1.2.3" });
    expect(result.valid).toBe(true);
  });

  it("отклоняет __app_version__ без оператора", () => {
    const result = validateMetadata({
      id: "test",
      name: "T",
      app_version: "12.5.1",
    });
    expect(result.valid).toBe(false);
  });

  it("принимает корректный __app_version__", () => {
    const result = validateMetadata({
      id: "test",
      name: "T",
      app_version: ">=12.5.1",
    });
    expect(result.valid).toBe(true);
  });

  it("отклоняет пустые строки в __requirements__", () => {
    const result = validateMetadata({
      id: "test",
      name: "T",
      requirements: ["requests", ""],
    });
    expect(result.valid).toBe(false);
  });
});

describe("setPluginContext / getPluginContext / clearPluginContext", () => {
  beforeEach(() => {
    clearPluginContext();
  });

  it("устанавливает и возвращает контекст", () => {
    setPluginContext("my_plugin", "My Plugin", "/path/to/my_plugin.py");
    const ctx = getPluginContext();
    expect(ctx).not.toBeNull();
    expect(ctx!.plugin_id).toBe("my_plugin");
    expect(ctx!.plugin_name).toBe("My Plugin");
    expect(ctx!.file_path).toBe("/path/to/my_plugin.py");
  });

  it("не сохраняет контекст при ошибке валидации", () => {
    const result = setPluginContext("1invalid", "Test", "/path.py");
    expect(result.valid).toBe(false);
    expect(getPluginContext()).toBeNull();
  });

  it("очищает контекст", () => {
    setPluginContext("test_plugin", "Test", "/test.py");
    clearPluginContext();
    expect(getPluginContext()).toBeNull();
  });

  it("сохраняет device_serial", () => {
    setPluginContext("test_plugin", "Test", "/test.py", "emulator-5554");
    const ctx = getPluginContext();
    expect(ctx!.device_serial).toBe("emulator-5554");
  });

  it("инициализирует пустой набор registered_hooks", () => {
    setPluginContext("test_plugin", "Test", "/test.py");
    const ctx = getPluginContext();
    expect(ctx!.registered_hooks.size).toBe(0);
  });
});

describe("registerHook / isHookRegistered", () => {
  beforeEach(() => {
    clearPluginContext();
    setPluginContext("test_plugin", "Test", "/test.py");
  });

  it("регистрирует хук и проверяет его наличие", () => {
    registerHook("on_send_message");
    expect(isHookRegistered("on_send_message")).toBe(true);
  });

  it("возвращает false для незарегистрированного хука", () => {
    expect(isHookRegistered("unknown_hook")).toBe(false);
  });

  it("возвращает false если контекст не установлен", () => {
    clearPluginContext();
    expect(isHookRegistered("any_hook")).toBe(false);
  });

  it("registerHook бросает ошибку без контекста", () => {
    clearPluginContext();
    expect(() => registerHook("hook")).toThrow();
  });
});

describe("serializeContext", () => {
  beforeEach(() => {
    clearPluginContext();
  });

  it("возвращает сообщение если контекст не установлен", () => {
    const result = serializeContext();
    expect(result).toContain("не установлен");
  });

  it("возвращает JSON при установленном контексте", () => {
    setPluginContext("my_plugin", "My Plugin", "/path.py");
    const result = serializeContext();
    const parsed = JSON.parse(result);
    expect(parsed.plugin_id).toBe("my_plugin");
    expect(parsed.plugin_name).toBe("My Plugin");
    expect(parsed.registered_hooks).toEqual([]);
  });
});

describe("updateContextMetadata", () => {
  beforeEach(() => {
    clearPluginContext();
  });

  it("обновляет метаданные контекста", () => {
    setPluginContext("test_plugin", "Test", "/test.py");
    updateContextMetadata({ version: "2.0.0", author: "CatalystDev" });
    const ctx = getPluginContext();
    expect(ctx!.metadata.version).toBe("2.0.0");
    expect(ctx!.metadata.author).toBe("CatalystDev");
  });

  it("бросает ошибку без установленного контекста", () => {
    expect(() => updateContextMetadata({ version: "1.0.0" })).toThrow();
  });
});
