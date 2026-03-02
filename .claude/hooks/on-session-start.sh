#!/usr/bin/env bash
# on-session-start.sh
#
# UserPromptSubmit hook: fires when a user prompt is submitted.
#
# Records the current git HEAD SHA so the Stop hook can determine which
# commits were made during this session. Always overwrites so each session
# gets a fresh reference point.

set -euo pipefail

mkdir -p "$PWD/.autoclaude"
git -C "$PWD" rev-parse HEAD > "$PWD/.autoclaude/session_start_sha"
