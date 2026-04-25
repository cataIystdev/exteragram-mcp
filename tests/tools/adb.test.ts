/**
 * Тесты ADB-утилит [Q].
 * Проверяют формирование ADB-команд и пути на устройстве.
 */

import { describe, it, expect } from "vitest";
import { DEVICE_PLUGINS_DIR, APP_PACKAGE } from "../../src/types.js";

// Проверяем корректность констант путей
describe("константы ADB", () => {
  it("DEVICE_PLUGINS_DIR содержит правильный пакет", () => {
    expect(DEVICE_PLUGINS_DIR).toContain("com.exteragram.messenger");
    expect(DEVICE_PLUGINS_DIR).toContain("plugins");
  });

  it("APP_PACKAGE корректен", () => {
    expect(APP_PACKAGE).toBe("com.exteragram.messenger");
  });
});

describe("формирование пути плагина", () => {
  it("корректно строит путь файла плагина", () => {
    const pluginId = "my_plugin";
    const remotePath = `${DEVICE_PLUGINS_DIR}/${pluginId}.py`;
    expect(remotePath).toBe(
      "/data/user/0/com.exteragram.messenger/files/plugins/my_plugin.py"
    );
  });
});

describe("формирование ADB-команды", () => {
  const buildCmd = (subcmd: string, serial?: string) => {
    const serialFlag = serial ? ` -s ${serial}` : "";
    return `adb${serialFlag} ${subcmd}`;
  };

  it("строит команду без серийника", () => {
    expect(buildCmd("devices")).toBe("adb devices");
  });

  it("строит команду с серийником", () => {
    expect(buildCmd("devices", "emulator-5554")).toBe(
      "adb -s emulator-5554 devices"
    );
  });

  it("строит команду push", () => {
    const local = "/path/to/plugin.py";
    const remote = `${DEVICE_PLUGINS_DIR}/my_plugin.py`;
    const cmd = buildCmd(`push "${local}" "${remote}"`);
    expect(cmd).toContain("push");
    expect(cmd).toContain(local);
    expect(cmd).toContain(remote);
  });

  it("строит команду force-stop", () => {
    const cmd = buildCmd(`shell am force-stop ${APP_PACKAGE}`);
    expect(cmd).toContain("force-stop");
    expect(cmd).toContain(APP_PACKAGE);
  });
});
