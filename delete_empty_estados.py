#!/usr/bin/env python3
"""
Elimina estados de pedidos con valor='None' o vacío.
"""

import sys
sys.path.insert(0, '/Users/osanchez/Vista-printingConditions/PrintForgePro')

from app import get_empresa_collection

empresa_id = 0
col = get_empresa_collection('config_opciones', empresa_id)

print("=== Buscando estados con valor='None' o vacío ===")

# Buscar documentos con valor 'None' O valor no definido
vacios = list(col.find({
    'categoria': 'estados_pedido',
    '$or': [
        {'valor': 'None'},
        {'valor': None},
        {'valor': ''},
        {'valor': {'$exists': False}}
    ]
}))

print(f"Encontrados {len(vacios)} estados vacíos:")
for doc in vacios:
    print(f"  _id: {doc['_id']}, valor: {repr(doc.get('valor'))}, label: {repr(doc.get('label'))}")

if vacios:
    print("\nEliminando...")
    result = col.delete_many({
        'categoria': 'estados_pedido',
        '$or': [
            {'valor': 'None'},
            {'valor': None},
            {'valor': ''},
            {'valor': {'$exists': False}}
        ]
    })
    print(f"✓ Eliminados {result.deleted_count} documentos")

print("\n=== Estados después de eliminar vacíos ===")
estados = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
for estado in estados:
    valor = estado.get('valor', '')
    label = estado.get('label', '')
    orden = estado.get('orden', '')
    print(f"  Orden: {orden}, Valor: '{valor}', Label: '{label}'")

print(f"\nTotal estados: {len(estados)}")
