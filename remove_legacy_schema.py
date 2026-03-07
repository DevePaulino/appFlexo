#!/usr/bin/env python3
"""Eliminar todos los documentos con esquema viejo (value/order en lugar de valor/orden)"""

import sys
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection

col = get_empresa_collection('config_opciones', 0)

print("=== Limpieza de esquema vejo (value/order) ===\n")

# Buscar documentos con 'value' (viejo) en lugar de 'valor' (nuevo)
viejos = list(col.find({'categoria': 'estados_pedido', 'value': {'$exists': True}}))

print(f"Encontrados {len(viejos)} documentos con esquema viejo:")
for doc in viejos:
    print(f"  _id: {doc['_id']}, value: {repr(doc.get('value'))}, order: {doc.get('order')}")

if viejos:
    print(f"\n=== Eliminando ===")
    # Eliminartodos los que tengan 'value' (viejo)
    result = col.delete_many({'categoria': 'estados_pedido', 'value': {'$exists': True}})
    print(f"✓ Eliminados: {result.deleted_count}")

print("\n=== Resultado final ===")
finales = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
print(f"Total estados: {len(finales)}")
for doc in finales:
    valor = doc.get('valor')
    orden = doc.get('orden')
    print(f"  Orden: {orden} | Valor: '{valor}'")
