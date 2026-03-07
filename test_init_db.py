#!/usr/bin/env python3
"""
Test to verify estado schema after init_db() has been called by Flask
NOTE: Does NOT import app to avoid triggering init_db() during import
"""

from pymongo import MongoClient
from os import environ

MONGO_URI = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge')
db = MongoClient(MONGO_URI)['printforge']

print("=== Verificación de Schema de Estados ===")
print()

col = db['config_opciones']
estados = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1), ('_id', 1)]))

print(f"Total estados en BD: {len(estados)}")
print()

for idx, doc in enumerate(estados, 1):
    valor = doc.get('valor', 'N/A')
    orden = doc.get('orden', 'N/A')
    has_valor = 'valor' in doc
    has_label = 'label' in doc
    has_orden = 'orden' in doc
    
    schema_ok = (has_valor and has_label and has_orden and 'value' not in doc and 'order' not in doc)
    status = "✓" if schema_ok else "❌"
    
    print(f"{status} {orden}. {valor} | Fields: valor={has_valor}, label={has_label}, orden={has_orden}")

print()
if len(estados) == 8:
    all_good = all(
        doc.get('valor') and 
        doc.get('label') and 
        doc.get('orden') and
        'value' not in doc and 
        'order' not in doc
        for doc in estados
    )
    if all_good:
        print("✅ ÉXITO: Todos los 8 estados tienen esquema correcto")
    else:
        print("❌ ERROR: Algunos estados tienen esquema incorrecto")
else:
    print(f"⚠️  ERROR: Se esperaban 8 estados, se encontraron {len(estados)}")
