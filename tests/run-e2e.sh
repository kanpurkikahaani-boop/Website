#!/usr/bin/env bash
# Runs tests/admin.spec.ts end to end:
#   fresh Postgres DB with the real migrations → Supabase stand-in → production build → Playwright.
# Needs a local Postgres 16 (PGHOST/PGPORT/PGUSER) — see tests/README.md.
set -euo pipefail
cd "$(dirname "$0")/.."
export PGDATABASE=${PGDATABASE:-kkk_e2e}
for port in 3100 54400; do
  if curl -s -o /dev/null "http://127.0.0.1:$port/"; then echo "Port $port is already in use — stop the old server first." >&2; exit 1; fi
done
bash tests/support/setup-db.sh
node tests/support/fake-supabase.mjs > /tmp/kkk-fake-supabase.log 2>&1 &
FAKE=$!
# `npx next start` spawns a child next-server: stop the whole process group, not just npx.
cleanup() { kill $FAKE 2>/dev/null || true; [ -n "${APP:-}" ] && kill -- -"$APP" 2>/dev/null || true; }
trap cleanup EXIT
set -a; source "${E2E_ENV:-tests/support/e2e.env}"; set +a
rm -rf .next/cache/fetch-cache
npm run build > /tmp/kkk-e2e-build.log 2>&1 || { tail -40 /tmp/kkk-e2e-build.log; exit 1; }
setsid npx next start -p 3100 > /tmp/kkk-e2e-app.log 2>&1 &
APP=$!
for _ in $(seq 1 60); do curl -sf -o /dev/null http://localhost:3100/ && break; sleep 1; done
npx playwright test "$@"
