#!/usr/bin/env python3
import os, sys
from pymongo import MongoClient


def main():
    import argparse
    p = argparse.ArgumentParser(description='Detect duplicated trabajo_id entries in trabajo_orden (global)')
    p.add_argument('--db', default=os.environ.get('MONGO_DBNAME', 'printforgepro'))
    p.add_argument('--limit', type=int, default=100, help='Max groups to print')
    args = p.parse_args()

    client = MongoClient(os.environ.get('MONGO_URI', 'mongodb://localhost:27017/'))
    db = client[args.db]
    col = db['trabajo_orden']

    pipeline = [
        { '$group': { '_id': { 'empresa_id': '$empresa_id', 'maquina_id': '$maquina_id', 'trabajo_id': '$trabajo_id' }, 'count': { '$sum': 1 }, 'ids': { '$push': '$_id' } } },
        { '$match': { 'count': { '$gt': 1 } } },
        { '$sort': { 'count': -1 } },
        { '$limit': args.limit }
    ]

    print('Running aggregation to find duplicate groups (empresa_id, maquina_id, trabajo_id)')
    cursor = col.aggregate(pipeline, allowDiskUse=True)
    found = 0
    for doc in cursor:
        found += 1
        key = doc.get('_id') or {}
        print('\n--- Group', found, '---')
        print('empresa_id:', key.get('empresa_id'))
        print('maquina_id:', key.get('maquina_id'))
        print('trabajo_id (canonical):', key.get('trabajo_id'))
        print('count:', doc.get('count'))
        print('sample_ids:', doc.get('ids')[:10])

    if found == 0:
        print('No duplicate groups found.')
    else:
        print('\nTotal duplicate groups reported:', found)

if __name__ == '__main__':
    main()
