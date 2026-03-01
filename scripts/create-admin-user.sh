#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="${REPO_ROOT}/api"

echo "==> Create admin user"
echo ""
read -rp "Admin email: " ADMIN_EMAIL
read -rsp "Admin password (min 8 chars): " ADMIN_PASSWORD
echo ""

cd "${API_DIR}"
DATABASE_URL="${DATABASE_URL:-postgres://quotecraft:quotecraft@localhost:5432/quotecraft?sslmode=disable}" \
  go run ./cmd/create-admin-user/. \
    -email "${ADMIN_EMAIL}" \
    -password "${ADMIN_PASSWORD}"

echo "Admin user created: ${ADMIN_EMAIL}"
