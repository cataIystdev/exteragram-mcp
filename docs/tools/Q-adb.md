# [Q] ADB — Деплой и управление устройством

## Назначение

Инструменты для деплоя плагинов на устройство, просмотра логов,
управления приложением и произвольных shell-команд через ADB.

---

## Пути и порты

- Путь плагинов на устройстве: `/data/user/0/com.exteragram.messenger/files/plugins/`
- Файл плагина: `<plugin_id>.py`
- Dev server port на устройстве: `42690`
- Debugger port: конфигурируемый (пример в доках: `5678`)

---

## Реализация

Все инструменты используют `child_process.execSync` с таймаутом.
Полная команда: `[ADB_PATH] [-s serial] <command>`.

Если задан `device_serial` в контексте плагина — используется он.
Если задан `ADB_SERIAL` в env — используется он.
Иначе — `adb` работает с единственным подключённым устройством.

---

## Инструменты

### adb_check_devices

**Параметры:** нет

**Выполняет:** `adb devices`

**Возвращает:** список подключённых устройств (serial + state).

---

### adb_deploy_plugin

Деплоит текущий плагин из контекста на устройство.

**Параметры:**
```
file_path     string?  — путь к файлу (берётся из контекста если не задан)
plugin_id     string?  — ID плагина (берётся из контекста если не задан)
device_serial string?  — серийный номер (берётся из контекста/env)
```

**Выполняет:**
```bash
adb [-s serial] push <file_path> /data/user/0/com.exteragram.messenger/files/plugins/<plugin_id>.py
```

**Возвращает:** статус push + путь на устройстве.

---

### adb_list_plugins

**Параметры:**
```
device_serial  string?
```

**Выполняет:**
```bash
adb [-s serial] shell ls -la /data/user/0/com.exteragram.messenger/files/plugins/
```

**Возвращает:** список .py файлов на устройстве.

---

### adb_remove_plugin

**Параметры:**
```
plugin_id     string   — ID плагина для удаления
device_serial string?
```

**Выполняет:**
```bash
adb [-s serial] shell rm /data/user/0/com.exteragram.messenger/files/plugins/<plugin_id>.py
```

**Возвращает:** статус удаления.

---

### adb_get_logs

Получает логи с фильтрацией по плагину.

**Параметры:**
```
plugin_id     string?  — фильтровать по ID (берётся из контекста)
lines         integer? — количество последних строк (default: 100)
device_serial string?
clear         boolean? — очистить буфер перед чтением (default: false)
```

**Выполняет:**
```bash
adb [-s serial] logcat -d -t 100 | grep -i "<plugin_id>"
# или без фильтра:
adb [-s serial] logcat -d -t 100
```

**Возвращает:** строки лога.

---

### adb_restart_app

**Параметры:**
```
device_serial  string?
```

**Выполняет:**
```bash
adb [-s serial] shell am force-stop com.exteragram.messenger
adb [-s serial] shell am start com.exteragram.messenger/.ui.LaunchActivity
```

**Возвращает:** статус перезапуска.

---

### adb_push_file

Произвольный push файла на устройство.

**Параметры:**
```
local_path    string   — локальный путь
remote_path   string   — путь на устройстве
device_serial string?
```

**Выполняет:** `adb [-s serial] push <local_path> <remote_path>`

**Возвращает:** статус + скорость передачи.

---

### adb_pull_file

Получение файла с устройства.

**Параметры:**
```
remote_path   string   — путь на устройстве
local_path    string   — локальный путь
device_serial string?
```

**Выполняет:** `adb [-s serial] pull <remote_path> <local_path>`

---

### adb_shell

Произвольная `adb shell` команда. Полный доступ без ограничений.

**Параметры:**
```
command       string   — shell-команда
device_serial string?
timeout_ms    integer? — таймаут в мс (default: 10000)
```

**Выполняет:** `adb [-s serial] shell <command>`

**Возвращает:** stdout + stderr + exit code.
