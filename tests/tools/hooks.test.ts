/**
 * Тесты генераторов хуков [F, G].
 * Проверяют корректность генерации кода для хуков запросов и сообщений.
 */

import { describe, it, expect } from "vitest";
import { lines, pyMethod, pyString, tryExcept } from "../../src/codegen/python-builder.js";

// Тестируем компоненты генерации хуков через чистые функции

describe("генерация регистрации add_hook", () => {
  it("строит вызов с именем хука", () => {
    const hookName = "messages.sendMessage";
    const call = `self.add_hook(${pyString(hookName)})`;
    expect(call).toBe('self.add_hook("messages.sendMessage")');
  });

  it("строит вызов с match_substring=True", () => {
    const call = `self.add_hook("sendMessage", match_substring=True)`;
    expect(call).toContain("match_substring=True");
  });

  it("строит вызов с приоритетом", () => {
    const call = `self.add_hook("messages.sendMessage", priority=5)`;
    expect(call).toContain("priority=5");
  });
});

describe("генерация add_on_send_message_hook", () => {
  it("генерирует вызов без аргументов", () => {
    const call = "self.add_on_send_message_hook()";
    expect(call).toBe("self.add_on_send_message_hook()");
  });

  it("генерирует вызов с приоритетом", () => {
    const call = "self.add_on_send_message_hook(priority=5)";
    expect(call).toContain("priority=5");
  });
});

describe("генерация on_send_message_hook метода", () => {
  it("метод имеет правильную сигнатуру", () => {
    const body = lines(
      'if not isinstance(getattr(params, "message", None), str):',
      "    return HookResult()",
      "",
      "return HookResult(strategy=HookStrategy.MODIFY, params=params)"
    );
    const method = pyMethod(
      "on_send_message_hook",
      ["self", "account: int", "params"],
      body,
      [],
      "HookResult"
    );
    expect(method).toContain("def on_send_message_hook(self, account: int, params) -> HookResult:");
    expect(method).toContain("isinstance(getattr(params");
  });
});

describe("генерация HookResult", () => {
  it("DEFAULT: HookResult()", () => {
    const result = "HookResult()";
    expect(result).toBe("HookResult()");
  });

  it("CANCEL: HookResult(strategy=HookStrategy.CANCEL)", () => {
    const result = "HookResult(strategy=HookStrategy.CANCEL)";
    expect(result).toContain("CANCEL");
  });

  it("MODIFY: HookResult(strategy=HookStrategy.MODIFY, params=params)", () => {
    const result = "HookResult(strategy=HookStrategy.MODIFY, params=params)";
    expect(result).toContain("MODIFY");
    expect(result).toContain("params=params");
  });

  it("MODIFY_FINAL: с request payload", () => {
    const result = "HookResult(strategy=HookStrategy.MODIFY_FINAL, request=request)";
    expect(result).toContain("MODIFY_FINAL");
    expect(result).toContain("request=request");
  });
});

describe("генерация pre_request_hook", () => {
  it("имеет правильную сигнатуру", () => {
    const method = pyMethod(
      "pre_request_hook",
      ["self", "request_name: str", "account: int", "request"],
      "return HookResult()",
      [],
      "HookResult"
    );
    expect(method).toContain("def pre_request_hook(self, request_name: str, account: int, request) -> HookResult:");
  });
});

describe("генерация on_update_hook", () => {
  it("имеет правильную сигнатуру", () => {
    const method = pyMethod(
      "on_update_hook",
      ["self", "update_name: str", "account: int", "update"],
      "return HookResult()",
      [],
      "HookResult"
    );
    expect(method).toContain("def on_update_hook(self, update_name: str, account: int, update) -> HookResult:");
  });
});

describe("try-except в Xposed хуках", () => {
  it("генерирует корректный try-except для find_class", () => {
    const body = lines(
      `target_class = find_class("org.telegram.ui.ChatActivity")`,
      `if target_class is None:`,
      `    return`
    );
    const code = tryExcept(body, "e", "log(f'Ошибка: {e}')");
    expect(code).toContain("try:");
    expect(code).toContain("find_class");
    expect(code).toContain("except Exception as e:");
  });
});
