#!/usr/bin/env python3
"""Rellena campos completos en presupuestos P-DB-1..5 y marca 2 como aprobados.
Ejecutar: ./.venv/bin/python scripts/prepare_presupuestos_full.py
"""
from pymongo import MongoClient
from datetime import datetime

MONGO_URI='mongodb://localhost:27017'
DB_NAME='printforgepro'

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
col = db['presupuestos']

targets = [f'P-DB-{i}' for i in range(1,6)]
updated = []

for num in targets:
    doc = col.find_one({'numero_presupuesto': num})
    if not doc:
        print('No encontrado:', num)
        continue
    datos = doc.get('datos_json') or {}
    # Rellenar campos base si faltan
    datos.setdefault('cliente', f'Cliente Completo {num}')
    datos.setdefault('razon_social', f'Razon Social {num}')
    datos.setdefault('cif', f'B{10000000 + int(num.split("-")[-1]):07d}')
    datos.setdefault('telefono', '600000000')
    datos.setdefault('email', f'cliente{num.lower().replace("-","") }@example.com')
    datos.setdefault('vendedor', 'Comercial Test')
    datos.setdefault('formatoAncho', '100')
    datos.setdefault('formatoLargo', '80')
    datos.setdefault('tirada', '5000')
    # Ensure selectedTintas present and some entries marked
    if not datos.get('selectedTintas'):
        idx = int(num.split('-')[-1])
        if idx % 5 == 2:
            datos['selectedTintas'] = ['C','M','Y','K','P1']
        elif idx % 5 == 4:
            datos['selectedTintas'] = ['C','M','Y','K','P1','P2']
        elif idx % 5 == 0:
            datos['selectedTintas'] = ['C','M','Y','K','P3']
        else:
            datos['selectedTintas'] = ['C','M','Y','K']
    # troquel y observaciones
    datos.setdefault('troquelEstadoSel', 'Nuevo')
    datos.setdefault('troquelFormaSel', 'Rectangular')
    datos.setdefault('troquelCoste', '100')
    datos.setdefault('observaciones', f'Generado y completado automáticamente {num}')

    update = {'datos_json': datos}
    # Marcar como aprobado para los dos primeros
    if num in ['P-DB-1', 'P-DB-2']:
        update['aprobado'] = True
        update['fecha_aprobacion'] = datetime.utcnow().isoformat()
    col.update_one({'_id': doc['_id']}, {'$set': update})
    updated.append({'numero_presupuesto': num, 'id': str(doc['_id'])})
    print('Actualizado:', num)

print('\nResumen actualizados:')
for u in updated:
    print(u)
