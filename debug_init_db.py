#!/usr/bin/env python3
"""
Debug version of init_db() to identify why documents are not being created
"""

from datetime import datetime
from pymongo import MongoClient
from os import environ

MONGO_URI = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge')
client = MongoClient(MONGO_URI)
db = client['printforge']
col = db['config_opciones']

print("=== Debug init_db() Logic ===")
print()

# Mapeo de slugs a nombres legibles para estados
states_slug_to_label = {
    'diseno': 'Diseño',
    'pendiente-de-aprobacion': 'Pendiente de Aprobación',
    'pendiente-de-cliche': 'Pendiente de Cliché',
    'pendiente-de-impresion': 'Pendiente de Impresión',
    'pendiente-post-impresion': 'Pendiente Post-Impresión',
    'finalizado': 'Finalizado',
    'parado': 'Parado',
    'cancelado': 'Cancelado'
}

defaults_catalogo = {
    'estados_pedido': list(states_slug_to_label.keys())
}

print("Processing 'estados_pedido' category:")
print()

for categoria, valores in defaults_catalogo.items():
    for idx, valor in enumerate(valores, start=1):
        # For estados,  valor is the slug (key), label is human-readable (value)
        label = states_slug_to_label.get(valor, valor)
        
        # Check if exists by slug (valor key)
        query = {
            'categoria': categoria, 
            'tipo_slug': valor  # Use a separate field to track the slug
        }
        exists_count = col.count_documents(query)
        
        print(f"{idx}. {valor} -> {label}")
        print(f"   Query: {query}")
        print(f"   Exists: {exists_count > 0}")
        
        if exists_count == 0:
            doc = {
                'categoria': categoria,
                'tipo_slug': valor,  # Store slug for idempotency check
                'valor': label,  # Store human-readable label
                'label': label,
                'orden': idx,
                'fecha_creacion': datetime.now().isoformat()
            }
            print(f"   → Intentando insertar: {doc}")
            try:
                result = col.insert_one(doc)
                print(f"   ✓ Insertado con _id: {result.inserted_id}")
            except Exception as e:
                print(f"   ❌ Error al insertar: {e}")
        else:
            print(f"   → YA EXISTE, not inserting")
        print()

# Verify final state
final_count = col.count_documents({'categoria': 'estados_pedido'})
print(f"Total estados en BD: {final_count}")
