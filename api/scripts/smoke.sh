#!/usr/bin/env bash
#
# End-to-end smoke test against a running social service.
# Mirrors every request in the Postman collection (social.postman_collection.json)
# so the two can be kept in sync.
#
# Usage:
#   # 1. Start Postgres + server:
#   #    docker compose up -d postgres
#   #    (cd services/social && npx prisma migrate reset --force --skip-seed && npx tsx src/index.ts &)
#   # 2. Then run:
#   #    bash services/social/scripts/smoke.sh
#
# Env overrides:
#   BASE         — service base URL (default http://localhost:3000)
#   ADMIN_TOKEN  — value sent as x-admin-token (default dev token)
#
# Requires: curl, python3 (for JSON extraction — jq would work too).
set -u

BASE="${BASE:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-dev_admin_token_at_least_16_chars}"

say() { printf '\n### %s\n$ %s\n' "$1" "$2"; }
jqp() { python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d$1)"; }

# --- 0. Health ------------------------------------------------------------
say "Health" "GET $BASE/health"
curl -sS "$BASE/health"; echo

# --- 1. Companies ---------------------------------------------------------
say "Create Company Acme" "POST /admin/companies  (x-admin-token required)"
RESP=$(curl -sS -X POST "$BASE/admin/companies" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Acme"}')
echo "$RESP"
COMPANY_ACME=$(echo "$RESP" | jqp "['id']")

say "Create Company Gamma" "POST /admin/companies"
RESP=$(curl -sS -X POST "$BASE/admin/companies" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Gamma"}')
echo "$RESP"
COMPANY_GAMMA=$(echo "$RESP" | jqp "['id']")

# --- 2. Teams -------------------------------------------------------------
say "Create Team Scouts in Acme" "POST /admin/teams"
RESP=$(curl -sS -X POST "$BASE/admin/teams" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Scouts\",\"companyId\":\"$COMPANY_ACME\"}")
echo "$RESP"
TEAM_SCOUTS=$(echo "$RESP" | jqp "['id']")

say "Create Team Analysts in Acme" "POST /admin/teams"
RESP=$(curl -sS -X POST "$BASE/admin/teams" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Analysts\",\"companyId\":\"$COMPANY_ACME\"}")
echo "$RESP"
TEAM_ANALYSTS=$(echo "$RESP" | jqp "['id']")

say "Create Team Observers in Gamma" "POST /admin/teams  (for cross-company test)"
RESP=$(curl -sS -X POST "$BASE/admin/teams" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Observers\",\"companyId\":\"$COMPANY_GAMMA\"}")
echo "$RESP"
TEAM_OBSERVERS=$(echo "$RESP" | jqp "['id']")

# --- 3. Users -------------------------------------------------------------
say "Register Alice  (Acme / Scouts)" "POST /auth/register"
RESP=$(curl -sS -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"email\":\"alice@acme.test\",\"password\":\"passw0rd!\",\"name\":\"Alice\",\"companyId\":\"$COMPANY_ACME\",\"teamIds\":[\"$TEAM_SCOUTS\"]}")
echo "$RESP"
TOKEN_ALICE=$(echo "$RESP" | jqp "['token']")
USER_ALICE=$(echo "$RESP" | jqp "['user']['id']")

say "Register Bob  (Acme / Analysts)" "POST /auth/register"
RESP=$(curl -sS -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"email\":\"bob@acme.test\",\"password\":\"passw0rd!\",\"name\":\"Bob\",\"companyId\":\"$COMPANY_ACME\",\"teamIds\":[\"$TEAM_ANALYSTS\"]}")
echo "$RESP"
TOKEN_BOB=$(echo "$RESP" | jqp "['token']")
USER_BOB=$(echo "$RESP" | jqp "['user']['id']")

say "Register Carol  (Gamma, no teams)" "POST /auth/register"
RESP=$(curl -sS -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"email\":\"carol@gamma.test\",\"password\":\"passw0rd!\",\"name\":\"Carol\",\"companyId\":\"$COMPANY_GAMMA\",\"teamIds\":[]}")
echo "$RESP"
TOKEN_CAROL=$(echo "$RESP" | jqp "['token']")
USER_CAROL=$(echo "$RESP" | jqp "['user']['id']")

# --- 4. Login + /me -------------------------------------------------------
say "Login Alice" "POST /auth/login"
curl -sS -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.test","password":"passw0rd!"}'; echo

say "GET /auth/me  (Alice)" "GET /auth/me  — Bearer"
curl -sS "$BASE/auth/me" -H "Authorization: Bearer $TOKEN_ALICE"; echo

# --- 5. Add Carol to Team Observers via admin -----------------------------
say "Add Carol to Team Observers" "POST /admin/teams/:id/members"
curl -sS -X POST "$BASE/admin/teams/$TEAM_OBSERVERS/members" \
  -H "x-admin-token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_CAROL\"}"; echo

# --- 6. Alice creates analysis, grants Team Analysts ----------------------
say "Alice POST /analyses  (team_access = Team Analysts)" "POST /analyses"
RESP=$(curl -sS -X POST "$BASE/analyses" \
  -H "Authorization: Bearer $TOKEN_ALICE" -H "Content-Type: application/json" \
  -d "{\"title\":\"U21 CB shortlist\",\"body\":\"Pre-window draft.\",\"tags\":[\"defender\",\"u21\"],\"team_access\":[\"$TEAM_ANALYSTS\"]}")
echo "$RESP"
ANALYSIS_ID=$(echo "$RESP" | jqp "['id']")

# --- 7. Company-boundary enforcement -------------------------------------
say "Alice grants to Observers (Gamma) — expect 403 TeamOutsideCompany" "POST /analyses  cross-company"
curl -sS -w "\nHTTP=%{http_code}\n" -X POST "$BASE/analyses" \
  -H "Authorization: Bearer $TOKEN_ALICE" -H "Content-Type: application/json" \
  -d "{\"title\":\"NopeShouldFail\",\"body\":\"x\",\"tags\":[],\"team_access\":[\"$TEAM_OBSERVERS\"]}"

# --- 8. Feed visibility --------------------------------------------------
say "Bob GET /feed — expect 1 item" "GET /feed  — Bearer Bob"
curl -sS "$BASE/feed" -H "Authorization: Bearer $TOKEN_BOB"; echo

say "Carol GET /feed — expect 0 items" "GET /feed  — Bearer Carol"
curl -sS "$BASE/feed" -H "Authorization: Bearer $TOKEN_CAROL"; echo

say "Bob GET /feed?tag=defender" "GET /feed?tag=defender"
curl -sS "$BASE/feed?tag=defender" -H "Authorization: Bearer $TOKEN_BOB"; echo

say "Bob GET /feed?tag=nope — expect empty" "GET /feed?tag=nope"
curl -sS "$BASE/feed?tag=nope" -H "Authorization: Bearer $TOKEN_BOB"; echo

say "Bob GET /feed?author_id=\$ALICE — expect 1 item" "GET /feed?author_id=…"
curl -sS "$BASE/feed?author_id=$USER_ALICE" -H "Authorization: Bearer $TOKEN_BOB"; echo

# --- 9. Direct analysis reads -------------------------------------------
say "Bob GET /analyses/:id — expect 200" "GET /analyses/$ANALYSIS_ID"
curl -sS -w "\nHTTP=%{http_code}\n" "$BASE/analyses/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN_BOB"

say "Carol GET /analyses/:id — expect 403" "GET /analyses/$ANALYSIS_ID"
curl -sS -w "\nHTTP=%{http_code}\n" "$BASE/analyses/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN_CAROL"

# --- 10. PATCH access (owner only, re-validate company) -----------------
say "Alice PATCH /analyses/:id/access — set to [Team Scouts]" "PATCH /analyses/:id/access"
curl -sS -X PATCH "$BASE/analyses/$ANALYSIS_ID/access" \
  -H "Authorization: Bearer $TOKEN_ALICE" -H "Content-Type: application/json" \
  -d "{\"team_access\":[\"$TEAM_SCOUTS\"]}"; echo

say "Bob GET /feed after revoke — expect 0" "GET /feed (Bob, now revoked)"
curl -sS "$BASE/feed" -H "Authorization: Bearer $TOKEN_BOB"; echo

say "Bob PATCH /analyses/:id/access — expect 403 NotOwner" "PATCH non-owner"
curl -sS -w "\nHTTP=%{http_code}\n" -X PATCH "$BASE/analyses/$ANALYSIS_ID/access" \
  -H "Authorization: Bearer $TOKEN_BOB" -H "Content-Type: application/json" \
  -d "{\"team_access\":[\"$TEAM_ANALYSTS\"]}"

# --- 11. Delete ---------------------------------------------------------
say "Bob DELETE /analyses/:id — expect 403 NotOwner" "DELETE non-owner"
curl -sS -w "\nHTTP=%{http_code}\n" -X DELETE "$BASE/analyses/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN_BOB"

say "Alice DELETE /analyses/:id — expect 204" "DELETE owner"
curl -sS -w "\nHTTP=%{http_code}\n" -X DELETE "$BASE/analyses/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN_ALICE"

# --- 12. Auth failure modes --------------------------------------------
say "GET /auth/me without token — expect 401" "GET /auth/me  (no Bearer)"
curl -sS -w "\nHTTP=%{http_code}\n" "$BASE/auth/me"

say "POST /admin/companies without admin token — expect 401" "POST /admin/companies  (no x-admin-token)"
curl -sS -w "\nHTTP=%{http_code}\n" -X POST "$BASE/admin/companies" \
  -H "Content-Type: application/json" -d '{"name":"Z"}'

say "POST /auth/login with wrong password — expect 401" "POST /auth/login  (bad pass)"
curl -sS -w "\nHTTP=%{http_code}\n" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.test","password":"wrong"}'

# --- End ---------------------------------------------------------------
cat <<EOF

## Captured IDs (use these to inspect state manually)
COMPANY_ACME    = $COMPANY_ACME
COMPANY_GAMMA   = $COMPANY_GAMMA
TEAM_SCOUTS     = $TEAM_SCOUTS
TEAM_ANALYSTS   = $TEAM_ANALYSTS
TEAM_OBSERVERS  = $TEAM_OBSERVERS
USER_ALICE      = $USER_ALICE
USER_BOB        = $USER_BOB
USER_CAROL      = $USER_CAROL
ANALYSIS_ID     = $ANALYSIS_ID   (deleted at end)
EOF
