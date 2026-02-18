# Data Rollout Gates (No UI Changes)

Scope rule:
- Do not edit JSX layout/CSS.
- Only edit data-layer files (`server/`, `src/data/`, `src/mock/`, and data wiring in page/context logic).

## Gate 1: Team
Success criteria:
- `/api/db/users` returns seeded users.
- Team list, counts, and filters render with unchanged UI.

Check:
- `curl -fsS http://127.0.0.1:5173/api/db/users | jq '.data | length'`

## Gate 2: People
Success criteria:
- `/api/db/service-users` returns seeded service users.
- People list/profile route behavior remains unchanged.

Check:
- `curl -fsS http://127.0.0.1:5173/api/db/service-users | jq '.data | length'`

## Gate 3: Rota
Success criteria:
- `/api/db/rota-shifts` returns seeded shifts.
- Rota section initializes from DB data with existing interaction behavior unchanged.

Check:
- `curl -fsS http://127.0.0.1:5173/api/db/rota-shifts | jq '.data | length'`

## One-command gate check
Run:
- `BASE_URL=http://127.0.0.1:5173 ./scripts/check-data-gates.sh`

Expected seeded counts today (February 18, 2026):
- Team users: 10
- Service users: 12
- Rota shifts: 7
