#!/usr/bin/env python3
import os
from pymongo import MongoClient, ASCENDING

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'printforgepro')

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

print(f'Creating indexes on {DB_NAME}...')

# --- pedido_orden / trabajo_orden ---
print('pedido_orden / trabajo_orden...')
db.trabajo_orden.create_index([('empresa_id', ASCENDING), ('maquina_id', ASCENDING), ('posicion', ASCENDING)])
db.trabajo_orden.create_index([('empresa_id', ASCENDING), ('trabajo_id', ASCENDING)])
db.pedido_orden.create_index([('empresa_id', ASCENDING), ('maquina_id', ASCENDING), ('posicion', ASCENDING)])
db.pedido_orden.create_index([('empresa_id', ASCENDING), ('trabajo_id', ASCENDING)])

# --- pedidos ---
print('pedidos...')
db.pedidos.create_index([('empresa_id', ASCENDING), ('trabajo_id', ASCENDING)])
db.pedidos.create_index([('empresa_id', ASCENDING), ('estado', ASCENDING)])

# --- clientes ---
print('clientes...')
db.clientes.create_index([('empresa_id', ASCENDING)])

# --- maquinas ---
print('maquinas...')
db.maquinas.create_index([('empresa_id', ASCENDING)])

# --- config_opciones: queries principales ---
print('config_opciones...')
db.config_opciones.create_index([('empresa_id', ASCENDING), ('categoria', ASCENDING), ('orden', ASCENDING)])
db.config_opciones.create_index([('empresa_id', ASCENDING), ('categoria', ASCENDING), ('valor', ASCENDING)])

# --- config_general: unique por empresa + clave ---
print('config_general...')
db.config_general.create_index(
    [('empresa_id', ASCENDING), ('clave', ASCENDING)],
    unique=True,
    name='config_general_empresa_clave_unique'
)

# --- usuarios ---
print('usuarios...')
db.usuarios.create_index([('empresa_id', ASCENDING)])
db.usuarios.create_index([('email', ASCENDING)], unique=True)

# --- empresas ---
print('empresas...')
db.empresas.create_index([('empresa_id', ASCENDING)], unique=True)
db.empresas.create_index([('cif', ASCENDING)], unique=True, sparse=True)

print('All indexes created.')

