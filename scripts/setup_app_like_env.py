#!/usr/bin/env python3
"""Prepara la base de datos para pruebas: crea índices, inserta máquinas de ejemplo y contadores.
"""
from pymongo import MongoClient
from datetime import datetime
import os

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'printforgepro')
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

empresa_id = 1

print('Creating machines...')
maquinas = db['maquinas']
maquinas.delete_many({'empresa_id': empresa_id})
maquinas.insert_many([
    {'empresa_id': empresa_id, 'id': 1, 'nombre': 'Flexo 1', 'tipo': 'flexo', 'created_at': datetime.utcnow().isoformat()},
    {'empresa_id': empresa_id, 'id': 2, 'nombre': 'Flexo 2', 'tipo': 'flexo', 'created_at': datetime.utcnow().isoformat()},
    {'empresa_id': empresa_id, 'id': 'stress-test-machine', 'nombre': 'Stress Test Machine', 'tipo': 'flexo', 'created_at': datetime.utcnow().isoformat()},
])
print('Machines created')

# Ensure pedidos (trabajos) collection exists with sample if empty
pedidos = db['pedidos']
if pedidos.count_documents({'empresa_id': empresa_id}) == 0:
    print('Inserting sample pedido...')
    pedidos.insert_one({'empresa_id': empresa_id, 'trabajo_id': 'SAMPLE-1', 'numero_pedido': '10001', 'referencia': 'SAMPLE', 'cliente': {'nombre': 'Cliente Demo'}, 'estado': 'diseno', 'created_at': datetime.utcnow().isoformat()})

# Create indexes
print('Creating indexes...')
# pedidos unique index
try:
    pedidos.create_index([('empresa_id', 1), ('trabajo_id', 1)], unique=True, name='empresa_trabajo_unique')
except Exception as e:
    print('pedidos index error:', e)

# pedido_orden / trabajo_orden index names
pedido_orden = db['pedido_orden']
try:
    pedido_orden.create_index([('empresa_id', 1), ('trabajo_id', 1)], unique=True, sparse=True, name='empresa_trabajo_unique_order')
    pedido_orden.create_index([('empresa_id', 1), ('maquina_id', 1), ('posicion', 1)], name='empresa_maquina_pos')
except Exception as e:
    print('pedido_orden index error:', e)

# counters collection
counters = db['counters']
# set pedido_seq if missing
try:
    if counters.count_documents({'key': 'pedido_seq', 'empresa_id': empresa_id}) == 0:
        counters.insert_one({'key': 'pedido_seq', 'empresa_id': empresa_id, 'seq': 1000, 'updated_at': datetime.utcnow().isoformat()})
except Exception as e:
    print('counters error:', e)

# For each machine set pos counter to 1
for m in maquinas.find({'empresa_id': empresa_id}):
    key = f"pos_{empresa_id}_{m.get('id')}"
    try:
        counters.update_one({'key': key, 'empresa_id': empresa_id}, {'$set': {'seq': 1, 'updated_at': datetime.utcnow().isoformat()}}, upsert=True)
    except Exception as e:
        print('counter set error for', key, e)

print('Setup complete')
