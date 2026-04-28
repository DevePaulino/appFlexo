#!/usr/bin/env python3
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']

# First, drop the pedido_orden collection to avoid duplicate _id errors
db['pedido_orden'].drop()
print('✓ Borrada colección pedido_orden')

# Copy ALL documents from trabajo_orden to pedido_orden
trabajo_orden = db['trabajo_orden'].find({})
documents = list(trabajo_orden)

if documents:
    result = db['pedido_orden'].insert_many(documents)
    print(f'✓ Copiados {len(documents)} documentos de trabajo_orden a pedido_orden')
else:
    print('No hay documentos en trabajo_orden para copiar')

# Verify
count_trabajo = db['trabajo_orden'].count_documents({})
count_pedido = db['pedido_orden'].count_documents({})
print(f'\nVerificación:')
print(f'  trabajo_orden: {count_trabajo} documentos')
print(f'  pedido_orden: {count_pedido} documentos')
