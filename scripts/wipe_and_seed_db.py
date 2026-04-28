#!/usr/bin/env python3
"""Backup all collections (ndjson), drop them, and insert 10 sample 'pedidos' (presupuestos).
Use with caution: destructive. Intended for local dev/testing only.
"""
import os
import json
import time
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.environ.get('DB_NAME', 'pressmateapp')
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '..', 'backups', 'agent')

os.makedirs(BACKUP_DIR, exist_ok=True)

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def doc_to_jsonable(doc):
    out = {}
    for k, v in doc.items():
        if k == '_id':
            out['id'] = str(v)
        else:
            if isinstance(v, ObjectId):
                out[k] = str(v)
            elif isinstance(v, (datetime,)):
                out[k] = v.isoformat()
            else:
                try:
                    json.dumps(v)
                    out[k] = v
                except Exception:
                    out[k] = str(v)
    return out

now_ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
summary = {'backups': [], 'dropped_collections': [], 'seeded': 0}

# Backup and drop collections (except system collections)
collections = [c for c in db.list_collection_names() if not c.startswith('system.')]
for coll in collections:
    coll_obj = db[coll]
    count = coll_obj.count_documents({})
    fname = os.path.join(BACKUP_DIR, f"backup_{coll}_{now_ts}.ndjson")
    with open(fname, 'w', encoding='utf-8') as fh:
        for doc in coll_obj.find({}):
            fh.write(json.dumps(doc_to_jsonable(doc), ensure_ascii=False) + '\n')
    summary['backups'].append({'collection': coll, 'count': count, 'file': fname})
    # Drop collection
    coll_obj.drop()
    summary['dropped_collections'].append(coll)

# Seed 10 presupuestos into 'pedidos'
pedidos = db['pedidos']
clientes = [
    {'nombre': 'Gráficas Valencia SL', 'email': 'contacto@gravalencia.es', 'telefono': '961000001'},
    {'nombre': 'Impresiones Norte SA', 'email': 'ventas@impnorte.com', 'telefono': '942000002'},
    {'nombre': 'Rotulaciones XY', 'email': 'hola@rotxy.com', 'telefono': '911000003'},
    {'nombre': 'LabelPro', 'email': 'info@labelpro.es', 'telefono': '922000004'},
    {'nombre': 'Packaging & Co', 'email': 'pack@pco.es', 'telefono': '933000005'},
]
materiales = ['Papel 170g', 'Cartón microcanal', 'PP Brillo', 'PVC 300µ', 'Kraft']
acabados = ['Barniz UV', 'Laminado mate', 'Troquelado', 'Stamping Oro', 'Sin acabado']

base_date = datetime.utcnow()
for i in range(10):
    trabajo_id = f"PRES-{int(time.time())}-{i:02d}"
    cliente = random.choice(clientes)
    fecha_pedido = base_date - timedelta(days=random.randint(0, 10))
    fecha_entrega = fecha_pedido + timedelta(days=random.randint(3, 21))
    cantidad = random.choice([100, 250, 500, 1000, 2500])
    ancho = random.choice([70, 100, 150, 200])
    alto = random.choice([50, 80, 120, 180])
    tinta = random.randint(1, 6)
    acabado = random.choice(acabados)
    datos_presupuesto = {
        'cantidad': cantidad,
        'material': random.choice(materiales),
        'ancho_mm': ancho,
        'alto_mm': alto,
        'tintas': tinta,
        'acabado': acabado,
        'observaciones': 'Pedido de prueba generado automáticamente para desarrollo.'
    }
    numero_pedido = f"{random.randint(10000,99999)}"
    doc = {
        'empresa_id': 1,
        'trabajo_id': trabajo_id,
        'numero_pedido': numero_pedido,
        'referencia': f"REF-{i:02d}-{numero_pedido}",
        'cliente': cliente,
        'fecha_pedido': fecha_pedido.isoformat(),
        'fecha_entrega': fecha_entrega.isoformat(),
        'datos_presupuesto': datos_presupuesto,
        'estado': 'diseno',
        'created_at': datetime.utcnow().isoformat()
    }
    pedidos.insert_one(doc)
    summary['seeded'] += 1

print(json.dumps(summary, indent=2, ensure_ascii=False))
