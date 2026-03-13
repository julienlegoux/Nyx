# Story 1.3: Configuration & Logging

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want a typed configuration module and structured logging system,
so that all runtime settings are centralized and all system activity is observable. (FR50)

## Acceptance Criteria

1. **Given** the config module at `src/infrastructure/config/`
   **When** `loadConfig()` is called
   **Then** it reads all required environment variables and returns a typed `AppConfig` object with sections: `database` (host, port, name, user, password), `telegram` (botToken, allowedChatId), `anthropic` (apiKey), `logging` (level, directory), `webapp` (port), `paths` (home, signals, logs)
   **And** `requireEnv()` throws a `ConfigError` with the variable name if any required env var is missing
   **And** no other file in the codebase reads from `process.env`

2. **Given** `.env.example` exists in project root
   **When** inspecting it
   **Then** it lists all required environment variables with placeholder values and comments

3. **Given** the logger implementation at `src/infrastructure/logging/`
   **When** a logger is created via `createLogger(config)`
   **Then** it uses pino with JSON output format
   **And** it writes to stdout (Docker captures) and a rolling file in the configured logs directory
   **And** log levels debug, info, warn, error are supported
   **And** child loggers can be created with source tags: `heartbeat`, `daemon:consolidator`, `daemon:pattern-detector`, `consciousness`, `telegram`, `memory`
   **And** each log entry includes timestamp, level, source tag, and message

4. **Given** the logger port and implementation
   **When** used from application layer
   **Then** application code depends only on the `Logger` port interface, not the pino implementation

5. **Given** all infrastructure code in this story
   **When** checking imports
   **Then** config and logging modules import from domain via barrel `@nyx/domain` only
   **And** no domain code imports from infrastructure

## Tasks / Subtasks

- [x] Task 1: Install dependencies (AC: #3)
  - [x] 1.1 `bun add pino pino-roll` — pino v10.3.1, pino-roll v4.0.0 installed
  - [x] 1.2 Verify pino ESM import works under Bun: `import pino from "pino"` — confirmed working

- [x] Task 2: Create config types and implementation (AC: #1)
  - [x] 2.1 Create `src/infrastructure/config/config.config.ts` — `AppConfig` interface with sub-interfaces, `requireEnv()`, `requireInt()`, `requirePositiveInt()`, `loadConfig()`
  - [x] 2.2 Validate all `parseInt` results: ports validated as finite positive integers; `allowedChatId` validated as finite integer (allows negative for group chats)
  - [x] 2.3 Validate `LOG_LEVEL` against allowed values `"debug" | "info" | "warn" | "error"` — throws `ConfigError` with valid options listed
  - [x] 2.4 Update `src/infrastructure/config/index.ts` barrel — exports `AppConfig`, `LogLevel` (types), `loadConfig` (runtime)

- [x] Task 3: Create logger implementation (AC: #3, #4)
  - [x] 3.1 Create `src/infrastructure/logging/logger.implementation.ts` — `PinoLogger` class implementing `Logger` port, `createLogger(config: LoggingConfig)` factory with stdout + pino-roll transports
  - [x] 3.2 Update `src/infrastructure/logging/index.ts` barrel — exports `PinoLogger` (class), `createLogger` (runtime)

- [x] Task 4: Update .env.example (AC: #2)
  - [x] 4.1 Add descriptive section comments to `.env.example`, added LOG_LEVEL valid values comment

- [x] Task 5: Write tests (AC: #1-5)
  - [x] 5.1 Create `tests/infrastructure/config/config.test.ts` — 40 tests: happy path, missing vars, empty vars, port NaN/zero/negative, chat ID negative/NaN, LOG_LEVEL validation
  - [x] 5.2 Create `tests/infrastructure/logging/logger.test.ts` — 16 tests: interface compliance, all methods with/without data, child loggers, nested children, source binding output, JSON format verification
  - [x] 5.3 Create `tests/infrastructure/config/config-isolation.test.ts` — filesystem scan verifying no `process.env` usage outside `src/infrastructure/config/`
  - [x] 5.4 Run `bun run check` (0 errors), `bun run typecheck` (0 errors), `bun test` (292 pass, 0 fail)

## Dev Notes

### Architecture Compliance

**Clean Architecture — Infrastructure layer implements domain ports:**

```
Entry → Application → Domain ← Infrastructure
                         ↑            |
                         └────────────┘
                     (implements ports)
```

**Critical rules for this story:**
- `src/infrastructure/config/` and `src/infrastructure/logging/` are Layer 3 (Infrastructure)
- Config module is the ONLY place `process.env` is ever read — enforcement guideline #5
- Logger implementation `implements Logger` (the domain port from `src/domain/ports/logger.interface.ts`)
- Config object is passed via DI — never imported as a module singleton (enforcement guideline #5)
- `loadConfig()` is called once in `init.ts` (Story 1.6), result injected everywhere

### Configuration Module — Exact Specification

**File:** `src/infrastructure/config/config.config.ts`

```typescript
import { ConfigError } from "@nyx/domain/errors/index.ts";

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface TelegramConfig {
  botToken: string;
  allowedChatId: number;
}

export interface AnthropicConfig {
  apiKey: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggingConfig {
  level: LogLevel;
  directory: string;   // absolute path to logs dir — shared with paths.logs
}

export interface WebappConfig {
  port: number;
}

export interface PathsConfig {
  home: string;        // /home/nyx
  signals: string;     // /app/signals
  logs: string;        // /app/logs
}

export interface AppConfig {
  database: DatabaseConfig;
  telegram: TelegramConfig;
  anthropic: AnthropicConfig;
  logging: LoggingConfig;
  webapp: WebappConfig;
  paths: PathsConfig;
}

const validLogLevels: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new ConfigError(`Required environment variable ${name} is not set`);
  }
  return value;
}

function requireInt(name: string): number {
  const raw = requireEnv(name);
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new ConfigError(`${name} must be a valid integer, got "${raw}"`);
  }
  return parsed;
}

function requirePositiveInt(name: string): number {
  const value = requireInt(name);
  if (value <= 0) {
    throw new ConfigError(`${name} must be a positive integer, got ${value}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  const logsDir = requireEnv("LOGS_DIR");

  const level = requireEnv("LOG_LEVEL");
  if (!validLogLevels.includes(level as LogLevel)) {
    throw new ConfigError(
      `LOG_LEVEL must be one of ${validLogLevels.join(", ")}, got "${level}"`
    );
  }

  return {
    database: {
      host: requireEnv("POSTGRES_HOST"),
      port: requirePositiveInt("POSTGRES_PORT"),
      name: requireEnv("POSTGRES_DB"),
      user: requireEnv("POSTGRES_USER"),
      password: requireEnv("POSTGRES_PASSWORD"),
    },
    telegram: {
      botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
      allowedChatId: requireInt("TELEGRAM_ALLOWED_CHAT_ID"),
    },
    anthropic: {
      apiKey: requireEnv("ANTHROPIC_API_KEY"),
    },
    logging: {
      level: level as LogLevel,
      directory: logsDir,
    },
    webapp: {
      port: requirePositiveInt("WEBAPP_PORT"),
    },
    paths: {
      home: requireEnv("HOME_DIR"),
      signals: requireEnv("SIGNALS_DIR"),
      logs: logsDir,
    },
  };
}
```

**Helpers are NOT exported.** `requireEnv`, `requireInt`, `requirePositiveInt` are module-private. Only `loadConfig`, `AppConfig`, `LogLevel`, and sub-config interfaces are exported.

### Logger Implementation — Exact Specification

**File:** `src/infrastructure/logging/logger.implementation.ts`

```typescript
import pino from "pino";
import type { Logger } from "@nyx/domain/ports/index.ts";
import type { LoggingConfig } from "@nyx/infrastructure/config/index.ts";
```

**`PinoLogger` class — implements domain `Logger` port:**

```typescript
export class PinoLogger implements Logger {
  constructor(private readonly instance: pino.Logger) {}

  info(message: string, data?: Record<string, unknown>): void {
    if (data) this.instance.info(data, message);
    else this.instance.info(message);
  }

  warn(message: string, data?: Record<string, unknown>): void { /* same pattern */ }
  error(message: string, data?: Record<string, unknown>): void { /* same pattern */ }
  debug(message: string, data?: Record<string, unknown>): void { /* same pattern */ }

  child(source: string): Logger {
    return new PinoLogger(this.instance.child({ source }));
  }
}
```

**`createLogger` factory function:**

```typescript
export function createLogger(config: LoggingConfig): Logger {
  const pinoInstance = pino({
    level: config.level,
    transport: {
      targets: [
        {
          target: "pino/file",
          level: config.level,
          options: { destination: 1 },  // stdout (fd 1)
        },
        {
          target: "pino-roll",
          level: config.level,
          options: {
            file: path.join(config.directory, "nyx"),
            frequency: "daily",
            mkdir: true,
          },
        },
      ],
    },
  });

  return new PinoLogger(pinoInstance);
}
```

**Key details:**
- `pino-roll` transport writes rolling daily log files like `nyx.1`, `nyx.2`, etc. in the configured directory
- Stdout output is captured by Docker logging driver — this is the primary log sink
- Rolling file is the secondary sink for on-disk persistence
- `path.join` requires `import path from "node:path"` — this is acceptable in infrastructure layer (not domain)
- Child loggers bind `{ source: "heartbeat" }` etc. — this appears in every log entry from that child

### Pino Version & Compatibility

- **pino**: latest stable (v9.x). JSON-native, structured logging. Transport API uses worker threads.
- **pino-roll**: latest stable. Rolling file transport. Options: `file` (base path), `frequency` ("daily"), `mkdir` (create dirs).
- Both are ESM-compatible. pino ships its own TypeScript types.

**Known Risk — Bun Worker Thread Compatibility:**

Pino's `transport` API spawns worker threads for non-blocking I/O. Bun's worker thread support may have edge cases. If `pino.transport()` fails under Bun:

**Fallback strategy:** Replace the transport-based approach with synchronous `pino.destination()`:

```typescript
// Fallback if pino.transport() fails under Bun
import { createWriteStream } from "node:fs";

const pinoInstance = pino(
  { level: config.level },
  pino.multistream([
    { stream: process.stdout, level: config.level },
    { stream: pino.destination({ dest: path.join(config.directory, "nyx.log"), mkdir: true, sync: false }), level: config.level },
  ])
);
```

This loses daily rolling (would need manual rotation or `logrotate`), but guarantees Bun compatibility. Try `pino.transport()` first — only fall back if it fails.

**ESM Import Verification:** Confirm `import pino from "pino"` resolves correctly under Bun's module resolution. If it doesn't, try `import { pino } from "pino"` or check pino's `exports` map in its `package.json`.

### .env.example Update

Current `.env.example` exists with all variables. Add section comments for clarity:

```bash
# ===================
# Anthropic API
# ===================
ANTHROPIC_API_KEY=your-key-here

# ===================
# Database (PostgreSQL + pgvector)
# ===================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nyx
POSTGRES_USER=nyx
POSTGRES_PASSWORD=change-me

# ===================
# Telegram Bot
# ===================
TELEGRAM_BOT_TOKEN=your-token-here
TELEGRAM_ALLOWED_CHAT_ID=your-chat-id

# ===================
# Webapp
# ===================
WEBAPP_PORT=3000

# ===================
# Logging
# ===================
LOG_LEVEL=info

# ===================
# Paths (container runtime directories)
# ===================
HOME_DIR=/home/nyx
SIGNALS_DIR=/app/signals
LOGS_DIR=/app/logs
```

### Testing Strategy

**Config tests (`tests/infrastructure/config/config.test.ts`):**

Must manipulate `process.env` in tests. Use `beforeEach`/`afterEach` to set and restore env vars.

```typescript
// Pattern for env var testing
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  // Set all required vars
  process.env.POSTGRES_HOST = "localhost";
  // ... etc
});

afterEach(() => {
  process.env = originalEnv;
});
```

**Test cases:**
- Happy path: all env vars set → returns valid `AppConfig` with correct types
- Missing required var → throws `ConfigError` with variable name in message
- Port parsing: `"5432"` → `5432` (number)
- Invalid port (NaN, e.g. `"abc"`) → throws `ConfigError`
- Non-positive port (`"0"`, `"-1"`) → throws `ConfigError`
- Empty string env var → throws `ConfigError` (treated as missing)
- `allowedChatId` can be negative (Telegram group chats) — `-100123` is valid
- `allowedChatId` NaN → throws `ConfigError`
- Invalid `LOG_LEVEL` (e.g. `"verbose"`) → throws `ConfigError` listing valid values
- Valid `LOG_LEVEL` values: `"debug"`, `"info"`, `"warn"`, `"error"` all accepted
- `logging.directory` and `paths.logs` share the same value (read `LOGS_DIR` once)

**Logger tests (`tests/infrastructure/logging/logger.test.ts`):**

Testing pino with transports is tricky since transports use worker threads. Test strategy:

- Create logger with minimal config (stdout only for tests, skip file transport)
- Verify `createLogger` returns an object matching `Logger` interface
- Verify `child("heartbeat")` returns a Logger-compatible object
- Verify all four methods (info, warn, error, debug) are callable without throwing
- For actual output verification, use `pino.destination()` to a writable stream and parse the JSON output
- Do NOT test pino-roll directly in unit tests — that's an integration concern

**Import isolation test (`tests/infrastructure/config/config-isolation.test.ts`):**

Same pattern as Story 1.2's `tests/domain/import-isolation.test.ts`:
- Use `fs.readdir` + `fs.readFile` to scan all `.ts` files under `src/`
- Exclude `src/infrastructure/config/` from the scan
- Assert none contain `process.env` — regex: `/process\.env/`
- Also exclude `*.test.ts` files from scan (test files may legitimately set env vars)
- This enforces AC #1: "no other file in the codebase reads from process.env"

### File Naming Convention

| Suffix | Example |
|--------|---------|
| `.config.ts` | `config.config.ts` |
| `.implementation.ts` | `logger.implementation.ts` |
| `.interface.ts` | (already exists: `logger.interface.ts`) |
| `.test.ts` | `config.test.ts` |

### Code Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables / functions | `camelCase` | `loadConfig`, `createLogger`, `requireEnv` |
| Constants | `camelCase` | (none in this story) |
| Types / interfaces | `PascalCase` | `AppConfig`, `DatabaseConfig`, `PinoLogger` |
| Classes | `PascalCase` | `PinoLogger` |

### Barrel Export Pattern

```typescript
// src/infrastructure/config/index.ts
export type { AppConfig, DatabaseConfig, TelegramConfig, AnthropicConfig, LoggingConfig, LogLevel, WebappConfig, PathsConfig } from "./config.config.ts";
export { loadConfig } from "./config.config.ts";

// src/infrastructure/logging/index.ts
export { PinoLogger, createLogger } from "./logger.implementation.ts";
```

Use `export type { X }` for interfaces/types (type-only). Use `export { X }` for classes and functions (runtime values). Biome will auto-fix this via `useExportType` rule.

### What This Story Does NOT Include

- No DI wiring (Story 1.6 — entry layer calls `loadConfig()` and `createLogger()`)
- No Docker setup (Story 1.4)
- No Drizzle/database configuration (Story 2.1 uses `config.database`)
- No Telegram bot setup (Story 6.1 uses `config.telegram`)
- No Agent SDK configuration (Story 3.3)
- No log rotation policies beyond daily rolling (pino-roll handles cleanup)

### Previous Story Intelligence (Story 1.2)

**Learnings to apply:**
- Biome formats with tabs, line width 100. Run `bun run format` after creating files.
- Biome enforces `useExportType` — will rewrite `export { type X }` to `export type { X }`.
- All files must end with a newline (biome enforces).
- Barrel `index.ts` files must have real exports, not just `// barrel export` comments.
- `bun:test` with `describe`/`it`/`expect` API. Test files in `tests/` mirroring `src/`.
- `@nyx/*` path aliases work. Import from barrels, not individual files across directories.
- Validation commands: `bun run check`, `bun run typecheck`, `bun test`.
- Story 1.2 had 7 code review rounds. Main patterns to avoid: forgetting NaN validation for parsed numbers, missing defensive copies, whitespace-only strings passing validation.
- `ConfigError` already exists in `src/domain/errors/domain.error.ts` — import and reuse it.

**Code patterns established in 1-2:**
- Factory functions returning `Result<T>` for domain value objects
- `export type { X }` for type-only exports from barrels
- `interface X extends Y {}` pattern for entities (not type aliases)

**Relevant to this story:**
- `ConfigError` class: `readonly code = "CONFIG_ERROR"` — use this for all config validation failures
- `Logger` port interface defined at `src/domain/ports/logger.interface.ts` — 4 methods + `child(source: string): Logger`

### Git Intelligence

Recent commits show:
- `e9fb7c0` — Delegate Memory VOs; signal interfaces; readonly
- `50d2801` — Add trim checks, uuidPattern constant, VO refactor
- `13cc840` — Add validations for embeddings, sessions, and signals
- Domain layer is fully complete with 231 passing tests
- Entry layer files (`init.ts`, `container.ts`, `heartbeat.ts`, `shutdown.ts`) are 0-byte stubs
- Infrastructure barrels are `// barrel export` stubs — this story fills in `config/` and `logging/`

### Project Structure Notes

Files to create/modify in this story:

```
src/infrastructure/
├── config/
│   ├── config.config.ts          (NEW — AppConfig + loadConfig + requireEnv)
│   └── index.ts                  (MODIFY — replace stub with real exports)
├── logging/
│   ├── logger.implementation.ts  (NEW — PinoLogger + createLogger)
│   └── index.ts                  (MODIFY — replace stub with real exports)

.env.example                      (MODIFY — add section comments)

tests/infrastructure/
├── config/
│   └── config.test.ts            (NEW)
└── logging/
    └── logger.test.ts            (NEW)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Configuration Pattern] — Single typed config module, no env var prefix, requireEnv throws on missing
- [Source: _bmad-output/planning-artifacts/architecture.md#Logging] — pino, JSON output, stdout + rolling file, source tags
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — Rule #5: Read config only from injected AppConfig, never from process.env
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — config.config.ts and logger.implementation.ts file locations
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Component Dependencies] — Logger appears in all component dependency chains
- [Source: _bmad-output/planning-artifacts/architecture.md#Entry Layer] — init.ts calls loadConfig() and createLogger(), passes via DI
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — AC and user story
- [Source: _bmad-output/planning-artifacts/prd.md#FR50] — Logging for heartbeat cycles, daemon runs, consciousness sessions, memory ops
- [Source: _bmad-output/planning-artifacts/prd.md#NFR6] — Credentials as env vars, never hardcoded
- [Source: _bmad-output/planning-artifacts/prd.md#NFR11] — Rolling logs for crash reconstruction
- [Source: _bmad-output/implementation-artifacts/1-2-domain-layer-types-entities-ports-errors.md] — Previous story patterns, ConfigError class, Logger port interface

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome auto-fixed import sorting (alphabetical), `node:` protocol for `require("stream")` → `require("node:stream")`, and `delete process.env.X` → `process.env.X = undefined`
- pino ESM import `import pino from "pino"` works natively under Bun v1.3.10 — no fallback needed
- pino v10.3.1 (not v9.x as story estimated) — transport API works identically
- `as const` needed on log level array in test to satisfy `exactOptionalPropertyTypes` strict typing

### Completion Notes List

- Typed `AppConfig` with 6 sub-config interfaces (Database, Telegram, Anthropic, Logging, Webapp, Paths)
- `LogLevel` union type: `"debug" | "info" | "warn" | "error"` — validated at config load time
- `requireEnv()`, `requireInt()`, `requirePositiveInt()` helpers — module-private, not exported
- `LOGS_DIR` read once, shared between `logging.directory` and `paths.logs` — no double read
- `PinoLogger` class implements domain `Logger` port with `child(source)` for tagged loggers
- `createLogger()` factory: stdout transport + pino-roll daily rolling file transport
- `.env.example` updated with section comments and LOG_LEVEL valid values note
- `config-isolation.test.ts` scans all source files ensuring no `process.env` outside config module
- 292 total tests pass (61 new for this story), 0 regressions from Stories 1.1 + 1.2

### File List

New files:
- src/infrastructure/config/config.config.ts
- src/infrastructure/logging/logger.implementation.ts
- tests/infrastructure/config/config.test.ts
- tests/infrastructure/config/config-isolation.test.ts
- tests/infrastructure/logging/logger.test.ts

Modified files:
- src/infrastructure/config/index.ts (replaced stub with real exports)
- src/infrastructure/logging/index.ts (replaced stub with real exports)
- .env.example (added section comments)
- package.json (added pino, pino-roll dependencies)
- bun.lockb (updated)

### Change Log

- 2026-03-13: Story 1.3 implemented — typed configuration module with validation, pino-based structured logging with stdout + rolling file, 61 new tests. 292 total pass, 0 regressions.
- 2026-03-13: Code review (AI) — 2 HIGH, 3 MEDIUM, 1 LOW findings. All HIGH+MEDIUM fixed inline:
  - [H1] Added `createLogger()` integration tests (3 tests)
  - [H2] Added `.trim()` to `requireEnv` — whitespace-only strings now rejected (2 tests)
  - [M1] Isolation test uses `findProjectRoot()` via package.json traversal instead of fragile relative path
  - [M2] `requireInt` now rejects decimals/trailing text via `String(parsed) !== raw` check (3 tests)
  - [M3] Logger tests use ESM `import { Writable }` instead of `require("node:stream")`
  - 300 total tests pass, 0 regressions. Status → done.
