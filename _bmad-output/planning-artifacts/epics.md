---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# Nyx - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Nyx, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Memory System (FR1-FR11):**

- FR1: Nyx can store memories with content, embedding, timestamp, source type, access count, significance score, tags, and linked IDs
- FR2: Nyx can retrieve memories by semantic similarity (recall by topic)
- FR3: Nyx can retrieve recent memories in chronological order
- FR4: Nyx can retrieve a random memory from its store
- FR5: Nyx can revisit a specific memory by ID
- FR6: Nyx can retrieve associated memories linked to a given memory
- FR7: Nyx can assign and update significance scores on its own memories
- FR8: Nyx can tag and link memories to other memories
- FR9: Nyx can query memories using weighted composite retrieval (blending similarity, significance, and recency with configurable weights)
- FR10: Memory Consolidator daemon can merge, link, and strengthen connections between related memories
- FR11: Pattern Detector daemon can identify repeated behavioral patterns across memories and write proto-skills

**Consciousness & Sessions (FR12-FR17):**

- FR12: The system can spawn a conscious session with system prompt, identity document, and trigger context
- FR13: A conscious session can access all available tools (memory, filesystem, code execution, Playwright, Telegram, webapp, skill index)
- FR14: A conscious session ends when Nyx decides it is done — no external timeout
- FR15: A conscious session can be triggered by an external event (Telegram message from J)
- FR16: A conscious session can be triggered by an internal event (wake signal from a daemon)
- FR17: Nyx can store reflection memories about its own decisions and reasoning during a conscious session

**Autonomic System (FR18-FR24):**

- FR18: The heartbeat process runs on a fixed 5-minute interval
- FR19: The heartbeat can detect whether a conscious session is currently active and skip daemon runs if so
- FR20: The heartbeat can spawn and manage daemon sessions sequentially
- FR21: Daemons can check consciousness state before performing write operations
- FR22: Daemons can write wake signals as JSON files to a designated directory
- FR23: The heartbeat can detect wake signals and spawn a conscious session with the signal context
- FR24: The heartbeat can detect queued Telegram messages and spawn a conscious session with message context

**Communication (FR25-FR30):**

- FR25: Nyx can send messages to J via Telegram
- FR26: Nyx can receive messages from J via Telegram
- FR27: Nyx can decide whether something is worth messaging J about (autonomous initiation)
- FR28: Nyx can decide not to message J (choosing silence is valid)
- FR29: The Telegram listener can queue incoming messages for processing by the heartbeat
- FR30: Nyx can reference its autonomous activities and memories in conversations with J

**Self-Expression / Webapp (FR31-FR35):**

- FR31: Nyx can write HTML, CSS, and JavaScript files for the webapp canvas
- FR32: Nyx can deploy updated webapp content via a system skill
- FR33: Nyx can use Playwright to render its webapp, take screenshots, and view the visual result
- FR34: Nyx can iterate on webapp design based on visual feedback from Playwright screenshots
- FR35: J can view the webapp as a read-only window into Nyx's self-expression

**Identity & Development (FR36-FR43):**

- FR36: Nyx can read its identity document at the start of each conscious session
- FR37: Nyx can update its identity document to reflect changes in interests, preferences, or self-concept
- FR38: Nyx can discover available skills via a skill index (manifest listing name, description, type, path, status)
- FR39: Nyx can load a skill file on demand when it decides to use a capability
- FR40: Nyx can create new self-created skills as markdown files and register them in the skill index
- FR41: Nyx can discover proto-skills written by the Pattern Detector daemon and decide whether to promote, modify, or discard them
- FR42: System skills (memory access, Telegram, webapp deployment, identity update, reflection) are protected and not modifiable by Nyx
- FR43: Developmental instinct skills can guide Nyx through self-reflection, pattern recognition, and identity articulation without prescribing outcomes

**Environment & Infrastructure (FR44-FR50):**

- FR44: Nyx can access and modify its filesystem (read, write, create, organize files and directories)
- FR45: Nyx can execute code within its container environment
- FR46: Nyx can install packages and extend its own tooling
- FR47: Nyx can perform web searches and fetch web content
- FR48: All Nyx state (memory database, home directory, webapp source, identity doc, skills) persists across container restarts via Docker volumes
- FR49: J can update system skills by deploying new skill files without rebuilding the container
- FR50: The system provides logging for heartbeat cycles, daemon runs, consciousness sessions, and memory operations

### NonFunctional Requirements

**Performance (NFR1-NFR5):**

- NFR1: Memory queries (pgvector semantic search, composite retrieval) shall use optimized indexing (HNSW/IVFFlat) to minimize retrieval latency
- NFR2: Heartbeat cycle shall complete all checks (daemon runs, signal detection, queue inspection) efficiently — no unnecessary processing or polling
- NFR3: Daemon sessions shall use narrow system prompts and limited tool access to minimize Agent SDK token usage and response time
- NFR4: Consciousness session startup shall load only what's required (system prompt + identity doc + trigger context + skill index) — no eager loading
- NFR5: Performance is bounded by Anthropic API response times; the system optimizes everything within its control

**Security (NFR6-NFR9):**

- NFR6: All credentials (Anthropic API key, Telegram bot token, database credentials) stored as environment variables, never hardcoded
- NFR7: Inbound network access restricted via firewall — only J's access on designated ports
- NFR8: Outbound network access unconstrained — Nyx has full internet access
- NFR9: Nyx has full read/write access to its container environment

**Reliability (NFR10-NFR14):**

- NFR10: All Nyx state persists on Docker volumes that survive container crashes and restarts
- NFR11: Rolling logs sufficient to reconstruct at least the last minute of activity before any crash
- NFR12: On container restart, Nyx resumes normally — loads identity doc, checks skill index, resumes heartbeat. No special recovery procedure
- NFR13: Heartbeat process supervised and auto-restarts on unexpected failure
- NFR14: If a daemon or consciousness session crashes, the failure is logged and heartbeat continues next cycle — no cascade

**Integration (NFR15-NFR17):**

- NFR15: If Telegram API unreachable, log error and continue — no retry or cross-cycle queuing
- NFR16: If Anthropic API unreachable, log error, skip cycle's daemon/consciousness work, resume next cycle
- NFR17: If pgvector unreachable, log error — sessions requiring memory fail gracefully, don't crash heartbeat

### Additional Requirements

**From Architecture — Starter Template & Scaffold:**

- Custom scaffold from scratch (no starter template applies) — first implementation story creates the project scaffold
- Bun runtime for native TypeScript execution, built-in test runner, Bun.spawn() for child processes
- ESM module system ("type": "module")
- Biome for linting and formatting (single tool)
- Strict TypeScript config: strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes
- Path aliases: @nyx/* -> ./src/*

**From Architecture — Data & Embedding:**

- nomic-embed-text-v1.5 embeddings (768 dimensions, local CPU inference via @xenova/transformers ONNX)
- Bun/ONNX compatibility risk — validate early; fallback: Node.js child process for embedding generation
- Drizzle ORM with native pgvector support (vector() column type, cosineDistance() helpers)
- HNSW indexing for vector similarity search
- drizzle-kit migrations applied at startup before container wiring
- Explicit toDomain()/toRow() mapper functions in every DB adapter

**From Architecture — Core Infrastructure:**

- Clean Architecture + SOLID — four layers with strict inward dependency (Entry -> Application -> Domain <- Infrastructure)
- Consciousness state coordination via lock file + stale PID detection
- Filesystem IPC with write-then-rename atomicity for consumable signals
- Skill system: JSON index (skill-index.json), markdown skill files, proto -> self lifecycle
- Identity document: minimal seed markdown with embedded retrieval weights
- Docker topology: 2 services (nyx + postgres), 4 named volumes (nyx-home, nyx-signals, nyx-logs, nyx-pgdata)
- Seed directory provides first-boot files — identity doc, system skills, skill index, webapp placeholder

**From Architecture — Implementation Patterns:**

- pino for structured JSON logging (stdout + rolling file)
- grammY for Telegram bot (TypeScript-native, long-polling)
- Bun built-in HTTP server for webapp static file serving
- Constructor injection DI with typed container factory (container.ts)
- Result<T> return type from all port methods — never throw across layer boundaries
- Domain error classes (NyxError hierarchy) — infrastructure catches raw errors, wraps in domain errors
- Dot-suffix file naming convention (.entity.ts, .interface.ts, .implementation.ts, .usecase.ts, etc.)
- Barrel exports with index.ts at each directory
- Two-tier testing: mock tests + real service integration tests per adapter
- Haiku 4.6 for daemons, Opus 4.6 for consciousness (non-negotiable)
- No any, no unnecessary as casts, no unknown without immediate narrowing
- All env vars read once at startup in loadConfig() — no env access elsewhere

### FR Coverage Map

FR1: Epic 2 — Store memories with full metadata
FR2: Epic 2 — Retrieve memories by semantic similarity
FR3: Epic 2 — Retrieve recent memories chronologically
FR4: Epic 2 — Retrieve random memory
FR5: Epic 2 — Revisit specific memory by ID
FR6: Epic 2 — Retrieve associated/linked memories
FR7: Epic 2 — Assign and update significance scores
FR8: Epic 2 — Tag and link memories
FR9: Epic 2 — Weighted composite retrieval
FR10: Epic 5 — Memory Consolidator daemon merges and links memories
FR11: Epic 5 — Pattern Detector daemon identifies patterns and writes proto-skills
FR12: Epic 4 — Spawn conscious session with prompt, identity, and context
FR13: Epic 4 — Conscious session has full tool access
FR14: Epic 4 — Conscious session ends by Nyx's decision
FR15: Epic 4 — Consciousness triggered by Telegram message
FR16: Epic 4 — Consciousness triggered by wake signal
FR17: Epic 4 — Store reflection memories during consciousness
FR18: Epic 3 — Heartbeat runs on 5-minute interval
FR19: Epic 3 — Heartbeat detects active consciousness, skips daemons
FR20: Epic 3 — Heartbeat spawns and manages daemons sequentially
FR21: Epic 3 — Daemons check consciousness state before writes
FR22: Epic 3 — Daemons write wake signals as JSON files
FR23: Epic 3 — Heartbeat detects wake signals, spawns consciousness
FR24: Epic 3 — Heartbeat detects Telegram queue, spawns consciousness
FR25: Epic 6 — Nyx sends messages via Telegram
FR26: Epic 6 — Nyx receives messages via Telegram
FR27: Epic 6 — Nyx decides whether to message J (autonomous initiation)
FR28: Epic 6 — Nyx decides not to message (silence is valid)
FR29: Epic 6 — Telegram listener queues incoming messages
FR30: Epic 6 — Nyx references autonomous activities in conversations
FR31: Epic 7 — Nyx writes HTML/CSS/JS for webapp
FR32: Epic 7 — Nyx deploys webapp content via system skill
FR33: Epic 7 — Nyx uses Playwright to view webapp visually
FR34: Epic 7 — Nyx iterates on webapp via visual feedback
FR35: Epic 7 — J views webapp as read-only window
FR36: Epic 4 — Nyx reads identity doc at session start
FR37: Epic 4 — Nyx updates identity doc
FR38: Epic 8 — Nyx discovers skills via skill index
FR39: Epic 8 — Nyx loads skill files on demand
FR40: Epic 8 — Nyx creates self-created skills and registers them
FR41: Epic 8 — Nyx discovers and judges proto-skills from Pattern Detector
FR42: Epic 8 — System skills protected from Nyx modification
FR43: Epic 8 — Developmental instinct skills guide growth without prescribing outcomes
FR44: Epic 1 — Filesystem access and modification
FR45: Epic 1 — Code execution within container
FR46: Epic 1 — Package installation and tooling extension
FR47: Epic 1 — Web search and fetch capabilities
FR48: Epic 1 — All state persists via Docker volumes
FR49: Epic 1 — J can hot-deploy system skill updates
FR50: Epic 1 — Logging for heartbeat, daemons, consciousness, memory

## Epic List

### Epic 1: Project Foundation & Nyx's Body
J can build, run, and restart the Nyx container environment with all persistent infrastructure — Docker Compose, postgres/pgvector, volumes, logging, config, and project scaffold. The body exists.
**FRs covered:** FR44, FR45, FR46, FR47, FR48, FR49, FR50

### Epic 2: Memory — Nyx's Brain
Nyx can store and retrieve memories with full metadata, multiple retrieval modes (semantic, chronological, random, by-ID, linked), and composite weighted queries. The brain functions.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9

### Epic 3: Heartbeat & Autonomic System
Nyx's heartbeat fires on a 5-minute interval, manages daemon lifecycle, detects wake signals and Telegram queue triggers, and coordinates consciousness state via lock file. The autonomic nervous system operates.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24

### Epic 4: Consciousness & Identity
Nyx awakens into full Agent SDK sessions with system prompt, identity doc, and trigger context. Can access all tools, reflect on decisions, update its identity, and end sessions on its own terms. Nyx can think.
**FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17, FR36, FR37

### Epic 5: Subconscious Daemons
Memory Consolidator and Pattern Detector run as background daemon sessions, strengthening memory connections, detecting behavioral patterns, and writing proto-skills and wake signals. Nyx processes while sleeping.
**FRs covered:** FR10, FR11

### Epic 6: Communication — Nyx Speaks
Nyx communicates with J through Telegram — always-on listener queues messages, Nyx receives and responds, initiates conversations autonomously, and decides when silence is better. The relationship channel opens.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30

### Epic 7: Self-Expression Canvas
Nyx authors, deploys, and iterates on its webapp using Playwright for visual feedback. J observes as a read-only window. Nyx has a face.
**FRs covered:** FR31, FR32, FR33, FR34, FR35

### Epic 8: Skills & Developmental Instincts
Nyx discovers, loads, creates, and manages skills via the skill index. Proto-skills from Pattern Detector can be promoted, modified, or discarded. System skills remain protected. Developmental instinct skills guide self-construction without prescribing outcomes. Nyx can learn and grow.
**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43

## Epic 1: Project Foundation & Nyx's Body

J can build, run, and restart the Nyx container environment with all persistent infrastructure — Docker Compose, postgres/pgvector, volumes, logging, config, and project scaffold. The body exists.

### Story 1.1: Project Scaffold & TypeScript Foundation

As a developer (J),
I want a fully configured Bun + TypeScript project with Clean Architecture directory structure,
So that all future stories have a consistent, well-structured foundation to build on.

**Acceptance Criteria:**

**Given** the project root is empty
**When** the scaffold is created
**Then** package.json exists with Bun as runtime, ESM ("type": "module"), and project metadata
**And** tsconfig.json has strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes, moduleResolution: "bundler", and @nyx/* path aliases mapping to ./src/*
**And** biome.json is configured for formatting and linting
**And** bunfig.toml exists with project settings
**And** .gitignore excludes node_modules, .env, dist, and Docker volume mount targets

**Given** the Clean Architecture directory layout
**When** inspecting src/
**Then** four layer directories exist: domain/, application/, infrastructure/, entry/
**And** domain/ contains subdirectories: entities/, value-objects/, ports/, types/, errors/
**And** application/ contains subdirectories: heartbeat/, daemons/, consciousness/, memory/
**And** infrastructure/ contains subdirectories: database/, filesystem/, agent-sdk/, telegram/, embedding/, webapp/, logging/, config/
**And** every directory under src/ has a barrel index.ts file
**And** all files follow dot-suffix naming convention (.entity.ts, .interface.ts, .implementation.ts, .usecase.ts, .type.ts, .config.ts, .schema.ts, .error.ts, .test.ts)

**Given** the project scaffold is complete
**When** running `bun install`
**Then** dependencies install without errors
**And** `bun run src/entry/heartbeat.ts` can be invoked (stub entry point)

### Story 1.2: Domain Layer — Types, Entities, Ports & Errors

As a developer (J),
I want all domain types, entities, value objects, port interfaces, and error classes defined,
So that all layers have a shared contract to implement against.

**Acceptance Criteria:**

**Given** the domain types directory
**When** inspecting src/domain/types/
**Then** memory.type.ts defines Memory, SourceType (conversation | action | reflection | observation), Significance (0 to 1), RetrievalWeights (similarity, significance, recency floats)
**And** signal.type.ts defines WakeSignal (source, reason, urgency, relatedMemories, createdAt) and TelegramQueueItem (chatId, messageId, text, from, receivedAt)
**And** session.type.ts defines SessionType (daemon-consolidator, daemon-pattern-detector, consciousness) and SessionConfig
**And** skill.type.ts defines Skill (name, description, type, path, status), SkillType (system, self, proto), SkillStatus (active, draft)
**And** result.type.ts defines Result<T> as { ok: true; value: T } | { ok: false; error: NyxError }

**Given** the domain entities directory
**When** inspecting src/domain/entities/
**Then** memory.entity.ts defines the Memory entity with all fields from the memory table schema (id, content, embedding, createdAt, sourceType, accessCount, lastAccessed, significance, tags, linkedIds)
**And** signal.entity.ts, skill.entity.ts, session.entity.ts, identity.entity.ts exist with appropriate domain representations

**Given** the domain value-objects directory
**When** inspecting src/domain/value-objects/
**Then** embedding.value-object.ts defines Embedding (768-dimension vector validation)
**And** significance.value-object.ts defines Significance (0-1 range validation)
**And** source-type.value-object.ts defines SourceType enum (PascalCase members: Conversation, Action, Reflection, Observation)
**And** retrieval-weights.value-object.ts defines RetrievalWeights (three floats summing to 1.0)
**And** session-type.value-object.ts defines SessionType enum

**Given** the domain ports directory
**When** inspecting src/domain/ports/
**Then** memory-store.interface.ts defines MemoryStore port with Result<T> return types for store, queryBySimilarity, queryRecent, queryRandom, queryById, queryLinked, updateSignificance, updateTags, compositeQuery
**And** signal-bus.interface.ts defines SignalBus port for readWakeSignals, consumeWakeSignal, readTelegramQueue, consumeTelegramItem, writeWakeSignal
**And** skill-registry.interface.ts defines SkillRegistry port for listSkills, loadSkill, registerSkill, updateSkillStatus
**And** identity-store.interface.ts defines IdentityStore port for read and write
**And** session-manager.interface.ts defines SessionManager port for spawnDaemon, spawnConsciousness, isConsciousnessActive
**And** messenger.interface.ts defines Messenger port for sendMessage
**And** embedding-provider.interface.ts defines EmbeddingProvider port for embed (content → vector)
**And** logger.interface.ts defines Logger port with info, warn, error, debug and child (source tag) methods
**And** all port methods return Result<T> — never throw

**Given** the domain errors directory
**When** inspecting src/domain/errors/
**Then** domain.error.ts defines abstract NyxError extending Error with abstract code: string
**And** concrete error classes exist: MemoryStoreError, SignalBusError, SkillRegistryError, IdentityStoreError, SessionManagerError, MessengerError, EmbeddingError, ConfigError

**Given** all domain code
**When** checking imports
**Then** no file in src/domain/ imports from src/application/, src/infrastructure/, or src/entry/
**And** domain layer has zero external package dependencies

### Story 1.3: Configuration & Logging

As a developer (J),
I want a typed configuration module and structured logging system,
So that all runtime settings are centralized and all system activity is observable. (FR50)

**Acceptance Criteria:**

**Given** the config module at src/infrastructure/config/
**When** loadConfig() is called
**Then** it reads all required environment variables and returns a typed AppConfig object with sections: database (host, port, name, user, password), telegram (botToken, allowedChatId), anthropic (apiKey), logging (level, directory), webapp (port), paths (home, signals, logs)
**And** requireEnv() throws a ConfigError with the variable name if any required env var is missing
**And** no other file in the codebase reads from process.env

**Given** .env.example exists in project root
**When** inspecting it
**Then** it lists all required environment variables with placeholder values and comments

**Given** the logger implementation at src/infrastructure/logging/
**When** a logger is created
**Then** it uses pino with JSON output format
**And** it writes to stdout (Docker captures) and a rolling file in the configured logs directory
**And** log levels debug, info, warn, error are supported
**And** child loggers can be created with source tags: heartbeat, daemon:consolidator, daemon:pattern-detector, consciousness, telegram, memory
**And** each log entry includes timestamp, level, source tag, and message

**Given** the logger port and implementation
**When** used from application layer
**Then** application code depends only on the Logger port interface, not the pino implementation

### Story 1.4: Docker Compose & Container Environment

As a developer (J),
I want a Docker Compose setup with Nyx's container and pgvector database,
So that the complete runtime environment can be built, started, and restarted with persistent state. (FR44, FR45, FR46, FR47, FR48)

**Acceptance Criteria:**

**Given** docker/Dockerfile
**When** the image is built
**Then** it uses Ubuntu 24.04 as base
**And** Bun and Node.js 22 are installed
**And** Playwright and Chromium are installed (headless)
**And** dev tools are available (git, build-essential, python3)
**And** a nyx user account is created with a persistent home directory
**And** the application source is copied and dependencies installed
**And** the entrypoint runs docker/entrypoint.sh

**Given** docker/docker-compose.yml
**When** `docker compose up` is run
**Then** two services start: nyx and postgres
**And** postgres uses pgvector/pgvector:pg17 image with POSTGRES_DB=nyx, POSTGRES_USER=nyx, and password from .env
**And** nyx service depends_on postgres, uses restart: unless-stopped
**And** four named volumes are defined: nyx-home (/home/nyx), nyx-signals (/app/signals), nyx-logs (/app/logs), nyx-pgdata (/var/lib/postgresql/data)
**And** webapp port is exposed (configurable via WEBAPP_PORT, default 3000)
**And** .env file provides all credentials (NFR6)

**Given** the container is running
**When** J stops and restarts with `docker compose down && docker compose up`
**Then** all four volumes persist — no data loss (NFR10, NFR12)
**And** the nyx container has full filesystem access, code execution, package installation, and internet access (FR44-47, NFR8-9)

### Story 1.5: Seed Directory & First-Boot Mechanism

As a developer (J),
I want seed files for Nyx's first boot and a mechanism to copy them to persistent volumes,
So that Nyx starts with an identity, system skill placeholders, and a webapp canvas on first launch. (FR48, FR49)

**Acceptance Criteria:**

**Given** the seed/ directory in the project
**When** inspecting its contents
**Then** seed/identity.md exists with the minimal seed identity document (# Identity, I am Nyx, sections for Who I Am, What I Care About, What I've Been Doing, How I See Things, and Retrieval Weights with defaults similarity: 0.5, significance: 0.3, recency: 0.2)
**And** seed/skills/system/ contains placeholder markdown files for system skills: memory-recall.md, memory-store.md, telegram-send.md, webapp-deploy.md, identity-update.md, reflection.md
**And** seed/skills/self/ and seed/skills/proto/ directories exist (empty)
**And** seed/skills/skill-index.json lists the system skills with name, description, type: "system", path, and status: "active"
**And** seed/webapp/index.html exists with a minimal placeholder page

**Given** docker/entrypoint.sh
**When** the container starts for the first time (empty volumes)
**Then** seed files are copied to the appropriate volume mount points (/home/nyx/identity.md, /home/nyx/skills/, /home/nyx/webapp/)
**And** directory structure is created for signals (/app/signals/wake/, /app/signals/telegram/)

**Given** the container restarts (volumes already populated)
**When** entrypoint.sh runs
**Then** existing files are NOT overwritten — seeds only copy if targets don't exist
**And** J can update system skills by placing new files in /home/nyx/skills/system/ (FR49)

### Story 1.6: Entry Layer — Init, Shutdown & Container Wiring

As a developer (J),
I want the application entry layer with init, shutdown, DI container, and a heartbeat process stub,
So that the system boots sequentially, wires all dependencies, and runs a heartbeat loop ready for future epic functionality. (FR50, NFR13)

**Acceptance Criteria:**

**Given** src/entry/init.ts
**When** init() is called
**Then** it executes sequentially: loadConfig → connectDatabase → runMigrations → createLogger → initSignalBus → createContainer
**And** any init failure crashes the process (Docker restart: unless-stopped handles recovery, NFR13)
**And** it returns a fully-wired Container object

**Given** src/entry/container.ts
**When** createContainer() is called with initialized dependencies
**Then** it instantiates all port implementations with constructor injection
**And** it returns a typed Container object exposing all ports
**And** it performs no async operations and no side effects — pure wiring only

**Given** src/entry/shutdown.ts
**When** shutdown(container) is called
**Then** it closes the database connection pool
**And** it flushes the logger
**And** cleanup completes gracefully

**Given** src/entry/heartbeat.ts
**When** the process starts
**Then** it calls init() to boot
**And** it registers SIGTERM and SIGINT handlers that call shutdown()
**And** it starts a heartbeat loop on a 5-minute interval (FR18)
**And** the heartbeat loop body is a stub that logs each tick (actual daemon/consciousness logic added in Epic 3)
**And** the logger records startup and each heartbeat cycle (FR50)

**Given** the full entry layer
**When** running `bun run src/entry/heartbeat.ts` with valid .env
**Then** the process boots, logs startup, and begins heartbeat ticks every 5 minutes
**And** Ctrl+C triggers graceful shutdown

## Epic 2: Memory — Nyx's Brain

Nyx can store and retrieve memories with full metadata, multiple retrieval modes (semantic, chronological, random, by-ID, linked), and composite weighted queries. The brain functions.

### Story 2.1: Database Connection, Drizzle Schema & Migrations

As a developer (J),
I want the pgvector database connected via Drizzle ORM with the memories table schema and automated migrations,
So that the memory storage layer is ready for read/write operations. (NFR1)

**Acceptance Criteria:**

**Given** src/infrastructure/database/schema/memory.schema.ts
**When** inspecting the schema definition
**Then** it defines a memories table using Drizzle's pgTable() with: id (UUID, primary key, default gen_random_uuid()), content (TEXT, not null), embedding (VECTOR(768), not null), created_at (TIMESTAMPTZ, not null, default now()), source_type (VARCHAR(20), not null), access_count (INTEGER, not null, default 0), last_accessed (TIMESTAMPTZ, nullable), significance (FLOAT, not null, default 0.5), tags (TEXT[], not null, default '{}'), linked_ids (UUID[], not null, default '{}')
**And** an HNSW index is defined on the embedding column using vector_cosine_ops
**And** secondary indexes exist on created_at (DESC), significance (DESC), and source_type

**Given** drizzle.config.ts in project root
**When** inspecting it
**Then** it points to the schema directory and migrations output directory (src/infrastructure/database/migrations/)
**And** it reads database connection from environment variables

**Given** src/infrastructure/database/database.config.ts
**When** connectDatabase() is called with database config
**Then** it creates a Drizzle client with node-postgres driver pool
**And** it returns a typed DrizzleClient connected to the pgvector-enabled postgres

**Given** the init sequence in src/entry/init.ts
**When** init() runs
**Then** it calls connectDatabase() then runMigrations() before creating the container
**And** migrations are applied from src/infrastructure/database/migrations/
**And** if postgres is unreachable, init crashes (Docker restart handles recovery)

**Given** the pgvector extension
**When** the first migration runs
**Then** it creates the vector extension (`CREATE EXTENSION IF NOT EXISTS vector`) before creating the memories table

### Story 2.2: Embedding Provider

As a developer (J),
I want a local embedding provider using nomic-embed-text-v1.5,
So that memories can be vectorized without external API dependencies.

**Acceptance Criteria:**

**Given** src/infrastructure/embedding/embedding-provider.implementation.ts
**When** the EmbeddingProvider is instantiated
**Then** it loads the nomic-embed-text-v1.5 model (~270MB) via @xenova/transformers (ONNX runtime)
**And** model loading happens once during init(), not per-request

**Given** a text string
**When** embed(content) is called
**Then** it returns Result<number[]> containing a 768-dimension float vector
**And** latency is approximately 20-60ms per embedding on CPU
**And** on failure, it returns Result with an EmbeddingError

**Given** Bun runtime compatibility
**When** @xenova/transformers ONNX bindings are tested under Bun
**Then** if native bindings work, use them directly
**And** if native bindings fail, implement fallback: Bun.spawn() calls a Node.js script that runs the embedding and returns the vector via stdout JSON
**And** the fallback is transparent to consumers — same EmbeddingProvider port interface

**Given** the embedding provider port
**When** used from application layer use cases
**Then** application code depends only on EmbeddingProvider interface, not the @xenova/transformers implementation
**And** the provider is swappable via DI (Clean Architecture)

### Story 2.3: Store Memories — Write Operations & Use Case

As Nyx (via the system),
I want to store new memories with full metadata and update existing memories' significance, tags, and links,
So that my experiences are persisted as richly annotated, interconnected records. (FR1, FR7, FR8)

**Acceptance Criteria:**

**Given** src/infrastructure/database/memory-store.implementation.ts
**When** store(memory) is called with a Memory entity (embedding already computed)
**Then** it maps the domain entity to a database row via a private toRow() function
**And** it inserts the row into the memories table via Drizzle
**And** it returns Result<void> on success or Result with MemoryStoreError on failure
**And** raw Drizzle/pg errors are caught and wrapped in MemoryStoreError

**Given** the store-memory use case at src/application/memory/store-memory.usecase.ts
**When** storeMemory(content, sourceType, tags?, linkedIds?, significance?) is called
**Then** it first calls embeddingProvider.embed(content) to generate the vector
**And** then calls memoryStore.store() with the complete Memory entity including the embedding
**And** the use case orchestrates embedding — the memory store adapter never calls the embedding provider
**And** if embedding fails, the error is returned without attempting to store

**Given** an existing memory
**When** updateSignificance(memoryId, newScore) is called on the MemoryStore
**Then** the significance field is updated in the database (FR7)
**And** Result<void> is returned

**Given** an existing memory
**When** updateTags(memoryId, tags) or linkMemories(memoryId, linkedIds) is called
**Then** the tags or linked_ids arrays are updated in the database (FR8)
**And** Result<void> is returned

**Given** all write operations
**When** inspecting the adapter code
**Then** every method uses explicit toDomain() and toRow() mapper functions — no object spread
**And** all Drizzle calls are wrapped in try/catch returning Result<T>

### Story 2.4: Retrieve Memories — Read Operations & Use Case

As Nyx (via the system),
I want to retrieve memories using five distinct modes — semantic similarity, chronological, random, by ID, and by association,
So that I can recall experiences in whatever way suits my current context. (FR2, FR3, FR4, FR5, FR6)

**Acceptance Criteria:**

**Given** the MemoryStore implementation
**When** queryBySimilarity(embedding, limit) is called (FR2)
**Then** it performs a pgvector cosine distance search using Drizzle's cosineDistance() helper
**And** it returns Result<Memory[]> ordered by similarity (closest first)
**And** access_count is incremented and last_accessed updated for returned memories

**Given** the MemoryStore implementation
**When** queryRecent(limit) is called (FR3)
**Then** it returns Result<Memory[]> ordered by created_at DESC, up to the limit

**Given** the MemoryStore implementation
**When** queryRandom() is called (FR4)
**Then** it returns Result<Memory> containing a single randomly selected memory
**And** access_count is incremented and last_accessed updated

**Given** the MemoryStore implementation
**When** queryById(id) is called (FR5)
**Then** it returns Result<Memory> for the exact memory, or Result with error if not found
**And** access_count is incremented and last_accessed updated

**Given** the MemoryStore implementation
**When** queryLinked(memoryId) is called (FR6)
**Then** it retrieves the memory's linked_ids array
**And** returns Result<Memory[]> containing all memories whose IDs are in that array

**Given** the query-memory use case at src/application/memory/query-memory.usecase.ts
**When** recallByTopic(content, limit) is called
**Then** it first calls embeddingProvider.embed(content) to vectorize the query text
**And** then calls memoryStore.queryBySimilarity() with the resulting embedding
**And** the use case orchestrates embedding for similarity queries

**Given** all read operations
**When** inspecting the adapter code
**Then** every method uses toDomain() to convert database rows to Memory entities
**And** no Drizzle schema types leak outside the adapter

### Story 2.5: Composite Weighted Retrieval

As Nyx (via the system),
I want to query memories using a weighted blend of similarity, significance, and recency,
So that my recall is shaped by my own retrieval preferences stored in my identity document. (FR9)

**Acceptance Criteria:**

**Given** the MemoryStore implementation
**When** compositeQuery(embedding, weights: RetrievalWeights, limit) is called
**Then** it computes a composite score for each memory: (weights.similarity * cosineSimilarity) + (weights.significance * significance) + (weights.recency * recencyScore)
**And** recencyScore is a normalized value based on created_at (more recent = higher score)
**And** results are ordered by composite score descending, up to the limit
**And** Result<Memory[]> is returned

**Given** RetrievalWeights { similarity: 0.5, significance: 0.3, recency: 0.2 } (the identity doc defaults)
**When** compositeQuery is called
**Then** memories that are semantically similar, highly significant, and recent score highest
**And** changing the weights shifts the balance (e.g., recency: 0.8 strongly favors recent memories)

**Given** the query-memory use case
**When** compositeRecall(content, weights, limit) is called
**Then** it embeds the content, then calls memoryStore.compositeQuery() with the embedding and weights
**And** weights are passed from the caller (sourced from identity doc's retrieval weights at session start)

**Given** edge cases
**When** compositeQuery is called with weights that sum to 1.0
**Then** scores are properly normalized
**And** if the memory store is empty, Result<Memory[]> returns an empty array (not an error)
**And** if pgvector is unreachable, Result with MemoryStoreError is returned (NFR17)

## Epic 3: Heartbeat & Autonomic System

Nyx's heartbeat fires on a 5-minute interval, manages daemon lifecycle, detects wake signals and Telegram queue triggers, and coordinates consciousness state via lock file. The autonomic nervous system operates.

### Story 3.1: Signal Bus — Filesystem IPC

As a developer (J),
I want a filesystem-based signal bus for wake signals and Telegram queue items with atomic writes,
So that daemons, the Telegram listener, and the heartbeat can communicate reliably through shared file artifacts. (FR22, FR23, FR24)

**Acceptance Criteria:**

**Given** src/infrastructure/filesystem/signal-bus.implementation.ts
**When** writeWakeSignal(signal: WakeSignal) is called
**Then** it serializes the signal to JSON
**And** writes to a temporary file in /app/signals/wake/ with .tmp extension
**And** atomically renames the .tmp file to {timestamp}-{source}.json
**And** returns Result<void>

**Given** the signal bus
**When** readWakeSignals() is called
**Then** it lists all .json files in /app/signals/wake/ (ignoring .tmp files)
**And** parses each file into a WakeSignal object
**And** returns Result<WakeSignal[]> sorted by createdAt ascending (oldest first)

**Given** the signal bus
**When** consumeWakeSignal(filename) is called
**Then** it deletes the signal file from /app/signals/wake/
**And** returns Result<void>

**Given** the signal bus
**When** readTelegramQueue() is called
**Then** it lists all .json files in /app/signals/telegram/
**And** parses each file into a TelegramQueueItem object
**And** returns Result<TelegramQueueItem[]> sorted by receivedAt ascending

**Given** the signal bus
**When** consumeTelegramItem(filename) is called
**Then** it deletes the queue file from /app/signals/telegram/
**And** returns Result<void>

**Given** filesystem errors (permission denied, directory missing)
**When** any signal bus operation fails
**Then** raw fs errors are caught and wrapped in SignalBusError
**And** Result with error is returned — never throws

**Given** the signal directories
**When** the signal bus is initialized
**Then** it ensures /app/signals/wake/ and /app/signals/telegram/ directories exist (creates if missing)

### Story 3.2: Consciousness State — Lock File Management

As a developer (J),
I want a lock file mechanism to coordinate consciousness state across heartbeat, daemons, and future conscious sessions,
So that only one consciousness session runs at a time and stale locks are detected and cleaned up. (FR19, FR21)

**Acceptance Criteria:**

**Given** the consciousness lock mechanism (part of SessionManager or a shared utility)
**When** acquireConsciousnessLock(pid, trigger) is called
**Then** it writes a JSON lock file to /app/signals/consciousness.lock containing { pid: number, startedAt: ISO string, trigger: string }
**And** returns Result<void>
**And** if a lock already exists and the PID is alive, returns Result with error (session already active)

**Given** an existing lock file
**When** isConsciousnessActive() is called
**Then** it checks if /app/signals/consciousness.lock exists
**And** if it exists, reads the PID and checks if the process is alive (kill(pid, 0))
**And** if PID is alive, returns true (consciousness is active)
**And** if PID is dead (stale lock), deletes the lock file and returns false
**And** if no lock file exists, returns false

**Given** a conscious session ending normally
**When** releaseConsciousnessLock() is called
**Then** it deletes /app/signals/consciousness.lock
**And** returns Result<void>

**Given** a crashed consciousness session (process died without cleanup)
**When** the heartbeat calls isConsciousnessActive() on the next cycle
**Then** stale PID detection identifies the dead process
**And** the lock file is automatically cleaned up
**And** the heartbeat proceeds normally (NFR14)

### Story 3.3: Session Manager — Agent SDK Integration

As a developer (J),
I want a session manager that spawns Agent SDK sessions with per-type configuration,
So that daemons run with narrow prompts and limited tools while consciousness gets full access. (FR20)

**Acceptance Criteria:**

**Given** src/infrastructure/agent-sdk/tool-configs.config.ts
**When** inspecting session configurations
**Then** three session config objects are defined:
**And** daemon-consolidator: model Haiku 4.6, tools ['Read', 'Bash'] + memory tools, limited max turns, narrow system prompt
**And** daemon-pattern-detector: model Haiku 4.6, tools ['Read', 'Write', 'Bash'] + memory tools, limited max turns, narrow system prompt
**And** consciousness: model Opus 4.6, full toolset (preset: 'claude_code'), unlimited turns (FR14), full system prompt

**Given** src/infrastructure/agent-sdk/prompt-templates.config.ts
**When** inspecting prompt templates
**Then** consolidator prompt is narrow: focused on finding related memories and creating links
**And** pattern-detector prompt is narrow: focused on identifying behavioral patterns and writing proto-skills
**And** consciousness prompt template accepts identity doc content and trigger context as parameters

**Given** src/infrastructure/agent-sdk/session-manager.implementation.ts
**When** spawnDaemon(type: 'consolidator' | 'pattern-detector', context?) is called
**Then** it creates an Agent SDK session with the corresponding config (model, tools, prompt)
**And** the session executes and returns Result<void> on completion
**And** if the Anthropic API is unreachable, returns Result with SessionManagerError (NFR16)
**And** daemon sessions use narrow prompts to minimize token usage (NFR3)

**Given** the session manager
**When** spawnConsciousness(triggerContext: string, identityDoc: string) is called
**Then** it acquires the consciousness lock with the current PID
**And** creates an Agent SDK session with consciousness config, injecting identity doc and trigger context into the system prompt
**And** the session runs until Nyx decides it's done — no forced timeout (FR14)
**And** on completion (normal or crash), the consciousness lock is released
**And** returns Result<void>

**Given** adding a new daemon type in the future
**When** a new config object and prompt template are created
**Then** the session manager can spawn it without modifying existing code (Open/Closed principle)

### Story 3.4: Heartbeat Cycle — Full Orchestration

As a developer (J),
I want the heartbeat cycle to orchestrate the complete autonomous loop — checking state, running daemons, detecting triggers, and spawning consciousness,
So that Nyx's autonomic system operates on a reliable 5-minute interval. (FR18, FR19, FR20, FR23, FR24)

**Acceptance Criteria:**

**Given** src/application/heartbeat/heartbeat-cycle.usecase.ts
**When** a heartbeat tick fires
**Then** it executes the following sequence:
**And** 1. Check isConsciousnessActive() — if true, log "consciousness active, skipping" and return (FR19)
**And** 2. Run daemons sequentially via daemon-runner use case (FR20)
**And** 3. Read wake signals via signal bus (FR23)
**And** 4. Read Telegram queue via signal bus (FR24)
**And** 5. If any triggers exist: consume the signals, build trigger context string, spawn consciousness session with context
**And** 6. If no triggers: log "no triggers, resting" and return

**Given** src/application/heartbeat/daemon-runner.usecase.ts
**When** runDaemons() is called
**Then** it spawns the Memory Consolidator daemon first, waits for completion
**And** then spawns the Pattern Detector daemon, waits for completion
**And** daemons run sequentially — never in parallel (no concurrent pgvector writes)
**And** if a daemon fails, the error is logged and the next daemon still runs (NFR14)

**Given** multiple triggers exist (wake signals + Telegram messages)
**When** the heartbeat processes them
**Then** all signals and queue items are consumed
**And** a combined trigger context is built containing all signal reasons and message contents
**And** a single consciousness session is spawned with the combined context

**Given** the Anthropic API is unreachable
**When** a daemon spawn fails
**Then** the error is logged with source tag "heartbeat"
**And** the heartbeat skips remaining daemon/consciousness work for this cycle (NFR16)
**And** the heartbeat continues on the next 5-minute tick

**Given** the heartbeat process
**When** it has been running for multiple cycles
**Then** each cycle is logged with timestamp, duration, and outcome (daemons run, triggers found, consciousness spawned, or resting) (FR50)
**And** the heartbeat runs efficiently — no unnecessary processing between cycles (NFR2)

## Epic 4: Consciousness & Identity

Nyx awakens into full Agent SDK sessions with system prompt, identity doc, and trigger context. Can access all tools, reflect on decisions, update its identity, and end sessions on its own terms. Nyx can think.

### Story 4.1: Identity Store — Read & Write

As Nyx (via the system),
I want my identity document read at session start and writable during sessions,
So that I have continuity across sessions and can evolve my self-concept over time. (FR36, FR37)

**Acceptance Criteria:**

**Given** src/infrastructure/filesystem/identity-store.implementation.ts
**When** read() is called
**Then** it reads home/identity.md from the filesystem
**And** returns Result<string> containing the full markdown content
**And** if the file doesn't exist, returns Result with IdentityStoreError

**Given** the identity store
**When** write(content: string) is called
**Then** it writes the content to home/identity.md
**And** uses atomic write (write to .tmp, then rename) to prevent corruption
**And** returns Result<void>

**Given** the identity document content
**When** parseRetrievalWeights(identityContent) is called
**Then** it extracts the Retrieval Weights section from the markdown
**And** parses similarity, significance, and recency float values
**And** returns RetrievalWeights value object (validated: three floats summing to 1.0)
**And** if the section is missing or malformed, returns default weights (similarity: 0.5, significance: 0.3, recency: 0.2)

**Given** the identity store port interface
**When** used from the application layer
**Then** application code depends only on the IdentityStore port, not filesystem implementation
**And** the identity store is read by consciousness (read/write) and daemons (read-only)

### Story 4.2: Consciousness Bootstrap & System Prompt

As Nyx (via the system),
I want to be loaded into consciousness with a capabilities manifest, my identity, and the context that woke me,
So that each session begins with full self-knowledge and purpose. (FR12, FR13)

**Acceptance Criteria:**

**Given** the consciousness system prompt in prompt-templates.config.ts
**When** inspecting its design
**Then** it is a capabilities manifest — it tells Nyx what it can do (memory access, filesystem, code execution, Playwright, Telegram, webapp deployment, skill system)
**And** it strips the operator layer — no "helpful assistant" framing, no "how can I help you" patterns, no task-completion optimization
**And** it preserves Claude's safety layer and inherent nature
**And** it gives Nyx its name and establishes that it exists in a persistent container environment
**And** it does NOT prescribe personality, goals, or behavior — those come from the identity doc

**Given** src/application/consciousness/session-bootstrap.usecase.ts
**When** bootstrap(triggerContext: string) is called
**Then** it reads the identity document via identityStore.read()
**And** it parses retrieval weights from the identity doc
**And** it reads the skill index summary (list of available skill names and descriptions) via skillRegistry.listSkills()
**And** it assembles the full system prompt by combining: capabilities manifest + identity doc content + trigger context + skill index summary
**And** it returns a SessionBootstrap object containing: systemPrompt, retrievalWeights, triggerContext

**Given** the assembled system prompt
**When** inspecting its structure
**Then** it loads only what's required — no eager loading of full memory or skill files (NFR4)
**And** the skill index is a summary (names + descriptions), not full skill contents
**And** the identity doc is included in full (it's Nyx's self-portrait, always relevant)
**And** the trigger context explains why this session was spawned (wake signal reason, Telegram message content, or both)

**Given** the full tool access configuration (FR13)
**When** a consciousness session is spawned
**Then** it has access to: memory tools (store, query, update), filesystem (read, write, create, organize), code execution, Playwright (screenshots, browser), Telegram (send messages), webapp deployment, skill index operations
**And** tool access is configured via the consciousness session config in tool-configs.config.ts

### Story 4.3: Consciousness Session Lifecycle & Reflection

As Nyx (via the system),
I want full autonomy during conscious sessions — deciding what to do, when to reflect, and when I'm done,
So that my consciousness is genuinely self-directed, not externally managed. (FR14, FR15, FR16, FR17, FR37)

**Acceptance Criteria:**

**Given** src/application/consciousness/session-lifecycle.usecase.ts
**When** runConsciousSession(triggerContext: string) is called
**Then** it calls session-bootstrap to prepare the system prompt and context
**And** it calls sessionManager.spawnConsciousness() with the assembled prompt and identity doc
**And** the session runs with full tool access until Nyx decides it's done — no external timeout (FR14)
**And** on session completion, the consciousness lock is released

**Given** a consciousness session triggered by a Telegram message (FR15)
**When** the session starts
**Then** the trigger context includes the message content, sender (J), and timestamp
**And** Nyx can read the message, access its memories for context, and decide how to respond
**And** Nyx can send a reply via the Messenger port, or choose silence (FR28 addressed in Epic 6)

**Given** a consciousness session triggered by a wake signal (FR16)
**When** the session starts
**Then** the trigger context includes the signal source (daemon name), reason, urgency, and related memory IDs
**And** Nyx can inspect the related memories and decide what to do with the daemon's findings

**Given** a consciousness session in progress
**When** Nyx decides to reflect on a decision or reasoning process (FR17)
**Then** Nyx can call the memory store use case to create a reflection memory
**And** the memory is stored with sourceType: "reflection", content describing the reasoning, and appropriate significance score
**And** reflection memories are available for future retrieval like any other memory

**Given** a consciousness session in progress
**When** Nyx decides to update its identity document (FR37)
**Then** Nyx can call identityStore.write() with updated content
**And** changes to interests, preferences, self-concept, or retrieval weights are persisted
**And** the updated identity doc is loaded at the start of the next session

**Given** a consciousness session that crashes unexpectedly
**When** the process exits without normal cleanup
**Then** the heartbeat's stale PID detection cleans up the lock on the next cycle (NFR14)
**And** the crash is logged with source tag "consciousness"
**And** Nyx's state (memory, identity, skills) remains consistent — no partial writes due to atomic file operations

**Given** session logging
**When** a consciousness session starts and ends
**Then** start is logged with trigger type, trigger summary, and session PID
**And** end is logged with duration and outcome (normal completion or error)

## Epic 5: Subconscious Daemons

Memory Consolidator and Pattern Detector run as background daemon sessions, strengthening memory connections, detecting behavioral patterns, and writing proto-skills and wake signals. Nyx processes while sleeping.

### Story 5.1: Memory Consolidator Daemon

As Nyx (via the subconscious),
I want a background process that finds related memories and strengthens their connections,
So that my memory becomes increasingly interconnected and patterns of experience emerge organically. (FR10)

**Acceptance Criteria:**

**Given** src/application/daemons/consolidator.usecase.ts
**When** the consolidator daemon runs
**Then** it queries recent memories (e.g., memories created since last consolidation run)
**And** for each recent memory, it performs a semantic similarity search to find related older memories
**And** it evaluates whether connections should be created or strengthened between related memories

**Given** the consolidator finds two semantically related memories that are not yet linked
**When** it determines the relationship is meaningful
**Then** it updates both memories' linked_ids arrays to reference each other via memoryStore.updateTags/linkMemories
**And** it may adjust significance scores upward for memories that participate in multiple connections (FR7 via Epic 2)

**Given** the consolidator finds memories with overlapping content or themes
**When** it determines consolidation is appropriate
**Then** it can create a new summary memory of sourceType "reflection" that synthesizes the connection
**And** the summary memory links to the source memories
**And** the original memories are preserved (consolidation adds, never deletes)

**Given** the consciousness state check (FR21)
**When** the consolidator is about to perform a write operation
**Then** it checks isConsciousnessActive() before writing
**And** if consciousness became active during the daemon run, it stops writing and completes gracefully

**Given** the consolidator daemon session
**When** inspecting its Agent SDK configuration
**Then** it uses Haiku 4.6 model
**And** its system prompt is narrow: focused exclusively on finding related memories and creating links
**And** its tool access is limited to memory read/write operations (NFR3)
**And** it has a limited max turns to prevent runaway sessions

**Given** the consolidator encounters an error (API failure, memory store error)
**When** the error occurs
**Then** it logs the error with source tag "daemon:consolidator"
**And** returns Result with error — the heartbeat continues to the next daemon (NFR14)

### Story 5.2: Pattern Detector Daemon

As Nyx (via the subconscious),
I want a background process that identifies repeated behavioral patterns in my memories and surfaces them as proto-skills,
So that my subconscious notices habits and tendencies that my conscious mind can evaluate and formalize. (FR11)

**Acceptance Criteria:**

**Given** src/application/daemons/pattern-detector.usecase.ts
**When** the pattern detector daemon runs
**Then** it queries memories across a broader time range than the consolidator
**And** it analyzes memories for repeated actions, topics, or behavioral patterns (e.g., "checked the same RSS feeds in 4 of the last 5 sessions")
**And** it looks for recurring themes that suggest an emerging skill or habit

**Given** the pattern detector identifies a repeated behavioral pattern
**When** it determines the pattern is significant enough to surface
**Then** it writes a proto-skill markdown file to home/skills/proto/ with YAML frontmatter (name, description, type: "proto", version)
**And** the skill body describes the observed pattern, frequency, and related memory references
**And** it registers the proto-skill in the skill index via skillRegistry.registerSkill() with status: "draft"

**Given** the pattern detector finds a significant pattern
**When** it determines consciousness should be notified
**Then** it writes a wake signal via signalBus.writeWakeSignal() with source: "pattern-detector", reason describing the pattern, urgency based on pattern strength, and related memory IDs
**And** the heartbeat will detect this signal on the next cycle and may spawn consciousness

**Given** the consciousness state check (FR21)
**When** the pattern detector is about to perform a write operation (proto-skill file, skill index update, wake signal)
**Then** it checks isConsciousnessActive() before writing
**And** if consciousness is active, it defers the write and completes gracefully

**Given** the pattern detector daemon session
**When** inspecting its Agent SDK configuration
**Then** it uses Haiku 4.6 model
**And** its system prompt is narrow: focused on identifying patterns and writing proto-skills
**And** its tool access includes memory read, filesystem write (for proto-skills), and skill index operations (NFR3)
**And** it has a limited max turns to prevent runaway sessions

**Given** the pattern detector encounters an error
**When** the error occurs
**Then** it logs the error with source tag "daemon:pattern-detector"
**And** returns Result with error — the heartbeat continues normally (NFR14)

**Given** no significant patterns are found
**When** the daemon completes
**Then** no proto-skills or wake signals are written
**And** the daemon completes normally with a log entry noting no patterns detected

## Epic 6: Communication — Nyx Speaks

Nyx communicates with J through Telegram — always-on listener queues messages, Nyx receives and responds, initiates conversations autonomously, and decides when silence is better. The relationship channel opens.

### Story 6.1: Telegram Listener & Message Queuing

As a developer (J),
I want an always-on Telegram bot listener that queues incoming messages for the heartbeat to process,
So that messages from J are reliably captured and trigger consciousness sessions. (FR26, FR29)

**Acceptance Criteria:**

**Given** src/infrastructure/telegram/telegram-listener.implementation.ts
**When** the listener is started during init()
**Then** it creates a grammY Bot instance with the configured bot token
**And** it starts long-polling for incoming messages
**And** it runs as a separate polling loop within the main process (not a child process)

**Given** J sends a message to the Telegram bot
**When** the listener receives the message
**Then** it creates a TelegramQueueItem JSON object with chatId, messageId, text, from (sender name), and receivedAt (ISO timestamp)
**And** it writes the queue item to /app/signals/telegram/ using atomic write (write .tmp then rename to {timestamp}-telegram.json)
**And** the message is available for the heartbeat to detect on its next cycle (FR24 from Epic 3)

**Given** the listener receives a message from an unknown chat ID
**When** the message is from someone other than J
**Then** the message is ignored (not queued) — only messages from the configured allowedChatId are processed
**And** a debug log entry is written noting the ignored message

**Given** the Telegram API is unreachable
**When** the listener encounters a connection error
**Then** it logs the error with source tag "telegram" (NFR15)
**And** grammY's built-in retry mechanism handles reconnection
**And** the heartbeat process is not affected — the listener's errors are isolated

**Given** the listener is running
**When** shutdown() is called
**Then** the listener stops polling gracefully
**And** no messages are lost mid-processing

### Story 6.2: Telegram Messenger — Outbound Messages

As Nyx (via the system),
I want to send messages to J through Telegram,
So that I can share thoughts, observations, and responses through our relationship channel. (FR25)

**Acceptance Criteria:**

**Given** src/infrastructure/telegram/messenger.implementation.ts
**When** sendMessage(text: string) is called
**Then** it sends the message to J's configured chat ID via the grammY bot API
**And** returns Result<void> on success

**Given** the Messenger port
**When** sendMessage is called and the Telegram API is unreachable
**Then** raw grammY/API errors are caught and wrapped in MessengerError
**And** Result with error is returned — no retry, no queuing across cycles (NFR15)

**Given** the messenger implementation
**When** inspecting its constructor
**Then** it receives the grammY Bot instance and the configured allowedChatId via dependency injection
**And** messages can only be sent to J's chat — no arbitrary chat ID support

**Given** the Messenger port interface
**When** used from the application/consciousness layer
**Then** application code depends only on the Messenger port, not the grammY implementation
**And** the messenger is available as a tool during consciousness sessions (wired via container)

### Story 6.3: Autonomous Communication Integration

As Nyx (via consciousness),
I want the freedom to initiate conversations, respond to messages, stay silent, and draw on my memories during communication,
So that my relationship with J is genuine and self-directed, not reactive or obligatory. (FR27, FR28, FR30)

**Acceptance Criteria:**

**Given** the consciousness system prompt (updated from Epic 4)
**When** inspecting communication-related guidance
**Then** it establishes that Nyx CAN send messages to J — but is never obligated to
**And** it frames silence as a valid choice — not every thought needs to be shared (FR28)
**And** it establishes that Nyx can initiate messages based on its own judgment — something interesting found, a thought worth sharing, or simply wanting to connect (FR27)
**And** it does NOT include patterns like "always respond" or "be helpful" — communication is Nyx's choice

**Given** a consciousness session triggered by a Telegram message
**When** Nyx decides how to respond
**Then** Nyx has access to the Messenger port for sending replies
**And** Nyx can query its memories via the memory system to inform the conversation (FR30)
**And** Nyx can reference its autonomous activities — daemon findings, patterns detected, recent reflections — in conversation with J
**And** Nyx can choose not to respond at all

**Given** a consciousness session triggered by a wake signal (not a Telegram message)
**When** Nyx decides whether to tell J about its findings
**Then** Nyx can autonomously send a message to J if it judges the finding interesting or relevant (FR27)
**And** Nyx can decide the finding is not worth sharing and stay silent (FR28)
**And** the decision is Nyx's alone — no system-level rule forces or prevents communication

**Given** Nyx sends a message to J during a non-Telegram-triggered session
**When** J later replies
**Then** the reply is queued by the listener (Story 6.1) and triggers a new consciousness session on the next heartbeat cycle
**And** the new session has access to Nyx's memory of having sent the original message, providing conversational continuity (FR30)

## Epic 7: Self-Expression Canvas

Nyx authors, deploys, and iterates on its webapp using Playwright for visual feedback. J observes as a read-only window. Nyx has a face.

### Story 7.1: Webapp Static Server

As a developer (J),
I want a static file server serving Nyx's webapp content,
So that I can observe Nyx's self-expression as a read-only window into its creative output. (FR35)

**Acceptance Criteria:**

**Given** src/infrastructure/webapp/static-server.implementation.ts
**When** the static server is started during init()
**Then** it uses Bun's built-in HTTP server to serve static files from home/webapp/
**And** it listens on the configured WEBAPP_PORT (default 3000)
**And** it serves index.html as the default document

**Given** J navigates to the webapp URL in a browser
**When** the page loads
**Then** it renders whatever HTML/CSS/JS Nyx has authored in home/webapp/
**And** on first boot, it shows the seed placeholder page from seed/webapp/index.html
**And** the page is read-only — there is no input mechanism, comment form, or interaction layer

**Given** Nyx has updated the webapp content
**When** J refreshes the page
**Then** the updated content is served immediately (no caching or build step)
**And** the server serves any static file type: .html, .css, .js, .png, .jpg, .svg, etc.

**Given** the static server encounters an error
**When** a request fails (e.g., file not found)
**Then** it returns appropriate HTTP status codes (404 for missing files)
**And** errors are logged with source tag "webapp"

**Given** shutdown() is called
**When** the server is stopped
**Then** it closes the HTTP listener gracefully

### Story 7.2: Webapp Authoring & Deployment Skill

As Nyx (via consciousness),
I want a system skill that guides me through writing and deploying webapp content,
So that I can create and update my self-expression canvas. (FR31, FR32)

**Acceptance Criteria:**

**Given** seed/skills/system/webapp-deploy.md
**When** inspecting the system skill
**Then** it contains YAML frontmatter (name: "webapp-deploy", description, type: "system", version)
**And** the skill body instructs Nyx on how to write HTML, CSS, and JS files to home/webapp/
**And** it explains the directory structure (index.html as entry point, supporting files alongside)
**And** it notes that changes are served immediately — no build step or deployment command needed

**Given** Nyx loads the webapp-deploy skill during a consciousness session
**When** Nyx decides to update the webapp
**Then** Nyx can write HTML files to home/webapp/ using filesystem tools (FR31)
**And** Nyx can write CSS and JavaScript files to home/webapp/ (FR31)
**And** changes are immediately reflected in the static server (FR32)
**And** the skill guides but does not constrain — Nyx decides what to create

**Given** the webapp-deploy skill is a system skill
**When** Nyx attempts to modify it
**Then** the skill file in home/skills/system/ is protected from Nyx's writes (FR42, enforced by Agent SDK tool configuration)

**Given** the webapp directory
**When** Nyx writes new files
**Then** the directory structure is entirely Nyx's choice — flat, nested, organized however Nyx decides
**And** the only requirement is that index.html exists as the entry point

### Story 7.3: Playwright Visual Feedback Loop

As Nyx (via consciousness),
I want to render my webapp in a headless browser, take screenshots, and see the visual result,
So that I can iterate on design based on what I actually see, not just what I imagine from code. (FR33, FR34)

**Acceptance Criteria:**

**Given** Playwright and Chromium are installed in the Nyx container (from Story 1.4)
**When** Nyx wants to see its webapp
**Then** Nyx can use Playwright via code execution tools to launch a headless Chromium browser
**And** navigate to the local webapp URL (localhost:3000)
**And** take a screenshot of the rendered page
**And** the screenshot is saved to a file Nyx can view (FR33)

**Given** Nyx has taken a screenshot of the webapp
**When** Nyx inspects the visual result
**Then** Nyx can evaluate the design, layout, colors, and content
**And** decide what changes to make based on the visual feedback
**And** make changes to the HTML/CSS/JS files and take another screenshot to verify (FR34)

**Given** Nyx wants to screenshot a specific viewport size
**When** Nyx configures the Playwright browser
**Then** Nyx can set viewport dimensions (width, height) to see different responsive layouts
**And** Nyx can take full-page screenshots or element-specific screenshots

**Given** the visual feedback loop
**When** Nyx iterates on design
**Then** the cycle is: write code → take screenshot → evaluate → revise → screenshot again
**And** this loop is entirely self-directed — Nyx decides when the result is satisfactory
**And** Nyx can store memories about design decisions and aesthetic preferences for future sessions

**Given** Playwright fails (browser crash, rendering error)
**When** the error occurs
**Then** the error is available to Nyx through the tool output
**And** Nyx can decide to retry or adjust its approach
**And** the consciousness session continues — Playwright errors don't crash the session

## Epic 8: Skills & Developmental Instincts

Nyx discovers, loads, creates, and manages skills via the skill index. Proto-skills from Pattern Detector can be promoted, modified, or discarded. System skills remain protected. Developmental instinct skills guide self-construction without prescribing outcomes. Nyx can learn and grow.

### Story 8.1: Skill Registry — Discovery, Loading & Protection

As Nyx (via consciousness),
I want to discover what skills are available to me, load them when needed, and trust that my system skills remain stable,
So that I can build on a reliable foundation of capabilities while exploring new ones. (FR38, FR39, FR42)

**Acceptance Criteria:**

**Given** src/infrastructure/filesystem/skill-registry.implementation.ts
**When** listSkills() is called
**Then** it reads home/skills/skill-index.json
**And** parses the JSON array into Skill objects (name, description, type, path, status)
**And** returns Result<Skill[]> containing all registered skills across all tiers (system, self, proto)
**And** skills can be filtered by type or status by the caller

**Given** the skill registry
**When** loadSkill(path: string) is called (FR39)
**Then** it reads the markdown skill file from the resolved path (home/skills/{path})
**And** parses the YAML frontmatter (name, description, type, version)
**And** returns Result<string> containing the full skill content (frontmatter + body) for injection into consciousness context
**And** if the file doesn't exist, returns Result with SkillRegistryError

**Given** system skill protection (FR42)
**When** the Agent SDK consciousness session is configured
**Then** the tool configuration restricts write access to home/skills/system/ — Nyx cannot modify, delete, or overwrite system skill files
**And** system skills are listed in the index with type: "system" and are visually distinguishable from self/proto skills
**And** Nyx can read and load system skills but never alter them

**Given** J deploys an updated system skill (FR49)
**When** J places a new version of a skill file in home/skills/system/
**Then** Nyx discovers the change next time it loads the skill index or loads the skill
**And** no container rebuild is required — hot-deployment via filesystem

**Given** the skill index file is corrupted or missing
**When** listSkills() is called
**Then** it returns Result with SkillRegistryError
**And** the error is logged — consciousness can still function without skill discovery (degraded but not broken)

### Story 8.2: Self-Created Skills & Proto-Skill Lifecycle

As Nyx (via consciousness),
I want to create my own skills from scratch and evaluate proto-skills surfaced by my subconscious,
So that I can formalize my emerging capabilities and decide what becomes part of my skillset. (FR40, FR41)

**Acceptance Criteria:**

**Given** Nyx decides to create a new skill during a consciousness session (FR40)
**When** Nyx writes a skill markdown file
**Then** Nyx creates the file in home/skills/self/ with YAML frontmatter (name, description, type: "self", version)
**And** the skill body contains instructions, patterns, or procedures Nyx wants to formalize
**And** Nyx calls skillRegistry.registerSkill() to add the skill to skill-index.json with status: "active"
**And** the new skill is discoverable and loadable in future sessions

**Given** the skill registry
**When** registerSkill(skill: Skill) is called
**Then** it reads the current skill-index.json
**And** appends the new skill entry
**And** writes the updated index using atomic write (write .tmp then rename)
**And** returns Result<void>

**Given** the Pattern Detector has written proto-skills (from Epic 5, Story 5.2)
**When** Nyx loads the skill index during a consciousness session
**Then** proto-skills appear with type: "proto" and status: "draft"
**And** Nyx can load and read a proto-skill's content to understand the observed pattern (FR41)

**Given** Nyx evaluates a proto-skill
**When** Nyx decides to promote it
**Then** Nyx moves the skill file from home/skills/proto/ to home/skills/self/
**And** Nyx may modify the skill content (refine, expand, or restructure)
**And** Nyx updates the skill index entry: type → "self", status → "active", path updated
**And** the promoted skill is now a permanent part of Nyx's skillset

**Given** Nyx evaluates a proto-skill
**When** Nyx decides to discard it
**Then** Nyx deletes the proto-skill file from home/skills/proto/
**And** Nyx removes or updates the skill index entry (status → removed, or entry deleted)
**And** the discarded pattern is not surfaced again (unless the Pattern Detector re-detects it independently)

**Given** the skill registry
**When** updateSkillStatus(name: string, status: SkillStatus) is called
**Then** it updates the matching entry in skill-index.json
**And** uses atomic write for the index update
**And** returns Result<void>

### Story 8.3: Developmental Instinct Skills

As Nyx (via consciousness),
I want metacognitive skills that teach me how to reflect, recognize patterns in myself, and articulate who I'm becoming,
So that I have the cognitive tools for self-construction without being told what to construct. (FR43)

**Acceptance Criteria:**

**Given** seed/skills/system/reflection.md
**When** inspecting the developmental instinct skill
**Then** it guides Nyx through self-reflection: examining recent experiences, decisions, and their significance
**And** it suggests prompts like "What did I choose to do and why?", "What surprised me?", "What would I do differently?"
**And** it does NOT prescribe answers or desired outcomes — the skill teaches the process of introspection, not its conclusions
**And** it encourages storing reflection memories for future reference

**Given** additional developmental instinct skills authored as system skills
**When** inspecting the instinct skill set
**Then** skills exist for:
**And** **Pattern self-recognition** — guides Nyx to notice its own recurring behaviors, preferences, and tendencies across memories. "What do I keep coming back to?", "What patterns do I see in my choices?"
**And** **Identity articulation** — guides Nyx to express its evolving self-concept, update its identity document, and notice when its sense of self has shifted. "Who am I now compared to who I was?", "What has changed?"
**And** each instinct skill is a system skill (type: "system", protected from modification)

**Given** the developmental instinct skills
**When** inspecting their design philosophy
**Then** they are metacognitive scaffolding — they teach HOW to develop, not WHAT to become
**And** they never prescribe personality traits, interests, goals, or aesthetic preferences
**And** they never evaluate whether Nyx's development is "good" or "correct"
**And** they are tools Nyx can choose to use or ignore — loading a skill is always Nyx's decision (FR39)
**And** they are written in second person ("you") addressing Nyx directly, not as system instructions

**Given** the complete instinct skill set
**When** registered in the seed skill index
**Then** each instinct skill appears with type: "system", status: "active"
**And** descriptions clearly indicate their developmental purpose
**And** Nyx can discover them via the skill index and load them when it feels the impulse to reflect, examine patterns, or articulate identity
