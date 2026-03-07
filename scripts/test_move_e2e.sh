#!/usr/bin/env bash
set -euo pipefail
TMP=$(mktemp /tmp/e2e_move.XXXX)
trap "rm -f $TMP" EXIT

echo "Inserting test pedido directly into DB..."
trabajo_id=$(./.venv/bin/python - <<PY
from pymongo import MongoClient
import time, json
client=MongoClient('mongodb://localhost:27017/')
db=client['printforgepro']
col=db['pedidos']
tid = f"e2e-{int(time.time()*1000)}"
doc={'empresa_id':1, 'trabajo_id': tid, 'cliente':'E2E Cliente', 'nombre':'E2E Test Pedido'}
res=col.insert_one(doc)
print(tid)
PY
)
if [ -z "$trabajo_id" ]; then
  echo "Failed to insert pedido into DB"
  exit 2
fi
echo "trabajo_id: $trabajo_id"

echo "Fetching maquinas..."
MAQUINAS=$(curl -sS http://127.0.0.1:8080/api/maquinas)
maquina_id=$(echo "$MAQUINAS" | python3 -c "import sys,json; d=json.load(sys.stdin); ms=d.get('maquinas',[]); print(ms[0].get('id') if ms else '')")
if [ -z "$maquina_id" ]; then
  echo "No maquina found: $MAQUINAS"
  exit 3
fi

echo "maquina_id: $maquina_id"

echo "Moving trabajo to maquina..."
MOVE_RES=$(curl -sS -X POST -H 'Content-Type: application/json' -d "{\"trabajo_id\":\"$trabajo_id\",\"maquina_destino\":\"$maquina_id\"}" http://127.0.0.1:8080/api/produccion/mover)
echo "move result: $MOVE_RES"

sleep 0.5

echo "Querying production for maquina $maquina_id"
PROD=$(curl -sS "http://127.0.0.1:8080/api/produccion?maquina=$maquina_id")
echo "produccion: $PROD"

found=$(echo "$PROD" | python3 -c "import sys,json; d=json.load(sys.stdin); trabajos=d.get('trabajos',[]); print('FOUND' if any(str(t.get('trabajo_id'))== '$trabajo_id' for t in trabajos) else 'NOT_FOUND')")

echo "Result: $found"
if [ "$found" = "FOUND" ]; then
  exit 0
else
  exit 4
fi
