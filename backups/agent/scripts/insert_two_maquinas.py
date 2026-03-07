#!/usr/bin/env python3
from pymongo import MongoClient
from datetime import datetime

def main():
    c = MongoClient('mongodb://localhost:27017')
    db = c.printforgepro
    col = db.maquinas
    now = datetime.utcnow()
    maquinas = [
        {
            'nombre': 'Flexo Ancho Extra',
            'modelo': 'FX-3000',
            'tipo': 'Flexo',
            'numero_colores': 10,
            'velocidad_ppm': 100,
            'ancho_max_mm': 1600,
            'empresa_id': 1,
            'descripcion': 'Flexo para materiales de gran ancho',
            'ubicacion': 'Planta 3 - Linea D',
            'activo': True,
            'metadata': {'capacidad_hora': 15000},
            'fecha_creacion': now.isoformat(),
            'fecha_actualizacion': now.isoformat()
        },
        {
            'nombre': 'Serigrafía Precisión',
            'modelo': 'SR-220',
            'tipo': 'Serigrafía',
            'numero_colores': 3,
            'velocidad_ppm': 40,
            'ancho_max_mm': 1400,
            'empresa_id': 1,
            'descripcion': 'Equipo de serigrafía para acabados especiales',
            'ubicacion': 'Planta 2 - Linea E',
            'activo': True,
            'metadata': {'soporta_tintas_uv': True},
            'fecha_creacion': now.isoformat(),
            'fecha_actualizacion': now.isoformat()
        }
    ]
    res = col.insert_many(maquinas)
    print('Inserted count:', len(res.inserted_ids))
    for oid in res.inserted_ids:
        doc = col.find_one({'_id': oid})
        print({'id': str(oid), 'nombre': doc.get('nombre'), 'modelo': doc.get('modelo')})

if __name__ == '__main__':
    main()
