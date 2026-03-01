#!/usr/bin/env python3
"""Drop the `printforgepro` database and seed demo data:
- 5 clientes in `clientes`
- 10 presupuestos in `presupuestos` referencing clientes

Usage: MONGO_URI env var optional (default mongodb://localhost:27017/)
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
import random


def get_mongo_uri():
    uri = os.environ.get('MONGO_URI')
    if uri:
        return uri
    return 'mongodb://localhost:27017/'


def make_cliente(i, empresa_id=1):
    nombres = ['Alberto', 'Beatriz', 'Carlos', 'Daniela', 'Esteban']
    apellidos = ['García', 'Martínez', 'López', 'Santos', 'Pérez']
    nombre = f"{nombres[i % len(nombres)]} {apellidos[i % len(apellidos)]}"
    email = f"{nombre.split()[0].lower()}.{i}@example.com"
    telefono = f"+34{600000000 + i}"
    return {
        'nombre': nombre,
        'email': email,
        'telefono': telefono,
        'direccion': f'Calle Demo {10 + i}',
        'ciudad': 'Madrid',
        'codigo_postal': f'280{10 + i}',
        'pais': 'ES',
        'empresa_id': empresa_id,
        'fecha_creacion': datetime.utcnow().isoformat(),
    }


def make_presupuesto(cliente_id, i, empresa_id=1):
    fecha_presupuesto = datetime.utcnow() - timedelta(days=random.randint(0, 30))
    datos = {
        'cliente': str(cliente_id),
        'vendedor': random.choice(['Oscar Sánchez', 'María Ruiz', 'Jorge Díaz']),
        'formato': random.choice(['210x297mm', '148x210mm', '100x100mm']),
        'maquina': random.choice(['Nilpeter FA', 'Flexo 800', 'Digital X200']),
        'material': random.choice(['Papel couché 250g', 'Polipropileno 80µ', 'Cartón 300g']),
        'acabado': random.choice(['Mate', 'Brillo', 'Soft-touch']),
        'tirada': random.choice([500, 1000, 2500, 5000]),
        'tintas': random.choice([1,2,3,4]),
        'troquel': random.choice(['Sí','No']),
        'observaciones': f'Presupuesto demo {i}',
        'precio_cents': random.choice([12000, 25000, 4800, 7200]),
        'moneda': 'EUR',
    }

    # Simular botones/acciones disponibles en la UI
    acciones = {
        'puede_enviar_email': True,
        'puede_aprobar': True,
        'puede_generar_pedido': True,
        'puede_imprimir_pdf': True,
    }

    return {
        'cliente_id': cliente_id,
        'empresa_id': empresa_id,
        'fecha_presupuesto': fecha_presupuesto.isoformat(),
        'aprobado': random.choice([True, False]),
        'referencia': f'PRES-{int(datetime.utcnow().timestamp()) % 100000}-{i}',
        'datos_presupuesto': datos,
        'acciones': acciones,
    }


def main():
    uri = get_mongo_uri()
    client = MongoClient(uri)
    db_name = os.environ.get('MONGO_DBNAME', 'printforgepro')

    print('Conectando a', uri)
    # Drop database to remove all data (DESTRUCTIVE)
    print(f'Dropping database "{db_name}" (this deletes ALL data)')
    client.drop_database(db_name)
    db = client[db_name]

    # Create clientes
    clientes_col = db.clientes
    presup_col = db.presupuestos

    clientes = []
    for i in range(5):
        c = make_cliente(i, empresa_id=1)
        res = clientes_col.insert_one(c)
        clientes.append(res.inserted_id)

    print(f'Inserted {len(clientes)} clientes')

    # Create 10 presupuestos distributed among clientes
    presupuestos = []
    for i in range(10):
        cliente_id = random.choice(clientes)
        p = make_presupuesto(cliente_id, i, empresa_id=1)
        res = presup_col.insert_one(p)
        presupuestos.append(res.inserted_id)

    print(f'Inserted {len(presupuestos)} presupuestos')

    # Print sample documents
    print('\nSample cliente:')
    print(clientes_col.find_one())
    print('\nSample presupuesto:')
    print(presup_col.find_one())

    # Summary counts
    print('\nSummary:')
    print(' clientes:', clientes_col.count_documents({}))
    print(' presupuestos:', presup_col.count_documents({}))


if __name__ == '__main__':
    main()
