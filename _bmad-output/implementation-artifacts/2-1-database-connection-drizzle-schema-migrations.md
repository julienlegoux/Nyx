# Story 2.1: Database Connection, Drizzle Schema & Migrations

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want the pgvector database connected via Drizzle ORM with the memories table schema and automated migrations,
so that the memory storage layer is ready for read/write operations. (NFR1)

## Acceptance Criteria

### AC1: Memory Table Schema

**Given** `src/infrastructure/database/schema/memory.schema.ts`
**When** inspecting the schema definition
**Then:**
- It defines a `memories` table using Drizzle's `pgTable()` with:
  - `id` (UUID, primary key, default `gen_random_uuid()`)
  - `content` (TEXT, not null)
  - `embedding` (VECTOR(768), not null)
  - `createdAt` mapped to `created_at` (TIMESTAMPTZ, not null, default `now()`)
  - `sourceType` mapped to `source_type` (VARCHAR(20), not null)
  - `accessCount` mapped to `access_count` (INTEGER, not null, default 0)
  - `lastAccessed` mapped to `last_accessed` (TIMESTAMPTZ, nullable)
  - `significance` (REAL, not null, default 0.5)
  - `tags` (TEXT[], not null, default `'{}'`)
  - `linkedIds` mapped to `linked_ids` (UUID[], not null, default `'{}'`)
- An HNSW index `idx_memories_embedding` is defined on the `embedding` column using `vector_cosine_ops`
- Secondary indexes exist: `idx_memories_created_at` (DESC), `idx_memories_significance` (DESC), `idx_memories_source_type`

### AC2: Drizzle Config

**Given** `drizzle.config.ts` in project root
**When** inspecting it
**Then:**
- It uses `defineConfig()` from `drizzle-kit`
- Dialect is `"postgresql"`
- Schema points to `./src/infrastructure/database/schema/index.ts`
- Migrations output directory is `./src/infrastructure/database/migrations`
- Database credentials read from environment variables (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)

### AC3: Database Connection

**Given** `src/infrastructure/database/database.config.ts`
**When** `connectDatabase(config)` is called with `DatabaseConfig`
**Then:**
- It is a **synchronous** function (no `async`, no `await` needed) — `drizzle()` creates the pool lazily, no TCP connection until first query
- It creates a Drizzle client using `drizzle()` from `drizzle-orm/node-postgres` with a connection object (`host`, `port`, `database`, `user`, `password`)
- It passes the schema barrel for relational query support
- It returns a `DrizzleClient` instance (type alias for `NodePgDatabase<typeof schema>`)
- No credentials are hardcoded — all values come from the injected `DatabaseConfig` (NFR6)

### AC4: Migrations at Startup

**Given** the init sequence in `src/entry/init.ts`
**When** `init()` runs
**Then:**
- It calls `connectDatabase(config.database)` after logger creation
- It calls `runMigrations(db)` after connecting
- `runMigrations` first executes `CREATE EXTENSION IF NOT EXISTS vector` then applies Drizzle migrations from `src/infrastructure/database/migrations/`
- If postgres is unreachable, init crashes (Docker restart handles recovery)
- The `Container` now includes `readonly db: DrizzleClient`
- `createContainer` accepts and passes through `db`

### AC5: pgvector Extension

**Given** the `runMigrations()` function
**When** it runs
**Then:**
- It executes `CREATE EXTENSION IF NOT EXISTS vector` before applying schema migrations
- This ensures the `vector` type is available for the memories table migration

### AC6: Graceful Shutdown

**Given** the shutdown sequence
**When** `shutdown(container)` is called
**Then:**
- It closes the database connection pool via `container.db.$client.end()` **before** the pino flush timeout and `process.exit(0)`
- Shutdown sequence is: log "shutting down" → close db pool → log "database pool closed" → pino flush → exit

## Tasks / Subtasks

- [x] Task 1: Install dependencies and verify Bun compatibility (AC: all)
  - [x] 1.1 `bun add drizzle-orm pg`
  - [x] 1.2 `bun add -d drizzle-kit @types/pg`
  - [x] 1.3 Add `"db:generate": "drizzle-kit generate"` and `"db:migrate": "drizzle-kit migrate"` scripts to package.json
  - [x] 1.4 Smoke test: `pg.Pool` verified as `function` under Bun

- [x] Task 2: Create memory.schema.ts (AC: #1)
  - [x] 2.1 Create `src/infrastructure/database/schema/memory.schema.ts`
  - [x] 2.2 Import `pgTable`, `uuid`, `text`, `vector`, `timestamp`, `varchar`, `integer`, `real`, `index` from `drizzle-orm/pg-core`
  - [x] 2.3 Define `memories` table with all 10 columns (camelCase TS → snake_case DB)
  - [x] 2.4 Define HNSW index on embedding column with vector_cosine_ops
  - [x] 2.5 Define 3 secondary indexes on created_at DESC, significance DESC, source_type

- [x] Task 3: Update schema barrel export (AC: #1)
  - [x] 3.1 `src/infrastructure/database/schema/index.ts` exports `memories` table

- [x] Task 4: Create drizzle.config.ts (AC: #2)
  - [x] 4.1 Created `drizzle.config.ts` in project root
  - [x] 4.2 Uses `defineConfig()` with dialect postgresql, schema and out paths
  - [x] 4.3 Uses `dbCredentials` with individual env vars (no connection URL)

- [x] Task 5: Create database.config.ts (AC: #3, #4, #5)
  - [x] 5.1 Created `src/infrastructure/database/database.config.ts`
  - [x] 5.2 Exported `DrizzleClient` type and `DatabaseConnection` interface
  - [x] 5.3 Implemented `connectDatabase()` — creates explicit pg.Pool and wraps with drizzle(), returns `{ db, pool }`
  - [x] 5.4 Implemented `runMigrations()` — CREATE EXTENSION IF NOT EXISTS vector + drizzle migrate

- [x] Task 6: Update database barrel export (AC: all)
  - [x] 6.1 `src/infrastructure/database/index.ts` exports connectDatabase, runMigrations, DrizzleClient, DatabaseConnection

- [x] Task 7: Update Container and createContainer (AC: #4)
  - [x] 7.1 Added `readonly db: DrizzleClient` and `readonly dbPool: Pool` to Container
  - [x] 7.2 Added `readonly db: DrizzleClient` and `readonly dbPool: Pool` to InitDeps
  - [x] 7.3 Updated createContainer to pass through deps.db and deps.dbPool
  - [x] 7.4 Added imports for DrizzleClient and Pool

- [x] Task 8: Update init() (AC: #4)
  - [x] 8.1 Imported connectDatabase and runMigrations
  - [x] 8.2 Added `const { db, pool } = connectDatabase(config.database)` after logger
  - [x] 8.3 Added `await runMigrations(db)` after connectDatabase
  - [x] 8.4 Passed db and dbPool to createContainer

- [x] Task 9: Update shutdown() (AC: #6)
  - [x] 9.1 Added `await container.dbPool.end()` before pino flush
  - [x] 9.2 Added "database pool closed" log message

- [x] Task 10: Generate migrations (AC: #1, #5)
  - [x] 10.1 Ran `bunx drizzle-kit generate` — created 0000_fluffy_garia.sql
  - [x] 10.2 Verified migration includes CREATE TABLE memories with all 10 columns
  - [x] 10.3 Verified migration includes all 4 index definitions (HNSW + 3 secondary)
  - [x] 10.4 Migration files generated and tracked

- [x] Task 11: Write tests (AC: #1, #2, #3, #4, #6)
  - [x] 11.1 Created `tests/infrastructure/database/memory-schema.test.ts`
  - [x] 11.2 Tests: all 10 column names present, not-null and default constraints verified
  - [x] 11.3 Test: table name is "memories"
  - [x] 11.4 Created `tests/infrastructure/database/database-config.test.ts`
  - [x] 11.5 Test: connectDatabase returns DatabaseConnection with db and pool
  - [x] 11.6 Test: runMigrations is a function
  - [x] 11.7 Updated container.test.ts — mock db/dbPool, verify Container includes both
  - [x] 11.8 Updated init.test.ts — mock.module for database, verify init returns Container with db/dbPool
  - [x] 11.9 Updated shutdown.test.ts — mock dbPool.end(), verify it's called

- [x] Task 12: Validate and regression check (AC: all)
  - [x] 12.1 `bun run check` — biome lint/format passes
  - [x] 12.2 `bun run typecheck` — no type errors
  - [x] 12.3 `bun test` — 339 tests pass, 0 regressions

## Dev Notes

### Architecture Compliance

**Clean Architecture — Infrastructure Layer Database Module:**

The database module lives in `src/infrastructure/database/`. Drizzle schema types, connection logic, and migration functions stay entirely within infrastructure. The domain layer never imports from here — only the entry layer (composition root) references it for init/shutdown/container wiring.

```
src/infrastructure/database/
├── schema/
│   ├── memory.schema.ts       (NEW — memories table definition)
│   └── index.ts               (MODIFY — export memories table)
├── migrations/
│   └── (drizzle-kit generated) (NEW — generated SQL migration files)
├── database.config.ts          (NEW — connectDatabase, runMigrations, DrizzleClient type)
└── index.ts                    (MODIFY — export database.config exports)

src/entry/
├── container.ts               (MODIFY — add db to Container/InitDeps)
├── init.ts                    (MODIFY — add connectDatabase + runMigrations)
├── shutdown.ts                (MODIFY — add db pool closure)
└── index.ts                   (no change — existing exports cover it)

drizzle.config.ts              (NEW — project root, drizzle-kit config)

tests/infrastructure/database/
├── memory-schema.test.ts      (NEW)
└── database-config.test.ts    (NEW)

tests/entry/
├── container.test.ts          (MODIFY — add db mock)
├── init.test.ts               (MODIFY — mock database functions)
└── shutdown.test.ts           (MODIFY — verify db pool closure)
```

### Import Map

```typescript
// memory.schema.ts imports:
import { index, integer, pgTable, real, text, timestamp, uuid, varchar, vector } from "drizzle-orm/pg-core";

// database.config.ts imports:
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import type { DatabaseConfig } from "@nyx/infrastructure/config/index.ts";
import * as schema from "./schema/index.ts";

// container.ts adds:
import type { DrizzleClient } from "@nyx/infrastructure/database/index.ts";

// init.ts adds:
import { connectDatabase, runMigrations } from "@nyx/infrastructure/database/index.ts";
```

### Memory Schema — Column Mapping Reference

| Domain Type (memory.type.ts) | Drizzle Column | PostgreSQL Type | Notes |
|------------------------------|---------------|-----------------|-------|
| `id: string` | `uuid('id').primaryKey().defaultRandom()` | `UUID DEFAULT gen_random_uuid()` | |
| `content: string` | `text('content').notNull()` | `TEXT NOT NULL` | |
| `embedding: number[]` | `vector('embedding', { dimensions: 768 }).notNull()` | `VECTOR(768) NOT NULL` | Matches `embeddingDimensions` constant in domain |
| `createdAt: Date` | `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |
| `sourceType: SourceType` | `varchar('source_type', { length: 20 }).notNull()` | `VARCHAR(20) NOT NULL` | Stored as string, not enum |
| `accessCount: number` | `integer('access_count').notNull().default(0)` | `INTEGER NOT NULL DEFAULT 0` | |
| `lastAccessed: Date \| null` | `timestamp('last_accessed', { withTimezone: true })` | `TIMESTAMPTZ` | Nullable by default |
| `significance: number` | `real('significance').notNull().default(0.5)` | `REAL NOT NULL DEFAULT 0.5` | 0-1 range, 4-byte float sufficient |
| `tags: string[]` | `text('tags').array().notNull().default(sql\`'{}'\`)` | `TEXT[] NOT NULL DEFAULT '{}'` | |
| `linkedIds: string[]` | `uuid('linked_ids').array().notNull().default(sql\`'{}'\`)` | `UUID[] NOT NULL DEFAULT '{}'` | |

### connectDatabase — NOT async

`connectDatabase()` is synchronous — `drizzle()` creates the pool lazily, no actual TCP connection happens until the first query. The function returns `DrizzleClient` directly (not `Promise<DrizzleClient>`). The actual connection test happens implicitly during `runMigrations()`.

```typescript
export function connectDatabase(config: DatabaseConfig): DrizzleClient {
  return drizzle({
    connection: {
      host: config.host,
      port: config.port,
      database: config.name,
      user: config.user,
      password: config.password,
    },
    schema,
  });
}
```

### runMigrations — Extension First, Then Schema

```typescript
export async function runMigrations(db: DrizzleClient): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  await migrate(db, { migrationsFolder: "./src/infrastructure/database/migrations" });
}
```

The pgvector extension MUST be created before any migration references the `vector` type. `CREATE EXTENSION IF NOT EXISTS` is idempotent — safe on every startup.

**Migration folder path:** `./src/infrastructure/database/migrations` is relative to CWD. Bun's CWD is project root in dev and `/app` in Docker (WORKDIR in Dockerfile). Both resolve correctly. If this ever causes issues, use `path.resolve(import.meta.dir, '../migrations')` to make it absolute relative to the source file.

### Shutdown — Pool Closure Order

```typescript
export async function shutdown(container: Container): Promise<void> {
  container.logger.info("Nyx shutting down");
  await container.db.$client.end();  // Close database pool FIRST
  container.logger.info("database pool closed");
  await new Promise((resolve) => setTimeout(resolve, 500));  // Flush pino
  process.exit(0);
}
```

Database pool must close BEFORE pino flush — prevents lingering connections after process exit.

### drizzle.config.ts Pattern

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/database/schema/index.ts",
  out: "./src/infrastructure/database/migrations",
  dbCredentials: {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT!),
    database: process.env.POSTGRES_DB!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
  },
});
```

This file is ONLY used by `drizzle-kit` CLI commands (generate, migrate, check). It does NOT participate in the runtime application — the app uses `connectDatabase()` which reads config from the DI'd `AppConfig`.

### Testing Strategy

**Schema tests (`tests/infrastructure/database/memory-schema.test.ts`):**
- Import `memories` from schema barrel. Drizzle tables are plain JS objects — inspect column names and table name without a running database.
- Verify all 10 columns exist on the table definition object.
- Verify table name is `"memories"` via the table's internal name property.

**Database config tests (`tests/infrastructure/database/database-config.test.ts`):**
- Verify `connectDatabase` and `runMigrations` are exported functions.
- Verify `connectDatabase` returns an object (DrizzleClient) when given valid config (pool is lazy — no actual connection).
- Do NOT test actual postgres connectivity here (that requires Docker).

**Entry layer test updates:**
- `container.test.ts`: Create a mock db object (any object with `$client` property), pass to `createContainer`, verify Container.db is set.
- `init.test.ts`: Use `mock.module("@nyx/infrastructure/database/index.ts", ...)` to mock `connectDatabase` (returns mock db) and `runMigrations` (resolves void). Verify init() returns Container with db field.
- `shutdown.test.ts`: Add mock `$client.end()` method on the mock db. Verify `shutdown()` calls `db.$client.end()`.

**Test pragmatism:** DrizzleClient mocks in tests can be minimal objects (`{ $client: { end: mock(() => Promise.resolve()) } }`). Tests optimize for clarity, not production purity.

### Project Structure Notes

- `drizzle.config.ts` in project root — standard Drizzle convention, referenced by `drizzle-kit` CLI
- Migration files in `src/infrastructure/database/migrations/` — NOT the default `./drizzle/` folder. Architecture mandates infrastructure-layer colocation.
- Schema files in `src/infrastructure/database/schema/` with barrel `index.ts` — matches architecture tree exactly
- `database.config.ts` naming follows established `.config.ts` suffix convention (like `config.config.ts`)

### Type Boundary Rule

`DrizzleClient` is an infrastructure type. It is allowed in:
- `src/infrastructure/database/` (where it's defined)
- `src/entry/container.ts` and `src/entry/init.ts` (composition root)

It must NEVER appear in:
- `src/domain/` (domain layer knows nothing about Drizzle)
- `src/application/` (application layer depends on domain ports, not infrastructure types)

### What This Story Does NOT Include

- No `MemoryStore` implementation (Story 2.3) — only schema and connection
- No embedding provider (Story 2.2) — independent concern
- No read/write operations against the memories table (Stories 2.3-2.5)
- No integration tests against real postgres (deferred to Story 2.3 when there are actual operations to test)
- No `toDomain()` / `toRow()` mapper functions (Story 2.3 — they belong in the MemoryStore adapter)

### Previous Story Intelligence (Story 1.6)

**Key learnings to apply:**
- All files formatted with tabs, line width 100 (Biome enforced)
- 322 tests currently pass — must not regress
- Validation commands: `bun run check`, `bun run typecheck`, `bun test`
- `@nyx/*` path aliases configured in `tsconfig.json` — use for all cross-directory imports
- Import from barrel `index.ts` files, not individual files
- Entry layer functions CAN throw (they own lifecycle) — no Result<T> needed for init/shutdown/connectDatabase
- Biome required import reordering in previous story — expect same for new imports
- `mock.module()` may be needed for mocking infrastructure modules in entry tests (established in 1.6 init tests)
- Biome flags `delete process.env.X` as noDelete — use empty string assignment
- TypeScript strict mode with `noUncheckedIndexedAccess` — be explicit with type narrowing

**Code patterns established:**
- Container interface with readonly fields, extended per story
- InitDeps interface matches Container minus computed fields
- createContainer is pure synchronous wiring — no async, no side effects
- init() is sequential: config → logger → [new resources] → container
- shutdown() closes resources before pino flush and process.exit(0)

### Git Intelligence

Recent commits:
- `522b013` — Implement entry layer: init, container, heartbeat (Story 1.6)
- `7744879` — Add seed directory and SkillRegistry impl (Story 1.5)
- `956fb1b` — Add Docker Compose, Dockerfile, and entrypoint (Story 1.4)
- `86be137` — Add typed config and Pino logging with tests (Story 1.3)

**Conventions:**
- Commit messages are imperative, concise, reference what was added
- Each story produces a focused commit

### Dependencies to Install

| Package | Type | Version | Purpose |
|---------|------|---------|---------|
| `drizzle-orm` | dependency | latest | ORM with native pgvector support |
| `pg` | dependency | latest | node-postgres driver (pure JS, Bun-compatible) |
| `drizzle-kit` | devDependency | latest | Migration generation CLI |
| `@types/pg` | devDependency | latest | TypeScript types for pg |

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Drizzle ORM Patterns] — schema conventions, query conventions, mapper patterns, migration strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Memory Table Schema] — exact SQL schema with columns, types, indexes
- [Source: _bmad-output/planning-artifacts/architecture.md#Startup & Shutdown Architecture] — init sequence, shutdown pattern, connectDatabase placement
- [Source: _bmad-output/planning-artifacts/architecture.md#Dependency Injection] — class-based with constructor injection, typed container factory
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — .schema.ts, .config.ts suffixes, snake_case DB names
- [Source: _bmad-output/planning-artifacts/architecture.md#Configuration Pattern] — DatabaseConfig interface, env var handling
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — database/ directory layout
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — AC and user story
- [Source: _bmad-output/planning-artifacts/prd.md#NFR1] — Optimized pgvector indexing (HNSW)
- [Source: _bmad-output/planning-artifacts/prd.md#NFR17] — pgvector unreachable = graceful failure
- [Source: _bmad-output/planning-artifacts/prd.md#FR1] — Memory storage with full metadata
- [Source: _bmad-output/implementation-artifacts/1-6-entry-layer-init-shutdown-container-wiring.md] — Previous story: Container pattern, init/shutdown design, 322 tests baseline
- [Source: drizzle-orm docs] — vector() column type from drizzle-orm/pg-core, cosineDistance() helper, node-postgres driver setup, migrate() from drizzle-orm/node-postgres/migrator

## Senior Developer Review (AI)

**Review Date:** 2026-03-13
**Review Outcome:** Approved
**Total Action Items:** 0 (0 Critical, 0 High, 0 Medium, 3 Low — no action required)

### Notes

- All 6 ACs fully implemented and verified against code
- All 12 tasks marked [x] confirmed as actually done
- Git file changes match story File List — no discrepancies (bun.lock is expected)
- 3 LOW issues noted: story AC text drift from implementation improvements (code is better than AC specified), bun.lock not in File List, redundant .gitkeep in migrations folder
- Code is clean, architecture-compliant, well-structured
- 339 tests pass, 0 regressions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Drizzle's `NodePgDatabase` type does not expose `$client` — restructured to use explicit `pg.Pool` stored as `dbPool` on Container instead of relying on `db.$client`
- Drizzle table objects include an `enableRLS` internal property (11 keys vs 10 columns) — adjusted schema test to verify column presence without strict count
- Biome required import reordering: `@nyx/*` aliases sort before external packages (`pg`, `drizzle-orm`)
- Biome flagged non-null assertions in drizzle.config.ts — replaced with `?? ""` fallbacks
- Generated migration metadata JSON files use spaces (drizzle-kit output) — biome format auto-fixed to tabs

### Completion Notes List

- Installed drizzle-orm@0.45.1, pg@8.20.0, drizzle-kit@0.31.9, @types/pg@8.18.0
- Verified pg works under Bun (smoke test passed)
- Created memory.schema.ts with 10 columns and 4 indexes matching architecture exactly
- Created drizzle.config.ts in project root for drizzle-kit CLI usage
- Created database.config.ts with connectDatabase() (returns { db, pool }) and runMigrations() (CREATE EXTENSION + migrate)
- Extended Container with `db: DrizzleClient` and `dbPool: Pool` fields
- Extended init() with connectDatabase + runMigrations before container creation
- Extended shutdown() with dbPool.end() before pino flush
- Generated initial SQL migration (0000_fluffy_garia.sql) with full schema
- 17 new tests across 5 files (2 new test files, 3 updated)
- 339 total tests pass, 0 regressions
- All validation gates pass: check, typecheck, test

### Change Log

- 2026-03-13: Story 2.1 implemented — Drizzle ORM + pgvector schema, database connection, migrations, Container/init/shutdown wiring. 17 new tests, 339 total pass, 0 regressions.

### File List

New files:
- drizzle.config.ts
- src/infrastructure/database/database.config.ts
- src/infrastructure/database/schema/memory.schema.ts
- src/infrastructure/database/migrations/0000_fluffy_garia.sql
- src/infrastructure/database/migrations/meta/0000_snapshot.json
- src/infrastructure/database/migrations/meta/_journal.json
- tests/infrastructure/database/memory-schema.test.ts
- tests/infrastructure/database/database-config.test.ts

Modified files:
- package.json (added dependencies and db scripts)
- src/infrastructure/database/schema/index.ts (export memories)
- src/infrastructure/database/index.ts (export database.config)
- src/entry/container.ts (added db and dbPool to Container/InitDeps)
- src/entry/init.ts (added connectDatabase + runMigrations)
- src/entry/shutdown.ts (added dbPool.end())
- tests/entry/container.test.ts (added db/dbPool mocks)
- tests/entry/init.test.ts (mock.module for database, verify db/dbPool)
- tests/entry/shutdown.test.ts (verify dbPool.end() called)
