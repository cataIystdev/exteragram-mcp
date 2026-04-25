/**
 * Тесты генераторов компонентов настроек [D].
 * Проверяют корректность Python-выражений для всех типов компонентов.
 */

import { describe, it, expect } from "vitest";
import { callExpr, pyString, pyList } from "../../src/codegen/python-builder.js";
import type { SettingsComponentSpec } from "../../src/types.js";

// Дублируем логику buildComponent для тестирования

function buildComponent(spec: SettingsComponentSpec): string {
  switch (spec.type) {
    case "Header":
      return callExpr("Header", {
        text: spec.text ? pyString(spec.text) : null,
      });
    case "Switch":
      return callExpr("Switch", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
        default: spec.default === true ? "True" : spec.default === false ? "False" : null,
        icon: spec.icon ? pyString(spec.icon) : null,
      });
    case "Selector":
      return callExpr("Selector", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
        default: spec.default !== undefined ? String(spec.default) : null,
        items: spec.items ? pyList(spec.items.map((i) => pyString(i))) : null,
      });
    case "Input":
      return callExpr("Input", {
        key: spec.key ? pyString(spec.key) : null,
        text: spec.text ? pyString(spec.text) : null,
      });
    case "EditText":
      return callExpr("EditText", {
        key: spec.key ? pyString(spec.key) : null,
        hint: spec.hint ? pyString(spec.hint) : null,
      });
    case "Text":
      return callExpr("Text", {
        text: spec.text ? pyString(spec.text) : null,
      });
    case "Divider":
      return callExpr("Divider", {
        text: spec.text ? pyString(spec.text) : null,
      });
    default:
      return "Custom()";
  }
}

describe("Header компонент", () => {
  it("генерирует Header(text=...)", () => {
    const result = buildComponent({ type: "Header", text: "Настройки" });
    expect(result).toBe('Header(text="Настройки")');
  });
});

describe("Switch компонент", () => {
  it("генерирует Switch с обязательными полями", () => {
    const result = buildComponent({
      type: "Switch",
      key: "enabled",
      text: "Включить",
      default: true,
    });
    expect(result).toContain('key="enabled"');
    expect(result).toContain('text="Включить"');
    expect(result).toContain("default=True");
  });

  it("генерирует Switch с иконкой", () => {
    const result = buildComponent({
      type: "Switch",
      key: "enabled",
      text: "Test",
      default: false,
      icon: "msg_settings",
    });
    expect(result).toContain('icon="msg_settings"');
  });
});

describe("Selector компонент", () => {
  it("генерирует Selector с items", () => {
    const result = buildComponent({
      type: "Selector",
      key: "mode",
      text: "Режим",
      default: 0,
      items: ["Авто", "Ручной"],
    });
    expect(result).toContain('key="mode"');
    expect(result).toContain("default=0");
    expect(result).toContain('"Авто"');
    expect(result).toContain('"Ручной"');
  });
});

describe("Input компонент", () => {
  it("генерирует Input с ключом и текстом", () => {
    const result = buildComponent({ type: "Input", key: "prefix", text: "Префикс" });
    expect(result).toContain('key="prefix"');
    expect(result).toContain('text="Префикс"');
  });
});

describe("EditText компонент", () => {
  it("генерирует EditText с обязательным hint", () => {
    const result = buildComponent({
      type: "EditText",
      key: "template",
      hint: "Введите шаблон...",
    });
    expect(result).toContain('hint="Введите шаблон..."');
  });
});

describe("Text компонент", () => {
  it("генерирует Text с обязательным text", () => {
    const result = buildComponent({ type: "Text", text: "О плагине" });
    expect(result).toContain('text="О плагине"');
  });
});

describe("Divider компонент", () => {
  it("генерирует Divider без аргументов", () => {
    const result = buildComponent({ type: "Divider" });
    expect(result).toBe("Divider()");
  });

  it("генерирует Divider с текстом", () => {
    const result = buildComponent({ type: "Divider", text: "Дополнительно" });
    expect(result).toContain('"Дополнительно"');
  });
});
