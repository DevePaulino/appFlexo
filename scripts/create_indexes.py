#!/usr/bin/env python3
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['printforgepro']

print('Creating indexes for trabajo_orden...')
db.trabajo_orden.create_index([('empresa_id', 1), ('maquina_id', 1), ('posicion', 1)])
db.trabajo_orden.create_index([('empresa_id', 1), ('trabajo_id', 1)])
print('Creating indexes for pedidos...')
db.pedidos.create_index([('empresa_id', 1), ('trabajo_id', 1)])
print('Indexes created.')
