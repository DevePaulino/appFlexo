#!/usr/bin/env python3
"""Apply recommended MongoDB indexes for better query performance.
"""
import os
from pymongo import MongoClient, ASCENDING, DESCENDING


def get_mongo_uri():
    return os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')


def main():
    uri = get_mongo_uri()
    db_name = os.environ.get('MONGO_DBNAME', 'pressmateapp')
    client = MongoClient(uri)
    db = client[db_name]

    print('Applying indexes on', db_name)

    # Presupuestos
    db.presupuestos.create_index([('empresa_id', ASCENDING)])
    db.presupuestos.create_index([('cliente_id', ASCENDING)])
    db.presupuestos.create_index([('fecha_presupuesto', DESCENDING)])
    db.presupuestos.create_index([('referencia', ASCENDING)])

    # Clientes
    db.clientes.create_index([('empresa_id', ASCENDING)])

    # Pedidos
    db.pedidos.create_index([('empresa_id', ASCENDING)])
    db.pedidos.create_index([('cliente_id', ASCENDING)])
    db.pedidos.create_index([('referencia', ASCENDING)])

    # Trabajos / trabajo_orden
    db.trabajos.create_index([('empresa_id', ASCENDING)])
    if 'trabajo_orden' in db.list_collection_names():
        db.trabajo_orden.create_index([('empresa_id', ASCENDING), ('maquina', ASCENDING)])
        db.trabajo_orden.create_index([('orden', ASCENDING)])

    # Maquinas
    db.maquinas.create_index([('empresa_id', ASCENDING)])

    print('Indexes applied')


if __name__ == '__main__':
    main()
