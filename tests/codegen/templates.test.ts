/**
 * Тесты модуля codegen/templates.ts.
 * Проверяют корректность шаблонов плагинов и их доступность.
 */

import { describe, it, expect } from "vitest";
import {
  getTemplate,
  listTemplates,
  PLUGIN_TEMPLATES,
} from "../../src/codegen/templates.js";

describe("PLUGIN_TEMPLATES", () => {
  it("содержит шаблоны minimal, hello_world, settings_demo, xposed_demo", () => {
    expect(Object.keys(PLUGIN_TEMPLATES)).toEqual(
      expect.arrayContaining(["minimal", "hello_world", "settings_demo", "xposed_demo"])
    );
  });

  it("каждый шаблон имеет title, description и code", () => {
    for (const [, entry] of Object.entries(PLUGIN_TEMPLATES)) {
      expect(entry.title).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.code).toBeTruthy();
    }
  });
});

describe("getTemplate", () => {
  it("возвращает код minimal шаблона", () => {
    const code = getTemplate("minimal");
    expect(code).toContain("from base_plugin import BasePlugin");
    expect(code).toContain("__id__");
    expect(code).toContain("class HelloWorldPlugin(BasePlugin):");
  });

  it("возвращает код hello_world шаблона", () => {
    const code = getTemplate("hello_world");
    expect(code).toContain("on_send_message_hook");
    expect(code).toContain("add_on_send_message_hook");
    expect(code).toContain("HookResult");
    expect(code).toContain("HookStrategy.MODIFY");
  });

  it("hello_world содержит проверку isinstance(getattr(params, 'message', None), str)", () => {
    const code = getTemplate("hello_world");
    expect(code).toContain("isinstance(getattr(params");
  });

  it("settings_demo содержит все типы компонентов", () => {
    const code = getTemplate("settings_demo");
    expect(code).toContain("Header");
    expect(code).toContain("Switch");
    expect(code).toContain("Selector");
    expect(code).toContain("Input");
    expect(code).toContain("EditText");
    expect(code).toContain("Text");
    expect(code).toContain("Divider");
  });

  it("xposed_demo содержит паттерн Xposed-хука", () => {
    const code = getTemplate("xposed_demo");
    expect(code).toContain("find_class");
    expect(code).toContain("getDeclaredMethod");
    expect(code).toContain("hook_method");
    expect(code).toContain("unhook_method");
    expect(code).toContain("MethodHook");
  });
});

describe("listTemplates", () => {
  it("возвращает 4 шаблона", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(4);
  });

  it("каждый элемент содержит name, title, description", () => {
    const templates = listTemplates();
    for (const t of templates) {
      expect(t.name).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });
});
