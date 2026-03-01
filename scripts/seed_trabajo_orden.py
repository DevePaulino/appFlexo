#!/usr/bin/env python3
"""Seed demo `trabajos` and `trabajo_orden` so smoke tests can run.
Creates 5 trabajos and enqueues them across 2 machines.
"""
from pymongo import MongoClient
from datetime import datetime
import os
import random


def get_mongo_uri():
    return os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')


def main():
    uri = get_mongo_uri()
    client = MongoClient(uri)
    db_name = os.environ.get('MONGO_DBNAME', 'printforgepro')
    db = client[db_name]

    empresa_id = 1
    trabajos_col = db['trabajos']
    orden_col = db['trabajo_orden']

    print('Seeding trabajos...')
    trabajos = []
    for i in range(5):
        doc = {
            'empresa_id': empresa_id,
            'nombre': f'Trabajo demo {i+1}',
            'referencia': f'T-Demo-{i+1}',
            'fecha_entrega': datetime.utcnow().isoformat(),
            'estado': 'Pendiente',
            'created_at': datetime.utcnow().isoformat()
        }
        res = trabajos_col.insert_one(doc)
        tid = str(res.inserted_id)
        # also store `id` string field for compatibility
        trabajos_col.update_one({'_id': res.inserted_id}, {'$set': {'id': tid}})
        trabajos.append(tid)

    print(f'Inserted {len(trabajos)} trabajos')

    print('Seeding trabajo_orden...')
    # Clear existing trabajo_orden for empresa (to avoid duplicates)
    orden_col.delete_many({'empresa_id': empresa_id})

    maquinas = [1, 2]
    ops = []
    posicion_counters = {m: 0 for m in maquinas}
    for t in trabajos:
        m = random.choice(maquinas)
        posicion_counters[m] += 1
        orden = {
            'empresa_id': empresa_id,
            'trabajo_id': t,
            'maquina_id': m,
            'posicion': posicion_counters[m]
        }
        orden_col.insert_one(orden)

    total = orden_col.count_documents({'empresa_id': empresa_id})
    print(f'Inserted {total} trabajo_orden rows')


if __name__ == '__main__':
    main()
