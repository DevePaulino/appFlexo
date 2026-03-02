#!/usr/bin/env python3
import urllib.request, urllib.parse, json, sys

def get(url):
    req=urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.load(r)

print('Iniciando prueba de reordenar...')
try:
    maqs = get('http://127.0.0.1:8080/api/maquinas')
except Exception as e:
    print('GET /api/maquinas failed:', e)
    sys.exit(0)
print('--- /api/maquinas ---')
maquinas = maqs.get('maquinas', [])
print('Máquinas encontradas:', len(maquinas))
for m in maquinas[:50]:
    print('-', m.get('id'), m.get('nombre'))
if not maquinas:
    print('No hay máquinas, abortando')
    sys.exit(0)
mid = maquinas[0].get('id')
enc_name = urllib.parse.quote(maquinas[0].get('nombre') or '')
print('\nUsando maquina_id=', mid, 'nombre_enc=', enc_name)
prod_url = f'http://127.0.0.1:8080/api/produccion?maquina={mid}&maquina_nombre={enc_name}'
try:
    pr = get(prod_url)
except Exception as e:
    print('GET /api/produccion failed:', e)
    sys.exit(0)
trabajos = pr.get('trabajos', [])
print('\n--- /api/produccion (antes) ---')
print('Trabajos encontrados para la máquina:', len(trabajos))
for t in trabajos[:20]:
    print('-', t.get('id'), 'pos=', t.get('posicion'))

if len(trabajos) < 2:
    print('\nMenos de 2 trabajos, no se reordena')
    sys.exit(0)

# Preparar payload para intercambiar las dos primeras posiciones
t0 = trabajos[0]
t1 = trabajos[1]
payload = {'maquina_id': mid, 'trabajos': [
    {'trabajo_id': t0.get('id'), 'nueva_posicion': 2},
    {'trabajo_id': t1.get('id'), 'nueva_posicion': 1}
]}
print('\nPayload para reordenar:')
print(json.dumps(payload, indent=2, ensure_ascii=False))

# POST
post_data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8080/api/produccion/reordenar', data=post_data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        resp = r.read().decode('utf-8')
        print('\n--- /api/produccion/reordenar response ---')
        try:
            print(json.dumps(json.loads(resp), indent=2, ensure_ascii=False))
        except Exception:
            print(resp)
except Exception as e:
    print('\nPOST error:', e)
    try:
        body = e.read().decode()
        print('Error body:', body)
    except Exception:
        pass

# Volver a obtener lista
try:
    pr2 = get(prod_url)
except Exception as e:
    print('GET /api/produccion (después) failed:', e)
    sys.exit(0)
trabajos2 = pr2.get('trabajos', [])
print('\n--- /api/produccion (después) ---')
print('Trabajos ahora:', len(trabajos2))
for t in trabajos2[:20]:
    print('-', t.get('id'), 'pos=', t.get('posicion'))

print('\nPrueba finalizada')
