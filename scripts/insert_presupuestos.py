#!/usr/bin/env python3
"""Inserta 5 presupuestos de prueba usando la API local.
Ejecutar: ./.venv/bin/python scripts/insert_presupuestos.py
"""
import requests
import json

BASE = 'http://127.0.0.1:8080'

pres_created = []

for i in range(1, 6):
    t_data = {
        'nombre': f'Trabajo Test {i}',
        'cliente': f'Cliente Test {i}',
        'referencia': f'TST-{i}',
        'fecha_entrega': '2026-03-05'
    }
    try:
        rt = requests.post(f'{BASE}/api/trabajos', json=t_data, timeout=5)
        rt.raise_for_status()
        trabajo_id = rt.json().get('trabajo_id')
        print(f'Created trabajo {i}:', trabajo_id)
    except Exception as e:
        print('ERROR creando trabajo', i, e)
        break

    datos = {
        'nombre': f'Presupuesto Test {i}',
        'cliente': f'Cliente Test {i}',
        'referencia': f'PRES-{i}',
        'fecha_entrega': '2026-03-10',
        'vendedor': f'Vendedor {i}',
        'formatoAncho': '100',
        'formatoLargo': '80',
        'maquina': 'Nilpeter',
        'material': 'Papel',
        'acabado': 'Barniz',
        'tirada': '5000',
        'selectedTintas': ['C', 'M', 'Y', 'K'],
        'detalleTintaEspecial': '',
        'troquelEstadoSel': 'Nuevo',
        'troquelFormaSel': 'Rectangular',
        'troquelCoste': '200',
        'observaciones': f'Prueba automática {i}'
    }

    if i == 2:
        datos['selectedTintas'] = ['C', 'M', 'Y', 'K', 'P1']
        datos['detalleTintaEspecial'] = 'Pantone 185 C'
    if i == 4:
        datos['selectedTintas'] = ['C', 'M', 'Y', 'K', 'P1', 'P2']
        datos['detalleTintaEspecial'] = 'Oro metalizado'
    if i == 5:
        datos['selectedTintas'] = ['C', 'M', 'Y', 'K', 'P3']
        datos['detalleTintaEspecial'] = 'Pantone 485 C'

    payload = {
        'trabajo_id': trabajo_id,
        'numero_presupuesto': f'P-TEST-{i}',
        'fecha_presupuesto': '2026-02-28',
        'aprobado': False,
        'referencia': f'PRES-{i}',
        'datos_json': datos
    }

    try:
        rp = requests.post(f'{BASE}/api/presupuestos', json=payload, timeout=5)
        print(f'Presupuesto {i} ->', rp.status_code, rp.text)
        pres_created.append(rp.json())
    except Exception as e:
        print('ERROR creando presupuesto', i, e)
        break

print('\nResumen:')
print(json.dumps(pres_created, indent=2, ensure_ascii=False))
