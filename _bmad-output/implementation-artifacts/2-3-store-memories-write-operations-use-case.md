# Story 2.3: Store Memories — Write Operations & Use Case

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Nyx (via the system),
I want to store new memories with full metadata and update existing memories' significance, tags, and links,
so that my experiences are persisted as richly annotated, interconnected records.

## Acceptance Criteria

### AC1: MemoryStore Write Operations — store()

**Given** `src/infrastructure/database/memory-store.implementation.ts`
**When** `store(memory)` is called with a Memory entity (embedding already computed)
**Then:**
- It maps the domain entity to a database row via a private `toRow()` function
- It inserts the row into the memories table via Drizzle
- It returns `Result<void>` on success or `Result` with `MemoryStoreError` on failure
- Raw Drizzle/pg errors are caught and wrapped in `MemoryStoreError`
- Duplicate UUID inserts (unique constraint violation) return `MemoryStoreError` — this is expected error handling, not a bug

### AC2: Store-Memory Use Case

**Given** the store-memory use case at `src/application/memory/store-memory.usecase.ts`
**When** `storeMemory(content, sourceType, tags?, linkedIds?, significance?)` is called
**Then:**
- It first calls `embeddingProvider.embed(content)` to generate the vector
- Then creates a `Memory` entity using `createMemoryEntity()` with the embedding, a generated UUID, and provided metadata
- Then calls `memoryStore.store()` with the complete Memory entity including the embedding
- The use case orchestrates embedding — the memory store adapter never calls the embedding provider
- If embedding fails, the error is returned without attempting to store
- If entity creation fails (validation), the error is returned without attempting to store

### AC3: updateSignificance()

**Given** an existing memory
**When** `updateSignificance(memoryId, newScore)` is called on the MemoryStore
**Then:**
- The significance field is updated in the database (FR7)
- `Result<void>` is returned
- If the memory doesn't exist, `MemoryStoreError` is returned
- newScore is validated (0.0-1.0 range inclusive) before the DB call — inline range check in the adapter, NOT via `createSignificance()` value object (VOs are for entity construction)

### AC4: updateTags() and linkMemories()

**Given** an existing memory
**When** `updateTags(memoryId, tags)` or `linkMemories(memoryId, linkedIds)` is called
**Then:**
- The `tags` or `linked_ids` arrays are updated in the database (FR8)
- `Result<void>` is returned
- If the memory doesn't exist, `MemoryStoreError` is returned
- Passing `[]` for tags clears all tags; passing `[]` for linkedIds clears all links — this is valid behavior

### AC5: Mapper Functions and Error Handling

**Given** all write operations
**When** inspecting the adapter code
**Then:**
- Every method uses explicit `toRow()` mapper function — no object spread
- All Drizzle calls are wrapped in try/catch returning `Result<T>`
- Raw pg/Drizzle errors are wrapped in `MemoryStoreError` with the original error message
- `SourceType` enum values (PascalCase: "Conversation", "Action", etc.) are stored as-is in the varchar column

### AC6: Container Integration

**Given** the MemoryStoreImpl
**When** the container is initialized
**Then:**
- `Container` interface includes `readonly memoryStore: MemoryStore`
- `MemoryStoreImpl` is instantiated in `createContainer()` with `deps.db` and `deps.logger`
- No changes to `InitDeps` — `db` and `logger` are already available
- Read operations not yet implemented by this story return `MemoryStoreError("Not implemented — see Story 2.4/2.5")`

### AC7: Port Extension — linkMemories

**Given** the MemoryStore port at `src/domain/ports/memory-store.interface.ts`
**When** inspecting the interface
**Then:**
- It includes `linkMemories(id: string, linkedIds: string[]): Promise<Result<void>>`
- This method is required by FR8 and referenced by Epic 5 (Memory Consolidator daemon)
- The port was missing this method — it must be added

## Tasks / Subtasks

- [x] Task 1: Add `linkMemories` to MemoryStore port interface (AC: #7)
  - [x] 1.1 Add `linkMemories(id: string, linkedIds: string[]): Promise<Result<void>>` to `src/domain/ports/memory-store.interface.ts`

- [x] Task 2: Create `memory-store.implementation.ts` — write operations (AC: #1, #3, #4, #5)
  - [x] 2.1 Create `src/infrastructure/database/memory-store.implementation.ts`
  - [x] 2.2 Implement `MemoryStoreImpl` class implementing `MemoryStore` interface
  - [x] 2.3 Constructor takes `db: DrizzleClient, logger: Logger` (architecture doc shows both; logger for observability on write failures)
  - [x] 2.4 Implement private `toRow(memory: Memory)` mapper — explicit field mapping, SourceType stored as string
  - [x] 2.5 Implement `store(memory)` — inserts via `db.insert(memories).values(toRow(memory))`, returns `Result<void>`
  - [x] 2.6 Implement `updateSignificance(id, significance)` — inline validates 0-1 range (not via VO), uses `db.update(memories).set({ significance }).where(eq(memories.id, id)).returning({ id: memories.id })`, checks returned array length
  - [x] 2.7 Implement `updateTags(id, tags)` — uses `db.update(memories).set({ tags }).where(eq(memories.id, id)).returning({ id: memories.id })`, checks returned array length
  - [x] 2.8 Implement `linkMemories(id, linkedIds)` — uses `db.update(memories).set({ linkedIds }).where(eq(memories.id, id)).returning({ id: memories.id })`, checks returned array length
  - [x] 2.9 Add stub implementations for read operations (queryBySimilarity, queryRecent, queryRandom, queryById, queryLinked, compositeQuery) returning `MemoryStoreError("Not implemented — see Story 2.4/2.5")`
  - [x] 2.10 All methods wrapped in try/catch, raw errors wrapped in `MemoryStoreError`

- [x] Task 3: Create `store-memory.usecase.ts` (AC: #2)
  - [x] 3.1 Create `src/application/memory/store-memory.usecase.ts`
  - [x] 3.2 Export `StoreMemoryUseCase` class with constructor `(embeddingProvider: EmbeddingProvider, memoryStore: MemoryStore)`
  - [x] 3.3 Implement `execute(content, sourceType, options?: { tags?, linkedIds?, significance? })` returning `Promise<Result<void>>`
  - [x] 3.4 Call `embeddingProvider.embed(content)` — return error if fails
  - [x] 3.5 Generate UUID via `crypto.randomUUID()`
  - [x] 3.6 Create Memory entity via `createMemoryEntity()` — return error if validation fails
  - [x] 3.7 Call `memoryStore.store(memory)` — return result

- [x] Task 4: Update barrel exports (AC: #5, #6)
  - [x] 4.1 Update `src/infrastructure/database/index.ts` to export `MemoryStoreImpl`
  - [x] 4.2 Update `src/application/memory/index.ts` to export `StoreMemoryUseCase`
  - [x] 4.3 Update `src/application/index.ts` if needed — not needed, no root barrel changes required

- [x] Task 5: Wire into Container (AC: #6)
  - [x] 5.1 Add `readonly memoryStore: MemoryStore` to `Container` interface
  - [x] 5.2 Import `MemoryStoreImpl` in `container.ts`
  - [x] 5.3 Instantiate `new MemoryStoreImpl(deps.db, deps.logger)` in `createContainer()`
  - [x] 5.4 No InitDeps changes — `db` and `logger` already available

- [x] Task 6: Write tests (AC: all)
  - [x] 6.1 Create `tests/infrastructure/database/memory-store.test.ts`
  - [x] 6.2 Test: `store()` calls `db.insert()` with correctly mapped row (verify toRow mapping)
  - [x] 6.3 Test: `store()` maps SourceType enum value to string correctly
  - [x] 6.4 Test: `store()` returns `MemoryStoreError` on Drizzle failure
  - [x] 6.5 Test: `updateSignificance()` updates significance field where id matches
  - [x] 6.6 Test: `updateSignificance()` returns `MemoryStoreError` when memory not found (0 rows affected)
  - [x] 6.7 Test: `updateTags()` updates tags array where id matches
  - [x] 6.8 Test: `linkMemories()` updates linkedIds array where id matches
  - [x] 6.9 Test: stub read methods return `MemoryStoreError`
  - [x] 6.9a Test: `updateSignificance()` with boundary values (0.0 and 1.0) succeeds
  - [x] 6.9b Test: `updateSignificance()` with out-of-range value returns `MemoryStoreError`
  - [x] 6.9c Test: `updateTags()` with empty array `[]` succeeds (clears tags)
  - [x] 6.9d Test: `linkMemories()` with empty array `[]` succeeds (clears links)
  - [x] 6.10 Create `tests/application/memory/store-memory.test.ts`
  - [x] 6.11 Test: `execute()` calls `embeddingProvider.embed()` with content
  - [x] 6.12 Test: `execute()` creates Memory entity with embedding result and passes to `memoryStore.store()`
  - [x] 6.13 Test: `execute()` returns embedding error if `embed()` fails (does NOT call store)
  - [x] 6.14 Test: `execute()` returns store error if `store()` fails
  - [x] 6.15 Test: `execute()` uses default significance (0.5) when not provided
  - [x] 6.16 Test: `execute()` passes tags, linkedIds, significance when provided
  - [x] 6.17 Update `tests/entry/container.test.ts` — verify Container includes memoryStore
  - [x] 6.18 Update `tests/entry/init.test.ts` — verify init returns Container with memoryStore
  - [x] 6.19 Update `tests/entry/shutdown.test.ts` — add memoryStore to mock container

- [x] Task 7: Validate and regression check (AC: all)
  - [x] 7.1 `bun run check` — biome lint/format passes
  - [x] 7.2 `bun run typecheck` — no type errors
  - [x] 7.3 `bun test` — 375 tests pass, 0 regressions (349 → 375, 26 new tests)

## Dev Notes

### Architecture Compliance

**Clean Architecture — Infrastructure Layer Database Module + Application Layer Memory Module:**

The MemoryStoreImpl lives in `src/infrastructure/database/`. It implements the `MemoryStore` port from `src/domain/ports/memory-store.interface.ts`. The store-memory use case lives in `src/application/memory/` and depends only on domain ports (EmbeddingProvider + MemoryStore), never on infrastructure implementations.

**Embedding flow — the use case orchestrates, not the adapter:**
```
store-memory.usecase.ts:
  content → embeddingProvider.embed(content) → vector
  content + vector + metadata → createMemoryEntity() → Memory
  Memory → memoryStore.store(memory) → Result<void>
```

The MemoryStore adapter receives memories with embeddings already computed. It never calls the embedding provider.

### File Changes

```
src/domain/ports/
├── memory-store.interface.ts       (MODIFY — add linkMemories method)

src/infrastructure/database/
├── memory-store.implementation.ts  (NEW — MemoryStoreImpl with write operations)
├── index.ts                        (MODIFY — export MemoryStoreImpl)

src/application/memory/
├── store-memory.usecase.ts         (NEW — StoreMemoryUseCase)
├── index.ts                        (MODIFY — export StoreMemoryUseCase)

src/entry/
├── container.ts                    (MODIFY — add memoryStore to Container)

tests/infrastructure/database/
└── memory-store.test.ts            (NEW)

tests/application/memory/
└── store-memory.test.ts            (NEW)

tests/entry/
├── container.test.ts               (MODIFY — add memoryStore mock)
├── init.test.ts                    (MODIFY — verify memoryStore in container)
└── shutdown.test.ts                (MODIFY — add memoryStore to mock container)
```

### Domain Contracts Already Exist

These files are **ALREADY IMPLEMENTED** — do NOT recreate or modify them (except the port extension in Task 1):

- `src/domain/ports/memory-store.interface.ts` — `MemoryStore` interface (extending with `linkMemories`)
- `src/domain/entities/memory.entity.ts` — `createMemoryEntity()` factory with full validation
- `src/domain/types/memory.type.ts` — `Memory` interface, `SourceType` enum, `RetrievalWeights`
- `src/domain/types/result.type.ts` — `Result<T>` discriminated union
- `src/domain/errors/domain.error.ts` — `MemoryStoreError extends NyxError { code = "MEMORY_STORE_ERROR" }`
- `src/domain/value-objects/embedding.value-object.ts` — `createEmbedding()`, `embeddingDimensions = 768`
- `src/domain/value-objects/significance.value-object.ts` — `createSignificance()`, validates 0-1 range
- `src/domain/value-objects/source-type.value-object.ts` — `SourceType` enum re-export
- `src/infrastructure/database/schema/memory.schema.ts` — Drizzle `memories` pgTable definition
- `src/infrastructure/database/database.config.ts` — `DrizzleClient` type, `connectDatabase()`

### Import Map

```typescript
// memory-store.implementation.ts imports:
import { eq } from "drizzle-orm";
import type { Logger } from "@nyx/domain/ports/index.ts";
import type { MemoryStore } from "@nyx/domain/ports/index.ts";
import type { Memory } from "@nyx/domain/types/memory.type.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";
import { MemoryStoreError } from "@nyx/domain/errors/domain.error.ts";
import type { DrizzleClient } from "./database.config.ts";
import { memories } from "./schema/index.ts";

// store-memory.usecase.ts imports:
import type { EmbeddingProvider } from "@nyx/domain/ports/index.ts";
import type { MemoryStore } from "@nyx/domain/ports/index.ts";
import type { SourceType } from "@nyx/domain/types/memory.type.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";
import { createMemoryEntity } from "@nyx/domain/entities/memory.entity.ts";

// container.ts adds:
import type { MemoryStore } from "@nyx/domain/ports/index.ts";
import { MemoryStoreImpl } from "@nyx/infrastructure/database/index.ts";

// Note on error types: StoreMemoryUseCase propagates errors as-is.
// embeddingProvider.embed() returns EmbeddingError, createMemoryEntity() returns ValidationError,
// memoryStore.store() returns MemoryStoreError. The use case does NOT re-wrap — consumers
// handle different error codes as needed.
```

### MemoryStoreImpl Design

```typescript
export class MemoryStoreImpl implements MemoryStore {
  constructor(
    private readonly db: DrizzleClient,
    private readonly logger: Logger,
  ) {}

  async store(memory: Memory): Promise<Result<void>> {
    try {
      await this.db.insert(memories).values(toRow(memory));
      return { ok: true, value: undefined };
    } catch (err) {
      return {
        ok: false,
        error: new MemoryStoreError(
          `Failed to store memory: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }
  }

  async updateSignificance(id: string, significance: number): Promise<Result<void>> {
    if (significance < 0 || significance > 1 || Number.isNaN(significance)) {
      return { ok: false, error: new MemoryStoreError(`Significance must be 0.0-1.0, got ${significance}`) };
    }
    try {
      const rows = await this.db
        .update(memories)
        .set({ significance })
        .where(eq(memories.id, id))
        .returning({ id: memories.id });
      if (rows.length === 0) {
        return { ok: false, error: new MemoryStoreError(`Memory not found: ${id}`) };
      }
      return { ok: true, value: undefined };
    } catch (err) {
      return {
        ok: false,
        error: new MemoryStoreError(
          `Failed to update significance: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }
  }

  // updateTags and linkMemories follow same .returning() pattern
}

function toRow(memory: Memory) {
  return {
    id: memory.id,
    content: memory.content,
    embedding: memory.embedding,  // VERIFY: Drizzle's vector() column may need string format — test empirically
    createdAt: memory.createdAt,
    sourceType: memory.sourceType as string,
    accessCount: memory.accessCount,
    lastAccessed: memory.lastAccessed,
    significance: memory.significance,
    tags: memory.tags,
    linkedIds: memory.linkedIds,
  };
}
```

### StoreMemoryUseCase Design

```typescript
export class StoreMemoryUseCase {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly memoryStore: MemoryStore,
  ) {}

  async execute(
    content: string,
    sourceType: SourceType,
    options?: {
      tags?: string[];
      linkedIds?: string[];
      significance?: number;
    },
  ): Promise<Result<void>> {
    const embedResult = await this.embeddingProvider.embed(content);
    if (!embedResult.ok) return embedResult;

    const memoryResult = createMemoryEntity({
      id: crypto.randomUUID(),
      content,
      embedding: embedResult.value,
      createdAt: new Date(),
      sourceType,
      accessCount: 0,
      lastAccessed: null,
      significance: options?.significance ?? 0.5,
      tags: options?.tags ?? [],
      linkedIds: options?.linkedIds ?? [],
    });
    if (!memoryResult.ok) return memoryResult;

    return this.memoryStore.store(memoryResult.value);
  }
}
```

### SourceType Mapping

The `SourceType` enum values are PascalCase strings:
```typescript
enum SourceType {
  Conversation = "Conversation",
  Action = "Action",
  Reflection = "Reflection",
  Observation = "Observation",
}
```

The DB column `source_type` is `VARCHAR(20)`. The `toRow()` mapper stores the enum string value directly (`memory.sourceType as string`). The `toDomain()` mapper (needed in Story 2.4 for reads) will validate the string against the enum.

### Drizzle Update "Not Found" Detection

Use `.returning({ id: memories.id })` on all update operations. This returns an array of updated rows. If `rows.length === 0`, the memory ID doesn't exist — return `MemoryStoreError("Memory not found")`. This approach is more reliable and portable than checking `rowCount` on the raw QueryResult, which may behave differently across Drizzle driver versions.

### CRITICAL: Drizzle Vector Column Insert Format

The `toRow()` mapper passes `memory.embedding` (a `number[]`) directly to the `vector(768)` column. **Verify empirically** that Drizzle's pgvector extension accepts `number[]` on insert. If it requires a string format (e.g., `"[0.1, 0.2, ...]"`), the `toRow()` mapper must convert. Test this FIRST during implementation — a 5-minute spike inserting a test vector saves hours of debugging. If conversion is needed:
```typescript
embedding: `[${memory.embedding.join(",")}]`,  // string format fallback
```

### Port Interface Gap: linkMemories

The `MemoryStore` port interface at `src/domain/ports/memory-store.interface.ts` is **missing** the `linkMemories` method. This method is:
- Required by the Story 2.3 AC ("updateTags(memoryId, tags) or linkMemories(memoryId, linkedIds)")
- Required by FR8 (Nyx can tag and link memories to other memories)
- Referenced by Epic 5 (Memory Consolidator daemon uses `memoryStore.updateTags/linkMemories`)

**Fix:** Add `linkMemories(id: string, linkedIds: string[]): Promise<Result<void>>` to the MemoryStore interface in Task 1.

### Stub Methods for Read Operations

The MemoryStore interface requires all methods to be implemented (TypeScript `implements` enforcement). Methods belonging to Story 2.4 and 2.5 will be stubbed:

```typescript
async queryBySimilarity(_embedding: number[], _limit: number): Promise<Result<Memory[]>> {
  return { ok: false, error: new MemoryStoreError("Not implemented — see Story 2.4") };
}
// Same pattern for queryRecent, queryRandom, queryById, queryLinked, compositeQuery
```

These stubs will be replaced with real implementations in Stories 2.4 and 2.5.

### Testing Strategy

**MemoryStore tests (`tests/infrastructure/database/memory-store.test.ts`):**
- Mock the Drizzle `db` object to test MemoryStoreImpl logic
- Verify `toRow()` correctly maps all Memory fields to row format
- Verify `store()` calls `db.insert().values()` with the mapped row
- Verify update methods call `db.update().set().where()` with correct params
- Verify error wrapping: mock db to throw, verify `MemoryStoreError` is returned
- Verify row count = 0 returns `MemoryStoreError("Memory not found")`

**Mock pattern for Drizzle db:**
```typescript
// Create chainable mock for Drizzle's fluent API
const mockInsert = mock(() => ({ values: mock(() => Promise.resolve()) }));
const mockUpdate = mock(() => ({
  set: mock(() => ({
    where: mock(() => Promise.resolve({ rowCount: 1 })),
  })),
}));
const mockDb = { insert: mockInsert, update: mockUpdate } as unknown as DrizzleClient;
```

**StoreMemoryUseCase tests (`tests/application/memory/store-memory.test.ts`):**
- Mock both `EmbeddingProvider` and `MemoryStore` ports
- Test happy path: embed succeeds, entity created, store called
- Test embed failure: error returned, store NOT called
- Test store failure: error returned
- Test default values: significance defaults to 0.5, tags/linkedIds default to []
- Test custom values: provided tags, linkedIds, significance are passed through

**Entry layer test updates:**
- `container.test.ts`: Verify `Container` includes `memoryStore` field
- `init.test.ts`: Verify `init()` returns Container with `memoryStore`
- `shutdown.test.ts`: Add `memoryStore` mock to satisfy `Container` type

### Project Structure Notes

- `memory-store.implementation.ts` follows the `.implementation.ts` naming convention
- Barrel export in `index.ts` follows existing pattern
- Container extension follows pattern from Story 2.2 (add field to Container, instantiate in createContainer)
- Application layer directory `src/application/memory/` already exists with empty barrel — populate it
- Use case class pattern with constructor injection for ports

### Previous Story Intelligence (Story 2.2)

**Key learnings to apply:**
- All files formatted with tabs, line width 100 (Biome enforced)
- 349 tests currently pass — must not regress
- Validation commands: `bun run check`, `bun run typecheck`, `bun test`
- `@nyx/*` path aliases configured in `tsconfig.json` — use for all cross-directory imports
- Import from barrel `index.ts` files, not individual files
- Biome required import reordering — external packages (`drizzle-orm`, `pg`) sort before `@nyx/*`
- `mock.module()` pattern established for mocking infrastructure modules in entry tests
- Biome flags non-null assertions — use `?? ""` fallbacks
- TypeScript strict mode with `noUncheckedIndexedAccess` — be explicit with type narrowing
- `FeatureExtractionPipeline` type needed `as unknown as` cast — similar casts may be needed for Drizzle mock types

**Code patterns established:**
- Container interface with readonly fields, extended per story
- InitDeps interface matches Container minus computed fields
- createContainer is pure synchronous wiring — no async, no side effects
- init() is sequential: config -> logger -> [resources] -> container
- Entry layer functions CAN throw — no Result<T> needed for init/createContainer
- Infrastructure implementations use `implements` on port interface

### Git Intelligence

Recent commits:
- `994fa40` — Add Drizzle DB, pgvector schema & migrations (Story 2.1)
- `522b013` — Implement entry layer: init, container, heartbeat (Story 1.6)
- `7744879` — Add seed directory and SkillRegistry impl (Story 1.5)

**Conventions:**
- Commit messages are imperative, concise
- Each story produces a focused commit

### What This Story Does NOT Include

- No query/read operations (Story 2.4 — queryBySimilarity, queryRecent, queryRandom, queryById, queryLinked)
- No composite weighted retrieval (Story 2.5 — compositeQuery)
- No `toDomain()` mapper (needed for reads in Story 2.4, not for writes)
- No `search_query:` prefix handling (Story 2.4 — retrieval embedding uses different prefix)
- No integration tests against real PostgreSQL (unit tests with mocked Drizzle only)
- No shutdown logic — MemoryStoreImpl has no connection to close (db pool owned by init)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Embedding Flow] — use case orchestrates embedding, not adapter
- [Source: _bmad-output/planning-artifacts/architecture.md#Drizzle-to-domain mapping] — toRow/toDomain pattern, explicit field mapping, no object spread
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Pattern] — Result<T>, MemoryStoreError, infrastructure catches raw errors
- [Source: _bmad-output/planning-artifacts/architecture.md#Dependency Injection Pattern] — class-based constructor injection, container.ts pure wiring
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — src/infrastructure/database/memory-store.implementation.ts, src/application/memory/store-memory.usecase.ts
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — AC, user story, FR1/FR7/FR8
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Read operations reference (stub context)
- [Source: _bmad-output/planning-artifacts/prd.md#FR1] — Store memories with full metadata
- [Source: _bmad-output/planning-artifacts/prd.md#FR7] — Assign and update significance scores
- [Source: _bmad-output/planning-artifacts/prd.md#FR8] — Tag and link memories
- [Source: _bmad-output/implementation-artifacts/2-2-embedding-provider.md] — Previous story: EmbeddingProvider pattern, Container wiring, testing approach, 349 test baseline

## Senior Developer Review (AI)

**Review Date:** 2026-03-14
**Review Outcome:** Approved
**Total Action Items:** 0 (0 Critical, 0 High, 0 Medium, 4 Low — no action required)

### Notes

- All 7 ACs fully implemented and verified against code
- All 7 tasks / 37 subtasks marked [x] confirmed as actually done
- Git file changes match story File List — no discrepancies
- 4 LOW issues noted: missing not-found tests for updateTags/linkMemories (covered by identical pattern in updateSignificance), missing Drizzle error tests for update methods, missing logger assertion on error, two import statements from same barrel in container.ts
- Code is clean, architecture-compliant, well-structured
- 375 tests pass, 0 regressions from 349 baseline

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome auto-fixed import ordering: `@nyx/*` domain imports sorted alphabetically, `drizzle-orm` moved after domain imports
- Biome auto-fixed formatting: function signatures reformatted for line width 100
- TypeScript strict mode `noUncheckedIndexedAccess` prevented direct `mock.calls[0]?.[0]` access — used closure capture pattern instead (capturedRow/capturedSet/capturedMemory variables)

### Completion Notes List

- Added `linkMemories(id, linkedIds)` to MemoryStore port interface — was missing for FR8
- Created MemoryStoreImpl with 4 write operations (store, updateSignificance, updateTags, linkMemories) + 6 read stubs
- Constructor takes `(db: DrizzleClient, logger: Logger)` per architecture doc
- All write methods use `.returning({ id: memories.id })` for "not found" detection
- `updateSignificance` does inline 0-1 range validation (not via value object)
- `toRow()` maps domain Memory to DB row with explicit field mapping, SourceType stored as PascalCase string
- All errors wrapped in MemoryStoreError with original error message, logged via logger
- Created StoreMemoryUseCase with `execute()` method — orchestrates embed → createMemoryEntity → store
- UUID generation via `crypto.randomUUID()`, defaults: significance=0.5, tags=[], linkedIds=[]
- Extended Container with `memoryStore: MemoryStore`, wired MemoryStoreImpl in createContainer
- 26 new tests across 2 new test files + 3 updated test files, 375 total pass, 0 regressions
- All validation gates pass: check, typecheck, test

### Change Log

- 2026-03-14: Story 2.3 implemented — MemoryStoreImpl (write ops), StoreMemoryUseCase, Container wiring. 26 new tests, 375 total pass, 0 regressions.

### File List

New files:
- src/infrastructure/database/memory-store.implementation.ts
- src/application/memory/store-memory.usecase.ts
- tests/infrastructure/database/memory-store.test.ts
- tests/application/memory/store-memory.test.ts

Modified files:
- src/domain/ports/memory-store.interface.ts (added linkMemories method)
- src/infrastructure/database/index.ts (export MemoryStoreImpl)
- src/application/memory/index.ts (export StoreMemoryUseCase)
- src/entry/container.ts (added memoryStore to Container, MemoryStoreImpl wiring)
- tests/entry/container.test.ts (added memoryStore verification + MemoryStoreImpl instanceof check)
- tests/entry/init.test.ts (added memoryStore verification)
- tests/entry/shutdown.test.ts (added memoryStore to mock container)
