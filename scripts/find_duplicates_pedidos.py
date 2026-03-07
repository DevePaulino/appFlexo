#!/usr/bin/env python3
import os, sys
from pymongo import MongoClient
from bson.objectid import ObjectId


def main():
    import argparse
    p = argparse.ArgumentParser(description='Detect duplicates in trabajo_orden for a machine')
    p.add_argument('--machine', '-m', required=True, help='Machine name (exact or partial)')
    p.add_argument('--db', default=os.environ.get('MONGO_DBNAME', 'printforgepro'))
    args = p.parse_args()

    client = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017/'))
    db = client[args.db]

    maquina_name = args.machine
    maquina = db.maquinas.find_one({'nombre': maquina_name})
    if not maquina:
        maquina = db.maquinas.find_one({'nombre': {'$regex': maquina_name, '$options': 'i'}})
    if not maquina:
        print(f"Máquina '{maquina_name}' no encontrada (exacta ni parcial). Listando candidatas...\n")
        for m in db.maquinas.find({'nombre': {'$regex': maquina_name, '$options': 'i'}}).limit(20):
            print('-', m.get('nombre'), 'id=', m.get('id') or m.get('_id'))
        sys.exit(2)

    print('Encontrada máquina:', maquina.get('nombre'), 'doc _id=', maquina.get('_id'), 'id=', maquina.get('id'))

    candidates = set()
    if '_id' in maquina and maquina['_id'] is not None:
        candidates.add(maquina['_id'])
        candidates.add(str(maquina['_id']))
    if 'id' in maquina and maquina['id'] is not None:
        candidates.add(maquina['id'])
        candidates.add(str(maquina['id']))
        try:
            candidates.add(int(maquina['id']))
        except Exception:
            pass

    or_clauses = []
    for c in candidates:
        or_clauses.append({'maquina_id': c})

    query = {'$or': or_clauses} if or_clauses else {}
    print('\nQuery sobre `trabajo_orden`:', query)

    orden_col = db['trabajo_orden']
    rows = list(orden_col.find(query))
    print('Filas encontradas en trabajo_orden para esta máquina:', len(rows))

    # Agrupar por canonical trabajo_id (str)
    groups = {}
    for r in rows:
        t = r.get('trabajo_id')
        canon = str(t) if t is not None else '<none>'
        groups.setdefault(canon, []).append(r)

    duplicates = {k: v for k, v in groups.items() if len(v) > 1}
    if not duplicates:
        print('\nNo se encontraron duplicados para la máquina', maquina_name)
        return

    print('\nDuplicados detectados (agrupados por trabajo_id canonical):', len(duplicates))
    for k, docs in duplicates.items():
        print('\n--- trabajo_id canonical =', k, 'count =', len(docs))
        for d in docs:
            print('-', str(d.get('_id')), 'trabajo_id=', repr(d.get('trabajo_id')), 'pos=', d.get('posicion'), 'maquina_id=', repr(d.get('maquina_id')))

    print('\nHecho')


if __name__ == '__main__':
    main()
