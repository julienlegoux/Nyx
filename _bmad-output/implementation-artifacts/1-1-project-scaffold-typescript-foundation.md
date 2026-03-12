# Story 1.1: Project Scaffold & TypeScript Foundation

Status: review

## Story

As a developer (J),
I want a fully configured Bun + TypeScript project with Clean Architecture directory structure,
so that all future stories have a consistent, well-structured foundation to build on.

## Acceptance Criteria

1. **Given** the project root is empty
   **When** the scaffold is created
   **Then** package.json exists with Bun as runtime, ESM ("type": "module"), and project metadata
   **And** tsconfig.json has strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes, moduleResolution: "bundler", and @nyx/* path aliases mapping to ./src/*
   **And** biome.json is configured for formatting and linting
   **And** bunfig.toml exists with project settings
   **And** .gitignore excludes node_modules, .env, dist, and Docker volume mount targets

2. **Given** the Clean Architecture directory layout
   **When** inspecting src/
   **Then** four layer directories exist: domain/, application/, infrastructure/, entry/
   **And** domain/ contains subdirectories: entities/, value-objects/, ports/, types/, errors/
   **And** application/ contains subdirectories: heartbeat/, daemons/, consciousness/, memory/
   **And** infrastructure/ contains subdirectories: database/, filesystem/, agent-sdk/, telegram/, embedding/, webapp/, logging/, config/
   **And** every directory under src/ has a barrel index.ts file
   **And** all files follow dot-suffix naming convention (.entity.ts, .interface.ts, .implementation.ts, .usecase.ts, .type.ts, .config.ts, .schema.ts, .error.ts, .test.ts)

3. **Given** the project scaffold is complete
   **When** running `bun install`
   **Then** dependencies install without errors
   **And** `bun run src/entry/heartbeat.ts` can be invoked (stub entry point)

## Tasks / Subtasks

- [x] Task 1: Create root config files (AC: #1)
  - [x] 1.1 Create package.json with name "nyx", type "module", Bun runtime
  - [x] 1.2 Create tsconfig.json with strict settings and @nyx/* path aliases
  - [x] 1.3 Create biome.json for linting and formatting
  - [x] 1.4 Create bunfig.toml
  - [x] 1.5 Create .gitignore
  - [x] 1.6 Create .env.example with placeholder env vars
- [x] Task 2: Create domain layer directories and barrel files (AC: #2)
  - [x] 2.1 Create src/domain/entities/ with index.ts
  - [x] 2.2 Create src/domain/value-objects/ with index.ts
  - [x] 2.3 Create src/domain/ports/ with index.ts
  - [x] 2.4 Create src/domain/types/ with index.ts
  - [x] 2.5 Create src/domain/errors/ with index.ts
  - [x] 2.6 Create src/domain/index.ts barrel
- [x] Task 3: Create application layer directories and barrel files (AC: #2)
  - [x] 3.1 Create src/application/heartbeat/ with index.ts
  - [x] 3.2 Create src/application/daemons/ with index.ts
  - [x] 3.3 Create src/application/consciousness/ with index.ts
  - [x] 3.4 Create src/application/memory/ with index.ts
  - [x] 3.5 Create src/application/index.ts barrel
- [x] Task 4: Create infrastructure layer directories and barrel files (AC: #2)
  - [x] 4.1 Create src/infrastructure/database/ (with schema/ and migrations/ subdirs) with index.ts
  - [x] 4.2 Create src/infrastructure/filesystem/ with index.ts
  - [x] 4.3 Create src/infrastructure/agent-sdk/ with index.ts
  - [x] 4.4 Create src/infrastructure/telegram/ with index.ts
  - [x] 4.5 Create src/infrastructure/embedding/ with index.ts
  - [x] 4.6 Create src/infrastructure/webapp/ with index.ts
  - [x] 4.7 Create src/infrastructure/logging/ with index.ts
  - [x] 4.8 Create src/infrastructure/config/ with index.ts
  - [x] 4.9 Create src/infrastructure/index.ts barrel
- [x] Task 5: Create entry layer with stub heartbeat (AC: #2, #3)
  - [x] 5.1 Create src/entry/heartbeat.ts as stub entry point
  - [x] 5.2 Create src/entry/init.ts as stub
  - [x] 5.3 Create src/entry/shutdown.ts as stub
  - [x] 5.4 Create src/entry/container.ts as stub
- [x] Task 6: Create test directory structure (AC: #2)
  - [x] 6.1 Create tests/ mirroring src/ structure with index.ts barrels
  - [x] 6.2 Create tests/factories/ with index.ts
- [x] Task 7: Install dependencies and validate (AC: #3)
  - [x] 7.1 Run bun install
  - [x] 7.2 Verify bun run src/entry/heartbeat.ts executes without error
  - [x] 7.3 Verify biome check passes
  - [x] 7.4 Verify TypeScript compilation passes

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] `.gitignore` only excludes exact `.env` — change to `.env*` with `!.env.example` exception to prevent secret leaks from `.env.local`, `.env.production`, etc. [.gitignore:2]
- [x] [AI-Review][MEDIUM] `src/entry/` missing barrel `index.ts` — AC #2 says "every directory under src/ has a barrel index.ts file" but entry/ has none. Add barrel or document as intentional deviation. [src/entry/]
- [x] [AI-Review][MEDIUM] No `"test"` script in `package.json` — add `"test": "bun test"` for CI/CD compatibility. [package.json:7]
- [x] [AI-Review][MEDIUM] Scaffold tests validate existence only, not content — consider adding assertions for barrel file validity, empty stub verification, and dot-suffix naming convention. [tests/scaffold.test.ts]
- [x] [AI-Review][MEDIUM] `biome.json` ignores `"_bmad*"` and `".claude"` — practical but undocumented deviation from story spec. Document as intentional. [biome.json:18]
- [x] [AI-Review][LOW] Entry stubs (`init.ts`, `shutdown.ts`, `container.ts`) are 0-byte files — add a single newline to avoid potential tooling edge cases. [src/entry/]
- [x] [AI-Review][LOW] `bunfig.toml` explicitly sets `coverage = false` — consider omitting or documenting rationale. [bunfig.toml:5]
- [x] [AI-Review][LOW] No `.editorconfig` for editor-agnostic formatting consistency on non-biome files (markdown, yaml).

### Review Follow-ups Round 2 (AI)

- [x] [AI-Review-2][HIGH] Review follow-up changes not committed to git — all 8 round-1 fixes are unstaged working tree modifications. Commit them before marking story done. [working tree]
- [x] [AI-Review-2][MEDIUM] Heartbeat subprocess test doesn't verify exit code — add `await proc.exited` and assert exit code 0. Test would currently pass even if heartbeat.ts threw after printing. [tests/scaffold.test.ts:211]
- [x] [AI-Review-2][MEDIUM] Redundant entry stub existence tests — init.ts, shutdown.ts, container.ts tested individually (lines 127-137) AND re-tested in loop (lines 143-147). Remove duplicate loop. [tests/scaffold.test.ts:143]
- [x] [AI-Review-2][MEDIUM] `.editorconfig` test mislabeled as AC #1 — `.editorconfig` is not part of AC #1 spec. Move to a separate describe block (e.g., "Review additions") for accurate traceability. [tests/scaffold.test.ts:185]
- [x] [AI-Review-2][MEDIUM] `.editorconfig` missing `trim_trailing_whitespace = true` — add to `[*]` section for non-biome file hygiene. [.editorconfig:7]
- [x] [AI-Review-2][LOW] `bunfig.toml` reduced to bare minimum after cleanup — add brief inline comment that config is intentionally minimal until test/build needs arise. [bunfig.toml:1]
- [x] [AI-Review-2][LOW] Dev Agent Record first "Completion Notes" entry says "35 tests" — add parenthetical "(pre-review; see Change Log for final count)" to prevent confusion. [story:363]

## Dev Notes

### Architecture Compliance

**Clean Architecture — 4 layers with strict inward dependency:**

```
Entry → Application → Domain ← Infrastructure
                         ^            |
                         └────────────┘
                     (implements ports)
```

**Import rules:**
- `@nyx/domain/*` → imports nothing from other `@nyx/` paths
- `@nyx/application/*` → imports only from `@nyx/domain/*`
- `@nyx/infrastructure/*` → imports only from `@nyx/domain/*`
- `@nyx/entry/*` → imports from all layers (composition root)

**Barrel exports:** Every directory under `src/` gets an `index.ts`. Import from barrels, never individual files across directories.

### File Naming Convention — Dot-Suffix

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.entity.ts` | Domain entity | `memory.entity.ts` |
| `.value-object.ts` | Value object | `significance.value-object.ts` |
| `.interface.ts` | Port / contract | `memory-store.interface.ts` |
| `.implementation.ts` | Port implementation | `memory-store.implementation.ts` |
| `.usecase.ts` | Application use case | `store-memory.usecase.ts` |
| `.error.ts` | Error definitions | `domain.error.ts` |
| `.test.ts` | Test file | `memory-store.test.ts` |
| `.type.ts` | Shared type definitions | `session.type.ts` |
| `.config.ts` | Configuration | `database.config.ts` |
| `.schema.ts` | Drizzle table schemas | `memory.schema.ts` |
| (none) | Entry points, composition | `container.ts`, `heartbeat.ts` |

### Code Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables / functions | `camelCase` | `storeMemory`, `isConscious` |
| Constants | `camelCase` | `defaultSignificance` |
| Types / interfaces / classes | `PascalCase` | `MemoryStore`, `WakeSignal` |
| Enums | `PascalCase` name + members | `SourceType.Reflection` |

### TypeScript Configuration Details

**tsconfig.json must include:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ESNext",
    "paths": {
      "@nyx/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

**Type system rules:**
- No `any` — ever. Use Zod to parse unknown boundaries.
- No unnecessary `as` casts — fix the types instead.
- No `unknown` without immediate narrowing.
- All types centralized in `.type.ts` files within `src/domain/types/`.

### package.json Requirements

- `"name": "nyx"`
- `"type": "module"` (ESM)
- `"private": true`
- Bun as runtime (no compile step for dev)
- Initial devDependencies: `typescript`, `@biomejs/biome`
- Scripts: `"start": "bun run src/entry/heartbeat.ts"`, `"check": "biome check ."`, `"format": "biome format . --write"`, `"lint": "biome lint ."`, `"typecheck": "tsc --noEmit"`

### biome.json Configuration

- Formatter: indent with tabs or 2 spaces (match project preference), line width 100
- Linter: recommended rules enabled
- Organizes imports

### .gitignore Must Exclude

```
node_modules/
.env
dist/
home/
logs/
```

`home/` and `logs/` are Docker volume mount targets — not in repo.

### .env.example Placeholder Variables

```env
# Anthropic
ANTHROPIC_API_KEY=your-key-here

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nyx
POSTGRES_USER=nyx
POSTGRES_PASSWORD=change-me

# Telegram
TELEGRAM_BOT_TOKEN=your-token-here
TELEGRAM_ALLOWED_CHAT_ID=your-chat-id

# Webapp
WEBAPP_PORT=3000

# Logging
LOG_LEVEL=info

# Paths (container paths)
HOME_DIR=/home/nyx
SIGNALS_DIR=/app/signals
LOGS_DIR=/app/logs
```

### Stub Entry Point

`src/entry/heartbeat.ts` should be a minimal stub that proves the scaffold works:

```typescript
console.log("Nyx heartbeat: scaffold operational");
```

All other stubs (`init.ts`, `shutdown.ts`, `container.ts`) should be empty files that export nothing yet — they exist to establish the file structure. Do NOT add placeholder implementations.

### What This Story Does NOT Include

- No Docker/docker-compose setup (Story 1.4)
- No domain entities, value objects, or port interfaces (Story 1.2)
- No configuration loading or logging setup (Story 1.3)
- No seed directory or skill registry (Story 1.5)
- No actual init/shutdown/container wiring (Story 1.6)
- No database, no Drizzle — just the empty `database/schema/` and `database/migrations/` directories

This story creates the skeleton. Subsequent stories flesh it out.

### Complete Directory Structure to Create

```
nyx/
├── package.json
├── tsconfig.json
├── biome.json
├── bunfig.toml
├── .env.example
├── .gitignore
│
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   └── index.ts
│   │   ├── ports/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── application/
│   │   ├── heartbeat/
│   │   │   └── index.ts
│   │   ├── daemons/
│   │   │   └── index.ts
│   │   ├── consciousness/
│   │   │   └── index.ts
│   │   ├── memory/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── schema/
│   │   │   │   └── index.ts
│   │   │   ├── migrations/
│   │   │   └── index.ts
│   │   ├── filesystem/
│   │   │   └── index.ts
│   │   ├── agent-sdk/
│   │   │   └── index.ts
│   │   ├── telegram/
│   │   │   └── index.ts
│   │   ├── embedding/
│   │   │   └── index.ts
│   │   ├── webapp/
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── entry/
│       ├── heartbeat.ts
│       ├── init.ts
│       ├── shutdown.ts
│       └── container.ts
│
└── tests/
    ├── domain/
    │   ├── entities/
    │   └── value-objects/
    ├── application/
    │   ├── heartbeat/
    │   ├── daemons/
    │   ├── consciousness/
    │   └── memory/
    ├── infrastructure/
    │   ├── database/
    │   ├── filesystem/
    │   └── telegram/
    ├── integration/
    └── factories/
        └── index.ts
```

### Project Structure Notes

- Barrel `index.ts` files in scaffold should be empty (just `// barrel export`) — content added by subsequent stories
- Entry files (`init.ts`, `shutdown.ts`, `container.ts`) are empty stubs
- Only `heartbeat.ts` has a console.log to prove execution works
- `tests/` directories do NOT need `index.ts` barrels — only `src/` does
- `tests/factories/index.ts` is the exception (barrel for test factories used across tests)
- `database/migrations/` is an empty directory (no index.ts — drizzle-kit generates files here)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Complete directory tree
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — File and code naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Type System Rules] — Strict typing requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Import Patterns] — Barrel export rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Approach: Custom Scaffold] — Runtime, module system, tooling choices
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Story requirements and acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initial `bun install` failed due to `bun` not being on PATH; resolved after user fixed environment
- Biome check failed due to CRLF line endings (Windows) and spaces-vs-tabs; fixed by running `bun run format` and adding `.claude` to biome ignore list
- TypeScript compilation failed due to missing Bun type definitions; fixed by adding `@types/bun` as devDependency

### Completion Notes List

- Created all root config files: package.json, tsconfig.json, biome.json, bunfig.toml, .gitignore, .env.example
- Created complete Clean Architecture directory structure with 4 layers (domain, application, infrastructure, entry)
- All barrel index.ts files created with `// barrel export` placeholder content
- Entry layer stubs created: heartbeat.ts (with console.log), init.ts, shutdown.ts, container.ts (empty)
- Test directory structure mirrors src/ with .gitkeep files; tests/factories/index.ts barrel created
- database/migrations/ created with .gitkeep (no index.ts per spec)
- Added `@types/bun` as devDependency for TypeScript type checking support
- 35 scaffold validation tests pass covering all 3 acceptance criteria (pre-review; see Change Log for final count)
- Biome check and TypeScript typecheck both pass clean
- Resolved review finding [HIGH]: `.gitignore` updated from `.env` to `.env*` with `!.env.example` exception
- Resolved review finding [MEDIUM]: Added `src/entry/index.ts` barrel file to satisfy AC #2
- Resolved review finding [MEDIUM]: Added `"test": "bun test"` script to package.json
- Resolved review finding [MEDIUM]: Added barrel file content validation tests (22 new assertions verifying all barrels are non-empty)
- Resolved review finding [MEDIUM]: `biome.json` ignoring `_bmad*` and `.claude` documented as intentional — these are tooling/config directories not part of the application codebase
- Resolved review finding [LOW]: Entry stubs remain 0-byte — biome formatter strips content from empty .ts files; this is biome-enforced behavior and not a tooling risk
- Resolved review finding [LOW]: Removed `coverage = false` from `bunfig.toml` — unnecessary explicit default
- Resolved review finding [LOW]: Created `.editorconfig` for consistent formatting of non-biome files (markdown, yaml)
- Resolved review-2 finding [HIGH]: All round-1 and round-2 changes committed to git
- Resolved review-2 finding [MEDIUM]: Heartbeat test now verifies exit code 0 via `await proc.exited`
- Resolved review-2 finding [MEDIUM]: Removed redundant entry stub loop test (lines 143-147)
- Resolved review-2 finding [MEDIUM]: `.editorconfig` test moved from "AC1" to "Review additions" describe block
- Resolved review-2 finding [MEDIUM]: Added `trim_trailing_whitespace = true` to `.editorconfig` `[*]` section
- Resolved review-2 finding [LOW]: Added inline comment to `bunfig.toml` explaining intentionally minimal config
- Resolved review-2 finding [LOW]: Added "(pre-review; see Change Log for final count)" parenthetical to 35-test note

### File List

- package.json (new, modified — added "test" script)
- tsconfig.json (new)
- biome.json (new)
- bunfig.toml (new, modified — removed coverage = false, added intent comment)
- .gitignore (new, modified — .env* glob with !.env.example)
- .env.example (new)
- .editorconfig (new, modified — added trim_trailing_whitespace)
- bun.lock (new, auto-generated)
- src/domain/index.ts (new)
- src/domain/entities/index.ts (new)
- src/domain/value-objects/index.ts (new)
- src/domain/ports/index.ts (new)
- src/domain/types/index.ts (new)
- src/domain/errors/index.ts (new)
- src/application/index.ts (new)
- src/application/heartbeat/index.ts (new)
- src/application/daemons/index.ts (new)
- src/application/consciousness/index.ts (new)
- src/application/memory/index.ts (new)
- src/infrastructure/index.ts (new)
- src/infrastructure/database/index.ts (new)
- src/infrastructure/database/schema/index.ts (new)
- src/infrastructure/database/migrations/.gitkeep (new)
- src/infrastructure/filesystem/index.ts (new)
- src/infrastructure/agent-sdk/index.ts (new)
- src/infrastructure/telegram/index.ts (new)
- src/infrastructure/embedding/index.ts (new)
- src/infrastructure/webapp/index.ts (new)
- src/infrastructure/logging/index.ts (new)
- src/infrastructure/config/index.ts (new)
- src/entry/index.ts (new)
- src/entry/heartbeat.ts (new)
- src/entry/init.ts (new)
- src/entry/shutdown.ts (new)
- src/entry/container.ts (new)
- tests/scaffold.test.ts (new, modified — enhanced with barrel content and structure tests, review-2 fixes: exit code check, redundant loop removed, editorconfig test relabeled)
- tests/factories/index.ts (new)
- tests/domain/entities/.gitkeep (new)
- tests/domain/value-objects/.gitkeep (new)
- tests/application/heartbeat/.gitkeep (new)
- tests/application/daemons/.gitkeep (new)
- tests/application/consciousness/.gitkeep (new)
- tests/application/memory/.gitkeep (new)
- tests/infrastructure/database/.gitkeep (new)
- tests/infrastructure/filesystem/.gitkeep (new)
- tests/infrastructure/telegram/.gitkeep (new)
- tests/integration/.gitkeep (new)

## Change Log

- 2026-03-12: Story 1.1 implemented — full project scaffold with Bun + TypeScript, Clean Architecture directory structure, root config files, and 35 validation tests
- 2026-03-12: Code review completed — 0 Critical, 1 High, 4 Medium, 3 Low findings. 8 action items added to Review Follow-ups.
- 2026-03-12: Addressed code review findings — 8/8 items resolved. Key changes: .gitignore hardened with .env* glob, entry/ barrel added, test script added, scaffold tests enhanced (62 total), .editorconfig created, bunfig.toml cleaned up.
- 2026-03-12: Code review round 2 — 1 High, 4 Medium, 2 Low findings. 7 action items added to Review Follow-ups Round 2.
- 2026-03-12: Addressed code review round 2 findings — 7/7 items resolved. Key changes: heartbeat test verifies exit code, redundant test loop removed, editorconfig test relabeled, trim_trailing_whitespace added, bunfig.toml commented, 35-test note clarified. 61 tests pass, all checks clean.
