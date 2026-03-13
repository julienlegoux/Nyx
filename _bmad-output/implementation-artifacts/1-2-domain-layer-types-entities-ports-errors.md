# Story 1.2: Domain Layer — Types, Entities, Ports & Errors

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want all domain types, entities, value objects, port interfaces, and error classes defined,
so that all layers have a shared contract to implement against.

## Acceptance Criteria

1. **Given** the domain types directory (`src/domain/types/`)
   **When** inspecting its contents
   **Then** `memory.type.ts` defines `Memory` (id: string, content: string, embedding: number[], createdAt: Date, sourceType: SourceType, accessCount: number, lastAccessed: Date | null, significance: number, tags: string[], linkedIds: string[]), `SourceType` (Conversation | Action | Reflection | Observation), `Significance` (number 0-1), `RetrievalWeights` (similarity: number, significance: number, recency: number — all floats summing to 1.0)
   **And** `signal.type.ts` defines `WakeSignal` (source: string, reason: string, urgency: "low" | "medium" | "high", relatedMemories: string[], createdAt: string) and `TelegramQueueItem` (chatId: number, messageId: number, text: string, from: string, receivedAt: string)
   **And** `session.type.ts` defines `SessionType` enum (DaemonConsolidator, DaemonPatternDetector, Consciousness) and `SessionConfig` (type: SessionType, model: string, systemPrompt: string, tools: unknown[] — intentional: Agent SDK tool shape unknown at domain level, narrowed in Story 3.3, maxTurns: number | null)
   **And** `skill.type.ts` defines `Skill` (name: string, description: string, type: SkillType, path: string, status: SkillStatus), `SkillType` enum (System, Self, Proto), `SkillStatus` enum (Active, Draft)
   **And** `result.type.ts` defines `Result<T>` as `{ ok: true; value: T } | { ok: false; error: NyxError }`

2. **Given** the domain entities directory (`src/domain/entities/`)
   **When** inspecting its contents
   **Then** `memory.entity.ts` defines the `Memory` entity with all fields from the memory table schema: id (UUID string), content (text), embedding (768-dimension number[]), createdAt (Date), sourceType (SourceType), accessCount (number), lastAccessed (Date | null), significance (number 0-1), tags (string[]), linkedIds (UUID string[])
   **And** `signal.entity.ts` exists exporting `WakeSignalEntity` and `TelegramQueueItemEntity` with domain representations matching the type definitions
   **And** `skill.entity.ts` exists exporting `SkillEntity` with name, description, type, path, status, and content (the loaded skill markdown)
   **And** `session.entity.ts` exists exporting `SessionEntity` with type, config, startedAt, trigger context
   **And** `identity.entity.ts` exists exporting `IdentityEntity` with raw markdown content and parsed retrieval weights

3. **Given** the domain value-objects directory (`src/domain/value-objects/`)
   **When** inspecting its contents
   **Then** `embedding.value-object.ts` defines `Embedding` with creation validation enforcing exactly 768 dimensions
   **And** `significance.value-object.ts` defines `Significance` with creation validation enforcing 0.0-1.0 range (inclusive)
   **And** `source-type.value-object.ts` defines `SourceType` enum with PascalCase members: `Conversation`, `Action`, `Reflection`, `Observation`
   **And** `retrieval-weights.value-object.ts` defines `RetrievalWeights` with creation validation enforcing three positive floats summing to 1.0
   **And** `session-type.value-object.ts` defines `SessionType` enum with members: `DaemonConsolidator`, `DaemonPatternDetector`, `Consciousness`

4. **Given** the domain ports directory (`src/domain/ports/`)
   **When** inspecting its contents
   **Then** `memory-store.interface.ts` defines `MemoryStore` port with methods returning `Result<T>`: `store(memory: Memory): Promise<Result<void>>`, `queryBySimilarity(embedding: number[], limit: number): Promise<Result<Memory[]>>`, `queryRecent(limit: number): Promise<Result<Memory[]>>`, `queryRandom(): Promise<Result<Memory | null>>`, `queryById(id: string): Promise<Result<Memory | null>>`, `queryLinked(memoryId: string): Promise<Result<Memory[]>>`, `updateSignificance(id: string, significance: number): Promise<Result<void>>`, `updateTags(id: string, tags: string[]): Promise<Result<void>>`, `compositeQuery(embedding: number[], weights: RetrievalWeights, limit: number): Promise<Result<Memory[]>>`
   **And** `signal-bus.interface.ts` defines `SignalBus` port with: `readWakeSignals(): Promise<Result<WakeSignal[]>>`, `consumeWakeSignal(filename: string): Promise<Result<void>>`, `readTelegramQueue(): Promise<Result<TelegramQueueItem[]>>`, `consumeTelegramItem(filename: string): Promise<Result<void>>`, `writeWakeSignal(signal: WakeSignal): Promise<Result<void>>`
   **And** `skill-registry.interface.ts` defines `SkillRegistry` port with: `listSkills(): Promise<Result<Skill[]>>`, `loadSkill(path: string): Promise<Result<string>>`, `registerSkill(skill: Skill): Promise<Result<void>>`, `updateSkillStatus(name: string, status: SkillStatus): Promise<Result<void>>`
   **And** `identity-store.interface.ts` defines `IdentityStore` port with: `read(): Promise<Result<string>>`, `write(content: string): Promise<Result<void>>`
   **And** `session-manager.interface.ts` defines `SessionManager` port with: `spawnDaemon(type: SessionType, config: SessionConfig): Promise<Result<void>>`, `spawnConsciousness(config: SessionConfig, triggerContext: string): Promise<Result<void>>`, `isConsciousnessActive(): Promise<Result<boolean>>`
   **And** `messenger.interface.ts` defines `Messenger` port with: `sendMessage(chatId: number, text: string): Promise<Result<void>>`
   **And** `embedding-provider.interface.ts` defines `EmbeddingProvider` port with: `embed(content: string): Promise<Result<number[]>>`
   **And** `logger.interface.ts` defines `Logger` port with: `info(message: string, data?: Record<string, unknown>): void`, `warn(message: string, data?: Record<string, unknown>): void`, `error(message: string, data?: Record<string, unknown>): void`, `debug(message: string, data?: Record<string, unknown>): void`, `child(source: string): Logger`
   **And** all port methods (except Logger) return `Result<T>` — never throw

5. **Given** the domain errors directory (`src/domain/errors/`)
   **When** inspecting its contents
   **Then** `domain.error.ts` defines abstract `NyxError` extending `Error` with `abstract readonly code: string`
   **And** concrete error classes exist: `ValidationError` (code: "VALIDATION_ERROR"), `MemoryStoreError` (code: "MEMORY_STORE_ERROR"), `SignalBusError` (code: "SIGNAL_BUS_ERROR"), `SkillRegistryError` (code: "SKILL_REGISTRY_ERROR"), `IdentityStoreError` (code: "IDENTITY_STORE_ERROR"), `SessionManagerError` (code: "SESSION_MANAGER_ERROR"), `MessengerError` (code: "MESSENGER_ERROR"), `EmbeddingError` (code: "EMBEDDING_ERROR"), `ConfigError` (code: "CONFIG_ERROR")

6. **Given** all domain code
   **When** checking imports
   **Then** no file in `src/domain/` imports from `src/application/`, `src/infrastructure/`, or `src/entry/`
   **And** domain layer has zero external package dependencies (only TypeScript built-ins)

## Tasks / Subtasks

- [x] Task 1: Create domain type definitions (AC: #1)
  - [x] 1.1 Create `src/domain/types/memory.type.ts` — Memory interface, SourceType, Significance, RetrievalWeights
  - [x] 1.2 Create `src/domain/types/signal.type.ts` — WakeSignal, TelegramQueueItem
  - [x] 1.3 Create `src/domain/types/session.type.ts` — SessionType, SessionConfig
  - [x] 1.4 Create `src/domain/types/skill.type.ts` — Skill, SkillType, SkillStatus
  - [x] 1.5 Create `src/domain/types/result.type.ts` — Result<T>
  - [x] 1.6 Update `src/domain/types/index.ts` barrel to re-export all types

- [x] Task 2: Create domain entities (AC: #2)
  - [x] 2.1 Create `src/domain/entities/memory.entity.ts` — Memory entity
  - [x] 2.2 Create `src/domain/entities/signal.entity.ts` — WakeSignalEntity, TelegramQueueItemEntity
  - [x] 2.3 Create `src/domain/entities/skill.entity.ts` — SkillEntity
  - [x] 2.4 Create `src/domain/entities/session.entity.ts` — SessionEntity
  - [x] 2.5 Create `src/domain/entities/identity.entity.ts` — IdentityEntity
  - [x] 2.6 Update `src/domain/entities/index.ts` barrel

- [x] Task 3: Create domain value objects (AC: #3)
  - [x] 3.1 Create `src/domain/value-objects/embedding.value-object.ts` — Embedding with 768-dim validation
  - [x] 3.2 Create `src/domain/value-objects/significance.value-object.ts` — Significance with 0-1 range validation
  - [x] 3.3 Create `src/domain/value-objects/source-type.value-object.ts` — SourceType enum
  - [x] 3.4 Create `src/domain/value-objects/retrieval-weights.value-object.ts` — RetrievalWeights with sum-to-1 validation
  - [x] 3.5 Create `src/domain/value-objects/session-type.value-object.ts` — SessionType enum
  - [x] 3.6 Update `src/domain/value-objects/index.ts` barrel

- [x] Task 4: Create domain port interfaces (AC: #4)
  - [x] 4.1 Create `src/domain/ports/memory-store.interface.ts` — MemoryStore port
  - [x] 4.2 Create `src/domain/ports/signal-bus.interface.ts` — SignalBus port
  - [x] 4.3 Create `src/domain/ports/skill-registry.interface.ts` — SkillRegistry port
  - [x] 4.4 Create `src/domain/ports/identity-store.interface.ts` — IdentityStore port
  - [x] 4.5 Create `src/domain/ports/session-manager.interface.ts` — SessionManager port
  - [x] 4.6 Create `src/domain/ports/messenger.interface.ts` — Messenger port
  - [x] 4.7 Create `src/domain/ports/embedding-provider.interface.ts` — EmbeddingProvider port
  - [x] 4.8 Create `src/domain/ports/logger.interface.ts` — Logger port
  - [x] 4.9 Update `src/domain/ports/index.ts` barrel

- [x] Task 5: Create domain error classes (AC: #5)
  - [x] 5.1 Create `src/domain/errors/domain.error.ts` — NyxError base + ValidationError + all 8 adapter-specific concrete errors
  - [x] 5.2 Update `src/domain/errors/index.ts` barrel

- [x] Task 6: Update domain barrel (AC: #6)
  - [x] 6.1 Update `src/domain/index.ts` to re-export from types, entities, value-objects, ports, errors

- [x] Task 7: Write tests (AC: #1-6)
  - [x] 7.1 Create `tests/domain/value-objects/embedding.test.ts` — 768-dim validation
  - [x] 7.2 Create `tests/domain/value-objects/significance.test.ts` — 0-1 range validation
  - [x] 7.3 Create `tests/domain/value-objects/retrieval-weights.test.ts` — sum-to-1 validation
  - [x] 7.4 Create `tests/domain/entities/memory.test.ts` — Memory entity creation
  - [x] 7.5 Create `tests/domain/errors/domain-error.test.ts` — NyxError hierarchy
  - [x] 7.6 Verify no imports from application/infrastructure/entry in domain files
  - [x] 7.7 Run biome check and TypeScript typecheck

### Review Follow-ups — Round 1 (AI)

- [x] [AI-Review][HIGH] NaN bypasses all numeric validation in value objects and entity factories — add `Number.isNaN()` guards [src/domain/value-objects/significance.value-object.ts:9] [src/domain/value-objects/retrieval-weights.value-object.ts:14] [src/domain/entities/memory.entity.ts:30]
- [x] [AI-Review][HIGH] Dual `Significance` type naming collision — `types/memory.type.ts:8` defines `Significance = number`, `value-objects/significance.value-object.ts:4` defines `Significance = { readonly value: number }` — rename one to resolve ambiguity
- [x] [AI-Review][MEDIUM] Import isolation test allows `node:` built-ins in domain source files, violating "zero external dependencies" rule — remove or narrow the `node:` exception [tests/domain/import-isolation.test.ts:51]
- [x] [AI-Review][MEDIUM] Signal/skill/session/identity entities lack factory functions despite dev notes specifying "creation factories" — add factories or document rationale [src/domain/entities/signal.entity.ts] [src/domain/entities/skill.entity.ts] [src/domain/entities/session.entity.ts] [src/domain/entities/identity.entity.ts]
- [x] [AI-Review][LOW] Add NaN/Infinity test cases for all value object factories and entity factories [tests/domain/value-objects/] [tests/domain/entities/]
- [x] [AI-Review][LOW] Embedding value object doesn't defensively copy input array — caller retains mutable reference [src/domain/value-objects/embedding.value-object.ts:20]
- [x] [AI-Review][LOW] MemoryEntity doesn't validate UUID format for `id` field [src/domain/entities/memory.entity.ts:9]

### Review Follow-ups — Round 2 (AI)

- [x] [AI-Review][HIGH] Embedding value object doesn't validate NaN/Infinity in individual element values — can corrupt vector similarity operations [src/domain/value-objects/embedding.value-object.ts:10]
- [x] [AI-Review][MEDIUM] MemoryEntity doesn't validate `accessCount >= 0` — negative access count is a domain invariant violation [src/domain/entities/memory.entity.ts]
- [x] [AI-Review][MEDIUM] MemoryEntity doesn't validate `linkedIds` entries as UUIDs — inconsistent with `id` validation [src/domain/entities/memory.entity.ts]
- [x] [AI-Review][MEDIUM] MemoryEntity doesn't defensively copy mutable arrays (embedding, tags, linkedIds) — entity mutability [src/domain/entities/memory.entity.ts:47]
- [x] [AI-Review][MEDIUM] Entity factories for signal/skill/session/identity perform zero validation — hollow factories give false safety guarantees [src/domain/entities/]
- [x] [AI-Review][LOW] Duplicated `embeddingDimensions = 768` constant in embedding.value-object.ts and memory.entity.ts — divergence risk
- [x] [AI-Review][LOW] Cross-platform path handling in import-isolation test only works on Windows [tests/domain/import-isolation.test.ts:36]
- [x] [AI-Review][LOW] Infinity rejection in createRetrievalWeights gives misleading "sum to 1.0" error message [src/domain/value-objects/retrieval-weights.value-object.ts:29]

### Review Follow-ups — Round 3 (AI)

- [x] [AI-Review][HIGH] Signal entity factories return raw `params` without defensively copying `relatedMemories` array — callers retain mutable reference, violating immutability pattern established in MemoryEntity [src/domain/entities/signal.entity.ts:23,36]
- [x] [AI-Review][HIGH] Session entity factory returns raw `params` without defensively copying mutable `config` object (contains `tools: unknown[]` array) [src/domain/entities/session.entity.ts:27]
- [x] [AI-Review][HIGH] `createTelegramQueueItemEntity` text validation `(!params.text && params.text !== "")` is dead code — can never be true for a `string` type under strict TS; provides false safety [src/domain/entities/signal.entity.ts:29]
- [x] [AI-Review][MEDIUM] Severe test coverage imbalance: SessionEntity has 2 tests, SkillEntity has 3, vs MemoryEntity's 16 — weakest validation + weakest tests = maximum blind spots [tests/domain/entities/session.test.ts] [tests/domain/entities/skill.test.ts]
- [x] [AI-Review][MEDIUM] SkillEntity factory ignores `description` and `content` validation — accepts empty strings for fields that must be meaningful [src/domain/entities/skill.entity.ts:22-33]
- [x] [AI-Review][MEDIUM] IdentityEntity factory doesn't validate `rawContent` — accepts empty string for identity markdown content [src/domain/entities/identity.entity.ts:39]
- [x] [AI-Review][MEDIUM] Inconsistent temporal types: `Memory.createdAt` is `Date`, `WakeSignal.createdAt` and `TelegramQueueItem.receivedAt` are `string` — forces adapters to handle both representations [src/domain/types/memory.type.ts:18] [src/domain/types/signal.type.ts:6,14]
- [x] [AI-Review][LOW] WakeSignal test uses non-UUID `"mem-1"` for relatedMemories — should use realistic UUID values [tests/domain/entities/signal.test.ts:13]
- [x] [AI-Review][LOW] SessionEntity and SkillEntity return raw input object by reference — mutations to input after creation silently mutate the entity [src/domain/entities/session.entity.ts:27] [src/domain/entities/skill.entity.ts:35]
- [x] [AI-Review][LOW] IdentityEntity returns params directly without copying `retrievalWeights` object — inconsistent with MemoryEntity pattern [src/domain/entities/identity.entity.ts:39]

### Review Follow-ups — Round 4 (AI)

- [x] [AI-Review][HIGH] `Date` objects not defensively copied in SessionEntity (`startedAt`) and MemoryEntity (`createdAt`, `lastAccessed`) — mutable reference leaks [src/domain/entities/session.entity.ts:30] [src/domain/entities/memory.entity.ts:67]
- [x] [AI-Review][MEDIUM] SessionEntity factory missing validation for `triggerContext`, `config.model`, `config.systemPrompt` — shallowest validation of all entities [src/domain/entities/session.entity.ts:12-36]
- [x] [AI-Review][MEDIUM] TelegramQueueItemEntity accepts NaN/Infinity/negative for `chatId` and `messageId` — inconsistent with MemoryEntity numeric guards [src/domain/entities/signal.entity.ts:32-43]
- [x] [AI-Review][LOW] SessionEntity test asserts `.toBe(now)` confirming Date reference leak — changed to `.toEqual()` [tests/domain/entities/session.test.ts:25]
- [x] [AI-Review][LOW] WakeSignalEntity `relatedMemories` entries not validated as UUIDs — inconsistent with MemoryEntity `linkedIds` validation [src/domain/entities/signal.entity.ts:23-29]
- [x] [AI-Review][LOW] SessionEntity `tools` array shallow-copied — tool objects remain shared (acceptable: shape deferred to Story 3.3) [src/domain/entities/session.entity.ts:33]

### Review Follow-ups — Round 5 (AI)

- [x] [AI-Review][HIGH] Biome check fails with 3 errors (2 format, 1 lint) — Task 7.7 partial false claim. Fixed formatting in memory.entity.ts and signal.entity.ts, fixed noNonNullAssertion lint in memory.test.ts [src/domain/entities/memory.entity.ts:69] [src/domain/entities/signal.entity.ts:29] [tests/domain/entities/memory.test.ts:228]
- [x] [AI-Review][HIGH] MemoryEntity embedding elements not validated for NaN/Infinity — entity validates dimension count but not individual values, bypassing Embedding VO's `Number.isFinite()` check. Added per-element validation loop [src/domain/entities/memory.entity.ts:36-44]
- [x] [AI-Review][MEDIUM] `embeddingDimensions` not re-exported from domain barrel — forces consumers to import from internal path [src/domain/index.ts:33]
- [x] [AI-Review][MEDIUM] Signal entity temporal fields accept empty strings — `createdAt` and `receivedAt` not validated as non-empty, inconsistent with source/reason/from validation [src/domain/entities/signal.entity.ts]
- [x] [AI-Review][MEDIUM] SessionEntity `config.maxTurns` not validated when non-null — NaN, negative, float, Infinity all pass. Added positive integer validation [src/domain/entities/session.entity.ts:47-55]

## Dev Notes

### Architecture Compliance

**Clean Architecture — Domain is the innermost layer with ZERO dependencies:**

```
Entry → Application → Domain ← Infrastructure
                         ^            |
                         └────────────┘
                     (implements ports)
```

**Critical rules for this story:**
- `src/domain/` imports NOTHING from `@nyx/application`, `@nyx/infrastructure`, or `@nyx/entry`
- Zero external package dependencies — only TypeScript built-ins
- All exports go through barrel `index.ts` files
- Types defined in `src/domain/types/` are the canonical shapes — infrastructure adapters convert to/from these
- Port interfaces define contracts; infrastructure implements them

### Type System Rules

- **No `any`** — ever. Use specific types or generics.
- **No unnecessary `as` casts** — fix the types instead.
- **No `unknown` without immediate narrowing** — exception: `SessionConfig.tools: unknown[]` is an intentional domain-level placeholder. Add `// TODO: Narrow to Agent SDK tool type in Story 3.3` comment.
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` are enforced.
- All types centralized in `src/domain/types/*.type.ts`.

### File Naming Convention

| Suffix | Example |
|--------|---------|
| `.type.ts` | `memory.type.ts` |
| `.entity.ts` | `memory.entity.ts` |
| `.value-object.ts` | `significance.value-object.ts` |
| `.interface.ts` | `memory-store.interface.ts` |
| `.error.ts` | `domain.error.ts` |
| `.test.ts` | `significance.test.ts` |

### Code Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Variables / functions | `camelCase` | `createMemory`, `isValid` |
| Constants | `camelCase` | `defaultSignificance`, `embeddingDimensions` |
| Types / interfaces | `PascalCase` | `MemoryStore`, `WakeSignal` |
| Enums | `PascalCase` name + members | `SourceType.Reflection` |

### Result<T> Pattern

Every port method returns `Result<T>` — never throws. Infrastructure adapters catch raw errors and wrap in domain error classes.

```typescript
type Result<T> = { ok: true; value: T } | { ok: false; error: NyxError };
```

Usage pattern:
```typescript
// Port method signature
store(memory: Memory): Promise<Result<void>>;

// Consumer pattern (in application layer later)
const result = await memoryStore.store(memory);
if (!result.ok) { logger.error(result.error.message); return; }
```

### Error Handling Pattern

```typescript
abstract class NyxError extends Error {
  abstract readonly code: string;
}

// Generic validation error — used by value object factory functions
class ValidationError extends NyxError {
  readonly code = "VALIDATION_ERROR";
}

// Adapter-specific errors — used by infrastructure implementations
class MemoryStoreError extends NyxError {
  readonly code = "MEMORY_STORE_ERROR";
}
```

Each concrete error takes a `message` string via `super(message)` and has a fixed `code` for programmatic identification. `ValidationError` is used by value object factories (Embedding, Significance, RetrievalWeights). Adapter-specific errors are used by infrastructure port implementations.

### Value Object Design

Value objects are immutable types with creation-time validation. Use factory functions (not constructors) that return `Result<T>` to enforce invariants:

```typescript
// Example pattern for value objects
function createSignificance(value: number): Result<Significance> {
  if (value < 0 || value > 1) {
    return { ok: false, error: new ValidationError("Significance must be 0-1") };
  }
  return { ok: true, value: { value } as Significance };
}
```

For enums (`SourceType`, `SessionType`, `SkillType`, `SkillStatus`), use TypeScript `enum` with PascalCase members — no validation factory needed.

### Entity vs Type vs Value Object Distinction

- **Types** (`*.type.ts`): Plain TypeScript interfaces/types. Data shape definitions. No behavior, no validation.
- **Value Objects** (`*.value-object.ts`): Immutable, validated wrappers. Enforce domain invariants (e.g., Significance is 0-1, Embedding is 768-dim). Creation through factory functions returning `Result<T>`.
- **Entities** (`*.entity.ts`): Domain objects with identity. May combine types and value objects. Represent core domain concepts with creation factories.

### Port Interface Design

Ports are TypeScript `interface` definitions. They define the contract that infrastructure adapters must implement.

```typescript
// src/domain/ports/memory-store.interface.ts
export interface MemoryStore {
  store(memory: Memory): Promise<Result<void>>;
  queryBySimilarity(embedding: number[], limit: number): Promise<Result<Memory[]>>;
  // ... etc
}
```

**Rules:**
- Export as `export interface` (not `export type` — interfaces allow `implements`)
- All async methods return `Promise<Result<T>>`
- Exception: `Logger` methods are synchronous and return `void` (logging must never fail the caller)
- Use domain types in signatures — never infrastructure types

### Barrel Export Pattern

```typescript
// src/domain/ports/index.ts
export { type MemoryStore } from "./memory-store.interface.ts";
export { type SignalBus } from "./signal-bus.interface.ts";
// ... etc
```

Use `export { type X }` for interfaces and types — enables proper tree-shaking and makes the export intent clear. Use `export { X }` (no `type` keyword) for enums, error classes, and factory functions — these are runtime values, not just types.

### Memory Schema Field Reference

From the architecture's SQL schema — these are the canonical fields the `Memory` type and entity must include:

| Field | SQL Type | TS Type | Notes |
|-------|----------|---------|-------|
| id | UUID | string | Primary key, gen_random_uuid() in DB |
| content | TEXT | string | The memory content |
| embedding | VECTOR(768) | number[] | 768-dim vector from nomic-embed-text-v1.5 |
| created_at | TIMESTAMPTZ | Date | When memory was stored |
| source_type | VARCHAR(20) | SourceType | conversation, action, reflection, observation |
| access_count | INTEGER | number | How many times recalled, default 0 |
| last_accessed | TIMESTAMPTZ | Date \| null | Nullable — null until first recall |
| significance | FLOAT | number | Nyx-assigned, 0.0-1.0, default 0.5 |
| tags | TEXT[] | string[] | User-defined tags |
| linked_ids | UUID[] | string[] | References to related memories |

### What This Story Does NOT Include

- No infrastructure implementations (adapters come in later stories)
- No Drizzle schema (Story 2.1 — database layer)
- No use cases (Story 2.3, 2.4 — memory operations)
- No configuration loading (Story 1.3)
- No Docker setup (Story 1.4)
- No actual behavior — only contracts and data shapes
- No Zod schemas — domain types are pure TypeScript (Zod parsing happens at infrastructure boundaries in later stories)

### Previous Story Intelligence (Story 1.1)

**Learnings to apply:**
- Barrel `index.ts` files must be non-empty (not just `// barrel export`). Story 1.1 review caught this — populate with actual exports.
- Biome formats with tabs, line width 100. Run `bun run format` after creating files to ensure compliance.
- TypeScript `strict: true` with `exactOptionalPropertyTypes` means you must use explicit `undefined` in optional property types. E.g., `lastAccessed: Date | undefined` not just `lastAccessed?: Date` if the property is always present but nullable.
- Windows environment — `.gitattributes` enforces LF. No CRLF issues expected but verify.
- Tests use `bun:test` with `describe`/`it`/`expect` API.
- Test file location: `tests/domain/` mirroring `src/domain/` structure.

**Code patterns established:**
- All stubs are 0-byte or minimal — this story replaces the empty barrels with real content
- `@nyx/*` path aliases work and are tested
- `bun run check`, `bun run typecheck`, `bun test` are the validation commands

**Debug issues to avoid:**
- Biome may reformat imports — run format before committing
- Ensure all files end with a newline (biome enforces this)

### Project Structure Notes

Files to create/modify in this story:

```
src/domain/
├── types/
│   ├── memory.type.ts          (NEW)
│   ├── signal.type.ts          (NEW)
│   ├── session.type.ts         (NEW)
│   ├── skill.type.ts           (NEW)
│   ├── result.type.ts          (NEW)
│   └── index.ts                (MODIFY — add re-exports)
├── entities/
│   ├── memory.entity.ts        (NEW)
│   ├── signal.entity.ts        (NEW)
│   ├── skill.entity.ts         (NEW)
│   ├── session.entity.ts       (NEW)
│   ├── identity.entity.ts      (NEW)
│   └── index.ts                (MODIFY — add re-exports)
├── value-objects/
│   ├── embedding.value-object.ts       (NEW)
│   ├── significance.value-object.ts    (NEW)
│   ├── source-type.value-object.ts     (NEW)
│   ├── retrieval-weights.value-object.ts (NEW)
│   ├── session-type.value-object.ts    (NEW)
│   └── index.ts                (MODIFY — add re-exports)
├── ports/
│   ├── memory-store.interface.ts       (NEW)
│   ├── signal-bus.interface.ts         (NEW)
│   ├── skill-registry.interface.ts     (NEW)
│   ├── identity-store.interface.ts     (NEW)
│   ├── session-manager.interface.ts    (NEW)
│   ├── messenger.interface.ts          (NEW)
│   ├── embedding-provider.interface.ts (NEW)
│   ├── logger.interface.ts             (NEW)
│   └── index.ts                (MODIFY — add re-exports)
├── errors/
│   ├── domain.error.ts         (NEW)
│   └── index.ts                (MODIFY — add re-exports)
└── index.ts                    (MODIFY — add re-exports)

tests/domain/
├── entities/
│   └── memory.test.ts          (NEW)
├── value-objects/
│   ├── embedding.test.ts       (NEW)
│   ├── significance.test.ts    (NEW)
│   └── retrieval-weights.test.ts (NEW)
└── errors/
    └── domain-error.test.ts    (NEW)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Type System Rules] — No any, centralized types, strict mode
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Pattern] — NyxError + Result<T> pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Import Patterns] — Barrel exports with index.ts
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture > Memory Table Schema] — Canonical memory field definitions
- [Source: _bmad-output/planning-artifacts/architecture.md#Signal & IPC Architecture] — WakeSignal, TelegramQueueItem definitions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Complete directory tree with all domain files
- [Source: _bmad-output/planning-artifacts/architecture.md#Centralization Principle] — Types in domain, adapter types in infrastructure
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — 10 rules all agents must follow
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements] — FR1-FR50 coverage
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffold-typescript-foundation.md] — Previous story patterns and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Added `allowImportingTsExtensions: true` to tsconfig.json — required because Dev Notes barrel pattern uses `.ts` extensions and project has `noEmit: true`
- Biome auto-fixed import sorting and `useExportType` style (changed `export { type X }` to `export type { X }` where all exports are type-only)

### Completion Notes List

- All domain types defined: Memory, SourceType, RetrievalWeights, WakeSignal, TelegramQueueItem, SessionType, SessionConfig, Skill, SkillType, SkillStatus, Result<T>
- All entities defined with creation factories: MemoryEntity, WakeSignalEntity, TelegramQueueItemEntity, SkillEntity, SessionEntity, IdentityEntity
- All value objects defined: Embedding (768-dim validation + defensive copy), Significance (0-1 range + NaN guard), RetrievalWeights (sum-to-1 + NaN guard), SourceType enum, SessionType enum
- All 8 port interfaces defined: MemoryStore, SignalBus, SkillRegistry, IdentityStore, SessionManager, Messenger, EmbeddingProvider, Logger
- All error classes defined: NyxError (abstract base) + 9 concrete errors
- All barrel index.ts files populated with proper exports
- Domain layer has zero external dependencies — verified by import isolation test (including node: built-ins)
- 168 tests pass (including entity factory tests, NaN/Infinity edge cases, UUID validation, defensive copy), 0 regressions
- Resolved review finding [HIGH]: Added Number.isNaN() guards to significance, retrieval-weights, and memory entity validation
- Resolved review finding [HIGH]: Removed `Significance = number` type alias from memory.type.ts — value object `Significance` is now the sole definition
- Resolved review finding [MEDIUM]: Removed node: exception from import isolation test
- Resolved review finding [MEDIUM]: Added factory functions (createWakeSignalEntity, createTelegramQueueItemEntity, createSkillEntity, createSessionEntity, createIdentityEntity)
- Resolved review finding [LOW]: Added NaN/Infinity test cases for significance, retrieval-weights, and memory entity
- Resolved review finding [LOW]: Embedding now defensively copies input array via spread
- Resolved review finding [LOW]: MemoryEntity now validates UUID format for id field
- Resolved review R2 [HIGH]: Embedding createEmbedding now validates individual elements with Number.isFinite() — rejects NaN/Infinity
- Resolved review R2 [MEDIUM]: MemoryEntity now validates accessCount as non-negative integer
- Resolved review R2 [MEDIUM]: MemoryEntity now validates all linkedIds entries as valid UUIDs
- Resolved review R2 [MEDIUM]: MemoryEntity factory now defensively copies embedding, tags, and linkedIds arrays
- Resolved review R2 [MEDIUM]: All entity factories now perform meaningful validation (identity: weights sum; session: type match; signal: non-empty source/reason; skill: non-empty name/path)
- Resolved review R2 [LOW]: Exported `embeddingDimensions` from embedding.value-object.ts, imported in memory.entity.ts — single source of truth
- Resolved review R2 [LOW]: Import isolation test now uses `path.relative()` for cross-platform path resolution
- Resolved review R2 [LOW]: RetrievalWeights and IdentityEntity use `Number.isFinite()` — catches Infinity with accurate "finite non-negative" error message
- Resolved review R3 [HIGH]: Signal entity factories now defensively copy `relatedMemories` array and return spread copies
- Resolved review R3 [HIGH]: Session entity factory now defensively copies `config` object including `tools` array
- Resolved review R3 [HIGH]: Removed dead `createTelegramQueueItemEntity` text validation; replaced with meaningful `from` non-empty validation
- Resolved review R3 [MEDIUM]: Expanded SessionEntity tests from 2→10, SkillEntity tests from 3→11 — coverage now includes all types/statuses, defensive copies, validation edge cases
- Resolved review R3 [MEDIUM]: SkillEntity factory now validates `description` and `content` are non-empty
- Resolved review R3 [MEDIUM]: IdentityEntity factory now validates `rawContent` is non-empty
- Resolved review R3 [MEDIUM]: Added JSDoc comment to signal.type.ts documenting temporal type design — string for JSON/IPC signals vs Date for DB-backed Memory is intentional per AC
- Resolved review R3 [LOW]: WakeSignal test now uses realistic UUID values instead of "mem-1"
- Resolved review R3 [LOW]: SessionEntity and SkillEntity factories return spread copies, preventing input mutation leaking
- Resolved review R3 [LOW]: IdentityEntity factory defensively copies `retrievalWeights` object
- Resolved review R4 [HIGH]: SessionEntity and MemoryEntity now defensively copy Date objects (startedAt, createdAt, lastAccessed) via `new Date(date.getTime())`
- Resolved review R4 [MEDIUM]: SessionEntity factory now validates triggerContext, config.model, and config.systemPrompt are non-empty
- Resolved review R4 [MEDIUM]: TelegramQueueItemEntity factory now validates chatId is integer and messageId is positive integer
- Resolved review R4 [LOW]: SessionEntity test changed `.toBe(now)` to `.toEqual(now)`, added startedAt defensive copy test
- Resolved review R4 [LOW]: WakeSignalEntity factory now validates relatedMemories entries as UUIDs
- Resolved review R4 [LOW]: SessionEntity tools shallow-copy acknowledged — deep clone deferred to Story 3.3 when tool shape is known
- Resolved review R5 [HIGH]: Fixed 3 biome errors (2 format: multiline ternary/error, 1 lint: noNonNullAssertion) introduced in R4 fix commit
- Resolved review R5 [HIGH]: MemoryEntity factory now validates individual embedding elements with Number.isFinite() — consistent with Embedding value object
- Resolved review R5 [MEDIUM]: Added `embeddingDimensions` to domain barrel re-export
- Resolved review R5 [MEDIUM]: WakeSignalEntity and TelegramQueueItemEntity factories now validate createdAt/receivedAt as non-empty
- Resolved review R5 [MEDIUM]: SessionEntity factory now validates config.maxTurns as positive integer when non-null

### File List

New files:
- src/domain/types/memory.type.ts
- src/domain/types/signal.type.ts
- src/domain/types/session.type.ts
- src/domain/types/skill.type.ts
- src/domain/types/result.type.ts
- src/domain/entities/memory.entity.ts
- src/domain/entities/signal.entity.ts
- src/domain/entities/skill.entity.ts
- src/domain/entities/session.entity.ts
- src/domain/entities/identity.entity.ts
- src/domain/value-objects/embedding.value-object.ts
- src/domain/value-objects/significance.value-object.ts
- src/domain/value-objects/source-type.value-object.ts
- src/domain/value-objects/retrieval-weights.value-object.ts
- src/domain/value-objects/session-type.value-object.ts
- src/domain/ports/memory-store.interface.ts
- src/domain/ports/signal-bus.interface.ts
- src/domain/ports/skill-registry.interface.ts
- src/domain/ports/identity-store.interface.ts
- src/domain/ports/session-manager.interface.ts
- src/domain/ports/messenger.interface.ts
- src/domain/ports/embedding-provider.interface.ts
- src/domain/ports/logger.interface.ts
- src/domain/errors/domain.error.ts
- tests/domain/value-objects/embedding.test.ts
- tests/domain/value-objects/significance.test.ts
- tests/domain/value-objects/retrieval-weights.test.ts
- tests/domain/entities/memory.test.ts
- tests/domain/entities/signal.test.ts
- tests/domain/entities/skill.test.ts
- tests/domain/entities/session.test.ts
- tests/domain/entities/identity.test.ts
- tests/domain/errors/domain-error.test.ts
- tests/domain/import-isolation.test.ts

Modified files:
- src/domain/types/memory.type.ts (removed Significance type alias to resolve naming collision)
- src/domain/types/signal.type.ts (added temporal type rationale comment)
- src/domain/types/index.ts
- src/domain/entities/signal.entity.ts (defensive copies, removed dead validation, added from validation)
- src/domain/entities/session.entity.ts (defensive copies of config and tools)
- src/domain/entities/skill.entity.ts (added description/content validation, defensive copy)
- src/domain/entities/identity.entity.ts (added rawContent validation, defensive copy of retrievalWeights)
- src/domain/entities/index.ts
- src/domain/value-objects/index.ts
- src/domain/ports/index.ts
- src/domain/errors/index.ts
- src/domain/index.ts
- tsconfig.json (added allowImportingTsExtensions)
- tests/domain/entities/signal.test.ts (expanded: UUID values, defensive copy tests, from validation)
- tests/domain/entities/session.test.ts (expanded from 2→10 tests: all types, defensive copies)
- tests/domain/entities/skill.test.ts (expanded from 3→11 tests: all types/statuses, description/content validation, defensive copies)
- tests/domain/entities/identity.test.ts (expanded: rawContent validation, defensive copy, Infinity test)

### Change Log

- 2026-03-12: Story 1.2 implemented — all domain layer types, entities, value objects, ports, and errors defined with full test coverage
- 2026-03-12: Code review (AI) — 2 HIGH, 2 MEDIUM, 3 LOW findings. 7 action items created. Status → in-progress. Key issues: NaN validation bypass, Significance type naming collision.
- 2026-03-12: Addressed code review findings — 7/7 items resolved (2 HIGH, 2 MEDIUM, 3 LOW). All tests pass (147 tests, 0 regressions). Status → review.
- 2026-03-12: Code review round 2 (AI) — 1 HIGH, 4 MEDIUM, 3 LOW findings. All 8 issues fixed. 168 tests pass, 0 regressions. Status → done.
- 2026-03-13: Code review round 3 (AI) — 3 HIGH, 4 MEDIUM, 3 LOW findings. 10 action items created. Status → in-progress. Key issues: signal/session entities lack defensive copies, dead validation code, test coverage imbalance, inconsistent temporal types.
- 2026-03-13: Addressed code review round 3 findings — 10/10 items resolved (3 HIGH, 4 MEDIUM, 3 LOW). 192 tests pass, 0 regressions. Status → review.
- 2026-03-13: Code review round 4 (AI) — 1 HIGH, 2 MEDIUM, 3 LOW findings. All 6 issues fixed inline. 204 tests pass, 0 regressions. Status → done.
- 2026-03-13: Code review round 5 (AI) — 2 HIGH, 3 MEDIUM, 2 LOW findings. All 5 HIGH+MEDIUM issues fixed inline. Key issues: biome check failing (3 errors), MemoryEntity embedding element validation gap, missing barrel export, signal temporal field validation, SessionEntity maxTurns validation. 213 tests pass, 0 regressions. Status → done.
