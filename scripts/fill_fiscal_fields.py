#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime
import re

def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['pressmateapp']
    col = db['clientes']
    rows = list(col.find({'origen':'seed_from_pedidos'}))
    updated = []
    for i, r in enumerate(rows, start=1):
        updates = {}
        # prefer existing 'direccion' field
        if not r.get('direccion_fiscal'):
            direccion = r.get('direccion')
            if not direccion:
                direccion = f'C/ Ejemplo {i}, 280{str(i%100).zfill(2)} Ciudad'
            updates['direccion_fiscal'] = direccion
        if not r.get('cif'):
            updates['cif'] = f'TEST{str(i).zfill(4)}'
        nota = r.get('notas_adicionales', '') or ''
        add_note = 'Auto-fill: verificar CIF y dirección fiscal.'
        if add_note not in nota:
            updates['notas_adicionales'] = (nota + '\n' + add_note).strip()
        if updates:
            updates['updated_at'] = datetime.utcnow()
            col.update_one({'_id': r['_id']}, {'$set': updates})
            updated.append({'_id': str(r['_id']), 'cliente_id': r.get('cliente_id'), 'nombre': r.get('nombre'), **updates})
    print({'updated_count': len(updated), 'updated': updated})

if __name__ == '__main__':
    main()
