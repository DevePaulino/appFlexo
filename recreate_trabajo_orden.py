#!/usr/bin/env python3
"""
Recrear trabajo_orden basándose en pedidos (para que el código antiguo funcione)
"""
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro']

print("=== RESTAURAR trabajo_orden DESDE pedidos ===\n")

# Limpiar la colección pedido_orden si existe
if 'pedido_orden' in db.list_collection_names():
    db['pedido_orden'].delete_many({})
    print("✓ Limpiada pedido_orden")

# Crear trabajo_orden con el contenido de pedidos
trabajo_orden_col = db['trabajo_orden']
trabajo_orden_col.delete_many({})  # Limpiar si existe

pedidos_col = db['pedidos']
todos_pedidos = list(pedidos_col.find({}))

print(f"\nCopiando {len(todos_pedidos)} pedidos a trabajo_orden...")

# Por cada pedido, crear un documento en trabajo_orden
insertados = 0
for pedido in todos_pedidos:
    # Crear documento para trabajo_orden con los campos necesarios
    trabajo_orden_doc = {
        'trabajo_id': pedido.get('trabajo_id'),
        'maquina_id': pedido.get('maquina_id'),
        'empresa_id': pedido.get('empresa_id', 1),
        'posicion': pedido.get('posicion'),
        # Copiar otros campos si existen
    }
    
    # Remover None values
    trabajo_orden_doc = {k: v for k, v in trabajo_orden_doc.items() if v is not None}
    
    try:
        trabajo_orden_col.insert_one(trabajo_orden_doc)
        insertados += 1
    except Exception as e:
        print(f"  Error inserting {pedido.get('trabajo_id')}: {e}")

print(f"✓ Insertados {insertados} documentos en trabajo_orden\n")

# Verificar
print("=== VERIFICACIÓN ===")
for mid in db['pedidos'].distinct('maquina_id'):
    pedidos_count = db['pedidos'].count_documents({'maquina_id': mid})
    orden_count = db['trabajo_orden'].count_documents({'maquina_id': mid})
    print(f"  maquina_id={mid}: pedidos={pedidos_count}, trabajo_orden={orden_count}")
