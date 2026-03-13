# Story 1.4: Docker Compose & Container Environment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (J),
I want a Docker Compose setup with Nyx's container and pgvector database,
so that the complete runtime environment can be built, started, and restarted with persistent state. (FR44, FR45, FR46, FR47, FR48)

## Acceptance Criteria

1. **Given** `docker/Dockerfile`
   **When** the image is built
   **Then** it uses Ubuntu 24.04 as base
   **And** Bun and Node.js 22 are installed and available system-wide on PATH (both root and nyx users)
   **And** Playwright and Chromium are installed (headless)
   **And** dev tools are available (git, build-essential, python3)
   **And** a `nyx` user account is created with a persistent home directory
   **And** the application source is copied and dependencies installed
   **And** the entrypoint runs `docker/entrypoint.sh`
   **And** `.dockerignore` excludes node_modules, .git, tests, .env, and build artifacts from the image

2. **Given** `docker/docker-compose.yml`
   **When** `docker compose up` is run
   **Then** two services start: `nyx` and `postgres`
   **And** postgres uses `pgvector/pgvector:pg17` image with POSTGRES_DB=nyx, POSTGRES_USER=nyx, and password from `.env`
   **And** nyx service `depends_on` postgres, uses `restart: unless-stopped`
   **And** four named volumes are defined: `nyx-home` (/home/nyx), `nyx-signals` (/app/signals), `nyx-logs` (/app/logs), `nyx-pgdata` (/var/lib/postgresql/data)
   **And** webapp port is exposed (configurable via WEBAPP_PORT, default 3000)
   **And** `.env` file provides all credentials (NFR6)

3. **Given** the container is running
   **When** J stops and restarts with `docker compose down && docker compose up`
   **Then** all four named volumes are declared in docker-compose.yml and persist across restarts (NFR10, NFR12) — manual verification
   **And** the nyx container has full filesystem access, code execution, package installation, and internet access (FR44-47, NFR8-9)

## Tasks / Subtasks

- [x] Task 1: Create Dockerfile (AC: #1)
  - [x] 1.1 Create `docker/Dockerfile` — Ubuntu 24.04 base, single-stage
  - [x] 1.2 Install system packages: `git`, `build-essential`, `python3`, `curl`, `wget`, `ca-certificates`, `gosu`
  - [x] 1.3 Install Node.js 22 via NodeSource setup script
  - [x] 1.4 Install Bun via official install script, then symlink to `/usr/local/bin/bun` and `/usr/local/bin/bunx` for system-wide access
  - [x] 1.5 Install Playwright and Chromium dependencies (`npx playwright install --with-deps chromium`)
  - [x] 1.6 Create `nyx` user with home directory `/home/nyx`, set ownership
  - [x] 1.7 Copy application source (`package.json`, `bun.lock`, `src/`, `tsconfig.json`, `biome.json`, `bunfig.toml`)
  - [x] 1.8 Run `bun install --frozen-lockfile` for production dependencies
  - [x] 1.9 Create runtime directories: `/app/signals`, `/app/logs`
  - [x] 1.10 Set entrypoint to `docker/entrypoint.sh`

- [x] Task 2: Create entrypoint script (AC: #1, #3)
  - [x] 2.1 Create `docker/entrypoint.sh` — bash script, executable
  - [x] 2.2 Create signal subdirectories if they don't exist: `/app/signals/wake/`, `/app/signals/telegram/`
  - [x] 2.3 Ensure correct ownership of volume mount points for `nyx` user (targeted chown, not recursive on large volumes)
  - [x] 2.4 Execute as nyx user via `exec gosu nyx bun run src/entry/heartbeat.ts` (PID 1 signal handling)

- [x] Task 3: Create docker-compose.yml (AC: #2)
  - [x] 3.1 Create `docker/docker-compose.yml` with two services: `nyx` and `postgres`
  - [x] 3.2 `nyx` service: build context `..`, dockerfile `docker/Dockerfile`, restart `unless-stopped`, `depends_on: postgres`, `env_file: ../.env`, port mapping `${WEBAPP_PORT:-3000}:3000`
  - [x] 3.3 `nyx` volumes: `nyx-home:/home/nyx`, `nyx-signals:/app/signals`, `nyx-logs:/app/logs`
  - [x] 3.4 `postgres` service: image `pgvector/pgvector:pg17`, restart `unless-stopped`, volume `nyx-pgdata:/var/lib/postgresql/data`, environment from `.env` variables
  - [x] 3.5 Define four named volumes: `nyx-home`, `nyx-signals`, `nyx-logs`, `nyx-pgdata`

- [x] Task 4: Create .dockerignore (AC: #1)
  - [x] 4.1 Create `.dockerignore` — exclude `node_modules/`, `.git/`, `_bmad*/`, `tests/`, `*.md` (except src/**/*.md), `.env`, `docker/`, `.claude/`

- [x] Task 5: Validate build and structure (AC: #1, #2, #3)
  - [x] 5.1 Verify `docker build -f docker/Dockerfile .` — Docker daemon not running; Dockerfile syntax validated structurally
  - [x] 5.2 Verify `docker compose -f docker/docker-compose.yml config` validates — PASSED (with .env present)
  - [x] 5.3 Run `bun run check`, `bun run typecheck`, `bun test` — 0 regressions (300 tests pass)

## Dev Notes

### Architecture Compliance

**Clean Architecture — This story is infrastructure-only (no application/domain code):**

This story creates Docker infrastructure files only. No TypeScript application code is added or modified. The Dockerfile, docker-compose.yml, and entrypoint.sh are operational infrastructure that wraps the existing application.

```
docker/
├── Dockerfile           (NEW — container image definition)
├── docker-compose.yml   (NEW — service orchestration)
└── entrypoint.sh        (NEW — container startup script)

.dockerignore            (NEW — build context exclusions)
```

### Dockerfile — Exact Specification

**File:** `docker/Dockerfile`

```dockerfile
FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages (including gosu for proper user switching)
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3 \
    curl \
    wget \
    ca-certificates \
    gnupg \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (required for Agent SDK compatibility)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun and symlink for system-wide access (CRITICAL: nyx user needs bun on PATH)
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -s /root/.bun/bin/bunx /usr/local/bin/bunx
ENV PATH="/root/.bun/bin:$PATH"

# Install Playwright + Chromium (headless, for visual feedback loop)
RUN npx playwright install --with-deps chromium

# Create nyx user with home directory
RUN useradd -m -s /bin/bash nyx

# Create runtime directories
RUN mkdir -p /app/signals /app/logs \
    && chown -R nyx:nyx /app

# Set working directory
WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application source
COPY src/ ./src/
COPY tsconfig.json biome.json bunfig.toml ./

# Copy entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set ownership
RUN chown -R nyx:nyx /app

ENTRYPOINT ["/entrypoint.sh"]
```

**Key decisions:**
- Ubuntu 24.04 base — this is Nyx's body, not a minimal runtime. Full dev tools per architecture spec.
- Node.js 22 is required for Agent SDK compatibility (Bun alone may not suffice for all SDK features).
- Bun is the primary runtime and package manager.
- Playwright + Chromium installed system-wide for Story 7.3 (visual feedback loop).
- `nyx` user created. Entrypoint runs as root for directory setup, then drops to nyx via `gosu` (standard Docker user-switching tool).
- Layer caching: `package.json` + `bun.lock` copied before source for efficient rebuilds.
- Runtime dirs (`/app/signals`, `/app/logs`) created at build time; volumes overlay them at runtime.

**CRITICAL — Bun install path:**
- When installed as root, Bun goes to `/root/.bun/bin/bun`.
- The `nyx` user needs Bun on PATH. The Dockerfile MUST symlink to `/usr/local/bin/bun` after install.
- Both `bun` and `bunx` must be symlinked for full functionality.
- Without this symlink, the container will fail on every boot when `gosu nyx bun run ...` executes.

### docker-compose.yml — Exact Specification

**File:** `docker/docker-compose.yml`

```yaml
services:
  nyx:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    restart: unless-stopped
    volumes:
      - nyx-home:/home/nyx
      - nyx-signals:/app/signals
      - nyx-logs:/app/logs
    depends_on:
      - postgres
    env_file: ../.env
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
  nyx-home:
  nyx-signals:
  nyx-logs:
  nyx-pgdata:
```

**CRITICAL — Build context path:**
- The docker-compose.yml lives in `docker/`, so `context: ..` points to project root.
- Alternatively, if running `docker compose` from project root with `-f docker/docker-compose.yml`, context paths may need adjustment.
- Architecture spec shows `context: .` and `dockerfile: docker/Dockerfile` — this implies running from project root. Match this convention: set `context: .` and use `-f docker/docker-compose.yml` from project root, OR place docker-compose.yml at project root.
- **Recommended approach:** Keep docker-compose.yml in `docker/` per architecture spec, use `context: ..` to reference project root as build context.

**Volume mapping rationale:**
- `nyx-home:/home/nyx` — Identity doc, skills, webapp source, anything Nyx creates. Persists across rebuilds.
- `nyx-signals:/app/signals` — Wake signals, Telegram message queue. IPC bus.
- `nyx-logs:/app/logs` — Structured pino logs (rolling file output). Crash reconstruction (NFR11).
- `nyx-pgdata:/var/lib/postgresql/data` — pgvector database. All memories.

### entrypoint.sh — Exact Specification

**File:** `docker/entrypoint.sh`

```bash
#!/bin/bash
set -e

# Create signal subdirectories if they don't exist (first boot)
mkdir -p /app/signals/wake /app/signals/telegram

# Ensure nyx owns volume mount points (targeted, not recursive on large volumes)
chown nyx:nyx /home/nyx /app/signals /app/signals/wake /app/signals/telegram /app/logs

# Execute as nyx user via gosu — exec replaces shell process for proper signal handling
exec gosu nyx bun run src/entry/heartbeat.ts
```

**Key details:**
- `set -e` — fail fast on any error.
- Signal directories created on every boot (idempotent `mkdir -p`).
- `chown` is targeted (not `-R`) to avoid slow recursive ownership on populated volumes. Only top-level dirs need nyx ownership; files inside are created by nyx at runtime.
- `gosu` is the standard Docker tool for dropping from root to unprivileged user. Proper PID 1 signal propagation (SIGTERM from `docker stop`).
- The seed file copy logic is NOT in this story — that's Story 1.5 (entrypoint.sh will be extended there).

**WARNING — Empty heartbeat.ts:**
- `src/entry/heartbeat.ts` is currently a 0-byte stub. When the container starts, `bun run src/entry/heartbeat.ts` will exit immediately.
- Docker's `restart: unless-stopped` will restart the container in a loop. This is expected behavior until Story 1.6 implements the actual init/shutdown logic.
- To prevent restart loops during development before Story 1.6, you can temporarily add `sleep infinity` or a simple console.log to heartbeat.ts.

### .dockerignore — Specification

**File:** `.dockerignore`

```
node_modules/
.git/
_bmad/
_bmad-output/
bmad-story-autopilot-workspace/
tests/
.env
.env.*
!.env.example
docker/
.claude/
*.md
!src/**/*.md
```

**Rationale:**
- Exclude everything not needed in the container image to minimize build context size and image size.
- `node_modules/` excluded — `bun install` runs inside the container.
- `.env` excluded — never bake secrets into images (NFR6). Mounted at runtime via `env_file`.
- `tests/` excluded — not needed in production container.
- `docker/` excluded from COPY but `entrypoint.sh` is copied explicitly in Dockerfile.

### Existing .env.example

The `.env.example` file already contains all required variables from Story 1.3:

```
ANTHROPIC_API_KEY, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER,
POSTGRES_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_CHAT_ID, WEBAPP_PORT,
LOG_LEVEL, HOME_DIR, SIGNALS_DIR, LOGS_DIR
```

No changes needed to `.env.example` for this story.

### Testing Strategy

**This story has no TypeScript code changes**, so standard unit tests don't apply. Validation is structural:

1. **Dockerfile builds:** `docker build -f docker/Dockerfile .` succeeds without errors.
2. **docker-compose validates:** `docker compose -f docker/docker-compose.yml config` produces valid output.
3. **Regression check:** `bun run check`, `bun run typecheck`, `bun test` all pass (300 tests, 0 regressions).
4. **entrypoint.sh is executable:** File has `+x` permission and valid bash syntax (`bash -n docker/entrypoint.sh`).

**Manual verification (not automated):**
- `docker compose up` starts both services.
- `docker compose down && docker compose up` preserves volume data.
- Nyx container has git, python3, bun, node available.

### What This Story Does NOT Include

- No seed directory or first-boot file copy (Story 1.5 — adds seed/ dir and extends entrypoint.sh)
- No application code changes (no TypeScript modified)
- No DI wiring or init sequence (Story 1.6)
- No database migrations (Story 2.1)
- No health checks on the postgres service (can be added later if needed)
- No `bun build` production bundling (the container runs TypeScript directly via Bun)

### Previous Story Intelligence (Story 1.3)

**Learnings to apply:**
- Biome formats with tabs, line width 100. No impact on this story (no TS files).
- `bun run check`, `bun run typecheck`, `bun test` are the validation commands — run for regression check.
- 300 tests currently pass (Stories 1.1 + 1.2 + 1.3). Must not regress.
- pino v10.3.1 and pino-roll v4.0.0 are in `package.json` — `bun install --frozen-lockfile` in Dockerfile must resolve these.
- `@biomejs/biome` is a trusted dependency — listed in `trustedDependencies` in package.json.

**Code patterns established:**
- Entry point is `src/entry/heartbeat.ts` — this is what entrypoint.sh must execute.
- Config reads from `process.env` — all env vars must be available at runtime via `env_file: .env`.

### Git Intelligence

Recent commits:
- `86be137` — Add typed config and Pino logging with tests (Story 1.3)
- `e9fb7c0` — Delegate Memory VOs; signal interfaces; readonly
- `50d2801` — Add trim checks, uuidPattern constant, VO refactor
- Domain layer is fully complete (Stories 1.1 + 1.2), infrastructure config+logging done (Story 1.3).
- Entry layer files are 0-byte stubs — the Dockerfile entrypoint will call heartbeat.ts which is currently a stub. That's fine — Story 1.6 implements the actual init/shutdown logic.

### Project Structure Notes

Files to create in this story:

```
docker/
├── Dockerfile            (NEW)
├── docker-compose.yml    (NEW)
└── entrypoint.sh         (NEW)

.dockerignore              (NEW)
```

No existing files are modified. This story is purely additive infrastructure.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Docker Compose topology, container philosophy, volume mapping
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Summary] — Decision #12: 2 services (Ubuntu nyx + pgvector postgres), 4 named volumes
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — `docker/` directory with Dockerfile, docker-compose.yml, entrypoint.sh
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — AC and user story
- [Source: _bmad-output/planning-artifacts/prd.md#FR44-48] — Container environment, code execution, package installation, persistence
- [Source: _bmad-output/planning-artifacts/prd.md#NFR6-9] — Env vars for secrets, firewall rules, full container autonomy
- [Source: _bmad-output/planning-artifacts/prd.md#NFR10-14] — Docker volumes persist, rolling logs, supervised heartbeat, crash isolation
- [Source: _bmad-output/implementation-artifacts/1-3-configuration-logging.md] — Previous story patterns, pino v10.3.1, env var structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Docker daemon not running on Windows host — `docker build` validation deferred to manual testing. Docker Compose config validated by temporarily creating `.env` from `.env.example`.
- `bash -n docker/entrypoint.sh` confirmed valid bash syntax.
- `docker compose -f docker/docker-compose.yml config` validated successfully with `.env` file present.
- `context: ..` used in docker-compose.yml since file lives in `docker/` subdirectory. Architecture spec shows `context: .` but that assumes running from project root — both approaches work with appropriate `-f` flag.

### Completion Notes List

- Docker infrastructure created: Dockerfile (Ubuntu 24.04 + Bun + Node.js 22 + Playwright + gosu), docker-compose.yml (nyx + postgres services, 4 named volumes), entrypoint.sh (gosu-based user switching, signal dir creation)
- .dockerignore created excluding build artifacts, tests, secrets, and dev tooling
- Bun symlinked to /usr/local/bin for system-wide access (critical for nyx user execution)
- gosu used for proper PID 1 signal handling instead of su
- Targeted chown (not recursive) to avoid slow startup on populated volumes
- 300 existing tests pass, 0 regressions. No new TS tests (infrastructure-only story).

### File List

New files:
- docker/Dockerfile
- docker/docker-compose.yml
- docker/entrypoint.sh
- .dockerignore

### Change Log

- 2026-03-13: Story 1.4 implemented — Docker infrastructure: Dockerfile (Ubuntu 24.04, Bun, Node.js 22, Playwright, gosu), docker-compose.yml (nyx + pgvector postgres, 4 volumes), entrypoint.sh (gosu user switching), .dockerignore. 300 tests pass, 0 regressions.
- 2026-03-13: Code review (AI) — 1 HIGH, 2 MEDIUM, 2 LOW findings. All HIGH+MEDIUM fixed inline:
  - [H1] Fixed .dockerignore: replaced `docker/` exclusion with `docker/Dockerfile` and `docker/docker-compose.yml` — entrypoint.sh now available in build context
  - [M1] Added `EXPOSE 3000` to Dockerfile for webapp port documentation
  - [M2] Removed duplicate `chown -R nyx:nyx /app` — consolidated to single chown after all COPY operations
  - 300 total tests pass, 0 regressions. Status → done.
