#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Checking for Homebrew..."
if ! command -v brew &>/dev/null; then
  echo "ERROR: Homebrew is not installed. Install it from https://brew.sh and re-run."
  exit 1
fi

echo "==> Installing tools from Brewfile..."
brew bundle --file="${REPO_ROOT}/Brewfile"

echo "==> Installing root Node.js dependencies..."
# Installs root-level devDependencies (e.g., Prettier).
# Sub-project packages will be installed as workspaces are scaffolded in subsequent tasks.
cd "${REPO_ROOT}"
pnpm install

echo "==> Creating admin user..."
bash "${REPO_ROOT}/scripts/create-admin-user.sh"

echo ""
echo "Bootstrap complete. Run 'make dev' to start the full stack."
