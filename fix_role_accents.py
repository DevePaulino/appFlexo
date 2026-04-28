#!/usr/bin/env python3
from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']
coll = db['config_opciones']

print("Updating role valores to remove accents...\n")

# Update by searching for the current valor, not by ID
updates = [
    ('Diseño', 'Diseno'),
    ('Impresi\u00f3n', 'Impresion'),
    ('Post-Impresi\u00f3n', 'Post-impresion'),
]

for old_val, new_val in updates:
    try:
        result = coll.update_many(
            {'categoria': 'roles', 'valor': old_val},
            {'$set': {'valor': new_val, 'label': new_val}}
        )
        if result.modified_count > 0:
            print(f"✓ Updated {result.modified_count} role(s): '{old_val}' → '{new_val}'")
        else:
            print(f"✗ No roles found with valor='{old_val}'")
    except Exception as e:
        print(f"✗ Error: {e}")

# Verify
print("\n\nVerifying updated roles:")
for item in coll.find({'categoria': 'roles'}):
    print(f"  {item.get('valor')}")
