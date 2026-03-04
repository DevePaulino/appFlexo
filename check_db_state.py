#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from pymongo import MongoClient
import json

# Conectar a MongoDB sin cargar app.py
client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro_empresa_1']

# Verificar colecciones
print("=== COLECCIONES DISPONIBLES ===")
for col_name in db.list_collection_names():
    count = db[col_name].count_documents({})
    print(f"  {col_name}: {count} documentos")

print("\n=== MÁQUINAS ===")
maquinas_col = db['maquinas']
for maq in maquinas_col.find({}):
    print(f"  ID: {maq.get('_id')} | id: {maq.get('id')} | nombre: {maq.get('nombre')}")

print("\n=== PEDIDOS - todos ===")
pedidos_col = db['pedidos']
count = 0
for pedido in pedidos_col.find({}):
    print(f"  trabajo_id: {pedido.get('trabajo_id')} | maquina_id: {pedido.get('maquina_id')} | estado: {pedido.get('estado')}")
    count += 1

print(f"\nTotal pedidos: {count}")

print("\n=== DISTINCT maquina_id in pedidos ===")
maquina_ids = pedidos_col.distinct('maquina_id')
for mid in maquina_ids:
    count_for_mid = pedidos_col.count_documents({'maquina_id': mid})
    print(f"  {mid}: {count_for_mid} pedidos")

print("\n=== Buscar trabajo_orden (debería estar vacía) ===")
if 'trabajo_orden' in db.list_collection_names():
    trabajo_orden_col = db['trabajo_orden']
    count = trabajo_orden_col.count_documents({})
    print(f"  trabajo_orden SIGUE EXISTIENDO con {count} documentos!")
else:
    print("  trabajo_orden NO EXISTE (correcto)")
