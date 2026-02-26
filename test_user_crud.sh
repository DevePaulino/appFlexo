#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8080}"
TS="$(date +%s)"
ADMIN_EMAIL="admin.${TS}@example.com"
TEAM_EMAIL="mate.${TS}@example.com"

run_json_check() {
  local file="$1"
  node -e "const fs=require('fs'); JSON.parse(fs.readFileSync(process.argv[1],'utf8'));" "$file" >/dev/null
}

REG_CODE=$(curl -sS -o /tmp/reg.json -w "%{http_code}" "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"nombre\":\"Admin ${TS}\",\"nombre_empresa\":\"Empresa ${TS}\",\"cif\":\"A1234567B\",\"email\":\"${ADMIN_EMAIL}\",\"password\":\"Secret123\",\"billing_model\":\"creditos\",\"payment_method\":\"paypal\"}")
run_json_check /tmp/reg.json
TOKEN=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/reg.json','utf8')); process.stdout.write(d.access_token||'')")

CREATE_CODE=$(curl -sS -o /tmp/create_user.json -w "%{http_code}" "$BASE/api/usuarios" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"nombre\":\"Companero ${TS}\",\"email\":\"${TEAM_EMAIL}\",\"rol\":\"comercial\",\"billing_model\":\"creditos\",\"payment_method\":\"paypal\"}")
run_json_check /tmp/create_user.json
USER_ID=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/create_user.json','utf8')); process.stdout.write(String(d.id||''))")

LIST1_CODE=$(curl -sS -o /tmp/list1.json -w "%{http_code}" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")
run_json_check /tmp/list1.json
FOUND_CREATED=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/list1.json','utf8')); const id=Number(process.argv[1]); process.stdout.write((d.usuarios||[]).some(u=>u.id===id)?'yes':'no')" "$USER_ID")

EDIT_CODE=$(curl -sS -o /tmp/edit_user.json -w "%{http_code}" "$BASE/api/usuarios/${USER_ID}" \
  -X PUT \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"nombre\":\"Companero Editado ${TS}\",\"email\":\"${TEAM_EMAIL}\",\"rol\":\"operario\",\"billing_model\":\"suscripcion\",\"payment_method\":\"tarjeta\"}")
run_json_check /tmp/edit_user.json

LIST2_CODE=$(curl -sS -o /tmp/list2.json -w "%{http_code}" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")
run_json_check /tmp/list2.json
EDIT_OK=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/list2.json','utf8')); const id=Number(process.argv[1]); const u=(d.usuarios||[]).find(x=>x.id===id); process.stdout.write(u && String(u.nombre||'').includes('Editado') && String(u.rol||'').toLowerCase()==='operario' ? 'yes':'no')" "$USER_ID")

DEL_CODE=$(curl -sS -o /tmp/delete_user.json -w "%{http_code}" "$BASE/api/usuarios/${USER_ID}" \
  -X DELETE \
  -H "Authorization: Bearer ${TOKEN}")
run_json_check /tmp/delete_user.json

LIST3_CODE=$(curl -sS -o /tmp/list3.json -w "%{http_code}" "$BASE/api/usuarios" -H "Authorization: Bearer ${TOKEN}")
run_json_check /tmp/list3.json
FOUND_DELETED=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('/tmp/list3.json','utf8')); const id=Number(process.argv[1]); process.stdout.write((d.usuarios||[]).some(u=>u.id===id)?'yes':'no')" "$USER_ID")

echo "register_code=${REG_CODE} token_present=$([ -n \"${TOKEN}\" ] && echo yes || echo no)"
echo "create_code=${CREATE_CODE} user_id=${USER_ID} created_in_list=${FOUND_CREATED}"
echo "edit_code=${EDIT_CODE} edit_reflected=${EDIT_OK}"
echo "delete_code=${DEL_CODE} deleted_still_present=${FOUND_DELETED}"

action_ok=true
[[ "${REG_CODE}" == "201" ]] || action_ok=false
[[ -n "${TOKEN}" ]] || action_ok=false
[[ "${CREATE_CODE}" == "201" ]] || action_ok=false
[[ "${LIST1_CODE}" == "200" && "${FOUND_CREATED}" == "yes" ]] || action_ok=false
[[ "${EDIT_CODE}" == "200" ]] || action_ok=false
[[ "${LIST2_CODE}" == "200" && "${EDIT_OK}" == "yes" ]] || action_ok=false
[[ "${DEL_CODE}" == "200" ]] || action_ok=false
[[ "${LIST3_CODE}" == "200" && "${FOUND_DELETED}" == "no" ]] || action_ok=false

if [[ "${action_ok}" != "true" ]]; then
  echo '--- reg body ---'; cat /tmp/reg.json; echo
  echo '--- create body ---'; cat /tmp/create_user.json; echo
  echo '--- edit body ---'; cat /tmp/edit_user.json; echo
  echo '--- delete body ---'; cat /tmp/delete_user.json; echo
  exit 2
fi

echo 'RESULT=OK'
