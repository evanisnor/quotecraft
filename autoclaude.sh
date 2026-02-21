#!/bin/bash
set -euo pipefail

# ===========================================================================
# autoclaude.sh — Automated Claude Code runner for QuoteCraft
#
# Runs Claude Code in headless mode to build the project. When usage limits
# are hit, waits for the reset window and resumes automatically.
#
# Usage:
#   ./autoclaude.sh              # Start a new session
#   ./autoclaude.sh --continue   # Continue the most recent session
#   ./autoclaude.sh --resume     # Resume the saved session ID
# ===========================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/.autoclaude"
LOG_FILE="$LOG_DIR/autoclaude.log"
SESSION_FILE="$LOG_DIR/session_id"
SESSION_EVENTS="$LOG_DIR/last_session.jsonl"
RUN_STATE="$LOG_DIR/run_state"

CLAUDE_BIN="${CLAUDE_BIN:-/usr/local/bin/claude}"
MODEL="sonnet"

PROMPT='You are building the QuoteCraft project. Follow the workflow defined in CLAUDE.md exactly:

0. If there are uncommitted changes, resume the implementation. If you cant find an "In Progress" task, check the git log and "decision" directory for context."
1. Open PROJECT_STATUS.md and find the next incomplete task (P0 first, top-to-bottom). Mark its status as "In Progress".
2. Read the user story and acceptance criteria in PROJECT_PLAN.md.
3. Read linked requirements in REQUIREMENTS.md.
4. Read relevant sections of SYSTEM_DESIGN.md.
5. Implement the task. Write tests alongside implementation.
6. After implementation, invoke the code-reviewer agent. Fix issues until it passes.
7. Commit with the format: [TASK-ID] Brief description. Include updated PROJECT_STATUS.md.
8. Move to the next task and repeat.

Continue until you run out of tasks or context. Stay focused — one task at a time.'

# ===========================================================================
# Setup
# ===========================================================================

mkdir -p "$LOG_DIR"

log() {
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "[$timestamp] $*" | tee -a "$LOG_FILE"
}

# ===========================================================================
# Event interpretation
# ===========================================================================

# Called for each stream-json event line. Logs human-readable summaries.
interpret_event() {
    local line="$1"
    local type
    type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null) || return 0
    [[ -z "$type" ]] && return 0

    case "$type" in
        assistant)
            while IFS= read -r tool_json; do
                [[ -z "$tool_json" ]] && continue
                local name input_summary
                name=$(echo "$tool_json" | jq -r '.name // ""' 2>/dev/null) || continue
                case "$name" in
                    Bash)       input_summary=$(echo "$tool_json" | jq -r '.input.description // .input.command // ""' 2>/dev/null | head -c 120) ;;
                    Read)       input_summary=$(echo "$tool_json" | jq -r '.input.file_path // ""' 2>/dev/null) ;;
                    Edit|Write) input_summary=$(echo "$tool_json" | jq -r '.input.file_path // ""' 2>/dev/null) ;;
                    Glob)       input_summary=$(echo "$tool_json" | jq -r '.input.pattern // ""' 2>/dev/null) ;;
                    Grep)       input_summary=$(echo "$tool_json" | jq -r '"\(.input.pattern // "") in \(.input.path // ".")"' 2>/dev/null) ;;
                    Task)       input_summary=$(echo "$tool_json" | jq -r '.input.description // ""' 2>/dev/null) ;;
                    TodoWrite)  input_summary="updating todo list" ;;
                    *)          input_summary=$(echo "$tool_json" | jq -r '.input | keys | join(", ")' 2>/dev/null) ;;
                esac
                log "  [$name] ${input_summary:0:120}"
            done < <(echo "$line" | jq -c '.message.content[]? | select(.type == "tool_use")' 2>/dev/null || true)
            ;;
        result)
            local result
            result=$(echo "$line" | jq -r '.result // ""' 2>/dev/null) || return 0
            [[ -n "$result" ]] && log "Result: ${result:0:300}"
            ;;
        rate_limit_event)
            local status
            status=$(echo "$line" | jq -r '.rate_limit_info.status // ""' 2>/dev/null) || return 0
            [[ "$status" == "rejected" ]] && log "Rate limit reached."
            ;;
    esac
}

# ===========================================================================
# Main
# ===========================================================================

main() {
    local mode="new"
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --continue) mode="continue"; shift ;;
            --resume)   mode="resume";   shift ;;
            *)          shift ;;
        esac
    done

    log "============================================"
    log "autoclaude starting (mode=$mode)"
    log "============================================"

    local -a base_cmd=(
        "$CLAUDE_BIN"
        -p "$PROMPT"
        --model "$MODEL"
        --dangerously-skip-permissions
        --output-format stream-json
        --verbose
    )

    # Set initial resume flags based on mode
    local resume_flag=""
    case "$mode" in
        continue)
            resume_flag="--continue"
            log "Continuing most recent session."
            ;;
        resume)
            if [[ -f "$SESSION_FILE" ]]; then
                resume_flag="--resume $(cat "$SESSION_FILE")"
                log "Resuming session: $(cat "$SESSION_FILE")"
            else
                log "No saved session. Starting new."
            fi
            ;;
        new)
            log "Starting new session."
            ;;
    esac

    while true; do
        # Build command with current resume flag
        local -a cmd=("${base_cmd[@]}")
        if [[ -n "$resume_flag" ]]; then
            read -ra resume_args <<< "$resume_flag"
            cmd+=("${resume_args[@]}")
        fi

        log "Running: $CLAUDE_BIN -p <prompt> --model $MODEL --dangerously-skip-permissions --output-format stream-json --verbose${resume_flag:+ $resume_flag}"

        > "$SESSION_EVENTS"
        > "$RUN_STATE"

        cd "$PROJECT_DIR"
        unset CLAUDECODE 2>/dev/null || true

        # Stream events line by line. Use set +e to capture exit code through
        # the pipeline — PIPESTATUS[0] gives claude's exit code after the pipe.
        local exit_code=0
        set +e
        "${cmd[@]}" 2>&1 | while IFS= read -r line; do
            echo "$line" >> "$SESSION_EVENTS"
            interpret_event "$line" 2>/dev/null || true

            local type
            type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null || true)

            case "$type" in
                result)
                    local sid
                    sid=$(echo "$line" | jq -r '.session_id // empty' 2>/dev/null || true)
                    [[ -n "$sid" ]] && echo "SESSION_ID=$sid" >> "$RUN_STATE"
                    ;;
                rate_limit_event)
                    local rl_status resets_at
                    rl_status=$(echo "$line" | jq -r '.rate_limit_info.status // ""' 2>/dev/null || true)
                    resets_at=$(echo "$line" | jq -r '.rate_limit_info.resetsAt // empty' 2>/dev/null || true)
                    [[ "$rl_status" == "rejected" && -n "$resets_at" ]] && echo "RESETS_AT=$resets_at" >> "$RUN_STATE"
                    ;;
            esac
        done
        exit_code=${PIPESTATUS[0]}
        set -e

        # Read state written by the stream processor
        local session_id="" resets_at=""
        if [[ -f "$RUN_STATE" ]]; then
            session_id=$(grep '^SESSION_ID=' "$RUN_STATE" 2>/dev/null | cut -d= -f2 | tail -1 || true)
            resets_at=$(grep '^RESETS_AT=' "$RUN_STATE" 2>/dev/null | cut -d= -f2 | tail -1 || true)
        fi

        if [[ -n "$session_id" ]]; then
            echo "$session_id" > "$SESSION_FILE"
            log "Session ID saved: $session_id"
        fi

        if [[ -n "$resets_at" ]]; then
            local now resume_at wait_seconds resume_human
            now=$(date +%s)
            resume_at=$(( resets_at + 120 ))
            wait_seconds=$(( resume_at - now ))
            resume_human="$(date -r "$resume_at" '+%Y-%m-%d %H:%M:%S')"

            if (( wait_seconds > 0 )); then
                log "Waiting until $resume_human for rate limit to reset..."
                sleep "$wait_seconds"
            fi

            log "Resuming..."
            if [[ -n "$session_id" ]]; then
                resume_flag="--resume $session_id"
            else
                resume_flag="--continue"
            fi
        elif [[ $exit_code -ne 0 ]]; then
            log "Claude exited with error (exit code: $exit_code). See $SESSION_EVENTS for details."
            exit 1
        else
            log "Claude exited cleanly."
            log "Session complete."
            break
        fi
    done

    log "============================================"
    log "autoclaude finished"
    log "============================================"
}

main "$@"
