#!/usr/bin/env python3
"""
Cleanup and reinitialize database with new schema.
This script:
1. Removes all old-schema estado documents using the legacy 'value' field
2. Removes all current estado documents from config_opciones
3. Prepares for fresh init_db() call at Flask startup
"""

from pymongo import MongoClient
from os import environ

# MongoDB setup
MONGO_URI = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge')
client = MongoClient(MONGO_URI)
db = client['printforge']

def cleanup_and_reinit():
    """Clean legacy schema and remove all estados for fresh init"""
    col = db['config_opciones']
    
    print("=== Cleanup y Reinit del BD ===")
    print()
    
    # Step 1: Remove documents with legacy schema (using 'value' field)
    legacy_count = col.delete_many({'categoria': 'estados_pedido', 'value': {'$exists': True}}).deleted_count
    print(f"✓ Eliminados documentos con esquema viejo (value/order): {legacy_count}")
    
    # Step 2: Remove ALL current estado documents to start fresh
    # This ensures init_db() will create them with correct schema
    current_count = col.delete_many({'categoria': 'estados_pedido'}).deleted_count
    print(f"✓ Eliminados todos los documentos de estados_pedido: {current_count}")
    
    # Step 3: Verify clean state
    remaining = list(col.find({'categoria': 'estados_pedido'}))
    print(f"✓ Estados restantes en BD: {len(remaining)}")
    
    print()
    print("=== Estado final ===")
    print(f"La BD está lista para que init_db() cree los estados con nuevo esquema.")
    print(f"Reinicia Flask para ejecutar init_db() y crear 8 estados con esquema correcto.")
    print()
    
    # Show what's expected
    expected_states = [
        'Diseño',
        'Pendiente de Aprobación',
        'Pendiente de Cliché',
        'Pendiente de Impresión',
        'Pendiente Post-Impresión',
        'Finalizado',
        'Parado',
        'Cancelado'
    ]
    print("Estados esperados después del reinicio de Flask:")
    for idx, estado in enumerate(expected_states, 1):
        print(f"  {idx}. {estado}")

if __name__ == '__main__':
    cleanup_and_reinit()
