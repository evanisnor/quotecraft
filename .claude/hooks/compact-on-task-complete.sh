#!/usr/bin/env bash
# compact-on-task-complete.sh
#
# PostToolUse hook: fires after every TaskUpdate call.
# When a task is marked "completed", outputs a compact instruction into
# Claude's context. Claude Code injects hook stdout as a system message
# into the next turn, prompting compaction before the next task begins.
#
# Limitation: hooks cannot invoke /compact directly. This hook injects a
# reminder that Claude must act on to trigger compaction.

set -euo pipefail

INPUT=$(cat)

STATUS=$(printf '%s' "$INPUT" | jq -r '.tool_input.status // empty')
TASK_ID=$(printf '%s' "$INPUT" | jq -r '.tool_input.taskId // empty')

if [ "$STATUS" = "completed" ]; then
  printf '[compact-on-task-complete] Task %s marked completed. Compact session context now before starting the next task.\n' "$TASK_ID"
fi
