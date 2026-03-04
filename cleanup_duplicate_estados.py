#!/usr/bin/env python3
"""
Limpia estados de pedidos duplicados con esquema viejo.
Mantiene solo los documentos con 'valor' y elimina los viejos con 'value'.
"""

import sys
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection
from bson import ObjectId

empresa_id = 0
col = get_empresa_collection('config_opciones', empresa_id)

# IDs de documentos viejos duplicados a eliminar
vacios_ids = [
    '69a852352fff29ef6940e06f',
    '69a852352fff29ef6940e070',
    '69a852352fff29ef6940e071',
    '69a852352fff29ef6940e072',
    '69a852352fff29ef6940e073',
    '69a852352fff29ef6940e074',
    '69a852352fff29ef6940e075',
    '69a852352fff29ef6940e076'
]

print("=== Eliminando documentos duplicados con esquema viejo ===")

for id_str in vacios_ids:
    result = col.delete_one({'_id': ObjectId(id_str)})
    if result.deleted_count > 0:
        print(f"  ✓ Eliminado: {id_str}")
    else:
        print(f"  ✗ No encontrado: {id_str}")

print("\n=== Estados después de limpiar ===")
estados = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
for estado in estados:
    valor = estado.get('valor', '')
    label = estado.get('label', '')
    orden = estado.get('orden', '')
    print(f"  Orden: {orden}, Valor: '{valor}', Label: '{label}'")

print(f"\nTotal estados limpios: {len(estados)}")
