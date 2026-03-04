#!/usr/bin/env python
from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/?directConnection=true', serverSelectionTimeoutMS=2000)
db = client['printforge_dev']
col = db['config_opciones']

# Delete all estados first
result = col.delete_many({'categoria': 'estados_pedido'})
print(f"Deleted {result.deleted_count} documents")

# Now test the ensure_estados_protegidos_presentes logic
defaults_estados = [
    ('diseno', 'Diseño', 1),
    ('pendiente-de-aprobacion', 'Pendiente de Aprobación', 2),
    ('pendiente-de-cliche', 'Pendiente de Cliché', 3),
    ('pendiente-de-impresion', 'Pendiente de Impresión', 4),
    ('pendiente-post-impresion', 'Pendiente Post-Impresión', 5),
    ('finalizado', 'Finalizado', 6),
    ('parado', 'Parado', 7),
    ('cancelado', 'Cancelado', 8),
]

print("\n--- First call to ensure_estados_protegidos_presentes() ---")
for slug, label, orden in defaults_estados:
    count = col.count_documents({'categoria': 'estados_pedido', 'valor': label})
    print(f"Checking '{label}': exists={count>0}")
    if count == 0:
        col.insert_one({
            'categoria': 'estados_pedido',
            'valor': label,
            'label': label,
            'orden': orden,
            'fecha_creacion': datetime.now().isoformat()
        })
        print(f"  → Inserted '{label}'")

print(f"\nTotal documents after first ensure: {col.count_documents({'categoria': 'estados_pedido'})}")

print("\n--- Second call to ensure_estados_protegidos_presentes() (should be idempotent) ---")
inserted_count = 0
for slug, label, orden in defaults_estados:
    count = col.count_documents({'categoria': 'estados_pedido', 'valor': label})
    print(f"Checking '{label}': exists={count>0}")
    if count == 0:
        col.insert_one({
            'categoria': 'estados_pedido',
            'valor': label,
            'label': label,
            'orden': orden,
            'fecha_creacion': datetime.now().isoformat()
        })
        print(f"  → Inserted '{label}'")
        inserted_count += 1

print(f"\nDocuments inserted in second call: {inserted_count}")
print(f"Total documents after second ensure: {col.count_documents({'categoria': 'estados_pedido'})}")

# Show all documents
docs = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1)]))
print(f"\nFinal state ({len(docs)} documents):")
for doc in docs:
    print(f"  - {doc.get('valor')} (orden={doc.get('orden')})")
