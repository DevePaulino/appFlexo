import random
from datetime import datetime, timedelta
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']
pedidos_col = db['pedidos']
trabajos_col = db['trabajos']
clientes_col = db['clientes']
usuarios_col = db['usuarios']

empresa_id = 0

# Crear clientes y usuarios demo
clientes = [{
    'nombre': f'Cliente Demo {i}', 'cif': f'B12345{i:03d}', 'empresa_id': empresa_id
} for i in range(1, 6)]
usuarios = [{
    'nombre': f'Usuario Demo {i}', 'rol': 'comercial', 'empresa_id': empresa_id
} for i in range(1, 4)]
clientes_ids = [clientes_col.insert_one(c).inserted_id for c in clientes]
usuarios_ids = [usuarios_col.insert_one(u).inserted_id for u in usuarios]

# Crear trabajos demo
trabajos = []
for i in range(1, 11):
    trabajos.append({
        'nombre': f'Trabajo Demo {i}',
        'referencia': f'TRB-{i:03d}',
        'cliente': random.choice(clientes_ids),
        'empresa_id': empresa_id,
        'fecha_entrega': (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(),
        'estado': 'pendiente-de-impresion',
        'dias_retraso': random.randint(0, 5)
    })
trabajos_ids = [trabajos_col.insert_one(t).inserted_id for t in trabajos]

# Crear pedidos demo
for i in range(1, 11):
    pedido = {
        'referencia': f'REF-DEMO-{i:03d}',
        'cliente_id': str(trabajos[i-1]['cliente']),
        'trabajo_id': str(trabajos_ids[i-1]),
        'empresa_id': empresa_id,
        'fecha_creacion': datetime.now().isoformat(),
        'estado': 'pendiente-de-impresion',
        'importe': round(random.uniform(1000, 5000), 2),
        'observaciones': f'Observaciones del pedido demo {i}',
        'direccion_entrega': f'Calle Ficticia {i}, Ciudad',
        'contacto': f'contacto{i}@demo.com',
        'telefono': f'6001234{i:02d}',
        'usuario_id': str(random.choice(usuarios_ids)),
        'detalles': {
            'material': random.choice(['PP', 'PE', 'Papel', 'PVC', 'PET']),
            'acabado': random.choice(['Barniz', 'Laminado', 'Estampado', 'Troquelado']),
            'tintas_especiales': random.sample(['Blanco', 'Metalizada', 'Fluorescente'], k=1),
            'cantidad': random.randint(1000, 10000),
            'ancho': random.randint(100, 300),
            'largo': random.randint(100, 500)
        }
    }
    pedidos_col.insert_one(pedido)


print('Pedidos de prueba insertados correctamente.')

