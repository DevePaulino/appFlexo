#!/usr/bin/env python3
import urllib.request, urllib.parse, json, sys

BASE = 'http://127.0.0.1:8080'

def get(url):
    with urllib.request.urlopen(url) as r:
        return json.load(r)

def post(url, data):
    data_json = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data_json, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return r.read().decode()

try:
    machines = get(BASE + '/api/maquinas')
except Exception as e:
    print('ERROR: could not fetch machines:', e, file=sys.stderr)
    sys.exit(2)

print('Machines count:', len(machines))

dig = None
off = None
for m in machines:
    name = (m.get('nombre') or m.get('name') or '')
    mid = (m.get('_id') or m.get('id') or m.get('maquina_id') or '')
    nm = name.lower() if isinstance(name, str) else ''
    if 'digital' in nm and dig is None:
        dig = (mid, name)
    if 'offset' in nm and off is None:
        off = (mid, name)

print('Found digital:', dig)
print('Found offset :', off)
if not dig or not off:
    print('Could not find both machines; aborting', file=sys.stderr)
    sys.exit(3)

digital_id = str(dig[0])
offset_id = str(off[0])

# fetch production list for digital
prod_url = BASE + f"/api/produccion?maquina={urllib.parse.quote(digital_id)}"
try:
    prod = get(prod_url)
except Exception as e:
    print('ERROR fetching production for digital:', e, file=sys.stderr)
    prod = []

if isinstance(prod, dict):
    items = prod.get('trabajos') or prod.get('rows') or prod.get('data') or []
else:
    items = prod

print('Digital has', len(items), 'rows')

moved = []
failed = []
for row in items:
    trabajo_id = row.get('trabajo_id') or row.get('id') or row.get('_id') or row.get('pedido_id') or ''
    trabajo_id = str(trabajo_id)
    if not trabajo_id:
        print('Skipping row without trabajo id:', row)
        failed.append({'row': row, 'error': 'no id'})
        continue
    payload = {'trabajo_id': trabajo_id, 'maquina_destino': offset_id}
    try:
        resp = post(BASE + '/api/produccion/mover', payload)
        print('Moved', trabajo_id, '->', offset_id, 'resp:', resp)
        moved.append(trabajo_id)
    except Exception as e:
        print('Error moving', trabajo_id, e, file=sys.stderr)
        failed.append({'trabajo_id': trabajo_id, 'error': str(e)})

# show after counts
try:
    after_d = get(BASE + f"/api/produccion?maquina={urllib.parse.quote(digital_id)}")
    after_o = get(BASE + f"/api/produccion?maquina={urllib.parse.quote(offset_id)}")
    def count(x):
        if isinstance(x, dict):
            return len(x.get('trabajos') or x.get('rows') or x.get('data') or [])
        return len(x)
    print('After: digital count', count(after_d))
    print('After: offset count', count(after_o))
except Exception as e:
    print('Error fetching after lists:', e, file=sys.stderr)

print('Moved list:', moved)
if failed:
    print('Failed list:', failed)
else:
    print('No failures')
