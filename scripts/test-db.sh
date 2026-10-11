#!/usr/bin/env bash
# Runs the database (RLS / trigger) tests against a throwaway Postgres.
# Uses $DATABASE_URL if set (e.g. a CI service container); otherwise starts a
# temporary local cluster with the Postgres binaries on this machine.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
  [[ -x "$PG_BIN/initdb" ]] || { echo "No Postgres binaries found; set DATABASE_URL or PG_BIN" >&2; exit 1; }
  DATA_DIR="$(mktemp -d)"
  PORT="${PG_TEST_PORT:-54329}"
  RUN=()
  if [[ "$(id -u)" == "0" ]]; then
    chown postgres "$DATA_DIR"
    RUN=(runuser -u postgres --)
  fi
  "${RUN[@]}" "$PG_BIN/initdb" -D "$DATA_DIR" -U postgres -A trust >/dev/null
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA_DIR" -o "-p $PORT -k $DATA_DIR -c listen_addresses=localhost" -w start >/dev/null
  trap '"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA_DIR" -m immediate stop >/dev/null; rm -rf "$DATA_DIR"' EXIT
  export DATABASE_URL="postgres://postgres@localhost:$PORT/postgres"
fi

npx vitest run --config vitest.db.config.ts "$@"
