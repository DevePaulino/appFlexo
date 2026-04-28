#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['pressmateapp']
col = db['clientes']

now = datetime.utcnow()
empresa_id = 1

clients = [
    {
        'empresa_id': empresa_id,
        'nombre': 'Cliente Alfa SL',
        'nif': 'B12345678',
        'direccion': 'Calle Falsa 1',
        'cp': '28001',
        'poblacion': 'Madrid',
        'provincia': 'Madrid',
        'pais': 'España',
        'telefono': '+34 912 345 001',
        'email': 'contacto@clientealfa.example.com',
        'contacto': 'María López',
        'telefono_contacto': '+34 600 111 001',
        'fax': '+34 912 345 002',
        'web': 'https://clientealfa.example.com',
        'notas': 'Cliente con contrato anual.',
        'created_at': now,
        'updated_at': now
    },
    {
        'empresa_id': empresa_id,
        'nombre': 'Beta Industrias SA',
        'nif': 'A87654321',
        'direccion': 'Avenida Industria 24',
        'cp': '08002',
        'poblacion': 'Barcelona',
        'provincia': 'Barcelona',
        'pais': 'España',
        'telefono': '+34 932 111 222',
        'email': 'info@betaind.example.com',
        'contacto': 'Jorge Martínez',
        'telefono_contacto': '+34 600 222 333',
        'fax': '+34 932 111 223',
        'web': 'https://betaind.example.com',
        'notas': 'Proveedor recurrente.',
        'created_at': now,
        'updated_at': now
    },
    {
        'empresa_id': empresa_id,
        'nombre': 'Gamma Packaging',
        'nif': 'B99887766',
        'direccion': 'Pol. Ind. Norte, Parcela 7',
        'cp': '41010',
        'poblacion': 'Sevilla',
        'provincia': 'Sevilla',
        'pais': 'España',
        'telefono': '+34 954 333 444',
        'email': 'sales@gammapack.example.com',
        'contacto': 'Lucía Gómez',
        'telefono_contacto': '+34 600 333 444',
        'fax': '',
        'web': 'https://gammapack.example.com',
        'notas': 'Interesados en tiradas grandes.',
        'created_at': now,
        'updated_at': now
    },
    {
        'empresa_id': empresa_id,
        'nombre': 'Delta Diseño',
        'nif': 'C11223344',
        'direccion': 'Plaza del Diseño 3',
        'cp': '46001',
        'poblacion': 'Valencia',
        'provincia': 'Valencia',
        'pais': 'España',
        'telefono': '+34 963 555 666',
        'email': 'studio@deltadiseno.example.com',
        'contacto': 'Ana Ruiz',
        'telefono_contacto': '+34 600 444 555',
        'fax': '',
        'web': 'https://deltadiseno.example.com',
        'notas': 'Agencia creativa, necesita pruebas de color.',
        'created_at': now,
        'updated_at': now
    },
    {
        'empresa_id': empresa_id,
        'nombre': 'Epsilon Retail SL',
        'nif': 'B44556677',
        'direccion': 'C/ Comercio 12',
        'cp': '29001',
        'poblacion': 'Málaga',
        'provincia': 'Málaga',
        'pais': 'España',
        'telefono': '+34 952 777 888',
        'email': 'orders@epsilonretail.example.com',
        'contacto': 'Pedro Sánchez',
        'telefono_contacto': '+34 600 555 666',
        'fax': '',
        'web': 'https://epsilonretail.example.com',
        'notas': 'Cadena de tiendas, envíos semanales.',
        'created_at': now,
        'updated_at': now
    }
]

result = col.insert_many(clients)
print('Inserted client ids:')
for oid in result.inserted_ids:
    print(str(oid))
