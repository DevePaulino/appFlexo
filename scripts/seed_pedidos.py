#!/usr/bin/env python3
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import random

c = MongoClient('mongodb://localhost:27017')
db = c.printforgepro
pedidos = db.pedidos

print('Conectando a MongoDB...')
print('Contando pedidos actuales:', pedidos.count_documents({}))

# Eliminar todos los pedidos
res = pedidos.delete_many({})
print('Pedidos eliminados:', res.deleted_count)

estados = ['Nuevo', 'Diseño', 'Aprobado', 'En producción', 'Impreso', 'Finalizado']
productos = ['Flyer A5', 'Tarjeta 300g', 'Folleto 4 páginas', 'Poster A2', 'Etiqueta circular']

nuevos = []
now = datetime.utcnow()
for i in range(1, 11):
    trabajo_oid = ObjectId()
    cliente_oid = ObjectId()
    fecha_creacion = now - timedelta(days=random.randint(0, 10))
    plazo = random.randint(2, 14)
    fecha_entrega = fecha_creacion + timedelta(days=plazo)
    estado = random.choice(estados)
    fecha_finalizacion = None
    if estado == 'Finalizado':
        fecha_finalizacion = fecha_creacion + timedelta(days=random.randint(1, plazo))

    pedido = {
        '_id': ObjectId(),
        'empresa_id': 1,
        'numero_pedido': f'PF-{1000 + i}',
        'cliente_id': str(cliente_oid),
        'cliente': {
            'nombre': f'Cliente {i}',
            'email': f'cliente{i}@ejemplo.test',
            'telefono': f'+34 600 00{100 + i}'
        },
        'trabajo_id': str(trabajo_oid),
        'producto': random.choice(productos),
        'cantidad': random.choice([100, 250, 500, 1000]),
        'precio_unitario': round(random.uniform(0.5, 5.0), 2),
        'precio_total': None,
        'estado': estado,
        'fecha_creacion': fecha_creacion,
        'fecha_entrega': fecha_entrega,
        'fecha_finalizacion': fecha_finalizacion,
        'notas': f'Pedido de prueba {i}',
        # campos adicionales comunes
        'metodo_entrega': random.choice(['Recogida', 'Envio']),
        'etiquetas': ['seed', 'test']
    }
    pedido['precio_total'] = round(pedido['cantidad'] * pedido['precio_unitario'], 2)
    nuevos.append(pedido)

ins = pedidos.insert_many(nuevos)
print('Insertados pedidos:', len(ins.inserted_ids))

# Verificación
count = pedidos.count_documents({})
print('Total pedidos en la colección ahora:', count)
print('\nMuestras (primeros 3):')
for doc in pedidos.find().sort('numero_pedido', 1).limit(3):
    print({
        '_id': str(doc.get('_id')),
        'numero_pedido': doc.get('numero_pedido'),
        'cliente': doc.get('cliente', {}).get('nombre'),
        'trabajo_id': doc.get('trabajo_id'),
        'estado': doc.get('estado'),
        'fecha_creacion': doc.get('fecha_creacion').isoformat() if doc.get('fecha_creacion') else None
    })

print('\nHecho.')
