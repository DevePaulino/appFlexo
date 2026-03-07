#!/usr/bin/env python3
"""Crea 5 trabajos vía API y luego inserta 5 presupuestos directamente en MongoDB.
Ejecutar: ./.venv/bin/python scripts/insert_pres_direct.py
"""
import requests
import json
from pymongo import MongoClient
from datetime import datetime

BASE='http://127.0.0.1:8080'
MONGO_URI='mongodb://localhost:27017'
DB_NAME='printforgepro'

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
col_pres = db['presupuestos']

created = []
for i in range(1,6):
    # crear trabajo via API
    t = requests.post(f'{BASE}/api/trabajos', json={
        'nombre': f'DB Trabajo {i}',
        'cliente': f'DB Cliente {i}',
        'referencia': f'DBT-{i}',
        'fecha_entrega': '2026-03-05'
    }, timeout=5)
    t.raise_for_status()
    trabajo_id = t.json().get('trabajo_id')
    print('Created trabajo', trabajo_id)

    datos = {
        'nombre': f'Presupuesto DB {i}',
        'cliente': f'DB Cliente {i}',
        'referencia': f'PDB-{i}',
        'fecha_entrega': '2026-03-10',
        'vendedor': f'Vendedor DB {i}',
        'formatoAncho': '100',
        'formatoLargo': '80',
        'maquina': 'Nilpeter',
        'material': 'Papel',
        'acabado': 'Barniz',
        'tirada': '5000',
        'selectedTintas': ['C','M','Y','K'],
        'detalleTintaEspecial': '',
        'troquelEstadoSel': 'Nuevo',
        'troquelFormaSel': 'Rectangular',
        'troquelCoste': '200',
        'observaciones': f'Insert directo {i}'
    }
    if i == 2:
        datos['selectedTintas'] = ['C','M','Y','K','P1']
        datos['detalleTintaEspecial'] = 'Pantone 185 C'
    if i == 4:
        datos['selectedTintas'] = ['C','M','Y','K','P1','P2']
        datos['detalleTintaEspecial'] = 'Oro metalizado'
    if i == 5:
        datos['selectedTintas'] = ['C','M','Y','K','P3']
        datos['detalleTintaEspecial'] = 'Pantone 485 C'

    doc = {
        'empresa_id': 1,
        'trabajo_id': trabajo_id,
        'numero_presupuesto': f'P-DB-{i}',
        'fecha_presupuesto': '2026-02-28',
        'aprobado': False,
        'referencia': f'PDB-{i}',
        'datos_json': datos,
        'created_at': datetime.utcnow().isoformat()
    }
    res = col_pres.insert_one(doc)
    print('Inserted presupuesto id:', str(res.inserted_id))
    created.append({'trabajo_id': trabajo_id, 'presupuesto_id': str(res.inserted_id)})

print('\nResumen:')
print(json.dumps(created, indent=2))
