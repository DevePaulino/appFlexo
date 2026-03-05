#!/usr/bin/env python3
"""
Migración one-time: añadir empresa_id='1' a todos los docs sin él.

Ejecutar UNA sola vez en la BD existente ANTES de desplegar el código multi-tenant.
Es idempotente: si ya tiene empresa_id correcto, no lo toca.

Uso:
    python scripts/migrate_to_multitenant.py
"""
import os
from pymongo import MongoClient

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'printforgepro')

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Colecciones de contenido — todos los docs sin empresa_id se asignan a '1' (empresa legado)
content_collections = [
    'config_opciones',
    'config_general',
    'pedidos',
    'clientes',
    'maquinas',
    'presupuestos',
    'pedido_orden',
    'trabajo_orden',
    'audit_logs',
]

print('=== Migración multi-tenant ===')
print(f'BD: {DB_NAME}')
print()

for col_name in content_collections:
    col = db[col_name]
    # Docs sin campo empresa_id → '1'
    r1 = col.update_many({'empresa_id': {'$exists': False}}, {'$set': {'empresa_id': '1'}})
    # Docs con empresa_id entero 1 → '1' (por si hubiera alguno)
    r2 = col.update_many({'empresa_id': 1}, {'$set': {'empresa_id': '1'}})
    # Docs con empresa_id entero 0 → '0' (sistema)
    r3 = col.update_many({'empresa_id': 0}, {'$set': {'empresa_id': '0'}})
    total = r1.modified_count + r2.modified_count + r3.modified_count
    print(f'{col_name}: {total} docs actualizados  '
          f'(sin campo: {r1.modified_count}, int→str "1": {r2.modified_count}, int→str "0": {r3.modified_count})')

# Usuarios: root → '0', admin/resto sin empresa_id → '1'
print()
print('--- Usuarios ---')
col_u = db['usuarios']
r_root = col_u.update_many({'rol': 'root', 'empresa_id': {'$exists': False}}, {'$set': {'empresa_id': '0'}})
r_root_int = col_u.update_many({'empresa_id': 0}, {'$set': {'empresa_id': '0'}})
r_rest = col_u.update_many({'empresa_id': {'$exists': False}}, {'$set': {'empresa_id': '1'}})
r_int1 = col_u.update_many({'empresa_id': 1}, {'$set': {'empresa_id': '1'}})
print(f'root → "0": {r_root.modified_count + r_root_int.modified_count}')
print(f'resto → "1": {r_rest.modified_count + r_int1.modified_count}')

# Crear registro en empresas para la empresa por defecto si no existe
print()
print('--- Colección empresas ---')
if not db.empresas.find_one({'empresa_id': '1'}):
    admin = db.usuarios.find_one({'rol': 'administrador'})
    db.empresas.insert_one({
        'empresa_id': '1',
        'nombre': (admin or {}).get('empresa_nombre', 'Empresa 1'),
        'cif': (admin or {}).get('empresa_cif', ''),
        'admin_user_id': str((admin or {}).get('_id', '1')),
        'activa': True,
        'plan': 'creditos',
        'fecha_creacion': (admin or {}).get('fecha_creacion', ''),
    })
    print('Creado registro empresa "1"')
else:
    print('Registro empresa "1" ya existe, no se modifica')

print()
print('=== Migración completada ===')
