#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Starting Docker services..."
docker compose -f "${REPO_ROOT}/compose.yaml" up -d

pids=()
cleanup() {
  echo ""
  echo "==> Stopping dev servers..."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait "${pids[@]}" 2>/dev/null || true
  echo "==> Stopped."
}
trap cleanup INT TERM EXIT

echo "==> Starting API (air)..."
make -C "${REPO_ROOT}/api" dev &
pids+=($!)

echo "==> Starting dashboard (next dev)..."
make -C "${REPO_ROOT}/dashboard" dev &
pids+=($!)

echo "==> Starting widget (watch mode)..."
make -C "${REPO_ROOT}/widget" dev &
pids+=($!)

echo "==> Full dev stack running. Press Ctrl+C to stop."
wait
