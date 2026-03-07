#!/usr/bin/env python3
"""Prueba concurrente para encolar el mismo `trabajo_id` desde múltiples hilos.
Verifica que solo exista una entrada en `trabajo_orden` después de las solicitudes.
"""
import threading
import time
import uuid
import json
import sys

try:
    import requests
except Exception:
    requests = None

from pymongo import MongoClient

MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'printforgepro'
BACKEND = 'http://127.0.0.1:8080'
EMPRESA_ID = 1
MAQUINA_ID = 'stress-test-machine'

NUM_THREADS = 30

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
trabajos_col = db['trabajos']
orden_col = db['pedido_orden']

# Crear trabajo de prueba
trabajo_id = f"CONC-{int(time.time())}-{uuid.uuid4().hex[:6]}"
print('Using trabajo_id:', trabajo_id)
trabajo_doc = {
    'empresa_id': EMPRESA_ID,
    'trabajo_id': trabajo_id,
    'estado': 'diseno',
    'nombre': 'Test concurrent enqueue',
    'created_at': time.time()
}
# En la app `get_empresa_collection('trabajos')` mapea a la colección `pedidos`.
pedidos_col = db['pedidos']
pedidos_col.insert_one(trabajo_doc)

# Worker que hace POST al endpoint de encolar
results = []

def worker(i):
    url = f"{BACKEND}/api/produccion/enviar"
    payload = {'trabajo_id': trabajo_id, 'maquina_id': MAQUINA_ID}
    try:
        if requests:
            r = requests.post(url, json=payload, timeout=10)
            results.append((i, r.status_code, r.text[:200]))
        else:
            # Fallback usando urllib
            import urllib.request, urllib.error
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode('utf-8')
                results.append((i, resp.getcode(), body[:200]))
    except Exception as e:
        results.append((i, 'ERR', str(e)))

threads = []
start = time.time()
for i in range(NUM_THREADS):
    t = threading.Thread(target=worker, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()
end = time.time()

print(f"All threads finished in {end-start:.2f}s. Collected {len(results)} results.")
# Print a few results
for r in results[:10]:
    print(r)

# Esperar un momento para que el backend haya escrito en la BD
time.sleep(1)

# Comprobar cuántas entradas en trabajo_orden
count = orden_col.count_documents({'empresa_id': EMPRESA_ID, 'trabajo_id': trabajo_id})
print('trabajo_orden count for', trabajo_id, '=>', count)

docs = list(orden_col.find({'empresa_id': EMPRESA_ID, 'trabajo_id': trabajo_id}))
print('docs:', docs)

if count == 1:
    print('SUCCESS: Only one trabajo_orden present.')
    sys.exit(0)
else:
    print('FAIL: expected 1 trabajo_orden, found', count)
    sys.exit(2)
