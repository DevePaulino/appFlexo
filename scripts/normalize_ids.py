#!/usr/bin/env python3
import argparse
import os
from pymongo import MongoClient, UpdateOne
from bson import ObjectId


def to_str(val):
    if isinstance(val, str):
        return val
    try:
        if isinstance(val, ObjectId):
            return str(val)
    except Exception:
        pass
    # Fallback for dict-like from mongoexport or other shapes
    if isinstance(val, dict):
        # common shape: {'$oid': '...'}
        if '$oid' in val:
            return val['$oid']
        # or plain nested id
        for k in ['id', '_id']:
            if k in val:
                return to_str(val[k])
    # otherwise stringify
    return str(val)


def normalize_collection(db, name, fields, batch=1000):
    col = db[name]
    ops = []
    total = 0
    for doc in col.find({}, projection=fields):
        _id = doc.get('_id')
        set_op = {}
        for f in fields:
            if f in doc:
                newv = to_str(doc[f])
                if newv != doc[f]:
                    set_op[f] = newv
        if set_op:
            ops.append(UpdateOne({'_id': _id}, {'$set': set_op}))
        if len(ops) >= batch:
            res = col.bulk_write(ops)
            total += res.modified_count
            ops = []
    if ops:
        res = col.bulk_write(ops)
        total += res.modified_count
    print(f"Normalized {total} documents in {name}")
    return total


def normalize_pedidos(db, batch=1000):
    col = db['pedidos']
    ops = []
    total = 0
    for doc in col.find({}, projection=['trabajo_id', 'empresa_id', 'datos_presupuesto']):
        _id = doc.get('_id')
        set_op = {}
        if 'trabajo_id' in doc:
            newv = to_str(doc['trabajo_id'])
            if newv != doc['trabajo_id']:
                set_op['trabajo_id'] = newv
        if 'empresa_id' in doc:
            newv = to_str(doc['empresa_id'])
            if newv != doc['empresa_id']:
                set_op['empresa_id'] = newv
        # datos_presupuesto.maquina_id_bd
        dp = doc.get('datos_presupuesto')
        if isinstance(dp, dict) and 'maquina_id_bd' in dp:
            newv = to_str(dp['maquina_id_bd'])
            if newv != dp['maquina_id_bd']:
                set_op['datos_presupuesto.maquina_id_bd'] = newv
        if set_op:
            ops.append(UpdateOne({'_id': _id}, {'$set': set_op}))
        if len(ops) >= batch:
            res = col.bulk_write(ops)
            total += res.modified_count
            ops = []
    if ops:
        res = col.bulk_write(ops)
        total += res.modified_count
    print(f"Normalized {total} documents in pedidos")
    return total


def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--uri', default='mongodb://localhost:27017/pressmateapp')
    p.add_argument('--dry', action='store_true', help='Do not write, just report (not implemented)')
    args = p.parse_args()

    client = MongoClient(args.uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = None
    if db is None:
        db = client['pressmateapp']

    print('Normalizing `trabajo_orden` (trabajo_id, maquina_id, empresa_id)')
    normalize_collection(db, 'trabajo_orden', ['trabajo_id', 'maquina_id', 'empresa_id'])

    print('Normalizing `pedidos` (trabajo_id, empresa_id, datos_presupuesto.maquina_id_bd)')
    normalize_pedidos(db)

    print('Normalizing `trabajos` (empresa_id)')
    normalize_collection(db, 'trabajos', ['empresa_id'])

    print('Done')


if __name__ == '__main__':
    main()
