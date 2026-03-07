#!/usr/bin/env python3
"""Debug - Ver todos los estados de pedido en la BD"""

import sys
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection

empresa_id = 0
col = get_empresa_collection('config_opciones', empresa_id)

print("=== REVISIÓN DE ESTADOS DE PEDIDO ===\n")
todos = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))

for i, doc in enumerate(todos):
    valor = doc.get('valor')
    label = doc.get('label')
    orden = doc.get('orden')
    empty = not valor or str(valor).strip() == '' or valor in ['None', None]
    marker = '❌ VACÍO' if empty else '✓'
    
    print(f"{marker} {i+1}. Orden: {orden}, Valor: {repr(valor)}, Label: {repr(label)}")

vacios = [d for d in todos if not d.get('valor') or str(d.get('valor')).strip() == '' or d.get('valor') in ['None', None]]
print(f"\nTotal: {len(todos)} | Vacíos: {len(vacios)}")

if vacios:
    print("\n=== Eliminando documentos vacíos ===")
    for doc in vacios:
        result = col.delete_one({'_id': doc['_id']})
        if result.deleted_count > 0:
            print(f"✓ Eliminado: {doc['_id']}")

    print("\n=== Después de eliminar ===")
    todos_new = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
    for i, doc in enumerate(todos_new):
        valor = doc.get('valor')
        orden = doc.get('orden')
        print(f"  {i+1}. Orden: {orden}, Valor: {repr(valor)}")
    print(f"\nTotal ahora: {len(todos_new)}")
