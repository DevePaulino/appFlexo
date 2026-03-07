#!/usr/bin/env python3
"""
script para restaurar máquinas faltantes basándose en los pedidos existentes
"""
from pymongo import MongoClient
from bson import ObjectId
import sys

client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro']

print("=== RESTAURAR MÁQUINAS FALTANTES ===\n")

# Máquinas que faltan
missing_machines = [
    {
        '_id': ObjectId('69a5a3976b875ef6d4910f78'),
        'id': 1,
        'nombre': 'Flexo 1',
        'tipo': 'flexo',
        'empresa_id': 1
    },
    {
        '_id': ObjectId('69a5a3976b875ef6d4910f79'),
        'id': 2,
        'nombre': 'Flexo 2',
        'tipo': 'flexo',
        'empresa_id': 1
    }
]

maquinas_col = db['maquinas']

for maq in missing_machines:
    # Verificar si ya existe
    existing = maquinas_col.find_one({'_id': maq['_id']})
    if existing:
        print(f"✓ {maq['nombre']} ya existe")
    else:
        result = maquinas_col.insert_one(maq)
        print(f"✛ Insertada {maq['nombre']} (id: {result.inserted_id})")

print("\n=== MÁQUINAS ACTUALES ===")
for m in maquinas_col.find({}):
    count = db['pedidos'].count_documents({'maquina_id': {'$in': [m.get('id'), str(m.get('_id'))]}})
    print(f"  {m.get('nombre')} (id: {m.get('id')}, _id: {m.get('_id')})")
    print(f"    → Pedidos asociados: {count}")

print("\n=== TOTAL DE MÁQUINAS ===")
total = maquinas_col.count_documents({})
print(f"Total: {total} máquinas")

print("\n=== TOTAL DE PEDIDOS ===")
pedidos_total = db['pedidos'].count_documents({})
print(f"Total: {pedidos_total} pedidos")
