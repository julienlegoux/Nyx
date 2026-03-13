#!/bin/bash
set -e

# Create signal subdirectories if they don't exist (first boot)
mkdir -p /app/signals/wake /app/signals/telegram

# Ensure nyx owns volume mount points (targeted, not recursive on large volumes)
chown nyx:nyx /home/nyx /app/signals /app/signals/wake /app/signals/telegram /app/logs

# Execute as nyx user via gosu — proper PID 1 signal handling
exec gosu nyx bun run src/entry/heartbeat.ts
