#!/usr/bin/env python3
from pymongo import MongoClient, UpdateOne
import json

client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro']
col = db['config_opciones']

filter_doc = {'categoria': 'roles', 'valor': 'root'}
update_doc = {'$set': {
    'categoria': 'roles',
    'valor': 'root',
    'label': 'Root',
    'order': 0,
    'activo': True,
    'empresa_id': 0,
    'internal': True
}}
res = col.update_one(filter_doc, update_doc, upsert=True)
print('matched_count:', res.matched_count, 'modified_count:', res.modified_count, 'upserted_id:', getattr(res, 'upserted_id', None))

# Print current roles for verification
roles = list(col.find({'categoria': 'roles'}).sort('order', 1))
print('\nCurrent roles in config_opciones:')
for r in roles:
    print(json.dumps({'_id': str(r.get('_id')), 'valor': r.get('valor'), 'label': r.get('label'), 'order': r.get('order')}, ensure_ascii=False))
