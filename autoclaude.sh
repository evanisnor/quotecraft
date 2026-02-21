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
# Cron management
# ===========================================================================

remove_cron() {
    crontab -l 2>/dev/null | grep -v "$CRON_TAG" | crontab - 2>/dev/null || true
    log "Removed any existing autoclaude cron job."
}

schedule_cron() {
    local resume_time="$1" # epoch timestamp
    local session_id="${2:-}" # optional session ID
    local minute hour day month

    minute="$(date -r "$resume_time" '+%M')"
    hour="$(date -r "$resume_time" '+%H')"
    day="$(date -r "$resume_time" '+%d')"
    month="$(date -r "$resume_time" '+%m')"

    local resume_flag="--continue"
    if [[ -n "$session_id" ]]; then
        resume_flag="--resume $session_id"
    fi

    local cron_line="$minute $hour $day $month * cd $PROJECT_DIR && ./autoclaude.sh $resume_flag >> $LOG_FILE 2>&1 $CRON_TAG"

    (crontab -l 2>/dev/null || true; echo "$cron_line") | crontab -
    log "Scheduled resume at $(date -r "$resume_time" '+%Y-%m-%d %H:%M:%S') via cron."
    log "Cron entry: $cron_line"
}

# ===========================================================================
# Rate limit detection
# ===========================================================================

parse_reset_time() {
    local output="$1"

    # Pattern 1: resetsAt epoch from rate_limit_event (most reliable — use first)
    local resets_at
    resets_at=$(echo "$output" | jq -r '[.[] | select(.type == "rate_limit_event")] | first | .rate_limit_info.resetsAt // empty' 2>/dev/null || true)
    if [[ -n "$resets_at" && "$resets_at" != "null" ]]; then
        echo $(( resets_at + 120 ))
        return 0
    fi

    # Pattern 2: "in N minutes" or "in N hours"
    local minutes_match hours_match
    minutes_match=$(echo "$output" | grep -oiE 'in ([0-9]+) minutes?' | head -1 | grep -oE '[0-9]+')
    hours_match=$(echo "$output" | grep -oiE 'in ([0-9]+) hours?' | head -1 | grep -oE '[0-9]+')

    if [[ -n "$minutes_match" ]]; then
        echo $(( $(date +%s) + minutes_match * 60 + 120 ))
        return 0
    fi

    if [[ -n "$hours_match" ]]; then
        echo $(( $(date +%s) + hours_match * 3600 + 120 ))
        return 0
    fi

    # Pattern 3: ISO 8601 timestamp
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

    # Pattern 4: "at H:MM AM/PM" style
    local time_match
    time_match=$(echo "$output" | grep -oiE 'at ([0-9]{1,2}:[0-9]{2}\s*(AM|PM))' | head -1 | sed 's/^at //i')
    if [[ -n "$time_match" ]]; then
        local epoch
        epoch=$(date -jf '%I:%M %p' "$time_match" '+%s' 2>/dev/null || true)
        if [[ -n "$epoch" ]]; then
            if (( epoch < $(date +%s) )); then
                epoch=$(( epoch + 86400 ))
            fi
            echo $(( epoch + 120 ))
            return 0
        fi
    fi

    # Pattern 5: "resets 1pm (America/Halifax)" from JSON result field
    local result_field
    result_field=$(echo "$output" | jq -r '[.[] | select(.type == "result")] | first | .result // ""' 2>/dev/null || true)
    local resets_time resets_tz
    resets_time=$(echo "$result_field" | grep -oiE 'resets [0-9]{1,2}(:[0-9]{2})?(am|pm)' | grep -oiE '[0-9]{1,2}(:[0-9]{2})?(am|pm)')
    resets_tz=$(echo "$result_field" | grep -oiE '\([A-Za-z_/]+\)' | tr -d '()')
    if [[ -n "$resets_time" && -n "$resets_tz" ]]; then
        local epoch
        epoch=$(python3 - "$resets_time" "$resets_tz" <<'EOF'
import sys
from datetime import datetime, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

time_str = sys.argv[1].upper()  # e.g. "1PM" or "1:30PM"
tz_str   = sys.argv[2]          # e.g. "America/Halifax"

fmt = "%I:%M%p" if ":" in time_str else "%I%p"
t = datetime.strptime(time_str, fmt)
tz = ZoneInfo(tz_str)
now = datetime.now(tz)
candidate = now.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
if candidate <= now:
    candidate += timedelta(days=1)
print(int(candidate.timestamp()))
EOF
        2>/dev/null || true)
        if [[ -n "$epoch" ]]; then
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

    # Extract the JSON array from output — it's the last thing printed but may
    # be preceded by other non-JSON lines (e.g. warnings, status messages)
    local json_output
    json_output=$(echo "$output" | awk '/^\[/{found=1} found{print}')

    # Save session ID for future resumes
    local new_session_id
    new_session_id=$(echo "$json_output" | jq -r '[.[] | select(.type == "result")] | first | .session_id // empty' 2>/dev/null || true)
    if [[ -n "$new_session_id" ]]; then
        echo "$new_session_id" > "$SESSION_FILE"
        log "Session ID saved: $new_session_id"
    fi

    # Log result summary
    local result_preview
    result_preview=$(echo "$json_output" | jq -r '[.[] | select(.type == "result")] | first | .result // empty' 2>/dev/null | head -20 || true)
    if [[ -n "$result_preview" ]]; then
        log "Result preview:"
        log "$result_preview"
    fi

    # Check for rate limiting
    if [[ $exit_code -ne 0 ]] || is_rate_limited "$output"; then
        log "Detected rate limit or error (exit code: $exit_code)."

        local reset_epoch
        if reset_epoch=$(parse_reset_time "$json_output"); then
            local reset_human
            reset_human="$(date -r "$reset_epoch" '+%Y-%m-%d %H:%M:%S')"
            log "Usage limit resets at: $reset_human"
            schedule_cron "$reset_epoch" "$new_session_id"
        else
            # Default: retry in 5 hours (typical Pro plan reset window)
            local default_wait=18000
            local fallback_epoch=$(( $(date +%s) + default_wait ))
            local fallback_human
            fallback_human="$(date -r "$fallback_epoch" '+%Y-%m-%d %H:%M:%S')"
            log "Could not parse reset time. Defaulting to 5-hour wait."
            log "Scheduled retry at: $fallback_human"
            schedule_cron "$fallback_epoch" "$new_session_id"
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
