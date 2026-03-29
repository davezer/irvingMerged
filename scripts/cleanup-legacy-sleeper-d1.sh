#!/usr/bin/env bash
set -euo pipefail

targets=(
  "src/lib/server/league/backfill.js"
  "src/lib/server/league/sleeper.js"
  "src/routes/api/admin/league/rosters"
  "src/routes/api/admin/league/transactions"
  "src/routes/api/admin/league/sync-sleeper"
)

for target in "${targets[@]}"; do
  if [ -e "$target" ]; then
    rm -rf "$target"
    echo "Removed $target"
  else
    echo "Skipped $target (not found)"
  fi
done
