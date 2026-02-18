#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5173}"
EXPECTED_USERS="${EXPECTED_USERS:-10}"
EXPECTED_SERVICE_USERS="${EXPECTED_SERVICE_USERS:-12}"
EXPECTED_ROTA_SHIFTS="${EXPECTED_ROTA_SHIFTS:-7}"

pass() {
  printf 'PASS: %s\n' "$1"
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

json_get() {
  local path="$1"
  curl -fsS "${BASE_URL}${path}" | jq -r "$2"
}

require_cmd curl
require_cmd jq

health_ok="$(json_get '/api/db/health' '.ok // false')"
[[ "$health_ok" == "true" ]] || fail "DB health endpoint is not healthy at ${BASE_URL}/api/db/health"
pass "DB health endpoint"

users_count="$(json_get '/api/db/users' '.data | length')"
[[ "$users_count" == "$EXPECTED_USERS" ]] || fail "Team gate expected ${EXPECTED_USERS} users, got ${users_count}"
pass "Team gate (${users_count} users)"

service_users_count="$(json_get '/api/db/service-users' '.data | length')"
[[ "$service_users_count" == "$EXPECTED_SERVICE_USERS" ]] || fail "People gate expected ${EXPECTED_SERVICE_USERS} service users, got ${service_users_count}"
pass "People gate (${service_users_count} service users)"

rota_shifts_count="$(json_get '/api/db/rota-shifts' '.data | length')"
[[ "$rota_shifts_count" == "$EXPECTED_ROTA_SHIFTS" ]] || fail "Rota gate expected ${EXPECTED_ROTA_SHIFTS} shifts, got ${rota_shifts_count}"
pass "Rota gate (${rota_shifts_count} shifts)"

printf '\nAll section gates passed at %s\n' "$BASE_URL"
