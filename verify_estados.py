#!/usr/bin/env python3
from pymongo import MongoClient
from os import environ

client = MongoClient(environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforge'))
db = client['printforge']
col = db['config_opciones']

total = col.count_documents({'categoria': 'estados_pedido'})
print(f"Total: {total}")

todos = list(col.find({'categoria': 'estados_pedido'}).sort('orden', 1))
print("\nDocumentos:")
for doc in todos:
    print(f"  valor='{doc.get('valor')}' orden={doc.get('orden')} id={str(doc['_id'])[:12]}")

# Check for duplicates
from collections import defaultdict
duplicados = defaultdict(list)
for doc in todos:
    valor = doc.get('valor')
    duplicados[valor].append(str(doc['_id']))

print("\n\nAnálisis de duplicados:")
for valor, ids in sorted(duplicados.items()):
    status = f"DUPLICADO x{len(ids)}" if len(ids) > 1 else "OK"
    print(f"  {valor}: {status}")
