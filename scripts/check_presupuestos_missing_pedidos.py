#!/usr/bin/env python3
"""Checks for approved presupuestos that have no linked pedido.
Prints a summary and writes samples to /tmp/missing_presupuestos.json
"""
from pymongo import MongoClient
from bson.objectid import ObjectId
import json

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']
pres = db['presupuestos']
ped = db['pedidos']

query = {'aprobado': True}
count_pres = pres.count_documents(query)
missing = []
for p in pres.find(query):
    pid = p.get('pedido_id')
    trabajo_id = p.get('trabajo_id')
    found = False
    if pid:
        try:
            found = ped.find_one({'_id': ObjectId(pid)}) is not None
        except Exception:
            found = ped.find_one({'_id': pid}) is not None
    if not found and trabajo_id:
        if ped.find_one({'trabajo_id': trabajo_id}):
            found = True
    if not found:
        missing.append({'_id': str(p.get('_id')), 'trabajo_id': trabajo_id, 'pedido_id': pid})

print('Presupuestos aprobados count:', count_pres)
print('Presupuestos aprobados without pedido count:', len(missing))
if missing:
    path = '/tmp/missing_presupuestos.json'
    with open(path, 'w') as f:
        json.dump(missing, f, indent=2)
    print('Wrote sample list to', path)
    print('First items:')
    for x in missing[:20]:
        print(x)
