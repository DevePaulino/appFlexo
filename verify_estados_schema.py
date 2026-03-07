#!/usr/bin/env python3
"""
Verify that estado documents have correct schema after Flask restart.
"""

from pymongo import MongoClient
from os import environ

MONGO_URI = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge')
client = MongoClient(MONGO_URI)
db = client['printforge']

def verify_estados_schema():
    """Verify all estado documents have correct schema"""
    col = db['config_opciones']
    
    print("=== Verificación de Esquema de Estados ===")
    print()
    
    estados = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1), ('_id', 1)]))
    
    if not estados:
        print("❌ ERROR: No hay documentos de estados_pedido en BD")
        return False
    
    print(f"Total documentos: {len(estados)}")
    print()
    
    # Check for schema consistency
    all_good = True
    for idx, doc in enumerate(estados, 1):
        has_valor = 'valor' in doc
        has_label = 'label' in doc
        has_orden = 'orden' in doc
        has_legacy_value = 'value' in doc
        has_legacy_order = 'order' in doc
        
        status = "✓" if (has_valor and has_label and has_orden and not has_legacy_value and not has_legacy_order) else "❌"
        
        valor = doc.get('valor', 'N/A')
        orden = doc.get('orden', 'N/A')
        
        print(f"{status} {orden}. {valor}")
        
        if has_legacy_value or has_legacy_order:
            print(f"   ⚠️  WARNING: Documento tiene campos legacy (value/order)")
            all_good = False
        
        if not (has_valor and has_label and has_orden):
            print(f"   ⚠️  WARNING: Faltan campos (valor/label/orden)")
            all_good = False
    
    print()
    
    if all_good and len(estados) == 8:
        print("✅ ÉXITO: Todos los estados tienen esquema correcto")
        return True
    else:
        if len(estados) != 8:
            print(f"⚠️  WARNING: Se esperaban 8 estados, se encontraron {len(estados)}")
        if not all_good:
            print("❌ ERROR: Algunos documentos tienen esquema incorrecto")
        return False

if __name__ == '__main__':
    success = verify_estados_schema()
    exit(0 if success else 1)
