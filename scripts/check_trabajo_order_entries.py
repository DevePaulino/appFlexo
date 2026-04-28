#!/usr/bin/env python3
from pymongo import MongoClient
from bson.objectid import ObjectId
import sys

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']
col = db['trabajo_orden']

ids = ['69a0ac41ef06cbca81320ed5', '69a3394b649d8eaa4e2460d3']

for tid in ids:
    print('--- Checking', tid)
    qlist = []
    # exact string matches
    qlist.append({'trabajo_id': tid})
    qlist.append({'id': tid})
    qlist.append({'pedido_id': tid})
    # ObjectId match if possible
    try:
        oid = ObjectId(tid)
        qlist.append({'_id': oid})
    except Exception:
        oid = None
    # machine id may appear in maquina_id field; we just find any doc that references trabajo id in any string field
    # search for documents where any string field equals tid
    # We'll run each q and then also do a broader regex search on all string fields by scanning
    found = False
    for q in qlist:
        cur = list(col.find(q))
        if cur:
            print('Matches for query', q)
            for d in cur:
                print('-', repr({k: d.get(k) for k in ['_id','trabajo_id','id','maquina_id','posicion','pedido_id']}))
            found = True
    if not found:
        # fallback: scan collection and look for tid in any string value
        cur = []
        for d in col.find():
            for v in d.values():
                if isinstance(v, str) and tid in v:
                    cur.append(d); break
        if cur:
            print('Found by scanning values:')
            for d in cur:
                print('-', repr({k: d.get(k) for k in ['_id','trabajo_id','id','maquina_id','posicion','pedido_id']}))
            found = True
    if not found:
        print('No entries found in trabajo_orden for', tid)

print('Done')
