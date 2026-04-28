"""Inserta 10 pedidos de prueba en la colección `pedidos` para empresa_id=1."""
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import json

client = MongoClient('mongodb://localhost:27017')
db = client['pressmateapp']
col = db['pedidos']

# Opcional: no duplicar si ya existen muchos pedidos
existing = col.count_documents({'empresa_id': 1})
if existing >= 50:
    print('Ya hay suficientes pedidos, abortando.')
    exit(0)

maquinas = ['Flexo A', 'Flexo B', 'Offset 1', 'Impresora Rápida']
clientes = ['Cliente Demo 1', 'Cliente Demo 2', 'Cliente Demo 3', 'Cliente Demo 4']

base_fecha = datetime.utcnow()

inserted = []
for i in range(10):
    fecha_pedido = (base_fecha - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d')
    fecha_entrega = (base_fecha + timedelta(days=random.randint(1, 30))).strftime('%Y-%m-%d')
    doc = {
        'empresa_id': 1,
        'trabajo_id': None,
        'numero_pedido': f'P-{int(datetime.utcnow().timestamp())}-{i}',
        'referencia': f'Ref-{i}',
        'nombre': f'Pedido de prueba {i+1}',
        'cliente': random.choice(clientes),
        'fecha_pedido': fecha_pedido,
        'fecha_entrega': fecha_entrega,
        'maquina': random.choice(maquinas),
        'estado': 'pendiente-de-aprobacion',
        'datos_presupuesto': {},
        'created_at': datetime.utcnow().isoformat()
    }
    res = col.insert_one(doc)
    doc['_id'] = str(res.inserted_id)
    inserted.append(doc)

print('Insertados:', len(inserted))
print(json.dumps(inserted, indent=2, ensure_ascii=False))
