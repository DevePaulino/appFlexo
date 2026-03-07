#!/usr/bin/env python3
import sys, json, urllib.request, urllib.parse

if len(sys.argv) < 2:
    print('Usage: find_trabajo_by_prefix.py <prefix>')
    sys.exit(2)

prefix = sys.argv[1]
BASE = 'http://127.0.0.1:8080'

try:
    machines = json.load(urllib.request.urlopen(BASE + '/api/maquinas'))
except Exception as e:
    print('ERROR fetching machines:', e, file=sys.stderr)
    sys.exit(1)

lst = machines if isinstance(machines, list) else machines.get('maquinas') or machines.get('data') or []
found = False
for m in lst:
    mid = m.get('id') or m.get('_id')
    name = m.get('nombre') or m.get('maquina') or ''
    url = f"{BASE}/api/produccion?maquina={mid}&maquina_nombre={urllib.parse.quote(name)}"
    try:
        data = json.load(urllib.request.urlopen(url))
    except Exception as e:
        print('ERROR fetching', url, e, file=sys.stderr)
        continue
    trabajos = data.get('trabajos') or []
    for t in trabajos:
        tid = t.get('id') or ''
        ttrab = t.get('trabajo_id') or ''
        if tid.startswith(prefix) or ttrab.startswith(prefix):
            print('--- MACHINE:', name, '(', mid, ')')
            print(json.dumps(t, indent=2, ensure_ascii=False))
            found = True

if not found:
    print('No matches found for prefix', prefix)
