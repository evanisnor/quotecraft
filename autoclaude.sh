#!/bin/bash
set -euo pipefail

# ===========================================================================
# autoclaude.sh — Automated Claude Code runner for QuoteCraft
#
# Runs Claude Code in headless mode to build the project according to the
# plan. When usage limits are hit, detects the reset time and schedules a
# cron job to automatically resume.
#
# Usage:
#   ./autoclaude.sh              # Start a new session
#   ./autoclaude.sh --continue   # Continue the most recent session
#   ./autoclaude.sh --resume     # Resume a specific session (interactive picker)
# ===========================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/.autoclaude"
LOG_FILE="$LOG_DIR/autoclaude.log"
SESSION_FILE="$LOG_DIR/session_id"
CRON_TAG="# autoclaude-quotecraft"

MODEL="sonnet"

PROMPT='You are building the QuoteCraft project. Follow the workflow defined in CLAUDE.md exactly:

1. Open PROJECT_STATUS.md and find the next incomplete task (P0 first, top-to-bottom).
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
# Cron management
# ===========================================================================

remove_cron() {
    crontab -l 2>/dev/null | grep -v "$CRON_TAG" | crontab - 2>/dev/null || true
    log "Removed any existing autoclaude cron job."
}

schedule_cron() {
    local resume_time="$1" # epoch timestamp
    local minute hour day month

    minute="$(date -r "$resume_time" '+%M')"
    hour="$(date -r "$resume_time" '+%H')"
    day="$(date -r "$resume_time" '+%d')"
    month="$(date -r "$resume_time" '+%m')"

    remove_cron

    local cron_line="$minute $hour $day $month * cd $PROJECT_DIR && ./autoclaude.sh --continue >> $LOG_FILE 2>&1 $CRON_TAG"

    (crontab -l 2>/dev/null || true; echo "$cron_line") | crontab -
    log "Scheduled resume at $(date -r "$resume_time" '+%Y-%m-%d %H:%M:%S') via cron."
    log "Cron entry: $cron_line"
}

# ===========================================================================
# Rate limit detection
# ===========================================================================

parse_reset_time() {
    local output="$1"

    # Try to extract a reset time from Claude's output.
    # Common patterns:
    #   "resets at 3:45 PM"
    #   "resets at 2026-02-21T15:45:00"
    #   "try again in X minutes"
    #   "retry after X hours"
    #   "will reset in X hours"

    # Pattern 1: "in N minutes" or "in N hours"
    local minutes_match hours_match
    minutes_match=$(echo "$output" | grep -oiE 'in ([0-9]+) minutes?' | head -1 | grep -oE '[0-9]+')
    hours_match=$(echo "$output" | grep -oiE 'in ([0-9]+) hours?' | head -1 | grep -oE '[0-9]+')

    if [[ -n "$minutes_match" ]]; then
        echo $(( $(date +%s) + minutes_match * 60 + 120 )) # Add 2 min buffer
        return 0
    fi

    if [[ -n "$hours_match" ]]; then
        echo $(( $(date +%s) + hours_match * 3600 + 120 ))
        return 0
    fi

    # Pattern 2: ISO 8601 timestamp
    local iso_match
    iso_match=$(echo "$output" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' | head -1)
    if [[ -n "$iso_match" ]]; then
        local epoch
        epoch=$(date -jf '%Y-%m-%dT%H:%M:%S' "$iso_match" '+%s' 2>/dev/null || true)
        if [[ -n "$epoch" ]]; then
            echo $(( epoch + 120 ))
            return 0
        fi
    fi

    # Pattern 3: "at H:MM AM/PM" style
    local time_match
    time_match=$(echo "$output" | grep -oiE 'at ([0-9]{1,2}:[0-9]{2}\s*(AM|PM))' | head -1 | sed 's/^at //i')
    if [[ -n "$time_match" ]]; then
        local epoch
        epoch=$(date -jf '%I:%M %p' "$time_match" '+%s' 2>/dev/null || true)
        if [[ -n "$epoch" ]]; then
            # If parsed time is in the past, it's tomorrow
            if (( epoch < $(date +%s) )); then
                epoch=$(( epoch + 86400 ))
            fi
            echo $(( epoch + 120 ))
            return 0
        fi
    fi

    return 1
}

is_rate_limited() {
    local output="$1"
    echo "$output" | grep -qiE 'rate.?limit|usage.?limit|exceeded.*limit|too many requests|over(loaded|capacity)|429|try again|reset'
}

# ===========================================================================
# Main
# ===========================================================================

main() {
    local mode="new"
    local session_id=""

    # Remove any existing cron job on fresh run
    remove_cron

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --continue)
                mode="continue"
                shift
                ;;
            --resume)
                mode="resume"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    log "============================================"
    log "autoclaude starting (mode=$mode)"
    log "============================================"

    # Build the claude command
    local -a cmd=(
        claude
        -p "$PROMPT"
        --model "$MODEL"
        --dangerously-skip-permissions
        --output-format json
        --verbose
    )

    case "$mode" in
        continue)
            cmd+=(--continue)
            log "Continuing most recent session."
            ;;
        resume)
            if [[ -f "$SESSION_FILE" ]]; then
                session_id="$(cat "$SESSION_FILE")"
                cmd+=(--resume "$session_id")
                log "Resuming session: $session_id"
            else
                log "No saved session ID found. Starting new session."
            fi
            ;;
        new)
            log "Starting new session."
            ;;
    esac

    # Run Claude
    local output=""
    local exit_code=0

    # Log the actual command being run (minus the prompt for readability)
    local cmd_display=("${cmd[@]}")
    for i in "${!cmd_display[@]}"; do
        if [[ "${cmd_display[$i]}" == "$PROMPT" ]]; then
            cmd_display[$i]="<prompt>"
        fi
    done
    log "Running: ${cmd_display[*]}"

    cd "$PROJECT_DIR"
    unset CLAUDECODE 2>/dev/null || true
    output=$("${cmd[@]}" 2>&1) || exit_code=$?

    # Always log raw output on failure so we can actually debug
    if [[ $exit_code -ne 0 ]]; then
        log "Claude exited with code $exit_code. Raw output:"
        log "$output"
    fi

    # Save session ID for future resumes
    local new_session_id
    new_session_id=$(echo "$output" | jq -r '.session_id // empty' 2>/dev/null || true)
    if [[ -n "$new_session_id" ]]; then
        echo "$new_session_id" > "$SESSION_FILE"
        log "Session ID saved: $new_session_id"
    fi

    # Log result summary
    local result_preview
    result_preview=$(echo "$output" | jq -r '.result // empty' 2>/dev/null | head -20 || true)
    if [[ -n "$result_preview" ]]; then
        log "Result preview:"
        log "$result_preview"
    fi

    # Check for rate limiting
    if [[ $exit_code -ne 0 ]] || is_rate_limited "$output"; then
        log "Detected rate limit or error (exit code: $exit_code)."

        local reset_epoch
        if reset_epoch=$(parse_reset_time "$output"); then
            local reset_human
            reset_human="$(date -r "$reset_epoch" '+%Y-%m-%d %H:%M:%S')"
            log "Usage limit resets at: $reset_human"
            schedule_cron "$reset_epoch"
        else
            # Default: retry in 5 hours (typical Pro plan reset window)
            local default_wait=18000
            local fallback_epoch=$(( $(date +%s) + default_wait ))
            local fallback_human
            fallback_human="$(date -r "$fallback_epoch" '+%Y-%m-%d %H:%M:%S')"
            log "Could not parse reset time. Defaulting to 5-hour wait."
            log "Scheduled retry at: $fallback_human"
            schedule_cron "$fallback_epoch"
        fi
    else
        log "Claude exited cleanly (exit code: $exit_code)."
        log "Session complete. Run './autoclaude.sh --continue' to pick up more tasks."
    fi

    log "============================================"
    log "autoclaude finished"
    log "============================================"
}

main "$@"
