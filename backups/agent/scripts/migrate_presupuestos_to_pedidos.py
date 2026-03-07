#!/usr/bin/env python3
"""Create pedidos for approved presupuestos missing pedidos.
Usage: --apply to perform changes, otherwise dry-run.
"""
import argparse
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import pymongo


def main(apply=False):
    client = MongoClient('mongodb://localhost:27017/')
    db = client['printforgepro']
    pres_col = db['presupuestos']
    pedidos_col = db['pedidos']

    query = {'aprobado': True}
    missing = []
    for p in pres_col.find(query):
        pid = p.get('pedido_id')
        trabajo_id = p.get('trabajo_id')
        found = False
        if pid:
            try:
                found = pedidos_col.find_one({'_id': ObjectId(pid)}) is not None
            except Exception:
                found = pedidos_col.find_one({'_id': pid}) is not None
        if not found and trabajo_id:
            if pedidos_col.find_one({'trabajo_id': trabajo_id}):
                found = True
        if not found:
            missing.append(p)

    print('Found', len(missing), 'approved presupuestos without pedidos')
    if not missing:
        return

    for p in missing:
        pres_id = p.get('_id')
        empresa_id = p.get('empresa_id') or 1
        trabajo_id = p.get('trabajo_id')
        datos = p.get('datos_json') or p.get('datos_presupuesto') or {}

        # Build pedido doc
        # Generate numero_pedido using counters collection to keep consistency
        try:
            counters_col = db['counters']
            seq_doc = counters_col.find_one_and_update(
                {'key': 'pedido_seq', 'empresa_id': empresa_id},
                {'$inc': {'seq': 1}}, upsert=True, return_document=pymongo.ReturnDocument.AFTER
            )
            numero_pedido = str(seq_doc.get('seq', 0))
        except Exception:
            numero_pedido = f"PED-{int(datetime.now().timestamp())}"

        doc = {
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'numero_pedido': numero_pedido,
            'referencia': p.get('referencia') or (datos.get('referencia') if isinstance(datos, dict) else None),
            'fecha_pedido': datetime.now().isoformat(),
            'datos_presupuesto': datos,
            'estado': 'Diseño',
            'fecha_finalizacion': None
        }

        print('Presupuesto', str(pres_id), '-> crear pedido preview:', {'numero_pedido': doc['numero_pedido'], 'trabajo_id': trabajo_id, 'referencia': doc['referencia']})
        if apply:
            res = pedidos_col.insert_one(doc)
            pedido_id = str(res.inserted_id)
            # update presupuesto
            try:
                pres_col.update_one({'_id': pres_id}, {'$set': {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
            except Exception:
                pres_col.update_one({'empresa_id': empresa_id, '$or': [{'_id': pres_id}, {'id': str(pres_id)}]}, {'$set': {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
            print('Inserted pedido_id', pedido_id)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Apply changes')
    args = parser.parse_args()
    main(apply=args.apply)
