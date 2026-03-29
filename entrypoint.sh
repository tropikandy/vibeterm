#!/bin/bash
set -e

# Pre-create a persistent 'main' bash session so it survives browser disconnects.
# tmux new-session -A would attach if running, but we're in a script context here
# (not a terminal), so just ensure the session exists detached.
tmux new-session -d -s main 2>/dev/null || true

# Start the vibeterm node server
exec node /app/server.js
