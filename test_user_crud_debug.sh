#!/usr/bin/env bash
set -u

# Debugging wrapper for test_user_crud.sh: captures headers and bodies
# and attempts to parse JSON without aborting on first failure.

BASE="${BASE_URL:-http://localhost:8080}"
TS="$(date +%s)"
ADMIN_EMAIL="admin.${TS}@example.com"
TEAM_EMAIL="mate.${TS}@example.com"

check_json() {
  local file="$1"
  node -e "try{const fs=require('fs'); JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log('OK');}catch(e){console.error('JSON_ERROR:'+e.message); process.exit(2);}" "$file" 2>&1
}

do_curl() {
  local method="$1"; shift
  local out_file="$1"; shift
  local hdr_file="$1"; shift
  local url="$1"; shift
  local extra=("$@")

  printf '--- CURL %s %s -> %s\n' "$method" "$url" "$out_file"
  if [[ "$method" == "GET" ]]; then
    code=$(curl -sS -D "$hdr_file" -o "$out_file" -w "%{http_code}" "$url" "${extra[@]}")
  else
    code=$(curl -sS -D "$hdr_file" -o "$out_file" -w "%{http_code}" -X "$method" "$url" "${extra[@]}")
  fi
  echo "HTTP_CODE=$code"
  # Show first header lines
  if [[ -s "$hdr_file" ]]; then
    echo '--- HEADERS ---'
    sed -n '1,20p' "$hdr_file"
  fi
  if [[ -s "$out_file" ]]; then
    echo '--- BODY (first 400 chars) ---'
    head -c 400 "$out_file" | sed -n '1,200p'
    echo
    check_json "$out_file" || true
  else
    echo '--- BODY: empty ---'
  fi
  echo
  echo "$code"
}

TMPD=/tmp/test_user_crud_debug
mkdir -p "$TMPD"

REG_CODE=$(do_curl POST "$TMPD/reg.json" "$TMPD/reg.headers" "$BASE/api/auth/register" -H 'Content-Type: application/json' -d "{\"nombre\":\"Admin ${TS}\",\"nombre_empresa\":\"Empresa ${TS}\",\"cif\":\"A1234567B\",\"email\":\"${ADMIN_EMAIL}\",\"password\":\"Secret123\",\"billing_model\":\"creditos\",\"payment_method\":\"paypal\"}")

TOKEN=$(node -e "const fs=require('fs'); try{const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(d.access_token||'');}catch(e){console.error('tok_parse_err');}" "$TMPD/reg.json" 2>/dev/null || true)
echo "TOKEN_LEN=${#TOKEN}"

CREATE_CODE=$(do_curl POST "$TMPD/create_user.json" "$TMPD/create_user.headers" "$BASE/api/usuarios" -H 'Content-Type: application/json' -H "Authorization: Bearer ${TOKEN}" -d "{\"nombre\":\"Companero ${TS}\",\"email\":\"${TEAM_EMAIL}\",\"rol\":\"comercial\",\"billing_model\":\"creditos\",\"payment_method\":\"paypal\"}")

USER_ID=$(node -e "const fs=require('fs'); try{const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(String(d.id||''));}catch(e){console.error('uid_parse_err');}" "$TMPD/create_user.json" 2>/dev/null || true)
echo "USER_ID=$USER_ID"

LIST1_CODE=$(do_curl GET "$TMPD/list1.json" "$TMPD/list1.headers" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")

EDIT_CODE=$(do_curl PUT "$TMPD/edit_user.json" "$TMPD/edit_user.headers" "$BASE/api/usuarios/${USER_ID}" -H 'Content-Type: application/json' -H "Authorization: Bearer ${TOKEN}" -d "{\"nombre\":\"Companero Editado ${TS}\",\"email\":\"${TEAM_EMAIL}\",\"rol\":\"administrador\",\"billing_model\":\"suscripcion\",\"payment_method\":\"tarjeta\"}")

LIST2_CODE=$(do_curl GET "$TMPD/list2.json" "$TMPD/list2.headers" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")

DEL_CODE=$(do_curl DELETE "$TMPD/delete_user.json" "$TMPD/delete_user.headers" "$BASE/api/usuarios/${USER_ID}" -H "Authorization: Bearer ${TOKEN}")

LIST3_CODE=$(do_curl GET "$TMPD/list3.json" "$TMPD/list3.headers" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")

echo '--- SUMMARY FILES ---'
ls -l "$TMPD" || true
echo
echo 'Finished debug run. Inspect the files in' "$TMPD"

exit 0
