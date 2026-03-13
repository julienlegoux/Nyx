# Story 1.6: Entry Layer — Init, Shutdown & Container Wiring

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want the application entry layer with init, shutdown, DI container, and a heartbeat process stub,
so that the system boots sequentially, wires all dependencies, and runs a heartbeat loop ready for future epic functionality. (FR50, NFR13)

## Acceptance Criteria

### AC1: init() — Sequential Bootstrap

**Given** `src/entry/init.ts`
**When** `init()` is called
**Then:**
- It executes sequentially: `loadConfig()` → `createLogger(config.logging)` → `createContainer({ config, logger })`
- Any init failure (ConfigError, pino transport failure, etc.) crashes the process — Docker `restart: unless-stopped` handles recovery (NFR13)
- It returns a fully-wired `Container` object

### AC2: createContainer() — Pure DI Wiring

**Given** `src/entry/container.ts`
**When** `createContainer()` is called with initialized dependencies
**Then:**
- It instantiates all available port implementations with constructor injection:
  - `SkillRegistryImpl(config.paths.home)` → `SkillRegistry`
- It returns a typed `Container` object exposing: `config`, `logger`, `skillRegistry`
- It performs NO async operations and NO side effects — pure wiring only

### AC3: shutdown() — Graceful Teardown

**Given** `src/entry/shutdown.ts`
**When** `shutdown(container)` is called
**Then:**
- It logs "Nyx shutting down"
- It allows pino transport workers time to flush buffered log entries
- It calls `process.exit(0)` after cleanup

### AC4: heartbeat.ts — Process Entry Point

**Given** `src/entry/heartbeat.ts`
**When** the process starts
**Then:**
- It calls `init()` to boot and obtain the `Container`
- It registers `SIGTERM` and `SIGINT` handlers that clear the heartbeat interval and call `shutdown(container)`
- Signal handlers are guarded against re-entrancy (double SIGINT/SIGTERM does not cause duplicate shutdown)
- It starts a heartbeat loop on a 5-minute interval (`setInterval`, 300000ms) (FR18)
- The heartbeat loop body is a stub that logs "heartbeat tick" with a cycle counter (actual daemon/consciousness logic added in Epic 3)
- The logger records startup: "Nyx heartbeat started" (FR50)

### AC5: Full Entry Layer Integration

**Given** the full entry layer
**When** running `bun run src/entry/heartbeat.ts` with valid `.env`
**Then:**
- The process boots, logs startup, and begins heartbeat ticks every 5 minutes
- `Ctrl+C` triggers graceful shutdown (SIGINT → shutdown → exit)
- `docker stop` triggers graceful shutdown (SIGTERM → shutdown → exit)

## Tasks / Subtasks

- [x] Task 1: Implement Container type and createContainer() (AC: #2)
  - [x] 1.1 Define `Container` interface with readonly fields: `config: AppConfig`, `logger: Logger`, `skillRegistry: SkillRegistry`
  - [x] 1.2 Define `InitDeps` interface for createContainer parameters: `config: AppConfig`, `logger: Logger`
  - [x] 1.3 Implement `createContainer(deps: InitDeps): Container` — instantiate `SkillRegistryImpl(deps.config.paths.home)`, return typed Container
  - [x] 1.4 Export Container type and createContainer from `src/entry/container.ts`

- [x] Task 2: Implement init() (AC: #1)
  - [x] 2.1 Implement `init(): Promise<Container>` — call `loadConfig()`, `createLogger(config.logging)`, log "Nyx booting", call `createContainer({ config, logger })`
  - [x] 2.2 No try/catch — uncaught exceptions crash the process (Docker restart handles recovery)
  - [x] 2.3 Export `init` from `src/entry/init.ts`

- [x] Task 3: Implement shutdown() (AC: #3)
  - [x] 3.1 Implement `shutdown(container: Container): Promise<void>` — log "Nyx shutting down", wait 500ms for transport flush, call `process.exit(0)`
  - [x] 3.2 Export `shutdown` from `src/entry/shutdown.ts`

- [x] Task 4: Implement heartbeat.ts process entry point (AC: #4, #5)
  - [x] 4.1 Top-level await: `const container = await init()`
  - [x] 4.2 Declare mutable `heartbeatInterval` variable (type `Timer`)
  - [x] 4.3 Declare cycle counter starting at 0
  - [x] 4.4 Declare `let shuttingDown = false` re-entrancy guard
  - [x] 4.5 Define `onSignal` async function: if `shuttingDown` return early; set `shuttingDown = true`; clear interval; wrap `await shutdown(container)` in try/catch with `process.exit(1)` fallback on error
  - [x] 4.6 Register `process.on("SIGTERM", onSignal)` and `process.on("SIGINT", onSignal)`
  - [x] 4.7 Log "Nyx heartbeat started"
  - [x] 4.8 Set `heartbeatInterval = setInterval(() => { cycle++; logger.info("heartbeat tick", { cycle }) }, 300_000)`

- [x] Task 5: Update barrel export (AC: all)
  - [x] 5.1 Update `src/entry/index.ts` to export `init`, `shutdown`, `createContainer`, `Container` type

- [x] Task 6: Write tests (AC: #1, #2, #3)
  - [x] 6.1 Create `tests/entry/container.test.ts`
  - [x] 6.2 Test `createContainer()` — returns Container with config, logger, skillRegistry properties
  - [x] 6.3 Test `createContainer()` — skillRegistry is a SkillRegistryImpl instance (verify port wiring)
  - [x] 6.4 Test `createContainer()` — Container fields are readonly/immutable
  - [x] 6.5 Create `tests/entry/init.test.ts`
  - [x] 6.6 Test `init()` — with valid env vars, returns Container with all expected properties
  - [x] 6.7 Test `init()` — with missing env var, throws ConfigError (crash behavior)
  - [x] 6.8 Create `tests/entry/shutdown.test.ts`
  - [x] 6.9 Test `shutdown()` — calls process.exit(0) (mock process.exit)

- [x] Task 7: Validate and regression check (AC: all)
  - [x] 7.1 Run `bun run check` — biome lint/format passes
  - [x] 7.2 Run `bun run typecheck` — no type errors
  - [x] 7.3 Run `bun test` — all tests pass, 0 regressions
  - [x] 7.4 Manual smoke test: copy `.env.example` to `.env`, run `bun run src/entry/heartbeat.ts` — boots, logs startup, observe heartbeat ticks

### Review Follow-ups (AI)

- [x] [AI-Review][MEDIUM] Consolidate two separate type imports from `@nyx/domain/ports/index.ts` into one statement [src/entry/container.ts:1-2]
- [x] [AI-Review][MEDIUM] Remove redundant test "performs pure wiring with no side effects" — duplicates test #1 assertions without testing anything new [tests/entry/container.test.ts:69-80]

## Dev Notes

### Architecture Compliance

**Clean Architecture — Entry Layer is the Composition Root:**

The entry layer (`src/entry/`) is the ONLY layer that knows about ALL other layers. It imports from domain (types, ports), infrastructure (implementations), and application (use cases, when they exist). All other layers follow strict inward-dependency rules.

```
src/entry/
├── container.ts            (MODIFY — add Container type + createContainer factory)
├── init.ts                 (MODIFY — add init() function)
├── shutdown.ts             (MODIFY — add shutdown() function)
├── heartbeat.ts            (MODIFY — replace stub with real process entry point)
└── index.ts                (MODIFY — add barrel exports)

tests/entry/
├── container.test.ts       (NEW)
├── init.test.ts            (NEW)
└── shutdown.test.ts        (NEW)
```

### Import Map — Entry Layer

```typescript
// container.ts imports:
import type { AppConfig } from "@nyx/infrastructure/config/index.ts";
import type { Logger } from "@nyx/domain/ports/index.ts";
import type { SkillRegistry } from "@nyx/domain/ports/index.ts";
import { SkillRegistryImpl } from "@nyx/infrastructure/filesystem/index.ts";

// init.ts imports:
import { loadConfig } from "@nyx/infrastructure/config/index.ts";
import { createLogger } from "@nyx/infrastructure/logging/index.ts";
import { createContainer } from "./container.ts";
import type { Container } from "./container.ts";

// shutdown.ts imports:
import type { Container } from "./container.ts";

// heartbeat.ts imports:
import { init } from "./init.ts";
import { shutdown } from "./shutdown.ts";
```

### Container Design — Extensible by Future Stories

The `Container` interface starts minimal and grows as implementations arrive:

```typescript
// Story 1.6 (current):
export interface Container {
    readonly config: AppConfig;
    readonly logger: Logger;
    readonly skillRegistry: SkillRegistry;
}

// Story 2.1 adds: readonly db: DrizzleClient;
// Story 2.2 adds: readonly embeddingProvider: EmbeddingProvider;
// Story 2.3 adds: readonly memoryStore: MemoryStore;
// Story 3.1 adds: readonly signalBus: SignalBus;
// Story 3.3 adds: readonly sessionManager: SessionManager;
// Story 6.1 adds: readonly messenger: Messenger;
```

`createContainer()` also grows — each story adds its implementation instantiation to the factory.

### init() Design — Sequential, Fail-Fast

```typescript
export async function init(): Promise<Container> {
    const config = loadConfig();         // Validates all 13 env vars — throws ConfigError on missing
    const logger = createLogger(config.logging);  // Creates pino with stdout + file rotation
    logger.info("Nyx booting");
    const container = createContainer({ config, logger });
    return container;
}
```

**Future stories extend init() with additional steps before createContainer:**
- Story 2.1: `const db = await connectDatabase(config.database);` + `await runMigrations(db);`
- Story 2.2: `const embeddingModel = await loadEmbeddingModel();`
- Story 3.1: `const signalBus = await initSignalBus(config);`
- Story 6.1: `const telegram = await startTelegramListener(config.telegram, signalBus, logger);`

**No try/catch in init():** Uncaught exceptions crash the process. Docker's `restart: unless-stopped` handles recovery. This is the architecture's deliberate design choice.

### shutdown() Design — Graceful Teardown

```typescript
export async function shutdown(container: Container): Promise<void> {
    container.logger.info("Nyx shutting down");
    // Grace period for pino transport worker threads to flush
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(0);
}
```

**Future stories extend shutdown() with additional cleanup:**
- Story 2.1: Close database connection pool (`db.end()`)
- Story 6.1: Stop Telegram polling listener

**Why `process.exit(0)`:** Pino transports use worker threads that keep the event loop alive. Without explicit exit, the process would hang. The 500ms grace period allows transport workers to flush buffered log entries.

### heartbeat.ts Design — Process Orchestrator

```typescript
// Top-level await — Bun supports this natively
const container = await init();

let cycle = 0;
let heartbeatInterval: Timer;
let shuttingDown = false;

const onSignal = async () => {
    if (shuttingDown) return; // Guard against double SIGINT/SIGTERM
    shuttingDown = true;
    clearInterval(heartbeatInterval);
    try {
        await shutdown(container);
    } catch {
        process.exit(1);
    }
};

process.on("SIGTERM", onSignal);
process.on("SIGINT", onSignal);

container.logger.info("Nyx heartbeat started");

heartbeatInterval = setInterval(() => {
    cycle++;
    container.logger.info("heartbeat tick", { cycle });
}, 300_000); // 5 minutes
```

**Key patterns:**
- Top-level await (no wrapping main function needed — Bun natively supports it)
- **Re-entrancy guard:** `shuttingDown` flag prevents double SIGINT/SIGTERM from running shutdown twice concurrently
- **Error boundary:** try/catch around shutdown with `process.exit(1)` fallback ensures process always exits even if shutdown throws
- Signal handlers clear the interval THEN call shutdown (prevents log-after-exit race)
- Cycle counter enables debugging "how many ticks before crash" in logs
- 300_000ms = 5 minutes per FR18

### Container Extensibility — Future Story Pattern

The `Container` type and `createContainer()` factory are extended by subsequent stories:
- Epic 2 adds `db: DrizzleClient`, `embeddingProvider`, `memoryStore`
- Epic 3 adds `signalBus`, `sessionManager`
- Epic 6 adds `messenger`

Similarly, `init()` grows with additional boot steps and `shutdown()` gains cleanup for new resources.

### Environment Variables Required

All 13 env vars from `.env.example` must be set. `loadConfig()` validates ALL of them at boot even though only `LOG_LEVEL`, `LOGS_DIR`, and `HOME_DIR` are actively used in Story 1.6. This is by design — the architecture mandates all config loads at startup for fail-fast behavior.

```
ANTHROPIC_API_KEY, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER,
POSTGRES_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_CHAT_ID, WEBAPP_PORT,
LOG_LEVEL, HOME_DIR, SIGNALS_DIR, LOGS_DIR
```

### Testing Strategy

**Container tests (`tests/entry/container.test.ts`):**
- Test that `createContainer()` returns object with `config`, `logger`, `skillRegistry`
- Test that `skillRegistry` is a `SkillRegistryImpl` instance wired with `config.paths.home`
- Use mock `AppConfig` and `Logger` objects for isolation

**Init tests (`tests/entry/init.test.ts`):**
- **Env var isolation:** Snapshot `process.env` in `beforeEach`, restore in `afterEach` to prevent leakage between tests. Save original values of all 13 env vars, set test values, then restore originals (including deleting vars that didn't exist before).
- Test that `init()` returns a Container with all expected properties
- Test that missing env var causes `init()` to throw `ConfigError`
- Use temp directories for `HOME_DIR`, `SIGNALS_DIR`, `LOGS_DIR` to avoid polluting real filesystem

**Shutdown tests (`tests/entry/shutdown.test.ts`):**
- Mock `process.exit` to prevent test runner from exiting
- Test that `shutdown()` calls `process.exit(0)`
- Test that container.logger.info is called with "Nyx shutting down"

**Test file location:** `tests/entry/` (mirroring `src/entry/`)

**Test pattern (matches project convention):**
```typescript
import { describe, expect, it, beforeEach, afterEach, mock, spyOn } from "bun:test";
```

### Previous Story Intelligence (Story 1.5)

**Learnings to apply:**
- All files formatted with tabs, line width 100 (Biome enforced)
- 315 tests currently pass — must not regress
- `bun run check`, `bun run typecheck`, `bun test` are the validation commands
- `@nyx/*` path aliases configured in `tsconfig.json` — use them for all cross-directory imports
- Import from barrel `index.ts` files, not individual files
- All port methods return `Promise<Result<T>>` — never throw. But entry layer functions CAN throw (they own lifecycle)
- `SkillRegistryImpl` constructor takes `homePath: string` from `config.paths.home`
- PinoLogger uses `createLogger(config.logging)` factory — returns `Logger` interface
- TypeScript strict mode with `noUncheckedIndexedAccess` — be explicit with type narrowing

**Code patterns established:**
- All infrastructure implementations use `implements` keyword on the port interface
- Import from barrel `index.ts` files, not individual files
- PinoLogger: constructor takes injected pino instance, no global state
- `loadConfig()` validates all env vars at startup — throws `ConfigError` on missing/invalid

### Git Intelligence

Recent commits:
- `7744879` — Add seed directory and SkillRegistry impl (Story 1.5)
- `956fb1b` — Add Docker Compose, Dockerfile, and entrypoint (Story 1.4)
- `86be137` — Add typed config and Pino logging with tests (Story 1.3)
- `e9fb7c0` — Delegate Memory VOs; signal interfaces; readonly
- `50d2801` — Add trim checks, uuidPattern constant, VO refactor

**Conventions from git:**
- Commit messages are imperative, concise, reference what was added/changed
- Each story produces a focused commit with clear scope

### What This Story Does NOT Include

- No database connection or migrations (Story 2.1)
- No embedding model loading (Story 2.2)
- No signal bus initialization (Story 3.1)
- No session manager (Story 3.3)
- No Telegram listener (Story 6.1)
- No application-layer use cases (heartbeat cycle logic is Epic 3)
- No identity store (Story 4.1)
- The heartbeat loop body is a STUB — logs ticks only, no daemon/consciousness logic

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Layer 4 — Entry] — entry layer description: init, container, heartbeat, shutdown
- [Source: _bmad-output/planning-artifacts/architecture.md#Startup & Shutdown Architecture] — init sequence, shutdown pattern, process entry point
- [Source: _bmad-output/planning-artifacts/architecture.md#Dependency Injection] — class-based with constructor injection, typed container factory, pure wiring
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — entry/ file listing, layer boundaries, import rules
- [Source: _bmad-output/planning-artifacts/architecture.md#AI Agent Implementation Rules] — dot-suffix naming, Result<T>, barrel exports, implements, boot in init(), teardown in shutdown()
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Summary] — Decision #13: pino logging, Decision #12: Docker topology with restart: unless-stopped
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6] — AC and user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/prd.md#FR50] — Unified logging across heartbeat cycles
- [Source: _bmad-output/planning-artifacts/prd.md#NFR13] — Supervised heartbeat process with Docker restart
- [Source: _bmad-output/planning-artifacts/prd.md#FR18] — Heartbeat 5-minute interval
- [Source: _bmad-output/implementation-artifacts/1-5-seed-directory-first-boot-mechanism-skill-registry.md] — Previous story: SkillRegistryImpl, established patterns, 315 tests baseline

## Senior Developer Review (AI)

**Review Date:** 2026-03-13
**Review Outcome:** Changes Requested
**Total Action Items:** 2 (0 High, 2 Medium, 0 Low)

### Action Items

- [x] [MEDIUM] Consolidate duplicate type imports in container.ts [src/entry/container.ts:1-2]
- [x] [MEDIUM] Remove redundant test in container.test.ts [tests/entry/container.test.ts:69-80]

### Notes

- All 5 ACs fully implemented and verified
- All tasks marked [x] confirmed as actually done
- Git file changes match story File List — no discrepancies
- 2 LOW issues noted but not actioned: magic number in shutdown.ts (500ms), env var cleanup in init.test.ts (empty string vs delete)
- Code is clean, architecture-compliant, well-structured

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome flagged `let heartbeatInterval` as useConst — restructured heartbeat.ts to use `const` with function declaration hoisting for `onSignal`
- Biome required import reordering in container.test.ts and init.test.ts (sorted `@nyx/entry` before `@nyx/infrastructure`)
- Biome flagged `delete process.env.X` as noDelete — used empty string assignment instead to trigger requireEnv's empty check
- Updated scaffold.test.ts: "stubs are empty" test updated to "files have content"; heartbeat execution test updated to verify crash on missing env vars

### Completion Notes List

- Implemented Container interface with readonly config, logger, skillRegistry fields and InitDeps interface for createContainer parameters
- Implemented createContainer() pure DI factory wiring SkillRegistryImpl with config.paths.home
- Implemented init() with sequential loadConfig → createLogger → createContainer pattern, no try/catch (crash = Docker restart)
- Implemented shutdown() with "Nyx shutting down" log, 500ms grace period for pino transport flush, process.exit(0)
- Implemented heartbeat.ts with top-level await, SIGTERM/SIGINT handlers, re-entrancy guard (shuttingDown flag), error boundary (try/catch with exit(1) fallback), 5-minute heartbeat interval with cycle counter
- Updated entry barrel index.ts with all exports
- 8 new tests across 3 test files (container, init, shutdown)
- Updated 2 scaffold tests to reflect entry layer implementation
- 323 total tests pass, 0 regressions

### Change Log

- 2026-03-13: Story 1.6 implemented — entry layer with init, shutdown, container wiring, heartbeat process. 8 new tests, 323 total pass, 0 regressions.
- 2026-03-13: Code review (AI) — 0 CRITICAL, 0 HIGH, 2 MEDIUM, 2 LOW findings. Both MEDIUM fixed inline:
  - [M1] Consolidated duplicate type imports in container.ts
  - [M2] Removed redundant test in container.test.ts
  - 322 total tests pass, 0 regressions.

### File List

New files:
- tests/entry/container.test.ts
- tests/entry/init.test.ts
- tests/entry/shutdown.test.ts

Modified files:
- src/entry/container.ts (added Container, InitDeps interfaces and createContainer factory)
- src/entry/init.ts (added init() function)
- src/entry/shutdown.ts (added shutdown() function)
- src/entry/heartbeat.ts (replaced scaffold stub with real process entry point)
- src/entry/index.ts (added barrel exports)
- tests/scaffold.test.ts (updated entry stub and heartbeat execution tests)
