---
stepsCompleted: [1, 2, 3, 4]
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

#### Layer 1 — Domain (`src/domain/`)

Pure TypeScript. Zero external dependencies. Entities, value objects, port interfaces, and domain errors.

```
src/domain/
├── entities/
│   ├── memory.ts              # Memory entity (content, embedding, metadata)
│   ├── signal.ts              # WakeSignal, TelegramSignal entities
│   ├── skill.ts               # Skill entity (system, self-created, proto)
│   ├── session.ts             # Session types (daemon, consciousness)
│   └── identity.ts            # Identity document entity
├── value-objects/
│   ├── embedding.ts           # Vector embedding wrapper
│   ├── significance.ts        # Significance score (0–1, self-assigned)
│   ├── source-type.ts         # conversation | action | reflection | observation
│   ├── retrieval-weights.ts   # Composite query weight configuration
│   └── session-type.ts        # daemon-consolidator | daemon-pattern-detector | consciousness
├── ports/
│   ├── memory-store.ts        # Interface: store, recall, recent, random, revisit, associate, composite
│   ├── signal-bus.ts          # Interface: readWakeSignals, readTelegramQueue, writeWakeSignal, consume
│   ├── skill-registry.ts      # Interface: listSkills, loadSkill, registerSkill, promoteProtoSkill
│   ├── identity-store.ts      # Interface: readIdentity, writeIdentity
│   ├── session-manager.ts     # Interface: spawnDaemon, spawnConsciousness, isConscious
│   ├── messenger.ts           # Interface: sendMessage (Telegram abstracted)
│   └── logger.ts              # Interface: log levels, structured logging contract
└── errors/
    └── domain-errors.ts       # Domain-specific error types
```

#### Layer 2 — Application (`src/application/`)

Use cases and orchestration. Depends only on domain ports.

```
src/application/
├── heartbeat/
│   ├── heartbeat-cycle.ts     # Single heartbeat tick: check state → run daemons → check signals → spawn
│   └── daemon-runner.ts       # Sequential daemon execution with error isolation
├── daemons/
│   ├── consolidator.ts        # Memory consolidation use case (merge, link, strengthen)
│   └── pattern-detector.ts    # Pattern detection use case (find repeated behaviors, write proto-skills)
├── consciousness/
│   ├── session-bootstrap.ts   # Load system prompt + identity doc + trigger context + skill index
│   └── session-lifecycle.ts   # Spawn, monitor, cleanup
└── memory/
    ├── store-memory.ts        # Store a new memory with embedding + metadata
    └── query-memory.ts        # Five retrieval modes + composite query use case
```

#### Layer 3 — Infrastructure (`src/infrastructure/`)

Concrete implementations of domain ports. All external dependencies live here.

```
src/infrastructure/
├── database/
│   ├── pg-memory-store.ts     # Implements MemoryStore port using pg + pgvector
│   ├── pg-client.ts           # Connection pool, query helpers
│   └── migrations/
│       └── 001-create-memories.sql
├── filesystem/
│   ├── fs-signal-bus.ts       # Implements SignalBus port (read/write/consume JSON signal files)
│   ├── fs-skill-registry.ts   # Implements SkillRegistry port (skill index + skill files on disk)
│   └── fs-identity-store.ts   # Implements IdentityStore port (read/write identity.md)
├── agent-sdk/
│   ├── sdk-session-manager.ts # Implements SessionManager port using Anthropic Agent SDK
│   ├── tool-configs.ts        # Tool access configurations per session type
│   └── prompt-templates.ts    # System prompts for daemons + consciousness
├── telegram/
│   ├── telegram-messenger.ts  # Implements Messenger port using Telegram Bot API
│   └── telegram-listener.ts   # Always-on listener, writes to signal bus
├── webapp/
│   └── static-server.ts       # Static file server for Nyx's canvas
└── logging/
    └── structured-logger.ts   # Implements Logger port (structured JSON logs, rolling files)
```

#### Layer 4 — Entry (`src/entry/`)

Composition root. Wires all layers together via dependency injection.

```
src/entry/
├── heartbeat.ts               # Main process: create instances, inject deps, start heartbeat loop
├── telegram-listener.ts       # Separate process: start Telegram polling, write to signal bus
└── container.ts               # DI container / factory — builds all port implementations
```

#### Outside `src/` — Nyx's Living Space + Deployment

```
nyx/
├── src/                       # (layers above)
├── home/                      # Nyx's persistent home (Docker volume)
│   ├── identity.md
│   ├── skills/
│   │   ├── system/            # Protected system skills
│   │   ├── self/              # Nyx-created skills
│   │   ├── proto/             # Proto-skills from Pattern Detector
│   │   └── skill-index.csv
│   └── webapp/                # Nyx-authored HTML/CSS/JS
├── signals/                   # IPC signals (Docker volume)
│   ├── wake/
│   └── telegram/
├── logs/                      # Rolling log files (Docker volume)
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── entrypoint.sh
├── tests/                     # Mirrors src/ layer structure
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── integration/
├── package.json
├── tsconfig.json
├── biome.json
├── bunfig.toml
└── .env.example
```

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

**Database Query Layer:**
- Kysely — type-safe SQL query builder, no ORM overhead
- pgvector operations via Kysely `sql` template tag for similarity search, HNSW index usage
- Connection pooling via Kysely's built-in pool management

**Indexing Strategy:**
- HNSW (Hierarchical Navigable Small World)
- Best recall for small-medium datasets, no training step required
- Single-user data volume makes IVFFlat unnecessary

**Migrations:**
- Kysely migrations — programmatic, version-tracked, rollback support
- Consistent with query layer choice

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
| 4 | Query layer | Kysely (type-safe SQL builder) |
| 5 | Indexing | HNSW |
| 6 | Migrations | Kysely migrations |
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
