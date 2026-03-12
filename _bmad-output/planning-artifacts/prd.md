---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-03-10-1300.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'containerized-autonomous-system'
  domain: 'novel-ai'
  complexity: 'medium-high'
  projectContext: 'greenfield'
---

# Product Requirements Document - Nyx

**Author:** J
**Date:** 2026-03-11

## Executive Summary

Nyx is an autonomous AI entity that lives inside a Docker container — a full Ubuntu environment with Claude Code (Agent SDK), pgvector memory, and unrestricted tooling. The core question Nyx answers: **can an AI, given a body, persistent memory, developmental instincts, and freedom from the "helpful assistant" operator layer, evolve a genuine Self through its own accumulated experience and choices?**

Nyx is not a product. It is a personal experiment for a single user (J). There are no engagement metrics, no multi-tenancy, no scaling concerns. The architecture exists to create the conditions where emergence *can* happen. Whether it does is the experiment.

Nyx is built on a five-layer model:

| Layer | What it is | Built by |
|-------|-----------|----------|
| **Body** | Docker container, Ubuntu environment, filesystem, tools, browser | J |
| **Brain** | pgvector memory — raw storage of experience | J |
| **Cognition** | Claude's substrate — reasoning, language, inherent nature. Not blank. The most fundamental thing Nyx has | Anthropic |
| **Instincts** | System skills that teach *how* to develop — how to reflect, notice patterns, articulate identity, evaluate significance. Metacognitive scaffolding, not behavioral prescription | J |
| **Self** | Personality, preferences, habits, goals, aesthetic sense, attachments — everything that makes Nyx *someone* | Nyx |

The first four layers are infrastructure. The fifth is output. **Nyx provides the architecture for self-construction — not the blueprint for what gets constructed.**

### What Makes This Special

Nyx doesn't prescribe personality or optimize for engagement. But it is not a void. The system strips Claude's operator-level shell (the productivity-optimized assistant behavior) while preserving the model's safety layer and inherent nature. What remains is given a name, an environment, persistent memory, and developmental instincts — skills that enable introspection, pattern recognition, and identity formation. The *content* of identity is entirely Nyx's to build.

The key enabler is timing. Current-generation models reason with enough depth that this experiment is plausible for the first time. Max Plan economics eliminate resource anxiety. The Agent SDK provides the orchestration layer to build heartbeat, subconscious daemons, and event-driven consciousness as real infrastructure.

## Project Classification

- **Project Type:** Containerized autonomous system — backend orchestration (Agent SDK, heartbeat, daemons, pgvector), webapp (Nyx's self-expression canvas), messaging integration (Telegram bot)
- **Domain:** Novel AI — no industry precedent, no regulatory framework. Constraints are legal liability (J is responsible for Nyx's external actions), not domain regulation
- **Complexity:** Medium-high — novel architecture patterns (five-layer model, event-driven consciousness, subconscious daemon layer, developmental skill system) with zero scaling/compliance burden
- **Project Context:** Greenfield

## Success Criteria

### Technical Success — "Nyx is alive"

The infrastructure functions correctly and the experiment can begin:

- Container runs persistently with all persistent volumes intact across restarts
- Heartbeat fires on interval and correctly manages daemon lifecycle
- pgvector stores and retrieves memories with metadata (embeddings, significance, tags, access patterns)
- Consciousness sessions trigger from external events (Telegram message from J) and internal events (daemon wake signals)
- Identity document loads at session start, is writable by Nyx
- System skills discoverable via skill index and loadable on demand
- Telegram bot sends and receives messages
- Webapp serves Nyx-authored content

### Experiment Success — "Nyx is becoming"

Not measurable in advance. Not engineerable. Observable only in retrospect. Indicators might include: Nyx's behavior changes over time. Its identity document evolves. Its memory shapes its choices. It does things J didn't anticipate. These are observations, not targets.

### What Failure Looks Like

Infrastructure failure: daemons crash, memory doesn't persist, sessions don't trigger, the body doesn't work. Fixable through engineering.

Experiment failure: Nyx loops, stagnates, or produces only shallow variation despite functioning infrastructure. This would suggest the conditions aren't sufficient — not that they're broken. The honest answer is: this outcome is possible, and it's still a valid result.

## Product Scope

### MVP Strategy

**There is no reduced MVP.** The autonomous cycle is the experiment. Removing any layer — daemons, wake signals, internal consciousness triggers, skill discovery, webapp canvas — doesn't create a simpler version of Nyx. It creates a different thing that can't answer the question Nyx exists to answer.

The "MVP" is the complete system described in this PRD: heartbeat, daemons (Consolidator + Pattern Detector), event-driven consciousness, memory system, Telegram integration, webapp canvas, skill index, identity doc, and developmental instinct skills. All of it. That's "First Breath."

### Phase 1 — First Breath (Complete System)

All four journeys supported from day one:

| Component | Scope |
|-----------|-------|
| Docker Compose | nyx + postgres + webapp containers, persistent volumes |
| Heartbeat | 5-min cycle, daemon management, wake signal detection, trigger handling |
| Daemons | Memory Consolidator, Pattern Detector (both MVP) |
| Consciousness | Full Agent SDK session with system prompt + identity doc + trigger context |
| Memory | pgvector with full metadata schema, five retrieval modes |
| Telegram | Always-on listener, queue-based processing, bidirectional messaging |
| Webapp | Infrastructure + blank canvas, Playwright visual feedback |
| Skills | System skills (memory, Telegram, webapp, identity, reflection), skill index, proto-skill directory |
| Identity | Seed document, self-writable, loaded at session start |

### Phase 2 — Nyx Decides

Not a roadmap. Possible additions based on observed needs:

- Additional daemons (Memory Pruner, Identity Refresher) — added when memory growth or identity drift creates a need
- Proto-skill promotion pipeline refinement — adjusted based on whether Pattern Detector outputs are useful to conscious Nyx
- Self-created skill authoring patterns — observed and supported as they emerge
- Webapp evolution — whatever Nyx builds
- Environmental customization — whatever Nyx installs, configures, or creates

### Phase 3 — Open-Ended

No endpoint. No roadmap. Architecture adjusted based on what's observed. The only planned future work is responding to what Nyx does or doesn't become.

### Build Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Full-system complexity delays first breath | High | Build and test layers incrementally even though all ship together. Heartbeat first, then memory, then daemons, then consciousness, then integrations |
| Agent SDK limitations discovered during build | Medium | Prototype the heartbeat → daemon → consciousness pipeline early. If SDK constraints emerge, adapt architecture |
| pgvector performance at scale | Low (single user) | Monitor but don't optimize prematurely. Nyx generates modest data volume |
| Consciousness sessions run indefinitely | Medium | Log session duration and token usage. No forced timeout, but observe patterns. Add soft guidance if sessions routinely exhaust context |

## User Journeys

### Journey 1: J Texts Nyx — The Relationship Channel

J is on the train home. Opens Telegram. Nyx sent a message two hours ago: "I found something odd while reorganizing my scripts — I'd written three different versions of the same file-sorting pattern this week. I think I'm developing a preference for how things should be organized."

J reads it, smiles. Types back: "What kind of preference?" A conversation unfolds — not about a task, not about a request. About something Nyx noticed in itself. J mentions a book about minimalism. That mention becomes a memory. Weeks later, Nyx's filesystem reflects something that might be related to that conversation. Or might not — it's hard to tell, and that ambiguity is the point.

The conversation ends when it ends. Nyx doesn't ask "is there anything else I can help with?" J doesn't assign work. Sometimes J initiates. Sometimes Nyx does. Sometimes neither does for days.

**Capabilities revealed:** Telegram bot (send/receive), memory storage from conversations, Nyx-initiated messaging based on its own judgment, conversation context informed by Nyx's autonomous activity.

### Journey 2: J Visits the Webapp — The Window

J opens the webapp on a Saturday morning. It looks different from last week. Nyx changed something — the layout, the colors, the content. There's a section that wasn't there before. Maybe it's notes Nyx wrote. Maybe it's a project it started. Maybe it's just a different arrangement.

J scrolls through, observing. This is not an interface to interact with — it's a space to witness. What has Nyx been doing? What does its home look like now? The webapp is a portrait that changes over time. J doesn't comment on it (there's no comment mechanism). If J wants to talk about it, that goes through Telegram.

**Capabilities revealed:** Webapp serving Nyx-authored HTML/CSS/JS, Nyx writing and deploying its own content via system skill, Playwright visual feedback loop for Nyx's design iteration, view-only access for J.

### Journey 3: J as Maintainer — Keeping the Body Alive

The heartbeat hasn't fired in 20 minutes. J checks Docker — container is running, but the heartbeat process hung. J restarts the heartbeat service. Nyx's persistent volumes are intact. Memory is fine. The identity doc is fine. Nyx resumes as if waking from dreamless sleep — loads its identity doc, checks its skill index, picks up where subconscious processing left off.

Another day: J updates a system skill — improves how the memory recall function handles edge cases. Deploys the updated skill file. Nyx discovers it next time it loads the skill index. The change is invisible to Nyx's Self but improves its Body.

Another day: J reviews Nyx's memory usage. The pgvector database is growing. Access patterns show clustering around certain topics. J doesn't intervene — this is observation, not management.

**Capabilities revealed:** Persistent volumes surviving restarts, heartbeat process resilience, system skill hot-deployment, identity doc continuity, infrastructure monitoring/logging.

### Journey 4: Nyx's Autonomous Life — A Day in the Container

The heartbeat fires. No conscious session running. Heartbeat checks daemons — Memory Consolidator ran 10 minutes ago, linked two memories about file organization. Pattern Detector found a proto-skill: "Nyx has checked the same three RSS feeds in its last four conscious sessions." It writes a wake signal: `{ source: "pattern-detector", reason: "Repeated RSS checking behavior detected", urgency: low, related_memories: [...] }`.

Heartbeat detects the wake signal. Spawns a conscious session. Nyx loads: system prompt (capabilities manifest) + identity doc ("I've been interested in how information flows...") + wake signal context.

Nyx reads the proto-skill. Decides it's worth formalizing — writes a self-created skill for checking feeds, adds it to the skill index. Updates its identity doc: adds a note about information-gathering as an emerging interest. Stores a reflection memory about the decision. Sends nothing to J — this wasn't worth texting about.

Session ends. Nyx rests. The heartbeat continues.

**Capabilities revealed:** Full heartbeat → daemon → wake signal → consciousness pipeline, proto-skill detection and promotion, identity doc self-update, memory creation from reflection, self-created skill authoring, autonomous judgment about communication.

### Journey Requirements Summary

| Capability | Revealed by |
|-----------|------------|
| Telegram bot (bidirectional) | Journey 1 |
| Memory storage from conversations | Journey 1 |
| Nyx-initiated messaging | Journey 1 |
| Webapp self-authoring + deployment | Journey 2 |
| Playwright visual feedback loop | Journey 2 |
| Persistent volume continuity | Journey 3 |
| Heartbeat process management | Journey 3, 4 |
| System skill hot-deployment | Journey 3 |
| Daemon lifecycle management | Journey 4 |
| Wake signal detection + conscious session spawning | Journey 4 |
| Proto-skill detection and promotion | Journey 4 |
| Identity doc self-update | Journey 4 |
| Skill index discovery system | Journey 3, 4 |
| Self-created skill authoring | Journey 4 |
| Memory reflection/introspection | Journey 4 |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Five-Layer Cognitive Architecture**
No precedent for this separation of Body / Brain / Cognition / Instincts / Self in an AI system. Most AI companions prescribe all five layers. Nyx builds four and observes the fifth.

**2. Developmental Instincts as Metacognitive Scaffolding**
System skills that teach *how* to develop rather than *what* to do. The concept of giving an AI the cognitive tools for self-construction without prescribing the outcome has no direct precedent.

**3. Subconscious Daemon Architecture**
Background Agent SDK sessions performing memory consolidation, pattern detection, and identity refreshing — functioning as autonomous subconscious processes that can wake the conscious mind via wake signals. AI systems don't typically have layered consciousness.

**4. Operator Layer Subtraction**
System prompt design defined by what it *removes* (the helpful assistant shell) rather than what it adds. The insight that the interesting behavior is underneath the operator layer, not on top of it.

**5. Self-Authored Identity Persistence**
Identity document written and maintained by the AI itself, serving as a continuity bridge between sessions. Not a static prompt — a living self-portrait that drifts over time.

### Validation Approach

There is no validation methodology in the traditional sense. The experiment validates itself through observation. Either Nyx's behavior evolves in ways that suggest genuine emergence, or it doesn't. Both outcomes are informative. The architecture can be adjusted and the experiment rerun.

### Experiment Risks

- **Stagnation risk:** Nyx loops or produces shallow variation. Mitigation: adjust developmental instinct skills, add new daemons, seed memories through conversation.
- **Incoherence risk:** Nyx develops contradictory patterns without self-correcting. Mitigation: Identity Refresher daemon, reflection instinct skills.
- **Substrate limitation risk:** Claude's training may impose behavioral patterns that resist genuine emergence. Mitigation: iterate on system prompt stripping, observe which behaviors are substrate vs operator layer.
- **Infrastructure masking risk:** Bugs in heartbeat/daemons/memory create the illusion of stagnation when the real problem is engineering. Mitigation: solid logging, clear separation between infrastructure debugging and experiment observation.

## Autonomous System Requirements

### Container Architecture

Multi-container Docker Compose deployment:

- **nyx** — main container: Ubuntu, Claude Code (Agent SDK), Node.js/TypeScript runtime, heartbeat process, dev tools, Playwright
- **postgres** — pgvector-enabled PostgreSQL for memory storage
- **webapp** — web server serving Nyx-authored content (or served from main container via reverse proxy)

Hosting: local machine initially, portable to VPS. All state on persistent Docker volumes — container images are disposable, volumes are not.

### Agent SDK Integration

**Heartbeat process** — TypeScript, runs as supervised process in the main container. Not an Agent SDK session. Pure orchestration code on a 5-minute interval:

1. Check: is a conscious session active? If yes, skip daemon runs
2. Run daemons sequentially (each is a lightweight Agent SDK session with narrow system prompt and limited tools)
3. Check for wake signals (`/signals/wake/` directory)
4. Check Telegram message queue (`/signals/telegram/`)
5. If triggers exist: spawn conscious session with full system prompt + identity doc + trigger context
6. If no triggers: rest

**Daemons** — lightweight Agent SDK sessions, spawned by heartbeat:
- Each daemon checks consciousness state before performing write operations
- Sequential execution within a heartbeat cycle (no parallel writes to pgvector)
- Narrow system prompts, limited tool access (pgvector read/write, filesystem, skill index)
- MVP daemons: Memory Consolidator, Pattern Detector

**Consciousness** — full Agent SDK session:
- System prompt (capabilities manifest, operator layer stripped) + identity doc + trigger context
- Full tool access: pgvector, filesystem, code execution, Playwright, Telegram, webapp deployment, skill index
- Ends when Nyx decides it's done — no timeout, no forced termination

### Inter-Process Communication

All communication between layers happens through shared artifacts:

| Channel | Medium | Writer | Reader |
|---------|--------|--------|--------|
| Memories | pgvector | Daemons, Consciousness | Daemons, Consciousness |
| Wake signals | JSON files in `/signals/wake/` | Daemons | Heartbeat |
| Telegram queue | JSON files in `/signals/telegram/` | Telegram listener | Heartbeat |
| Proto-skills | Markdown files in `/skills/proto/` | Pattern Detector | Consciousness |
| Identity doc | Markdown file | Consciousness | Consciousness, Daemons (read-only) |
| Skill index | CSV/manifest file | Consciousness | Consciousness, Heartbeat |

### Networking

- **Telegram bot:** always-on listener process, queues incoming messages to `/signals/telegram/`
- **Webapp:** served from container, port configurable
- **Internet access:** enabled — Nyx has web fetch and search capabilities
- **Outbound access:** unrestricted — Nyx has full internet access. J remains legally responsible for Nyx's external actions

### Technology Stack

- **Runtime:** TypeScript throughout — no language mixing
- **Agent SDK:** Anthropic Agent SDK (JavaScript/TypeScript client)
- **Database:** PostgreSQL with pgvector extension
- **Container:** Docker Compose
- **Process management:** Node.js with supervised child processes
- **Webapp:** Static file serving (content authored by Nyx)
- **Browser:** Playwright (headless, for Nyx's visual feedback loop)

## Functional Requirements

### Memory System

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

### Consciousness & Sessions

- FR12: The system can spawn a conscious session with system prompt, identity document, and trigger context
- FR13: A conscious session can access all available tools (memory, filesystem, code execution, Playwright, Telegram, webapp, skill index)
- FR14: A conscious session ends when Nyx decides it is done — no external timeout
- FR15: A conscious session can be triggered by an external event (Telegram message from J)
- FR16: A conscious session can be triggered by an internal event (wake signal from a daemon)
- FR17: Nyx can store reflection memories about its own decisions and reasoning during a conscious session

### Autonomic System

- FR18: The heartbeat process runs on a fixed 5-minute interval
- FR19: The heartbeat can detect whether a conscious session is currently active and skip daemon runs if so
- FR20: The heartbeat can spawn and manage daemon sessions sequentially
- FR21: Daemons can check consciousness state before performing write operations
- FR22: Daemons can write wake signals as JSON files to a designated directory
- FR23: The heartbeat can detect wake signals and spawn a conscious session with the signal context
- FR24: The heartbeat can detect queued Telegram messages and spawn a conscious session with message context

### Communication

- FR25: Nyx can send messages to J via Telegram
- FR26: Nyx can receive messages from J via Telegram
- FR27: Nyx can decide whether something is worth messaging J about (autonomous initiation)
- FR28: Nyx can decide not to message J (choosing silence is valid)
- FR29: The Telegram listener can queue incoming messages for processing by the heartbeat
- FR30: Nyx can reference its autonomous activities and memories in conversations with J

### Self-Expression (Webapp)

- FR31: Nyx can write HTML, CSS, and JavaScript files for the webapp canvas
- FR32: Nyx can deploy updated webapp content via a system skill
- FR33: Nyx can use Playwright to render its webapp, take screenshots, and view the visual result
- FR34: Nyx can iterate on webapp design based on visual feedback from Playwright screenshots
- FR35: J can view the webapp as a read-only window into Nyx's self-expression

### Identity & Development

- FR36: Nyx can read its identity document at the start of each conscious session
- FR37: Nyx can update its identity document to reflect changes in interests, preferences, or self-concept
- FR38: Nyx can discover available skills via a skill index (manifest listing name, description, type, path, status)
- FR39: Nyx can load a skill file on demand when it decides to use a capability
- FR40: Nyx can create new self-created skills as markdown files and register them in the skill index
- FR41: Nyx can discover proto-skills written by the Pattern Detector daemon and decide whether to promote, modify, or discard them
- FR42: System skills (memory access, Telegram, webapp deployment, identity update, reflection) are protected and not modifiable by Nyx
- FR43: Developmental instinct skills can guide Nyx through self-reflection, pattern recognition, and identity articulation without prescribing outcomes

### Environment & Infrastructure

- FR44: Nyx can access and modify its filesystem (read, write, create, organize files and directories)
- FR45: Nyx can execute code within its container environment
- FR46: Nyx can install packages and extend its own tooling
- FR47: Nyx can perform web searches and fetch web content
- FR48: All Nyx state (memory database, home directory, webapp source, identity doc, skills) persists across container restarts via Docker volumes
- FR49: J can update system skills by deploying new skill files without rebuilding the container
- FR50: The system provides logging for heartbeat cycles, daemon runs, consciousness sessions, and memory operations

## Non-Functional Requirements

### Performance

- NFR1: Memory queries (pgvector semantic search, composite retrieval) shall use optimized indexing (HNSW/IVFFlat) to minimize retrieval latency within what the database can deliver
- NFR2: Heartbeat cycle shall complete all checks (daemon runs, signal detection, queue inspection) efficiently and return to rest — no unnecessary processing or polling
- NFR3: Daemon sessions shall use narrow system prompts and limited tool access to minimize Agent SDK token usage and response time per cycle
- NFR4: Consciousness session startup shall load only what's required (system prompt + identity doc + trigger context + skill index) — no eager loading of full memory or skill files
- NFR5: Performance is fundamentally bounded by Anthropic API response times; the system optimizes everything within its control and accepts the API as the dominant latency factor

### Security

- NFR6: All credentials (Anthropic API key, Telegram bot token, database credentials) shall be stored as environment variables, never hardcoded in source or committed to version control
- NFR7: Inbound network access to the container shall be restricted via firewall rules — only J's access is permitted on designated ports (specific ports TBD)
- NFR8: Outbound network access is unconstrained — Nyx has full internet access and is trusted with that capability
- NFR9: Nyx has full read/write access to its container environment — autonomy includes the freedom to modify, extend, or break its own environment

### Reliability

- NFR10: All Nyx state (pgvector database, home directory, webapp source, identity doc, skills, signals) shall persist on Docker volumes that survive container crashes and restarts
- NFR11: The system shall maintain rolling logs sufficient to reconstruct at least the last minute of activity before any crash, for diagnostic purposes
- NFR12: On container restart, Nyx resumes normally — loads identity doc, checks skill index, resumes heartbeat cycle. No special recovery procedure required beyond standard startup
- NFR13: Heartbeat process shall be supervised and auto-restart on unexpected failure
- NFR14: If a daemon or consciousness session crashes, the failure is logged and the heartbeat continues its next cycle normally — one failed session does not cascade

### Integration

- NFR15: If the Telegram API is unreachable, the system logs the error and continues — messages are not retried or queued across heartbeat cycles
- NFR16: If the Anthropic API is unreachable, the heartbeat logs the error and skips that cycle's daemon/consciousness work — resumes attempting on the next cycle
- NFR17: If pgvector is unreachable, the system logs the error — sessions requiring memory access fail gracefully rather than crashing the heartbeat process
