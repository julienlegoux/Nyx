# Story 2.2: Embedding Provider

Status: done

## Story

As a developer (J),
I want a local embedding provider using nomic-embed-text-v1.5,
so that memories can be vectorized without external API dependencies.

## Acceptance Criteria

### AC1: EmbeddingProvider Implementation

**Given** `src/infrastructure/embedding/embedding-provider.implementation.ts`
**When** the EmbeddingProvider is instantiated via `createEmbeddingProvider()`
**Then:**
- It loads the nomic-embed-text-v1.5 model via `@huggingface/transformers` (ONNX runtime)
- Model loading happens once during `init()`, not per-request
- The factory function returns `Promise<EmbeddingProvider>` — the model is loaded and warm before anything calls `embed()`
- The implementation class holds a reference to the loaded pipeline

### AC2: Embed Method

**Given** a text string
**When** `embed(content)` is called
**Then:**
- It prefixes content with `search_document: ` for document embeddings (nomic-embed-text requires task prefixes)
- It returns `Result<number[]>` containing a 768-dimension float vector
- The implementation validates the output vector is exactly 768 dimensions before returning — if the model produces unexpected dimensions, return `EmbeddingError`
- The vector is normalized (unit length)
- Latency is approximately 20-60ms per embedding on CPU
- On failure, it returns `Result` with an `EmbeddingError`
- Empty string input returns `Result` with an `EmbeddingError` (not a zero vector)

### AC3: Bun Runtime Compatibility

**Given** Bun runtime environment
**When** `@huggingface/transformers` ONNX bindings are loaded
**Then:**
- If native ONNX bindings work under Bun, use them directly
- If native bindings fail, implement fallback: `Bun.spawn()` calls a Node.js script (`node-embed.script.ts`) that runs the embedding and returns the vector via stdout JSON
- The fallback is transparent to consumers — same `EmbeddingProvider` port interface
- The implementation detects which strategy works during `createEmbeddingProvider()` and commits to it

### AC4: Clean Architecture Compliance

**Given** the embedding provider port
**When** used from application layer use cases
**Then:**
- Application code depends only on `EmbeddingProvider` interface from `@nyx/domain/ports/`, not the `@huggingface/transformers` implementation
- The provider is swappable via DI (Clean Architecture)
- The implementation lives in `src/infrastructure/embedding/`
- The domain layer has zero imports from `@huggingface/transformers`

### AC5: Container & Init Integration

**Given** the init sequence in `src/entry/init.ts`
**When** `init()` runs
**Then:**
- It calls `createEmbeddingProvider()` to load the model
- The `Container` interface includes `readonly embeddingProvider: EmbeddingProvider`
- `InitDeps` includes `readonly embeddingProvider: EmbeddingProvider`
- `createContainer` passes through `deps.embeddingProvider`
- Embedding model loading happens AFTER logger creation (so loading progress can be logged)
- If model loading fails, init crashes (Docker restart handles recovery)

## Tasks / Subtasks

- [x] Task 1: Install `@huggingface/transformers` and verify Bun compatibility (AC: #3)
  - [x] 1.1 `bun add @huggingface/transformers` — installed v3.8.1
  - [x] 1.2 Verified Bun compatibility: ESM import, pipeline function, env object all work natively
  - [x] 1.3 Bun native ONNX works — Node.js fallback NOT needed (Task 3 skipped)
  - [x] 1.4 Documented: native strategy works, no fallback required

- [x] Task 2: Create `embedding-provider.implementation.ts` (AC: #1, #2, #4)
  - [x] 2.1 Created `src/infrastructure/embedding/embedding-provider.implementation.ts`
  - [x] 2.2 Implemented `EmbeddingProviderImpl` class implementing `EmbeddingProvider` port interface
  - [x] 2.3 Constructor takes `FeatureExtractionPipeline` instance
  - [x] 2.4 `embed(content)` validates non-empty, prefixes with `search_document: `, runs pipeline with pooling/normalize, validates 768-dim output, returns `Result<number[]>`
  - [x] 2.5 All `@huggingface/transformers` errors wrapped in `EmbeddingError`
  - [x] 2.6 Exported `createEmbeddingProvider()` async factory

- [x] Task 3: Create Node.js fallback script (if needed) (AC: #3)
  - [x] 3.1 Not needed — Bun native ONNX works with @huggingface/transformers v3.8.1
  - [x] 3.2 Skipped — fallback not required
  - [x] 3.3 Skipped — fallback not required
  - [x] 3.4 N/A — single native implementation

- [x] Task 4: Update barrel export (AC: #4)
  - [x] 4.1 Updated `src/infrastructure/embedding/index.ts` to export `createEmbeddingProvider` and `EmbeddingProviderImpl`

- [x] Task 5: Update Container and InitDeps (AC: #5)
  - [x] 5.1 Added `readonly embeddingProvider: EmbeddingProvider` to `Container` interface
  - [x] 5.2 Added `readonly embeddingProvider: EmbeddingProvider` to `InitDeps` interface
  - [x] 5.3 Updated `createContainer` to pass through `deps.embeddingProvider`
  - [x] 5.4 Added import for `EmbeddingProvider` type from `@nyx/domain/ports/index.ts`

- [x] Task 6: Update init() (AC: #5)
  - [x] 6.1 Imported `createEmbeddingProvider` from `@nyx/infrastructure/embedding/index.ts`
  - [x] 6.2 Added `const embeddingProvider = await createEmbeddingProvider()` after runMigrations
  - [x] 6.3 Logged `"embedding model loaded"` after successful creation
  - [x] 6.4 Passed `embeddingProvider` to `createContainer`

- [x] Task 7: Write tests (AC: #1, #2, #4, #5)
  - [x] 7.1 Created `tests/infrastructure/embedding/embedding-provider.test.ts`
  - [x] 7.2 Test: `EmbeddingProviderImpl` implements `embed()` method
  - [x] 7.3 Test: `embed()` with empty string returns `Result` with `EmbeddingError`
  - [x] 7.4 Test: `embed()` returns 768-dimension vector on valid input (mock pipeline)
  - [x] 7.5 Test: `embed()` prepends `search_document: ` prefix to content
  - [x] 7.6 Test: `embed()` wraps pipeline errors in `EmbeddingError`
  - [x] 7.7 Test: `embed()` returns `EmbeddingError` if output vector is not 768 dimensions
  - [x] 7.8 Test: `createEmbeddingProvider` is an async function
  - [x] 7.9 Updated `tests/entry/container.test.ts` — mock embeddingProvider, verify Container includes it
  - [x] 7.10 Updated `tests/entry/init.test.ts` — mock.module for embedding, verify init returns Container with embeddingProvider

- [x] Task 8: Validate and regression check (AC: all)
  - [x] 8.1 `bun run check` — biome lint/format passes
  - [x] 8.2 `bun run typecheck` — no type errors
  - [x] 8.3 `bun test` — 349 tests pass, 0 regressions (339 → 349, 10 new tests)

## Dev Notes

### Architecture Compliance

**Clean Architecture — Infrastructure Layer Embedding Module:**

The embedding module lives in `src/infrastructure/embedding/`. The `EmbeddingProvider` port interface is in `src/domain/ports/embedding-provider.interface.ts` (already exists). The implementation uses `@huggingface/transformers` internally but never leaks this dependency beyond the infrastructure layer.

```
src/infrastructure/embedding/
├── embedding-provider.implementation.ts  (NEW — EmbeddingProviderImpl + createEmbeddingProvider)
├── node-embed.script.ts                  (NEW — only if Bun fallback needed)
└── index.ts                              (MODIFY — export implementation)

src/entry/
├── container.ts                          (MODIFY — add embeddingProvider to Container/InitDeps)
├── init.ts                               (MODIFY — add createEmbeddingProvider call)
└── shutdown.ts                           (no change — embedding has no connection to close)

tests/infrastructure/embedding/
└── embedding-provider.test.ts            (NEW)

tests/entry/
├── container.test.ts                     (MODIFY — add embeddingProvider mock)
└── init.test.ts                          (MODIFY — mock embedding module)
```

### Domain Contracts Already Exist

These files are **ALREADY IMPLEMENTED** — do NOT recreate or modify them:

- `src/domain/ports/embedding-provider.interface.ts` — `EmbeddingProvider { embed(content: string): Promise<Result<number[]>> }`
- `src/domain/value-objects/embedding.value-object.ts` — `Embedding` interface, `embeddingDimensions = 768`, `createEmbedding()` factory
- `src/domain/errors/domain.error.ts` — `EmbeddingError extends NyxError { code = "EMBEDDING_ERROR" }`
- `src/domain/ports/index.ts` — already exports `EmbeddingProvider` type

### Import Map

```typescript
// embedding-provider.implementation.ts imports:
import type { EmbeddingProvider } from "@nyx/domain/ports/index.ts";
import type { Result } from "@nyx/domain/types/result.type.ts";
import { EmbeddingError } from "@nyx/domain/errors/domain.error.ts";
import { pipeline } from "@huggingface/transformers";
// Type for the pipeline:
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

// container.ts adds:
import type { EmbeddingProvider } from "@nyx/domain/ports/index.ts";

// init.ts adds:
import { createEmbeddingProvider } from "@nyx/infrastructure/embedding/index.ts";
```

### Critical: @huggingface/transformers (NOT @xenova/transformers)

The architecture doc references `@xenova/transformers` — this package is **DEPRECATED**. The correct package is:

- **Package:** `@huggingface/transformers` (Transformers.js v3+)
- **Why:** `@xenova/transformers` was the v1/v2 package by the same author (Xenova/Joshua Lochner) before it was officially adopted by Hugging Face. v3 was published under `@huggingface/transformers`.
- **Bun support:** Transformers.js v3 officially supports Node.js, Deno, and Bun runtimes.
- **API:** Same `pipeline()` API — `pipeline('feature-extraction', 'nomic-ai/nomic-embed-text-v1.5')`

### nomic-embed-text-v1.5 Usage Pattern

```typescript
import { pipeline } from "@huggingface/transformers";

// Load once during init (model download ~270MB first time, cached after)
const extractor = await pipeline("feature-extraction", "nomic-ai/nomic-embed-text-v1.5", {
  dtype: "fp32",  // or "q8" for quantized — fp32 for accuracy
});

// Embed text — MUST use task prefix
const output = await extractor("search_document: What is deep learning?", {
  pooling: "mean",
  normalize: true,
});

// output.data is Float32Array of length 768
const vector = Array.from(output.data);
```

**Task prefix requirement:** nomic-embed-text-v1.5 requires task-specific prefixes:
- `search_document: ` — for documents being stored/indexed
- `search_query: ` — for queries during retrieval
- `clustering: ` — for clustering tasks
- `classification: ` — for classification tasks

For Nyx's memory system, use `search_document: ` when storing memories. The retrieval use case (Story 2.4) will use `search_query: ` — but that's NOT this story's concern. This story's `embed()` should accept raw content and prepend `search_document: ` as the default prefix.

**Design decision:** The `embed(content)` method on the port interface takes raw content. The infrastructure implementation adds the prefix. If we later need query embeddings, we can either:
1. Add an optional parameter to `embed()` (breaking change to port)
2. Create a separate `embedQuery()` method on the port (preferred — extend interface in Story 2.4)

For now, `embed()` always uses `search_document: ` prefix. Document this decision.

### Bun/ONNX Compatibility Strategy

1. **Try native first:** `@huggingface/transformers` v3 claims Bun support. Try loading the pipeline directly.
2. **If native fails:** Create `node-embed.script.ts` fallback:
   ```typescript
   // node-embed.script.ts — executed via `node` (not bun)
   // Reads content from stdin, outputs JSON to stdout
   import { pipeline } from "@huggingface/transformers";
   const extractor = await pipeline("feature-extraction", "nomic-ai/nomic-embed-text-v1.5");
   // ... read stdin, embed, write JSON to stdout
   ```
   ```typescript
   // SpawnEmbeddingProvider — calls Node.js subprocess
   const proc = Bun.spawn(["node", "node-embed.script.ts"], { stdin: "pipe", stdout: "pipe" });
   ```
3. **Detection during init:** `createEmbeddingProvider()` tries native, falls back to spawn. This decision is made once at startup.

### Docker Fallback Note

If native Bun ONNX fails and the Node.js fallback is needed, the Docker container (`oven/bun` base image) does NOT include Node.js by default. The Dockerfile would need to add `apt-get install nodejs` or use a multi-runtime base image. This is outside this story's scope — if fallback is needed, file a Docker infrastructure task. Given Transformers.js v3 officially supports Bun, the native path is expected to work.

### First-Boot Model Download

`createEmbeddingProvider()` triggers a ~270MB model download on first boot. This can take 30-120s depending on network. If the download fails (network unavailable), init crashes and Docker restarts (NFR12). The model is cached in `~/.cache/huggingface/hub/` on the persistent home volume, so subsequent boots are fast (~1-3s model load from disk).

### Model Caching

`@huggingface/transformers` downloads models to a cache directory (default: `~/.cache/huggingface/hub/`). In Docker:
- The cache lives in Nyx's home volume (`/home/nyx/.cache/`) which persists across restarts
- First boot downloads ~270MB; subsequent boots load from cache
- No special configuration needed — the library handles caching automatically

### EmbeddingProviderImpl Design

```typescript
export class EmbeddingProviderImpl implements EmbeddingProvider {
  constructor(private readonly extractor: FeatureExtractionPipeline) {}

  async embed(content: string): Promise<Result<number[]>> {
    if (content.trim() === "") {
      return { ok: false, error: new EmbeddingError("Cannot embed empty content") };
    }
    try {
      const output = await this.extractor(`search_document: ${content}`, {
        pooling: "mean",
        normalize: true,
      });
      const vector = Array.from(output.data);
      if (vector.length !== 768) {
        return {
          ok: false,
          error: new EmbeddingError(
            `Expected 768 dimensions, got ${vector.length}`
          ),
        };
      }
      return { ok: true, value: vector };
    } catch (err) {
      return {
        ok: false,
        error: new EmbeddingError(
          `Embedding failed: ${err instanceof Error ? err.message : String(err)}`
        ),
      };
    }
  }
}

export async function createEmbeddingProvider(): Promise<EmbeddingProvider> {
  const extractor = await pipeline("feature-extraction", "nomic-ai/nomic-embed-text-v1.5", {
    dtype: "fp32",
  });
  return new EmbeddingProviderImpl(extractor);
}
```

### Testing Strategy

**Embedding provider tests (`tests/infrastructure/embedding/embedding-provider.test.ts`):**
- **Cannot load real model in CI** — model is ~270MB and requires download
- Mock the pipeline/extractor to test the `EmbeddingProviderImpl` class logic
- Test input validation (empty string → EmbeddingError)
- Test that `embed()` prepends `search_document: ` prefix to content (verify mock receives prefixed string)
- Test that pipeline errors are wrapped in `EmbeddingError`
- Test that output is extracted as `number[]` from the pipeline result (not Float32Array)
- Test that output dimension mismatch returns `EmbeddingError`
- Test `createEmbeddingProvider` is exported as an async function

**Mock pattern for pipeline:**
```typescript
const mockExtractor = mock((text: string, options: object) =>
  Promise.resolve({ data: new Float32Array(768).fill(0.1) })
);
const provider = new EmbeddingProviderImpl(mockExtractor as unknown as FeatureExtractionPipeline);
```

**Entry layer test updates:**
- `container.test.ts`: Create mock embeddingProvider `{ embed: mock(() => Promise.resolve({ ok: true, value: [] })) }`, pass to createContainer, verify Container.embeddingProvider is set.
- `init.test.ts`: Use `mock.module("@nyx/infrastructure/embedding/index.ts", ...)` to mock `createEmbeddingProvider` (resolves to mock provider). Verify init() returns Container with embeddingProvider field.

### What This Story Does NOT Include

- No query embedding (Story 2.4 — `search_query: ` prefix for retrieval)
- No memory storage operations (Story 2.3)
- No integration with use cases (Story 2.3 orchestrates embedding + store)
- No config changes — the model name is hardcoded in the implementation (architecture specifies `nomic-embed-text-v1.5` as non-negotiable; if it ever changes, it's an infrastructure adapter swap)
- No shutdown logic — the pipeline has no connection to close; GC handles cleanup

### Project Structure Notes

- `embedding-provider.implementation.ts` follows the `.implementation.ts` naming convention established across the project
- Barrel export in `index.ts` follows existing pattern
- Container extension follows the pattern from Story 2.1 (add field to Container + InitDeps + createContainer passthrough)
- Init extension follows the pattern from Story 2.1 (add async resource creation after logger)

### Previous Story Intelligence (Story 2.1)

**Key learnings to apply:**
- All files formatted with tabs, line width 100 (Biome enforced)
- 339 tests currently pass — must not regress
- Validation commands: `bun run check`, `bun run typecheck`, `bun test`
- `@nyx/*` path aliases configured in `tsconfig.json` — use for all cross-directory imports
- Import from barrel `index.ts` files, not individual files
- Biome required import reordering in Story 2.1 — expect same for new imports
- `mock.module()` pattern established for mocking infrastructure modules in entry tests
- `connectDatabase()` was restructured to return `{ db, pool }` after discovering Drizzle's type limitations — similar discoveries may occur with `@huggingface/transformers` types
- Biome flags non-null assertions — use `?? ""` fallbacks
- TypeScript strict mode with `noUncheckedIndexedAccess` — be explicit with type narrowing

**Code patterns established:**
- Container interface with readonly fields, extended per story
- InitDeps interface matches Container minus computed fields (SkillRegistry is computed)
- createContainer is pure synchronous wiring — no async, no side effects
- init() is sequential: config → logger → [resources] → container
- Entry layer functions CAN throw — no Result<T> needed for init/createEmbeddingProvider

### Git Intelligence

Recent commits:
- `994fa40` — Add Drizzle DB, pgvector schema & migrations (Story 2.1)
- `522b013` — Implement entry layer: init, container, heartbeat (Story 1.6)
- `7744879` — Add seed directory and SkillRegistry impl (Story 1.5)

**Conventions:**
- Commit messages are imperative, concise, reference what was added
- Each story produces a focused commit

### Dependencies to Install

| Package | Type | Purpose |
|---------|------|---------|
| `@huggingface/transformers` | dependency | Transformers.js v3 — ONNX model inference for nomic-embed-text-v1.5 |

**Do NOT install `@xenova/transformers`** — it is the deprecated v1/v2 package.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Embedding Model] — nomic-embed-text-v1.5, 768 dimensions, local CPU, ONNX runtime, Bun fallback strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Embedding Flow] — use case orchestrates embedding, not adapter; EmbeddingProvider port injected into use cases
- [Source: _bmad-output/planning-artifacts/architecture.md#Startup & Shutdown Architecture] — init sequence, loadEmbeddingModel() placement
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — src/infrastructure/embedding/ directory
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — AC and user story
- [Source: _bmad-output/planning-artifacts/prd.md#NFR5] — Performance bounded by API; system optimizes what it controls
- [Source: _bmad-output/implementation-artifacts/2-1-database-connection-drizzle-schema-migrations.md] — Previous story: Container pattern, init design, 339 tests baseline, debug learnings
- [Source: huggingface.co/nomic-ai/nomic-embed-text-v1.5] — Model card, task prefixes, ONNX weights, Transformers.js example
- [Source: huggingface.co/blog/transformersjs-v3] — @huggingface/transformers v3 replaces @xenova/transformers, Bun support confirmed

## Senior Developer Review (AI)

**Review Date:** 2026-03-13
**Review Outcome:** Approved
**Total Action Items:** 0 (0 Critical, 0 High, 0 Medium, 4 Low — no action required)

### Notes

- All 5 ACs fully implemented and verified against code
- All 8 tasks marked [x] confirmed as actually done (Task 3 correctly skipped — Bun native works)
- Git file changes match story File List — no discrepancies (bun.lock is expected)
- 4 LOW issues noted: duplicate dimension constant (infrastructure could import from domain), bun.lock not in File List, test imports from implementation file directly (mock.module workaround), no test for non-Error catch path
- Code is clean, architecture-compliant, well-structured
- 349 tests pass, 0 regressions from 339 baseline

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome required import reordering: `@huggingface/transformers` sorts before `@nyx/*` aliases (external packages first)
- Biome reformatted `createEmbeddingProvider()` function to inline shorter args
- `mock.module()` in `init.test.ts` leaked to `embedding-provider.test.ts` when importing from barrel `index.ts` — fixed by importing directly from implementation file in tests
- `FeatureExtractionPipeline` type from `@huggingface/transformers` needed `as unknown as` cast because `pipeline()` returns a union type

### Completion Notes List

- Installed @huggingface/transformers@3.8.1 — Bun native ONNX compatible, no Node.js fallback needed
- Created EmbeddingProviderImpl with embed() method: validates input, prefixes with `search_document: `, runs pipeline, validates 768-dim output, wraps errors in EmbeddingError
- Created createEmbeddingProvider() async factory: loads nomic-embed-text-v1.5 model once at init
- Extended Container and InitDeps with embeddingProvider field
- Extended init() with createEmbeddingProvider() call after migrations, with logging
- Updated shutdown.test.ts mock container to include embeddingProvider (required by Container type change)
- 10 new tests across 3 files (1 new test file, 2 updated), 349 total tests pass, 0 regressions
- All validation gates pass: check, typecheck, test

### Change Log

- 2026-03-13: Story 2.2 implemented — EmbeddingProvider with nomic-embed-text-v1.5 via @huggingface/transformers, Container/init wiring. 10 new tests, 349 total pass, 0 regressions.

### File List

New files:
- src/infrastructure/embedding/embedding-provider.implementation.ts
- tests/infrastructure/embedding/embedding-provider.test.ts

Modified files:
- package.json (added @huggingface/transformers dependency)
- src/infrastructure/embedding/index.ts (export implementation)
- src/entry/container.ts (added embeddingProvider to Container/InitDeps)
- src/entry/init.ts (added createEmbeddingProvider + logging)
- tests/entry/container.test.ts (added embeddingProvider mock)
- tests/entry/init.test.ts (mock.module for embedding)
- tests/entry/shutdown.test.ts (added embeddingProvider to mock container)
