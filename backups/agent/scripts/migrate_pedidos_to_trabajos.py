#!/usr/bin/env python3
"""Migra documentos de la colección `pedidos` a `trabajos`.

Por defecto es un dry-run que muestra lo que se haría. Usar `--apply` para ejecutar.

Estrategia:
- Para cada documento en `pedidos`, si no existe un documento en `trabajos` con el mismo `_id`, se crea uno con _id = pedido._id (así comparten id canónico).
- Si el `pedido` no tiene `trabajo_id`, se actualiza a str(pedido._id).

Ejemplo de uso:
  python3 scripts/migrate_pedidos_to_trabajos.py        # dry-run
  python3 scripts/migrate_pedidos_to_trabajos.py --apply
"""

import argparse
import pymongo
import json
import time
from datetime import datetime
from bson import ObjectId


def main(apply_changes=False, mongo_uri='mongodb://localhost:27017', db_name='printforgepro'):
    c = pymongo.MongoClient(mongo_uri)
    db = c[db_name]
    pedidos_col = db['pedidos']
    trabajos_col = db['trabajos']

    total = pedidos_col.count_documents({})
    print(f'Found {total} pedidos to inspect in database "{db_name}"')

    created = 0
    updated_pedidos = 0
    skipped = 0

    cursor = pedidos_col.find({})
    for p in cursor:
        pid = p.get('_id')
        if not pid:
            print('Skipping pedido without _id:', p)
            skipped += 1
            continue

        # If a trabajo already exists with same _id, skip
        exists = trabajos_col.find_one({'_id': pid})
        if exists:
            skipped += 1
            continue

        # Build trabajo doc based on pedido
        trabajo_doc = {
            '_id': pid,
            'empresa_id': p.get('empresa_id', 1),
            'nombre': p.get('referencia') or p.get('numero_pedido') or p.get('nombre') or f'Trabajo-{int(time.time())}',
            'cliente': p.get('cliente') or '',
            'referencia': p.get('referencia') or '',
            'fecha_entrega': p.get('fecha_entrega'),
            'estado': p.get('estado') or 'Pendiente',
            'created_at': p.get('fecha_pedido') or datetime.utcnow().isoformat(),
            'datos_presupuesto': p.get('datos_presupuesto') or p.get('datos_presupuesto') or {}
        }

        print('\nWould create trabajo with _id=%s -> nombre=%s' % (str(pid), trabajo_doc['nombre']))
        if not p.get('trabajo_id'):
            print('Would update pedido %s: set trabajo_id=%s' % (str(pid), str(pid)))

        if apply_changes:
            try:
                trabajos_col.insert_one(trabajo_doc)
                created += 1
            except Exception as e:
                print('Error creating trabajo for pedido %s: %s' % (str(pid), e))
                continue

            try:
                if not p.get('trabajo_id'):
                    pedidos_col.update_one({'_id': pid}, {'$set': {'trabajo_id': str(pid)}})
                    updated_pedidos += 1
            except Exception as e:
                print('Error updating pedido %s: %s' % (str(pid), e))

    print('\nSummary:')
    print('  pedidos inspected:', total)
    print('  trabajos created:', created)
    print('  pedidos updated (trabajo_id set):', updated_pedidos)
    print('  skipped (already had trabajo or no _id):', skipped)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Migra pedidos a trabajos (dry-run por defecto).')
    parser.add_argument('--apply', action='store_true', help='Aplicar los cambios en la base de datos')
    parser.add_argument('--mongo', default='mongodb://localhost:27017', help='MongoDB URI')
    parser.add_argument('--db', default='printforgepro', help='Nombre de la BD')
    args = parser.parse_args()
    main(apply_changes=args.apply, mongo_uri=args.mongo, db_name=args.db)
