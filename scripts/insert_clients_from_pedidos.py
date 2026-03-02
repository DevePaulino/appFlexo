#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime
import re
import json

def norm_key(name):
    return re.sub(r'\s+',' ', (name or '').strip()).lower() if name else None

def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['printforgepro']
    pedidos = db['pedidos']
    clientes = db['clientes']

    cursor = pedidos.find({}, limit=5000)
    clients_map = {}

    for p in cursor:
        cliente_obj = p.get('cliente') if isinstance(p.get('cliente'), dict) else None
        nombre = None
        cliente_id = None
        email = None
        telefono = None
        direccion = None

        if cliente_obj:
            nombre = cliente_obj.get('nombre') or cliente_obj.get('nombre_completo')
            email = cliente_obj.get('email') or cliente_obj.get('correo')
            telefono = cliente_obj.get('telefono') or cliente_obj.get('tel')
            cliente_id = cliente_obj.get('cliente_id') or cliente_obj.get('id')

        # fallback to top-level fields if nested not present
        if not nombre:
            nombre = p.get('cliente_nombre') or p.get('cliente_name') or p.get('clienteName') or p.get('nombre_cliente') or p.get('nombre')
        if not cliente_id:
            cliente_id = p.get('cliente_id') or p.get('clienteId') or p.get('clienteID')
        if not email:
            email = p.get('email') or p.get('contacto_email') or p.get('cliente_email')
        if not telefono:
            telefono = p.get('telefono') or p.get('telefono_contacto') or p.get('cliente_telefono')
        direccion = p.get('direccion') or p.get('cliente_direccion') or p.get('domicilio')

        key = cliente_id if cliente_id else norm_key(nombre)
        if not key:
            continue
        entry = clients_map.setdefault(key, {'cliente_id': cliente_id, 'nombre': nombre, 'emails': set(), 'telefonos': set(), 'direccion': None, 'source_count': 0})
        entry['source_count'] += 1
        if email:
            entry['emails'].add(email)
        if telefono:
            entry['telefonos'].add(telefono)
        if direccion and not entry['direccion']:
            entry['direccion'] = direccion

    inserted = []
    skipped = []
    for key, info in clients_map.items():
        query = {}
        if info['cliente_id']:
            query['cliente_id'] = info['cliente_id']
        else:
            query['nombre'] = info['nombre']
        if clientes.count_documents(query, limit=1):
            skipped.append({'key': key, 'nombre': info['nombre']})
            continue
        doc = {
            'cliente_id': info['cliente_id'] or ('CLI-' + re.sub(r'[^0-9a-zA-Z]','', (info['nombre'] or 'anon'))[:20] + '-' + datetime.utcnow().strftime('%Y%m%d%H%M%S')),
            'nombre': info['nombre'] or 'Cliente sin nombre',
            'emails': list(info['emails']),
            'telefonos': list(info['telefonos']),
            'direccion': info['direccion'] or '',
            'activo': True,
            'created_at': datetime.utcnow(),
            'origen': 'seed_from_pedidos',
            'nota': f'Generado automáticamente a partir de {info["source_count"]} pedido(s)'
        }
        res = clientes.insert_one(doc)
        inserted.append({'_id': str(res.inserted_id), 'cliente_id': doc['cliente_id'], 'nombre': doc['nombre']})

    out = {
        'inserted_count': len(inserted),
        'inserted': inserted,
        'skipped_count': len(skipped),
        'skipped': skipped[:50]
    }
    print(json.dumps(out, ensure_ascii=False, indent=2, default=str))

if __name__ == '__main__':
    main()
