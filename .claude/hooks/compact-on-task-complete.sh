#!/usr/bin/env bash
# new-session-on-task-complete.sh
#
# PostToolUse hook: fires after every TodoWrite call.
# When any todo is marked "completed", writes a signal file that autoclaude
# detects after Claude exits. autoclaude then starts a NEW session (fresh
# context window) instead of resuming, so each task gets a clean slate.
#
# Also injects a message into Claude's next turn instructing it to exit —
# autoclaude will restart with the full prompt for the next task.

set -euo pipefail

INPUT=$(cat)

# TodoWrite tool_input shape: { todos: [{ id, content, status, priority }] }
COMPLETED_ID=$(printf '%s' "$INPUT" | jq -r '
  .tool_input.todos[]?
  | select(.status == "completed")
  | .id
' 2>/dev/null | head -1)

if [[ -n "$COMPLETED_ID" ]]; then
  # Signal autoclaude to start a new session after this one ends.
  mkdir -p "$PWD/.autoclaude"
  touch "$PWD/.autoclaude/new_session_requested"

  # Ask Claude to stop so autoclaude can restart with a fresh context window.
  printf 'Todo %s marked completed. Exit your current turn now — autoclaude will automatically start a new session with a full context window for the next task.\n' "$COMPLETED_ID"
fi
