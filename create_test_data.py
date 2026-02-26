#!/usr/bin/env python3
"""Insert test data into MongoDB: 7 clients and 10 pedidos (orders)."""
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId


def make_cliente(i, empresa_id=0):
    nombres = ['Albero', 'Beatriz', 'Carlos', 'Daniela', 'Esteban', 'Frida', 'Gabriel']
    apellidos = ['García', 'Martínez', 'López', 'Santos', 'Pérez', 'Ruiz', 'Hernández']
    nombre = f"{nombres[i % len(nombres)]} {apellidos[i % len(apellidos)]}"
    email = f"{nombre.split()[0].lower()}.{i}@example.com"
    telefono = f"+34{600000000 + i}"
    return {
        'nombre': nombre,
        'email': email,
        'telefono': telefono,
        'direccion': f'Calle Falsa {10 + i}',
        'ciudad': 'Madrid',
        'codigo_postal': f'280{10 + i}',
        'pais': 'ES',
        'empresa_id': empresa_id,
        'fecha_creacion': datetime.now().isoformat()
    }


def make_pedido(cliente_id, i, empresa_id=0):
    estados = ['nuevo', 'confirmado', 'produccion', 'enviado']
    fecha_creacion = datetime.now() - timedelta(days=random.randint(0, 20))
    fecha_entrega = fecha_creacion + timedelta(days=random.randint(3, 15))
    productos = [
        {'nombre': 'Etiqueta A', 'cantidad': random.randint(100, 1000), 'precio_cents': 50},
        {'nombre': 'Etiqueta B', 'cantidad': random.randint(50, 500), 'precio_cents': 120}
    ]
    total_cents = sum(p['cantidad'] * p['precio_cents'] for p in productos)
    return {
        'cliente_id': cliente_id,
        'empresa_id': empresa_id,
        'fecha_creacion': fecha_creacion.isoformat(),
        'fecha_entrega': fecha_entrega.isoformat(),
        'estado': random.choice(estados),
        'productos': productos,
        'total_cents': total_cents,
        'moneda': 'EUR',
        'referencia': f'PED-{int(datetime.now().timestamp())}-{i}'
    }


def main():
    client = MongoClient('mongodb://localhost:27017/')
    db = client.printforgepro
    clientes_col = db.clientes
    pedidos_col = db.pedidos

    empresa_id = 0

    # Insert 7 clientes
    clientes = []
    for i in range(7):
        c = make_cliente(i, empresa_id=empresa_id)
        res = clientes_col.insert_one(c)
        clientes.append(res.inserted_id)
    print(f'Inserted {len(clientes)} clientes:')
    for cid in clientes:
        print(' -', str(cid))

    # Insert 10 pedidos distributed among clientes
    pedidos = []
    for i in range(10):
        cliente_id = random.choice(clientes)
        p = make_pedido(cliente_id, i, empresa_id=empresa_id)
        res = pedidos_col.insert_one(p)
        pedidos.append(res.inserted_id)
    print(f'Inserted {len(pedidos)} pedidos:')
    for pid in pedidos:
        print(' -', str(pid))


if __name__ == '__main__':
    main()
