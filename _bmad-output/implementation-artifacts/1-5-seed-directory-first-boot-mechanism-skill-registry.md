# Story 1.5: Seed Directory, First-Boot Mechanism & Skill Registry

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want seed files for Nyx's first boot, a mechanism to copy them to persistent volumes, and a working skill registry implementation,
so that Nyx starts with an identity, system skill placeholders, a webapp canvas, and a functional skill discovery system on first launch. (FR38, FR39, FR48, FR49)

## Acceptance Criteria

### AC1: Seed Directory Structure

**Given** the `seed/` directory in the project root
**When** inspecting its contents
**Then:**
- `seed/identity.md` exists with the minimal seed identity document containing:
  - Header: `# Identity` followed by `I am Nyx.`
  - Sections: Who I Am, What I Care About, What I've Been Doing, How I See Things
  - Retrieval Weights section with defaults: similarity: 0.5, significance: 0.3, recency: 0.2
- `seed/skills/system/` contains placeholder markdown files for system skills:
  - memory-recall.md, memory-store.md, telegram-send.md, webapp-deploy.md, identity-update.md, reflection.md
- `seed/skills/self/` and `seed/skills/proto/` directories exist (empty — use `.gitkeep`)
- `seed/skills/skill-index.json` lists the system skills with fields: name, description, type: "system", path, status: "active"
- `seed/webapp/index.html` exists with a minimal placeholder page

### AC2: First-Boot Mechanism (entrypoint.sh)

**Given** `docker/entrypoint.sh`
**When** the container starts for the first time (empty volumes)
**Then:**
- Seed files are copied to the appropriate volume mount points:
  - `seed/identity.md` → `/home/nyx/identity.md`
  - `seed/skills/` → `/home/nyx/skills/`
  - `seed/webapp/` → `/home/nyx/webapp/`
- Directory structure is created for signals:
  - `/app/signals/wake/`
  - `/app/signals/telegram/`

**Given** the container restarts (volumes already populated)
**When** `entrypoint.sh` runs
**Then:**
- Existing files are NOT overwritten — seeds only copy if targets don't exist
- J can update system skills by placing new files in `/home/nyx/skills/system/` (FR49)

### AC3: Skill Registry — listSkills() (FR38)

**Given** `src/infrastructure/filesystem/skill-registry.implementation.ts`
**When** `listSkills()` is called
**Then:**
- It reads `skill-index.json` from the skills directory under `config.paths.home`
- Parses the JSON array into `Skill` objects (name, description, type, path, status)
- Returns `Result<Skill[]>` containing all registered skills across all tiers (system, self, proto)

### AC4: Skill Registry — loadSkill() (FR39)

**When** `loadSkill(path: string)` is called
**Then:**
- It validates the path does not contain `..` segments (path traversal protection) — returns `SkillRegistryError` if invalid
- It reads the markdown skill file from the resolved path (`{home}/skills/{path}`)
- Returns `Result<string>` containing the full skill content (frontmatter + body)
- If the file doesn't exist, returns `Result` with `SkillRegistryError`

### AC5: Skill Registry — registerSkill()

**When** `registerSkill(skill: Skill)` is called
**Then:**
- It reads the current `skill-index.json`
- If a skill with the same name already exists, returns `Result` with `SkillRegistryError` (duplicate rejection)
- Appends the new skill entry
- Writes the updated index using atomic write (write `.tmp` then rename)
- Returns `Result<void>`

### AC6: Skill Registry — updateSkillStatus()

**When** `updateSkillStatus(name: string, status: SkillStatus)` is called
**Then:**
- It updates the matching entry in `skill-index.json`
- Uses atomic write for the index update
- Returns `Result<void>`
- If skill name not found, returns `Result` with `SkillRegistryError`

### AC7: Error Handling

**Given** the skill index file is corrupted or missing
**When** `listSkills()` is called
**Then:**
- Returns `Result` with `SkillRegistryError`
- The error is logged — the system can still function without skill discovery (degraded but not broken)

## Tasks / Subtasks

- [x] Task 1: Create seed directory structure (AC: #1)
  - [x] 1.1 Create `seed/identity.md` with identity template (# Identity, I am Nyx, sections, retrieval weights)
  - [x] 1.2 Create `seed/skills/system/memory-recall.md` — placeholder with YAML frontmatter (name, description, type: system, version: 0.1.0)
  - [x] 1.3 Create `seed/skills/system/memory-store.md` — placeholder with YAML frontmatter
  - [x] 1.4 Create `seed/skills/system/telegram-send.md` — placeholder with YAML frontmatter
  - [x] 1.5 Create `seed/skills/system/webapp-deploy.md` — placeholder with YAML frontmatter
  - [x] 1.6 Create `seed/skills/system/identity-update.md` — placeholder with YAML frontmatter
  - [x] 1.7 Create `seed/skills/system/reflection.md` — placeholder with YAML frontmatter
  - [x] 1.8 Create `seed/skills/self/.gitkeep` and `seed/skills/proto/.gitkeep`
  - [x] 1.9 Create `seed/skills/skill-index.json` — JSON array listing all 6 system skills with name, description, type, path, status
  - [x] 1.10 Create `seed/webapp/index.html` — minimal placeholder HTML page

- [x] Task 2: Extend entrypoint.sh for first-boot seed copy (AC: #2)
  - [x] 2.1 Add seed copy logic to `docker/entrypoint.sh` — copy `seed/identity.md` to `/home/nyx/identity.md` only if target doesn't exist
  - [x] 2.2 Add seed copy for skills directory — `cp -rn seed/skills/ /home/nyx/skills/` (or per-file checks)
  - [x] 2.3 Add seed copy for webapp directory — `cp -rn seed/webapp/ /home/nyx/webapp/`
  - [x] 2.4 Ensure idempotency — all copy operations must use "copy if not exists" pattern
  - [x] 2.5 Update `.dockerignore` to add `!seed/**/*.md` exception (seed markdown files need to be included in build context)
  - [x] 2.6 Update Dockerfile to COPY `seed/` directory into the image (add `COPY seed/ ./seed/` after source copy)

- [x] Task 3: Implement SkillRegistryImpl (AC: #3, #4, #5, #6, #7)
  - [x] 3.1 Create `src/infrastructure/filesystem/skill-registry.implementation.ts`
  - [x] 3.2 Implement constructor accepting `PathsConfig` (from `AppConfig.paths`) for home directory path
  - [x] 3.3 Implement `listSkills()` — read `{home}/skills/skill-index.json`, parse JSON, map to `Skill[]`, return `Result`
  - [x] 3.4 Implement `loadSkill(path)` — read `{home}/skills/{path}`, return full content as `Result<string>`
  - [x] 3.5 Implement `registerSkill(skill)` — read index, append, atomic write (`.tmp` + rename), return `Result<void>`
  - [x] 3.6 Implement `updateSkillStatus(name, status)` — find entry, update status, atomic write, return `Result<void>`
  - [x] 3.7 All methods return `Result<T>` with `SkillRegistryError` on failure — never throw
  - [x] 3.8 Export from `src/infrastructure/filesystem/index.ts` barrel

- [x] Task 4: Write tests for SkillRegistryImpl (AC: #3, #4, #5, #6, #7)
  - [x] 4.1 Create `tests/infrastructure/filesystem/skill-registry.test.ts`
  - [x] 4.2 Test `listSkills()` — happy path: reads valid index, returns Skill array
  - [x] 4.3 Test `listSkills()` — error: missing index file returns SkillRegistryError
  - [x] 4.4 Test `listSkills()` — error: corrupted JSON returns SkillRegistryError
  - [x] 4.5 Test `loadSkill()` — happy path: reads existing skill file, returns content string
  - [x] 4.6 Test `loadSkill()` — error: missing file returns SkillRegistryError
  - [x] 4.7 Test `registerSkill()` — happy path: appends to index, verifies written content
  - [x] 4.8 Test `registerSkill()` — error: duplicate skill name returns SkillRegistryError
  - [x] 4.9 Test `updateSkillStatus()` — happy path: updates matching entry
  - [x] 4.10 Test `updateSkillStatus()` — error: skill not found returns SkillRegistryError
  - [x] 4.11 Test `loadSkill()` — error: path traversal (`../foo`) returns SkillRegistryError
  - [x] 4.12 Test seed file integration: read actual `seed/skills/skill-index.json`, verify it parses into valid Skill array
  - [x] 4.13 Ensure all tests use temp directories (not production paths)

- [x] Task 5: Validate and regression check (AC: all)
  - [x] 5.1 Run `bun run check` — biome lint/format passes
  - [x] 5.2 Run `bun run typecheck` — no type errors
  - [x] 5.3 Run `bun test` — all tests pass including new ones, 0 regressions
  - [x] 5.4 Verify `bash -n docker/entrypoint.sh` — valid bash syntax
  - [x] 5.5 Verify seed directory structure matches AC1 exactly

## Dev Notes

### Architecture Compliance

**Clean Architecture — This story spans infrastructure and project root:**

The skill registry implementation lives in the infrastructure layer and implements the domain port `SkillRegistry` defined in `src/domain/ports/skill-registry.interface.ts`. The seed directory and entrypoint changes are operational infrastructure.

```
seed/                                          (NEW — project root)
├── identity.md
├── skills/
│   ├── system/
│   │   ├── memory-recall.md
│   │   ├── memory-store.md
│   │   ├── telegram-send.md
│   │   ├── webapp-deploy.md
│   │   ├── identity-update.md
│   │   └── reflection.md
│   ├── self/.gitkeep
│   ├── proto/.gitkeep
│   └── skill-index.json
└── webapp/
    └── index.html

src/infrastructure/filesystem/
├── skill-registry.implementation.ts           (NEW)
└── index.ts                                   (MODIFY — add barrel export)

docker/
├── entrypoint.sh                              (MODIFY — add seed copy logic)
└── Dockerfile                                 (MODIFY — COPY seed/ into image)

tests/infrastructure/filesystem/
└── skill-registry.test.ts                     (NEW)
```

### Domain Types Already Defined (Story 1.2)

The following types are already defined and MUST be used exactly as-is:

**`src/domain/types/skill.type.ts`:**
```typescript
export enum SkillType {
    System = "System",
    Self = "Self",
    Proto = "Proto",
}

export enum SkillStatus {
    Active = "Active",
    Draft = "Draft",
}

export interface Skill {
    name: string;
    description: string;
    type: SkillType;
    path: string;
    status: SkillStatus;
}
```

**`src/domain/ports/skill-registry.interface.ts`:**
```typescript
import type { Result } from "../types/result.type.ts";
import type { Skill, SkillStatus } from "../types/skill.type.ts";

export interface SkillRegistry {
    listSkills(): Promise<Result<Skill[]>>;
    loadSkill(path: string): Promise<Result<string>>;
    registerSkill(skill: Skill): Promise<Result<void>>;
    updateSkillStatus(name: string, status: SkillStatus): Promise<Result<void>>;
}
```

**`src/domain/errors/domain.error.ts`:**
```typescript
export class SkillRegistryError extends NyxError {
    readonly code = "SKILL_REGISTRY_ERROR";
}
```

**`src/domain/types/result.type.ts`:**
```typescript
export type Result<T> = { ok: true; value: T } | { ok: false; error: NyxError };
```

### CRITICAL — Skill Type Mapping Between JSON and Domain

The `skill-index.json` uses lowercase strings (`"system"`, `"active"`) but domain enums use PascalCase (`System`, `Active`). The `SkillRegistryImpl` MUST map between these formats:

- JSON `type: "system"` → `SkillType.System`
- JSON `type: "self"` → `SkillType.Self`
- JSON `type: "proto"` → `SkillType.Proto`
- JSON `status: "active"` → `SkillStatus.Active`
- JSON `status: "draft"` → `SkillStatus.Draft`

And reverse mapping when writing back to JSON. Use explicit mapping functions, not string casting.

### Skill Registry Implementation Details

**Constructor:**
- Accept `PathsConfig` (specifically `home` path) via dependency injection
- The skills directory is at `{home}/skills/`
- The skill index is at `{home}/skills/skill-index.json`

**Atomic Write Pattern:**
- Write content to `{targetPath}.tmp`
- Rename `.tmp` to final path (atomic on Linux filesystem)
- Use `Bun.write()` for file writing and `fs.rename()` or `Bun.file().move()` for atomic rename
- This prevents partial writes from corrupting the skill index

**File I/O:**
- Use `Bun.file()` for reading files (returns `BunFile` with `.text()`, `.json()` methods)
- Use `Bun.write()` for writing files
- Use `node:fs/promises` for `rename()` (atomic file move)
- All file operations wrapped in try/catch, returning `Result` with `SkillRegistryError` on any failure

**Import Rules:**
- Import from `@nyx/domain/types/index.ts` for `Skill`, `SkillType`, `SkillStatus`
- Import from `@nyx/domain/errors/index.ts` for `SkillRegistryError`
- Import from `@nyx/domain/ports/index.ts` for `SkillRegistry` interface
- Use `implements SkillRegistry` on the class

### Seed Identity Document — Exact Content

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

### Seed Skill File Format — Template

Each system skill markdown file follows this format:

```markdown
---
name: <skill-name>
description: <one-line description>
type: system
version: 0.1.0
---

# <Skill Name>

<!-- Placeholder: skill instructions will be defined when implementing the skill's functionality -->
```

### skill-index.json — Exact Content

```json
[
  {
    "name": "memory-recall",
    "description": "Query memories by semantic similarity, recency, or significance",
    "type": "system",
    "path": "system/memory-recall.md",
    "status": "active"
  },
  {
    "name": "memory-store",
    "description": "Store a new memory with content, tags, and significance",
    "type": "system",
    "path": "system/memory-store.md",
    "status": "active"
  },
  {
    "name": "telegram-send",
    "description": "Send a message via Telegram to J",
    "type": "system",
    "path": "system/telegram-send.md",
    "status": "active"
  },
  {
    "name": "webapp-deploy",
    "description": "Deploy or update the personal webapp",
    "type": "system",
    "path": "system/webapp-deploy.md",
    "status": "active"
  },
  {
    "name": "identity-update",
    "description": "Update the identity document with new self-knowledge",
    "type": "system",
    "path": "system/identity-update.md",
    "status": "active"
  },
  {
    "name": "reflection",
    "description": "Reflect on recent experiences and extract insights",
    "type": "system",
    "path": "system/reflection.md",
    "status": "active"
  }
]
```

### Entrypoint.sh — Extended Logic

The existing entrypoint.sh must be extended (NOT replaced). Add seed copy logic BEFORE the existing signal directory creation:

```bash
#!/bin/bash
set -e

# --- First-boot seed copy (idempotent) ---
# Copy seed identity if not already present
if [ ! -f /home/nyx/identity.md ]; then
  cp /app/seed/identity.md /home/nyx/identity.md
fi

# Copy seed skills if directory doesn't exist yet
if [ ! -d /home/nyx/skills ]; then
  cp -r /app/seed/skills /home/nyx/skills
fi

# Copy seed webapp if directory doesn't exist yet
if [ ! -d /home/nyx/webapp ]; then
  cp -r /app/seed/webapp /home/nyx/webapp
fi

# Create signal subdirectories if they don't exist (first boot)
mkdir -p /app/signals/wake /app/signals/telegram

# Ensure nyx owns volume mount points (targeted, not recursive on large volumes)
chown nyx:nyx /home/nyx /app/signals /app/signals/wake /app/signals/telegram /app/logs
chown -R nyx:nyx /home/nyx/identity.md /home/nyx/skills /home/nyx/webapp 2>/dev/null || true

# Execute as nyx user via gosu — proper PID 1 signal handling
exec gosu nyx bun run src/entry/heartbeat.ts
```

**CRITICAL — Dockerfile must COPY seed/ into image:**
Add `COPY seed/ ./seed/` to the Dockerfile AFTER the application source copy but BEFORE the entrypoint copy. The seed directory must be available at `/app/seed/` inside the container.

### Dockerfile Changes

Add this line to `docker/Dockerfile` after `COPY src/ ./src/`:

```dockerfile
# Copy seed files for first-boot
COPY seed/ ./seed/
```

### .dockerignore Consideration

The `.dockerignore` currently has `*.md` with `!src/**/*.md`. The seed directory contains `.md` files that must be included. Add:

```
!seed/**/*.md
```

Also ensure `seed/` is not excluded by any other pattern. The current `.dockerignore` does not exclude `seed/` explicitly, but the `*.md` glob at root level would exclude markdown files. The `!seed/**/*.md` exception fixes this.

### Testing Strategy

**Unit tests for SkillRegistryImpl use temp directories:**
- Create a temp directory per test with `mkdtemp()` from `node:fs/promises`
- Set up the expected directory structure (`skills/`, `skills/system/`, skill-index.json)
- Create test skill files as needed
- Pass the temp dir as the `home` path to the constructor
- Clean up temp dirs after tests

**Test file location:** `tests/infrastructure/filesystem/skill-registry.test.ts`

**Test pattern (matches existing project convention):**
```typescript
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
```

### Configuration Integration

The `SkillRegistryImpl` receives its `home` path from `AppConfig.paths.home`. It does NOT read `process.env` directly. The constructor signature should be:

```typescript
export class SkillRegistryImpl implements SkillRegistry {
    private readonly skillsDir: string;
    private readonly indexPath: string;

    constructor(homePath: string) {
        this.skillsDir = `${homePath}/skills`;
        this.indexPath = `${this.skillsDir}/skill-index.json`;
    }
}
```

This class will be wired in the entry layer (Story 1.6) with `new SkillRegistryImpl(config.paths.home)`.

### Previous Story Intelligence (Story 1.4)

**Learnings to apply:**
- `docker/entrypoint.sh` already exists — EXTEND it, don't replace. Current content: signal dir creation, chown, gosu exec.
- `docker/Dockerfile` already exists — add `COPY seed/` line after source copy.
- `.dockerignore` has `*.md` exclusion with `!src/**/*.md` exception. Must add `!seed/**/*.md`.
- Biome formats with tabs, line width 100.
- 300 tests currently pass. Must not regress.
- `bun run check`, `bun run typecheck`, `bun test` are the validation commands.
- The `@nyx/*` path aliases are configured in `tsconfig.json` — use them for imports.

**Code patterns established:**
- All infrastructure implementations use `implements` keyword on the port interface.
- All port methods return `Promise<Result<T>>` — never throw.
- Import from barrel `index.ts` files, not individual files.
- PinoLogger pattern: constructor takes injected dependencies, no global state.

### Git Intelligence

Recent commits (most recent first):
- `956fb1b` — Add Docker Compose, Dockerfile, and entrypoint (Story 1.4)
- `86be137` — Add typed config and Pino logging with tests (Story 1.3)
- `e9fb7c0` — Delegate Memory VOs; signal interfaces; readonly
- `50d2801` — Add trim checks, uuidPattern constant, VO refactor

**Conventions from git:**
- Commit messages are imperative, concise, reference what was added/changed.
- Each story produces a focused commit with clear scope.
- No breaking changes to existing code patterns.

### Project Structure Notes

- `src/infrastructure/filesystem/index.ts` currently has only `// barrel export` — needs the `SkillRegistryImpl` export added.
- `src/infrastructure/filesystem/` has no other implementation files yet — this is the first.
- All other barrel exports in the project follow the pattern: `export { ClassName } from "./file.implementation.ts";`

### What This Story Does NOT Include

- No DI wiring (Story 1.6 — entry layer wires SkillRegistryImpl into container)
- No skill content implementation (actual skill logic is in later epics)
- No skill protection mechanisms (Story 8.1 — system skill write protection)
- No proto-skill lifecycle management (Story 8.2)
- No database operations (this is filesystem-only)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Seed Directory] — seed/ structure, identity template, skill file format
- [Source: _bmad-output/planning-artifacts/architecture.md#Skill Index Format] — skill-index.json schema
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — first-boot mechanism, volume mounts
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Summary] — Decision #12: Docker topology
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — filesystem adapter location
- [Source: _bmad-output/planning-artifacts/architecture.md#AI Agent Implementation Rules] — dot-suffix naming, Result<T>, barrel exports, implements keyword
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — AC and user story, BDD scenarios
- [Source: _bmad-output/planning-artifacts/prd.md#FR38-39] — Skill discovery and loading
- [Source: _bmad-output/planning-artifacts/prd.md#FR48-49] — Persistence, system skill hot-deploy
- [Source: _bmad-output/implementation-artifacts/1-4-docker-compose-container-environment.md] — Previous story: entrypoint.sh, Dockerfile, .dockerignore patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Biome auto-formatted 3 files (skill-index.json tabs, import ordering in test, line collapsing in implementation)
- TypeScript strict mode (`noUncheckedIndexedAccess`) required switch statements instead of Record lookups for type/status mapping, and explicit null check for array indexing in `updateSkillStatus`
- `bash -n docker/entrypoint.sh` confirmed valid bash syntax

### Completion Notes List

- Created complete seed directory with identity template, 6 system skill placeholders (YAML frontmatter), skill-index.json, webapp placeholder, and .gitkeep for empty dirs
- Extended docker/entrypoint.sh with idempotent first-boot seed copy logic (per-directory existence checks)
- Updated Dockerfile to COPY seed/ into image and .dockerignore to allow seed markdown files
- Implemented SkillRegistryImpl with all 4 port methods: listSkills, loadSkill, registerSkill, updateSkillStatus
- Explicit JSON↔domain enum mapping (lowercase ↔ PascalCase) via switch statements
- Path traversal protection on loadSkill (rejects paths containing ".." segments)
- Duplicate skill name rejection on registerSkill
- Atomic write pattern (write .tmp then rename) for registerSkill and updateSkillStatus
- 13 tests covering happy paths, error cases, path traversal, duplicates, and seed file integration
- 313 total tests pass (13 new), 0 regressions

### File List

New files:
- seed/identity.md
- seed/skills/system/memory-recall.md
- seed/skills/system/memory-store.md
- seed/skills/system/telegram-send.md
- seed/skills/system/webapp-deploy.md
- seed/skills/system/identity-update.md
- seed/skills/system/reflection.md
- seed/skills/self/.gitkeep
- seed/skills/proto/.gitkeep
- seed/skills/skill-index.json
- seed/webapp/index.html
- src/infrastructure/filesystem/skill-registry.implementation.ts
- tests/infrastructure/filesystem/skill-registry.test.ts

Modified files:
- docker/entrypoint.sh (added seed copy logic)
- docker/Dockerfile (added COPY seed/)
- .dockerignore (added !seed/**/*.md)
- src/infrastructure/filesystem/index.ts (added barrel export)

### Change Log

- 2026-03-13: Story 1.5 implemented — seed directory (identity, 6 system skills, skill-index.json, webapp), first-boot entrypoint extension, SkillRegistryImpl with 4 methods + path traversal protection + duplicate rejection. 13 new tests, 313 total pass, 0 regressions.
- 2026-03-13: Code review (AI) — 0 CRITICAL, 3 MEDIUM, 2 LOW findings. All MEDIUM fixed inline:
  - [M1] Fixed JSON.stringify indent from 2-space to tab for consistency with biome formatting
  - [M2] Added backslash rejection to path traversal check for defense-in-depth
  - [M3] Added test for empty skill index (`[]`) returning empty array
  - Added test for backslash path traversal pattern
  - 315 total tests pass, 0 regressions. Status → done.
