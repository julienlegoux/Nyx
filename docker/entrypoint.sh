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
