#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime

c = MongoClient('mongodb://localhost:27017')
db = c.printforgepro
col = db.maquinas
now = datetime.utcnow()
maquinas = [
    {
        'nombre': 'Flexo Alta Velocidad',
        'modelo': 'FX-2000',
        'tipo': 'Flexo',
        'numero_colores': 8,
        'velocidad_ppm': 120,
        'ancho_max_mm': 1200,
        'empresa_id': 1,
        'descripcion': 'Máquina flexográfica de alta velocidad para tiradas grandes',
        'ubicacion': 'Planta 1 - Linea A',
        'activo': True,
        'metadata': {'capacidad_hora': 10000},
        'fecha_creacion': now.isoformat(),
        'fecha_actualizacion': now.isoformat()
    },
    {
        'nombre': 'Offset Precisión',
        'modelo': 'OF-500',
        'tipo': 'Offset',
        'numero_colores': 4,
        'velocidad_ppm': 80,
        'ancho_max_mm': 900,
        'empresa_id': 1,
        'descripcion': 'Offset para impresiones de alta calidad y acabados finos',
        'ubicacion': 'Planta 2 - Linea B',
        'activo': True,
        'metadata': {'soporta_barniz': True},
        'fecha_creacion': now.isoformat(),
        'fecha_actualizacion': now.isoformat()
    },
    {
        'nombre': 'Digital Versátil',
        'modelo': 'DG-100',
        'tipo': 'Digital',
        'numero_colores': 6,
        'velocidad_ppm': 60,
        'ancho_max_mm': 700,
        'empresa_id': 1,
        'descripcion': 'Impresora digital para tiradas cortas y personalizadas',
        'ubicacion': 'Planta 1 - Linea C',
        'activo': True,
        'metadata': {'resolucion_dpi': 1200},
        'fecha_creacion': now.isoformat(),
        'fecha_actualizacion': now.isoformat()
    }
]
res = col.insert_many(maquinas)
print('Inserted count:', len(res.inserted_ids))
for oid in res.inserted_ids:
    doc = col.find_one({'_id': oid})
    print({'id': str(oid), 'nombre': doc.get('nombre'), 'modelo': doc.get('modelo')})
