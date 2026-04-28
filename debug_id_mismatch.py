#!/usr/bin/env python3
from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']

print('=== MÁQUINAS - campos id y _id ===')
for m in db['maquinas'].find({}):
    print(f'{m.get("nombre")}:')
    print(f'  id (field): {m.get("id")} (type: {type(m.get("id")).__name__})')
    print(f'  _id: {m.get("_id")} (type: {type(m.get("_id")).__name__})')
    
print('\n=== Búsqueda de trabajo_orden para cada máquina ===')
for m in db['maquinas'].find({}):
    maquina_id = m.get('id')
    maquina_oid = m.get('_id')
    
    # Test query 1: by id field
    count1 = db['trabajo_orden'].count_documents({'maquina_id': maquina_id, 'empresa_id': 1})
    
    # Test query 2: by _id (ObjectId)
    count2 = db['trabajo_orden'].count_documents({'maquina_id': maquina_oid, 'empresa_id': 1})
    
    # Test query 3: by str(_id)
    count3 = db['trabajo_orden'].count_documents({'maquina_id': str(maquina_oid), 'empresa_id': 1})
    
    # Test query 4: just maquina_id without empresa_id filter
    count4 = db['trabajo_orden'].count_documents({'maquina_id': maquina_id})
    
    print(f'{m.get("nombre")}:')
    print(f'  by id {maquina_id} (with empresa_id=1): {count1}')
    print(f'  by _id {maquina_oid} (with empresa_id=1): {count2}')
    print(f'  by str(_id) {str(maquina_oid)} (with empresa_id=1): {count3}')
    print(f'  by id {maquina_id} (no empresa_id filter): {count4}')
    print()

print('\n=== Sample trabajo_orden documents ===')
for doc in db['trabajo_orden'].find({}).limit(3):
    print(f'maquina_id: {doc.get("maquina_id")} (type: {type(doc.get("maquina_id")).__name__})')
    print(f'empresa_id: {doc.get("empresa_id")} (type: {type(doc.get("empresa_id")).__name__})')
    print()
