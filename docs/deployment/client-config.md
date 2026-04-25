# Конфигурация клиентов

## Claude Code

`~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "@catalystdev/exteragram-mcp"],
      "env": {
        "ADB_PATH": "/usr/bin/adb"
      }
    }
  }
}
```

Или локальная сборка:
```json
{
  "mcpServers": {
    "exteragram": {
      "command": "node",
      "args": ["/path/to/exteragram-mcp/dist/index.js"],
      "env": { "ADB_PATH": "adb" }
    }
  }
}
```

## Cursor / Windsurf

`.cursor/mcp.json` или `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "@catalystdev/exteragram-mcp"],
      "env": { "ADB_PATH": "adb" }
    }
  }
}
```

## Переменные окружения

| Переменная   | Описание                              | По умолчанию |
|--------------|---------------------------------------|--------------|
| `ADB_PATH`   | Полный путь к adb бинарнику           | `adb` (PATH) |
| `ADB_SERIAL` | Серийный номер устройства             | не задан     |
| `MCP_PORT`   | Порт для HTTP/SSE (не реализован v1)  | —            |

## Проект .mcp.json

Для проекта с плагином добавьте в корень репозитория:

```json
{
  "mcpServers": {
    "exteragram": {
      "command": "npx",
      "args": ["-y", "@catalystdev/exteragram-mcp"],
      "env": {
        "ADB_PATH": "adb",
        "ADB_SERIAL": "emulator-5554"
      }
    }
  }
}
```

## VS Code отладка плагина (debugpy)

```json
{
  "version": "0.2.0",
  "configurations": [{
    "name": "exteraGram Plugin",
    "type": "python",
    "request": "attach",
    "connect": { "host": "localhost", "port": 5678 },
    "pathMappings": [{
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/data/user/0/com.exteragram.messenger/files/plugins"
    }]
  }]
}
```

Проброс порта: `adb forward tcp:5678 tcp:5678`
