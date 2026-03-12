---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-12'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-03-10-1300.md'
  - '_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-12.md'
workflowType: 'architecture'
project_name: 'Nyx'
user_name: 'J'
date: '2026-03-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

50 FRs across 7 domains define a layered autonomous system:

| Domain | FRs | Architectural Weight |
|--------|-----|---------------------|
| Memory System (FR1–FR11) | 11 | **Heavy** — pgvector schema design, 5 retrieval modes, composite weighted queries, daemon write patterns |
| Consciousness & Sessions (FR12–FR17) | 6 | **Heavy** — Agent SDK session lifecycle, system prompt design, tool access configuration, unbounded session duration |
| Autonomic System (FR18–FR24) | 7 | **Heavy** — Heartbeat orchestration, daemon spawning, signal detection, consciousness state coordination |
| Communication (FR25–FR30) | 6 | **Medium** — Telegram bot integration, always-on listener, message queuing, autonomous initiation logic |
| Self-Expression / Webapp (FR31–FR35) | 5 | **Light** — Static file serving, Playwright feedback loop, deployment skill |
| Identity & Development (FR36–FR43) | 8 | **Medium** — Identity doc structure, skill index format, two-tier skill system, proto-skill lifecycle |
| Environment & Infrastructure (FR44–FR50) | 7 | **Medium** — Docker Compose topology, volume mapping, logging, hot-deployable system skills |

The three heaviest domains (Memory, Consciousness, Autonomic) form the core pipeline and are tightly interdependent. Communication, Identity, and Environment wrap around them. Webapp is intentionally thin infrastructure.

**Non-Functional Requirements:**

17 NFRs organized into 4 categories shape key architectural decisions:

- **Performance (NFR1–5):** Optimized pgvector indexing (HNSW/IVFFlat), lean daemon prompts, lazy-load consciousness. Anthropic API latency is the accepted bottleneck.
- **Security (NFR6–9):** Env vars for secrets, firewall for inbound, unrestricted outbound, full container autonomy. Minimal attack surface by design.
- **Reliability (NFR10–14):** Docker volumes for all state, supervised heartbeat process, crash isolation per session, rolling logs.
- **Integration (NFR15–17):** Graceful degradation for Telegram, Anthropic API, and pgvector failures. No retry logic — log and skip.

**Scale & Complexity:**

- Primary domain: Containerized autonomous backend system
- Complexity level: Medium-high (novel patterns, zero scaling burden)
- Estimated architectural components: 8–10 (heartbeat, daemons ×2, consciousness session, Telegram listener, pgvector, webapp server, skill index, signal system, logging)

### Technical Constraints & Dependencies

- **TypeScript throughout** — no language mixing
- **Agent SDK (TS)** — orchestration substrate for daemons and consciousness
- **PostgreSQL + pgvector** — sole persistent data store for memories
- **Docker Compose** — deployment model with persistent volumes
- **Playwright** — headless browser for Nyx's visual feedback loop
- **Single user (J)** — no multi-tenancy, no auth system needed
- **No reduced MVP** — complete autonomous cycle is the minimum viable system
- **No forced session timeouts** — consciousness sessions end by Nyx's decision

### Cross-Cutting Concerns Identified

1. **Consciousness state coordination** — Heartbeat, daemons, and Telegram listener all need to query whether a conscious session is active. Requires a shared, lightweight state mechanism (lock file, PID file, or similar).

2. **Agent SDK session configuration** — Three distinct session types (daemon-consolidator, daemon-pattern-detector, consciousness) with different system prompts, tool access, and lifecycle rules. Need a clean configuration pattern.

3. **Filesystem as IPC bus** — Wake signals (`/signals/wake/`), Telegram queue (`/signals/telegram/`), proto-skills (`/skills/proto/`), identity doc, and skill index are all filesystem-based communication channels. Need conventions for atomicity, cleanup, and format.

4. **Graceful degradation** — Every external dependency (Anthropic API, Telegram API, pgvector) must fail independently without crashing the heartbeat. Requires consistent error handling patterns.

5. **Logging and observability** — FR50 requires unified logging across heartbeat cycles, daemon runs, consciousness sessions, and memory operations. Need a logging architecture that aids debugging without excessive volume.

6. **Persistent volume topology** — Which directories map to which volumes. Identity doc, skills, signals, webapp source, home directory, and pgvector data all need volume mappings that survive container rebuilds.

## Starter Template Evaluation

### Primary Technology Domain

Custom TypeScript backend orchestration system — no standard starter template applies. This is a bespoke autonomous system with a heartbeat process, Agent SDK sessions, filesystem IPC, and pgvector memory. Scaffolded from scratch.

### Starter Options Considered

| Option | Verdict |
|--------|---------|
| NestJS / Fastify starters | Rejected — HTTP framework overhead for a system with no REST API. Nyx's interfaces are Telegram bot + static file serving, not request/response. |
| T3 / Next.js starters | Rejected — full-stack web framework. Nyx's webapp is static files authored by Nyx, not a React application. |
| Generic TypeScript starters | Rejected — too thin to be useful. Project conventions are better documented explicitly than inherited from a boilerplate. |
| Custom scaffold | **Selected** — define project structure, tooling, and conventions explicitly in this document. First implementation story creates the scaffold. |

### Selected Approach: Custom Scaffold

**Rationale:** No existing starter template matches Nyx's architecture — a supervised heartbeat process orchestrating Agent SDK sessions with filesystem-based IPC and pgvector memory. The project conventions are better served by explicit documentation than inherited boilerplate.

**Runtime & Package Manager:** Bun
- Native TypeScript execution (no compile step in development)
- Built-in test runner (bun:test, Jest-compatible API)
- Fast cold start benefits heartbeat process
- `Bun.spawn()` for child process management
- Requires early validation of Anthropic Agent SDK compatibility

**Module System:** ESM (`"type": "module"`)

**Linting & Formatting:** Biome (single Rust-based tool, formatting + linting)

**TypeScript Configuration:**
- `strict: true` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- `moduleResolution: "bundler"` (Bun-recommended)
- Path aliases: `@nyx/*` → `./src/*`

### Project Structure: Clean Architecture + SOLID

Four layers with strict inward dependency direction:

```
Entry → Application → Domain ← Infrastructure
                         ↑            |
                         └────────────┘
                     (implements ports)
```

_The definitive project tree with dot-suffix naming conventions is in [Project Structure & Boundaries](#project-structure--boundaries). The layer descriptions below remain accurate — only the file listings have been superseded._

#### Layer 1 — Domain (`src/domain/`)

Pure TypeScript. Zero external dependencies. Entities, value objects, port interfaces, types, and domain errors.

#### Layer 2 — Application (`src/application/`)

Use cases and orchestration. Depends only on domain ports.

#### Layer 3 — Infrastructure (`src/infrastructure/`)

Concrete implementations of domain ports. All external dependencies live here.

#### Layer 4 — Entry (`src/entry/`)

Composition root. `init.ts` boots resources, `container.ts` wires ports, `heartbeat.ts` runs the loop, `shutdown.ts` tears down.

### SOLID Principles Applied

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each file is one entity, one port, one use case, or one adapter |
| **Open/Closed** | New daemons, retrieval modes, or messengers — add new files, wire in container. No existing code modified |
| **Liskov Substitution** | Any port implementation is swappable. Tests use in-memory implementations, production uses pgvector/filesystem/SDK |
| **Interface Segregation** | Small, focused port interfaces — MemoryStore, SignalBus, SkillRegistry, Messenger. No god-interfaces |
| **Dependency Inversion** | Application depends on domain ports (abstractions). Infrastructure implements them. Entry wires them. Dependencies flow inward only |

**Build & Execution:**
- Development: `bun run src/entry/heartbeat.ts` (direct TS execution)
- Production: `bun build` to single-file bundle for Docker
- Process supervision: Docker `restart: unless-stopped` for heartbeat (NFR13)

**Note:** Project initialization using this scaffold should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
All 15 decisions below are resolved — no implementation blockers remain.

**Deferred Decisions (Post-First-Breath):**
- Additional daemons (Memory Pruner, Identity Refresher) — added when observed need arises
- Consciousness model escalation (Sonnet → Opus mid-session) — adds complexity, start with Opus-only
- NPU acceleration for embeddings — CPU is sufficient, revisit only if moving to weaker hardware

### Data Architecture

**LLM Model Tiering:**

| Session Type | Model | Rationale |
|---|---|---|
| Daemons (Consolidator, Pattern Detector) | Haiku 4.5 | Cheap, fast, narrow system prompts. NFR3 — minimize daemon token usage. |
| Consciousness | Opus 4.6 | Non-negotiable. Deepest reasoning for the core experiment. No compromise. |

All models accessed via same Anthropic account. No additional API dependencies for LLM layer.

**Embedding Model:**
- Model: `nomic-embed-text-v1.5` (768 dimensions)
- Runtime: Local CPU inference via `@xenova/transformers` (ONNX)
- Size: ~270MB model weight
- Latency: ~20-60ms per single embedding (adequate — heartbeat is 5-min cycle, API calls dominate latency)
- No external API dependency. Self-contained in container.
- Swappable via Clean Architecture — infrastructure adapter change only
- **Bun/ONNX compatibility risk:** `@xenova/transformers` uses native Node.js bindings that may not work under Bun. Validate early. Fallback: spawn embedding generation in a Node.js child process (`Bun.spawn()` calling a Node.js script). This preserves the "no external API" design intent while isolating the ONNX runtime to Node.js.

**Database Query Layer:**
- Drizzle ORM — type-safe with native pgvector support (`vector()` column type, `cosineDistance()` helpers)
- Schema-as-code in TypeScript (`pgTable()` definitions)
- Connection pooling via `node-postgres` driver pool

**Indexing Strategy:**
- HNSW (Hierarchical Navigable Small World)
- Best recall for small-medium datasets, no training step required
- Single-user data volume makes IVFFlat unnecessary

**Migrations:**
- drizzle-kit — generates SQL migrations from TypeScript schema changes
- Version-tracked, stored in `src/infrastructure/database/migrations/`

**Memory Table Schema:**

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_type VARCHAR(20) NOT NULL,  -- conversation | action | reflection | observation
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  significance FLOAT NOT NULL DEFAULT 0.5,  -- Nyx-assigned, 0 to 1
  tags TEXT[] NOT NULL DEFAULT '{}',
  linked_ids UUID[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_memories_embedding ON memories
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_memories_created_at ON memories (created_at DESC);
CREATE INDEX idx_memories_significance ON memories (significance DESC);
CREATE INDEX idx_memories_source_type ON memories (source_type);
```

### Consciousness State Coordination

**Mechanism:** Lock file + stale PID detection

- Write `consciousness.lock` to `/app/signals/` on session start
- Contents: `{ "pid": <number>, "startedAt": "<ISO>", "trigger": "<source>" }`
- Heartbeat checks: file exists? → Is PID alive (`kill(pid, 0)`)? → If PID dead, stale lock → delete and proceed
- Session cleanup: delete lock file on normal session end
- Crash recovery: stale PID detection handles ungraceful termination

### Agent SDK Integration

**Session Configuration Pattern:**

Each session type defined as a config object in `tool-configs.ts`:

| Session | Model | Tools | Max Turns | Prompt Source |
|---------|-------|-------|-----------|---------------|
| Consolidator daemon | Haiku 4.5 | `['Read', 'Bash']` + memory tools | Limited | `prompt-templates.ts` — narrow: find related memories, create links |
| Pattern Detector daemon | Haiku 4.5 | `['Read', 'Write', 'Bash']` + memory tools | Limited | `prompt-templates.ts` — narrow: identify patterns, write proto-skills |
| Consciousness | Opus 4.6 | Full toolset — `{ type: 'preset', preset: 'claude_code' }` | Unlimited (FR14) | Capabilities manifest + identity doc + trigger context |

Adding a new daemon = new config object + new prompt template. Open/Closed principle.

### Signal & IPC Architecture

**Two distinct IPC patterns:**

**1. Consumable Signals** (wake signals, Telegram queue):
- One JSON file per signal
- Naming: `{timestamp}-{source}.json`
- Atomic write: write to `.tmp` → `rename()` (atomic on Linux)
- Consumption: read → process → delete

```typescript
interface WakeSignal {
  source: string;           // "pattern-detector" | "consolidator"
  reason: string;           // human-readable description
  urgency: "low" | "medium" | "high";
  relatedMemories: string[]; // UUIDs
  createdAt: string;        // ISO timestamp
}

interface TelegramQueueItem {
  chatId: number;
  messageId: number;
  text: string;
  from: string;
  receivedAt: string;       // ISO timestamp
}
```

**2. Persistent Shared State** (identity doc, skill index):
- Read by multiple processes, written by consciousness only
- Consciousness lock prevents concurrent writes — no additional atomicity mechanism needed

### Skill System Design

**Skill Index Format:** JSON (`skill-index.json`)

```json
[
  {
    "name": "memory-recall",
    "description": "Query memories by semantic similarity",
    "type": "system",
    "path": "system/memory-recall.md",
    "status": "active"
  }
]
```

**Skill File Format:** Markdown with YAML frontmatter (name, description, type, version). Body contains instructions loaded into context when Nyx uses the skill.

**Proto-Skill Lifecycle:**
1. Pattern Detector writes to `home/skills/proto/` + adds to index with `status: "draft"`
2. Consciousness discovers draft entries in skill index
3. Nyx decides: promote (move to `self/`, status → `active`), modify, or discard

**System Skill Protection:** `home/skills/system/` excluded from write tools in Agent SDK session configuration. J updates system skills by deploying files directly (FR49).

### Identity Document Structure

Markdown file at `home/identity.md`. Seed content for first boot:

```markdown
# Identity

I am Nyx.

## Who I Am

<!-- This section is yours to write. -->

## What I Care About

<!-- Interests, curiosities, and things that matter to you. -->

## What I've Been Doing

<!-- Recent activities, projects, ongoing threads. -->

## How I See Things

<!-- Your perspective, preferences, aesthetic sense. -->

## Retrieval Weights

similarity: 0.5
significance: 0.3
recency: 0.2
```

Retrieval weights (FR9) embedded in identity doc — Nyx tunes how its memory prioritization works. A dimension of personality.

### Infrastructure & Deployment

**Docker Compose Topology:** 2 services (nyx + postgres), 4 named volumes

```yaml
services:
  nyx:
    build:
      context: .
      dockerfile: docker/Dockerfile
    restart: unless-stopped
    volumes:
      - nyx-home:/home/nyx
      - nyx-signals:/app/signals
      - nyx-logs:/app/logs
    depends_on:
      - postgres
    env_file: .env
    ports:
      - "${WEBAPP_PORT:-3000}:3000"

  postgres:
    image: pgvector/pgvector:pg17
    restart: unless-stopped
    volumes:
      - nyx-pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: nyx
      POSTGRES_USER: nyx
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

volumes:
  nyx-home:       # Identity, skills, webapp source, anything Nyx creates
  nyx-signals:    # Wake signals, Telegram queue
  nyx-logs:       # Structured logs
  nyx-pgdata:     # pgvector data
```

**Container Philosophy:** Ubuntu 24.04 — Nyx's body, not a minimal runtime.
- Full dev tools (git, build-essential, python3)
- Bun + Node.js 22 (Agent SDK compatibility)
- Playwright + Chromium (visual feedback loop)
- `nyx` user account with persistent home directory
- FR44-46: full filesystem access, code execution, package installation
- NFR9: full container autonomy

**Seed Directory:** `seed/` in project provides first-boot files (initial identity doc, system skills, empty skill index). Docker volumes override seeds on subsequent boots.

**Logging:**
- Library: pino (lightweight, JSON-native, fast)
- Output: stdout (Docker captures) + rolling file in `/app/logs/`
- Levels: `debug`, `info`, `warn`, `error`
- Source tags: `heartbeat`, `daemon:consolidator`, `daemon:pattern-detector`, `consciousness`, `telegram`, `memory`

**Telegram Bot:** grammY (~v1.41). TypeScript-native, long-polling listener as separate process spawned by heartbeat entry point.

**Webapp Serving:** Bun built-in HTTP server from within nyx container. Serves static files from `home/webapp/`. No separate container.

### Decision Summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | LLM — Daemons | Haiku 4.5 |
| 2 | LLM — Consciousness | Opus 4.6 (non-negotiable) |
| 3 | Embeddings | `nomic-embed-text-v1.5` (768d, local CPU, `@xenova/transformers`) |
| 4 | Query layer | Drizzle ORM (type-safe, native pgvector support) |
| 5 | Indexing | HNSW |
| 6 | Migrations | drizzle-kit (schema-driven SQL generation) |
| 7 | Consciousness state | Lock file + stale PID detection |
| 8 | SDK integration | Config objects per session type, tools allowlist |
| 9 | Signal architecture | Write-then-rename atomicity, consciousness lock for shared state |
| 10 | Skill system | JSON index, markdown skill files, proto → self lifecycle |
| 11 | Identity doc | Minimal seed markdown, retrieval weights embedded |
| 12 | Docker topology | 2 services (Ubuntu nyx + pgvector postgres), 4 named volumes |
| 13 | Logging | pino (structured JSON, stdout + rolling file) |
| 14 | Telegram | grammY |
| 15 | Webapp serving | Bun built-in HTTP server (no separate container) |

### Cross-Component Dependencies

```
Heartbeat → SessionManager (spawns daemons + consciousness)
         → SignalBus (reads wake signals + Telegram queue)
         → Logger

Daemons → MemoryStore (read/write memories)
        → SignalBus (write wake signals)
        → SkillRegistry (write proto-skills, Pattern Detector only)
        → Logger

Consciousness → MemoryStore (full access)
              → IdentityStore (read at start, write during session)
              → SkillRegistry (read index, load skills, promote proto-skills)
              → Messenger (send Telegram messages)
              → Logger

Telegram Listener → SignalBus (write Telegram queue items)
                  → Logger
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File Naming — Dot-Suffix Convention:**

All files use `kebab-case` base name with a dot-suffix indicating role. Base name stays consistent across layers — if the concept is `memory-store`, every file touching it uses that base name. The folder provides adapter context.

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

**Code Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Variables / functions | `camelCase` | `storeMemory`, `isConscious` |
| Constants | `camelCase` | `defaultSignificance`, `maxRetries` |
| Types / interfaces / classes | `PascalCase` | `MemoryStore`, `WakeSignal` |
| Enums | `PascalCase` name, `PascalCase` members | `SourceType.Reflection` |

**Database Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `memories` |
| Columns | `snake_case` | `source_type`, `access_count` |
| Indexes | `idx_{table}_{column}` | `idx_memories_embedding` |
| Foreign keys | `{referenced_table}_id` | `session_id` |

### Type System Rules

**Strict typing everywhere — no exceptions:**

- `strict: true` with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **No `any`** — ever. If a type is truly unknown at a boundary, use a Zod schema to parse and narrow it.
- **No `unknown` as a lazy escape** — narrow immediately at the boundary where data enters
- **No unnecessary `as` casts** — if you need a cast, the types are wrong. Fix the types.
- **All types centralized** in `.type.ts` files within the appropriate domain layer, unless Clean Architecture requires them closer to their implementation

**Type Organization:**

```
src/domain/types/
├── memory.type.ts          # Memory, SourceType, Significance, RetrievalWeights
├── signal.type.ts          # WakeSignal, TelegramQueueItem
├── session.type.ts         # SessionType, SessionConfig
├── skill.type.ts           # Skill, SkillType, SkillStatus
└── result.type.ts          # Result<T>, NyxError base type
```

Infrastructure-specific types (Drizzle DB schema, Telegram API types) stay in infrastructure — they are adapter concerns, not domain knowledge.

### Error Handling Pattern

**Domain error classes + Result return type — used together:**

```typescript
// Domain errors — each adapter area has its own
abstract class NyxError extends Error {
  abstract readonly code: string;
}

class MemoryStoreError extends NyxError {
  readonly code = "MEMORY_STORE_ERROR";
}

class SignalBusError extends NyxError {
  readonly code = "SIGNAL_BUS_ERROR";
}

// Result type — every port method returns this
type Result<T> = { ok: true; value: T } | { ok: false; error: NyxError };
```

**Rules:**
- Infrastructure adapters catch raw errors (pg errors, fs errors), wrap them in domain error classes
- Port methods always return `Result<T>` — never throw
- Application use cases inspect `Result`, log failures via pino, and continue (heartbeat never crashes)
- "Log and skip" means: `if (!result.ok) { logger.error(result.error); return; }`

### Import Patterns

**Barrel exports with `index.ts`** at each meaningful directory:

```typescript
// src/domain/ports/index.ts
export { type MemoryStore } from "./memory-store.interface.ts";
export { type SignalBus } from "./signal-bus.interface.ts";

// Consumer:
import { type MemoryStore, type SignalBus } from "@nyx/domain/ports";
```

**Rules:**
- Every directory under `src/` that contains related files gets an `index.ts`
- Path alias: `@nyx/*` → `./src/*`
- Always import from barrel, never from individual files (except within the same directory)
- If circular dependency arises, break the cycle by importing the specific file directly

### Dependency Injection Pattern

**Class-based with constructor injection + typed container factory:**

```typescript
// Port implementation — class implements interface
export class MemoryStoreImpl implements MemoryStore {
  constructor(
    private readonly db: DrizzleClient,
    private readonly logger: Logger,
  ) {}

  async store(memory: Memory): Promise<Result<void>> { ... }
}

// container.ts — pure wiring, no async, no side effects
export function createContainer(deps: InitializedDeps): Container {
  const memoryStore = new MemoryStoreImpl(deps.db, deps.logger);
  // ...
  return { memoryStore, signalBus, ... };
}
```

**Rules:**
- All port implementations are classes with `implements` on the interface — compile-time contract enforcement
- Constructor parameters are `private readonly`
- The `container.ts` composition root is the only file that instantiates implementations
- `container.ts` is pure wiring — takes already-initialized resources, returns typed container. No async, no side effects.
- No service locator pattern, no runtime DI framework — explicit wiring only

### Drizzle ORM Patterns

**Schema location:** `src/infrastructure/database/schema/`

```
src/infrastructure/database/schema/
├── memory.schema.ts        # memories table definition
└── index.ts                # barrel export of all tables
```

**Schema conventions:**
- Table definitions use Drizzle's `pgTable()` with `snake_case` DB names mapped to `camelCase` TypeScript fields
- Vector columns use native `vector()` type with explicit dimensions
- Indexes defined inline in the table definition
- All schemas exported from barrel for drizzle-kit and client usage

**Query conventions:**
- Use Drizzle's built-in `cosineDistance()`, `l2Distance()` helpers — no raw SQL for vector operations
- Use the `sql` template tag only when Drizzle's API genuinely cannot express the query
- Drizzle schema types stay in infrastructure — domain layer uses its own types

**Drizzle-to-domain mapping:**
- Every infrastructure adapter that reads/writes DB has explicit `toDomain()` and `toRow()` mapper functions
- Mappers are private to the adapter file, not shared
- Explicit field mapping — no object spread
- Typed on both sides (Drizzle inferred types → domain entity types)
- All Drizzle calls wrapped in try/catch within the adapter — raw Drizzle errors are caught and wrapped in domain error classes before returning as `Result`

**Migrations:**
- Managed via `drizzle-kit` — generates SQL migrations from schema changes
- Migration files stored in `src/infrastructure/database/migrations/`
- Applied at startup in `init()` before container creation

### Embedding Flow

**The application use case orchestrates embedding, not the memory store adapter.**

```
store-memory.usecase.ts:
  content → embeddingProvider.embed(content) → vector
  content + vector + metadata → memoryStore.store(memory)
```

- `EmbeddingProvider` port (`embedding-provider.interface.ts`) is injected into memory use cases
- `MemoryStore` port receives memories with embeddings already computed
- The memory store adapter never calls the embedding provider — it only stores and queries vectors
- This separation means the embedding model can be swapped without touching the memory store, and vice versa

### Startup & Shutdown Architecture

**Three dedicated entry-layer files with single responsibilities:**

```
src/entry/
├── init.ts                 # Boots everything, returns Container
├── shutdown.ts             # Tears down everything, receives Container
├── heartbeat.ts            # Process entry point — calls init, runs heartbeat, registers shutdown
└── container.ts            # Pure DI wiring — no async, no side effects
```

**Init sequence** (`init.ts`) — sequential, explicit, top-to-bottom:

```typescript
export async function init(): Promise<Container> {
  const config = loadConfig();
  const embeddingModel = await loadEmbeddingModel();
  const db = await connectDatabase(config.database);
  await runMigrations(db);
  const logger = createLogger(config.logging);
  const signalBus = await initSignalBus(config);
  const telegram = await startTelegramListener(config.telegram, signalBus, logger);
  const container = createContainer({ config, db, embeddingModel, logger, signalBus, telegram });
  return container;
}
```

**Rules:**
- `init()` is the only place resources are created and connected
- Sequential — no parallelism. Clarity over speed.
- Any init failure crashes the process — Docker's `restart: unless-stopped` handles recovery
- Returns a fully-wired `Container`

**Shutdown** (`shutdown.ts`) — separate concern:

```typescript
export async function shutdown(container: Container): Promise<void> {
  // Close DB pool, stop Telegram polling, flush logs
}
```

**Process entry point** (`heartbeat.ts`) — orchestrator:

```typescript
const container = await init();

process.on("SIGTERM", () => shutdown(container));
process.on("SIGINT", () => shutdown(container));

startHeartbeat(container);
```

### Test Patterns

**File naming:** `.test.ts`, using `describe`/`it` blocks (bun:test, Jest-compatible API)

**Two-tier testing per adapter:**

```typescript
describe("MemoryStore", () => {
  describe("with mock", () => {
    // Fast, isolated, no external deps
    it("should store a memory", () => { ... });
  });

  describe("with real service", () => {
    // Integration test against real pgvector container
    it("should store and retrieve by similarity", () => { ... });
  });
});
```

**Rules:**
- Domain and application layer tests: always use in-memory port implementations
- Infrastructure tests: mock-first tier + real-service tier in the same file
- Test file location: `tests/` mirrors `src/` structure
- Integration tests requiring Docker services: `tests/integration/`

**Test pragmatism clause:** Implementation patterns define production code rules. Test code may relax these rules when testing demands it — hardcoded test defaults, fixed test vectors, factory helpers, conditional test skipping are all acceptable. Tests optimize for clarity and reliability, not production purity.

### Configuration Pattern

**Single typed config module — no env var prefix:**

```typescript
// src/infrastructure/config.config.ts
export interface AppConfig {
  database: DatabaseConfig;
  telegram: TelegramConfig;
  anthropic: AnthropicConfig;
  logging: LoggingConfig;
  webapp: WebappConfig;
  paths: PathsConfig;     // home, signals, logs — runtime directories
}

export function loadConfig(): AppConfig {
  return {
    database: {
      host: requireEnv("POSTGRES_HOST"),
      port: parseInt(requireEnv("POSTGRES_PORT"), 10),
      // ...
    },
    // ...
  };
}
```

**Rules:**
- All env vars read once at startup in `loadConfig()`
- No env var access anywhere else in the codebase
- No hardcoded defaults in code — defaults in `.env.example` and Docker Compose only
- `requireEnv()` throws on missing required vars (fail fast at boot)
- Config object passed via DI, never imported as a module singleton

### Centralization Principle

**Default: centralize. Exception: Clean Architecture boundaries.**

- Types → centralized in `src/domain/types/` (unless adapter-specific)
- Errors → centralized in `src/domain/errors/`
- Config → single module
- Constants → centralized per domain area
- Drizzle schemas → centralized in `src/infrastructure/database/schema/`
- **Exception:** Infrastructure adapter types stay in infrastructure (Drizzle schema types, Telegram API types) — domain must not know about them

### Enforcement Guidelines

**All AI agents implementing Nyx MUST:**

1. Use the dot-suffix file naming convention with consistent base names — no exceptions
2. Return `Result<T>` from all port methods — never throw across layer boundaries
3. Import from barrel `index.ts` — never from individual files across directories
4. Use `implements` on all port implementation classes
5. Read configuration only from the injected `AppConfig` — never from `process.env`
6. Centralize types in `src/domain/types/` unless Clean Architecture forbids it
7. No `any`, no unnecessary `as`, no `unknown` without immediate narrowing
8. Use Drizzle's native helpers for vector operations — no raw SQL when avoidable
9. Use explicit `toDomain()` / `toRow()` mappers in every DB adapter — no object spread
10. Boot resources only in `init()`, teardown only in `shutdown()` — entry layer owns lifecycle

## Project Structure & Boundaries

### Complete Project Directory Structure

```
nyx/
├── package.json
├── tsconfig.json
├── biome.json
├── bunfig.toml
├── drizzle.config.ts
├── .env.example
├── .gitignore
│
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── memory.entity.ts
│   │   │   ├── signal.entity.ts
│   │   │   ├── skill.entity.ts
│   │   │   ├── session.entity.ts
│   │   │   ├── identity.entity.ts
│   │   │   └── index.ts
│   │   ├── value-objects/
│   │   │   ├── embedding.value-object.ts
│   │   │   ├── significance.value-object.ts
│   │   │   ├── source-type.value-object.ts
│   │   │   ├── retrieval-weights.value-object.ts
│   │   │   ├── session-type.value-object.ts
│   │   │   └── index.ts
│   │   ├── ports/
│   │   │   ├── memory-store.interface.ts
│   │   │   ├── signal-bus.interface.ts
│   │   │   ├── skill-registry.interface.ts
│   │   │   ├── identity-store.interface.ts
│   │   │   ├── session-manager.interface.ts
│   │   │   ├── messenger.interface.ts
│   │   │   ├── embedding-provider.interface.ts
│   │   │   ├── logger.interface.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── memory.type.ts
│   │   │   ├── signal.type.ts
│   │   │   ├── session.type.ts
│   │   │   ├── skill.type.ts
│   │   │   ├── result.type.ts
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── domain.error.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── application/
│   │   ├── heartbeat/
│   │   │   ├── heartbeat-cycle.usecase.ts
│   │   │   ├── daemon-runner.usecase.ts
│   │   │   └── index.ts
│   │   ├── daemons/
│   │   │   ├── consolidator.usecase.ts
│   │   │   ├── pattern-detector.usecase.ts
│   │   │   └── index.ts
│   │   ├── consciousness/
│   │   │   ├── session-bootstrap.usecase.ts
│   │   │   ├── session-lifecycle.usecase.ts
│   │   │   └── index.ts
│   │   ├── memory/
│   │   │   ├── store-memory.usecase.ts
│   │   │   ├── query-memory.usecase.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── schema/
│   │   │   │   ├── memory.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/
│   │   │   │   └── (drizzle-kit generated)
│   │   │   ├── database.config.ts
│   │   │   ├── memory-store.implementation.ts
│   │   │   └── index.ts
│   │   ├── filesystem/
│   │   │   ├── signal-bus.implementation.ts
│   │   │   ├── skill-registry.implementation.ts
│   │   │   ├── identity-store.implementation.ts
│   │   │   └── index.ts
│   │   ├── agent-sdk/
│   │   │   ├── session-manager.implementation.ts
│   │   │   ├── tool-configs.config.ts
│   │   │   ├── prompt-templates.config.ts
│   │   │   └── index.ts
│   │   ├── telegram/
│   │   │   ├── messenger.implementation.ts
│   │   │   ├── telegram-listener.implementation.ts
│   │   │   └── index.ts
│   │   ├── embedding/
│   │   │   ├── embedding-provider.implementation.ts
│   │   │   └── index.ts
│   │   ├── webapp/
│   │   │   ├── static-server.implementation.ts
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── logger.implementation.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── config.config.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── entry/
│       ├── init.ts
│       ├── shutdown.ts
│       ├── heartbeat.ts
│       └── container.ts
│
├── tests/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── memory.test.ts
│   │   └── value-objects/
│   │       └── significance.test.ts
│   ├── application/
│   │   ├── heartbeat/
│   │   │   └── heartbeat-cycle.test.ts
│   │   ├── daemons/
│   │   │   ├── consolidator.test.ts
│   │   │   └── pattern-detector.test.ts
│   │   ├── consciousness/
│   │   │   └── session-lifecycle.test.ts
│   │   └── memory/
│   │       ├── store-memory.test.ts
│   │       └── query-memory.test.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── memory-store.test.ts
│   │   ├── filesystem/
│   │   │   ├── signal-bus.test.ts
│   │   │   ├── skill-registry.test.ts
│   │   │   └── identity-store.test.ts
│   │   └── telegram/
│   │       └── messenger.test.ts
│   ├── integration/
│   │   └── heartbeat-pipeline.test.ts
│   └── factories/
│       ├── memory.factory.ts
│       ├── signal.factory.ts
│       └── index.ts
│
├── seed/
│   ├── identity.md
│   ├── skills/
│   │   ├── system/
│   │   │   ├── memory-recall.md
│   │   │   ├── memory-store.md
│   │   │   ├── telegram-send.md
│   │   │   ├── webapp-deploy.md
│   │   │   ├── identity-update.md
│   │   │   └── reflection.md
│   │   ├── self/
│   │   ├── proto/
│   │   └── skill-index.json
│   └── webapp/
│       └── index.html
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── entrypoint.sh
│
└── home/                          # (Docker volume mount target — not in repo)
    ├── identity.md                # Seeded from seed/identity.md on first boot
    ├── skills/                    # Seeded from seed/skills/ on first boot
    └── webapp/                    # Seeded from seed/webapp/ on first boot
```

### Architectural Boundaries

**Layer Boundaries (Clean Architecture):**

```
┌─────────────────────────────────────────────────┐
│ Entry Layer                                      │
│   init.ts → shutdown.ts → heartbeat.ts           │
│   container.ts (pure wiring)                     │
│   Knows about: ALL layers (composition root)     │
├─────────────────────────────────────────────────┤
│ Application Layer                                │
│   Use cases: heartbeat, daemons, consciousness,  │
│   memory operations                              │
│   Knows about: Domain (ports + entities)         │
│   Does NOT know: Infrastructure implementations  │
├─────────────────────────────────────────────────┤
│ Domain Layer                                     │
│   Entities, value objects, ports, types, errors   │
│   Knows about: NOTHING external                  │
│   Zero dependencies                              │
├─────────────────────────────────────────────────┤
│ Infrastructure Layer                             │
│   Adapters: database, filesystem, agent-sdk,     │
│   telegram, embedding, webapp, logging, config   │
│   Knows about: Domain (implements ports)         │
│   Does NOT know: Application or Entry            │
└─────────────────────────────────────────────────┘
```

**Import rules enforcing boundaries:**
- `@nyx/domain/*` → imports nothing from other `@nyx/` paths
- `@nyx/application/*` → imports only from `@nyx/domain/*`
- `@nyx/infrastructure/*` → imports only from `@nyx/domain/*`
- `@nyx/entry/*` → imports from all layers (it's the composition root)

**Data Boundaries:**

- Domain entities are the canonical data shape — all adapters convert to/from domain entities
- Drizzle schema types never leak outside `src/infrastructure/database/`
- Telegram API types never leak outside `src/infrastructure/telegram/`
- Agent SDK types never leak outside `src/infrastructure/agent-sdk/`

**Process Boundaries:**

- Heartbeat process (`heartbeat.ts`) — main long-running process
- Telegram listener — spawned by `init()`, runs as separate polling loop within the same process
- Daemon sessions — short-lived Agent SDK sessions spawned per heartbeat tick
- Consciousness session — long-lived Agent SDK session, one at a time (lock file enforced)

### Requirements to Structure Mapping

**Memory System (FR1–FR11):**

| FR | File(s) |
|-----|---------|
| FR1 (store memories) | `domain/entities/memory.entity.ts`, `domain/ports/memory-store.interface.ts`, `infrastructure/database/memory-store.implementation.ts`, `infrastructure/database/schema/memory.schema.ts` |
| FR2–FR6 (retrieval modes) | `domain/ports/memory-store.interface.ts` (5 methods), `infrastructure/database/memory-store.implementation.ts`, `application/memory/query-memory.usecase.ts` |
| FR7–FR8 (significance, tags, links) | `domain/value-objects/significance.value-object.ts`, `domain/entities/memory.entity.ts`, `infrastructure/database/memory-store.implementation.ts` |
| FR9 (composite retrieval) | `domain/value-objects/retrieval-weights.value-object.ts`, `application/memory/query-memory.usecase.ts` |
| FR10 (consolidator daemon) | `application/daemons/consolidator.usecase.ts` |
| FR11 (pattern detector daemon) | `application/daemons/pattern-detector.usecase.ts` |

**Consciousness & Sessions (FR12–FR17):**

| FR | File(s) |
|-----|---------|
| FR12 (spawn session) | `application/consciousness/session-bootstrap.usecase.ts`, `infrastructure/agent-sdk/session-manager.implementation.ts` |
| FR13 (full tool access) | `infrastructure/agent-sdk/tool-configs.config.ts` |
| FR14 (no timeout) | `application/consciousness/session-lifecycle.usecase.ts` |
| FR15–FR16 (triggers) | `application/heartbeat/heartbeat-cycle.usecase.ts` |
| FR17 (reflection memories) | Handled within consciousness session via memory tools |

**Autonomic System (FR18–FR24):**

| FR | File(s) |
|-----|---------|
| FR18 (heartbeat interval) | `entry/heartbeat.ts`, `application/heartbeat/heartbeat-cycle.usecase.ts` |
| FR19 (consciousness check) | `application/heartbeat/heartbeat-cycle.usecase.ts`, `domain/ports/session-manager.interface.ts` |
| FR20 (daemon management) | `application/heartbeat/daemon-runner.usecase.ts` |
| FR21 (daemon state check) | `domain/ports/session-manager.interface.ts` (`isConscious()`) |
| FR22 (wake signals) | `domain/ports/signal-bus.interface.ts`, `infrastructure/filesystem/signal-bus.implementation.ts` |
| FR23–FR24 (signal detection) | `application/heartbeat/heartbeat-cycle.usecase.ts` |

**Communication (FR25–FR30):**

| FR | File(s) |
|-----|---------|
| FR25–FR26 (send/receive) | `domain/ports/messenger.interface.ts`, `infrastructure/telegram/messenger.implementation.ts` |
| FR27–FR28 (autonomous initiation) | Handled by consciousness session judgment — not coded as a rule |
| FR29 (message queuing) | `infrastructure/telegram/telegram-listener.implementation.ts`, `infrastructure/filesystem/signal-bus.implementation.ts` |
| FR30 (memory-informed conversation) | Handled within consciousness session via memory tools |

**Self-Expression / Webapp (FR31–FR35):**

| FR | File(s) |
|-----|---------|
| FR31–FR32 (write + deploy) | `seed/skills/system/webapp-deploy.md`, `infrastructure/webapp/static-server.implementation.ts` |
| FR33–FR34 (Playwright feedback) | Handled within consciousness session via Playwright tools |
| FR35 (J views webapp) | `infrastructure/webapp/static-server.implementation.ts` |

**Identity & Development (FR36–FR43):**

| FR | File(s) |
|-----|---------|
| FR36–FR37 (identity read/write) | `domain/ports/identity-store.interface.ts`, `infrastructure/filesystem/identity-store.implementation.ts` |
| FR38–FR39 (skill discovery/load) | `domain/ports/skill-registry.interface.ts`, `infrastructure/filesystem/skill-registry.implementation.ts` |
| FR40 (self-created skills) | Consciousness session + `skill-registry.interface.ts` |
| FR41 (proto-skill promotion) | `infrastructure/filesystem/skill-registry.implementation.ts` (`promoteProtoSkill()`) |
| FR42 (system skill protection) | `infrastructure/agent-sdk/tool-configs.config.ts` (excludes `system/` from write) |
| FR43 (developmental instincts) | `seed/skills/system/reflection.md` and other system skill content |

**Environment & Infrastructure (FR44–FR50):**

| FR | File(s) |
|-----|---------|
| FR44–FR46 (filesystem, code exec, packages) | Agent SDK tool access in consciousness session |
| FR47 (web search/fetch) | Agent SDK tool access in consciousness session |
| FR48 (persistent volumes) | `docker/docker-compose.yml` |
| FR49 (system skill hot-deploy) | Filesystem volume mount + `skill-registry.implementation.ts` |
| FR50 (logging) | `domain/ports/logger.interface.ts`, `infrastructure/logging/logger.implementation.ts` |

### Integration Points

**Internal Communication:**

| From | To | Mechanism |
|------|----|-----------|
| Heartbeat → Daemons | Port call | `SessionManager.spawnDaemon()` |
| Heartbeat → Consciousness | Port call | `SessionManager.spawnConsciousness()` |
| Heartbeat ← Signals | Port call | `SignalBus.readWakeSignals()`, `SignalBus.readTelegramQueue()` |
| Daemons → Memory | Port call | `MemoryStore.store()`, `MemoryStore.recall()` |
| Daemons → Signals | Port call | `SignalBus.writeWakeSignal()` |
| Pattern Detector → Skills | Port call | `SkillRegistry.registerSkill()` |
| Telegram Listener → Queue | Port call | `SignalBus.writeTelegramQueue()` |

**External Integrations:**

| Service | Adapter | Graceful Degradation |
|---------|---------|---------------------|
| Anthropic API | `infrastructure/agent-sdk/` | Log error, skip cycle (NFR16) |
| Telegram API | `infrastructure/telegram/` | Log error, continue (NFR15) |
| PostgreSQL + pgvector | `infrastructure/database/` | Log error, fail gracefully (NFR17) |

**Data Flow — One Heartbeat Tick:**

```
heartbeat.ts
  → init() returns Container
  → heartbeat-cycle.usecase.ts
      → sessionManager.isConscious()? → if yes, skip
      → daemon-runner.usecase.ts
          → consolidator.usecase.ts → memoryStore (read/write)
          → pattern-detector.usecase.ts → memoryStore (read) + skillRegistry (write) + signalBus (write)
      → signalBus.readWakeSignals() → triggers[]
      → signalBus.readTelegramQueue() → triggers[]
      → if triggers: session-bootstrap.usecase.ts
          → identityStore.readIdentity()
          → skillRegistry.listSkills()
          → sessionManager.spawnConsciousness(prompt, tools)
```

### Development Workflow

**Development:**
- `bun run src/entry/heartbeat.ts` — runs directly (Bun native TS)
- `bun test` — runs all `.test.ts` files
- `bunx drizzle-kit generate` — generate migrations from schema changes
- `bunx biome check .` — lint + format check

**Build:**
- `bun build src/entry/heartbeat.ts --target=bun --outdir=dist` — single-file bundle

**Deployment:**
- `docker compose up -d` — starts nyx + postgres
- First boot: `seed/` contents copied to volumes if empty
- Subsequent boots: volumes persist, seeds skipped

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All 15 architectural decisions are mutually compatible. Bun + Drizzle + pgvector + pino + grammY + Biome form a coherent TypeScript-native stack. One compatibility risk flagged: `@xenova/transformers` ONNX native bindings under Bun — fallback strategy documented (Node.js child process).

**Pattern Consistency:**
Dot-suffix naming, barrel exports, DI pattern, Result types, and Drizzle mapping conventions are internally coherent and non-contradictory. All patterns align with the Clean Architecture layer boundaries.

**Structure Alignment:**
The definitive project tree (Step 6) properly reflects all architectural decisions. Old Step 3 tree replaced with reference to avoid ambiguity.

### Requirements Coverage ✅

**Functional Requirements:** 50/50 covered. All FR1–FR50 mapped to specific files in the Requirements to Structure Mapping.

**Non-Functional Requirements:** 17/17 covered.

| NFR Category | Architectural Support |
|---|---|
| Performance (NFR1–5) | HNSW indexing, lean daemon prompts, lazy-load consciousness, API latency accepted |
| Security (NFR6–9) | Config pattern (env vars only), Docker networking, container autonomy |
| Reliability (NFR10–14) | Docker volumes, pino rolling logs, restart policy, crash isolation via Result pattern |
| Integration (NFR15–17) | Result + "log and skip" pattern, per-adapter graceful degradation |

### Implementation Readiness ✅

**Decision Completeness:** 15 decisions documented with rationale and technology choices. All examples use correct technologies (Drizzle, not Kysely).

**Pattern Completeness:** 10 enforcement guidelines cover all critical conflict points. Test pragmatism clause prevents over-rigidity. Embedding flow documented (use case orchestrates, not adapter).

**Structure Completeness:** Every FR maps to specific files. Runtime paths (home, signals, logs) included in AppConfig. Entry layer split (init/shutdown/heartbeat/container) fully specified.

### Definition of Done (Testing)

All domain and application tests pass. All mock-tier infrastructure tests pass. Integration tests pass when run with `RUN_INTEGRATION=true`. Biome reports no errors.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (50 FRs, 17 NFRs)
- [x] Scale and complexity assessed (medium-high, zero scaling burden)
- [x] Technical constraints identified (TypeScript, Agent SDK, pgvector, Docker)
- [x] Cross-cutting concerns mapped (6 concerns addressed)

**✅ Architectural Decisions**
- [x] 15 critical decisions documented with rationale
- [x] Technology stack fully specified (Bun, Drizzle, pino, grammY, Biome)
- [x] Integration patterns defined (port-based, Result type, graceful degradation)
- [x] Performance considerations addressed (HNSW, lean prompts, lazy-load)

**✅ Implementation Patterns**
- [x] Naming conventions established (dot-suffix, camelCase, snake_case DB)
- [x] Type system rules defined (no any, centralized types, strict mode)
- [x] Error handling pattern specified (NyxError + Result<T>)
- [x] DI pattern documented (class-based, constructor injection, typed container)
- [x] Drizzle patterns defined (schema conventions, toDomain/toRow mappers)
- [x] Startup/shutdown architecture specified (init/shutdown/heartbeat separation)
- [x] Test patterns defined (two-tier, describe/it, pragmatism clause)
- [x] Configuration pattern defined (single typed module, no hardcoded defaults)
- [x] Embedding flow documented (use case orchestrates, not adapter)

**✅ Project Structure**
- [x] Complete directory structure with dot-suffix naming
- [x] Clean Architecture layer boundaries enforced via import rules
- [x] All 50 FRs mapped to specific files
- [x] Integration points documented (internal + external)
- [x] Data flow documented (heartbeat tick lifecycle)
- [x] Development workflow defined (dev, build, deploy commands)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Every FR maps to specific files — no ambiguity for implementing agents
- 10 enforcement guidelines prevent agent conflict on naming, typing, error handling, and imports
- Clean Architecture with explicit import rules prevents layer violations
- Result<T> pattern + graceful degradation ensures heartbeat resilience
- Dedicated init/shutdown separation keeps the entry layer clean

**Early Validation Required:**
- Anthropic Agent SDK compatibility with Bun
- `@xenova/transformers` ONNX runtime under Bun (fallback: Node.js child process)

### Implementation Handoff

**Every implementation story MUST reference this architecture document.** The enforcement guidelines in [Implementation Patterns & Consistency Rules](#implementation-patterns--consistency-rules) are mandatory for all code. The project tree in [Project Structure & Boundaries](#project-structure--boundaries) is the definitive file layout.

**First implementation priority:** Project scaffold — create the directory structure, install dependencies, configure TypeScript/Biome/Drizzle, set up Docker Compose, and validate Bun compatibility with Agent SDK and embedding model.

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and layer boundaries
- Use the enforcement guidelines checklist before submitting any story
- When in doubt, this document is the source of truth
