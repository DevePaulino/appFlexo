#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
from pymongo import MongoClient

API_BASE = 'http://127.0.0.1:8080'

def http_get(path):
    url = API_BASE + path
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.read().decode(), r.getcode()

def http_post(path, data):
    url = API_BASE + path
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.read().decode(), r.getcode()

def main():
    client = MongoClient('mongodb://localhost:27017/printforgepro')
    try:
        db = client.get_default_database()
    except Exception:
        db = None
    if db is None:
        db = client['printforgepro']

    col = db['trabajo_orden']
    docs = list(col.find({}, limit=50))
    if not docs:
        print('No hay documentos en trabajo_orden; abortando smoke tests')
        return

    # gather unique maquina ids
    maquinas = []
    for d in docs:
        mid = d.get('maquina_id')
        if mid is None:
            continue
        sm = str(mid)
        if sm not in maquinas:
            maquinas.append(sm)
        if len(maquinas) >= 5:
            break

    m0 = maquinas[0]
    print('Probar GET /api/produccion para maquina', m0)
    body, code = http_get(f'/api/produccion?maquina={urllib.parse.quote(m0)}')
    print('HTTP', code)
    print(body[:1000])

    if len(maquinas) >= 2:
        m1 = maquinas[1]
        trabajo_id = str(docs[0].get('trabajo_id'))
        print('Probar POST mover:', trabajo_id, '->', m1)
        post_body, post_code = http_post('/api/produccion/mover', {'trabajo_id': trabajo_id, 'maquina_destino': m1})
        print('HTTP', post_code, post_body)

        print('Verificar destino')
        b2, c2 = http_get(f'/api/produccion?maquina={urllib.parse.quote(m1)}')
        print('HTTP', c2)
        print(b2[:1000])

        # reordenar: fetch trabajos from destination and reverse
        try:
            resp = json.loads(b2)
            trabajos = resp.get('trabajos', [])
            if trabajos:
                orden = []
                for i, t in enumerate(reversed(trabajos)):
                    orden.append({'trabajo_id': t.get('trabajo_id'), 'nueva_posicion': i})
                print('Probar POST reordenar (reverse)')
                rbody, rcode = http_post('/api/produccion/reordenar', {'maquina_id': m1, 'trabajos': orden})
                print('HTTP', rcode, rbody)
        except Exception as e:
            print('Error parsing trabajos response:', e)
    else:
        print('Solo una maquina encontrada; no se ejecutará mover/reordenar')


if __name__ == '__main__':
    main()
