#!/usr/bin/env bash
# new-session-on-task-complete.sh
#
# PostToolUse hook: fires after every TodoWrite call.
#
# Claude's built-in todo system is session-level work tracking — separate
# from QuoteCraft's task backlog in PROJECT_STATUS.md. Claude creates internal
# todos to organize progress toward a project task, then marks them completed.
#
# When Claude marks a todo completed, this hook signals autoclaude to start
# a NEW session after Claude exits, giving the next project task a full,
# clean context window instead of inheriting accumulated session history.

set -euo pipefail

INPUT=$(cat)

# TodoWrite tool_input shape: { todos: [{ id, content, status, priority }] }
# Only signal a new session when ALL todos are completed — Claude creates
# multiple todos per project task, so triggering on the first completion
# would restart the session mid-task. A fully-completed list means Claude
# has finished its current batch of work.
REMAINING=$(printf '%s' "$INPUT" | jq -r '
  [.tool_input.todos[]? | select(.status != "completed")] | length
' 2>/dev/null)

if [[ "$REMAINING" == "0" && -n "$REMAINING" ]]; then
  # Signal autoclaude to start a new session after this one ends.
  mkdir -p "$PWD/.autoclaude"
  touch "$PWD/.autoclaude/new_session_requested"

  # Ask Claude to stop so autoclaude can restart with a fresh context window.
  printf 'All todos completed. Exit your current turn now — autoclaude will automatically start a new session with a full context window for the next project task.\n'
fi
