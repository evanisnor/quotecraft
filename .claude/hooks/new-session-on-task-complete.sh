#!/usr/bin/env bash
# new-session-on-task-complete.sh
#
# Stop hook: fires when the Claude session ends.
#
# Checks whether any commits made during this session added a ✅ status to
# PROJECT_STATUS.md — the reliable indicator that a project task was completed.
# If yes, signals autoclaude to start a NEW session so the next task begins
# with a full, clean context window.
#
# Relies on on-session-start.sh (UserPromptSubmit hook) having recorded the
# HEAD SHA at session start into .autoclaude/session_start_sha.

set -uo pipefail

SESSION_START_FILE="$PWD/.autoclaude/session_start_sha"

if [[ ! -f "$SESSION_START_FILE" ]]; then
  exit 0
fi

SESSION_START_SHA=$(cat "$SESSION_START_FILE")
rm -f "$SESSION_START_FILE"

# Signal a new session if any commit since session start added ✅ to PROJECT_STATUS.md.
if git -C "$PWD" log "${SESSION_START_SHA}..HEAD" -p -- PROJECT_STATUS.md 2>/dev/null | grep -q '^+.*✅'; then
  mkdir -p "$PWD/.autoclaude"
  touch "$PWD/.autoclaude/new_session_requested"
fi
